# Optional decision research

DecisionLab now collects optional, anonymous before/after purchase intention and decision confidence around a new True Cost Receipt. Neither answer changes any calculation or saved product. There is no public dashboard, research read endpoint, account association, background submission, or partial-response table.

## Inspection and integration boundary

- `ProductForm` has four input steps: Product, Ownership, Purpose, Financial context. Required product name/price and ownership duration/usage are entered in the first two steps; conditional inputs are required only when their optional features are enabled. Native validation runs on each step. The final `submit()` constructs a `ProductAnalysis` and checks the complete object with `isAnalysis()` before calling `onComplete`.
- Previously, `AnalysisEditor.onComplete` immediately switched out of editing and mounted `TrueCostReceipt`. `analyzeProduct(a)` calculates the result during that component's render. Its committed `.receipt-results` markup is readable immediately; receipt animation does not gate it. Other uses of the receipt include demos, Compare, Queue and Purchases.
- The new before card appears after that complete-object validation and before the receipt mounts. The existing result calculation remains in `TrueCostReceipt`, unchanged. Continue/Skip mount the same receipt and focus its heading. Existing `analysis_completed` tracking stays at receipt reveal.
- The after card appears below the receipt only after at least half the totals area has entered a visible browser viewport. Background tabs do not qualify. Intersection observation has scroll/resize/visibility fallbacks; no observation data is stored. Being visible is not proof that a person read or understood the receipt.
- Products already use a fixed broad `category` plus a separate `customCategory` string. Research allowlists only the fixed category. A custom product sends the literal `custom`, never the entered category text.
- Supabase had one browser client with persistent auth, bounded fetches, typed tables and per-user RLS. There was no server Supabase utility. Research uses the same public configuration and SDK, with its own stateless client and separate in-memory auth storage namespace. It never loads or forwards the account session.
- Vercel custom analytics already accepts names without properties and strips URL query parameters and fragments. Research uses that same helper.
- Product provider notifications, receipt interactions, cloud refreshes and React effects can rerender the editor. `AnalysisEditor` is keyed by record/demo selection. `app/template.tsx` remounts route content on navigation; account/storage-scope changes also remount editors. Research writes are never effects, so none of these trigger submission.

## Data flow and participation

1. The first valid submission in a fresh, non-demo Analyze editor creates a random UUID and an in-memory `ResearchSession`. If UUID generation fails, the receipt opens normally.
2. Before answers start blank. Continue with both values retains the pair in memory. Continue with incomplete answers, or Skip, opts out and reveals the receipt immediately. There is no request before the receipt.
3. Receipt visibility enables the after card, with a new blank set of controls. After Skip discards the retained pair. Editing assumptions also discards an unfinished pair, preventing answers about different analyses from being combined.
4. An explicit Submit response with both after values synchronously claims the session. The payload builder copies exactly the eight permitted fields and derives `intention_changed` and `confidence_change`.
5. One insert goes directly to Supabase using the public anon key, even for signed-in participants. It requests no returned row, omits browser credentials/referrers, times out after eight seconds, and disables SDK retries. Success replaces the card with a brief thank-you. Failure replaces it with a quiet message while the receipt and normal save actions remain available.
6. The database supplies its own ID/timestamp and checks validity, consistency and uniqueness. Nothing is written to Queue, Purchases or either browser storage API by research.

Reopened receipts, copies of existing records, fictional demonstrations and subsequent edits within an already exposed editor do not prompt again. Their result has already been available, so treating an answer as an unexposed baseline would be misleading. Starting a fresh Analyze session is independently eligible. No attempt is made to recognize a returning person.

## Duplicate protection and lifecycle

- The form-completion ref prevents two completion callbacks from creating two research sessions.
- One UUID is created in the explicit validated completion handler, never during render/effect, and retained for that analysis only.
- The session changes to `submitting` synchronously before awaiting I/O. Double clicks, stale handlers and rerenders cannot claim it again. Both success and failure are terminal; there is no automatic or manual research retry loop.
- A retained browser history page retains its session lock. A remounted/refreshed editor loses all research state and has no response to replay. Opening a saved receipt does not reconstruct research participation. Unsaved analysis refresh behavior remains the existing behavior: the form resets; saved products are preserved.
- The unique database constraint on `session_analysis_id` rejects repeat API requests, including requests under a different role. A duplicate-key response is treated as already complete. The record ID and timestamp are server-generated and cannot be supplied by public clients.
- A deliberate new analysis gets an unrelated UUID. This limits duplicates per analysis, not per person. No UUID enters a URL, analytics payload, cookie, localStorage, sessionStorage, product record, or backup.

