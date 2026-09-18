/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Chromium regression, no added packages. */
// Run against `npm run start -- --port 3100`; override BASE_URL or CHROME_PATH if needed.
const { writeFileSync, mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const artifacts = mkdtempSync(join(tmpdir(), 'decisionlab-visual-review-'));
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = spawn(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--disable-component-update', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${join(artifacts, 'profile')}`, '--remote-debugging-pipe'], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
let sequence = 0, buffer = '';
const pending = new Map();
const stop = () => { try { process.kill(-browser.pid, 'SIGKILL'); } catch {} };
const deadline = setTimeout(() => { console.error('TIMEOUT: visual atmosphere browser checks (240 seconds)'); stop(); process.exitCode = 1; }, 240000);
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
  await cdp('Network.enable');
  await cdp('Network.setBlockedURLs', { urls: ['*vercel-scripts.com*', '*_vercel/insights/*'] });
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await navigate('/');
  assert.equal(await evaluate(`document.querySelector('.editorial-home').children.length`), 6, 'keep the simplified sections');
  assert.equal(await evaluate(`document.querySelectorAll('.cost-lifecycle').length`), 0, 'no repeated explorer');
  await click('.story-controls button:nth-child(3)');
  await until(`document.querySelector('.editorial-type').dataset.ambientActive === 'true'`);
  const animation = () => evaluate(`getComputedStyle(document.querySelector('.editorial-type-track')).animationPlayState`);
  assert.equal(await animation(), 'running');
  const before = await evaluate(`getComputedStyle(document.querySelector('.editorial-type-track')).transform`);
  await wait(200);
  assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('.editorial-type-track')).transform`), before, 'visible typography moves');
  await click('.rain-toggle');
  await until(`document.querySelector('.editorial-home').dataset.atmospherePaused === 'true'`);
  assert.equal(await animation(), 'paused', 'existing atmosphere control pauses type');
  await click('.rain-toggle');
  await until(`document.querySelector('.editorial-home').dataset.atmospherePaused === 'false'`);
  assert.equal(await animation(), 'running');
  await screenshot('homepage-moving-type');
  const { nodes } = await cdp('Accessibility.getFullAXTree');
  assert.ok(!nodes.some(node => !node.ignored && node.name?.value?.includes('BUY · OWN · USE · RESELL')), 'decorative words are not announced');
  await evaluate(`window.scrollTo({top:0, behavior:'instant'})`);
  await until(`document.querySelector('.editorial-type').dataset.ambientActive === 'false'`);
  assert.equal(await animation(), 'paused', 'offscreen typography stops');
  console.log('PASS homepage drift, pause/resume, offscreen pause and decorative accessibility');

  const heights = [];
  for (const width of [1440, 1200, 1024, 768, 390, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await navigate('/');
    await wait(350);
    heights.push({ width, height: await evaluate(`document.documentElement.scrollHeight`) });
    const initialHeight = await evaluate(`document.documentElement.scrollHeight`);
    await evaluate(`document.querySelector('.editorial-type').style.display = 'none'`);
    assert.equal(await evaluate(`document.documentElement.scrollHeight`), initialHeight, 'decorative text adds no page height');
    if (width <= 760) assert.equal(await evaluate(`getComputedStyle(document.querySelector('.editorial-type-track')).animationName`), 'none');
    await layout(`home ${width}`);
  }
  console.log('Homepage heights:', JSON.stringify(heights));

  const now = '2026-09-18T12:00:00.000Z';
  const records = ['considering', 'postponed', 'bought', 'skipped'].map((status, index) => ({
    id: `visual-${status}`, analysis: { ...storyProduct, name: `${status} camera`, uses: index === 3 ? 0 : storyProduct.uses },
    status, reason: '', createdAt: now, updatedAt: now,
    ...(status === 'bought' ? { purchaseEstimate: storyProduct } : {}),
    ...(status === 'postponed' ? { scheduledOn: '2026-09-18', reconsiderOn: '2026-10-01' } : {}),
  }));
  await evaluate(`localStorage.setItem('decisionlab.products.v1', ${JSON.stringify(JSON.stringify({ version: 1, items: records }))})`);
  for (const theme of ['light', 'dark']) for (const width of [1440, 1200, 1024, 768, 390, 320]) {
    await cdp('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 760 });
    await navigate('/analyze?demo=0');
    await evaluate(`document.documentElement.dataset.theme = '${theme}'`);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.analyze-studio')).backgroundColor`), 'rgb(20, 46, 36)', 'forest extends behind the form in either theme');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.product-form')).backgroundColor`), 'rgb(247, 244, 237)', 'form stays opaque ivory, including mobile');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.decision-studio'), '::after').pointerEvents`), 'none', 'botanical layers never intercept controls');
    assert.ok(await evaluate(`document.querySelector('.workspace-entrance .editorial-type').inert`));
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.workspace-entrance [aria-current="page"]')).color`), 'rgb(247, 244, 237)', 'breadcrumb contrast on forest');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.workspace-entrance .editorial-type-track')).animationIterationCount`), '1', 'utility atmosphere never loops');
    if (width <= 760) assert.equal(await evaluate(`getComputedStyle(document.querySelector('.workspace-entrance .editorial-type-track')).animationName`), 'none');
    assert.equal(await evaluate(`(() => { const label = document.querySelector('.product-steps button:nth-child(2)').lastChild; const range = document.createRange(); range.selectNodeContents(label); return range.getClientRects().length; })()`), 1, 'Ownership stays on one readable line');
    await input('[name="name"]', 'Visual test camera');
    assert.equal(await evaluate(`document.querySelector('.product-steps button').getAttribute('aria-current')`), 'step');
    await click('.product-steps button:nth-child(2)');
    await until(`document.querySelector('.product-form-heading h2').textContent === 'Ownership'`);
    assert.equal(await evaluate(`document.querySelector('.product-step-progress').value`), 2);
    assert.equal(await evaluate(`document.querySelector('.product-steps button').dataset.complete`), 'true');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.product-stage')).transform`), 'none', 'fields do not translate');
    await click('.product-steps button:nth-child(4)');
    await click('.product-form button[type="submit"]');
    await until(`document.querySelector('.analysis-result') !== null`);
    assert.equal(await evaluate(`document.activeElement.textContent`), 'True Cost Receipt');
    await until(`getComputedStyle(document.querySelector('.analyze-studio')).backgroundColor === 'rgb(20, 46, 36)'`);
    await layout(`${theme} ${width}px receipt`);
    await navigate('/queue');
    await evaluate(`document.documentElement.dataset.theme = '${theme}'`);
    await input('#queue-filter', 'all');
    await until(`document.querySelectorAll('.queue-card').length === 4`);
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('.queue-card')].map(e => e.dataset.status)`), ['considering', 'postponed', 'bought', 'skipped']);
    assert.deepEqual(await evaluate(`[...document.querySelectorAll('.queue-card:first-child .queue-estimates dd')].map(e => e.textContent)`), ['$1,129.00', '$2.17']);
    assert.equal(await evaluate(`document.querySelector('.queue-card:last-child .queue-estimates > div:last-child dd').textContent`), 'Not available', 'zero uses never invents a per-use cost');
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.queue-studio')).backgroundColor`), 'rgb(16, 39, 31)', 'Queue has a full forest surround');
    assert.ok(await evaluate(`[...document.querySelectorAll('.queue-card')].every(e => getComputedStyle(e).backgroundColor === 'rgb(247, 244, 237)' && getComputedStyle(e).color === 'rgb(23, 34, 30)')`), 'all saved decisions remain readable ivory surfaces');
    assert.ok(await evaluate(`document.querySelector('.queue-studio .backup-panel') !== null`), 'forest surround continues through backup');
    await layout(`${theme} ${width}px all Queue statuses`);
    await click('.queue-card .queue-receipt-actions button:first-child');
    assert.equal(await evaluate(`document.activeElement.textContent`), 'True Cost Receipt');
    await layout(`${theme} ${width}px expanded Queue receipt`);
    if ([1440, 390, 320].includes(width)) {
      await evaluate(`document.querySelector('.queue-card').scrollIntoView({block:'start', behavior:'instant'})`);
      await screenshot(`queue-${theme}-${width}`);
      await evaluate(`window.scrollTo({top:0, behavior:'instant'})`);
      await screenshot(`queue-entrance-${theme}-${width}`);
      await navigate('/analyze');
      await evaluate(`document.documentElement.dataset.theme = '${theme}'`);
      await wait(300);
      await screenshot(`analyze-${theme}-${width}`);
    }
  }
  console.log('PASS both themes at all six widths: contrast, steps, stable fields, receipt focus, Queue estimates/statuses');

  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const path of ['/', '/analyze', '/queue']) {
    await navigate(path);
    assert.equal(await evaluate(`getComputedStyle(document.querySelector('.editorial-type-track')).animationName`), 'none');
    assert.equal(await evaluate(`document.querySelector('.editorial-type').getAttribute('aria-hidden')`), 'true');
    assert.equal(await evaluate(`document.querySelectorAll('.editorial-type :is(a,button,input,[tabindex])').length`), 0);
  }
  await cdp('Emulation.setEmulatedMedia', { media: 'print' });
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.editorial-type')).display`), 'none');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.workspace-botanical')).display`), 'none');
  console.log(`PASS reduced motion and static print. Screenshots: ${artifacts}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  clearTimeout(deadline); for (const { timeout } of pending.values()) clearTimeout(timeout); stop();
});
