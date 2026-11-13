# Positioning and franchises: the plan

Status: **proposed** (4 November 2026; revised 10 November 2026 with Intelligence as the home for
the briefings, a source watch list, a 14-day news window, the AI tools cluster, and Jim's answers
to the open questions). Nothing here changes how the site or the routine works until Jim approves
it and the build PR lands. Comment on the pull request line by line.

## 1. The new positioning

> **The Learning Curve is the independent intelligence platform for people who design, deliver
> and shape digital learning.**
>
> Short line (already in `docs/design.md`): *Intelligence for the people shaping the future of
> learning.*

The shift in one sentence: from evergreen how-to plus occasional trends, to evergreen how-to **plus
a steady, dated stream of the newest research, developments and tools**, read and judged by
people who build courses.

What stays the same:

- **Evidence first.** Every claim links to a primary source; ratings stay calibrated. "Intelligence"
  means sourced, dated and judged, not a feed of announcements.
- **Independence.** No paid placements, no sponsored reviews. Affiliate rules (`docs/affiliates.md`)
  apply to every franchise.
- **SEO strategy.** The backlog, keyword rules and the library/guides/reviews/trends streams carry
  on. Franchises are a layer on top of them, not a replacement.

What changes:

- **Audience.** From "people who build online courses" to eight segments (section 2). Every piece
  names who it's for.
- **Shape.** From individual articles to individual articles *plus* recurring franchises (section 3)
  that readers come back for, share and subscribe to.
- **Rhythm.** A fixed weekly calendar (section 4), with the Weekly Curve as the weekly email.
- **Scope of tools.** From four course platforms to EdTech generally: authoring tools, LMSs,
  assessment, AI, video and credential tools.

## 2. Audience

The eight segments, grouped by what they come to us for:

| Group | Segments | What they want from us |
|---|---|---|
| **Practitioners** | Instructional and learning designers; L&D professionals; online educators and course creators; university learning and teaching teams | What works, how to do it on Monday, which tool will let them |
| **Leaders** | Corporate training managers; professional associations and education leaders | What's changing, what it means for their people, what to decide |
| **Builders and researchers** | EdTech founders and product developers; researchers and academics | Evidence and market signals: what learners need, what the research says, where the field is going |

How it shows up:

- A new `audience` field on every article: one to three segments, the first being the primary.
  Shown as a "For:" line under the standfirst, and used for future "for L&D teams" collection pages.
- The voice stays "a working learning designer who reads the research", but writes for a colleague
  anywhere in the field. Pieces for leaders lead with the decision, not the technique.
- Proposed new section 1 of `docs/editorial.md`:

  > **Who we write for.** People who design, deliver and shape digital learning: instructional and
  > learning designers, L&D teams, course creators, university learning and teaching teams,
  > training managers, education leaders, EdTech builders and researchers. They're busy, sceptical
  > of hype, and have read a dozen "10 tips" posts that said nothing. They want to know what the
  > evidence says, what's changing, and what to do about it. Every piece names its primary reader.

## 3. The six franchises

Each franchise has a fixed name, format, slot and quality bar, so readers know what they'll get
and the routine can produce it reliably. All of them follow the hard rules in `CLAUDE.md`: no
invented statistics, quotes, people or results; primary sources; `[JIM:]` and `[TO VERIFY:]`
flags; Jim's merge is the approval.

### The Weekly Curve: five developments that matter this week

