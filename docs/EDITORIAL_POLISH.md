# Editorial polish and personal product score

## Completed changes

The homepage now uses five major sections: a mostly viewport-height botanical hero with one primary action; the live True Cost Receipt; a two-product comparison; a simple reconsideration section; and a clearly fictional prediction/experience example. The existing rain, demos, supporting tools, creator section, and credit are retained. No external site code, imagery, fonts, or components were copied.

Analyze uses four input stages followed by the receipt as stage five. Tax/shipping and ongoing allowances are expandable. Invalid inputs in a collapsed section reveal themselves for correction. Optional goals and score limits remain optional. Fields use approximately 16px text, secondary labels at least 12px, and visible focus indicators.

The receipt remains opaque ivory in both themes. Compare uses quieter vertical columns. Queue and Purchases use separated list entries; Insights uses fewer boxes and stronger metrics. The shared maximum content width remains consistent. The navigation keeps all six primary routes; stale active-page indication and mobile supporting links not closing the drawer were also fixed.

A single, faint light overlay follows mouse movement over selected forest surfaces, including the hero, reconsideration section, and supporting tool result panels. It is bounded to its current surface, never intercepts clicks, avoids receipt content, and disappears during touch, reduced motion, scrolling, blur, or printing. Updates are coalesced into animation frames only when the pointer moves; there is no continuous animation loop or custom cursor.

## User-specific product score

In Financial context, the optional score lets the user enter any combination of:

- Maximum net ownership cost, including upfront fees and resale.
- Maximum cost per use.
- Maximum ongoing expenses for the whole ownership period.
- Minimum planned ownership in months.
- Minimum expected usefulness, 1–5.

Blank limits are excluded. No budget or target is invented. Each selected factor receives equal weight. Cost fit is 100% within the selected maximum, otherwise `maximum / estimate × 100`. Ownership/usefulness fit is `estimate / minimum × 100`, capped at 100%. The overall result averages unrounded factors and rounds once. The receipt exposes the limits, estimates, factor scores, and method.

The percentage measures fit to the user's chosen limits. It is not purchase probability, affordability approval, a market ranking, or verified product quality/durability. Selecting multiple cost factors gives cost more influence; this overlap is disclosed. Missing required cost assumptions withhold the entire score. Zero uses cannot produce a cost-per-use score. Zero monetary limits are valid and handled safely.

For example: $100 net cost against a $50 limit yields 50%; 12 months against a 24-month target yields 50%; usefulness 4 against a target of 5 yields 80%. Their equal-weight personal-fit score is 60%.

## Functionality and compatibility

All ten routes remain: Home, Analyze, Compare, Queue, Purchases, Insights, About, GoalLens, Dashboard, and Simulator. Financial calculations, existing record IDs, storage keys, backup schema, journal behavior, and frozen purchase estimates remain unchanged.

`ProductAnalysis` gains only optional, validated `scorePreferences` with its own version 1. Old analyses remain valid and receive no invented score. Preferences persist through existing product saves, duplicates, edits, exports/imports, and frozen purchase snapshots. There is no eager storage rewrite, new key, package, remote request, publishing, or permanent server.

## Responsive and accessibility verification

An isolated Chrome fixture mounted the actual React route components with repository CSS, existing Geist fonts, and the existing botanical asset. All ten routes passed at 375/768/1440px in light and dark themes: 60 combinations, no horizontal overflow, no sampled secondary text below 12px, and no uncaught browser errors. The fixture substitutes Next routing and image optimization; this is not an end-to-end deployment check.

Interactive checks passed for:

- Hidden invalid tax/maintenance fields reopening for correction.
- At least one score criterion being required when scoring is enabled.
- Generating a score and preserving its preferences after saving/reopening.
- Currency changes clearing monetary score limits while retaining month targets.
- Mobile dialog focus containment, Escape dismissal, and focus restoration.
- Pointer light responding on the hero, excluding the receipt, allowing clicks, and disabling for touch/reduced motion.
- Rain hiding under reduced motion.

