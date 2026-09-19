# Supabase: authentication and cloud product storage

This stage adds optional email/password accounts and cloud storage for product Queue/Purchases. Analyze remains public. Existing calculations, receipt printing, analytics, routes and local storage formats remain intact. There is no payment system, automatic migration, offline write queue or background upload.

## Inspected records and call sites

Queue and Purchases previously shared `ProductRecord` in `app/products/product-model.ts`, stored under `decisionlab.products.v1` by `product-storage.ts`. A record contains an ID, creation/update timestamps, complete `ProductAnalysis`, decision status/reason, optional reconsideration/scheduling dates, the frozen `purchaseEstimate`, and optional `PurchaseReview`.

- `analyze-workspace.tsx`: create and edit receipts.
- `compare-workspace.tsx`: read records and save independent copies.
- `queue-workspace.tsx`: read, update decisions/status/dates, delete, view/print receipts.
- `purchase-library.tsx`: read bought items and save actual-use reviews.
- `product-insights.tsx`: read records for insights.
- `use-products.ts` (now `.tsx`): shared read hook, expanded into storage providers and mutation API.
- `app/data-backup.ts` and `app/components/data-backup.tsx`: local export/import only. Neither accesses the cloud.
- Existing product tests directly exercise local storage functions.

Legacy GoalLens saved decisions (`decisionlab.saved-decisions.v1`), savings goals and simulator scenarios are different records and remain local.

## Proposed and implemented schema

| Table | Fields |
| --- | --- |
| `public.queue_items` | UUID `id`; `user_id → auth.users`; server-maintained `created_at`/`updated_at`; JSONB `analysis` containing all existing analysis/score fields; `status`; `reason`; `reconsider_on`; `scheduled_on` |
| `public.purchases` | UUID `id`; `user_id → auth.users`; `queue_item_id` with a unique `(queue_item_id, user_id)` pair; server-maintained `created_at`/`updated_at`; frozen JSONB `purchase_estimate`; nullable JSONB `review` containing all existing actual-cost, usage, satisfaction, lifecycle and reflection fields |

Matching composite UNIQUE and foreign-key constraints ensure the API embeds each purchase as one object, not an array. The foreign key `(queue_item_id, user_id)` prevents linking a purchase to another user's queue item. Queue keeps all statuses, including bought, so the existing “All analyses and decisions” view still works. Marking bought captures the prediction exactly once. Moving away from bought retains the snapshot/review for later. Deleting a product explicitly deletes its linked purchase/review in the same transaction. Deleting an Auth user cascades their cloud records.

Both tables enable RLS with separate SELECT, INSERT, UPDATE and DELETE policies for `authenticated`, restricted to `user_id = auth.uid()`. UPDATE includes both `USING` and `WITH CHECK`. Anonymous access is revoked. The `mutate_product` RPC is **SECURITY INVOKER**, not a privileged bypass. It checks the requested owner, locks the queue row, verifies `updated_at`, and saves changes atomically. Prediction/identity triggers reject overwrites. JSON is checked again with the existing runtime validators on reads; malformed data pauses saving rather than replacing data with an empty list.

## Configure Supabase

1. Create/select your Supabase project.
2. In **SQL Editor**, run the entire [migration](../supabase/migrations/202609200001_cloud_products.sql) once. It includes both tables, indexes, foreign keys, RLS policies, triggers, grants and the transactional function. Do not run individual table snippets without the policies. The migration intentionally fails if these tables already exist; inspect existing schema before applying it to a nonempty project.
3. In Authentication, enable the **Email** provider and email/password signups. Keep email confirmation enabled. Set the minimum password length to at least 8 characters to match the UI.
4. Set **Site URL** to your production DecisionLab origin. Add these **Redirect URLs**, replacing the example production domain:
   - `http://localhost:3000/account`
   - `https://YOUR-DECISIONLAB-DOMAIN/account`
   - Any exact preview origin's `/account` URL you explicitly want to test.
5. Configure email delivery for real users. Supabase's default mail service is limited; use your own SMTP configuration for production signups. No email provider credential belongs in the frontend.
6. Copy the project URL and **public anon key** from project settings. Never use a `service_role` or secret key.

