# Redesign file inventory

This inventory compares the redesign with the working app at the start of the redesign task. Git also contains earlier uncommitted platform work; those pre-existing changes have not been reverted.

| File / component | Status | Change |
| --- | --- | --- |
| [`README.md`](../README.md) | Changed | Updated route, feature, storage, and design documentation. |
| [`app/about/page.tsx`](../app/about/page.tsx) | Changed | Editorial About page, principles, creator section, and calls to action. |
| [`app/components/animated-number.tsx`](../app/components/animated-number.tsx) | Created | Exact-value numeric entrance transitions with shared formatting. |
| [`app/components/brand-mark.tsx`](../app/components/brand-mark.tsx) | Created | Reusable branching D inline SVG identity. |
| [`app/components/creator-note.tsx`](../app/components/creator-note.tsx) | Created | Creator illustration, story, signature, and visible attribution. |
| [`app/components/decision-path.tsx`](../app/components/decision-path.tsx) | Created | Decorative branching SVG path and graph-paper motif. |
| [`app/components/decision-timeline.module.css`](../app/components/decision-timeline.module.css) | Created | Responsive shared-scale before/after timeline styling. |
| [`app/components/decision-timeline.tsx`](../app/components/decision-timeline.tsx) | Created | Labeled baseline and purchase-delay visualization. |
| [`app/components/goal-card.tsx`](../app/components/goal-card.tsx) | Changed | Progress rings, goal status, stronger values, and existing goal actions. |
| [`app/components/goal-form.tsx`](../app/components/goal-form.tsx) | Changed | Currency prefixes, helpers, validation, and error-focus handling. |
| [`app/components/goal-preview.tsx`](../app/components/goal-preview.tsx) | Changed | Compact live landing calculator with comparison bars. |
| [`app/components/goal-timeline.tsx`](../app/components/goal-timeline.tsx) | Changed | Theme-aware savings projection and milestone labels. |
| [`app/components/lab-icon.tsx`](../app/components/lab-icon.tsx) | Created | Lightweight reusable inline SVG icon set. |
| [`app/components/page-heading.tsx`](../app/components/page-heading.tsx) | Changed | Consistent editorial headers and breadcrumb navigation. |
| [`app/components/site-footer.tsx`](../app/components/site-footer.tsx) | Created | Full product footer with shared mark, route links, and creator credit. |
| [`app/components/site-navigation.tsx`](../app/components/site-navigation.tsx) | Changed | Six-route active navigation and native modal mobile drawer. |
| [`app/components/skeleton.tsx`](../app/components/skeleton.tsx) | Created | Accessible loading placeholders. |
| [`app/components/small-choices.tsx`](../app/components/small-choices.tsx) | Created | Interactive weekly-savings and time-horizon demonstration. |
| [`app/components/term-tip.tsx`](../app/components/term-tip.tsx) | Created | Keyboard, hover, tap, and Escape economic-term tooltip. |
| [`app/components/theme-toggle.tsx`](../app/components/theme-toggle.tsx) | Created | Light/dark control with a separate persisted preference. |
| [`app/dashboard/dashboard-overview.tsx`](../app/dashboard/dashboard-overview.tsx) | Created | Summary visuals, weekly allocations, and upcoming projected milestones. |
| [`app/dashboard/dashboard.module.css`](../app/dashboard/dashboard.module.css) | Created | Responsive dashboard, goal, form, and demo styling. |
| [`app/dashboard/goal-dashboard.tsx`](../app/dashboard/goal-dashboard.tsx) | Changed | Welcome state, quick actions, save feedback, and isolated read-only sample dashboard. |
| [`app/dashboard/page.tsx`](../app/dashboard/page.tsx) | Changed | Dashboard introduction, contextual navigation, and metadata. |
| [`app/globals.css`](../app/globals.css) | Changed | Complete shared token system, light/dark themes, landing layouts, controls, motion, and responsive styles. |
| [`app/goal-lens.tsx`](../app/goal-lens.tsx) | Changed | Split input/result workspace, timeline impact, animated values, and preserved calculator controls. |
| [`app/goallens/calculator-workspace.tsx`](../app/goallens/calculator-workspace.tsx) | Changed | Saved-goal handoff, branded loading, and clear load feedback. |
| [`app/goallens/goal-lens.module.css`](../app/goallens/goal-lens.module.css) | Created | Scoped calculator layout, tabs, result panels, input states, and formulas. |
| [`app/goallens/page.tsx`](../app/goallens/page.tsx) | Changed | Calculator header, contextual dashboard link, and compact usage guide. |
| [`app/insights/insight-calculations.ts`](../app/insights/insight-calculations.ts) | Created | Weighted goal summary and correctly separated explored-decision metrics. |
| [`app/insights/insights-workspace.tsx`](../app/insights/insights-workspace.tsx) | Created | Local insights, decision mix, explored spending, impact, activity, and empty states. |
| [`app/insights/insights.module.css`](../app/insights/insights.module.css) | Created | Responsive insight panels, charts, and fixed mobile spending-label width. |
| [`app/insights/page.tsx`](../app/insights/page.tsx) | Created | New Insights route and metadata. |
| [`app/layout.tsx`](../app/layout.tsx) | Changed | Shared shell, theme initialization, navigation, and footer. |
| [`app/page.tsx`](../app/page.tsx) | Changed | New hero, bento tool grid, live examples, opportunity-cost graphic, and creator section. |
| [`app/saved-decisions.module.css`](../app/saved-decisions.module.css) | Created | Scoped decision-journal cards, status labels, and responsive layout. |
| [`app/saved-decisions.tsx`](../app/saved-decisions.tsx) | Changed | Polished activity cards and branded empty states; existing save/delete behavior retained. |
| [`app/simulator/page.tsx`](../app/simulator/page.tsx) | Created | New Simulator route and metadata. |
| [`app/simulator/scenario-storage.ts`](../app/simulator/scenario-storage.ts) | Created | Typed validated scenario persistence in its own versioned key. |
| [`app/simulator/scenario-workspace.tsx`](../app/simulator/scenario-workspace.tsx) | Created | Two-plan simulation, comparison timeline, save/reopen/delete/reset, and formulas. |
| [`app/simulator/simulator.module.css`](../app/simulator/simulator.module.css) | Created | Responsive simulator inputs, results, saved scenarios, and feedback. |
| [`app/template.tsx`](../app/template.tsx) | Created | Subtle route-entry transition wrapper. |
| [`docs/DESIGN_SYSTEM.md`](../docs/DESIGN_SYSTEM.md) | Created | Design tokens, interaction rules, preservation details, and honest review status. |
| [`docs/REDESIGN_FILES.md`](../docs/REDESIGN_FILES.md) | Created | This complete redesign file and component inventory. |
| [`tests/insights.test.mjs`](../tests/insights.test.mjs) | Created | Three new tests for aggregation, weighted progress, and impact thresholds. |
| [`tests/scenarios.test.mjs`](../tests/scenarios.test.mjs) | Created | Four new tests for independent plans, persistence, validation, and storage errors. |

