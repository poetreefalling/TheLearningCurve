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
