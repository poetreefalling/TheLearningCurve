# Editorial guide: The Learning Curve

Read this in full before every draft. It is the publication's style guide and the drafting
skill.

## 1. Who we write for

People who build online courses and want them to work: course creators selling their
expertise, instructional designers, L&D teams, educators moving online, and people moving
into instructional design. They are busy, sceptical of hype, and have read a dozen "10 tips"
posts that said nothing. They want to know what the evidence says, what to do on Monday, and
which platform will let them do it.

## 2. Voice

The voice is a working learning designer who reads the research, writing for a colleague.

- **Plain and exact.** Short sentences. Concrete nouns. Say "a five-question quiz at the end of
  each module", not "assessment opportunities".
- **Evidence first, then judgement.** Say what the studies found, how strong the evidence is,
  then what we'd do. Make the line between the two visible ("The research shows… In practice,
  we'd…").
- **Calibrated.** Use "strong evidence", "some evidence" or "early evidence" rather than
  "proven" or "studies show". Name the limits: lab study, university students, short
  retention interval.
- **Warm, dry, never breathless.** No exclamation marks. No "game-changer", "unlock",
  "leverage", "dive into", "in today's fast-paced world", "revolutionise", "seamless",
  "robust", "it's important to note".
- **Australian/British spelling** (organise, programme only for TV, colour, centre,
  behaviour, enrol). Dates as 9 November 2026. Prices in USD with the currency shown.
- **"We"** for the publication's view. First-person singular only in passages Jim writes
  himself (the `[JIM:]` slots).
- Explain every term the first time: "retrieval practice (recalling information from memory
  rather than re-reading it)".

## 3. Headlines, standfirsts, descriptions

- Headline ≤ 70 characters, contains the target keyword naturally, makes a specific promise.
  Good: "Worked Examples: How to Teach a Complex Skill Online". Bad: "The Ultimate Guide to
  Worked Examples".
- Standfirst ≤ 220 characters: the article's answer or argument in one sentence, not a teaser.
- Meta description 140–160 characters: what the reader will learn, with the keyword.
- Kicker: the library principle, the platform, or the section ("Retrieval practice",
  "Thinkific", "Trends").

## 4. The short answer, takeaways and FAQs

- **The short answer** (`summary`): 40–60 words that answer the target query outright, as if it
  were the only thing the reader saw. AI answer engines quote this, so it must stand alone and
  be accurate without its context.
- **Key takeaways:** 3–5 bullets, each a complete, specific sentence.
- **FAQs:** 3–6 real questions from "People also ask", Ubersuggest questions or the ranking
  pages. Answers 40–80 words, self-contained.

## 5. Article shapes

### Library (`kind: library`), 1,800–2,800 words

The four-part shape every library entry follows, so the collection reads as a repository:

1. **What the research says.** Plain-English summary of the principle and the evidence, with
   its strength (`library.evidence`: strong / moderate / emerging). Every claim linked to a
   primary source. One or two research cards. A chart if a study reports numbers worth seeing.
2. **How to apply it in a course.** A worked example from a real course build, step by step.
   Include a "Try this in your course" callout. Leave a `[JIM:]` slot for his own example.
3. **How the platforms support it.** What Thinkific, LearnWorlds, Teachable and Kajabi can and
   can't do for this principle, each linked to its review. Feature claims follow the
   verification rule.
4. **Further reading.** Three to six sources worth reading in full, with one line on why.

Every library entry also fills two fields for the [evidence map](/library/evidence-map/), the
page that lists every principle with its rating:

- `library.verdict`: one sentence, at most 160 characters, saying what to do in a course. It
  reads after "In practice:", so start with a verb. Good: "Explain a meaningful picture with
  narration at the same moment; keep on-screen text to key terms." Not a summary of the research.
- `library.category`: one of `Memory and practice`, `Presenting information`, `Feedback and
  assessment`, `Course structure`, `Motivation and engagement`.
- Use the rating definitions shown on the map: **strong** (consistent across many studies and
  reviews, including real courses), **moderate** (consistent experiments, but mostly lab, one
  programme or one kind of learner), **emerging** (early, small or mixed).

The map's "Popular but unsupported" section comes from `src/data/myths.json`. When an entry
debunks a popular claim (learning styles, the learning pyramid), set that myth's `article` to the
entry's slug so the map links to it. Add a new myth only with a primary source you've opened.

### Guide (`kind: guide`), 1,500–2,500 words

Answer the query in the opening paragraph. Then a numbered process or a decision framework,
with an example at every step. Link to the library entries the guide relies on. End with
"What to do next": one concrete action.

### Review (`kind: review`), 2,500–3,500 words

1. The verdict first: who it's best for, who should look elsewhere, overall score.
2. How we tested (date, plan, what we built) from Jim's testing notes.
3. Learning design: retrieval, assessment, credentials, learner analytics. Score each with
   evidence.
4. Business tools: pricing, payments, marketing. Score each.
5. Pricing table with "Prices checked on <date>".
6. Alternatives, linked to their reviews.
7. FAQs.

