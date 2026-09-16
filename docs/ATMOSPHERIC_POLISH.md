# Atmospheric polish

This pass adds three connected visual treatments to the existing homepage. It does not change the product tools, calculations, routes, storage, or data model.

## Visual changes

1. **Botanical shadow movement.** Original inline SVG foliage adds a brief, restrained drift behind the hero, receipt section edge, and reconsideration section. Each layer moves once for 4.2 seconds, then rests. It cannot intercept clicks or enter the accessibility tree.
2. **Hidden price to paper statement.** Opening the existing native hero disclosure now resolves the costs into an opaque ivory statement with a fine champagne rule and a small settling paper corner. The same existing calculated values, explicit additions/deduction, assumptions, and keyboard interaction remain. It works without JavaScript.
3. **Connected section edges.** A forest-to-tonal transition connects the hero to the receipt. Subtle paper layers sit behind the live receipt and settle once as they enter view. The receipt surface fades toward the comparison background; foliage and soft edges connect reconsideration to reflection. Reading surfaces stay opaque and text remains immediately visible.

The existing image, rain controls, typography, creator credit, and five-section structure are retained. No external site assets, code, video, font, or animation were copied or added. Utility pages receive no additional motion.

## Exact files changed

| File | Change |
| --- | --- |
| `app/atmospheric-home.css` | New homepage-only material surfaces, section edges, decorative styling, and accessibility/print fallbacks. |
| `app/components/botanical-shade.tsx` | New reusable original decorative SVG. |
| `app/components/landing-atmosphere.tsx` | Replaces near-invisible whole-section opacity flourishes with bounded decorative-layer motion; retains existing pointer response. |
| `app/page.tsx` | Imports styles and positions foliage and paper layers in the existing sections. |
| `tests/receipt-print.browser.cjs` | Loads the new stylesheet in the existing print regression suite. |
| `docs/ATMOSPHERIC_POLISH.md` | This implementation and review report. |

Earlier uncommitted work was preserved. Calculation, storage, form, comparison, queue, purchase, and insight files are unchanged from the start of this pass.

## Motion, accessibility, and performance

- New effects use transform/opacity animation, static gradients, and small inline vectors. No extra image/video downloads, packages, backdrop filters, continuous animation frames, or scroll handlers were introduced.
- A shared IntersectionObserver starts decorative movement once. Moving layers stop on leaving view, document visibility changes, print, reduced-motion changes, and unmount. Returning to a section does not restart them.
- Reduced-motion users see the composed static foliage and paper surfaces. The new folded-corner animation is disabled. Existing rain and pointer-light reduced-motion behavior remains intact.
- Decorative elements are `aria-hidden`, pointer-transparent, and clipped within their own bounds. Forms, CTAs, and financial values never depend on animation, hover, or observer execution.
- Forced-colors mode removes the decorative layers and uses system colors for the revealed statement. Printing removes the extra paper/shadow decorations.
- All new animation is finite; the existing separately pausable rain is unchanged. Performance safeguards were verified in a Chrome fixture; no real-device performance benchmark was performed.

## Validation

Commands ran separately and were time bounded:

- Typecheck: `node node_modules/typescript/bin/tsc --noEmit --incremental false` — passed.
- Lint: `npm run lint` — passed.
- Tests: `node --test tests/*.test.mjs` — **75 passed**, zero failures. Existing non-failing Node module-type warnings remain.
- Production: `npm run build` (`next build --webpack`) — passed, all ten routes generated. Rerun successfully after the final print/forced-colors selector correction.
- Printing: `node tests/receipt-print.browser.cjs` — **20 passed** across light/dark themes and A4/Letter. Each tested receipt fits one page, preserves all text and assumptions, and cleans up after print/cancellation.
- `git diff --check` — passed.

An isolated Chrome fixture checked five homepage positions across both themes at 375, 768, and 1440px: **30 layout combinations**, without horizontal overflow, sampled text below 12px, or uncaught browser errors. Desktop and phone screenshots were reviewed. Targeted checks passed for finite movement, offscreen cancellation, no replay, keyboard disclosure, live reduced-motion switching, forced-colors, and print decoration exclusion. An initial keyboard assertion omitted the native Enter character; correcting the fixture's event made the check pass without changing the disclosure implementation.

The fixture uses actual components and styles, with Next routing/image delivery shimmed. These checks do not establish full Next navigation, Safari/Firefox, screen-reader behavior, or real-device frame rates. No development server was started, no command hung, and test browsers were closed. Nothing was pushed or deployed.

## Before committing

1. In the running Next app, scroll Home in both themes on a phone and desktop. Check the pacing and subtlety of the botanical drift and section boundaries on your display.
2. Open the hero cost breakdown with touch and keyboard. Confirm the ivory statement and its assumptions remain comfortable to read and the primary action stays obvious.
3. Use the live receipt slider, then visit Analyze and print a real receipt in your preferred browser. Check native A4/Letter print preview, especially unusually long entries.
4. Enable reduced motion and high-contrast mode; verify a calm static presentation and visible keyboard focus. Check Safari/Firefox and a screen reader when available.
