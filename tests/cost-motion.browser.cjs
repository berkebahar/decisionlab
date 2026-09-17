/* eslint-disable @typescript-eslint/no-require-imports -- Standalone Chromium regression, no added packages. */
// Run against `npm run start -- --port 3100`; override BASE_URL or CHROME_PATH if needed.
const { writeFileSync, mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const artifacts = mkdtempSync(join(tmpdir(), 'decisionlab-motion-review-'));
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = spawn(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--disable-component-update', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${join(artifacts, 'profile')}`, '--remote-debugging-pipe'], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
let sequence = 0, buffer = '';
const pending = new Map();
const stop = () => { try { process.kill(-browser.pid, 'SIGKILL'); } catch {} };
const deadline = setTimeout(() => { console.error('TIMEOUT: cost motion browser checks (90 seconds)'); stop(); process.exitCode = 1; }, 90000);
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
    for (let tries = 0; tries < 60; tries++) { if (await evaluate(expression)) return; await wait(100); }
    throw Error(`Timed out: ${expression}`);
  };
  const screenshot = async name => {
    const { data } = await cdp('Page.captureScreenshot');
    writeFileSync(join(artifacts, `${name}.png`), Buffer.from(data, 'base64'));
  };
  await cdp('Page.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await cdp('Page.navigate', { url: process.env.BASE_URL || 'http://localhost:3100' });
  await until(`document.querySelector('.lifecycle-rail')?.dataset.motion === 'true'`);
  await evaluate(`window.rail = document.querySelector('.lifecycle-rail'); window.scene = document.querySelector('.cost-story-scene'); window.story = document.querySelector('#cost-story'); window.errors = []; window.addEventListener('error', e => errors.push(e.message));`);
  await evaluate(`document.querySelectorAll('.story-controls button')[0].click()`);
  await until(`scene.dataset.stage === '0'`);
  await wait(1200);
  const before = await evaluate(`Number(scene.style.getPropertyValue('--story-progress'))`);
  await evaluate(`document.querySelectorAll('.story-controls button')[2].click()`);
  const immediate = await evaluate(`Number(scene.style.getPropertyValue('--story-progress'))`);
  assert.ok(Math.abs(immediate - before) < .06, 'scroll input must not instantly replace visual progress');
  await until(`scene.dataset.stage === '2'`);
  await wait(1300);
  assert.equal(await evaluate(`document.querySelector('.story-current-value').textContent`), '$1,439.00');
  await evaluate(`document.querySelectorAll('.story-controls button')[3].click()`);
  await until(`scene.dataset.stage === '3'`);
  await wait(1300);
  await evaluate(`document.querySelectorAll('.story-controls button')[4].click()`);
  await until(`scene.dataset.stage === '4'`);
  assert.ok(await evaluate(`document.querySelector('.story-figure > strong').getAnimations().some(a => a.effect.getTiming().duration === 1250)`), 'final total should glide into place');
  await wait(1500);
  assert.equal(await evaluate(`document.querySelector('.story-current-value').textContent`), '$1,129.00');
  await screenshot('desktop-receipt');
  await evaluate(`rail.scrollIntoView({block:'center', behavior:'instant'})`);
  await wait(200);
  await evaluate(`document.querySelector('[aria-label="Next cost perspective"]').click()`);
  await wait(120);
  const early = await evaluate(`rail.scrollLeft`);
  assert.ok(early > 0 && early < 400, `gentle start: ${early}`);
  const halfway = await evaluate(`Number(getComputedStyle(document.querySelector('.lifecycle-progress > span')).transform.split(',')[0].slice(7))`);
  assert.ok(halfway > .2 && halfway < .4, 'progress must interpolate between stages');
  await wait(1600);
  assert.ok(Math.abs(await evaluate(`rail.scrollLeft`) - 800) < 1);
  await evaluate(`rail.focus()`);
  await cdp('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Home', code: 'Home' });
  await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Home', code: 'Home' });
  await wait(1800);
  assert.ok(await evaluate(`rail.scrollLeft < 1`), 'keyboard Home should settle at first stage');
  const rect = await evaluate(`({ y: rail.getBoundingClientRect().top + 100 })`);
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 1080, y: rect.y, button: 'left', clickCount: 1 });
  for (let i = 1; i <= 8; i++) {
    await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1080 - i * 70, y: rect.y, button: 'left', buttons: 1 });
    await wait(25);
  }
  const atRelease = await evaluate(`rail.scrollLeft`);
  assert.ok(atRelease > 100 && atRelease < 560, 'drag should have weight and lag');
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 520, y: rect.y, button: 'left', clickCount: 1 });
  await wait(150);
  assert.ok(await evaluate(`rail.scrollLeft`) > atRelease + 20, 'release must retain momentum');
  await wait(1800);
  assert.ok(Math.abs(await evaluate(`rail.scrollLeft`) - 800) < 1, 'release settles at nearest projected stage');
  await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 650, y: rect.y, deltaX: 530, deltaY: 0 });
  await wait(1800);
  assert.ok(Math.abs(await evaluate(`rail.scrollLeft`) - 1600) < 1, 'horizontal trackpad input glides to a stage');
  const scrollY = await evaluate(`window.scrollY`);
  await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 650, y: rect.y, deltaX: 0, deltaY: 250 });
  await wait(250);
  assert.ok(await evaluate(`window.scrollY`) > scrollY + 50, 'vertical wheel scroll must remain native');
  await screenshot('desktop-rail');
  console.log('PASS desktop story inertia, final number glide, arrows, keyboard, continuous progress, mouse momentum, trackpad, vertical scroll');

  await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await cdp('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await evaluate(`rail.scrollLeft = 0; rail.scrollIntoView({block:'center', behavior:'instant'})`);
  await wait(400);
  assert.equal(await evaluate(`story.dataset.scroll`), 'false');
  assert.equal(await evaluate(`scene.dataset.stage`), '4');
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'mobile must have no horizontal page overflow');
  const touchY = await evaluate(`rail.getBoundingClientRect().top + 100`);
  await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 335, y: touchY }] });
  for (let i = 1; i <= 8; i++) {
    await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 335 - i * 32, y: touchY }] });
    await wait(25);
  }
  await wait(100);
  const held = await evaluate(`rail.scrollLeft`);
  await wait(450);
  assert.ok(Math.abs(await evaluate(`rail.scrollLeft`) - held) < 2, 'touch must not settle while the finger is still down');
  await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await wait(2200);
  assert.ok(await evaluate(`rail.scrollLeft`) > 200, 'mobile native swipe should advance the rail');
  assert.ok(await evaluate(`[...document.querySelectorAll('.lifecycle-value')].every(e => e.scrollWidth <= e.clientWidth + 1)`), 'mobile numbers must fit');
  const mobileY = await evaluate(`window.scrollY`);
  await cdp('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: touchY + 140 }] });
  for (let i = 1; i <= 6; i++) {
    await cdp('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195, y: touchY + 140 - i * 25 }] });
    await wait(30);
  }
  await cdp('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await wait(500);
  assert.ok(await evaluate(`window.scrollY`) > mobileY + 40, 'vertical touch scroll must remain native');
  await evaluate(`rail.scrollIntoView({block:'center', behavior:'instant'})`);
  await screenshot('mobile-rail');
  console.log('PASS mobile native swipe, vertical touch scroll, stable receipt, number fit, no page overflow');

  await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await wait(300);
  assert.equal(await evaluate(`rail.dataset.motion`), 'false');
  assert.equal(await evaluate(`getComputedStyle(rail).display`), 'grid');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.lifecycle-navigation')).display`), 'none');
  assert.equal(await evaluate(`getComputedStyle(document.querySelector('.lifecycle-type-track')).animationName`), 'none');
  assert.equal(await evaluate(`scene.dataset.stage`), '4');
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`));
  await screenshot('reduced-motion');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
  await wait(200);
  assert.ok(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), '320px reduced-motion view must fit');
  assert.deepEqual(await evaluate(`errors`), []);
  console.log(`PASS live reduced-motion fallback and narrow viewport. Screenshots: ${artifacts}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
  clearTimeout(deadline); stop();
});