Screenshots come only from Jim. Never describe a screen or a feature you haven't seen in his
notes or the platform's current documentation.

### Comparison (`kind: comparison`), 2,000–3,000 words

The short answer names a winner for each type of reader ("Choose Thinkific if…; choose
Teachable if…"). Then the comparison table, then criterion by criterion with the same scores
as the individual reviews, then pricing, then FAQs. Scores must match the platforms' reviews;
if a review doesn't exist yet, say the score is provisional.

### Trends (`kind: trends`), 900–1,500 words

What happened (dated, linked to the primary source), why it matters for people who build
courses, what the evidence says about the underlying idea, and what we'd do. No predictions
dressed as facts. A trends piece that's really evergreen should become a guide instead.

## 6. Research and citations

- Cite primary sources: the study, the review, the report. Not a blog that cited it.
- Open every source you cite. Link the DOI where there is one (`https://doi.org/…`).
- Inline citation style: a linked author-year in the sentence, "(Roediger & Karpicke, 2006)",
  with the full reference in `sources`.
- Report effect sizes or percentages only when they appear in the source, with what was
  measured, on whom, and over what interval.
- Distinguish the finding from its popular version. Say so when a widely shared claim (the
  "learning pyramid", "learning styles", "we remember 10% of what we read") lacks support.
- Research card excerpts: verbatim, at most two sentences, and the highlight is the phrase
  that carries the finding. Jim checks every card against the paper before merging.

## 7. Links

- Three to six internal links per article, to the library first. Descriptive anchor text, never
  "click here".
- External links open the primary source. No links to competitors' affiliate pages.
- Platform links use the `platforms` collection so affiliate links apply automatically when Jim
  adds them. Affiliate links carry `rel="sponsored noopener"`.

## 8. Disclosure

- Any article with an affiliate link shows, above the first one:
  "Some links on this page are affiliate links: if you sign up through one, we may earn a
  commission at no cost to you. It never affects how we score a platform.
  [How we're funded](/disclosure/)."
- Any mention of CredentialCraft carries, at first mention:
  "(CredentialCraft is the course-design company run by this site's founder.)"
- CredentialCraft is never ranked, scored against the platforms, or placed in a "best of" list.
  Case studies need the client's permission; Jim provides them.

## 9. The review method (published at /how-we-review/)

Every platform is scored on seven criteria from 1 to 5, using the same plan tier for each
comparison (the cheapest plan that includes certificates).

**Learning design (weighted 60%)**

| Criterion | 5 means | 1 means |
|---|---|---|
| Retrieval | Quizzes with varied question types, question banks, randomisation and retake rules; easy to place practice through a course | Quizzes absent or end-of-course only |
| Assessment | Assignments, rubrics, instructor feedback, graded submissions | Multiple choice only, no feedback |
| Credentials | Configurable certificates, completion rules, verifiable or shareable credentials (e.g. Open Badges) | No certificates, or a fixed template only |
| Analytics | Per-learner and per-question data, drop-off by lesson, exportable | Enrolment counts only |

**Business tools (weighted 40%)**

| Criterion | 5 means | 1 means |
|---|---|---|
| Pricing | Clear plans, no transaction fees at the tested tier, fair value for a small creator | Opaque or fee-heavy |
| Payments | Subscriptions, bundles, coupons, payment plans, tax handling | One-off payments only |
| Marketing | Landing pages, email, affiliates, upsells built in | Needs third-party tools for the basics |

Overall = 0.15 × each learning criterion + 0.1333 × each business criterion, rounded to one
decimal place. Scores change only when the platform changes or Jim re-tests; the review's
`updated` date says when.

## 10. Images

Every article has one hero image. Choose the style:

| Style | When | Share |
|---|---|---|
| Documentary | Default. Anything with a human situation: someone taking a course, learning at work, studying on campus, designing or filming a lesson | About 80% |
| Risograph | Ideas people can't show: a design model, a memory effect, a process | About 20% |
| Screenshot | Reviews, when Jim has supplied one | Reviews only |

Never put words, numbers, charts or diagrams in a generated image. Those are research cards
and charts, which the site builds from source data.

### Documentary: what to show

Real and observed, but in brighter, more contemporary places than a cluttered back office:
the kind of space a reader would like to work or study in. Rotate through four scenes, and
check the last ten heroes so the series keeps moving:

| Scene | What it looks like | Share |
|---|---|---|
| **Learners taking a course** | Someone working through a lesson on a phone, tablet or laptop: in a dorm room, on a train, at a café window, on a sofa, at a kitchen bench, between shifts | About a third |
| **Business and workplace learning** | Professionals in modern offices, co-working spaces, glass-walled meeting rooms or training rooms: an L&D lead planning a programme, a team in a workshop, a manager doing a module at their desk | About a quarter |
| **Education institutions** | University campuses, modern libraries, lecture theatres, seminar rooms, TAFE and college workshops, teaching studios | About a quarter |
| **Course builders at work** | Designing, storyboarding, scripting or filming a course, in a bright home studio, studio office or shared workspace | The rest |

Match the scene to the article where you can (a workplace scene for corporate L&D, a campus
for higher education, a learner on a phone for microlearning). Never use the same scene type
three heroes in a row. Vary people across the series: age, gender, background, and places in
Australia and elsewhere.

### Documentary prompt template

Use with `brand/documentary-reference.webp`. Fill the brackets; keep the rest word for word.

> Candid documentary photograph, observed not posed, in a bright, contemporary, well-designed
> space. [ONE PERSON OR TWO PEOPLE, everyday or smart-casual clothes, any age and background]
> [DOING THE SPECIFIC ACTIVITY, e.g. working through a course lesson on a tablet] in [A REAL,
> ASPIRATIONAL PLACE, e.g. a light-filled university library with timber and plants]. Faces
> turned away, in profile or softly out of focus; hands and the device or paper are the
> sharpest part of the frame. Natural daylight, clean true-to-life colour with gentle warmth,
> soft shadows. 35mm film look, light fine grain, slightly imperfect framing, shallow depth of
> field. Screens show only a soft, unreadable blur of a lesson layout. Use the reference image
> for photographic style only, not its people, room or objects. No text, no logos, no brand
> marks, no watermarks, no glossy stock-photo styling, no staged smiles at the camera.

Alt text describes what's in the photo plainly. Caption is optional. Documentary images carry no
per-image credit; the footer, About and Disclosure pages say they are AI-generated illustrations.

### Risograph prompt template

Use with `brand/risograph-reference.webp`.

> Risograph print illustration in two inks, deep navy and ochre, on warm off-white paper.
> Visible grain, slight misregistration between the inks, halftone texture. [ONE IDEA AS A
> SIMPLE VISUAL METAPHOR, e.g. a path of stepping stones that spaces out as it crosses a
> river]. Flat simple figures with no facial features if people appear. Generous empty space,
> one focal point. No text, no letters, no numbers, no logos.

Credit: "Illustration: The Learning Curve".

### Checking the image

Reject and regenerate once if it has: any text or pseudo-text, a logo, malformed hands or
extra fingers, a sharp, centred face looking at the camera, a glossy commercial look, or a
subject that doesn't match the article. If the second attempt also fails, stop and report;
don't publish a weak image.

## 11. Reader checks: the quiz or poll at the end

Every library, guide and trends article ends with a `readerCheck` in its frontmatter. The site
shows it after the article body with "Answer to see the results", then a bar chart of how all
readers answered. How it works and the setup are in `docs/reader-checks.md`.

### Which kind

- **Trends:** always a poll.
- **Library and guides:** alternate. Look at the most recent library or guide article by
  `published`, on `main` and in open `article/` PRs, and use the other kind. (If that one has
  none, use a quiz.)
- **Reviews and comparisons:** none. A poll next to a score would read as part of the score.

### Quiz (`kind: quiz`): exactly three questions

- Test the ideas that matter, usually the key takeaways: the finding, the rule of thumb, the
  common mistake. Not trivia (a year, a page number, an author's first name).
- Every right answer must be stated in the article itself, so a careful reader can get all three.
  Never introduce a fact here that isn't in the body.
- Four options (three is fine for a yes/no-style question). Wrong options are plausible: the
  popular misconception, the half-right version, the thing a rushed reader would pick. No
  "all of the above", no jokes, no trick wording.
- Vary which position holds the right answer (`answer` is its index, from 0).
- `why`: one or two sentences, at most about 40 words, saying why the answer is right in the
  article's terms, with the number or source if there is one. It reads after "Right." or
  "Not quite.", so it must make sense after either.

### Poll (`kind: poll`): one to three questions

- About the reader's own work, linked to the article's topic: their practice (when they test,
  how long their lessons are), the LMS or platform they use, the kind of courses they build, the
  software they prefer.
- Neutral wording that doesn't hint at a right answer. "When do you write your objectives?",
  not "Do you skip objectives?"
- Options are mutually exclusive and cover the common cases, ending with "Something else" or
  "None" where needed. Up to six options. Platform and tool names are fine; keep them neutral
  and never favour a platform with an affiliate program.
- Never ask for anything personal or identifying: no names, employers, locations, pay, health
  or age.
- Poll results are not research. Never quote them in an article as a statistic or a finding.

### Format

```yaml
readerCheck:
  kind: quiz
  questions:
    - q: "In Mayer's table of design principles, which had the largest effect?"
      options:
        - "Adding printed text to narration (redundancy)"
        - "Words with relevant pictures (multimedia)"
        - "Cutting extras (coherence)"
        - "Highlighting what matters (signalling)"
      answer: 1
      why: "Words with pictures had an effect size of 1.35 across 13 tests, the largest in the table."
```

A poll has the same shape without `answer` and `why`. Questions at most 200 characters, options
at most 120. The build checks the rules above (quiz has three questions with answers, trends is a
poll, reviews have none).

Once an article is live, don't change its options: readers' answers are counted against their
position. Fix a typo in the wording if you need to; anything bigger, ask Jim to reset the results.
