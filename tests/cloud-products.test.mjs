import test from 'node:test';
import assert from 'node:assert/strict';
import { demoGroups } from '../app/products/demo-products.ts';
import { decodeCloudRecord } from '../app/products/cloud-records.ts';
import { CloudProductStore } from '../app/products/cloud-store.ts';
import { createCloudRepository } from '../app/products/cloud-repository.ts';

const record = { id: 'item-a', createdAt: '2026-01-01T12:00:00Z', updatedAt: '2026-01-01T12:00:00Z', analysis: demoGroups[0].products[0], status: 'considering', reason: '' };
const row = { id: record.id, user_id: 'user-a', created_at: record.createdAt, updated_at: record.updatedAt, analysis: record.analysis, status: record.status, reason: '', reconsider_on: null, scheduled_on: null, purchases: null };
const tick = () => new Promise(resolve => setImmediate(resolve));
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }

test('cloud decoding preserves all analysis fields and rejects foreign or malformed records', () => {
  assert.deepEqual(decodeCloudRecord(row, 'user-a'), record);
  assert.throws(() => decodeCloudRecord(row, 'user-b'), /verified/);
  assert.throws(() => decodeCloudRecord({ ...row, analysis: {} }, 'user-a'), /unreadable/);
  assert.throws(() => decodeCloudRecord({ ...row, status: 'bought' }, 'user-a'), /unreadable/);
  const purchase = { user_id: 'user-a', queue_item_id: record.id, purchase_estimate: record.analysis, review: null };
  assert.deepEqual(decodeCloudRecord({ ...row, status: 'bought', purchases: purchase }, 'user-a').purchaseEstimate, record.analysis);
  assert.throws(() => decodeCloudRecord({ ...row, purchases: { ...purchase, user_id: 'user-b' } }, 'user-a'), /verified/);
});

test('failed load never becomes an empty writable cloud account', async () => {
  let writes = 0;
  const store = new CloudProductStore({ load: async () => { throw Error('offline'); }, mutate: async () => { writes++; } });
  store.start(); await tick();
  assert.equal(store.getSnapshot().error, 'offline');
  await assert.rejects(store.mutate({ action: 'delete', id: record.id, payload: {} }), /offline/);
  assert.equal(writes, 0); store.stop();
});

test('failed mutations and refreshes preserve loaded records; retry can recover', async () => {
  let offline = false;
  const store = new CloudProductStore({ load: async () => { if (offline) throw Error('offline'); return [record]; }, mutate: async () => { throw Error('request not confirmed'); } });
  store.start(); await tick();
  await assert.rejects(store.mutate({ action: 'delete', id: record.id, payload: {} }), /not confirmed/);
  assert.deepEqual(store.getSnapshot().records, [record]);
  offline = true; await store.refresh();
  assert.deepEqual(store.getSnapshot().records, [record]);
  offline = false; await store.refresh();
  assert.equal(store.getSnapshot().error, ''); store.stop();
});

test('a response from a signed-out account cannot populate the next account', async () => {
  const oldLoad = deferred();
  const oldStore = new CloudProductStore({ load: () => oldLoad.promise, mutate: async () => record });
  oldStore.start(); oldStore.stop();
  const next = new CloudProductStore({ load: async () => [], mutate: async () => null });
  next.start(); oldLoad.resolve([record]); await tick();
  assert.deepEqual(next.getSnapshot().records, []);
  assert.deepEqual(oldStore.getSnapshot().records, []); next.stop();
});

test('late mutation after sign-out is not published; duplicate submissions are blocked', async () => {
  const pending = deferred();
  const store = new CloudProductStore({ load: async () => [record], mutate: () => pending.promise });
  store.start(); await tick();
  const write = store.mutate({ action: 'delete', id: record.id, payload: {} });
  await assert.rejects(store.mutate({ action: 'delete', id: record.id, payload: {} }), /progress/);
  store.stop(); pending.resolve(null);
  await assert.rejects(write, /Account changed/);
  assert.deepEqual(store.getSnapshot().records, [record]);
});

test('an older refresh cannot overwrite a confirmed write', async () => {
  const pending = deferred(); let loads = 0;
  const updated = { ...record, reason: 'saved', updatedAt: '2026-01-02T12:00:00Z' };
  const store = new CloudProductStore({ load: () => ++loads === 1 ? Promise.resolve([record]) : pending.promise, mutate: async () => updated });
  store.start(); await tick();
  const refresh = store.refresh();
  await store.mutate({ action: 'decide', id: record.id, payload: {} });
  pending.resolve([record]); await refresh;
  assert.deepEqual(store.getSnapshot().records, [updated]); store.stop();
});

test('repository rejects truncated cloud lists and includes owner in every RPC', async () => {
  let pages = 0;
  const query = { select() { return this; }, eq(key, value) { assert.equal(key, 'user_id'); assert.equal(value, 'user-a'); return this; }, order() { return this; }, async range() { return { data: pages++ ? [] : [row], count: 2, error: null }; } };
  let args;
  const repository = createCloudRepository({ from: () => query, rpc: async (_name, input) => { args = input; return { data: row, error: null }; } }, 'user-a');
  await assert.rejects(repository.load(), /incomplete/);
  assert.deepEqual(await repository.mutate({ id: record.id, action: 'edit', payload: {}, expectedUpdatedAt: record.updatedAt }), record);
  assert.equal(args.p_user_id, 'user-a'); assert.equal(args.p_expected_updated_at, record.updatedAt);
});
