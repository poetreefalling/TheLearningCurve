# The Learning Curve: design system

thelearningcurve.net · independent intelligence on how to design online learning that works,
and on the technology that delivers it. By Jim Lounsbury.

This file describes the brand as it is built on the site (November 2026). The code is the source
of truth: colour and type tokens live in `src/styles/global.css`, the wordmark in
`src/components/Wordmark.astro`, brand files in `brand/`.

---

## 1. The idea in one line

**Paper and ink, one marigold band, tomato labels, and evidence you can see.**

The Learning Curve looks like a serious publication, not a SaaS blog. It reads like a well-edited
magazine: warm paper, black ink, generous space, editorial serif headlines. What sets it apart is
that its claims are visible. Research is quoted on cards, numbers become charts drawn from the
source's own tables, directory answers carry an evidence level, and readers test themselves at the
end. Design serves trust.

**Three words:** rigorous, warm, legible.

**What it is not:** glossy, gradient-heavy, stock-photo cheerful, dashboard-cluttered, or
breathless. No hype colours, no emoji, no exclamation marks.

---

## 2. Logo

### The wordmark

"The Learning ⟋ Curve", set in **Fraunces** (heavy, tight), with a hand-drawn curve between
"Learning" and "Curve".

- **"The"** sits small in the space above "earning", tucked against the stem of the L.
- **The curve** is a single stroke that rises fast, then flattens: the shape of a learning curve.
  It's an SVG path (`M3 31 C 12 31, 14 6, 43 4`, round caps), drawn in the text colour.
- **Compact version** drops "The" for tight spaces (sticky bar, small headers).
- The wordmark takes the current text colour, so it's ink on paper and on marigold, and light on
  dark mode. Never recolour it in tomato, blue or a gradient.

Under the masthead wordmark sits the motto in Newsreader italic:
*Intelligence for the people shaping the future of learning.*

### The curve mark

The curve on its own, ink on a marigold rounded square (`brand/curve-mark.svg`): the app icon and
social avatar. The browser favicon is the C from the wordmark, ink on paper.

### Files

| File | Use |
| --- | --- |
| `src/components/Wordmark.astro` | Live wordmark on the site (text, so it stays sharp and themes itself) |
| `brand/logo-wordmark-nested.svg` | Current wordmark as outlines, takes the text colour |
| `brand/logo-wordmark-nested-white.svg` | White version for dark backgrounds |
| `brand/curve-mark.svg` | Curve mark on marigold (icon, avatar) |
| `brand/logo-wordmark.svg` | Previous swash wordmark, kept for reference |
| `public/favicon*`, `icon-192/512.png`, `apple-touch-icon.png` | Browser and app icons |

### Usage

- Ink on paper, ink on marigold, or light on near-black. Those are the only three.
- Keep clear space around it of at least the height of the curve.
- Don't stretch it, outline it, add a shadow, set it on a photo, or rebuild it in another font.
- The curve is the only graphic flourish in the identity. Don't add a second one.

---

## 3. Colour

One brand colour (marigold), one label colour (tomato), and everything else is paper and ink.
Every colour is a CSS token with a light and dark value; the site follows the reader's system
setting and has a manual toggle.

### Core palette

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--paper` | `#f7f4ee` | `#121314` | Page background: warm off-white, never pure white |
| `--surface` | `#ffffff` | `#1b1c1e` | Cards, panels, tables, chart backgrounds |
| `--ink` | `#16181d` | `#eeebe5` | Text, headlines, strong rules |
| `--ink-2` | `#3a3c42` | `#cfcbc3` | Body copy in secondary places, summaries |
| `--muted` | `#6a6660` | `#a39f98` | Meta lines, captions, source links |
| `--rule` | `#e3ded4` | `#2e2f31` | Hairlines between items |
| `--rule-strong` | `#16181d` | `#eeebe5` | Section-head dotted rule, card tops |
| `--accent` | `#1f2e4d` | `#9db1da` | Links, the highlighted series in charts |

### Brand and signal colours

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--band` | `#f6c847` | (same) | **Marigold, the brand colour.** Masthead, lead story frame, newsletter blocks |
| `--band-ink` | `#16181d` | (same) | Everything on marigold is ink, in both themes |
| `--kicker` | `#c0391b` | `#ff6b4a` | **Tomato.** Small uppercase labels only: kickers, "Research ongoing" |
| `--highlight` | marigold at 50% | warm at 30% | Highlighter mark inside research quotes |
| `--ochre` | `#c8902e` | `#e0b25a` | Second chart series, risograph second ink |
| `--flag` | `#fde68a` | `#6b5410` | Editor flags on preview builds (`[JIM: …]`) |

