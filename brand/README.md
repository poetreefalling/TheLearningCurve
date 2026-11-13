# Brand assets

| File | What it is | Status |
|---|---|---|
| `logo-wordmark-original.png` | Jim's wordmark as supplied | Added |
| `logo-wordmark.svg` | The wordmark traced to a vector; a copy in `src/assets/` is used in the masthead, sticky bar and footer, and takes the text colour in both themes | Added |
| `logo-wordmark-nested.svg` | The current wordmark (November 2026) as outlines: "The" tucked above "earning", the curve, "Curve". Traced from the site's own Fraunces/Inter Tight rendering, so it matches `src/components/Wordmark.astro`; takes the text colour | Added |
| `logo-wordmark-nested-white.svg` | The same in white, for dark backgrounds (a copy is the /admin header logo) | Added |
| `public/brand/the-learning-curve-logo.png`, `-white.png` | The nested wordmark as transparent PNGs (1186 × 175), ink and white, rendered from `logo-wordmark-nested.svg` for email signatures and anywhere SVG won't display. Served at thelearningcurve.net/brand/the-learning-curve-logo.png and …-white.png | Added |
| `favicon-original.png` | The C from the wordmark (November 2026), cut out of `logo-wordmark.svg`; the browser-tab and app icons in `public/` are made from it, ink on the paper colour | Added |
| `documentary-reference.webp` | Style reference for documentary heroes: candid, window-lit, film grain, muted warm colour | Added (Jim's pick from the style tests) |
| `references/` | The other documentary tests Jim approved, kept for comparison | Added |
| `references/direction-*.webp` | Samples of the brighter direction (November 2026): a learner on a phone in a student room, a workplace pair on a tablet, a mature-age student in a campus library. Examples only; don't reuse them as heroes | Added |
| `risograph-reference.webp` | Style reference for risograph heroes: navy and ochre on off-white, grain, misregistration | **Still needed** |
| `supplied/` | Heroes Jim generated ahead of time, waiting for their article; the routine moves each one into `originals/` when it uses it (see `supplied/README.md`) | Jim |
| `originals/` | Full-size originals of every hero, as `<slug>.webp` (quality 92) | Written by the routine |
| `screenshots/<platform>/` | Jim's own screenshots from testing | Jim |

If the reference for the chosen style is missing, the routine uses a documentary hero instead
and says so in the pull request. If `documentary-reference.webp` is missing, it stops and reports.
