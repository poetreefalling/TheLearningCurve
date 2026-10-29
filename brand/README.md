# Brand assets

| File | What it is | Status |
|---|---|---|
| `logo-wordmark-original.png` | Jim's wordmark as supplied | Added |
| `logo-wordmark.svg` | The wordmark traced to a vector; a copy in `src/assets/` is used in the masthead, sticky bar and footer, and takes the text colour in both themes | Added |
| `favicon-original.png` | Jim's C mark as supplied; the browser-tab and app icons in `public/` are made from it | Added |
| `documentary-reference.webp` | Style reference for documentary heroes: candid, window-lit, film grain, muted warm colour | Added (Jim's pick from the style tests) |
| `references/` | The other documentary tests Jim approved, kept for comparison | Added |
| `risograph-reference.webp` | Style reference for risograph heroes: navy and ochre on off-white, grain, misregistration | **Still needed** |
| `originals/` | Full-size originals of every hero, as `<slug>.webp` (quality 92) | Written by the routine |
| `screenshots/<platform>/` | Jim's own screenshots from testing | Jim |

If the reference for the chosen style is missing, the routine uses a documentary hero instead
and says so in the pull request. If `documentary-reference.webp` is missing, it stops and reports.
