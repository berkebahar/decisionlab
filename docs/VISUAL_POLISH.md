# Focused visual polish

## Homepage typography

A slow, oversized **BUY · OWN · USE · RESELL · TRUE COST** ribbon now sits behind the existing hidden-cost scene. It is decorative, clipped to its own layer, and does not occupy layout space. No explanatory sections, examples, or information were added.

The ribbon reuses the existing homepage IntersectionObserver and **Pause atmosphere** control. Its 90-second CSS transform loop pauses outside the viewport, when the document is hidden, and when the user pauses atmosphere. There is no new continuous JavaScript animation. It becomes static on mobile and with reduced motion, and is hidden in print and forced-colors mode.

Production Chromium page heights at a 900px viewport height are unchanged from the simplified homepage:

| Width | Before and after |
| --- | ---: |
| 1440px | 7,088px |
| 1200px | 6,961px |
| 1024px | 6,815px |
| 768px | 5,422px |
| 390px | 7,006px |
| 320px | 7,055px |

## Analyze

- Compact forest entrance: **Analyze / See what it really costs.** Reuses the existing botanical image, vector shadows, forest/ivory/champagne palette, and editorial typeface.
- One opaque ivory form surface, refined field borders and focus rings, and less visual nesting. The form remains full-width and simple on phones.
- Numbered steps have clear active and completed states. The native progress bar remains accessible. Mobile steps fit into a single row with readable labels.
- Step transitions use a brief opacity change; fields do not translate or drift.
- On receipt generation, the surrounding surface settles into forest green and the existing ivory receipt enters in 360ms. Existing receipt focus, actions, calculations, and printing are retained.

## Queue

- Editorial entrance: **Queue / Give the decision some space. / Save it now. Reconsider it later.**
- Saved records retain a compact list structure with thin dividers, stronger product names, and aligned estimated True Cost and cost per use. Both values come from the already-computed `analyzeProduct(record.analysis)` result. Zero uses display **Not available** for cost per use.
- Receipt actions are grouped separately from Edit assumptions, Compare, and Duplicate analysis. Existing status/date editing stays in its disclosure; no new purchase actions or persistence paths were added.
- Considering, postponed, bought, and skipped use restrained surfaces, borders, and dots alongside their existing text labels. Meaning does not depend on color.
- Records settle briefly on entry. Status/date changes fade subtly, and opening the existing receipt introduces the paper gently. Queue has no looping ambient animation.

## Motion, accessibility, and performance

Analyze and Queue's decorative entrance type moves once for four seconds on desktop, then stops. It never appears behind fields. All entrance typography is static below 761px and with reduced motion. Feedback animations are short; existing reduced-motion rules disable them.

All decorative typography is `aria-hidden`, inert, and contains no controls. Semantic headings, labels, native progress semantics, keyboard navigation, validation, and receipt focus remain intact. Print excludes decorative layers and all new workspace treatment is screen-only. CSS is scoped to these workspaces and the homepage type, so styles cannot change other routes after client navigation.

No packages, brand colors, routes, product features, or new financial calculations were added. Analytics, public usage statistics, storage/migrations, and credentials are unchanged.

## Validation

- `npx tsc --noEmit --incremental false` — passed.
- `npm run lint` — passed.
- `node --test tests/*.test.mjs` — **96 passed**.
- `npm run build` — passed.
- `tests/product-polish.browser.cjs` — passed core workflows, saved receipt view/print, six responsive widths, expanded forms/receipts, touch targets, dark/reduced-motion states, and loading/hydration fallbacks.
- `tests/visual-atmosphere.browser.cjs` — passed homepage drift/pause/offscreen behavior, unchanged height, decorative accessibility, both themes at all six widths, step progression, stable fields, receipt focus, Queue estimates/statuses, and reduced-motion/static-print behavior.
- `tests/cost-motion.browser.cjs` — passed existing scroll easing, final-number glide, mobile controls, native wheel/touch scrolling, and reduced-motion fallback.
- `tests/receipt-print.browser.cjs` — **20 A4/Letter cases passed**, covering both themes, long input, zero uses/high resale, personal limits, and goal/alternative data. The new stylesheet is included in this regression.
- `git diff --check` — passed.

Run browser tests against `npm run start -- --port 3100`; override `BASE_URL` and `CHROME_PATH` if needed. Tests use temporary Chrome profiles and synthetic records. Nothing was pushed or deployed.

## Manual checks before committing

1. On desktop, scroll into the hidden-cost scene. Pause/resume atmosphere and check that headings, controls, and real values remain easy to read.
2. On a real phone, especially at 320–390px, check the Analyze title, five-step indicator, input focus, optional fields, and keyboard behavior. Check Safari as well as Chrome.
3. Complete an analysis, edit assumptions, generate the receipt again, and try the actual Print Receipt dialog and cancellation.
4. In Queue, check existing records across statuses. Open and print a receipt, update a status/date through the existing form, and verify keyboard focus and action grouping.
5. Enable reduced motion and try both color themes. Use VoiceOver/NVDA to confirm decorative words are skipped and real headings/controls are announced.

## Files changed in this pass

- `app/analyze/page.tsx`
- `app/queue/page.tsx`
- `app/layout.tsx`
- `app/decision-studio.css` — new scoped presentation styles.
- `app/components/editorial-type.tsx` — new decorative typography markup.
- `app/components/workspace-entrance.tsx` — new shared editorial entrance.
- `app/components/cost-scroll-story.tsx`
- `app/products/product-form.tsx`
- `app/products/queue-workspace.tsx`
- `tests/product-polish.browser.cjs`
- `tests/receipt-print.browser.cjs`
- `tests/visual-atmosphere.browser.cjs` — new visual regression checks.
- `docs/VISUAL_POLISH.md`
