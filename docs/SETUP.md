# The Learning Curve: starter kit

Everything Claude Code needs to build thelearningcurve.net and run its twice-daily drafting.

## Setup, in order

1. ~~Create the repo and build the site from `BUILD_BRIEF.md`~~ (done).
2. Cloudflare Pages: Workers & Pages → Create → Pages → connect `poetreefalling/TheLearningCurve`.
   Framework preset Astro, build command `npm run build`, output directory `dist`, production
   branch `main`. Add the custom domain thelearningcurve.net. Every pull request then gets a
   preview URL showing its draft.
3. In Pages → Settings → Builds, create a deploy hook for `main`, and save its URL in GitHub
   (Settings → Secrets and variables → Actions) as `CF_DEPLOY_HOOK`. That lets
   `.github/workflows/publish-slots.yml` publish scheduled articles at 12:00 and 00:00 Sydney.
4. Optional: in GitHub → Settings → Branches, protect `main` and require the "Publish checks"
   status, so a post with unresolved flags can't be merged by accident.
5. Save a risograph test image you like as `brand/risograph-reference.webp` (the documentary
   reference is already in place).
6. Create a scheduled Claude Code task on the repo, twice a day (around 09:00 and 21:00
   Sydney), with the prompt: "Run the twice-daily article routine in CLAUDE.md." Connect the
   Ubersuggest and Artlist connectors to it.
7. Before reviews can run: test each platform and fill in `docs/testing/<platform>.md` from
   the template. Until then the routine skips review rows.
8. Apply to the PartnerStack programs; update `docs/affiliates.md` and `affiliateUrl` in
   `src/data/platforms.json` as approvals come in.

## What's in here

| File | Purpose |
|---|---|
| `BUILD_BRIEF.md` | One-off brief: design system, pages, components, schema, scheduled publishing |
| `CLAUDE.md` | Standing instructions, including the twice-daily routine |
| `docs/editorial.md` | Voice, article shapes, citation rules, review method, image prompts |
| `docs/backlog.md` | 12 flagships and a 40-article queue |
| `docs/affiliates.md` | Program terms, status and rules |
| `docs/testing/_template.md` | Your platform testing notes |
| `src/data/platforms.json` | The four platforms, affiliate links empty |
| `brand/README.md` | The image references to add |
