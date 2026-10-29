# The Learning Curve

Source for [thelearningcurve.net](https://thelearningcurve.net): an independent publication on how
to design online courses that work. Astro static site, deployed by Cloudflare Pages.

```sh
npm ci
npm run dev                # http://localhost:4321, drafts and scheduled articles visible
npm run build              # the build the drafting routine runs
npm run build:production   # also fails on any unresolved [JIM: …] or [TO VERIFY: …] flag
```

- Articles: `src/content/articles/<section>/<slug>.mdx` (see the `sample-*` drafts).
- Standing instructions and the twice-daily drafting routine: `CLAUDE.md`.
- Style guide, review method and image prompts: `docs/editorial.md`.
- Queue: `docs/backlog.md`. Affiliate programs: `docs/affiliates.md`.
- Settings (newsletter, analytics): `src/site.config.ts`.
- First-time setup: `docs/SETUP.md`.
