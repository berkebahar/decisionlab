# Production polish review

## Homepage

The homepage now follows: Hero → hidden-cost reveal → interactive True Cost Receipt → Compare → Queue → post-purchase reflection → final CTA.

- Removed the repeated five-panel cost lifecycle explorer from the homepage. Its unused component remains available; no routes were removed.
- Changed the hero's second calculation into a short price teaser linking to the main hidden-cost reveal.
- Removed the duplicate receipt breakdown and receipt heading from the reveal's final illustration. The following interactive receipt is the full receipt.
- Reduced the comparison facts, repeated explanations, extra-example disclosure, Queue step descriptions, and supporting-section spacing.
- Retained the hero atmosphere, scroll easing, number transitions, receipt interaction, and reduced-motion behavior. Existing stage controls are also available on smaller screens so the single reveal stays interactive there.

Measured full document height in production Chromium, with a 900px-high viewport and disclosures initially closed:

| Width | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| 1440px | 8,334px | 7,088px | 15.0% |
| 1200px | 8,168px | 6,961px | 14.8% |
| 1024px | 8,001px | 6,815px | 14.8% |
| 768px | 6,799px | 5,422px | 20.3% |
| 390px | 8,432px | 7,006px | 16.9% |
| 320px | 8,495px | 7,055px | 17.0% |

## Accessibility and responsive behavior

- Marked the decorative cost illustration and outgoing caption layer `aria-hidden` and `inert`.
- Replaced the outgoing duplicate heading with styled paragraph text; the current stage retains its real heading and a screen-reader-accessible value.
- Retained the existing explicit stage-button announcements. The visual transition layers contain no focusable controls.
- Confirmed exactly one True Cost Receipt heading in the homepage accessibility tree. Desktop navigation is hidden at mobile breakpoints; the closed mobile dialog is excluded from the accessibility tree by native dialog behavior.
- Fixed transient horizontal overflow by sizing the animated number's box to its text with `width: fit-content`. Animation timing/easing is unchanged.
- Checked all six widths for horizontal overflow, clipped amounts, labeled form controls, touch targets, and expanded receipts/comparisons. Also checked dark mode, reduced motion, native scrolling, and loading states.

## Naming

Primary tools: **Analyze, Compare, Queue, Purchases, Insights**.

Supporting tools: **Savings Goals** (`/dashboard`), **GoalLens** (`/goallens`), **Savings Simulator** (`/simulator`). Older GoalLens records are labeled **Saved GoalLens comparisons**. Navigation, footer, breadcrumbs, metadata, supporting headings, empty states, and related links use these labels. Routes and stored records are unchanged.

## Loading and recovery

The shared branded skeleton uses calm “Preparing…” copy, decorative skeleton lines, and an immediately available reload link plus JavaScript guidance. Recovery instructions are server-rendered, so they remain useful when hydration scripts fail to download. A global `noscript` notice explains the JavaScript requirement. The new route error boundary offers retry and reload using this installed Next.js version's `retry` API.

Analyze, Compare, Queue, Purchases, Insights, Savings Goals, GoalLens, and saved simulator scenarios use this shared treatment. No artificial delays or timers were added. Existing minimal skeleton motion and reduced-motion support remain intact.

## True Cost floor

The existing calculation intentionally caps resale deductions at modeled cost and floors net True Cost at zero. No calculation changed.

Receipt assumptions now state: “True Cost is floored at $0.00. DecisionLab does not model profit or appreciation if expected resale exceeds total ownership cost.” The zero is formatted in the receipt's selected currency. The existing high-resale warning remains visible outside the disclosure when relevant.

Tests cover free purchases, resale equal to gross ownership cost, resale above it, the one-cent boundary, zero expected uses, and the USD/EUR explanatory text.

## Queue receipts

**View Receipt** opens the existing saved-receipt disclosure and focuses its heading. **Print Receipt** invokes that mounted receipt's existing print action, including its existing analytics behavior. Both use `record.analysis`; there is no new receipt calculation or storage format.

Older GoalLens comparisons remain accessible in Savings Goals and explicitly have no product receipt. Incomplete or malformed product records retain the existing graceful read error and preservation behavior; the app does not invent missing receipt assumptions or overwrite those records.

