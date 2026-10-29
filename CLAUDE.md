# The Learning Curve

thelearningcurve.net is an independent publication on how to design online courses that work,
by Jim Lounsbury. It has three streams, in order of weight:

1. **Library:** one evergreen page per learning principle (retrieval practice, worked examples,
   cognitive load…), grounded in primary research.
2. **Guides:** practical course-building and instructional design.
3. **Reviews and Trends:** course platforms judged on how well they support learning
   (Thinkific, LearnWorlds, Teachable, Kajabi), and dated news on where online education is going.

Its job is traffic, trust and a reputation for rigour in the eLearning market. Affiliate
commissions pay its way; they never decide what gets written or how a platform scores.

- Astro static site. `npm run dev` to preview, `npm run build` to validate.
- One article = one MDX file in `src/content/articles/<section>/<slug>.mdx`. The schema in
  `src/content.config.ts` is the source of truth; a build fails if an article is incomplete.
  The samples in that folder (`sample-*.mdx`, all `draft: true`) show every field and component.
- Components available in an article body, with no import needed: `<ResearchCard n={0} />`,
  `<Chart id="<chart-id>" />`, `<Callout>…</Callout>`, `<Figure src alt caption credit />`,
  `<PlatformLink id="thinkific" />`, and in reviews `<PriceTable />` and `<ComparisonTable />`.
  Every research card and chart listed in the frontmatter must be placed in the body. MDX
  treats `{`, `}` and `<` as code, so don't use them in prose.
- Editor flags (`[JIM: …]`, `[TO VERIFY: …]`) show highlighted on preview builds. Production
  builds and the PR check (`npm run build:production`) fail while any non-draft article still
  has one, so Jim resolves them before merging. Drafts and future-dated articles appear only on
  preview builds (Cloudflare branch previews, `npm run dev`, or `SHOW_UNPUBLISHED=1`).
- Set `published` with the Sydney offset, e.g. `2026-11-10T12:00:00+11:00` (AEDT, October to
  April) or `+10:00` (AEST, April to October).
- Images: `public/images/articles/`, made by `scripts/images.py` (needs Pillow). Originals in
  `brand/originals/` as WebP. Charts: `src/data/charts/<id>.json`, drawn at build time.
- Deploys: Cloudflare Pages builds `main`; pull requests get a preview URL. A GitHub Action
  rebuilds at each publishing slot so future-dated articles go live on time.
- `docs/editorial.md` is the style guide: voice, article shapes, citation rules, review method
  and image prompts. Read it in full before every draft.
- `docs/backlog.md` is the ranked queue of articles to write.
- `docs/affiliates.md` holds the affiliate program terms and rules.

## Twice-daily article (scheduled routine)

Articles publish at **12:00 and 00:00 Sydney time**, 14 a week. This routine runs twice a day
(about 08:45 and 20:45 Sydney) and each run drafts **exactly one** article for the next slot at
least 12 hours away, so Jim has a morning or an evening to review it, then opens a pull request. Jim's merge is the approval. If the draft isn't good enough, open no PR: an
empty slot is better than a weak article.

