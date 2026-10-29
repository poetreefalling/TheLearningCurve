# Build brief: The Learning Curve (thelearningcurve.net)

Build an independent, premium editorial site about how to design online courses that work.
It publishes three kinds of writing: an evergreen research library on how people learn,
practical course-building guidance, and honest reviews of course platforms (Thinkific,
LearnWorlds, Teachable, Kajabi). Its job is to earn search traffic, trust and a reputation for
rigour in the eLearning and online education market. Affiliate commissions pay its way.

It must look and read like a premium news or magazine site, not a template blog. Think of the
calm authority of The Atlantic, Aeon or the FT Weekend: a strong masthead, serif headlines,
generous white space, real photography, and nothing that looks auto-generated.

Use the same stack and patterns as the Storybriefs repo (`poetreefalling/storybriefs`): an
Astro static site, content collections with a Zod schema that fails the build when a post is
incomplete, Cloudflare Pages deploys, and one pull request per article. Read that repo before
you start and reuse what fits.

---

## 1. Stack

- Astro 5, static output, `trailingSlash: 'always'`, `site: 'https://thelearningcurve.net'`.
- No client-side framework. Ship HTML and CSS; add small inline scripts only where needed
  (theme toggle, search, newsletter form).
- `@astrojs/sitemap`, `@astrojs/rss`, Pagefind for static search, `@fontsource-variable`
  packages for self-hosted fonts.
- Node version pinned in `.node-version`.
- Deploy: Cloudflare Pages builds `main`; pull requests get preview URLs.
- Analytics: Cloudflare Web Analytics (cookieless, so no cookie banner).

## 2. Design system

The look is editorial: paper, ink, one quiet accent, and photography doing the colour work.

### Colour tokens (define on `:root`, with a dark theme)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--paper` | `#F7F4EE` | `#121314` | Page background |
| `--surface` | `#FFFFFF` | `#1B1C1E` | Cards, boxes |
| `--ink` | `#16181D` | `#EEEBE5` | Body text, headlines |
| `--muted` | `#6A6660` | `#A39F98` | Bylines, captions, dates |
| `--rule` | `#E3DED4` | `#2E2F31` | Hairline rules and borders |
| `--accent` | `#1F2E4D` | `#9DB1DA` | Links, kickers, active nav (deep navy) |
| `--highlight` | `rgba(200,144,46,0.32)` | `rgba(224,178,90,0.30)` | The highlighter mark in research cards (ochre) |
| `--ochre` | `#C8902E` | `#E0B25A` | Small accents only: score bars, the library badge |

Navy and ochre match the risograph illustration palette, so the illustrated pieces and the
site feel like one publication. Follow the system theme by default; a toggle overrides it
(copy the Storybriefs pattern: saved choice applied before first paint).

### Type

- **Headlines and masthead:** Newsreader (variable, optical sizes), weight 500–600, tight
  leading (1.1), slight negative tracking on large sizes.
- **Article body:** Newsreader text, 20px / 1.65 on desktop, 18px on mobile, measure about
  66 characters (max-width 680px).
- **Interface, kickers, bylines, captions, tables:** Inter (variable). Kickers in small caps,
  11–12px, letter-spacing 0.08em, in `--accent`.
- Tabular figures in tables, scores and charts.
- No more than these two families anywhere.

### Layout

- Home and section pages: 1200px max width, 12-column grid, 24px gutters, 16px side gutter
  on mobile.
- Article column 680px; hero images and charts may break out to 960px ("wide") and the hero
  to full bleed on the lead story.
- Hairline rules (`--rule`) separate sections, newspaper-style. No drop shadows, no
  gradients, no rounded "card" look beyond a 2px radius on images.
- Generous vertical rhythm: 8px base unit.

### Masthead

- Wordmark "The Learning Curve" set in Newsreader Display, centred, with a thin double rule
  beneath it.
- Above the wordmark, a small line in Inter: today's date (Sydney time) on the left,
  "Research, practice and reviews for people who build courses" on the right.
- Section navigation below the rules: Library · Guides · Reviews · Trends · Newsletter, plus a
  search icon and the theme toggle. On scroll, collapse to a compact sticky bar with the
  wordmark at 20px.
- Create the wordmark as live text, not an image. Generate a simple monogram favicon ("LC" in
  Newsreader on navy) at the usual sizes.

## 3. Pages