## Validation

- Typecheck: `npx tsc --noEmit --incremental false` — passed.
- Lint: `npm run lint` — passed.
- Tests: `node --test tests/*.test.mjs` — **96 passed**.
- Production build: `npm run build` — passed.
- `tests/product-polish.browser.cjs` — passed all six requested widths, the Analyze → Queue → Purchases → Insights workflow, receipt view/focus/printing, unchanged saved data after viewing/printing, accessibility checks, dark/reduced-motion states, and no-JavaScript/blocked-hydration fallbacks.
- `tests/cost-motion.browser.cjs` — passed desktop scroll easing, final-number glide, mobile stage controls, native wheel/touch scrolling, and reduced-motion behavior.
- `tests/receipt-print.browser.cjs` — passed **20 print cases**: A4/Letter, light/dark, regular receipts, personal limits, goal/alternative inputs, zero uses/high resale, and long input. Each produced a single page with all receipt text visible and clean cancellation.
- `git diff --check` — passed.

Browser tests require a local Chrome/Chromium binary. Start a production server with `npm run start -- --port 3100`, then run the browser scripts with Node. `BASE_URL` and `CHROME_PATH` can override the defaults. Tests use temporary browser profiles and synthetic records.

Analytics, public usage statistics, financial formulas, storage/migrations, routes, dependencies, and credentials are unchanged. Nothing was pushed or deployed.

## Manual checks before committing

1. Scroll the homepage on a real phone and desktop, including Safari. Try every hidden-cost stage and the receipt usage slider. Check the section transitions and reduced-motion setting.
2. Use keyboard navigation and VoiceOver/NVDA to check the reveal, mobile menu, receipt disclosure, and Queue receipt focus. Automated checks inspected Chromium's accessibility tree; they are not a substitute for a screen-reader listening pass.
3. Open an existing Queue decision, use View Receipt, and try Print Receipt/Cancel in the browser's actual print dialog. Confirm it shows the intended saved analysis.
4. Generate an analysis with resale greater than all modeled costs. Confirm a zero total, the high-resale warning, and the explanation inside assumptions.
5. Disable JavaScript, or block Next.js script downloads and reload Analyze/Compare/Purchases/Insights. Confirm clear recovery guidance. Re-enable JavaScript and confirm normal hydration without an added delay.
6. Check supporting-tool links and existing GoalLens records in Savings Goals. If using personal records, export a backup through the existing tool before experimenting.

## Files changed

<!-- File manifest follows. -->

- `app/analyze/page.tsx`
- `app/compare/page.tsx`
- `app/components/cost-scroll-story.tsx`
- `app/components/hidden-cost-story.tsx`
- `app/components/site-footer.tsx`
- `app/components/site-navigation.tsx`
- `app/components/skeleton.tsx`
- `app/dashboard/goal-dashboard.tsx`
- `app/dashboard/page.tsx`
- `app/editorial-home.css`
- `app/editorial-story.css`
- `app/editorial-workspaces.css`
- `app/error.tsx`
- `app/goal-lens.tsx`
- `app/goallens/calculator-workspace.tsx`
- `app/goallens/page.tsx`
- `app/insights/insights-workspace.tsx`
- `app/insights/page.tsx`
- `app/layout.tsx`
- `app/page.tsx`
- `app/products/analyze-workspace.tsx`
- `app/products/compare-workspace.tsx`
- `app/products/product-form.tsx`
- `app/products/product-insights.tsx`
- `app/products/purchase-library.tsx`
- `app/products/queue-workspace.tsx`
- `app/products/true-cost-receipt.tsx`
- `app/purchases/page.tsx`
- `app/queue/page.tsx`
- `app/saved-decisions.tsx`
- `app/simulator/page.tsx`
- `app/simulator/scenario-workspace.tsx`
- `docs/PRODUCTION_POLISH.md`
- `tests/cost-motion.browser.cjs`
- `tests/product-polish.browser.cjs`
- `tests/products.test.mjs`
- `tests/workspace-fallback.test.mjs`