Copy `.env.example` to `.env.local` and fill in:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLIC_ANON_KEY
```

Add the **same two variable names** in **Vercel → Project → Settings → Environment Variables** for each intended environment (Production/Preview/Development). Public values are embedded at build time: restart local development after changes, and create a new Vercel deployment yourself when ready. No deployment or push is performed by this implementation. No service-role key or additional private variable is needed by the app.

If either variable is absent, the application builds and works in local-only mode; Account explains that cloud saving is unavailable. If configured authentication fails, saving pauses rather than guessing the user is logged out.

## Architecture and behavior

- `app/lib/supabase/client.ts`: one browser client, only public variables, persistent sessions, token refresh and bounded network requests.
- `database.types.ts`: database row and RPC types.
- `auth/auth-provider.tsx`: session initialization and auth-change subscription. Auth resolves before a storage scope becomes writable.
- `account/`: minimal signup/signin/signout UI. Confirmation redirects to `/account`; the Supabase client handles its implicit email confirmation callback. All private data access is client-side and protected by database RLS; there is no server-rendered user data or auth-cookie middleware to maintain in this stage. Server-side private routes would require a separate SSR auth integration.
- `products/cloud-repository.ts`: central Supabase queries and RPC calls, always scoped to the captured owner.
- `cloud-records.ts`: validates/reconstructs the original `ProductRecord`, so receipt/calculation/review components retain their data contracts.
- `cloud-store.ts`: confirmed writes only, stale-response suppression, in-flight write lock, retained records after failures, refresh on return to the tab and explicit refresh.
- `use-products.tsx`: chooses anonymous local storage or an isolated cloud provider per account. Account changes discard prior in-memory account views, not persisted records. It never writes cloud records into the local product key.
- `storage-status.tsx`: local/cloud/loading/failure state and manual cloud refresh. This is server-backed saving, not live collaborative editing; another device's changes appear on reload, tab focus or refresh.

When a request fails or its response is lost, the app does not claim success or remove the displayed data. A request might have committed before its response was lost: refresh before retrying. New receipt attempts reuse their ID after an uncertain request to avoid duplicate inserts. Stale edits are rejected; reload the saved version before editing again. Form entries remain visible during ordinary load/save errors. Signing out or switching accounts resets account-scoped editors to prevent one account's drafts appearing in another account.

The backup panel still exports/imports **local records only**, even while signed in. It is labeled accordingly. Signing out restores the previous browser records unchanged. Cloud data is neither merged nor downloaded into local storage. Local goals/GoalLens/scenarios remain visible as local supporting tools while signed in.

## Validation and limits

Run:

```sh
npx tsc --noEmit --incremental false
npm run lint
node --test tests/*.test.mjs
npm run build
```

`cloud-database.test.mjs` runs the actual migration in embedded PostgreSQL (PGlite) with Supabase-style Auth roles. It tests anonymous denial, owner access, cross-account CRUD denial on both tables, forbidden cross-owner relationships, stale writes, atomic rollback, immutable predictions and cascading deletion. `cloud-products.test.mjs` tests record validation, load/save errors and late responses across account changes.

The browser integration check exercises the real Supabase SDK with mocked Auth/REST transport and the same PostgreSQL schema. Start a separate test server with dummy settings (never use a real Supabase project for this fixture):

```sh
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54329 NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key npm run dev -- --webpack --port 3101
BASE_URL=http://localhost:3101 node tests/cloud-auth.browser.cjs
```

If your normal development server is running, use an isolated copy with the same dependencies. The browser check intercepts the dummy service's requests; it needs local Chrome (or `CHROME_PATH`). It covers signup confirmation UI, invalid signin, signin/signout, local/cloud separation, cloud CRUD/reviews, retry behavior, two-account isolation and responsive Account layout.

References: [Supabase password authentication](https://supabase.com/docs/guides/auth/passwords), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security), [auth state changes](https://supabase.com/docs/reference/javascript/auth-onauthstatechange).

These tests do not provision or configure your hosted Supabase project. Real email delivery, your redirect allowlist, hosted API settings and production RLS must be checked after you apply the SQL and environment variables.

## Manual acceptance checklist

1. **Local baseline:** signed out, create/save a receipt, mark it bought and save a review. Reload and confirm it persists. Export a local backup.
2. **Signup:** open Account, create account A, confirm the email, and return to Account. Verify failed/duplicate signup and bad-password messages are unobtrusive. Analyze should still work while signed out.
3. **Signin:** sign in to A. The storage indicator should say cloud. A new account's Queue/Purchases should be empty; the local record must not be uploaded.
4. **Queue:** save a new analysis, edit assumptions, change status/reason/date, reload, and verify persistence. Open/print the receipt. Save an independent Compare copy. Open the same account on a second device/session and verify its records.
5. **Purchases:** mark the cloud item bought, save actual costs/usage/rating/reflection, reload, and check predicted-vs-actual. Editing the analysis must leave the original purchase prediction intact. Move away from bought and back; the review must remain.
6. **Failures/concurrency:** disable network while saving/reviewing/deleting. Verify the UI shows failure and preserves entries/local storage; reconnect and refresh before retrying. Edit the same cloud record in two tabs: the older version must fail instead of overwriting. No false “saved” message.
7. **Signout:** sign out. Only the original browser records should appear. Sign back in to A: cloud records return. No local data should disappear or change.
8. **Isolation:** create/sign in to B in a separate browser profile. A's records must not appear, even if you paste their IDs into Analyze/Compare links. Using B's access token against the Data API, verify SELECT cannot return A's rows, UPDATE/DELETE affect no A rows, INSERT with A's `user_id` fails, and linking a purchase to A's queue fails. Repeat with A and B swapped, and verify anonymous requests are denied.
9. **Delete:** explicitly confirm deletion of one cloud product. Its receipt/review should disappear after reload; other products and local records should remain.

## Files changed in this stage

`app/products/use-products.ts` was replaced by `app/products/use-products.tsx` to provide a shared React storage context. The existing `product-storage.ts`, product model and all calculation modules are unchanged.

| Change | File |
| --- | --- |
| Modified | `.gitignore` |
| Modified | `README.md` |
| Modified | `app/about/page.tsx` |
| Modified | `app/components/data-backup.tsx` |
| Modified | `app/components/site-footer.tsx` |
| Modified | `app/components/site-navigation.tsx` |
| Modified | `app/error.tsx` |
| Modified | `app/insights/page.tsx` |
| Modified | `app/layout.tsx` |
| Modified | `app/page.tsx` |
| Modified | `app/products/analyze-workspace.tsx` |
| Modified | `app/products/compare-workspace.tsx` |
| Modified | `app/products/product-insights.tsx` |
| Modified | `app/products/products.css` |
| Modified | `app/products/purchase-library.tsx` |
| Modified | `app/products/queue-workspace.tsx` |
| Replaced by .tsx | `app/products/use-products.ts` |
| Modified | `package-lock.json` |
| Modified | `package.json` |
| Modified | `tests/workspace-fallback.test.mjs` |
| Added | `.env.example` |
| Added | `app/account/account-form.tsx` |
| Added | `app/account/page.tsx` |
| Added | `app/auth/auth-provider.tsx` |
| Added | `app/lib/supabase/client.ts` |
| Added | `app/lib/supabase/database.types.ts` |
| Added | `app/products/cloud-records.ts` |
| Added | `app/products/cloud-repository.ts` |
| Added | `app/products/cloud-store.ts` |
| Added | `app/products/storage-status.tsx` |
| Added | `app/products/use-products.tsx` |
| Added | `docs/SUPABASE_SETUP.md` |
| Added | `supabase/migrations/202609200001_cloud_products.sql` |
| Added | `tests/cloud-auth.browser.cjs` |
| Added | `tests/cloud-database.test.mjs` |
| Added | `tests/cloud-products.test.mjs` |

## Implementation validation result

- TypeScript check, ESLint (no warnings), all 111 Node tests and production build passed.
- Existing anonymous browser regression passed at 320, 390, 768, 1024, 1200 and 1440 pixels, including the complete product workflow, validation, local save, receipts/reviews, dark mode, reduced motion, invalid storage, no-JavaScript and blocked-hydration fallbacks.
- Cloud browser regression passed with mock Auth/REST transport and real embedded PostgreSQL/RLS: signup confirmation messaging, invalid/valid signin, cloud Queue and Purchases persistence, receipt viewing, save failure/retry, signout, account isolation, no local-data migration/overwrite, load outage behavior and Account layout at 320/390/1440 pixels.
- Hosted Supabase activation, real confirmation emails and production redirect configuration remain operator checks. No live project was configured, and nothing was pushed or deployed.
