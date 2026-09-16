# Homepage interaction correction

This is a focused execution pass over the existing homepage. No sections, product features, routes, packages, media assets, or financial calculations were added or removed. The sticky story, horizontal explorer, receipt transformation, navigation, and existing content remain.

## Sticky-scene corrections

- Within each stage, scroll progress now coordinates small changes to number position/scale, label position, image depth, supporting figures, and the foreground branch. The final receipt is stable.
- A changing total leaves a brief, decorative outgoing-value trail that scales away and softens over 260ms. The new financial value stays readable; values are never numerically interpolated or fabricated. The duplicate trail is hidden from assistive technology and cancelled for reduced motion and printing.
- Accessories, maintenance, subscriptions, and resale appear as clearly labelled supporting figures during the existing sequence. These are the same calculated amounts already present in the receipt.
- Geometry is cached on resize; scrolling reads the story position once per requested frame. There is no continuous JavaScript animation loop. Updates remain gated by visibility and the existing sticky eligibility rules.

## Proportion and overflow corrections

- Main story and lifecycle figures now use `clamp()` with container-relative units, so their type size follows the actual available column width.
- The final statement uses normal document flow instead of fixed offsets for its rows, total, and cost per use. This prevents content collisions.
- The live receipt results stack vertically, with cost per use separated by a rule. Its title and padding are more restrained on phones.
- Mobile hero typography scales down to fit 320px. Small-screen prediction/outcome columns stack, and the existing atmosphere control has room beside the scroll cue.
- Moving foliage stays inside its decorative clipping boundary; the page itself is not clipped to conceal overflow.

The first browser audit identified an over-wide moving decorative layer and crowded supporting figures. Both were corrected, then the complete viewport audit passed.

## Color and atmospheric continuity

- Broad homepage and horizontal-explorer surfaces now remain in deep forest and muted green, including the closing action. The original color identity and typefaces remain.
- Parchment is reserved for the receipt objects. The surrounding receipt section uses a green-tinted neutral in light mode and muted forest in dark mode, with soft gradient connections.
- Champagne remains a selective accent for costs, progress, and rules. Existing navigation/footer styling and utility-page themes are unchanged.
- The existing foliage layers sway slowly with different 24–37-second timings. No new image/video files or moving body copy were introduced.
- The existing rain pause control is labelled **Pause atmosphere / Resume atmosphere** and now pauses both rain and foliage. Loops pause offscreen and when the document is hidden. Reduced motion and forced colors remove the ambient animation; print removes it entirely.

## Mobile and accessibility

Phones and short viewports retain the complete static statement rather than a prolonged sticky sequence. Botanical travel is reduced on smaller screens. The explorer retains native horizontal swipe, vertical page scrolling, keyboard controls, and previous/next buttons. Reduced-motion mode shows all perspectives as a static list/grid. Main instructions, form fields, CTA text, and final financial results do not loop or drift.

## Files changed

- `app/components/cost-scroll-story.tsx` — coordinated scroll progress, bounded outgoing-number treatment, supporting cost figures, resize measurement cleanup.
- `app/components/landing-atmosphere.tsx` — visibility-gated ambient foliage and document-visibility pause.
- `app/components/botanical-rain.tsx` — existing pause control also governs the botanical atmosphere.
- `app/atmospheric-home.css` — slow ambient timings, shared pause, mobile amplitude, motion/print fallbacks.
- `app/editorial-story.css` — typography sizing, receipt flow, spacing, foreground containment, forest surfaces, and responsive corrections.
- `docs/HOMEPAGE_CORRECTION.md` — this report.

Calculation/storage modules, saved-data keys, migrations, product forms, Compare/Queue/Purchases interactions, and the print implementation are unchanged from the start of this pass. Earlier uncommitted work was preserved.

## Validation

All commands were run separately and time bounded:

| Check | Result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Passed |
| `npm run lint` | Passed |
| `node --test tests/*.test.mjs` | **77 passed**, zero failures |
| `npm run build` (`next build --webpack`) | Passed in 8.2 seconds; all ten routes generated |
| `node tests/receipt-print.browser.cjs` | **20 cases passed** |
| `git diff --check` | Passed |

Existing non-failing Node module-type warnings remain.

Browser checks covered **1440, 1200, 1024, 768, 390, and 320px** in both themes, including **30 desktop sticky states**. The audit found no document overflow, clipped sampled headings/figures, sampled secondary text below 12px, overlapping receipt rows, or uncaught browser errors after correction. Selected desktop/phone screenshots were visually inspected.

Motion checks passed for pause/resume with rain, offscreen foliage pausing, and switching to reduced motion. Native touch swipes and vertical scrolling passed. Further checks verified all five explorer figures at 320/375/768px, the static short-viewport fallback, and the live receipt changing from $2.17/use to $1.09/use at ten weekly uses without changing its $1,129 total.

Print remains white, dark-text, static, and isolated to the selected receipt. All 20 A4/Letter fixtures in both themes fit one page with text and full assumptions visible, including cancellation cleanup. Extremely long real entries still deserve native print-preview review.

No development server was started, no command hung, test browsers were closed, and nothing was pushed or deployed.

## Remaining manual review

The Chrome fixture uses real React components and CSS, with Next routing/image delivery shimmed. Before committing:

1. Review forward/reverse sticky scrolling and the outgoing-value treatment in the running Next app on your usual laptop.
2. Check real phone/trackpad gestures, the atmosphere pause control, reduced motion, and browser zoom.
3. Review Safari/Firefox, screen-reader navigation, and full Next client navigation; these were not verified in this fixture.
4. Inspect a real Print Receipt preview, including long entries and optional score/goal details. Physical-device performance and native printer output were not benchmarked.

## Follow-up: ambient typography

The existing horizontal cost explorer now has one faint, oversized editorial type ribbon: “Buy · Own · Use · Maintain · Resell”. It loops over 90 seconds behind the content, complementing the existing foliage rather than moving prices, instructions, or controls. No new section, media asset, package, or financial behavior was introduced.

- `app/components/cost-lifecycle.tsx` adds the decorative, assistive-technology-hidden layer.
- `app/components/landing-atmosphere.tsx` includes typography in the existing visibility observer. It observes the stationary clipping wrapper, avoiding observer churn from the moving text.
- `app/atmospheric-home.css` defines the transform-only loop, softer mobile opacity, shared pause control, offscreen/hidden-tab pause, static reduced-motion treatment, and removal from print/forced-colors views.
- `docs/HOMEPAGE_CORRECTION.md` records this follow-up.

Typecheck, lint, all **77 tests**, the production Webpack build (**8.3 seconds**), and **20 receipt-print cases** passed again with bounded checks. The existing non-failing Node module-type warnings remain. No development server was started.

A focused Chrome fixture checked both themes at **320, 390, 768, 1024, 1200, and 1440px**, with no document overflow or clipped cost figures. It verified animation without scrolling, stable financial figures, 44px explorer buttons, pause/resume, offscreen/hidden-document pause, reduced-motion static content, and print/forced-colors removal. Desktop and phone screenshots were inspected. The fixture uses actual components/styles with Next routing/image delivery shimmed; real-device performance, Safari/Firefox, screen-reader behavior, and full Next navigation still need manual review.