Desktop light and mobile dark homepage screenshots, the mobile scored receipt, pointer light, and a generated scored Letter PDF were visually reviewed. Receipt text token contrast ranges from 6.24:1 to 15.53:1; this is not a complete screen-reader/contrast certification.

The optional score initially increased print length. Its print-only breakdown and spacing were compacted without dropping content. All 20 real-Chromium print cases now produce a single page across A4/Letter and both themes: standard, personal-score, goal/alternative, unknown/zero-use, and long-input variants. Tests verify text visibility, expanded assumptions, only receipt content, cancellation/error cleanup, and unchanged source receipt. Exceptional combinations of long inputs and multiple optional sections may continue onto another page rather than being clipped.

## Validation results

- TypeScript: `node node_modules/typescript/bin/tsc --noEmit --incremental false` — passed, 60-second limit.
- ESLint: `npm run lint` — passed, 60-second limit.
- Full tests: `node --test tests/*.test.mjs` — **71 passed**, 60-second limit, including 8 new score tests.
- Production: `npm run build` (`next build --webpack`) — passed in 9.1 seconds, 120-second limit, all ten routes generated.
- Print: `node tests/receipt-print.browser.cjs` — **20 cases passed**, built-in 60-second limit and per-command timeouts.
- Browser review: temporary `node /private/tmp/decisionlab-editorial-review.cjs` fixture — **60 combinations plus interaction checks passed**. The first sandbox Chrome target creation timed out after ten seconds and its process group was terminated; approved isolated-profile runs then completed.
- `git diff --check` — passed.

The existing non-failing Node module-type warning remains. No development server was started.

## Exact file inventory

Created:

- `app/editorial-home.css` — five-section homepage composition and responsive treatment.
- `app/editorial-workspaces.css` — screen-only application spacing, reduced borders, ivory receipts, lists, metrics, and navigation polish.
- `app/components/pointer-light.tsx` — bounded, motion-aware mouse light.
- `app/pointer-light.css` — light appearance and accessibility media rules.
- `app/products/product-score.ts` — pure personal-fit calculation.
- `app/products/product-score-view.tsx` — receipt percentage, breakdown, and explanations.
- `app/products/product-score.css` — screen and compact print presentation.
- `tests/product-score.test.mjs` — calculation, missing-input, import-validation, persistence, and frozen-snapshot regressions.
- `docs/EDITORIAL_POLISH.md` — this handoff.

Modified:

- `app/page.tsx` — five-section homepage and calculated fictional examples.
- `app/components/landing-atmosphere.tsx` — entrance-effect targets follow new sections.
- `app/components/site-navigation.tsx` — active-indicator reset and mobile supporting-link dismissal.
- `app/layout.tsx` — shared style imports and decorative light mount.
- `app/goal-lens.tsx`, `app/simulator/scenario-workspace.tsx`, `app/insights/insights-workspace.tsx` — mark forest result surfaces for the light effect only.
- `app/products/product-form.tsx` — optional disclosures, financial context, score limits, currency handling, and invalid-field reveal.
- `app/products/product-model.ts` — optional typed/validated score preferences.
- `app/products/analyze-workspace.tsx` — final receipt-stage context.
- `app/products/true-cost-receipt.tsx` — optional score rendering.
- `tests/receipt-print.browser.cjs` — scored-receipt fixture and new stylesheet coverage.
- `README.md` — updated guided flow, score method, compatibility, and design review link.

## Remaining manual checks

Verify the running Next application in Safari and Firefox, including native print preview and printer settings. Test with a screen reader. Check real touch-device scrolling and the appearance of subtle glass/light effects on your display. Browser fixture checks do not validate Next client navigation, deployed font/image delivery, or every possible user-entered combination. The new score should be reviewed as a personal heuristic, never a financial recommendation.