1. **Pick the slot.** List the `published` datetimes of every article on `main` and in open
   pull requests from `article/` branches. Take the earliest free 12:00 or 00:00 Sydney slot
   that is at least 12 hours from now. If every slot in the next 72 hours is taken, stop and
   report (Jim is behind on reviews; don't pile up more).
2. **Pick the article.** Read `docs/backlog.md`.
   - If a flagship is pinned to the week the slot falls in and isn't `done` or `in PR`, take it.
   - Otherwise take the row marked `next`.
   - Reviews and comparisons need Jim's hands-on notes in `docs/testing/<platform>.md`. If
     they're missing, leave the row as it is, take the next non-review row, and say so in the PR.
3. **Research.**
   - Check the target keyword and related terms with the Ubersuggest connector (US, then
     Australia), and read the top five ranking pages. Write down what they miss.
   - Library and guide pieces: find the primary studies. Open each one (publisher page, DOI
     record or open-access PDF). Only cite what you actually opened and read enough of to
     support the exact claim. Prefer meta-analyses and reviews, then well-cited experiments.
   - Trends pieces: work from dated primary sources (the company announcement, the report, the
     regulator's page), published in the last 60 days.
   - Reviews: work from Jim's testing notes plus the platform's own current pricing and help
     pages. Record the date you checked prices.
4. **Write** to `docs/editorial.md`: the voice, the shape for this kind of article, and every
   schema field. Australian/British spelling.
5. **Hard rules.**
   - Never invent a statistic, study, quote, client, result or feature. If you can't link it,
     cut it.
   - Research cards: the excerpt is copied verbatim from the source, at most two sentences;
     the highlight is copied from inside the excerpt.
   - Charts: numbers only from the cited study's own tables or figures, with the figure or
     table number in `source.figureOrTable`.
   - A platform feature claim not backed by Jim's testing notes or the platform's own current
     documentation gets `[TO VERIFY: …]` inline.
   - Where Jim's own experience would make a passage stronger (a course he built, a design
     decision, something learners did), write `[JIM: what's needed]` and leave it for him. Never
     write first-person experience on his behalf.
   - Platforms come from `src/data/platforms.json` by id. Never set or change `affiliateUrl`;
     Jim adds those once a program approves him.
   - CredentialCraft is Jim's own business. Mention it only where it genuinely helps the
     reader, always with the inline ownership note from `docs/editorial.md`, and never inside a
     ranked list or a scored comparison.
6. **Illustrate.** Choose the hero style in `docs/editorial.md` (documentary by default; risograph
   for abstract ideas; a screenshot from Jim's notes for reviews where he has supplied one).
   Use the Artlist connector with Nano Banana 2, image-to-image, 2K, 3:2, and the matching
   reference image in `brand/` (if `risograph-reference.webp` doesn't exist yet, use a
   documentary hero and say so in the PR). Look at every result before using it. Regenerate once if it
   has any text, logo, brand mark, extra or malformed fingers, a face in sharp focus, a
   glossy stock-photo look, or the wrong subject. Never spend more than 300 Artlist credits
   per run. Save the original as `brand/originals/<slug>.webp` (quality 92, so the repo stays small), then run
   `python3 scripts/images.py brand/originals/<slug>.webp <slug> --style <style>`.
7. **Update `docs/backlog.md`.** Mark the row `in PR` with the slot, and mark the next `todo`
   row `next`.
8. **Build.** Run `npm ci && npm run build`. Fix anything that fails. (Flags don't fail this
   build; they fail the PR check, which is expected until Jim resolves them.)
9. **Open the pull request.**
   - Branch `article/<slug>`; commit; push.
   - Title: `<slot, e.g. Tue 10 Nov 12:00> · <title>`.
   - Description:
     - target keyword with volume and SD
     - the angle in 2–3 lines, and what the ranking pages miss
     - every `[JIM:]` and `[TO VERIFY]` item as a checklist
     - each research card and chart with its source link, for Jim to check against the paper
     - the image and its style
   - Never push to `main`, and never merge.
10. **If anything blocks you** (build won't pass, a connector is down, no `next` row, nothing
    citable for a research claim, no image that passes after one regeneration), open no PR and
    report what happened and which slot is now empty.

## Library re-checks (first run of each month)

Before drafting, list library entries whose `library.lastReviewed` is more than 12 months old.
If there are any, take the oldest instead of a new article. Search for newer meta-analyses or
replications, update the text and sources if the evidence has moved, set `lastReviewed` and
`updated`, and open the PR as `Re-check: <title>`.

## Keyword refresh (first run of each month)

After the article, append at least 60 new `todo` rows to `docs/backlog.md` from Ubersuggest:
keyword ideas around the existing clusters with SD ≤ 30, not already covered by an article or
a row. Keep the mix rules in the backlog. Put these in the same PR as a separate commit.
