# Print Receipt fix

## Cause and implementation

The old blanket `body:has(.receipt-print-target) * { display: none !important }` selector beat the lower-specificity descendant restoration rule, hiding most text even when the outer receipt appeared. The click handler also removed its print marker in `finally`, assuming `window.print()` always blocks until printing ends.

The new helper snapshots the selected receipt into a print-only direct child of body. It expands assumptions only in that copy, removes buttons and duplicate IDs, and calls the existing browser print dialog. The on-screen receipt and its expanded/collapsed state remain untouched. Cleanup happens on `afterprint`, leaving print media, errors, the next print request, or component unmount—not immediately when the print function returns.

Print CSS hides only the snapshot's body siblings. It never hides all descendants or uses body visibility tricks. The snapshot uses normal document flow, white paper, dark text, no glass/shadows/animations, compact 9pt body text and prominent totals, 10mm portrait margins, and break protection for totals and individual cost rows. The paper size follows A4/Letter selection. Unusually long content may flow to another page rather than being clipped or hidden.

## Files

- `app/products/true-cost-receipt.tsx`: connect existing Print Receipt button to helper; clean up on unmount.
- `app/products/print-receipt.ts`: isolated print snapshot and print-lifecycle cleanup.
- `app/products/products.css`: replace broken print selectors with scoped portrait-page styling; hide snapshot on screen.
- `tests/receipt-print.browser.cjs`: bounded real-Chromium regression using the actual React receipt, local CSS, and print helper. No server or packages required. Optional `CHROME_PATH` selects an already-installed Chrome executable.
- `docs/PRINT_RECEIPT_FIX.md`: this explanation and verification record.

No formulas, storage, routes, or normal page design were changed.

## Verification

All final checks passed:

- `node node_modules/typescript/bin/tsc --noEmit --incremental false` (60-second bound).
- `npm run lint` (60-second bound). An initial test-harness lint failure was corrected; final run clean.
- `node --test tests/*.test.mjs` (60-second bound): 63 passed.
- `npm run build` (120-second bound): production Webpack build passed in 8.5 seconds.
- `git diff --check`.
- `node tests/receipt-print.browser.cjs` (built-in 60-second deadline and 8-second command deadlines): 16 real-Chromium print cases passed.

Browser cases cover standard receipts, goal plus alternative, unknown costs plus zero uses, and long inputs; each in light/dark and A4/Letter. Desktop 1440px and mobile 375px screen contexts are represented. Each PDF has exactly one page. Assertions check receipt text visibility, expanded assumptions, absent controls/unrelated page content, origin positioning, unchanged source receipt, cancellation/afterprint cleanup, and cleanup when printing throws. The Letter goal/alternative PDF was also rendered to PNG and visually inspected.

These tests render the real component as a local fixture and use Chromium's print engine. The operating-system dialog, physical printer output, Safari, and Firefox still require manual verification. Browser headers/footers and custom scaling are controlled by the user's print settings. No real user data was used.

The initial sandboxed Chrome launch aborted. A separate elevated CLI probe rendered about:blank but did not exit within its limit; it was stopped after 15 seconds. Exact timed-out command:

```sh
python3 /private/tmp/decisionlab-bounded-check.py 15 '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' --headless --no-sandbox --disable-gpu --no-first-run --no-default-browser-check --user-data-dir=/private/tmp/decisionlab-print-chrome-probe --dump-dom about:blank
```

The subsequent controlled Chrome DevTools pipe test completed and terminated its temporary browser process group. No development server was started.

Manual check: Analyze a product, open Print Receipt with assumptions collapsed, select A4 or Letter portrait, confirm only the full receipt appears, cancel, and verify the original page and collapsed state remain unchanged. Repeat printing after editing an amount, then repeat in Safari/Firefox if used.
