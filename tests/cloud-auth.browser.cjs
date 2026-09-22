/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Chromium regression, no added packages. */
// Run Next with NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 and NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key.
// Auth/REST transport is mocked with CDP; SQL and RLS execute in embedded PostgreSQL.
const { writeFileSync, mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const artifacts = mkdtempSync(join(tmpdir(), 'decisionlab-product-review-'));
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = spawn(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--disable-component-update', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${join(artifacts, 'profile')}`, '--remote-debugging-pipe'], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
let sequence = 0, buffer = '';
const pending = new Map();
let database;
const stop = () => { try { process.kill(-browser.pid, 'SIGKILL'); } catch {} };
const deadline = setTimeout(() => { console.error('TIMEOUT: product polish browser checks (240 seconds)'); stop(); process.exitCode = 1; }, 240000);
browser.stdio[4].on('data', chunk => {
  buffer += chunk.toString();
  let split;
  while ((split = buffer.indexOf('\0')) !== -1) {
    const message = JSON.parse(buffer.slice(0, split)); buffer = buffer.slice(split + 1);
    if (pending.has(message.id)) { const { yes, no, timeout } = pending.get(message.id); pending.delete(message.id); clearTimeout(timeout); if (message.error) no(new Error(JSON.stringify(message.error))); else yes(message.result); }
  }
});
function send(method, params = {}, sessionId) {
  return new Promise((yes, no) => {
    const id = ++sequence;
    const timeout = setTimeout(() => { pending.delete(id); no(new Error(`Timed out: ${method}`)); }, 8000);
    pending.set(id, { yes, no, timeout }); browser.stdio[3].write(JSON.stringify({ id, method, params, sessionId }) + '\0');
  });
}
(async () => {
  const { PGlite } = require('@electric-sql/pglite');
  database = new PGlite();
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const cdp = (method, params) => send(method, params, sessionId);
  const evaluate = async expression => {
    const result = await cdp('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async expression => {
    for (let tries = 0; tries < 400; tries++) { if (await evaluate(`Boolean(${expression})`)) return; await wait(80); }
    throw Error(`Timed out: ${expression}`);
  };
  const navigate = async path => {
    await cdp('Page.navigate', { url: (process.env.BASE_URL || 'http://localhost:3100') + path });
    await until(`location.pathname === ${JSON.stringify(path.split('?')[0])} && document.readyState === 'complete' && document.querySelector('main h1') && !document.querySelector('.skeleton-panel')`);
    await wait(100);
  };
  const input = async (selector, value) => {
    await evaluate(`(() => { const e = document.querySelector(${JSON.stringify(selector)}); const prototype = e.tagName === 'SELECT' ? HTMLSelectElement.prototype : e.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(prototype, 'value').set.call(e, ${JSON.stringify(value)}); e.dispatchEvent(new Event(e.tagName === 'SELECT' ? 'change' : 'input', {bubbles:true})); })()`);
  };
  const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
  const screenshot = async name => {
    const { data } = await cdp('Page.captureScreenshot', { captureBeyondViewport: false });
    writeFileSync(join(artifacts, `${name}.png`), Buffer.from(data, 'base64'));
  };
  const layout = async label => {
    const state = await evaluate(`(() => {
      const visible = e => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
      return {
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
        overflowDetails: [...document.querySelectorAll('main *')].filter(visible).filter(e => e.getBoundingClientRect().right > innerWidth + 1 || e.getBoundingClientRect().left < -1).map(e => ({ tag: e.tagName, className: e.getAttribute('class'), x: e.getBoundingClientRect().x, width: e.getBoundingClientRect().width })).slice(0, 20),
        clipped: [...document.querySelectorAll('.receipt-amount, .comparison-primary-metric dd, .actual-pair dd, .queue-estimates dd, .lifecycle-value')].filter(visible).filter(e => e.scrollWidth > e.clientWidth + 2).map(e => e.textContent),
        labels: [...document.querySelectorAll('main input, main select, main textarea')].filter(visible).filter(e => !e.labels?.length && !e.getAttribute('aria-label')).map(e => e.id),
        small: [...document.querySelectorAll('main button, main summary, main input:not([type="checkbox"]), main select')].filter(visible).filter(e => e.getBoundingClientRect().height < 43).map(e => e.textContent || e.id),
      };
    })()`);
    assert.equal(state.overflow, false, `${label}: page overflow ${JSON.stringify(state.overflowDetails)}`);
    assert.deepEqual(state.clipped, [], `${label}: clipped number`);
    assert.deepEqual(state.labels, [], `${label}: unlabelled field`);
    assert.deepEqual(state.small, [], `${label}: small tap target`);
  };
  const userA = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', email: 'a@example.test', aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' };
  const userB = { ...userA, id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', email: 'b@example.test' };
  await database.exec(`create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
    insert into auth.users values ('${userA.id}'), ('${userB.id}');`);
  await database.exec(require('node:fs').readFileSync(require('node:path').join(__dirname, '../supabase/migrations/202609200001_cloud_products.sql'), 'utf8'));
  await database.exec(require('node:fs').readFileSync(require('node:path').join(__dirname, '../supabase/migrations/202609220001_decision_research_responses.sql'), 'utf8'));
  const tokens = new Map();
  function session(user) {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const token = [Buffer.from('{"alg":"HS256","typ":"JWT"}').toString('base64url'), Buffer.from(JSON.stringify({ sub: user.id, exp, aud: 'authenticated', role: 'authenticated' })).toString('base64url'), 'test-signature'].join('.');
    tokens.set(token, user);
    return { access_token: token, refresh_token: `refresh-${user.id}`, expires_in: 3600, expires_at: exp, token_type: 'bearer', user };
  }
  let failWrites = false, failLoads = false, chain = Promise.resolve();
  let failResearch = false;
  const researchRequests = [];
  async function respond(event) {
    const { request, requestId } = event;
    const url = new URL(request.url);
    const headers = [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: new URL(process.env.BASE_URL || 'http://localhost:3100').origin }, { name: 'Access-Control-Allow-Headers', value: '*' }, { name: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' }, { name: 'Access-Control-Expose-Headers', value: 'Content-Range' }];
    let status = 200, result = {};
    try {
      const payload = request.postData ? JSON.parse(request.postData) : {};
      const auth = Object.entries(request.headers).find(([key]) => key.toLowerCase() === 'authorization')?.[1];
      const user = tokens.get(auth?.replace(/^Bearer /i, ''));
      if (request.method === 'OPTIONS') status = 204;
      else if (url.pathname === '/auth/v1/signup') result = { user: userA, session: null };
      else if (url.pathname === '/auth/v1/token') {
        if (payload.password !== 'testing-only-password') { status = 400; result = { error: 'invalid_grant', error_description: 'Invalid login credentials' }; }
        else result = session(payload.email === userB.email ? userB : userA);
      } else if (url.pathname === '/auth/v1/logout') status = 204;
      else if (url.pathname === '/auth/v1/user') result = user;
      else if (url.pathname === '/rest/v1/decision_research_responses') {
        researchRequests.push({ payload, auth });
        assert.equal(auth, 'Bearer test-anon-key', 'research must never carry the account token');
        assert.equal(request.method, 'POST');
        if (failResearch) { status = 503; result = { code: 'TEST_OUTAGE' }; }
        else {
          await database.exec('reset role; set role anon');
          const keys = Object.keys(payload);
          await database.query(`insert into decision_research_responses (${keys.join(',')}) values (${keys.map((_, i) => `$${i + 1}`).join(',')})`, Object.values(payload));
          status = 204;
        }
      }
      else {
        if (!user) throw Object.assign(Error('Not authenticated'), { code: '42501' });
        await database.exec('reset role');
        await database.query("select set_config('request.jwt.claim.sub', $1, false)", [user.id]);
        await database.exec('set role authenticated');
        if (url.pathname === '/rest/v1/queue_items') {
          if (failLoads) throw Error('simulated outage');
          const rows = await database.query(`select to_jsonb(q) || jsonb_build_object('purchases', (select to_jsonb(p) from purchases p where p.queue_item_id=q.id)) as item from queue_items q order by created_at desc, id`);
          result = rows.rows.map(row => row.item);
          headers.push({ name: 'Content-Range', value: result.length ? `0-${result.length - 1}/${result.length}` : '*/0' });
        } else if (url.pathname === '/rest/v1/rpc/mutate_product') {
          if (failWrites) throw Error('simulated outage');
          const rows = await database.query('select public.mutate_product($1::uuid,$2::uuid,$3,$4::jsonb,$5::timestamptz) as item', [payload.p_user_id, payload.p_id, payload.p_action, JSON.stringify(payload.p_payload), payload.p_expected_updated_at ?? null]);
          result = rows.rows[0].item;
        } else throw Error(`Unexpected API route ${url.pathname}`);
      }
    } catch (error) { status = 400; result = { code: error.code ?? 'TEST_OUTAGE', message: error.message }; }
    await cdp('Fetch.fulfillRequest', { requestId, responseCode: status, responseHeaders: headers, body: Buffer.from(status === 204 ? '' : JSON.stringify(result)).toString('base64') });
  }
  // Extend the existing CDP message stream without changing request/response handling.
  let eventBuffer = '';
  browser.stdio[4].on('data', chunk => {
    eventBuffer += chunk.toString(); let split;
    while ((split = eventBuffer.indexOf('\0')) !== -1) {
      const event = JSON.parse(eventBuffer.slice(0, split)); eventBuffer = eventBuffer.slice(split + 1);
      if (event.method === 'Fetch.requestPaused') chain = chain.then(() => respond(event.params)).catch(error => { console.error(error); process.exitCode = 1; });
    }
  });
  await cdp('Page.enable');
  await cdp('Fetch.enable', { patterns: [{ urlPattern: 'http://127.0.0.1:54329/*' }] });
  const clickText = async text => {
    const selector = `Array.from(document.querySelectorAll('button')).find(e => e.textContent.trim() === ${JSON.stringify(text)})`;
    await until(`${selector} && !${selector}.disabled`);
    await evaluate(`${selector}.click()`);
  };
  const beginResearch = async name => {
    await navigate('/analyze');
    await until(`document.querySelector('.product-local-note')?.textContent.includes('storage')`);
    await input('[name="name"]', name); await input('[name="price"]', '100');
    await clickText('Continue to Ownership');
    await until(`document.querySelector('[name="uses"]')`);
    await input('[name="duration"]', '2'); await input('[name="uses"]', '5');
    await clickText('Continue to Purpose'); await clickText('Continue to Financial context'); await clickText('Generate True Cost Receipt');
    await until(`document.querySelector('[data-decision-research] h2')?.textContent === 'Before seeing the full analysis'`);
    assert.equal(await evaluate(`document.querySelector('.true-receipt')`), null, 'no result leaks before answering or skipping');
    assert.equal(await evaluate(`document.querySelectorAll('[data-decision-research] input:checked').length`), 0, 'no default answers');
  };
  const answer = async (intent, confidence) => {
    await click(`[data-decision-research] input[value="${intent}"]`);
    await click(`[data-decision-research] input[value="${confidence}"]`);
  };
  const reveal = async () => {
    await answer('yes', 5); await clickText('Continue');
    await until(`document.querySelector('.true-receipt')`);
    assert.equal(await evaluate(`document.activeElement.textContent`), 'True Cost Receipt');
    assert.equal(await evaluate(`document.querySelector('[data-decision-research]')`), null, 'after prompt waits for visible totals');
    await evaluate(`document.querySelector('.receipt-results').scrollIntoView({block:'center', behavior:'instant'})`);
    await until(`document.querySelector('[data-decision-research] h2')?.textContent === 'After seeing the True Cost analysis'`);
    assert.equal(await evaluate(`document.querySelectorAll('[data-decision-research] input:checked').length`), 0, 'after answers are independent');
  };
  const submitResearch = async () => {
    await answer('no', 1);
    await evaluate(`(() => { const button = document.querySelector('[data-decision-research] button[type="submit"]'); button.click(); button.click(); })()`);
    await until(`document.querySelector('[data-decision-research][role="status"]')?.textContent.includes('has been saved')`);
  };
  const createReceipt = async name => {
    await beginResearch(name); await reveal();
    const count = researchRequests.length;
    await submitResearch();
    assert.equal(researchRequests.length, count + 1, 'double click sends one completed pair');
    await clickText('Save receipt to queue');
    await until(`document.querySelector('.product-status')?.textContent.includes('Receipt saved')`);
  };
  const signIn = async email => {
    await navigate('/account'); await until(`document.querySelector('#account-email')`);
    await input('#account-email', email); await input('#account-password', 'testing-only-password'); await clickText('Sign in');
    await until(`document.querySelector('.account-email')?.textContent === ${JSON.stringify(email)}`);
  };
  const signOut = async () => { await navigate('/account'); await clickText('Sign out'); await until(`document.querySelector('#account-email')`); };
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await createReceipt('Local record');
  const localBefore = await evaluate(`localStorage.getItem('decisionlab.products.v1')`);
  await navigate('/account'); await until(`document.querySelector('#account-email')`);
  await clickText('Create an account');
  await input('#account-email', userA.email); await input('#account-password', 'testing-only-password'); await clickText('Sign up');
  await until(`document.querySelector('.product-status')?.textContent.includes('confirmation link')`);
  await clickText('Already have an account? Sign in');
  await input('#account-password', 'wrong-password'); await clickText('Sign in');
  await until(`document.querySelector('.product-status')?.textContent.includes('Could not sign in')`);
  await signIn(userA.email);
  for (const width of [320, 390, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await layout(`Account ${width}px`);
    if (width === 390) await screenshot("account-cloud-mobile");
  }
  await navigate('/queue'); await until(`document.querySelector('.product-empty')`);
  assert.equal(await evaluate(`document.querySelectorAll('.queue-card').length`), 0, 'local record is not migrated');
  await createReceipt('Cloud record A');
  await navigate('/queue'); await until(`document.querySelector('.queue-card')`);
  assert.equal(await evaluate(`document.querySelector('.queue-card h2').textContent`), 'Cloud record A');
  await click('.queue-receipt-actions button');
  assert.equal(await evaluate(`document.querySelector('.queue-receipt').open`), true, 'cloud receipt still opens');
  await click('.queue-edit summary');
  await input('.queue-decision select', 'bought'); await clickText('Save decision');
  await until(`document.querySelector('.queue-card') === null`); // leaves active queue filter
  await navigate('/purchases'); await until(`document.querySelector('.purchase-card')`);
  await click('.purchase-card details summary');
  await input('.purchase-review-form input[id$="-price"]', '90');
  await input('.purchase-review-form input[id$="-uses"]', '20');
  await clickText('Save purchase review');
  await until(`document.querySelector('.product-status')?.textContent.includes('Review saved')`);
  await navigate('/purchases'); await until(`document.querySelector('.purchase-card')`);
  await click('.purchase-card details summary');
  assert.equal(await evaluate(`document.querySelector('.purchase-review-form input[id$="-price"]').value`), '90');
  failWrites = true;
  await input('.purchase-review-form input[id$="-price"]', '85'); await clickText('Save purchase review');
  await until(`document.querySelector('.product-error')?.textContent.includes('could not confirm')`);
  assert.equal(await evaluate(`document.querySelector('.purchase-review-form input[id$="-price"]').value`), '85', 'failed save preserves draft');
  failWrites = false; await clickText('Refresh cloud records');
  await until(`document.querySelector('.product-error') === null`); await clickText('Save purchase review');
  await until(`document.querySelector('.product-status')?.textContent.includes('Review saved')`);
  assert.equal(await evaluate(`localStorage.getItem('decisionlab.products.v1')`), localBefore);
  await signOut(); await navigate('/queue'); await until(`document.querySelector('.queue-card')`);
  assert.equal(await evaluate(`document.querySelector('.queue-card h2').textContent`), 'Local record');
  await signIn(userB.email); await navigate('/queue'); await until(`document.querySelector('.product-empty')`);
  assert.equal(await evaluate(`document.querySelectorAll('.queue-card').length`), 0, 'account B cannot see A');
  await createReceipt('Cloud record B');
  await signOut(); await signIn(userA.email);
  failLoads = true; await navigate('/queue');
  await until(`document.querySelector('.product-error')`);
  assert.equal(await evaluate(`document.querySelectorAll('.queue-card').length`), 0, 'outage does not fall back to local records');
  failLoads = false; await clickText('Refresh cloud records');
  await until(`document.querySelector('.product-error') === null`);
  await input('#queue-filter', 'all'); await until(`document.querySelector('.queue-card')`);
  assert.equal(await evaluate(`document.querySelector('.queue-card h2').textContent`), 'Cloud record A');
  await evaluate(`window.confirm = () => true`); await click('.delete-button');
  await until(`document.querySelectorAll('.queue-card').length === 0`);
  await navigate('/purchases'); await until(`document.querySelector('.product-empty')`);
  assert.equal(await evaluate(`localStorage.getItem('decisionlab.products.v1')`), localBefore);
  console.log('PASS signup confirmation UI, invalid/valid signin, local/cloud separation, cloud Queue create/status/receipt/delete, Purchases review/reload/retry, signout, account isolation, cloud outage and Account mobile layout (mock Auth transport, real PostgreSQL/RLS).');

  await signOut();
  const pairedCount = researchRequests.length;
  assert.equal(pairedCount, 3, 'anonymous and both signed-in accounts completed research');
  for (const width of [320, 390, 1440]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await beginResearch('Optional research');
    await evaluate(`document.querySelector('[data-decision-research]').scrollIntoView({block:'center', behavior:'instant'})`);
    assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth + 1`), false);
    assert.ok(await evaluate(`[...document.querySelectorAll('[data-decision-research] label span')].every(e => e.getBoundingClientRect().height >= 44)`));
    await screenshot(`research-before-${width}`);
    await reveal();
    await evaluate(`document.querySelector('[data-decision-research]').scrollIntoView({block:'center', behavior:'instant'})`);
    assert.equal(await evaluate(`document.documentElement.scrollWidth > innerWidth + 1`), false);
    await screenshot(`research-after-${width}`);
    await clickText('Skip');
    assert.equal(await evaluate(`document.querySelector('[data-decision-research]')`), null);
  }
  await beginResearch('Skipped before'); await clickText('Skip');
  await until(`document.querySelector('.true-receipt')`);
  await evaluate(`document.querySelector('.receipt-results').scrollIntoView({block:'center', behavior:'instant'})`);
  await wait(150);
  assert.equal(await evaluate(`document.querySelector('[data-decision-research]')`), null);
  await beginResearch('Partial before'); await click('[data-decision-research] input[value="yes"]'); await clickText('Continue');
  await until(`document.querySelector('.true-receipt')`);
  assert.equal(await evaluate(`document.querySelector('[data-decision-research]')`), null);
  await beginResearch('Refreshed before'); await navigate('/analyze');
  assert.equal(await evaluate(`document.querySelector('[data-decision-research]')`), null);
  await beginResearch('Refreshed after'); await reveal(); await navigate('/analyze');
  assert.equal(await evaluate(`document.querySelector('[data-decision-research]')`), null);
  await beginResearch('Edited assumptions'); await reveal(); await clickText('Edit assumptions');
  await click('.product-steps button:nth-child(4)'); await clickText('Generate True Cost Receipt');
  await until(`document.querySelector('.true-receipt')`);
  assert.equal(await evaluate(`document.querySelector('[data-decision-research]')`), null);
  assert.equal(researchRequests.length, pairedCount, 'skipped, refreshed and edited pairs never submit');
  failResearch = true;
  await beginResearch('Research unavailable'); await reveal(); await answer('maybe', 3); await clickText('Submit response');
  await until(`document.querySelector('[data-decision-research][role="status"]')?.textContent.includes('couldn’t be saved')`);
  assert.equal(await evaluate(`document.querySelector('.receipt-total .receipt-amount').textContent`), '$100.00');
  await clickText('Save receipt to queue');
  await until(`document.querySelector('.product-status')?.textContent.includes('Receipt saved')`);
  assert.equal(researchRequests.length, pairedCount + 1, 'unavailable research does not retry');
  failResearch = false;
  await beginResearch('Navigation test'); await reveal(); await submitResearch();
  const afterNavigation = researchRequests.length;
  await click('.site-header a[href="/queue"]');
  await until(`location.pathname === '/queue'`);
  await evaluate('history.back()'); await until(`location.pathname === '/analyze'`); await wait(200);
  await evaluate('history.forward()'); await until(`location.pathname === '/queue'`); await wait(200);
  assert.equal(researchRequests.length, afterNavigation, 'back/forward navigation never resubmits');
  const browserStorage = await evaluate(`JSON.stringify({ local: {...localStorage}, session: {...sessionStorage} })`);
  assert.ok(!browserStorage.includes('decisionlab.research.volatile'), 'research client persists no auth storage');
  for (const { payload } of researchRequests) assert.ok(!browserStorage.includes(payload.session_analysis_id), 'research UUID never enters either storage API');
  await database.exec('reset role');
  const researchRows = (await database.query('select * from decision_research_responses')).rows;
  assert.equal(researchRows.length, pairedCount + 1);
  assert.equal(new Set(researchRows.map(row => row.session_analysis_id)).size, researchRows.length);
  assert.ok(researchRows.every(row => row.intention_changed && row.confidence_change === -4));
  assert.ok(!JSON.stringify(researchRows).includes('Local record'));
  console.log(`PASS research anonymous/authenticated pairs, pre-reveal boundary, observed totals, independent scales, duplicate clicks, skip/partial/refresh/edit/navigation, outage isolation, 320/390/1440px cards. Screenshots: ${artifacts}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  clearTimeout(deadline); for (const { timeout } of pending.values()) clearTimeout(timeout); stop();
  await database?.close();
});