## Privacy and security

The only dataset columns are the migration's ID, timestamp, analysis-session UUID, broad category, four answers and two derived values. There are no foreign keys or identifiers joining to accounts, Queue or Purchases; no product names, prices, free text, IP/location fields or fingerprints. Application code neither gathers these for research nor logs research payloads/errors. Ordinary hosting/network infrastructure logs are separate from this dataset; this feature does not configure their retention.

The migration enables RLS, revokes default table privileges from PUBLIC/anon/authenticated, and grants INSERT only on the eight response columns. A single insert policy permits both public roles; CHECK and NOT NULL constraints enforce complete valid data and correct derived values. There are no public SELECT/UPDATE/DELETE policies or grants, and INSERT RETURNING is denied. Existing tables/policies are untouched. No service-role key or privileged server route is introduced.

Events are only `research_prompt_seen`, `research_before_completed`, `research_skipped`, and `research_response_completed`, with no properties. Prompt events describe each rendered research prompt; they are coarse instrumentation, not a persisted exposure or participant record. Completion is tracked only after a confirmed successful insert (or a duplicate-key response).

## Reusable internal aggregation

`summarizeResearch(validCompletedRows)` returns total responses, changed-intention percentage, average confidence before/after/change, before/after counts and percentages for Yes/Maybe/No, and all nine transition counts. `aggregateResearch(rows)` includes the same summary for every broad category and the null-category group. Empty groups have zero counts/distributions and null averages/change percentage, distinguishing no evidence from no change. Values are not rounded prematurely.

These pure functions take already validated completed rows supplied by trusted internal code. They do not fetch data, return raw rows, or participate in the browser bundle. Future private reporting must provide its own authenticated server-side read authorization. No new public endpoint exists.

This is exploratory paired analysis of sessions. Optional participation and dropout create selection bias; people can contribute multiple independent sessions; no control group establishes causation. Report confidence changes separately from intention changes, with no good/bad labels. The implementation deliberately does not add demographics, visitor identifiers or additional research questions to address those limitations.

## Manual Supabase setup

1. Run the **entire** [202609220001_decision_research_responses.sql](../supabase/migrations/202609220001_decision_research_responses.sql) migration once in the intended project's SQL Editor, or apply it with your normal Supabase migration workflow. It is transactional and intentionally not an overwrite of an existing table. It has no dependency on the cloud-products migration.
2. Keep the existing `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` public configuration. No new environment variables, auth provider changes or service-role credentials are needed. If adding/changing public variables, restart development or rebuild the deployment.
3. In Supabase, confirm RLS is enabled, the sole public policy is INSERT, and public roles have only the listed column INSERT privileges. Check one anonymous and one signed-in completed pair using the privileged SQL Editor. Public clients must fail to read, update, delete or insert with RETURNING.
4. Do not enable a public read policy to inspect the dataset. Use the operator SQL Editor or a future properly authorized private server report.

The hosted migration has **not** been applied. No live Supabase data was accessed or changed, and nothing was pushed or deployed.

## Manual acceptance checklist

