# Positioning and franchises: the plan

Status: **proposed** (4 November 2026). Nothing here changes how the site or the routine works
until Jim approves it and the build PR lands. Comment on the pull request line by line; the open
questions are at the end.

## 1. The new positioning

> **The Learning Curve is the independent intelligence platform for people who design, deliver
> and shape digital learning.**

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
- **Selection rules:** published in the last 7 days; at least three different kinds (research,
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
- **Selection rules:** a meta-analysis, systematic review or well-designed study published in the
  last 24 months, or an older landmark the library leans on. The routine must open the full text
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
- **Rules:** tools come from a new `src/data/tools.json` (like `platforms.json`, with
  `affiliateUrl: null` until Jim sets it). A tool is never chosen because it has an affiliate
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
- **Where issues live:** a new **Briefings** section (`/briefings/<slug>/`) for the Weekly Curve,
  the Evidence Brief, the LC10, the Big Question and the Practitioner's View. Tool of the Week lives
  in **Reviews** (`/reviews/<slug>/`), as a lighter kind next to full reviews. Library, Guides,
  Reviews and Trends are unchanged. The nav becomes Library · Guides · Reviews · Briefings · Trends ·
  Newsletter.
- **Schema:** `series` (one of the six), `issue` (number), `audience` (segments), a `firstLook` /
  `tested` level for tools, and `tools.json`. The build checks each franchise's rules (five items or
  fewer for the Weekly Curve, ten for the LC10, the "first look" label on untested tools).
- **Email:** the Weekly Curve becomes the weekly email; readers can choose weekly or monthly (the
  monthly is the LC10). Sign-up copy changes from "once a month" to "weekly or monthly, you choose".
  Beehiiv's segments handle the choice; Jim sends from Beehiiv.
- **The Big Question form** and its moderation in the review desk, as in section 3.
- **Routine:** `CLAUDE.md` gains the calendar and a short procedure per franchise; `docs/editorial.md`
  gains the new section 1 and a section per franchise format.

## 6. Open questions for Jim

1. **Briefings or Trends?** Keep Trends as its own section next to Briefings, or fold Trends into
   Briefings (the Weekly Curve covers most of what Trends does)? Folding is simpler for readers but
   moves existing trends URLs; redirects would keep their search traffic.
2. **Weekly email timing.** Publish Monday 12:00 Sydney and send the email Monday 07:00 US Eastern,
   or send at publication for Australian readers?
3. **The Big Question.** Is fortnightly right, and are you happy to approve each response before
   it's quoted?
4. **The Practitioner's View.** Do you want the routine to keep a running list of suggested
   interviewees (from people and projects in the Weekly Curve), with a brief for each?
5. **Tool of the Week scope.** Any tools or categories that are off limits (competitors of
   CredentialCraft, for example), beyond CredentialCraft itself?
6. **Start date.** Suggest Monday 16 November 2026 for the first Weekly Curve, so the build PR can
   land and the first issue of each franchise can be reviewed with time to spare.