| Route | Purpose |
|---|---|
| `/` | Front page (see below) |
| `/library/` | Index of library entries, grouped by principle, each with its "last reviewed" date |
| `/guides/`, `/reviews/`, `/trends/` | Section fronts: lead piece, then a chronological river |
| `/<section>/<slug>/` | Article pages |
| `/how-we-review/` | The published review method and scoring (from `docs/editorial.md`) |
| `/about/` | Who runs the site, why, and Jim's credentials |
| `/disclosure/` | Affiliate and ownership disclosure (adapt the Storybriefs page; name CredentialCraft as Jim's own business) |
| `/newsletter/` | Sign-up page |
| `/search/` | Pagefind search |
| `/rss.xml` | Full-text RSS |
| `404` | Editorial 404 with links to the library |

### Front page

1. **Lead story:** the newest piece flagged `featured: true` (or the newest overall). Hero
   image at 16:9 across 8 columns, kicker, large headline, standfirst, byline and date.
2. **Beside it (4 columns):** the next three headlines, text only, separated by rules.
3. **From the Library:** a row of four library entries with their illustrations or photos,
   principle name as kicker, and "Last reviewed" date.
4. **Latest:** a chronological river of the 12 newest pieces: thumbnail, kicker, headline,
   one-line standfirst, date.
5. **Reviews:** three latest reviews with their overall score shown as a small ochre bar.
6. **Newsletter band:** a full-width paper band with one line of copy and an email field.
7. **Footer:** sections, About, How we review, Disclosure, RSS, and the line
   "Independent. Reader-supported through affiliate links. See our disclosure."

### Article page

Top to bottom:

1. Kicker (section or library principle), headline, standfirst.
2. Byline ("By Jim Lounsbury"), published date, updated date if any, reading time. Library
   entries also show "Last reviewed <date>".
3. Hero image with caption and credit. Documentary images carry the credit
   "AI-generated illustration"; risograph illustrations carry "Illustration: The Learning Curve".
4. **The short answer:** a boxed 40–60 word summary (`summary` field). This is the passage AI
   answer engines quote, so make it prominent.
5. Key takeaways (3–5 bullets).
6. Body (Markdown), with the components below available inline.
7. FAQ (rendered as details/summary, with FAQPage JSON-LD).
8. Sources: numbered list, authors, year, title, journal, DOI link.
9. Author box, then related articles (same principle or platform first).
10. When the page has an affiliate link: a one-line disclosure above the first affiliate link,
    linking to `/disclosure/`. Affiliate links get `rel="sponsored noopener"`.

## 4. Components

- **ResearchCard:** a typeset card for a short verbatim excerpt from a study. The highlighted
  phrase is wrapped in `<mark>` using `--highlight`. Below it: authors, year, title, journal,
  and a DOI link. It is built from frontmatter data, never from an image. Style it like a
  clipping: surface background, hairline border, Newsreader italic for the excerpt, Inter for
  the citation.
- **Chart:** renders an SVG at build time from `src/data/charts/<id>.json` (schema below). Bar,
  grouped bar, line and dot-with-range types. One consistent style: ink marks, a single navy
  accent on the series the title is about, light rules, values labelled on marks, a source
  line beneath. No client-side JavaScript.
- **Scorecard:** for reviews. Two groups (Learning design; Business tools), each criterion scored
  1–5 with a short note, and an overall score. Show bars in `--ochre`.
- **ComparisonTable:** for "X vs Y" pieces: rows are criteria, columns are platforms, with a
  "Best for" row.
- **PriceTable:** plan, monthly price, what it includes, with a "Prices checked on <date>" line.
- **Callout:** "Try this in your course" box for practical takeaways in library entries.
- **Figure:** image with caption and credit, normal or wide.

## 5. Content model (`src/content.config.ts`)

The schema is the source of truth. A build must fail if a published post is incomplete.

```ts
const source = z.object({
  authors: z.string(),            // "Roediger, H. L., & Karpicke, J. D."
  year: z.number(),
  title: z.string(),
  journal: z.string().optional(),
  doi: z.string().optional(),     // "10.1111/j.1467-9280.2006.01693.x"
  url: z.string().url(),          // the page the routine actually opened
});

const researchCard = z.object({
  excerpt: z.string().max(400),   // verbatim, short
  highlight: z.string(),          // must be a substring of excerpt
  sourceIndex: z.number(),        // index into sources[]
  page: z.string().optional(),
});

const hero = z.object({
  style: z.enum(['documentary', 'risograph', 'screenshot']),
  alt: z.string(),
  caption: z.string().optional(),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    section: z.enum(['library', 'guides', 'reviews', 'trends']),
    kind: z.enum(['library', 'guide', 'review', 'comparison', 'trends']),
    title: z.string().max(70),
    description: z.string().min(140).max(160),
    standfirst: z.string().max(220),
    kicker: z.string(),
    targetKeyword: z.string(),
    secondaryKeywords: z.array(z.string()).default([]),
    summary: z.string(),          // 40-60 words
    keyTakeaways: z.array(z.string()).min(3).max(5),
    hero,
    researchCards: z.array(researchCard).default([]),
    charts: z.array(z.string()).default([]),   // ids in src/data/charts/
    platforms: z.array(reference('platforms')).default([]),
    review: z.object({            // reviews only
      platform: reference('platforms'),
      testedOn: z.coerce.date(),
      scores: z.object({
        retrieval: z.number(), assessment: z.number(), credentials: z.number(),
        analytics: z.number(), pricing: z.number(), payments: z.number(),
        marketing: z.number(),
      }),
      notes: z.record(z.string()),
      verdict: z.string(),
      bestFor: z.string(),
      pricesCheckedOn: z.coerce.date(),
    }).optional(),
    library: z.object({          // library entries only
      principle: z.string(),
      question: z.string(),
      evidence: z.enum(['strong', 'moderate', 'emerging']),
      lastReviewed: z.coerce.date(),
    }).optional(),
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(3),
    sources: z.array(source).default([]),
    featured: z.boolean().default(false),
    published: z.coerce.date(),   // full datetime, Sydney time
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
  }),
});
```

Plus:

- `platforms` collection (`src/data/platforms.json`): `name`, `url`, `affiliateUrl` (nullable,
  default null), `programNotes`. Links use `affiliateUrl` when it's set, exactly like Storybriefs'
  `tools.json`.
- Chart data (`src/data/charts/<id>.json`): `title` (the finding, with its number), `subtitle`,
  `type`, `unit`, `series` (rows), and `source` (`authors`, `year`, `doi`, `figureOrTable`).

### Build-time checks (fail the build)

- `kind: review` without `review`, or `kind: library` without `library`.
- A research card whose `highlight` isn't inside its `excerpt`, or whose `sourceIndex` is out of
  range.
- A chart id with no data file, or a chart file without `source`.
- Any non-draft article whose body or frontmatter contains `[JIM:` or `[TO VERIFY`. Drafts use
  these markers to ask Jim for first-hand notes and to flag unchecked claims; they must be
  resolved before publishing.
- `published` later than now: build the page but leave it out of every listing, the sitemap
  and RSS, and return 404 for its URL. This is how scheduled posts wait for their slot.

## 6. Images

`scripts/images.py <source.png> <slug>` produces, in `public/images/articles/`:

- `<slug>.webp` at 2000px wide (hero), `<slug>-card.webp` at 800px, and `<slug>-og.jpg` at
  1200×630 (centre-cropped).
- Light finishing for documentary images only, applied the same way every time: a gentle
  warm grade, fine grain and a 2% vignette, so the set reads as one photographer's work.
- No watermarks. Credits go in captions.
- Store originals in `brand/originals/`.

## 7. SEO and structured data

- Title tag: `<title> | The Learning Curve`; description from frontmatter; canonical URLs;
  Open Graph and Twitter cards using the `-og.jpg`.
- JSON-LD: `Article` (with `author` as a `Person`: Jim Lounsbury, linking to /about/), `FAQPage`,
  `BreadcrumbList`, and `ItemList` on section fronts. Reviews use `Review` markup with the
  overall score.
- Sitemap and RSS exclude drafts and future-dated posts.
- `robots.txt` allows everything and points to the sitemap.
- Target Lighthouse 95+ on performance, accessibility, best practice and SEO. Images use
  width/height attributes, lazy loading below the fold, and `fetchpriority="high"` on the
  lead hero.

## 8. Scheduled publishing

Articles publish at 12:00 and 00:00 Sydney time. Because the site is static, add a GitHub
Actions workflow that triggers the Cloudflare Pages deploy hook at 01:00, 02:00, 13:00 and
14:00 UTC every day. Two of those four line up with the slots in summer (AEDT) and the other
two in winter (AEST); the extra builds are harmless because future-dated posts stay hidden.
Read the deploy hook URL from the repository secret `CF_DEPLOY_HOOK`.

## 9. Newsletter

Build the form and `/newsletter/` page against a provider set in one config value. Jim to
confirm the provider (Beehiiv is the likely choice). Until then, the form shows but posts
nowhere and says "Coming soon".

## 10. Also create

- `CLAUDE.md`, `docs/editorial.md`, `docs/backlog.md`, `docs/affiliates.md`,
  `docs/testing/_template.md`, `brand/README.md` and `src/data/platforms.json` from this kit
  (they're already written; copy them in unchanged).
- `/how-we-review/` built from section 9 of `docs/editorial.md`.
- Three sample articles marked `draft: true`, one library, one guide and one review, using
  placeholder text clearly labelled as such, so every template and component can be checked.
- A short `README.md` for humans: how to run, build, and preview.

## 11. Done means

- `npm run build` passes, with the sample drafts building and hidden.
- Every page type looks right at 375px, 768px and 1280px, in light and dark themes.
- Front page, an article of each kind, a review with scorecard and comparison table, a library
  entry with two research cards and a chart, search, and the 404 page all reviewed by
  screenshot.
- Lighthouse scores recorded in the pull request.
- Opened as a pull request, not pushed to `main`.
