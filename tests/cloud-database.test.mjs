import { before, after, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { demoGroups } from '../app/products/demo-products.ts';
import { decodeCloudRecord } from '../app/products/cloud-records.ts';

const db = new PGlite();
const a = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', b = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const id = '11111111-1111-4111-8111-111111111111';
const analysis = demoGroups[0].products[0];
let saved;
async function asUser(user) {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? '']);
  await db.exec(`set role ${user ? 'authenticated' : 'anon'}`);
}
async function mutate(user, action, payload = {}, version = saved?.updated_at, recordId = id) {
  const result = await db.query('select public.mutate_product($1::uuid,$2::uuid,$3,$4::jsonb,$5::timestamptz) as item', [user, recordId, action, JSON.stringify(payload), version ?? null]);
  return result.rows[0].item;
}
before(async () => {
  // Minimal Supabase roles/auth fixture; the application migration runs unmodified.
  await db.exec(`create role anon nologin; create role authenticated nologin;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users values ('${a}'), ('${b}');`);
  await db.exec(await readFile(new URL('../supabase/migrations/202609200001_cloud_products.sql', import.meta.url), 'utf8'));
});
after(async () => { await db.close(); });

test('SQL: anonymous access to both tables and save RPC is denied', async () => {
  await asUser(null);
  for (const table of ['queue_items', 'purchases']) await assert.rejects(db.query(`select * from public.${table}`), /permission denied/);
  await assert.rejects(mutate(a, 'create', { analysis }), /permission denied/);
});
test('SQL: owner creates a typed queue record with server timestamps', async () => {
  await asUser(a);
  saved = await mutate(a, 'create', { analysis }, undefined);
  const relationship = await db.query("select exists (select 1 from pg_constraint fk join pg_constraint uq on fk.conrelid = uq.conrelid and fk.conkey = uq.conkey where fk.conrelid = 'public.purchases'::regclass and fk.contype = 'f' and fk.confrelid = 'public.queue_items'::regclass and uq.contype in ('u', 'p')) as one_to_one");
  assert.equal(relationship.rows[0].one_to_one, true, 'PostgREST must detect a to-one purchase embed');
  assert.equal(saved.user_id, a);
  assert.equal(saved.purchases, null);
  assert.equal(decodeCloudRecord(saved, a).analysis.name, analysis.name);
  assert.equal((await db.query('select count(*)::int as n from queue_items')).rows[0].n, 1);
});
test('SQL: another user cannot select/update/delete or insert records as the owner', async () => {
  await asUser(b);
  assert.equal((await db.query('select * from queue_items')).rows.length, 0);
  assert.equal((await db.query('update queue_items set reason = $1 where id = $2 returning id', ['attack', id])).rows.length, 0);
  assert.equal((await db.query('delete from queue_items where id = $1 returning id', [id])).rows.length, 0);
  await assert.rejects(db.query('insert into queue_items(user_id,analysis) values($1,$2::jsonb)', [a, JSON.stringify(analysis)]), /row-level security/);
  await assert.rejects(mutate(a, 'edit', { analysis }), /Account changed/);
  await assert.rejects(mutate(b, 'edit', { analysis }), /changed or was deleted/);
});
test('SQL: failed decision rolls back the purchase insert and leaves the queue unchanged', async () => {
  await asUser(a);
  await assert.rejects(mutate(a, 'decide', { status: 'bought', reason: '', reconsiderOn: '2026-01-01', scheduledOn: '2026-02-01' }), /check constraint/);
  assert.equal((await db.query('select * from purchases')).rows.length, 0);
  assert.equal((await db.query('select status from queue_items')).rows[0].status, 'considering');
});
test('SQL: marking bought atomically freezes the original prediction', async () => {
  await asUser(a);
  const previous = saved.updated_at;
  saved = await mutate(a, 'decide', { status: 'bought', reason: 'Useful' });
  assert.deepEqual(saved.purchases.purchase_estimate, analysis);
  assert.equal(saved.purchases.user_id, a);
  assert.notEqual(saved.updated_at, previous);
  assert.ok(decodeCloudRecord(saved, a).purchaseEstimate);
  await assert.rejects(mutate(a, 'edit', { analysis }, previous), /changed or was deleted/);
});
test('SQL: purchase RLS denies foreign reads/writes and cross-owner links', async () => {
  await asUser(b);
  assert.equal((await db.query('select * from purchases')).rows.length, 0);
  assert.equal((await db.query('update purchases set review = null returning id')).rows.length, 0);
  assert.equal((await db.query('delete from purchases returning id')).rows.length, 0);
  await assert.rejects(db.query('insert into purchases(user_id,queue_item_id,purchase_estimate) values($1,$2,$3::jsonb)', [a, id, JSON.stringify(analysis)]), /row-level security/);
  // A second owned queue is needed to distinguish foreign-key checks from uniqueness.
  const secondId = '22222222-2222-4222-8222-222222222222';
  await asUser(a); await mutate(a, 'create', { analysis }, undefined, secondId);
  await asUser(b);
  await assert.rejects(db.query('insert into purchases(user_id,queue_item_id,purchase_estimate) values($1,$2,$3::jsonb)', [b, secondId, JSON.stringify(analysis)]), /foreign key/);
});
test('SQL: edits and reviews preserve the purchase prediction; ownership cannot change', async () => {
  await asUser(a);
  saved = await mutate(a, 'edit', { analysis: { ...analysis, price: 123 } });
  assert.deepEqual(saved.purchases.purchase_estimate, analysis);
  const review = { price: 99, tax: null, shipping: null, purchaseDate: '2026-01-01', uses: 20, maintenance: null, accessories: null, subscriptions: null, repairs: null, satisfaction: 4, buyAgain: 'yes', lifecycle: 'owned', resale: null, reflection: 'Useful', updatedAt: '2026-01-03T12:00:00Z' };
  saved = await mutate(a, 'review', { review });
  assert.deepEqual(decodeCloudRecord(saved, a).review, review);
  await assert.rejects(db.query('update purchases set purchase_estimate=$1::jsonb where queue_item_id=$2', [JSON.stringify({ ...analysis, price: 1 }), id]), /prediction cannot change/);
  await assert.rejects(db.query('update queue_items set user_id=$1 where id=$2', [b, id]), /identity cannot change|row-level security/);
  await assert.rejects(db.query('update purchases set user_id=$1 where queue_item_id=$2', [b, id]), /identity cannot change|row-level security/);
  saved = await mutate(a, 'decide', { status: 'postponed', reason: '' });
  assert.deepEqual(saved.purchases.review, review);
  saved = await mutate(a, 'decide', { status: 'bought', reason: '' });
  assert.deepEqual(saved.purchases.purchase_estimate, analysis);
});
test('SQL: explicit owner deletion removes its linked review only', async () => {
  await asUser(a);
  await mutate(a, 'delete');
  assert.equal((await db.query('select * from purchases')).rows.length, 0);
  assert.equal((await db.query('select * from queue_items')).rows.length, 1);
});
