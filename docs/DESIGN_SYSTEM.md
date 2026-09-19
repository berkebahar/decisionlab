# DecisionLab: a precision decision instrument

The original branching D remains the brand mark. The visual language emphasizes precision, restraint, and everyday usability; no luxury-brand assets, wording, or layouts are used.

## Shared tokens

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#F7F4ED` | `#101C17` |
| Text | `#17221E` | `#F1F0E7` |
| Secondary text | `#59645D` | `#B3BDB2` |
| Surface | `#FFFEFA` | `#1A2B23` |
| Tonal surface | `#ECEDE5` | `#24372D` |
| Interactive text | `#123C32` | `#B6D8C3` |
| Borders | `#D8D8CC` | `#3E5145` |

Primary controls and instrument result panels use forest `#123C32` with ivory `#F7F4ED`. Secondary instrument text uses `#C3D1C7`. Champagne `#B59A64` is used for dial ticks, not small text. The legacy `--blue` token name remains as an internal compatibility alias for theme-aware interactive green.

Measured contrast ratios: body/canvas 14.89:1 light and 15.29:1 dark; secondary text/tonal surface 5.23:1 light and 6.53:1 dark; instrument primary text 11.13:1 and secondary text 7.72:1. These are token-pair calculations, not a comprehensive rendered accessibility audit.

Georgia/system serif defines major headings. Existing Geist remains the body/control face; Geist Mono supports annotations. Inputs remain 16px, secondary labels at least 12px, currency uses tabular numerals. Spacing follows the existing 4px scale. Smaller corners, thin rules, tonal surfaces, and controlled shadows replace excessive nested-card emphasis.

## Composition and data

The homepage pairs “Before you buy it, see what it will really cost.” with an interactive fictional True Cost Receipt and the primary action “Analyze a product.” Receipt previews alternate framed instruments with flatter editorial sections. GoalLens, goals, and simulation remain supporting tools. Illustrative goals are identified as examples; the artificial Insights bar decoration has been removed. The creator section remains, with “Created by Berke B.” in the footer.

The dashboard's precision dial uses real capped goal progress: fine ticks, a progress arc, readable percentage, and an accessible text equivalent. It appears only on goal cards. Planned contributions must represent separate allocations of money. Dates assume end-of-week deposits beginning in one week.

GoalLens and Simulator retain paired inputs/results on wide screens and stack on mobile. Results, assumptions, formulas, saved decisions, and editing remain available. Recorded journal outcomes are distinct from hypothetical calculations and do not establish verified savings.

## Interaction

Short hover, pressed, focus, number, tab, and progress feedback never delays access. Reduced-motion rules disable animation and smooth scrolling. Native navigation dialogs retain focus containment and Escape behavior. Journal editing uses native details and labeled controls; backup import uses an inline preview with explicit confirmation. No essential information depends on hover.

## Verification limits

Lint, standalone TypeScript, 45 tests, and production Webpack build passed separately with time limits. The sandbox blocked the current browser pass with `listen EPERM` on the isolated production-server port. Therefore this design has **not** been visually verified at 375/768/1440px, in either theme, or with a screen reader. Prior typography screenshots describe the previous design, not this update. Review the checklist in `STUDENT_TESTING_REVIEW.md` before student testing.

## Focused final polish

The approved identity is retained. `app/polish.css` adds selective glass to navigation, hero preview, and mobile drawer only, with opaque and reduced-transparency fallbacks. Muted and disabled text contrast is stronger; touch targets and motion timings are consistent. System Georgia and the existing Next.js-hosted Geist fonts remain because new-font access was unavailable. See [the final polish review](FINAL_POLISH_REVIEW.md) for exact files, validation results, and the distinction between source inspection and unavailable browser/screen-reader checks.

## Product experience extension

The product analyzer, comparison workspace, queue, and purchase library reuse these tokens through `app/products/products.css`. The signature receipt uses serif titles, tabular figures, fine dividers, clearly labeled unknowns, and an isolated print treatment. Calculators remain opaque and usable without motion or hover. See [the product transformation handoff](PRODUCT_TRANSFORMATION.md) for current validation, file inventory, and manual review limits.
