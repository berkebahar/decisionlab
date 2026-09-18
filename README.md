# DecisionLab

Created by Berke Bahar.

**Before you buy it, see what it will really cost.**

DecisionLab is a private pre-purchase decision platform for anyone evaluating physical consumer goods. It connects purchase price, ownership expenses, expected use, resale, alternatives, and optional personal goals. It is not a marketplace, traditional budgeting app, or financial adviser. No prices or product specifications are fetched or invented.

## Product experience

- `/analyze`: guided Product → Ownership → Purpose → Financial context → Receipt steps; generate an accessible, printable True Cost Receipt without bank details or required savings information.
- `/compare`: up to three products; enter manually, load analyses, duplicate/edit variants, select factors to display, and inspect differences in assumptions. No universal winner or scientific weighting score.
- `/queue`: save receipts, edit assumptions, choose tomorrow/3 days/7 days/custom reconsideration dates, and record considering/bought/skipped/postponed with a reason. Reminders appear only on return, with no notifications.
- `/purchases`: actual purchase date/price, tax/shipping, cumulative costs, uses, satisfaction, buy-again answer, lifecycle, resale and reflection. Original predicted assumptions freeze when marked bought.
- `/insights`: product models, queue states, self-reported purchases, and reviews are separated. Category counts, planned reconsideration intervals, satisfaction samples, and predicted/actual comparisons use only recorded evidence. No inferred savings or combined hypothetical delay.
- `/`: interactive receipt preview and fictional laptop, shoes, and camera demonstrations. Demo data stays outside storage unless explicitly adopted and saved.
- `/about`: transparent assumptions, privacy, and creator information.

## Personal product score

An optional **user-specific product score** measures fit against limits you enter in Financial context: maximum net ownership cost, maximum cost per use, maximum whole-period ongoing costs, minimum ownership months, and minimum usefulness. Blank limits are excluded; at least one limit is required. There are no invented budget defaults.

Each selected factor receives equal weight. Cost fit is 100% within the maximum; above it, maximum / estimate × 100. Ownership and usefulness fit are estimate / minimum × 100, capped at 100%. The displayed total averages unrounded factor scores and rounds once. Missing inputs needed by any selected factor leave the total incomplete; zero uses cannot produce a cost-per-use score. Zero monetary limits are valid. Selecting multiple cost factors gives cost more influence, which is disclosed in the receipt.

This percentage is a personal fit index, **not a probability that you should buy, an affordability approval, or a verified quality/durability rating**. The receipt displays the limits, estimates, factor scores, and exact method. Existing financial formulas are unchanged. Optional version-1 `scorePreferences` travels with the existing product analysis in local storage and backups; old records remain valid without it, and original purchase snapshots remain frozen.

## Editorial presentation

The homepage uses five sections: a cinematic botanical hero, live receipt, simple comparison, reconsideration, and explicitly fictional post-purchase reflection. Supporting tools and creator content remain available. A subtle mouse-following light is limited to selected forest surfaces; it never intercepts clicks and is disabled for touch and reduced motion. There is no custom cursor or continuous light-animation loop. Original CSS rain retains its pause control.

See [the editorial polish handoff](docs/EDITORIAL_POLISH.md) for files, checks, and manual review limits.

## Distinctive interactions

The hero includes a native, keyboard/touch-accessible hidden-cost reveal: fictional $899 sticker price + $120 accessories + $180 maintenance + $240 subscriptions − $310 resale = $1,129 net ownership cost, or $2.17 across 520 expected uses. These figures use the existing calculation functions and never enter personal storage.

Receipt rows offer inline explanations and a short, readable entrance sequence. Calculated values settle immediately into their current value rather than counting through fabricated intermediate amounts. Compare can emphasize cost per use, true cost, price, resale, ongoing costs, usage, or goal impact while keeping its supporting filters and assumptions.

Reduced-motion users get static presentation. Native disclosures still work without animation, and the hero disclosure works without JavaScript. Print snapshots omit interactive row controls and their duplicate hints; all original receipt values and full assumptions remain static and visible. See [the interaction polish review](docs/INTERACTION_POLISH.md) for the exact files, checks, and manual checklist.

## Preserved supporting tools

