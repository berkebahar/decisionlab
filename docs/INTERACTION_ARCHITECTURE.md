# Homepage interaction architecture

This change keeps DecisionLab's existing forest/ivory identity, type system, botanical image, navigation, product routes, and utility interfaces. It changes how the homepage composition develops as visitors move through it.

## Interaction modes

1. **Hero.** Existing message, primary Analyze action, botanical atmosphere, rain control, and native hidden-cost disclosure remain. The existing scroll link now leads into the cost story.
2. **Sticky cost story.** On viewports at least 1000px wide and 740px high, with motion permitted, an anchored composition spans 260 small-viewport-height units. Native page scroll selects five stages: purchase, accessories/maintenance, subscriptions, resale, and the complete receipt. The left heading stays anchored. The right visual changes image crop, printed rules, paper extent, number size/position, and eventually becomes an ivory statement. Financial values change at stage boundaries; they are not artificially interpolated.
3. **Horizontal lifecycle exploration.** One native horizontal strip presents sticker price, ownership expenses, resale, true cost, and cost per use through large typography and material details. Desktop mouse dragging uses Pointer Events with a horizontal intent threshold and capture cleanup. Touch uses native scrolling. Trackpad horizontal scroll and the visible scrollbar remain native; vertical wheel events are never remapped.
4. **Live receipt handoff.** The hero, sticky statement, explorer, and adjustable receipt use the same fictional camera assumptions. The existing receipt preview accepts an optional product and preserves its original default. Changing usage still invokes the unchanged product calculation. The separate laptop comparison remains explicitly labelled as another fictional example.
5. **Quiet continuation.** Existing comparison, Queue explanation, post-purchase example, creator information, supporting tools, and final Analyze action remain.

## Transition structure

The hero's foliage carries across the beginning of the sticky track. The price composition gradually introduces paper edges as costs accumulate, then uses the same number position as the receipt total. An overlapping ivory edge introduces the horizontal exploration; its paper surface carries into the real receipt section, with the existing botanical boundary detail. The remainder of the homepage returns to its calmer editorial rhythm.

This is a discrete layout/material transformation with native scrolling, not a scroll hijack or a succession of fade-in effects. No animation library, custom cursor, video, splash screen, or new downloaded media was added. The existing local botanical image is reused through Next Image.

## Calculation continuity

All illustrative figures come from the existing `analyzeProduct` function:

- Sticker price: $899.
- Accessories: $120 total.
- Maintenance: $90/year × 2 years = $180.
- Subscription: $10/month × 24 months = $240.
- Ownership expenses: $540; gross cost: $1,439.
- Expected resale deduction: $310.
- True cost: $1,129.
- Expected usage: 5/week × 104 weeks = 520 uses; rounded cost per use: $2.17.

Tax, shipping, and repairs are explicitly zero in this fictional example. Resale is labelled an estimate. No example writes to storage. Production financial formulas, storage keys, migrations, personal scores, records, and journals are unchanged.

## Accessibility, mobile, and performance

- Story stage buttons offer a direct alternative to scrolling, with pressed states and manual-change announcements. An explicit skip link leaves the sequence immediately. Scroll-driven changes do not flood a live region.
- The explorer has previous/next buttons, an outline when focused, and Arrow Left/Right, Home, and End controls. All five perspectives remain ordinary semantic list content. Dragging is optional.
- On smaller or shorter screens the sticky track becomes a complete static receipt. Mobile exploration uses native horizontal swipe, while vertical gestures continue to scroll the page. All five financial figures were checked for clipping down to 320px.
- Reduced-motion mode removes the sticky sequence and displays the final statement. The horizontal strip becomes a static grid/list with every perspective visible; decorative transitions are removed. Mouse-drag and custom arrow handling are disabled in that mode.
- Server-rendered HTML starts with the complete statement and all five lifecycle perspectives. Without JavaScript, native scrolling and the hero disclosure remain available; enhanced button interactions require JavaScript.
- IntersectionObserver gates sticky updates. Scroll work is coalesced to one requested animation frame and skipped outside the visible story or while the document is hidden. Listeners, observers, and frames are cleaned up on unmount. No continuous animation loop was introduced.
- Oversized media is intentionally cropped inside its own frame. Essential text and figures are not clipped. Normal form and utility-page typography is unchanged.

