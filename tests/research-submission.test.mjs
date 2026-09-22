import test from 'node:test';
import assert from 'node:assert/strict';
import { submitResearchResponse } from '../app/research/submit-research.ts';
import { researchResponse } from '../app/research/decision-research.ts';

test('research transport omits account sessions, cookies, referrers and extra fields; never selects or retries', async () => {
  const original = { window: globalThis.window, fetch: globalThis.fetch, url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
  const calls = [];
  let status = 201, code, offline = false;
  const response = researchResponse(crypto.randomUUID(), 'custom', { intent: 'maybe', confidence: 2 }, { intent: 'maybe', confidence: 5 });
  try {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://research-test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'public-test-key';
    globalThis.window = { location: { href: 'https://decisionlab.example/analyze?id=private#access_token=private-auth-token' }, localStorage: { getItem() { throw Error('Research must not access account storage'); } } };
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), ...init });
      if (offline) throw new TypeError('Offline');
      return new Response(code ? JSON.stringify({ code, message: 'Hidden technical detail' }) : null, { status, headers: { 'Content-Type': 'application/json' } });
    };
    assert.equal(await submitResearchResponse({ ...response, user_id: 'secret', price: 500, name: 'Private', created_at: '2020', intention_changed: true }), 'completed');
    assert.equal(calls.length, 1);
    const call = calls[0], headers = new Headers(call.headers);
    assert.equal(call.method, 'POST');
    assert.equal(call.url, 'https://research-test.supabase.co/rest/v1/decision_research_responses');
    assert.equal(headers.get('Authorization'), 'Bearer public-test-key');
    assert.equal(headers.get('apikey'), 'public-test-key');
    assert.equal(headers.get('Cookie'), null);
    assert.ok(!headers.get('Prefer')?.includes('return=representation'));
    assert.equal(call.credentials, 'omit');
    assert.equal(call.referrerPolicy, 'no-referrer');
    assert.ok(call.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(call.body), response);
    status = 409; code = '23505';
    assert.equal(await submitResearchResponse(response), 'completed');
    status = 503; code = 'service_unavailable';
    assert.equal(await submitResearchResponse(response), 'unavailable');
    assert.equal(calls.length, 3, '503 must not retry');
    offline = true;
    assert.equal(await submitResearchResponse(response), 'unavailable');
    assert.equal(calls.length, 4, 'network errors must not retry');
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    assert.equal(await submitResearchResponse(response), 'unavailable');
    assert.equal(calls.length, 4);
  } finally {
    if (original.window === undefined) delete globalThis.window; else globalThis.window = original.window;
    globalThis.fetch = original.fetch;
    for (const [name, value] of [['NEXT_PUBLIC_SUPABASE_URL', original.url], ['NEXT_PUBLIC_SUPABASE_ANON_KEY', original.key]]) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