- **For:** everyone; the franchise most readers meet first.
- **Slot:** Monday 12:00 Sydney (Sunday evening in the US, so it's there for Monday morning).
  Drafted by the Sunday 20:45 run, covering Monday to Sunday.
- **Format:** 700–1,100 words. A one-paragraph intro naming the week's theme, then five items.
  Each item: a headline, what happened (dated, linked to the primary source: the announcement,
  report, paper or regulator's page), *why it matters* in two or three sentences, and who it matters
  for. Closes with one link into the library or a guide.
- **Selection rules:** published in the last 7 days, found through the watch list (section 3a); at least three different kinds (research,
  product, policy, market, people); no more than one item per company; no press release rewritten
  as news without independent significance. Five strong items or fewer: never pad to five with
  weak ones (four is fine, and the title says so).
- **Reader check:** poll.
- **Email:** becomes the weekly newsletter (section 5).

### The Evidence Brief: one piece of research, translated

- **For:** practitioners first, researchers second.
- **Slot:** Wednesday 12:00.
- **Format:** 800–1,200 words. What the study asked, what it did (design, sample, interval), what
  it found (effect sizes as reported), how much weight to put on it, and what it means for a
  designer, a manager and a builder: one practical line each. Ends with "What we'd do".
  One research card; a chart where the paper reports numbers worth seeing.
- **Selection rules:** by default a study published (or first online) in the **last 60 days**, from
  the watch list's journals and preprint servers, so the brief is genuinely new: a meta-analysis,
  systematic review or well-designed study. An older landmark the library leans on is allowed at
  most once a month, labelled "From the archive". Preprints are labelled "Not yet peer reviewed". The routine must open the full text
  (not only the abstract) to write one; if it can't, it picks another paper.
- **Links:** to the library entry for the principle, and the entry's `sources` gets the paper at
  its next re-check.
- **Reader check:** quiz.
- **SEO:** targets the study's topic keyword where one exists ("spaced repetition study",
  "AI tutor research").

### Tool of the Week: one EdTech tool, evaluated

- **For:** practitioners and leaders choosing tools; builders watching competitors.
- **Slot:** Friday 12:00.
- **Format:** 700–1,000 words. What it is and who it's for; how well it supports learning (the
  same criteria as our review method: retrieval, assessment, credentials, analytics), each backed
  by the tool's own current documentation; pricing with the date checked; "Worth a look if… / Look
  elsewhere if…".
- **Two levels, always labelled at the top:**
  - **First look** (default): from the tool's own documentation, pricing and public demos. Says so
    plainly: "First look: based on the tool's documentation, not hands-on testing." No scores. Any
    feature claim the docs don't confirm gets `[TO VERIFY:]`.
  - **Tested**: only when Jim's notes exist in `docs/testing/<tool>.md`. Can carry scores, which
    must match any full review.
- **Rules:** tools come from the technology directory (`src/data/directory/products/`, see
  `docs/directory.md`): every Tool of the Week is a Discover profile, and the piece is tagged with
  its `products`, `vendors` and `categories` so it appears on that profile. If the tool has no
  profile yet, the run adds a draft profile first (sourced facts only). Affiliate links still come
  only from `platforms.json`, set by Jim.
- **Start with the AI guide's 25 tools.** The first run of issues works through the tools in *25 AI
  tools for learning design, and how to use them well* (`src/data/reports/ai-tools-for-learning-design.ts`),
  one per category in rotation, each linking to the guide and its download page. A tool is never chosen because it has an affiliate
  program; commission never changes the verdict. CredentialCraft is never Tool of the Week.
  Vendors can suggest a tool; they can't pay for one or see it before it's published.
- **Mix:** rotate categories (authoring, LMS and course platforms, assessment, AI, video,
  credentials, community) so no category repeats within four weeks.
- **Reader check:** poll ("Do you use it?" and one about the category).
- **SEO:** each targets "`<tool>` review" or "what is `<tool>`", often low-difficulty long-tail.

### The Learning Curve 10: ten developments, ideas or resources

- **For:** everyone; built to be shared.
- **Slot:** the first Saturday of each month, 12:00.
- **Format:** 1,000–1,500 words. Ten numbered items with two to four sentences each, a mix of: two
  pieces of research, two tools, two good reads or talks, two developments, two ideas or frameworks.
  Every item links to its source. Can draw on the month's Weekly Curves, but at least half the items
  are new.
- **Reader check:** poll.
- **Email:** the monthly issue for readers who choose monthly over weekly (section 5).

### The Big Question: one industry question, with reader responses

- **For:** leaders and practitioners; builds the community and the email list.
- **Slot:** Tuesday 12:00, every other week, in two parts:
  - **The question** (week 1): 600–900 words. The question, why it's live now, the strongest case on
    each side with evidence, and what we think. Readers answer in a short form at the end.
  - **The answers** (week 3): 800–1,200 words. A synthesis of the responses, quoting real ones
    with the respondent's permission and their chosen name and role, plus a poll of how readers
    leaned. If fewer than five usable responses arrive, the answers piece is skipped and the slot
    goes to the backlog.
- **Rules:** responses are never invented, edited for meaning or attributed without consent.
  Respondents choose how they're credited (name and role, role only, or anonymous). Jim approves
  each response before it can be quoted.
- **Needs building:** a response form (name, role, organisation optional, answer, credit choice,
  consent, email optional), stored like the reader checks, and a moderation view in the review desk.
- **Reader check:** the question piece uses the response form instead; the answers piece, a poll.

### The Practitioner's View: short interviews with people doing interesting work

- **For:** everyone; puts real people and real courses on the site.
- **Slot:** Thursday 12:00, when an interview is ready. Otherwise the slot goes to the backlog.
  Target: fortnightly.
