# Product transformation handoff

DecisionLab now centers on “Before you buy it, see what it will really cost.” The approved forest, ivory, champagne, branching-D logo, themes, and creator credit remain. No packages, publishing, external financial services, or permanent servers were added. Existing uncommitted work was retained.

## Completed experience and routes

- `/`: new positioning, interactive fictional True Cost Receipt, three fictional comparison demonstrations, creator section, and links to supporting tools.
- `/analyze`: four-step product, ownership, purpose, and optional goal flow; printable receipt; explicit saving and editing.
- `/compare`: up to three manual, saved, or duplicated products; condition variants; selectable comparison factors; assumptions differences; no universal winner or currency conversion.
- `/queue`: saved receipts, editing, comparisons, reconsideration dates, statuses, reasons, and confirmed deletion. Reminders appear only on return to this browser.
- `/purchases`: actual costs/use, purchase date, satisfaction, buy-again answer, lifecycle, reflection, and comparisons with the frozen original prediction.
- `/insights`: separate analysis, consideration, purchase, and review evidence; category counts, planned reconsideration intervals, and reviewed outcomes. Original GoalLens/Simulator insights remain expandable below.
- `/about`: updated purpose, limitations, privacy, and authorship.
- `/goallens`, `/dashboard`, `/simulator`: preserved as supporting tools, including their calculations and saved records.

Demo scenarios stay in memory. Explicit adoption is required before saving an example into personal records. Unknown cost inputs remain distinguishable from entered zeroes.

## Exact formulas and assumptions

Currency inputs are validated to two decimal places and converted to integer cents before addition. All supported currencies use two decimal places. Let `M` be ownership months (`years × 12` when appropriate).

- Initial cost = purchase price + tax + shipping.
- Period maintenance = yearly maintenance × M / 12, rounded once to cents.
- Period subscriptions = monthly subscription × M, or annual subscription × M / 12, rounded once to cents.
- Ownership expenses = period maintenance + whole-period accessories/consumables + period subscriptions + whole-period repair allowance.
- Applied resale = minimum(expected resale, initial cost + ownership expenses).
- Net ownership cost = initial cost + ownership expenses − applied resale. The resale cap is disclosed and prevents a negative cost.
- Expected uses = uses per month × M, or uses per week × M × 52 / 12.
- Cost per use = net ownership cost / expected uses. Zero expected uses produces an unavailable result, never division by zero. Positive amounts below one cent display as less than one cent rather than zero.
- Alternative difference = this purchase price − alternative purchase price. It does not imply comparable ownership costs for the alternative.

Null optional costs are omitted from the arithmetic and listed as missing; they are not asserted to be zero. Accessories and repairs cover the whole selected period. There is no interest, inflation, market lookup, or durability prediction.

Optional goal context uses upfront cost only. With target T, saved S, contribution C, and initial cost I, baseline deposit periods = ceil(max(0, T−S)/C), and purchase periods = ceil(max(0, T−S+I)/C). Delay is their difference. A zero remainder needs zero deposits; a positive remainder with C=0 is unreachable. Periods follow the selected weekly/monthly contribution. Future ownership costs and resale timing are excluded, explicitly disclosed. Selecting a dashboard goal copies a USD snapshot; an inline goal does not create a dashboard record.

Actual costs sum recorded price, tax, shipping, maintenance, accessories, subscriptions, and repairs, subtracting recorded resale only when sold and flooring at zero. Missing costs make this a subtotal. Actual cost per use divides by positive recorded uses. Refunds are not modeled. Expected uses to date uses elapsed days / (365.25/12), capped at planned ownership months, with the same use-frequency conversion. Comparisons clearly distinguish lifetime predictions from actual cumulative records as of the review date. They are not claims of savings.

Monetary comparisons require the same currency; there is no FX conversion. Insights report planned reconsideration intervals, not observed waiting time, and do not add hypothetical delays or infer savings from skipped purchases.

## Storage and migration

New products use `decisionlab.products.v1`, with `{ version: 1, items: ProductRecord[] }`. Stable IDs, runtime validation, and stale-edit checks protect updates. Marking a product bought freezes its analysis as the original purchase estimate; subsequent analysis edits and reviews preserve that snapshot.

Existing keys remain unchanged: `decisionlab.saved-decisions.v1`, `decisionlab.savings-goals.v1`, `decisionlab.scenarios.v1`, and `decisionlab.theme.v1`. No startup conversion fabricates product records from old decisions. Legacy calculations and storage implementations remain unchanged.

Backup version 2 contains the legacy collections and products. Version 1 backups normalize in memory to version 2 with an empty incoming product collection. Imports validate the 1 MB limit, collection limits, IDs, dates, enums, nested objects, numeric ranges, and precision. A preview and confirmation precede a missing-ID-only merge; existing matching records and reviews are preserved. Malformed/unknown-version storage is retained and reported. Failed imports attempt rollback and report rollback failures. localStorage is not transactional: avoid simultaneous imports/edits in multiple tabs.

Records remain on this browser/device. Clearing site data can remove them. No financial values are placed in URLs or external requests. Exported backups contain personal records and should be kept private.

## Validation

Checks ran separately with process-group timeouts; none hung:

