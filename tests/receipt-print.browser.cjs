/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS hooks compile the real TSX receipt for this dependency-free browser fixture. */
/* Optional real-Chromium regression. No server, installed packages, or personal data.
 * CHROME_PATH=/path/to/chrome node tests/receipt-print.browser.cjs
 * Artifacts go to a temporary directory; the browser process group is time-bounded.
 */
const { readFileSync, writeFileSync, mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const compile = source => ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => module._compile(compile(readFileSync(filename, 'utf8')), filename);
const Receipt = require('../app/products/true-cost-receipt.tsx').default;
const { demoGroups } = require('../app/products/demo-products.ts');
const css = ['app/globals.css', 'app/polish.css', 'app/products/products.css', 'app/products/product-score.css', 'app/products/receipt-interactions.css', 'app/interaction-polish.css', 'app/decision-studio.css', 'app/editorial-workspaces.css', 'app/botanical-home.css', 'app/editorial-home.css', 'app/atmospheric-home.css', 'app/editorial-story.css', 'app/pointer-light.css'].map(path => readFileSync(resolve(path), 'utf8')).join('\n').replace('@import "tailwindcss";', '');
const helper = compile(readFileSync('app/products/print-receipt.ts', 'utf8'));
const artifacts = mkdtempSync(join(tmpdir(), 'decisionlab-print-review-'));
const chrome = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = spawn(chrome, ['--headless', '--no-sandbox', '--disable-gpu', '--disable-background-networking', '--disable-component-update', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${join(artifacts, 'profile')}`, '--remote-debugging-pipe'], { detached: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] });
let sequence = 0, buffer = '';
const pending = new Map();
const stop = () => { try { process.kill(-browser.pid, 'SIGKILL'); } catch {} };
const deadline = setTimeout(() => { console.error('TIMEOUT: receipt print browser checks (60 seconds)'); stop(); process.exitCode = 1; }, 60000);
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
  const evaluate = async expression => { const r = await cdp('Runtime.evaluate', { expression, returnByValue: true }); if (r.exceptionDetails) throw Error(JSON.stringify(r.exceptionDetails)); return r.result.value; };
  await cdp('Page.enable');
  const { frameTree } = await cdp('Page.getFrameTree');
  const base = demoGroups[0].products[0];
  const variants = [
    ['standard', base],
    ['personal-score', { ...base, scorePreferences: { version: 1, maxNetCost: 1400, maxCostPerUse: 2, maxOngoingCost: 500, minMonths: 36, minUsefulness: 4 } }],
    ['goal-and-alternative', { ...base, goal: { name: 'Travel fund', target: 3000, saved: 500, contribution: 100, frequency: 'month' }, alternative: { name: 'Refurbished option', price: 600 } }],
    ['unknown-zero-uses', { ...base, uses: 0, tax: null, shipping: null, repairs: null, maintenanceYearly: null, resale: 99999 }],
    ['long-inputs', { ...base, name: 'Long product name '.repeat(4), model: 'Model description '.repeat(6), purpose: 'A practical everyday purchase. '.repeat(16), nextBestUse: 'Keep the money for another priority. '.repeat(13) }],
  ];
  for (const theme of ['light', 'dark']) for (const [name, analysis] of variants) for (const paper of ['A4', 'Letter']) {
    await cdp('Emulation.setDeviceMetricsOverride', { width: theme === 'light' ? 1440 : 375, height: 1000, deviceScaleFactor: 1, mobile: false });
    await cdp('Emulation.setEmulatedMedia', { media: 'screen' });
    const receipt = renderToStaticMarkup(React.createElement(Receipt, { analysis }));
    const html = `<html data-theme="${theme}"><head><style>${css}</style></head><body><header class="site-header">UNRELATED NAVIGATION</header><main><div style="transform:translateY(4px);overflow:hidden"><div class="analysis-result">${receipt}<aside>UNRELATED ACTIONS</aside></div></div><article>OTHER RECEIPT</article></main><footer>UNRELATED FOOTER</footer></body></html>`;
    await cdp('Page.setDocumentContent', { frameId: frameTree.frame.id, html });
    await evaluate(`(() => { const exports = {}; ${helper}; window.printCalls = 0; window.print = () => { window.printCalls++; }; window.testPrint = exports.printReceipt; window.sourceReceipt = document.querySelector('.true-receipt'); window.sourceHTML = window.sourceReceipt.outerHTML; window.cleanupPrint = window.testPrint(window.sourceReceipt); })()`);
    assert.equal(await evaluate('window.printCalls'), 1);
    assert.equal(await evaluate("getComputedStyle(document.querySelector('.receipt-print-root')).display"), 'none', 'snapshot must not change screen layout');
    await cdp('Emulation.setEmulatedMedia', { media: 'print' });
    const status = await evaluate(`(() => {
      const root = document.querySelector('.receipt-print-root');
      const blocks = [...root.querySelectorAll('dt,dd,p,h2,strong,span,summary')];
      return { hidden: blocks.filter(e => !e.getClientRects().length || getComputedStyle(e).display === 'none').map(e => e.textContent),
        text: root.innerText, rect: root.getBoundingClientRect().toJSON(),
        unrelated: [...document.body.children].filter(e => e !== root && getComputedStyle(e).display !== 'none').length,
        buttons: root.querySelectorAll('button').length, detailsOpen: root.querySelector('details').open,
        originalUnchanged: window.sourceReceipt.outerHTML === window.sourceHTML };
    })()`);
    assert.deepEqual(status.hidden, [], 'every receipt text block must be laid out');
    assert.equal(status.unrelated, 0); assert.equal(status.buttons, 0); assert.equal(status.detailsOpen, true); assert.equal(status.originalUnchanged, true);
    assert.equal(status.rect.x, 0); assert.equal(status.rect.y, 0);
    for (const label of ['True Cost Receipt', 'Ownership expenses', 'Expected resale deduction', 'Estimated cost per use', 'Assumptions, missing inputs & formulas', 'Next-best use:']) assert.ok(status.text.includes(label), label);
    if (analysis.scorePreferences) { assert.ok(status.text.includes('User-specific product score')); assert.ok(status.text.includes('Score breakdown & method')); assert.ok(status.text.includes('Each selected factor has equal weight')); }
    if (analysis.goal) assert.ok(status.text.includes('Travel fund'));
    if (name === 'unknown-zero-uses') assert.ok(status.text.includes('Not available'));
    if (name === 'standard' && paper === 'A4') {
      const shot = await cdp('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
      writeFileSync(join(artifacts, `${theme}-print.png`), Buffer.from(shot.data, 'base64'));
    }
    const pdf = await cdp('Page.printToPDF', { paperWidth: paper === 'A4' ? 8.2677 : 8.5, paperHeight: paper === 'A4' ? 11.6929 : 11, displayHeaderFooter: false, printBackground: false, preferCSSPageSize: false });
    const bytes = Buffer.from(pdf.data, 'base64');
    const pages = (bytes.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
    writeFileSync(join(artifacts, `${theme}-${name}-${paper}.pdf`), bytes);
    assert.equal(pages, 1, `${theme}/${name}/${paper}: expected one portrait page`);
    // Restore a snapshot if printToPDF already fired afterprint, then test cancellation.
    await evaluate(`window.cleanupPrint(); window.cleanupPrint = window.testPrint(window.sourceReceipt); window.dispatchEvent(new Event('afterprint'));`);
    assert.equal(await evaluate("document.querySelector('.receipt-print-root') === null && !document.body.classList.contains('receipt-printing') && window.sourceReceipt.outerHTML === window.sourceHTML"), true);
    // A browser that throws must also restore the original page.
    assert.equal(await evaluate(`(() => { window.print = () => { throw new Error('Print unavailable'); }; try { window.testPrint(window.sourceReceipt); } catch {} return !document.querySelector('.receipt-print-root') && !document.body.classList.contains('receipt-printing'); })()`), true);
    console.log(`PASS ${theme}/${name}/${paper}: one page, all text visible, isolated receipt, clean cancellation`);
  }
  console.log(`Print PDFs and screenshots: ${artifacts}`);
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { clearTimeout(deadline); for (const { timeout } of pending.values()) clearTimeout(timeout); stop(); });