## Exact files changed in this pass

Created:

- `app/components/cost-story-model.ts` — shared fictional example, calculated story stages, lifecycle perspectives, and bounded scroll-stage selection.
- `app/components/cost-scroll-story.tsx` — sticky composition, direct stage controls, static fallback, and inline statement.
- `app/components/cost-lifecycle.tsx` — native horizontal explorer, mouse drag, keyboard/buttons, and progress feedback.
- `app/editorial-story.css` — scene layouts, responsive material transformations, section overlap, horizontal spreads, and motion/accessibility fallbacks.
- `tests/cost-story.test.mjs` — calculation continuity and scroll-boundary regressions.
- `docs/INTERACTION_ARCHITECTURE.md` — this report.

Modified:

- `app/components/hidden-cost-story.tsx` — uses the shared example, preserving its native disclosure and exact numbers.
- `app/page.tsx` — composes the new story/explorer, connects the live receipt, and updates sequence labels and the hero scroll link.
- `app/products/receipt-preview.tsx` — accepts an optional example while retaining the default product and usage control.
- `tests/receipt-print.browser.cjs` — includes the new stylesheet in existing print regressions.

Previously uncommitted work was retained. No packages, lockfiles, storage modules, or financial calculation modules changed.

## Validation results

Final validation commands ran separately, each with a timeout:

| Check | Result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit --incremental false` | Passed; 60-second bound |
| `npm run lint` | Passed; 60-second bound |
| `node --test tests/*.test.mjs` | **77 passed**, zero failures; 60-second bound |
| `npm run build` (`next build --webpack`) | Passed in 8.3 seconds; all ten routes generated; 120-second bound |
| `node tests/receipt-print.browser.cjs` | **20 print cases passed**, built-in timeout |
| `git diff --check` | Passed |

The existing non-failing Node module-type warning remains.

An isolated Chromium fixture mounted the actual components and CSS. Both themes passed at 375, 768, 1024, and 1440px. Checks exercised all five desktop scroll stages, anchored viewport fit, keyboard stage selection, previous/next and Arrow/Home/End exploration, actual mouse dragging, capture release, vertical wheel scrolling, and dynamic reduced-motion fallback. Further checks exercised native touch swipes in both directions, all five figures at 320/375/768px, receipt row spacing, a short 650px-high viewport fallback, and the connected live preview changing from $2.17/use to $1.09/use at ten weekly uses. Selected desktop/mobile screenshots were inspected. No document overflow, sampled secondary text below 12px, or uncaught browser errors were detected.

Production HTML was checked independently: it contains the static final statement, correct totals, and all five lifecycle perspectives before JavaScript. Print fixtures passed A4 and Letter in both themes, preserving all receipt text and assumptions on one page for the tested cases, including clean cancellation.

The interactive browser fixture shims Next routing and image delivery. Full Next client navigation, Safari/Firefox, screen readers, physical-device gesture feel, and real-device performance profiling remain manual checks. No development server was started, no check hung, and isolated test browsers were closed. Nothing was pushed or deployed.

## Manual review before committing

1. Scroll the homepage slowly and quickly in the running Next application. Check the five-stage pacing, reverse scrolling, the skip link, and the paper handoff at your usual laptop size.
2. Try dragging with a mouse, horizontal trackpad gestures, buttons, and Arrow/Home/End. Verify vertical scrolling stays natural, particularly with an actual phone and trackpad.
3. Switch reduced motion on and resize/zoom the browser. Confirm the final receipt and all lifecycle perspectives remain readable without sticky or horizontal progression.
4. Adjust the camera's usage in the live receipt, then follow Analyze/Compare links. Print a real receipt in your browser, including a long entry with optional information.
5. Check Safari/Firefox and a screen reader, especially stage announcements and navigation through the horizontal list.

Reference context only: [ERA Residence](https://www.era-residence.com/), [White Desert](https://white-desert.com/), and [USAvionix](https://www.usavionix.com/). No assets, source code, branding, typography, or exact transitions from those sites were incorporated.