### Data colours

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--dv-1` | `#2e5aa8` | `#4f80d4` | Data-story series 1 (blue) |
| `--dv-2` | `#c27b1f` | `#c08428` | Data-story series 2 (amber) |
| `--dv-3` | `#8c5aa6` | `#9a70bf` | Data-story series 3 (violet) |
| `--chart-base` | `#b9b3a8` | `#55534f` | Context series, the ones the title isn't about |

**Evidence levels** (directory) use a four-step scale: Level 1 warm grey `#8a8378`, Level 2
ochre `#c8902e`, Level 3 blue `#2e5aa8`, Level 4 green `#1f7a52`. "Research ongoing" is tomato
text; "Sources conflict" is a tomato outline.

### Rules

- **Marigold is a surface, not an accent.** Use it as a full band or block, never for thin text,
  icons or underlines.
- **Nothing tomato sits on marigold.** Inside a `.band`, labels turn ink.
- **Tomato is only for small labels.** Never a button, a headline or a chart series.
- **One highlighted thing per chart.** The series the title is about is in the accent colour;
  everything else is `--chart-base`.
- Body text keeps at least 4.5:1 contrast in both themes. Check any new pairing in dark mode too.

---

## 4. Typography

Four variable fonts, self-hosted through Fontsource (no external font requests).

| Token | Family | Use |
| --- | --- | --- |
| `--display` | **Fraunces** | Headlines, the wordmark, card titles, big numbers. Heavy (700–800), tight leading (1.1), slight negative tracking |
| `--serif` | **Newsreader** | Article body, standfirsts, the motto (italic). Long-form reading |
| `--sans` | **Inter** | Interface text, meta lines, tables, chart labels, directory facts |
| `--label` | **Inter Tight** | Kickers, section heads, table headers, badges: small, bold, uppercase, tracked (0.06–0.1em) |

### The type voice

- **Headlines** are Fraunces at heavy weight: confident and editorial, never all caps.
- **Kickers** (the label above a headline) are Inter Tight, 11.5px, 700, uppercase, 0.1em
  tracking, in tomato. They name the section: LIBRARY, GUIDE, REVIEW, DISCOVER.
- **Section heads** are tiny uppercase Inter Tight under a 2px dotted ink rule. The dotted rule is
  a signature: it says "new section" without shouting.
- **Body** runs at a 680px measure in Newsreader, 1.15rem (about 18px), line height 1.68.
- **Numbers** that matter are set large: stat tiles in Fraunces, the review scorecard total in Newsreader with tabular figures.

---

## 5. Layout

| Token | Value | Use |
| --- | --- | --- |
| `--page` | 1200px | Maximum page width |
| `--wide` | 960px | Charts, data stories, screenshots |
| `--measure` | 680px | Reading column |
| `--gutter` | 24px | Space between columns |
| `--side` | 16px | Phone side margin (no horizontal page scroll, ever) |

- **Editorial grid.** The home page reads like a front page: a marigold masthead with search,
  wordmark and newsletter button; a nav bar of five sections, each with an italic description
  (Discover, Compare, Insights, Resources, Intelligence); then a lead story in a marigold frame and
  a grid of cards. Below the fold, a **Browse** tab strip (All, then one tab per section with
  live articles) filters **section bands**: each band pairs a lead with its picture and two
  text-only headlines, and a selected tab shows up to eight more. A 300px **rail** beside the
  bands holds Start here (library classics as square cards), Jim's take (articles with
  `opinion: true`, byline in small caps, italic headline) and the latest reader poll. Mixing
  picture and text-only items keeps the page from reading as a wall of cards, so don't give
  every item an image.
- **Space is a feature.** Sections breathe (56px above a section head). Hairlines, not boxes,
  separate most items.
- **Cards** are flat: image, kicker, headline, a line of summary. No drop shadows except on framed
  product screenshots.
- **Tables** scroll sideways inside their own container on phones, with the first column pinned.
- **Intelligence** (members) is the one dark block in the nav: near-black with marigold text, so
  it reads as premium without a new colour.

---

## 6. Imagery

Every article has its own hero image, made for that article and never reused. No words, numbers,
charts or logos in generated images: those are built by the site from source data.