- **Format:** 800–1,400 words. A short introduction (who they are, why we asked), then edited
  Q&A of five to eight questions, and one "What other designers can take from this" box.
- **Rules:** only from a real interview Jim conducts (call transcript or written answers), saved as
  `docs/interviews/<slug>.md` with the interviewee's sign-off noted. The routine can prepare an
  interview brief (who to ask, why, eight questions) and turn a transcript into a draft; it never
  writes an answer, a quote or a person. The interviewee approves the edited version before merge.
- **Reader check:** poll.

## 3a. Staying current: the watch list and the news window

"Cutting edge" is a sourcing problem before it's a writing problem. Every briefing run starts from a
fixed watch list, checked in this order, and records in the PR which sources it checked.

| Kind | Sources |
|---|---|
| Journals | Computers & Education; British Journal of Educational Technology; Learning and Instruction; Educational Psychology Review; Journal of Educational Psychology; Internet and Higher Education; International Journal of Educational Technology in Higher Education; Australasian Journal of Educational Technology |
| Preprints and indexes | arXiv (cs.CY, cs.HC, cs.AI with education terms); EdArXiv; ERIC new records; Google Scholar alerts on the library's principles |
| Conferences | Learning at Scale (L@S), LAK, AIED, EDUCAUSE Annual, ASCILITE, DevLearn, ATD ICE (dated papers and announcements only) |
| Policy and regulators | TEQSA, ASQA and the Australian Department of Education; UK DfE and OfS; US Department of Education and NCES; European Commission (Digital Education Action Plan); UNESCO; OECD |
| Research and market | EDUCAUSE; HolonIQ; Jisc; HEPI; Credential Engine; Brandon Hall; LinkedIn Learning's Workplace Learning Report; Josh Bersin (labelled as analyst opinion) |
| Vendors | Release notes and announcements from every active product in the directory, and the AI labs' education announcements (OpenAI, Google, Anthropic, Microsoft) |

**News windows:**

- The Weekly Curve: the last 7 days.
- The Evidence Brief: the last 60 days by default (see above).
- Backlog trends rows: the last **14 days** (down from 60), so a trends piece reads as news. If
  nothing important happened in 14 days, widen to 60 and say so in the PR.

**What counts:** a primary source with a date. A vendor's announcement is a source for what the
vendor says, not for whether it works: say "Acme says…" and look for independent evidence. A
press release rewritten by a trade site is not a source; find the original.

**Keeping it:** the run appends what it checked and anything it passed over but might use later
to `docs/watch-log.md` (date, source, item, link, why it's interesting), so the next run doesn't
start from nothing and the Learning Curve 10 can draw on the month.

## 3b. Intelligence: where the briefings live

Intelligence stops being a preview page and becomes the home of everything dated and analytical:

- **Free (now):** the Weekly Curve, the Evidence Brief, the Learning Curve 10, the Big Question,
  the Practitioner's View, the data stories, and the reports (starting with *25 AI tools for learning
  design*). `/intelligence/` becomes their front page: the latest Weekly Curve, the latest Evidence
  Brief, the reports, and the stat panel already on the page.
- **Members (later):** the deeper layer the page already promises (market data, evaluations,
  assurance findings from the directory, full reports). Nothing in this plan depends on
  membership opening.
- **URLs:** issues live at `/intelligence/<slug>/` (replacing the `/briefings/` path proposed in
  section 5). Library, Guides and Reviews are unchanged.
- **Existing trends pieces** move under Intelligence with permanent redirects from `/trends/<slug>/`
  (decided, section 6). The `trends` kind stays in the schema for backlog news pieces, which now
  publish under Intelligence too.

## 3c. The AI tools cluster

The guide *25 AI tools for learning design, and how to use them well* is the main lead magnet, and
nothing on the site points to it yet. From now on:

- **Every article** is tagged with the directory `categories` it touches and the `products` it
  names (where a profile exists), so it shows up on Discover. This becomes a writing rule in
  `docs/editorial.md` and a step in `CLAUDE.md`.
- **Link to the guide where it helps the reader:** any piece about AI, authoring, assessment, video
  or tools gets one in-context sentence linking to the guide's landing page. No banners, and never in a
  library entry's evidence section.
- **Satellite pieces:** new backlog rows that take one of the guide's eight jobs or five roles and
  go deeper, each linking back to the guide and to the tools' profiles. Candidates (keywords to be
  checked in Ubersuggest before they're added): AI for writing quiz questions; building a source
  pack with NotebookLM; AI course authoring tools compared (Coursebox, Mindsmith, Articulate 360
  AI); AI video for training (Synthesia); AI tutors, what the evidence says; a buying checklist for
  AI learning tools; AI for L&D managers; AI for course creators.
