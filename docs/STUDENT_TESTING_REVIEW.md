# Student-testing review

## What changed

- Recurring timelines now use weekly savings before the modeled expense minus that expense once. An unfinished goal with no positive contribution is unreachable. Savings above the target are valid across calculators, goals, saved decisions, and Simulator.
- GoalLens and dashboard copy explains end-of-week deposit counts, estimate dates, affordability limits, separate goal allocations, and nonjudgmental impact labels. Legacy recurring equivalents remain stored but are labeled and excluded from current delay statistics.
- Saved comparisons now support an optional outcome, reason, and reflection. Journal edits preserve calculation snapshots and unrelated entries. Insights distinguishes self-reported outcomes from hypothetical exploration.
- Dashboard backup export/import validates size, version, structure, IDs, monetary precision, and text limits. Preview confirmation adds missing IDs and never replaces existing records. Changed previews are rejected, failed writes attempt rollback, and unreadable storage is not erased.
- Shared forest/ivory themes, system-serif major headings, refined homepage composition, and real-data dashboard dials establish the precision-instrument design. Creator section preserved; footer credit shortened as requested. README acknowledges AI assistance.

## Exact checks

Each command was wrapped with `/private/tmp/decisionlab-bounded-check.py` to enforce the limit:

| Command | Limit | Result |
| --- | --- | --- |
| `npm run lint` | 60 s | Passed, 2.9 s |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | 60 s | Passed, 1.5 s |
| `node --test tests/*.test.mjs` | 60 s | 45 passed, 0 failed, 0.2 s |
| `npm run build` (runs `next build --webpack`) | 120 s | Passed, 8.6 s; all six routes generated |
| `node /private/tmp/decisionlab-typography-check.mjs` | 90 s | Blocked after 6.3 s: server bind `listen EPERM 127.0.0.1:3112` |

No check hung. The browser runner exited through cleanup, and no development server was started or existing server stopped. An existing server could not be reached from the sandbox at localhost:3000. No permission escalation was requested. The test runner emits the existing non-failing `MODULE_TYPELESS_PACKAGE_JSON` warning.

Core light/dark text token pairs were checked mathematically against 4.5:1 contrast and passed. This is not a rendered contrast audit.

## Unverified or limited

- No current browser screenshots or interactive tests passed: all routes, both themes, 375/768/1440px layouts, focus behavior, file download/upload, refresh persistence, and create/edit/open/journal flows need browser review. Pure calculation and storage tests passed, including journal preservation and backup round trips.
- localStorage has no multi-key transaction. Imports detect changes since preview and roll back write failures, but another tab writing during the brief commit can still race. Import with other DecisionLab tabs closed. If storage also blocks rollback, the app reports this explicitly.
- Import merges only missing IDs. It intentionally does not replace matching local entries; restoring an older journal over a newer one is not offered.
- Safari, Firefox, native date inputs, and screen-reader interaction remain manual checks.

## Five-minute manual checklist

1. In a separate browser profile, open each route in light/dark themes. Check 375px, 768px, and 1440px widths for clipped text or horizontal scrolling; inspect the new dial and hero.
2. Create a goal, edit its balance above the target, then open it in GoalLens. Confirm progress caps at 100% and never shows negative time.
3. Try recurring coffee: goal $1,500, saved $900, $30/week before expense, $5 × 3/week. Expect 40 weeks versus 20 baseline. At $10 × 3/week, expect an unreachable-goal explanation.
4. Save a two-purchase comparison. Open its journal, record a choice/reason/reflection, edit it, and refresh. Verify Insights labels it recorded without claiming money saved.
5. Export, add another goal, select the backup, review the preview, cancel once, then confirm. Existing goals/journals must survive. Test mobile-menu Escape, Tab focus, and a deletion cancellation.

## Understanding the project

**Calculation:** $600 remaining ÷ ($30 available − $15 recurring spending) = 40 weekly deposits. Without the expense it takes 20. The delay is 20 weeks, not $780 annual cost ÷ $30 = 26.

**Coding decision:** journal fields are optional on the existing saved-decision type. Old records still parse without a migration or new storage key. Editing reads the latest list, changes only that record's journal, and leaves its financial snapshot intact.