| Style | When | Look |
| --- | --- | --- |
| **Documentary** (about 80%) | Anything with a human situation | Candid, observed, bright contemporary spaces (campus libraries, modern offices, a learner on a phone at a café window). Natural daylight, true colour with gentle warmth, 35mm look, light grain, shallow depth of field. Faces turned away or soft; hands and devices are the sharpest part. Reference: `brand/documentary-reference.webp` |
| **Risograph** (about 20%) | Ideas you can't photograph: a memory effect, a design model | Two inks, deep navy and ochre, on warm off-white. Grain, slight misregistration, halftone. One simple visual metaphor, generous empty space |
| **Screenshot** | Reviews and directory profiles | The product's real interface, credited ("Image: Vendor" or "Screenshot: The Learning Curve"), framed with a thin border and soft shadow |

Generated with Artlist (Nano Banana 2, image-to-image, 2K, 3:2) from the reference images and the
prompt templates in `docs/editorial.md` section 10. Rejected if they show text, logos, malformed
hands, a sharp face looking at the camera, or a glossy stock look.

**Directory logos** sit on a white rounded tile so dark marks read in both themes.

---

## 7. The special sauce: evidence you can see

This is what makes The Learning Curve different from every other eLearning blog. Four principles
run through all of it:

1. **Data comes from the source, never from memory.** Every chart number is copied from the
   cited study's own table or figure, and the figure number is recorded. Every directory fact
   links to the page it came from.
2. **Built from data files, not drawn by hand.** Charts and data stories are JSON files the site
   renders. Fix the data and the graphic fixes itself, in both themes.
3. **Works without JavaScript.** Every interactive graphic has a data table underneath. If the
   script doesn't run, the reader still gets the numbers.
4. **Motion explains, never decorates.** Things animate to reveal a sequence or a comparison, and
   all motion stops for readers who set "reduce motion".

### 7.1 Research cards

`<ResearchCard n={0} />`

A white card with a short marigold tab on its top-left corner and a tomato RESEARCH label. Inside:
a verbatim quote from the paper (at most two sentences) in large italic serif, with the key
phrase marked in marigold highlighter, then the full citation with a link to the paper. It turns
"studies show" into "here's the sentence, here's the paper". The excerpt must be copied exactly;
the highlight must sit inside it.

### 7.2 Charts (built at publish time)

`<Chart id="roediger-karpicke-2006-retention-interval" />` from `src/data/charts/<id>.json`

Static SVG charts drawn when the site builds: bar, grouped bar, line and dot-range. One house
style:

- **A headline title that states the finding**, not the variable: "Re-reading won at 5 minutes; a
  recall test won by 14 points at 2 days and 1 week".
- A subtitle that says exactly what was measured, on whom.
- Ink text, light rules, values labelled on the marks (no hunting along an axis).
- The series the title is about in the accent colour; the rest in neutral.
- A source line with authors, year, DOI link and the figure or table number.

### 7.3 Data stories (interactive)

From `src/data/stories/<id>.json`, drawn in the browser with no chart library:

- **`<DataChart id="…" />`**: line, column, bar or grouped bar. Grows in when it scrolls into view.
  Hover or keyboard focus shows a tooltip; tapping the legend toggles a series; estimates are
  marked; "Show the data" opens the full table; sources sit underneath.
- **`<Scrolly chart="…"><Step view="…">…</Step></Scrolly>`**: scrollytelling. The chart sticks
  while short text cards scroll past it, and each card moves the chart to a new view: reveal up
  to a year, highlight one series, focus a bar, add an annotation. The reader is walked through
  the argument one step at a time.
- **`<StatGrid><Stat value="54" suffix="%" label="…" source="…" href="…" /></StatGrid>`**: a row of
  big Fraunces numbers that count up as they appear, each with a plain label and a linked source.

Palette: `--dv-1` blue, `--dv-2` amber, `--dv-3` violet, faded to `--chart-base` when another
series is highlighted. Example: `src/content/articles/trends/sample-data-story.mdx`.

### 7.4 Reader checks

`readerCheck` at the end of library, guide and trends articles.

- **Quiz** (three questions): "Check your understanding". Recalling it now helps it stick: the site
  practises the retrieval practice it writes about. After answering, readers see the right answer,
  why, and how everyone else answered.
- **Poll** (one to three questions): "Reader poll" about how people work. Results show as animated
  bars of how all readers answered.

### 7.5 Discover: the intelligence directory