| Check | Command | Limit | Result |
| --- | --- | --- | --- |
| TypeScript | `node node_modules/typescript/bin/tsc --noEmit --incremental false` | 60s | Passed |
| ESLint | `npm run lint` | 60s | Passed |
| Full tests | `node --test tests/*.test.mjs` | 60s | 63 passed, 0 failed |
| Production | `npm run build` (`next build --webpack`) | 120s | Passed; all ten routes generated |
| Patch whitespace | `git diff --check` | — | Passed |

The existing non-failing Node module-type warning remains. Tests cover calculations, unknowns, conditions, comparisons, lifecycle changes, frozen predictions, stale edits, malformed storage, backups, rollback, and evidence-only insights. No real personal storage was used for tests.

The existing server at localhost:3000 was unreachable from the sandbox. No duplicate or permanent development server was started. Rendered checks at 375/768/1440px, both themes, keyboard/browser flows, screen readers, and print pagination remain unverified. Responsive styles and semantics received source review; this is not a visual accessibility certification.

The repository actually uses existing Next.js Geist/Geist Mono and a Georgia/system serif fallback, not Newsreader/Manrope. These were preserved; no new font dependency or unreliable download was introduced.

## Files created

| Files | Purpose |
| --- | --- |
| `app/analyze/page.tsx`, `app/compare/page.tsx`, `app/queue/page.tsx`, `app/purchases/page.tsx` | New route entry points and metadata |
| `app/products/product-model.ts` | Types, runtime validation, formatting, date helpers |
| `app/products/product-calculations.ts` | Receipt, comparison, actual-result, and insight formulas |
| `app/products/product-storage.ts`, `app/products/use-products.ts` | Versioned persistence and hydration-safe reading |
| `app/products/product-form.tsx`, `app/products/analyze-workspace.tsx` | Guided inputs and analysis/save flow |
| `app/products/true-cost-receipt.tsx`, `app/products/receipt-preview.tsx` | Accessible printable receipt and live homepage example |
| `app/products/compare-workspace.tsx` | Manual/saved/duplicate comparison flow |
| `app/products/queue-workspace.tsx` | Local reconsideration and decision lifecycle |
| `app/products/purchase-library.tsx` | Reviews and original-versus-actual comparisons |
| `app/products/product-insights.tsx` | Evidence-separated product insights |
| `app/products/demo-products.ts` | Explicitly fictional, in-memory examples |
| `app/products/products.css` | Token-based responsive product and print styling |
| `tests/products.test.mjs` | 18 product regression tests |
| `docs/PRODUCT_TRANSFORMATION.md` | This handoff |

## Files modified in this task

| Files | Change |
| --- | --- |
| `app/page.tsx`, `app/layout.tsx` | Product positioning, homepage, metadata, stylesheet import |
| `app/components/site-navigation.tsx`, `app/components/site-footer.tsx` | Primary product routes and supporting-tool links |
| `app/about/page.tsx`, `app/components/creator-note.tsx` | Audience-neutral explanation and preserved authorship |
| `app/components/goal-form.tsx`, `app/dashboard/goal-dashboard.tsx` | Audience-neutral example wording only |
| `app/insights/page.tsx` | Product insights plus preserved original insights |
| `app/data-backup.ts`, `app/components/data-backup.tsx` | Version 2 export/import and product preview counts |
| `tests/reliability.test.mjs` | Existing backup assertions updated for products/version 2 |
| `README.md`, `docs/DESIGN_SYSTEM.md` | Product, privacy, formula, migration, and design documentation |

This inventory is relative to the pre-task snapshot, not all uncommitted work. `package.json`, `tsconfig.json`, legacy calculator formulas, and legacy goal/decision/scenario storage files are unchanged by this task.

## Five-minute manual test

1. **Minute 1 — Analyze:** At 375px, enter a product with some unknown optional costs, then explicit zeroes. Try zero uses and a positive use rate. Check receipt labels, assumptions, totals, and optional goal behavior.
2. **Minute 2 — Compare:** Save to Queue, duplicate into Compare, change condition and ownership assumptions, and inspect the differences. Try mixed currencies; confirm no monetary ranking. Open a fictional example and confirm it is not silently saved.
3. **Minute 3 — Lifecycle:** Set a reconsideration date and reason, mark bought, add actual costs/uses and a review. Refresh. Edit the analysis and confirm the purchase comparison retains its original estimate.
4. **Minute 4 — Data:** Export a backup, inspect import preview, and reimport it; matching records should not duplicate. Check Insights separates records/reviews and does not invent savings. Verify legacy GoalLens, Dashboard, and Simulator data remains accessible.
5. **Minute 5 — Presentation:** Spot-check all routes at 375/768/1440px in both themes, keyboard-focus/menu behavior, receipt print preview, long names and currency figures. Check reduced motion and screen-reader labels in a longer accessibility review.

## Remaining limits

Six supported currencies, no FX conversion; all estimates are user supplied. Refund accounting, automatic spending capture, remote notifications, accounts, and syncing are outside this version. Comparisons are an unsaved workspace until a product is explicitly saved. Unknown actual costs produce subtotals, and returned-product outlays do not account for refunds. Goal context is an upfront-only snapshot. Browser, screen-reader, and print checks still need a human review in a reachable environment.
