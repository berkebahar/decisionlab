# Public aggregate usage on About

The About page includes **DecisionLab in use**, showing real production totals from the existing Vercel Web Analytics integration. It uses Vercel's official server-side count API, so no additional counter database, public write endpoint, event emitter, or storage service is needed.

## Source and meaning

Vercel documents count endpoints as production-only totals since Web Analytics was enabled. We omit `since`/`until`, so these are cumulative counts available from that source, not a rolling window and not reconstructed historical activity. Product actions only exist from when their tracking was deployed. Nothing is extrapolated or backfilled.

| Public label | Source |
| --- | --- |
| PAGE VIEWS | `GET /v1/query/web-analytics/visits/count`, `data.pageviews` |
| ANALYSES COMPLETED | `GET /v1/query/web-analytics/events/count`, filtered to `analysis_completed`, `data.count` |
| COMPARISONS MADE | Same count endpoint, filtered to `comparison_completed` |
| DECISIONS SAVED | Same count endpoint, filtered to `decision_saved` |
| RECEIPTS PRINTED | Same count endpoint, filtered to `receipt_printed` |
| PURCHASES RECORDED | Same count endpoint, filtered to `purchase_recorded` |
| REVIEWS COMPLETED | Same count endpoint, filtered to `review_completed` |

**Page views include repeat visits and navigation between pages. They are not unique visitors.** The UI explicitly says this and uses PAGE VIEWS rather than the ambiguous VISITS label. Counts reflect tracked activity, so blocked scripts, collection limits, and provider processing delays can affect them. They do not claim to measure every human action.

Existing event definitions remain unchanged. In particular, decisions saved includes successful explicit saves and updates in Analyze/Compare/Queue; receipt printing measures the Print action, even if the dialog is canceled. Explicit demo interactions can be counted. See [the full event definitions](ANALYTICS.md#event-definitions).

Sources: [Vercel API guide](https://vercel.com/docs/analytics/web-analytics-api), [page-view count endpoint](https://vercel.com/docs/rest-api/web-analytics/counts-page-views), [custom-event count endpoint](https://vercel.com/docs/rest-api/web-analytics/counts-custom-events).

## Required setup

1. Enable Web Analytics for DecisionLab in Vercel and deploy the existing event integration yourself. Custom events require an eligible Vercel plan (currently Pro or Enterprise).
2. Create a Vercel access token that can read analytics for this project, with the narrowest available account/team scope. Use a dedicated token and manage its expiry/rotation through Vercel.
3. Add these **server-only** environment variables in Vercel Project Settings → Environment Variables:

   | Variable | Required | Value |
   | --- | --- | --- |
   | `VERCEL_ANALYTICS_TOKEN` | Yes | The Vercel access token; keep it secret. |
   | `VERCEL_ANALYTICS_PROJECT_ID` | Yes | DecisionLab's project ID from Project Settings. |
   | `VERCEL_ANALYTICS_TEAM_ID` | For a team-owned project | The owning team's ID. Omit for a personal-account project. |

   Enable them for Production. For local verification, put the same variable names in ignored `.env.local`. Preview needs these only if you intentionally want previews to display the production totals. None of these names should use a `NEXT_PUBLIC_` prefix.

4. Deploy when you choose. Changing Vercel environment variables requires a new deployment. Confirm the About totals against Vercel's production count API; dashboard comparisons need matching event filters and date coverage.

No credentials were created or filled in by this implementation. Without configuration, About remains functional and shows “Usage totals will appear here when available.” A permission/plan error, rate limit, timeout, invalid JSON, or invalid/missing count hides the affected metric. Available metrics continue to display. Only an explicit, valid zero from Vercel can appear as zero.

Official setup references: [API authentication and prerequisites](https://vercel.com/docs/analytics/web-analytics-api#prerequisites), [custom-event plan availability](https://vercel.com/docs/analytics/custom-events).

## Privacy and exposure

- The data module imports `server-only`; Next.js rejects importing it into browser code. Credentials are used only in the Authorization header to the fixed `https://api.vercel.com` origin. Redirects are rejected.
- Only seven fixed count queries are supported. URLs, filters, project IDs, and event names cannot be supplied by a visitor. No breakdowns, visitor queries, raw event logs, or event data are requested.
- The server validates nonnegative safe-integer counts and constructs new objects containing only a fixed metric ID, a fixed label, and its total. Upstream response objects, query metadata, and errors are never forwarded to the public page or logged by this module.
- The public surface is server-rendered About HTML and its normal Next.js page payload. It contains only aggregate totals and explanatory copy. No new public read API or write API is introduced.
- Next.js caches aggregate count responses and the rendered page. There is no new database, raw event store, browser storage key, visitor identity, fingerprint, or cookie. Vercel retains the existing analytics data under its normal policies.
- No names, emails, IP addresses, visitor identifiers, product names, prices, savings, financial inputs, notes, or other user-entered data are exposed or newly collected/stored by this feature. Existing local product data is never read for these statistics.

## Counting and caching

Displaying or refreshing these totals does not increment custom events. The existing handlers and ref guards continue to emit one event per meaningful action: successful receipt generation, valid displayed comparisons, successful saves, purchase transitions, saved reviews, and Print actions. React re-renders, effect replay, storage notifications, and reading totals do not add another emitter. Viewing About itself remains a normal tracked page view.

Both the server fetch cache and the About page's ISR interval are **600 seconds**. There are seven small parallel count requests on a cold cache or refresh, each with a five-second timeout. Normal page renders use the cached page instead of querying Vercel. The rendered unavailable/partial state is cached too, preventing repeated failing requests on every page view.

Revalidation is request-driven: after ten minutes, the next request can receive the previous snapshot while regeneration runs; subsequent requests receive the refresh. Idle sites update when visited again, and provider delays/outages can make totals older. An already open page does not poll. Development may bypass Next's fetch cache on hard refresh, so use a production build to check caching behavior.

## Validation and local checks

Run:

```sh
npx tsc --noEmit --incremental false
npm run lint
node --test tests/*.test.mjs
npm run build
npm start
```

The new tests cover missing configuration, fixed queries, ten-minute fetch caching, exact metric selection, secret/extra-field exclusion, confirmed zero versus missing values, invalid counts, malformed responses, partial provider failures, and both available/unavailable HTML. Test fixtures exist only in tests; there is no sample-data switch or fallback count in production code.

Before deployment, inspect `/about` at mobile and desktop widths in both themes. With no credentials, verify the placeholder and absence of numbers. With valid server credentials, compare the displayed totals to the provider, verify that the browser makes no direct requests to `api.vercel.com`, and check that rendered HTML contains no token or provider response data. Invalid credentials should gracefully remove unavailable metrics. Production responses should have a 600-second revalidation interval. Publishing requires your own push/deployment; this implementation does neither.

Implementation checks passed: typecheck, lint, 91 tests, and the production build. The build reports a ten-minute revalidation interval for About. Headless Chrome verified its unavailable state and 600-second HTTP cache header, plus mobile/desktop layouts at 320, 390, 768, and 1440 pixels in both themes. A separate temporary test fixture exercised the populated renderer; its numbers are not shipped in the application. The browser assets contain no analytics read credentials or query code. Live authenticated Vercel responses could not be verified without the required configuration.