The directory turns product research into a procurement tool for universities, schools and
corporate learning teams.

- **Every fact shows its source** (host name and how we know it). Anything not yet confirmed reads
  **"Research ongoing"** in tomato capitals, never a blank and never "data gap".
- **Evidence & Assurance levels**: a small pill with four marks filled to the level: Level 1
  vendor disclosed, Level 2 vendor confirmed, Level 3 independently corroborated, Level 4
  independently assured. Explained at `/evidence-and-assurance/`.
- **AI comparison criteria first.** On AI tools, four panels lead the profile (data privacy,
  learner oversight, pedagogical approach, output ownership), each panel topped with a heavy ink
  rule and "N of M established".
- **Comparison table**: every tool against the four criteria, one small square per question,
  filled by evidence level, hollow while research is ongoing. Alphabetical, labelled "not a
  ranking".
- **Profiles** pair the facts with the product's logo tile and a large real screenshot (right half
  on desktop, full width on phones; animated screenshots fall back to a still for reduced motion).

### 7.6 Reviews and comparisons

- **Scorecard**: the overall score large in serif with tabular figures ("4.2 / 5"), split into Learning design (60%)
  and Business tools (40%) with a bar per criterion. Scores only come from hands-on testing
  against the published method at `/how-we-review/`.
- **Price tables and comparison tables** drawn from data, with the date prices were checked.
- No ads on reviews or comparisons, ever, so an ad never sits next to a score.

### 7.7 In the works

- **LMS market map**: an animated, interactive wheel whose segments are markets (higher education,
  schools, corporate, government and VET, open source) with platforms placed where they serve. It
  draws in on scroll; tapping a platform opens a card with its directory facts and a link to its
  profile. Read from the directory records, never hand-copied, and never ranked.

### What every graphic needs

- [ ] A title that states the finding
- [ ] A subtitle that says what was measured, on whom, when
- [ ] Numbers copied from a named source, with the table or figure number
- [ ] One highlighted series, the rest neutral
- [ ] Direct labels instead of a legend wherever possible
- [ ] A data table for screen readers and no-JavaScript readers
- [ ] Checked in light and dark mode, at phone and desktop width
- [ ] Motion that stops under "reduce motion"
- [ ] No ranking unless the ranking itself comes from a cited, dated source

---

## 8. Components at a glance

| Component | What it looks like |
| --- | --- |
| Masthead | Full marigold band: search pill left, wordmark and italic motto centred, ink "Get the newsletter" pill right |
| Section nav | Five columns on marigold, dotted dividers, uppercase label plus italic description; Intelligence in near-black |
| Kicker | Tomato uppercase label above a headline |
| Section head | 2px dotted ink rule, tiny uppercase title, optional "See all" link right |
| Card | Flat: image, kicker, Fraunces headline, one-line summary |
| Callout | Ink rule above, hairline below, small accent label |
| Research card | White card, marigold corner tab, italic quote with highlighter, citation |
| Fact row | Uppercase grey label left, value right, source link underneath |
| Chips | Small rounded outlines for markets, deployment, standards |
| Evidence badge | Rounded pill, four small squares filled to the level, uppercase label |
| Editor flag | Pale yellow highlight on `[JIM: …]` and `[TO VERIFY: …]`, preview builds only |
| Advertisement | Clearly labelled, visually separate, never on reviews or comparisons |

---

## 9. Voice, in brief

A working learning designer who reads the research, writing for a colleague. Plain and exact.
Evidence first, then judgement, with the line between them visible. Calibrated ("strong evidence",
"early evidence"), never "proven". Warm and dry. Australian/British spelling. Full guide:
`docs/editorial.md`.

---

## 10. Where things live

| What | Where |
| --- | --- |
| Colour, type and layout tokens; all component styles | `src/styles/global.css` |
| Wordmark | `src/components/Wordmark.astro` |
| Brand files and image references | `brand/` (see `brand/README.md`) |
| Build-time charts | `src/components/Chart.astro`, data in `src/data/charts/` |
| Data stories | `src/components/story/`, `src/scripts/datastory.ts`, data in `src/data/stories/` |
| Research cards | `src/components/ResearchCard.astro` |
| Reader checks | `src/components/ReaderCheck.astro` |
| Directory and evidence badges | `src/components/directory/`, `src/pages/discover/`, `/evidence-and-assurance/` |
| Style guide and image prompts | `docs/editorial.md` |
| Directory rules | `docs/directory.md` |