- [ ] **Anonymous complete pair:** start a fresh analysis; confirm no receipt is visible on the before card. Answer Yes/5, Continue, view the totals, answer No/1 and submit. Operator sees exactly one row with `intention_changed = true`, `confidence_change = -4`, and no product/account fields.
- [ ] **Signed-in complete pair:** repeat while signed in. The research request still uses the public anon key, not the account access token. Queue/Purchases remain in cloud mode. Confirm one row.
- [ ] **Skip research:** Skip before, including after selecting only one value. Receipt appears; after card never appears; no request/row. Also check Continue with no/incomplete before answers.
- [ ] **Before answered / after skipped:** answer both before values, reveal totals, then Skip after. No request/row. A half-filled after section cannot be submitted.
- [ ] **Confidence-only change:** Maybe/2 → Maybe/5 stores false/+3; Yes/5 → Yes/2 stores false/−3. Equal scores store zero. No outcome is described as good/bad.
- [ ] **Refresh:** refresh before, after, and after submitting. No automatic insert or restoration of research answers. Existing saved products survive; unsaved forms retain their previous reset behavior.
- [ ] **Duplicate clicks/requests:** double-click Continue and Submit response. One UUID and at most one row. Replay the same API payload; uniqueness rejects it. Navigate away/back/forward; no replay.
- [ ] **Edit/reopen/demo:** Edit assumptions after answering before, then regenerate or cancel editing. No unfinished pair is submitted. Reopened Queue/Purchase receipts, duplicates and demos do not show research cards.
- [ ] **Mobile/accessibility:** check 320/390px and desktop, both themes, reduced motion, keyboard Tab/arrow keys and a screen reader. No overflow; each choice has a 44px target; scales start blank; before heading and revealed receipt receive focus; after never steals focus. Confirm the totals enter view before after appears.
- [ ] **Supabase unavailable:** fail only the research POST, or test missing configuration/migration. Receipt, Print, Edit and Save still work. A quiet failure appears, no retry loop or technical details. Test normal local saves with browser research network blocked.
- [ ] **Queue/Purchases:** save the receipt, mark bought, add a review, reload, edit an estimate and compare. The original purchase estimate and existing account isolation remain intact.
- [ ] **No-account mode:** signed out, save/reload locally, export/import a backup, and switch to/from an account. Research adds no browser storage key and never uploads local products.
- [ ] **Privacy/printing:** custom category text is absent from the POST; only the broad `custom` label is present. Analytics has no properties. Receipt printing excludes both research cards, selections and status messages.

## Files

Created:

- `app/research/decision-research.ts`
- `app/research/research-session.ts`
- `app/research/submit-research.ts`
- `app/research/research-aggregates.ts`
- `app/research/research-card.tsx`
- `app/research/research.module.css`
- `supabase/migrations/202609220001_decision_research_responses.sql`
- `tests/decision-research.test.mjs`
- `tests/research-database.test.mjs`
- `tests/research-submission.test.mjs`
- `docs/DECISION_RESEARCH.md`

Modified:

- `app/products/analyze-workspace.tsx`
- `app/lib/supabase/database.types.ts`
- `app/analytics.ts`
- `tests/analytics.test.mjs`
- `tests/cloud-auth.browser.cjs`
- `tests/product-polish.browser.cjs`

## Validation

All checks below passed on the final implementation. Browser tests used isolated local builds with dummy Supabase configuration and temporary Chrome profiles; no hosted research rows were created.

- Typecheck: `npx tsc --noEmit --incremental false`.
- Lint: `npm run lint`.
- Unit/database/transport regression: `node --test tests/*.test.mjs` (119 tests).
- Production: `npm run build`; the existing next/font setup requires Google Fonts network access.
- Print: `node tests/receipt-print.browser.cjs` (20 existing A4/Letter cases).
- Browser: extended `tests/cloud-auth.browser.cjs` uses the real Supabase SDK, mocked Auth/REST transport, and actual PostgreSQL migrations/RLS. It verifies anonymous/signed-in paired inserts, duplicate clicks, the reveal boundary, skips, incomplete answers, refresh/navigation/edit abandonment, failure isolation and 320/390/1440px cards, alongside existing account/Queue/Purchases behavior. It must run against dummy Supabase settings, as described in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).
- Browser: `tests/product-polish.browser.cjs` skips the optional card and checks the existing full local workflow and responsive pages at six widths. Browser artifacts use temporary profiles and directories; no personal browser profile is used.
- Existing `tests/cost-motion.browser.cjs` and `tests/visual-atmosphere.browser.cjs` also passed against the isolated production build, including both themes, reduced motion, decorative accessibility, mobile behavior and static print.

Hosted Supabase configuration and real-device/screen-reader acceptance remain the operator checks above.
