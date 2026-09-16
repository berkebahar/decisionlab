# Botanical homepage treatment

The homepage now has a full-width botanical photograph, dark forest overlays, warm ivory copy, champagne details, and a high-contrast ivory receipt. The surrounding theme and application tools remain unchanged. The original pointer-responsive decision-path graphic remains subtle; no new animation or library was added. Decorative imagery has empty alternative text, and a solid forest fallback preserves legibility before loading. The receipt remains opaque in both themes.

Files: `app/page.tsx`, `app/botanical-home.css`, `public/images/decisionlab-botanical-hero.webp`, and this document.

Asset: original image generated with the built-in image generation tool, then encoded using existing Sharp as 1536 × 1024 WebP, 73,466 bytes. It is served locally through Next Image with responsive sizing and eager loading, with no remote image request. The original output remains in the image generator's output directory.

Exact generation prompt:

> Use case: photorealistic-natural. Asset type: ultra-wide premium website hero background, landscape 3:2 or wider. Create original editorial botanical photography of large sculptural dark forest-green leaves with fine natural veins, layered tropical foliage at the right edge and lower corners, near-black green negative space across the left half and central area for website text. Subtle warm champagne daylight raking from upper right illuminates a few leaf edges, deep soft shadows, beautifully restrained tonal contrast, tactile natural realism, luxury art-direction, no glow. Eye-level close-up composition, layered depth, visually rich but quiet. Palette deep forest #123C32 and near-black #101C17, muted sage highlights. No money, banknotes, coins, logos, letters, text, people, products, frames, UI, or watermarks. This is only a background photo; the actual website text and calculator will be implemented separately.

Validation: ESLint passed; standalone TypeScript passed; all 63 tests passed; production Webpack build passed (7.8 seconds); diff whitespace check passed. Commands used the existing bounded wrapper (60 seconds each, 120 for build). The existing non-failing Node module-type warning remains.

No browser tool was available and localhost:3000 was unreachable. No server was started. Review the actual homepage at 375, 768, and 1440px in both themes: image crop, text contrast, slider keyboard focus, expanded receipt assumptions, and transition into the toolkit section. Source styles include mobile stacking, full-width mobile actions, and an opaque paper receipt; rendered verification remains outstanding.

## Selective glass follow-up

`app/polish.css` now gives the sticky navigation an ivory/forest frosted surface, rounded active controls, and fine inner highlights. The mobile dialog is inset with rounded corners, a shaded backdrop, and a single glass layer. Native dialog focus and Escape handling remain unchanged. Opening the dialog removes blur from the header to avoid stacking glass layers.

`app/botanical-home.css` applies forest glass only to the homepage usage slider, with readable ivory labels, a solid value capsule, a 44px range target, and visible keyboard focus. The receipt and calculator inputs remain opaque. Blur and saturation use CSS feature detection; unsupported browsers and reduced-transparency settings get solid surfaces. Existing reduced-motion rules remain in effect. No packages, animation loops, calculations, or storage changes were introduced.

Review the sticky header while scrolling, mobile menu on Safari/Chrome, slider focus, both themes, and reduced-transparency settings. Browser verification remains unavailable.