- **Weekly Curve and Evidence Brief** items about AI tools link the tool's profile and, where it
  fits, the guide.

## 4. The weekly calendar

Fourteen slots, as now. Franchises take fixed 12:00 slots; the backlog fills the rest.

| Day | 00:00 | 12:00 |
|---|---|---|
| Mon | Backlog | **The Weekly Curve** |
| Tue | Backlog | **The Big Question** (question or answers, alternate weeks); backlog in between |
| Wed | Backlog | **The Evidence Brief** |
| Thu | Backlog | **The Practitioner's View** when ready; otherwise backlog |
| Fri | Backlog | **Tool of the Week** |
| Sat | Backlog | **The Learning Curve 10** on the first Saturday; otherwise backlog |
| Sun | Backlog | Backlog |

That's three to six franchise pieces a week (typically four), leaving eight to eleven slots for
SEO library, guide, review and trends pieces.

**Consequences for the backlog:**

- SEO pieces drop from 14 to roughly 9 a week. To keep library depth, the remaining slots lean
  harder to library and guides: the mix rule becomes about **6 library or guide, 2 trends, 1 review
  or comparison** per 9 backlog slots (trends partly moves into the Weekly Curve; tool coverage
  partly into Tool of the Week).
- Flagships keep their pinned weeks and take the first free backlog slot that week.
- The 72-hour pile-up rule stays: if Jim is behind on reviews, the routine stops.

**How the routine picks:** unchanged in spirit. It takes the earliest free slot at least 12 hours
away. If that slot belongs to a franchise, it writes that franchise. If the franchise can't run
(no interview, too few Big Question responses, no paper it can open in full), it writes the next
backlog row for that slot instead and says why in the PR.

## 5. Site and email changes (the build PR)

- **Tagline and descriptions:** the new positioning in `src/site.config.ts`, the homepage, About,
  the default share image ("Research · Practice · Reviews" becomes something like "Independent
  intelligence for digital learning"), and the newsletter pages.
- **Franchise hubs:** `/series/` listing all six, and `/series/<franchise>/` for each, with its
  promise, schedule and every issue. Issues carry a series badge ("The Weekly Curve · No. 12") and
  links to the previous and next issue.
- **Where issues live:** under **Intelligence** (`/intelligence/<slug>/`, section 3b) for the Weekly
  Curve, the Evidence Brief, the LC10, the Big Question, the Practitioner's View and trends pieces,
  with redirects from the old `/trends/` URLs. Tool of the Week lives in **Reviews**
  (`/reviews/<slug>/`), as a lighter kind next to full reviews, and on the tool's Discover profile.
  The Intelligence nav item stays where it is and now opens onto real content.
- **Schema:** `series` (one of the six), `issue` (number), `audience` (segments), a `firstLook` /
  `tested` level for tools (tools are directory products), and a build check that a Tool of the
  Week is tagged with its product. The build checks each franchise's rules (five items or
  fewer for the Weekly Curve, ten for the LC10, the "first look" label on untested tools).
- **Email:** the Weekly Curve becomes the weekly email; readers can choose weekly or monthly (the
  monthly is the LC10). Sign-up copy changes from "once a month" to "weekly or monthly, you choose".
  Beehiiv's segments handle the choice; Jim sends from Beehiiv.
- **The Big Question form** and its moderation in the review desk, as in section 3.
- **Routine:** `CLAUDE.md` gains the calendar, the watch list step and a short procedure per
  franchise; `docs/editorial.md` gains the new section 1, a section per franchise format, the
  directory tagging rule and the AI guide linking rule; `docs/backlog.md` gets the 14-day trends
  window and the AI cluster rows; a new `docs/watch-log.md`.

## 6. Decisions (Jim, 10 November 2026)

1. **Trends folds into Intelligence**, with permanent redirects from `/trends/<slug>/`.
2. **The weekly email sends at publication** (Monday 12:00 Sydney).
3. **The Big Question runs fortnightly**, and Jim approves each response before it's quoted.
4. **The routine keeps a running list of suggested interviewees** (`docs/interviews/suggestions.md`)
   from people and projects in the Weekly Curve, with a short brief for each.
5. **Tool of the Week: only CredentialCraft is off limits.**
6. **Start date: Monday 16 November 2026** for the first Weekly Curve. The build PR needs to merge
   by Friday 13 November so the Sunday 15 November 20:45 run can draft it.