Goals, GoalLens journals, and advanced simulation remain available through the footer, mobile menu, homepage supporting links, and a collapsible supporting section in Insights. Existing records are not converted into products by inventing missing ownership assumptions.

### Existing features

- **Home (`/`):** an interactive fictional True Cost Receipt preview, product workflows, and links to supporting tools.
- **GoalLens (`/goallens`):** the complete calculator, with direct links to recurring and comparison modes.
- **Dashboard (`/dashboard`):** create, edit, and delete multiple savings goals; track progress, target dates, estimated completion, and combined totals. Open any goal directly in GoalLens with its amounts filled in.
- **Simulator (`/simulator`):** explore two independent savings and spending plans; save, reopen, and delete scenarios.
- **Insights (`/insights`):** see weighted goal progress, decision mix, explored costs, and goal-delay patterns in saved comparisons.
- **About (`/about`):** an introduction to opportunity cost, educational assumptions, and the creator.
- **Shared navigation:** active-page links, a keyboard-accessible mobile menu, page metadata, and a consistent footer.
- **GoalLens:** enter a purchase, goal price, current savings, and weekly savings to see a timeline and progress percentage.
- **Recurring spending:** enter an expense, cost per purchase, and weekly frequency to see average monthly spending, yearly spending, and its ongoing goal-completion delay.
- **Compare two purchases:** compare prices, goal timelines, and extra weeks using the same savings assumptions.
- **Reset example:** restore the shoes and laptop example without deleting saved decisions.
- **Save comparison:** save a snapshot of any mode, including the goal, weekly savings, prices, extra weeks, and date.
- **Saved decisions:** revisit comparisons below your dashboard goals. Goals and decisions require confirmation before deletion, persist in this browser, and update across open tabs.
- **Accessible inputs:** labels, field-specific errors, keyboard focus indicators, live results, and touch-friendly controls.
- **Responsive design:** forest green and warm ivory styling with layouts for phones and computers.
- All monetary output uses `Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })`.

## Product design