## Preserved unchanged

The original calculation module, both original data-storage modules, shared storage subscription hook, package dependencies, and all three original test files were checked against the pre-redesign snapshot and are unchanged.

- `app/goal-lens-calculations.ts`
- `app/saved-decisions-storage.ts`
- `app/savings-goals.ts`
- `app/use-local-storage.ts`
- `package.json`
- `tests/goal-lens.test.mjs`
- `tests/saved-decisions.test.mjs`
- `tests/savings-goals.test.mjs`

The four existing routes remain. The added routes are `/simulator` and `/insights`. Existing `decisionlab.saved-decisions.v1` and `decisionlab.savings-goals.v1` keys are unchanged; scenarios and theme preferences have separate new keys.

## Student-testing and precision-design pass

The following inventory is relative to the preserved state at the start of this pass. Earlier entries document earlier redesign work; current validation is in `STUDENT_TESTING_REVIEW.md`.

- `app/saved-decisions.tsx` — updated.
- `app/savings-goals.ts` — updated.
- `app/data-backup.ts` — created.
- `app/goal-lens.tsx` — updated.
- `app/saved-decisions.module.css` — updated.
- `app/saved-decisions-storage.ts` — updated.
- `app/page.tsx` — updated.
- `app/globals.css` — updated.
- `app/goal-lens-calculations.ts` — updated.
- `app/insights/insight-calculations.ts` — updated.
- `app/insights/insights-workspace.tsx` — updated.
- `app/insights/insights.module.css` — updated.
- `app/dashboard/dashboard.module.css` — updated.
- `app/dashboard/dashboard-overview.tsx` — updated.
- `app/dashboard/page.tsx` — updated.
- `app/components/site-navigation.tsx` — updated.
- `app/components/brand-mark.tsx` — updated.
- `app/components/decision-timeline.module.css` — updated.
- `app/components/term-tip.tsx` — updated.
- `app/components/goal-card.tsx` — updated.
- `app/components/site-footer.tsx` — updated.
- `app/components/data-backup.tsx` — created.
- `app/components/goal-form.tsx` — updated.
- `app/components/decision-journal.tsx` — created.
- `app/components/precision-dial.tsx` — created.
- `app/simulator/simulator.module.css` — updated.
- `app/simulator/scenario-storage.ts` — updated.
- `app/simulator/scenario-workspace.tsx` — updated.
- `app/goallens/goal-lens.module.css` — updated.
- `tests/insights.test.mjs` — updated.
- `tests/savings-goals.test.mjs` — updated.
- `tests/goal-lens.test.mjs` — updated.
- `tests/reliability.test.mjs` — created.
- `tests/scenarios.test.mjs` — updated.
- `tests/saved-decisions.test.mjs` — updated.
- `docs/DESIGN_SYSTEM.md` — updated.
- `docs/STUDENT_TESTING_REVIEW.md` — created.
- `README.md` — updated.
- `tsconfig.json` — updated.
