# Supplied heroes

Hero images waiting for an article: ones Jim generated (Nano Banana 2, image-to-image, 3:2, with
`brand/documentary-reference.webp`) and licensed photographs he supplied. The routine checks this
folder first (CLAUDE.md step 6). When it uses an image it moves it to `brand/originals/<slug>.webp`
and deletes its line here, so no image is used twice.

There are two tables. **Assigned** images are for one backlog row and are used for that article.
**Pool** images aren't assigned: the routine may use one for any article it fits, but only after
Artlist can't produce a hero (step 6, option 3).

**Photo credits.** Some images here are licensed photographs, not generated ones. When a line's
Notes give a credit (for example `hero.credit: "Photo: RDNE Stock project / Pexels"`), set
`hero.credit` to exactly that in the article's frontmatter. The site shows it under the hero
(documentary heroes otherwise show no credit). Lines with no credit are generated images and get no
`hero.credit`.

## Assigned

| File | Backlog row | Style | Scene | Alt text (starting point) | Notes |
|---|---|---|---|---|---|
| principles-of-learning-science.webp | 51 (Principles of Learning Science Every Course Builder Should Know) | documentary | Learners taking a course: a university library | A young man with dark curly hair, glasses and a white earbud, in a green hoodie, writes notes in a spiral notebook while a video lesson plays on a tablet propped on a timber table, with a black drink bottle, shelves of books and trailing plants in a sunlit library | Supplied by Jim, 21 Nov 2026. If the article's slug differs, use it anyway for row 51 and rename on the move. |
| instructional-design-tools.webp | 53 (Instructional Design Tools: What You Need and What You Don't) | documentary | Course builders at work: a home studio | A bearded man in a charcoal jumper, seen from behind, sketches on a drawing tablet beside a spiral storyboard pad while a video lesson edit plays on a large monitor, with a boom microphone, headphones and a mug on a timber desk by a sunny window | Supplied by Jim, 21 Nov 2026. If the article's slug differs, use it anyway for row 53 and rename on the move. |
| digital-badges-examples.webp | 54 (Digital Badge Examples From Employers and Universities) | documentary | Business and workplace learning: a hospital staff lounge | A woman with dark hair tied back, in a grey cardigan over navy scrubs with a staff lanyard, looks at a module-complete screen with a badge icon on her phone at a timber table, a takeaway cup and notebook beside her, in a bright staff lounge with plants | Supplied by Jim, 21 Nov 2026. The screen's small "Module complete" heading is legible; it's interface text, not a sign or caption, so it passes. If the article's slug differs, use it anyway for row 54 and rename on the move. |
| row-55-part-time-instructional-design-jobs.webp | 55 (Part-Time Instructional Design Jobs) | documentary (supplied photograph) | Course builder at work | "Seen from above, a woman's hand marks up a printed sheet of chart and diagram sketches with a red marker, on a timber desk covered with technical drawings, markers, a pen and a lined notebook" | Pexels photo by RDNE Stock project: set `hero.credit: "Photo: RDNE Stock project / Pexels"`. Brand text on the three markers blurred so it passes the logo check. |
| row-56-gamification-in-elearning.webp | 56 (Gamification in eLearning) | documentary | Learners taking a course | "A man with greying hair in a linen shirt, seen over his shoulder, taps an answer in a practice quiz with a progress bar on a tablet, in a sunlit living room with a woven rug, an armchair and a cup of tea" | Supplied at 1536 × 1024, below the 2000 px hero width. |
| row-57-instructional-design-examples.webp | 57 (Instructional Design Examples, Annotated) | documentary (supplied photograph) | Course builder at work | "A woman with long brown hair and glasses, in a cream corduroy shirt, smiles as she types on a laptop during a video call, at a timber desk with a notebook and plants, in front of a chalkboard wall of hand-drawn planning diagrams" | Jim approved this photo as is and holds the rights: don't apply the face or large-text checks, use it. Set `hero.credit: "Photo: silverkblack / Pexels"`. Landscape 16:9; images.py crops it to 3:2 from the centre, which keeps her in frame. |
| row-59-instructional-design-contract-work.webp | 59 (Instructional Design Contract Work) | documentary (supplied photograph) | Course builder at work | "A woman with long light-brown hair and round glasses, in a denim shirt over a striped T-shirt, smiles as she types on a laptop at a timber desk, in a studio office with a painted brick wall, shelves of folders and a pegboard" | Jim approved this photo as is and holds the rights: don't apply the face check, use it. Set `hero.credit: "Photo: silverkblack / Pexels"`. Landscape 16:9; images.py crops it to 3:2 from the centre, which keeps her in frame. |

## Pool

Unused images from Jim's style tests (November 2026 audit). Not assigned to any row. Use one only
when the scene genuinely fits the article, and check it against the image rules like any other.
Notes say what to watch for.

| File | Style | Scene | Alt text (starting point) | Notes |
|---|---|---|---|---|
| pool-campus-library.webp | documentary | Education institutions: a university library | "A grey-haired man in a light blue shirt, seen over his shoulder, works through a lesson with charts on a laptop at a long timber table in a bright university library with plants and shelves" | 1280 × 859, below the 2000 px hero width, so it will look soft on large screens. Suits higher-education, mature-age study and lifelong-learning pieces. |
| pool-learner-phone.webp | documentary | Learners taking a course: a student room | "A young woman with long braids, in a cream hoodie, sits on her bed with a lesson open on her phone and a laptop and notebook beside her, in a bright student room with plants" | 1280 × 859, below hero width. Her face is in profile and fairly sharp; acceptable for an approved test image, but prefer another option for library entries. Suits microlearning, mobile and self-paced study. |
| pool-workplace-tablet.webp | documentary | Business and workplace learning: an office meeting area | "A man in a navy jumper and a woman in a white shirt sit at a timber table by tall windows while she points to a lesson on a tablet" | 1280 × 859, below hero width. Faces in profile. Suits corporate L&D, coaching and onboarding pieces. |