DecisionLab uses an original precision-instrument identity: forest green (#123C32), warm ivory (#F7F4ED), ink (#17221E), stone borders, and restrained champagne (#B59A64) details. Major headings use system Georgia; existing Geist handles body text and controls. Financial figures use tabular numerals. The dashboard dial shows actual goal progress, with a text equivalent. Light and dark themes share semantic tokens. No brand assets or additional font packages were added.

See [the design system](docs/DESIGN_SYSTEM.md) for tokens and behavior.

## Product calculation rules

All money inputs use the selected currency (USD default; EUR, GBP, CAD, AUD, CHF also available). There is no exchange-rate conversion. Do not compare currency amounts across different currencies. A selected existing goal is USD-only; simple goal snapshots can be defined in the product currency without changing Dashboard data.

Let `M` be ownership months (`years × 12`), and all monetary inputs be nonnegative amounts:

```text
initial = price + tax + shipping
maintenance = yearly maintenance × M / 12
subscription = monthly rate × M, or yearly rate × M / 12
ownership expenses = maintenance + whole-period accessories/consumables
                   + subscription + whole-period repair allowance
net = max(0, initial + ownership expenses − expected resale)
uses = weekly uses × M × 52/12, or monthly uses × M
cost per use = net / uses; unavailable when uses = 0
alternative difference = product purchase price − alternative purchase price
```

Amounts are calculated in cents; prorated annual costs round to the nearest cent. Tiny positive unit costs display `<$0.01` (in the selected currency) rather than imply zero cost. Expected resale is capped at gross modeled cost, with an explicit warning; no profit is inferred. Unknown optional values are excluded and listed as missing, while an entered zero explicitly means no cost. Durability, usage, and resale are user assumptions, not verified facts. Years use 52 weeks and 12 months.

Optional goal delay includes **upfront cost only**, with separately rounded end-of-week or end-of-month deposits. `baseline = ceil(max(0, target − saved) / contribution)`. `with purchase = ceil(max(0, target − saved + initial) / contribution)`. Delay is their difference. A positive remaining balance with zero contribution is unreachable. Future ownership expenses and resale are not silently charged to today's savings, because their timing is unknown. This is a partial scenario, not a complete cash-flow forecast.

Actual cost is the recorded price + tax + shipping + cumulative maintenance/accessories/subscriptions/repairs, less actual resale only if marked sold, floored at zero. Unknown fields produce a labeled incomplete subtotal, not a full ownership cost. Actual cost per use requires positive recorded uses. Returns/refunds are not modeled. Predicted figures cover the full planned period; actual figures are cumulative through the review date. Expected usage by review date uses elapsed days / (365.25/12), capped at the planned months. No difference is called savings or a benefit.

## Supporting GoalLens calculations

Let `G` be the goal price, `S` the amount saved, `W` weekly savings, and `P` the purchase price.

```text
Remaining money = max(0, G − S)
Weeks without purchase = Math.ceil(max(0, G − S) / W)
Weeks with purchase = Math.ceil(max(0, G − S + P) / W)
Extra weeks = weeks with purchase − weeks without purchase
Savings progress = min(100, (S / G) × 100)
```

Each timeline rounds up separately. For example, if both options fit within the same final week, extra weeks can be zero even when the purchase has a cost. Progress displays to one decimal place. A zero-price goal is complete with zero weeks and 100% progress.

Dollar amounts are converted to integer cents before calculating timelines to avoid floating-point errors. Values must be finite, nonnegative, at most $1,000,000,000, and have no more than two decimal places. Savings above the goal are valid and can absorb modeled spending. Calculator weekly savings must be greater than zero. Blank names or amounts block saving and hide invalid results.

### Default example

- Purchase: New pair of shoes, **$120.00**
- Goal: Laptop, **$1,500.00**
- Already saved: **$900.00**
- Weekly savings: **$30.00**
- Results: **20 weeks** without the shoes, **24 weeks** with them, **4 extra weeks**, **60% saved**.

### Recurring spending

```text
Yearly cost = cost per purchase × purchases per week × 52
Average monthly cost = yearly cost / 12
Weekly expense = cost per purchase × purchases per week
Net contribution = W − weekly expense
Completion weeks = ceil(max(0, G − S) / net contribution)
Delay = completion weeks − baseline weeks
```

Frequency is a whole number from 0 to 1,000 purchases per week. The annual total must stay within the monetary limit. The monthly value is an average over 12 months, not a four-week estimate. A $5.00 coffee bought three times per week costs $780.00 per year, or $65.00 per month on average; under the default goal, $30 available BEFORE the expense becomes a $15 net contribution. The goal takes 40 weekly deposits instead of 20: a 20-week modeled delay. Annual cost divided by weekly savings is not this delay.

In recurring mode, weekly savings means available money **before** the modeled expense, which is subtracted exactly once. A nonpositive net contribution cannot reach an unfinished goal. A completed goal remains complete. In purchase modes and Simulator, weekly savings is after normal expenses, excluding the modeled one-time purchase. Do not enter an expense again if it is already deducted from that budget.

Timelines are rounded **end-of-week deposit counts**, first deposit in one week, not continuous-time estimates. Dashboard dates assume this schedule and change with actual deposit timing. Spending above current savings is hypothetical future spending, not an affordability check or a borrowing assumption. No interest, price changes, or investment returns are assumed.

Impact labels are descriptive thresholds, not scientifically validated scores or purchase recommendations: low 0–2 weeks, moderate 3–8, high 9+. Independent delays are never added into a real total. Legacy recurring records retain their original annual-cost equivalent, explicitly labeled and excluded from ongoing-delay statistics.

## Storage

Saved decisions use the versioned key `decisionlab.saved-decisions.v1` in localStorage. They belong to this browser and site; there is no account, server database, or cross-device sync. Clearing site data removes them. A save or delete is only reported as successful after the browser accepts the write. Unreadable saved data is preserved, and blocked or full storage produces a friendly message. Calculator reset does not clear saved decisions.

Savings goals use the separate key `decisionlab.savings-goals.v1`, preserving the existing saved-decision format. Each goal has a name, target amount, current amount, weekly contribution, optional target date, ID, and creation timestamp. Goal amounts use integer cents for projections. Targets must be positive; overfunded goals are valid, with progress capped at 100%. A zero weekly contribution pauses the estimate; a fully funded goal is complete. Forecasts add whole weeks to today's local calendar date and handle dates beyond the supported calendar range without crashing.

The dashboard's SVG timelines show projected savings from today to completion. Contributions are plans, not automatic balance updates: edit the current amount as you save. Totals sum separate allocations: each dollar should be assigned to one goal only, not repeated across goals. Links such as `/goallens?goal=<id>` load the goal from this browser; editing calculator inputs does not modify the saved goal. A paused goal opens with its actual zero contribution and asks for a positive savings rate before calculating.

Simulator scenarios use the additional versioned key `decisionlab.scenarios.v1`; the two original goal and decision keys remain unchanged. Theme preference uses `decisionlab.theme.v1`. All financial data remains in browser storage. The sample dashboard uses in-memory examples without writing them to any key.

### Decision journal and backups

Existing GoalLens decisions keep their optional outcome, reason, and reflection under the same legacy key. New products use `decisionlab.products.v1`, an envelope `{ version: 1, items: ProductRecord[] }`. IDs remain stable; updates reread storage, validate every record, and reject stale edit timestamps. Product status changes and reviews never overwrite the original frozen purchase estimate.

Backup exports now use `decisionlab-backup` version 2, including products and all legacy collections. Version 1 backups are accepted and normalized in memory to version 2 with an empty incoming product list. Existing products and legacy entries remain intact. No eager migration or destructive rewrite runs on app startup. Malformed or unknown-version storage is preserved and reported.

Imports validate the 1 MB file limit, format/version, up to 1,000 records per category, IDs, numeric ranges/precision, dates, strings, enums and nested records. Preview shows additions; explicit confirmation merges **missing IDs only**, preserving existing matches and their reviews. No replace-all operation is offered. Changed previews are rejected. Write failures attempt rollback; failure of rollback is explicitly reported. localStorage is not a transaction system, so close other editing tabs while importing.

Data is local to this browser/device and may disappear if browser data is cleared. Export files contain personal entries; keep them private. URLs carry only opaque record IDs, mode names or fictional demo indices, never financial values. Vercel Web Analytics measures page views and anonymous product actions with fixed event names and no custom properties; financial and personal entries are never sent. Analytics URLs exclude query parameters and fragments. See [analytics setup, event definitions, and local checks](docs/ANALYTICS.md). No bank connections, accounts, advertisements, affiliates, scraping, payments, or external financial requests are present. Deletion targets only DecisionLab records, never `localStorage.clear()`.

## Technology

- Next.js 16 App Router
- React 19 and TypeScript
- CSS with the existing Tailwind CSS setup and Geist typography
- Browser localStorage and React `useSyncExternalStore` for saved comparisons
- Node.js built-in test runner (no additional testing package)

Page metadata and static content stay in Server Components. The preview, calculator, navigation menu, dashboard, and saved decisions use Client Components. Browser storage is read through hydration-safe external-store subscriptions. Pure calculation and storage modules keep the behavior testable. No chart or additional UI packages are required.

## Run locally

The About page's **DecisionLab in use** section reads real aggregate totals from Vercel's server-side Analytics API. Configure the private read credentials described in [public usage statistics setup](docs/PUBLIC_USAGE_STATS.md) to display counts. Without them, the section shows an unavailable message; no numbers are invented.

Use Node.js 24 for the TypeScript calculation tests.

```bash
npm install
npm run dev
```

Open http://localhost:3000. If your environment prevents Turbopack from opening its CSS worker port, use `npm run dev -- --webpack`.

```bash
npm run lint
npx tsc --noEmit --incremental false
node --test tests/*.test.mjs
npm run build
npm start
```

Production builds use Next.js's supported Webpack option because Turbopack's local worker port is restricted in the development environment. The existing Google Fonts setup may require network access during the first build.

Tests cover all calculator modes, legacy saved decisions, goal persistence and editing, malformed data preservation, storage failures, cent precision, paused/completed goals, target-date comparisons, and extreme completion dates.

## About the Creator

DecisionLab was created by Berke Bahar, with an interest in computer science, mathematics, and economics.

Created by Berke Bahar.

## AI assistance

Created by Berke Bahar. Development has been assisted by OpenAI Codex for implementation, debugging, tests, and design iteration. This is not a claim that every line was written by hand. Berke remains the project creator; the assumptions, code, and educational explanations should be reviewed and understood before relying on the results.

## Product transformation review

See [the implementation and validation report](docs/PRODUCT_TRANSFORMATION.md) for route/file inventory, migration details, exact checks, remaining limitations, and a five-minute manual test.
