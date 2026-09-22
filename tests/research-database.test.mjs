import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { researchResponse } from '../app/research/decision-research.ts';

const db = new PGlite();
const valid = () => researchResponse(crypto.randomUUID(), 'technology', { intent: 'yes', confidence: 5 }, { intent: 'no', confidence: 1 });
async function role(name) { await db.exec(`reset role; set role ${name}`); }
function insert(row, suffix = '') {
  const keys = Object.keys(row);
  return db.query(`insert into public.decision_research_responses (${keys.join(',')}) values (${keys.map((_, i) => `$${i + 1}`).join(',')}) ${suffix}`, Object.values(row));
}
before(async () => {
  await db.exec(`create role anon nologin; create role authenticated nologin;
    grant usage on schema public to anon, authenticated;
    alter default privileges in schema public grant all on tables to anon, authenticated;`);
  await db.exec(await readFile(new URL('../supabase/migrations/202609220001_decision_research_responses.sql', import.meta.url), 'utf8'));
});
after(() => db.close());

test('SQL: anonymous and authenticated can insert but cannot read, return, update, delete or truncate', async () => {
  for (const name of ['anon', 'authenticated']) {
    await role(name);
    await insert(valid());
    await assert.rejects(insert(valid(), 'returning *'), /permission denied/);
    for (const sql of ['select * from decision_research_responses', "update decision_research_responses set category = 'home'", 'delete from decision_research_responses', 'truncate decision_research_responses']) await assert.rejects(db.exec(sql), /permission denied/);
    await assert.rejects(insert({ ...valid(), created_at: '2020-01-01' }), /permission denied/);
    await assert.rejects(insert({ ...valid(), id: crypto.randomUUID() }), /permission denied/);
  }
  await db.exec('reset role');
  assert.equal((await db.query("select relrowsecurity from pg_class where oid = 'public.decision_research_responses'::regclass")).rows[0].relrowsecurity, true);
  const rows = (await db.query('select * from decision_research_responses')).rows;
  assert.equal(rows.length, 2);
  assert.ok(rows.every(row => row.id && row.created_at));
  const columns = (await db.query("select column_name from information_schema.columns where table_name = 'decision_research_responses' order by ordinal_position")).rows.map(row => row.column_name);
  assert.deepEqual(columns, ['id', 'created_at', 'session_analysis_id', 'category', 'before_intent', 'after_intent', 'before_confidence', 'after_confidence', 'intention_changed', 'confidence_change']);
});

test('SQL: incomplete, out-of-range, free-text and inconsistent derived values are rejected', async () => {
  for (const name of ['anon', 'authenticated']) {
    await role(name);
    for (const patch of [
      { before_intent: 'Yes' }, { after_intent: 'unsure' }, { before_intent: null }, { after_confidence: null },
      { before_confidence: 0 }, { before_confidence: 6 }, { after_confidence: 0 }, { after_confidence: 6 },
      { confidence_change: -5 }, { confidence_change: 5 }, { intention_changed: false }, { confidence_change: 0 },
      { category: 'Private custom category' }, { session_analysis_id: null },
      { session_analysis_id: '00000000-0000-0000-0000-000000000000' },
    ]) await assert.rejects(insert({ ...valid(), ...patch }), /constraint/);
    const partial = valid(); delete partial.after_intent;
    await assert.rejects(insert(partial), /not-null constraint/);
    await insert({ ...valid(), category: null });
    await insert(researchResponse(crypto.randomUUID(), 'custom', { intent: 'maybe', confidence: 1 }, { intent: 'maybe', confidence: 5 }));
  }
});

test('SQL: repeated requests with the same analysis UUID can create only one row across roles', async () => {
  const row = valid();
  await role('anon'); await insert(row);
  await assert.rejects(insert(row), /unique constraint/);
  await role('authenticated'); await assert.rejects(insert({ ...row, category: 'home' }), /unique constraint/);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int as n from decision_research_responses where session_analysis_id = $1', [row.session_analysis_id])).rows[0].n, 1);
});
