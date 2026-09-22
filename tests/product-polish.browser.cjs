/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Chromium regression, no added packages. */
// Run against `npm run start -- --port 3100`; override BASE_URL or CHROME_PATH if needed.
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
  const { storyProduct } = await import('../app/components/cost-story-model.ts');
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
    for (let tries = 0; tries < 100; tries++) { if (await evaluate(expression)) return; await wait(80); }
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
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await navigate('/analyze');
  await click('.product-form button[type="submit"]');
  assert.ok(await evaluate(`document.querySelector('.product-form input:invalid') !== null`));
  await input('[name="name"]', 'Browser check camera');
  await input('[name="price"]', '899');
  await click('.product-form button[type="submit"]');
  await until(`document.querySelector('.product-form-heading h2')?.textContent === 'Ownership'`);
  await input('[name="duration"]', '2');
  await input('[name="uses"]', '5');
  await click('.product-form button[type="submit"]');
  await until(`document.querySelector('.product-form-heading h2')?.textContent === 'Purpose'`);
  await click('.product-form button[type="submit"]');
  await until(`document.querySelector('.product-form-heading h2')?.textContent === 'Financial context'`);
  await click('.product-form button[type="submit"]');
  await until(`document.querySelector('[data-decision-research]') !== null`);
  await click('[data-decision-research] .button-quiet');
  await until(`document.querySelector('.analysis-result') !== null`);
  assert.equal(await evaluate(`document.activeElement.textContent`), 'True Cost Receipt', 'receipt receives focus after generation');
  assert.equal(await evaluate(`document.querySelector('.receipt-total .receipt-amount').textContent`), '$899.00');
  await layout('390px generated receipt');
  await click('.receipt-next .button-primary');
  await until(`document.querySelector('.product-status')?.textContent.includes('saved')`);
  await navigate('/queue');
  assert.ok(await evaluate(`document.querySelector('.decision-status').dataset.status === 'considering'`));
  const savedBeforeReceipt = await evaluate(`localStorage.getItem('decisionlab.products.v1')`);
  await click('.queue-card .product-actions button:first-child');
  assert.ok(await evaluate(`document.querySelector('.queue-receipt').open`), 'View Receipt opens the saved receipt');
  assert.equal(await evaluate(`document.activeElement.textContent`), 'True Cost Receipt', 'saved receipt receives focus');
  assert.equal(await evaluate(`document.querySelector('.queue-receipt .receipt-total .receipt-amount').textContent`), '$899.00');
  await evaluate(`window.printCalls = 0; window.print = () => { window.printCalls++; }; document.querySelector('.queue-receipt').open = false;`);
  await click('.queue-card .product-actions button:nth-child(2)');
  assert.equal(await evaluate(`window.printCalls`), 1, 'Print Receipt reuses the receipt print action once, even while collapsed');
  assert.equal(await evaluate(`document.querySelector('.receipt-print-root .receipt-total .receipt-amount').textContent`), '$899.00');
  await evaluate(`window.dispatchEvent(new Event('afterprint'))`);
  assert.equal(await evaluate(`document.querySelector('.receipt-print-root')`), null, 'print snapshot is cleaned up');
  assert.equal(await evaluate(`localStorage.getItem('decisionlab.products.v1')`), savedBeforeReceipt, 'viewing and printing never modify saved data');
  await click('.queue-card > details > summary');
  await input('.queue-decision select', 'bought');
  await click('.queue-decision button[type="submit"]');
  await until(`!document.querySelector('.queue-card') || document.querySelector('.decision-status').dataset.status === 'bought'`);
  await navigate('/purchases');
  await click('.purchase-card > details > summary');
  await input('.purchase-review-form input[id$="-price"]', '899');
  await input('.purchase-review-form input[id$="-uses"]', '20');
  await input('.purchase-review-form select[id^="satisfaction-"]', '4');
  await click('.purchase-review-form button[type="submit"]');
  await until(`document.querySelector('.purchase-review-summary')?.textContent.includes('4/5')`);
  assert.ok(await evaluate(`document.querySelector('.actual-comparison').textContent.includes('incomplete')`), 'unknown actual costs must remain explicit');
  await navigate('/insights');
  assert.ok(await evaluate(`document.querySelector('.insight-intro').textContent.includes('One review')`));
  console.log('PASS Analyze → Receipt → Queue → Purchases → Insights, validation, focus, unknown-cost messaging, local save');

  // Fixtures live only in this browser's temporary profile, never the user's data.
  const now = '2026-09-17T12:00:00.000Z';
  const review = { price: 899, tax: 0, shipping: 0, purchaseDate: '2025-01-01', uses: 180, maintenance: 90, accessories: 120, subscriptions: 120, repairs: 0, resale: 300, satisfaction: 4, buyAgain: 'yes', lifecycle: 'sold', reflection: 'Used often; sold after changing interests.', updatedAt: now };
  const records = [
    { id: 'polish-considering', analysis: storyProduct, status: 'considering', reason: 'Revisit after trying the camera in person.', reconsiderOn: '2026-10-01', scheduledOn: '2026-09-17', createdAt: now, updatedAt: now },
    { id: 'polish-bought', analysis: { ...storyProduct, name: 'Reviewed camera' }, purchaseEstimate: storyProduct, status: 'bought', reason: '', review, createdAt: now, updatedAt: now },
  ];
  await evaluate(`localStorage.setItem('decisionlab.products.v1', ${JSON.stringify(JSON.stringify({ version: 1, items: records }))})`);
  const cases = [
    ['/', 'home'], ['/analyze', 'analyze'], ['/analyze?id=polish-bought', 'receipt'], ['/compare?demo=0', 'compare'], ['/queue', 'queue'], ['/purchases', 'purchases'], ['/insights', 'insights'], ['/about', 'about'], ['/dashboard', 'dashboard'], ['/goallens', 'goallens'], ['/simulator', 'simulator'],
  ];
  for (const width of [1440, 1200, 1024, 768, 390, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: width === 1440 ? 1000 : 844, deviceScaleFactor: 1, mobile: width < 760 });
    for (const [path, name] of cases) {
      await navigate(path);
      if (name === 'home') {
        assert.equal(await evaluate(`document.querySelector('.editorial-further-reading')`), null);
        assert.equal(await evaluate(`document.querySelector('.cost-lifecycle')`), null, 'the repeated explainer is removed');
        assert.equal(await evaluate(`document.querySelectorAll('.true-receipt').length`), 1, 'one real receipt on the homepage');
        assert.ok(await evaluate(`document.querySelector('.story-instrument').inert && document.querySelector('.story-instrument').getAttribute('aria-hidden') === 'true'`));
        assert.ok(await evaluate(`document.querySelector('.story-caption-outgoing').inert && document.querySelector('.story-caption-outgoing').getAttribute('aria-hidden') === 'true'`));
        assert.equal(await evaluate(`document.querySelectorAll('.story-caption-outgoing h3').length`), 0, 'outgoing text is not another heading');
        const { nodes } = await cdp('Accessibility.getFullAXTree');
        const headings = nodes.filter(node => !node.ignored && node.role?.value === 'heading').map(node => node.name?.value);
        assert.equal(headings.filter(name => name === 'True Cost Receipt').length, 1, 'one accessible receipt heading');
        assert.equal(headings.filter(name => name === 'One complete estimate.').length, 0, 'illustration is excluded from the accessibility tree');
        assert.equal(await evaluate(`document.querySelectorAll('[aria-hidden="true"] button, [aria-hidden="true"] a, [aria-hidden="true"] input').length`), 0, 'no focusable duplicates in decorative content');
        await evaluate(`window.scrollTo({top:0, behavior:'instant'})`);
      }
      if (name === 'compare') {
        assert.equal(await evaluate(`document.querySelector('#compare-primary-metric').value`), 'trueCost');
        await input('#compare-primary-metric', 'resale');
        assert.ok(await evaluate(`[...document.querySelectorAll('.comparison-primary-metric')].every(e => e.dataset.metric === 'resale')`));
        await click('.comparison-details > summary');
      }
      await layout(`${width}px ${name}`);
      if (width === 390 || width === 1440) {
        await screenshot(`${name}-${width}`);
        if (name === 'home') {
          await evaluate(`document.querySelector('#receipt-preview').scrollIntoView({behavior:'instant'})`);
          await wait(450); await screenshot(`home-receipt-${width}`);
          await click('.receipt-breakdown > summary'); await layout(`${width}px expanded live receipt`);
        }
      }
      if (name === 'analyze') {
        await input('[name="name"]', 'Camera'); await input('[name="price"]', '899');
        await click('.product-form button[type="submit"]');
        await input('[name="duration"]', '2'); await input('[name="uses"]', '5');
        await click('.product-disclosure > summary');
        await layout(`${width}px ownership`);
        await click('.product-form button[type="submit"]'); await layout(`${width}px purpose`);
        await click('.product-form button[type="submit"]');
        await evaluate(`document.querySelectorAll('.product-check input').forEach(e => e.click())`);
        await layout(`${width}px optional financial fields`);
      }
    }
    console.log(`PASS ${width}px core pages, all form steps, expanded comparison, labels and touch targets`);
  }
  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 320, height: 844, deviceScaleFactor: 1, mobile: true });
  for (const path of ['/', '/analyze?id=polish-bought', '/compare?demo=0', '/purchases']) {
    await navigate(path); await evaluate(`document.documentElement.dataset.theme = 'dark'`);
    await layout(`320px dark/reduced ${path}`);
  }
  await navigate('/queue');
  await evaluate(`localStorage.setItem('decisionlab.products.v1', JSON.stringify({version:1,items:[]}))`);
  for (const path of ['/queue', '/purchases', '/insights', '/compare']) {
    await navigate(path);
    assert.ok(await evaluate(`document.querySelector('.product-empty') !== null`));
    await layout(`empty ${path}`);
  }
  await evaluate(`localStorage.setItem('decisionlab.products.v1', 'unreadable')`);
  await navigate('/insights');
  assert.ok(await evaluate(`document.querySelector('.product-error') !== null && !document.querySelector('.product-summary-grid')`), 'storage error must not look like zero records');
  assert.equal(await evaluate(`localStorage.getItem('decisionlab.products.v1')`), 'unreadable', 'invalid data must remain untouched');
  console.log('PASS reduced motion, dark theme, honest empty/error states, preserved invalid storage');
  // Hold hydration to inspect the real server fallback; no delay is added to the app.
  await cdp('Emulation.setScriptExecutionDisabled', { value: true });
  for (const width of [1440, 1200, 1024, 768, 390, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 760 });
    for (const path of ['/analyze', '/compare', '/queue', '/purchases', '/insights', '/dashboard', '/goallens', '/simulator']) {
      await cdp('Page.navigate', { url: (process.env.BASE_URL || 'http://localhost:3100') + path });
      await until(`document.readyState === 'complete' && document.querySelector('.skeleton-panel')`);
      assert.ok(await evaluate(`document.querySelector('.skeleton-caption').textContent.includes('Preparing')`));
      assert.ok(await evaluate(`document.querySelector('.skeleton-help').textContent.includes('DecisionLab needs JavaScript enabled')`));
      assert.ok(await evaluate(`document.querySelector('.skeleton-help a').getAttribute('href') === ''`));
      assert.ok(await evaluate(`document.querySelector('.workspace-fallback')?.textContent.includes('JavaScript enabled')`), 'no-script guidance remains visible');
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('.skeleton-paper')).animationName`), 'none');
      await layout(`${width}px ${path} server loading fallback`);
    }
  }
  await screenshot('loading-fallback-320');
  await cdp('Emulation.setScriptExecutionDisabled', { value: false });
  // Scripts can fail to download even when JavaScript is enabled: keep useful SSR guidance.
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['*/_next/static/*.js*'] });
  await cdp('Page.navigate', { url: (process.env.BASE_URL || 'http://localhost:3100') + '/analyze' });
  await until(`document.readyState === 'complete' && document.querySelector('.skeleton-help')`);
  assert.ok(await evaluate(`document.querySelector('.skeleton-help').textContent.includes('reload this page')`));
  await layout('320px blocked hydration');
  console.log(`PASS all six widths, no-JavaScript and blocked hydration fallbacks. Screenshots: ${artifacts}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  clearTimeout(deadline); for (const { timeout } of pending.values()) clearTimeout(timeout); stop();
});
