# Privacy-conscious usage analytics

DecisionLab uses the official `@vercel/analytics` Next.js integration (2.0.1), mounted once in the root layout through `PrivacyAnalytics`. Vercel records normal page loads and client-side navigations. The integration is invisible and does not change calculations, product routes, or browser storage.

## Data policy

Every custom event contains **only its fixed event name, with no custom properties**. The tracking helper deliberately has no properties argument and rejects unknown event names at runtime. It never reads product records or browser storage. Analytics failures cannot interrupt product actions.

The `beforeSend` hook strips every query parameter, URL fragment, and URL credential from both page views and custom events. Only the ten existing public page paths are allowed; unknown paths are dropped to avoid sending arbitrary input embedded in a path. Adding a future page requires explicitly allowing its path in `app/analytics.ts`. This changes the reported URL only, never navigation or the address bar. The root metadata sets `no-referrer` so outgoing requests and navigations do not expose sensitive URL parameters through the HTTP Referer header.

No product names, model names, prices, savings, resale values, descriptions, notes, personal financial values, names, emails, free text, record IDs, categories, or ratings are passed as analytics data. No cookies, localStorage/sessionStorage keys, persistent visitor IDs, fingerprinting code, session replay, or additional trackers are added by this implementation.

Vercel still processes its normal anonymous traffic metadata (for example browser/device and approximate location). Its visitor identification uses a request-derived hash discarded after 24 hours, so visitor counts are estimates rather than a permanent count of distinct people. Blocked scripts can cause undercounting. See [Vercel's privacy documentation](https://vercel.com/docs/analytics/privacy-policy).

## Event definitions

All events below have **no custom properties**. The sanitized page URL provides page context.

| Event | Exact firing point |
| --- | --- |
| `homepage_viewed` | `RouteEvents` in `app/components/privacy-analytics.tsx`: once on entering `/`, including a fresh load or returning from another page. |
| `analyze_started` | `ProductForm`'s first field change or valid form submit during an Analyze editing attempt, through `AnalysisEditor.onStart`. Merely loading, focusing, or reopening an existing receipt does not count. Reopening the form starts a new attempt only after interaction. |
| `analysis_completed` | `AnalysisEditor`'s post-render effect after a validated form completion has committed the True Cost Receipt. Loading a saved receipt or canceling edits does not count. |
| `compare_started` | Once per `Comparison` workspace: clicking Add a product/Edit assumptions, or committing the first selected, linked, duplicated, or demo option. An empty `/compare` page load does not count. A link with available saved options or a selected demo counts as beginning setup. |
| `comparison_completed` | `Comparison`'s post-render effect when at least two valid options with the same currency are displayed. Once per changed option set, including valid edits/additions/removals. One option, mixed currencies, edit cancellation, metric/detail toggles, and storage refreshes do not count. |
| `decision_saved` | After a successful write in Analyze's Save receipt/Save updated receipt, Compare's Save independent receipt copy, or Queue's Save decision. Each successful explicit save counts; validation/storage failures do not. |
| `queue_opened` | `RouteEvents`: once on entering `/queue`, including fresh loads and return visits. Filtering, saving, and storage updates do not count as opening it again. |
| `purchase_recorded` | Queue's successful Save decision changes a product from a status other than `bought` to `bought`. Saving an already bought item again does not count. |
| `review_completed` | `ReviewEditor` in `app/products/purchase-library.tsx`: after validation and a successful `saveReview` write, including explicitly saved review updates. |
| `receipt_printed` | `TrueCostReceipt.print`: clicking Print receipt with a mounted receipt, immediately before invoking the existing print helper. Measures use of the action; browsers cannot confirm that the user physically printed rather than canceled. |

Explicit demo interactions count as product usage and are not distinguished from other usage with event properties. Demo previews embedded on the homepage do not generate analysis/comparison completion events.

Refs guard route/start/completion events across re-renders and React Strict Mode effect replay. Action events run in user handlers after successful writes, never in render or state updater callbacks. Repeating a meaningful action (for example saving another review or generating a revised receipt) counts again.

## Vercel setup and dashboard

1. Open the DecisionLab project in Vercel, select **Analytics** in the sidebar, and click **Enable** for Web Analytics if it is not already enabled. No analytics keys or new environment variables are needed for a Vercel deployment.
2. Deploy this change yourself when ready. Enabling Analytics provisions Vercel's collection endpoints on the next deployment; application routes remain unchanged. Nothing in this implementation pushes or deploys automatically.
3. In **Analytics**, select **Production** and the desired date range. The overview shows visitors and page views; the Pages/Routes panels show usage by page. Use normal page views for traffic totals, rather than adding custom event counts to them.
4. In the same dashboard, open the **Custom Events** panel and select an event name to see/filter its activity. There are no property breakdowns because no custom properties are sent. Vercel currently requires **Pro or Enterprise** for custom events; a Hobby project needs an eligible plan to use this part of the dashboard. No event names need to be registered manually.

Official references: [setup](https://vercel.com/docs/analytics/quickstart), [dashboard and environment filters](https://vercel.com/docs/analytics/using-web-analytics), [custom events and plan availability](https://vercel.com/docs/analytics/custom-events), [URL redaction](https://vercel.com/docs/analytics/redacting-sensitive-data).

## Before committing: local checks

```sh
npx tsc --noEmit --incremental false
npm run lint
node --test tests/*.test.mjs
npm run build
npm run dev
```

Use Node.js 24 for the tests. In development the official SDK logs events to the browser console instead of sending them to production analytics. Its debug script requires network access and may be blocked by a browser extension. A plain local production server does not supply Vercel's collection endpoints; a local 404 from those endpoints does not indicate a broken product workflow.

- Open Home, Analyze, Compare, and Queue; confirm page views and once-per-entry Home/Queue events. Returning to Home/Queue should count again.
- Load an empty Analyze form without editing; expect no start/completion. Enter fictional values, continue through the steps, and generate a receipt; expect one start and one completion. Invalid input, opening a saved receipt, editing cancellation, and unrelated re-renders must not add completions.
- Start an empty comparison, add two valid same-currency options, edit one, change the comparison metric, and cancel another edit. Expect completion only for the displayed valid option sets. Check linked products, demos, a third product, and mixed currencies too.
- Save from Analyze/Compare/Queue, mark an item bought, then save it again unchanged. Expect successful saves but only one purchase event for that transition. Save a review, then use Print receipt; canceling the print dialog still counts as using the action.
- Test blocked/full storage in a disposable browser profile: failed saves must produce no save/purchase/review success events. Confirm existing records and calculations still behave as before.
- Inspect debug payloads with deliberately distinctive fictional names, amounts, notes, and query/fragment values. Expect fixed event names, no custom data, and only sanitized page URLs. Confirm no new analytics cookies or storage entries. Test with analytics blocked and verify the product remains usable.

After your own deployment, verify sanitized `view` and `event` requests in DevTools Network and then check the Production dashboard. Local debug checks cannot prove dashboard ingestion.

## Implementation validation

- Typecheck, ESLint, all 84 Node tests, and the production Webpack build passed.
- Headless Chrome checks against both the local production build and development/React Strict Mode passed for all ten events, initial loads, saved-receipt reopening, failed saves, print actions, edit cancellation, repeat purchase saves, storage refreshes, comparison metric changes, and returning to Queue.
- Browser checks blocked the external analytics script and inspected calls into the official SDK's queue plus the registered URL sanitizer. No test activity was sent to Vercel; production ingestion must be checked after a user-initiated deployment.
