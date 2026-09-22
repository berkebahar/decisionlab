import test from 'node:test';
import assert from 'node:assert/strict';
import { researchResponse, researchIntents, isResearchAnswer, broadResearchCategory } from '../app/research/decision-research.ts';
import { aggregateResearch, summarizeResearch } from '../app/research/research-aggregates.ts';
import { ResearchSession } from '../app/research/research-session.ts';

const before = { intent: 'yes', confidence: 5 }, after = { intent: 'no', confidence: 2 };
const id = '12345678-1234-4234-8234-123456789abc';

test('research payload allowlists fields, derives changes, and never copies custom text', () => {
  const response = researchResponse(id, 'Private category', { ...before, email: 'private', price: 999 }, after);
  assert.deepEqual(response, { session_analysis_id: id, category: null, before_intent: 'yes', after_intent: 'no', before_confidence: 5, after_confidence: 2, intention_changed: true, confidence_change: -3 });
  assert.equal(broadResearchCategory('custom'), 'custom');
  assert.equal(broadResearchCategory({ category: 'technology', name: 'Private' }), null);
  for (const invalid of [null, {}, { intent: 'yes' }, { intent: 'Yes', confidence: 1 }, { intent: 'no', confidence: 1.5 }, { intent: 'yes', confidence: 0 }, { intent: 'yes', confidence: 6 }, { intent: 'yes', confidence: '5' }]) assert.equal(isResearchAnswer(invalid), false);
  assert.throws(() => researchResponse('persistent-visitor', null, before, after));
  assert.throws(() => researchResponse(id, null, before, {}));
});

test('all nine transitions and confidence-only changes aggregate without judging outcomes', () => {
  const rows = researchIntents.flatMap(a => researchIntents.map(b => researchResponse(crypto.randomUUID(), 'technology', { intent: a, confidence: 2 }, { intent: b, confidence: 5 })));
  const result = summarizeResearch(rows);
  assert.equal(result.totalCompletedResponses, 9);
  assert.equal(result.intentionChangedPercentage, 6 / 9 * 100);
  assert.equal(result.averageConfidenceBefore, 2);
  assert.equal(result.averageConfidenceAfter, 5);
  assert.equal(result.averageConfidenceChange, 3);
  for (const a of researchIntents) {
    assert.deepEqual(result.beforeDistribution[a], { count: 3, percentage: 3 / 9 * 100 });
    assert.deepEqual(result.afterDistribution[a], { count: 3, percentage: 3 / 9 * 100 });
    for (const b of researchIntents) assert.equal(result.transitions[a][b], 1);
  }
  const unchanged = researchResponse(id, 'home', before, { intent: 'yes', confidence: 2 });
  assert.equal(unchanged.intention_changed, false);
  assert.equal(unchanged.confidence_change, -3);
  const breakdown = aggregateResearch([...rows, unchanged, researchResponse(id, null, before, after)]);
  assert.equal(breakdown.overall.totalCompletedResponses, 11);
  assert.equal(breakdown.byCategory.find(r => r.category === 'technology').totalCompletedResponses, 9);
  assert.equal(breakdown.byCategory.find(r => r.category === 'home').averageConfidenceChange, -3);
  assert.equal(breakdown.byCategory.find(r => r.category === null).totalCompletedResponses, 1);
  const empty = summarizeResearch([]);
  assert.equal(empty.averageConfidenceBefore, null);
  assert.equal(empty.averageConfidenceAfter, null);
  assert.equal(empty.averageConfidenceChange, null);
  assert.equal(empty.intentionChangedPercentage, null);
  assert.deepEqual(empty.beforeDistribution.yes, { count: 0, percentage: 0 });
});

test('session requires both complete answers and observed receipt; duplicates submit only once', async () => {
  let calls = 0, finish;
  const session = new ResearchSession('home', () => id);
  const submit = async response => { calls++; assert.equal(response.session_analysis_id, id); return new Promise(resolve => { finish = resolve; }); };
  assert.equal(await session.completeAfter(after, submit), false);
  assert.equal(session.completeBefore({ intent: 'yes', confidence: null }), false);
  assert.equal(session.promptSeen('before'), true);
  assert.equal(session.promptSeen('before'), false);
  assert.equal(session.completeBefore(before), true);
  assert.equal(session.completeBefore(after), false);
  assert.equal(await session.completeAfter(after, submit), false);
  session.receiptSeen();
  const first = session.completeAfter(after, submit);
  assert.equal(session.getSnapshot(), 'submitting');
  assert.equal(await session.completeAfter(after, submit), false);
  assert.equal(session.skip(), false);
  finish('completed');
  assert.equal(await first, true);
  const unsubscribe = session.subscribe(() => {}); unsubscribe();
  session.receiptSeen();
  assert.equal(await session.completeAfter(after, submit), false);
  assert.equal(calls, 1);
  assert.equal(session.getSnapshot(), 'completed');
});

test('skips, edit abandonment, remounts, and failures never send or retry partial responses', async () => {
  let calls = 0;
  const submit = async () => { calls++; throw Error('Offline'); };
  for (const stage of ['before', 'awaiting_receipt', 'after']) {
    const session = new ResearchSession('custom');
    if (stage !== 'before') session.completeBefore(before);
    if (stage === 'after') session.receiptSeen();
    assert.equal(session.skip(), true);
    assert.equal(session.skip(), false);
    session.receiptSeen();
    assert.equal(session.completeBefore(before), false);
    await session.completeAfter(after, submit);
  }
  assert.equal(calls, 0);
  const failed = new ResearchSession('home');
  failed.completeBefore(before); failed.receiptSeen();
  assert.equal(await failed.completeAfter(after, submit), false);
  assert.equal(failed.getSnapshot(), 'unavailable');
  await failed.completeAfter(after, submit);
  assert.equal(calls, 1);
  const fresh = new ResearchSession('home');
  assert.notEqual(fresh.id, failed.id);
  assert.equal(fresh.getSnapshot(), 'before');
  assert.equal(await fresh.completeAfter(after, submit), false);
  assert.equal(calls, 1);
});
