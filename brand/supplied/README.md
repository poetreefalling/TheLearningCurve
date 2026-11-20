# Supplied heroes

Hero images Jim has generated ahead of time (Nano Banana 2, image-to-image, 3:2, with
`brand/documentary-reference.webp`), each waiting for its article. The routine checks this folder
before generating (CLAUDE.md step 6). When it uses an image it moves it to
`brand/originals/<slug>.webp` and deletes its line here, so no image is used twice.

**Photo credits.** Some images here are licensed photographs, not generated ones. When a line's
Notes give a credit (for example `hero.credit: "Photo: RDNE Stock project / Pexels"`), set
`hero.credit` to exactly that in the article's frontmatter. The site shows it under the hero, where it
replaces the default note that documentary images are AI-generated. Lines with no credit are
generated images and get no `hero.credit`.

| File | Backlog row | Style | Scene | Alt text (starting point) | Notes |
|---|---|---|---|---|---|
| row-55-part-time-instructional-design-jobs.webp | 55 (Part-Time Instructional Design Jobs) | documentary (supplied photograph) | Course builder at work | "Seen from above, a woman's hand marks up a printed sheet of chart and diagram sketches with a red marker, on a timber desk covered with technical drawings, markers, a pen and a lined notebook" | Pexels photo by RDNE Stock project: set `hero.credit: "Photo: RDNE Stock project / Pexels"`. Brand text on the three markers blurred so it passes the logo check. |
| row-56-gamification-in-elearning.webp | 56 (Gamification in eLearning) | documentary | Learners taking a course | "A man with greying hair in a linen shirt, seen over his shoulder, taps an answer in a practice quiz with a progress bar on a tablet, in a sunlit living room with a woven rug, an armchair and a cup of tea" | Supplied at 1536 × 1024, below the 2000 px hero width. |
| row-57-instructional-design-examples.webp | 57 (Instructional Design Examples, Annotated) | documentary (supplied photograph) | Course builder at work | "A woman with long brown hair and glasses, in a cream corduroy shirt, smiles as she types on a laptop during a video call, at a timber desk with a notebook and plants, in front of a chalkboard wall of hand-drawn planning diagrams" | Jim approved this photo as is and holds the rights: don't apply the face or large-text checks, use it. Set `hero.credit: "Photo: silverkblack / Pexels"`. Landscape 16:9; images.py crops it to 3:2 from the centre, which keeps her in frame. |
| row-59-instructional-design-contract-work.webp | 59 (Instructional Design Contract Work) | documentary (supplied photograph) | Course builder at work | "A woman with long light-brown hair and round glasses, in a denim shirt over a striped T-shirt, smiles as she types on a laptop at a timber desk, in a studio office with a painted brick wall, shelves of folders and a pegboard" | Jim approved this photo as is and holds the rights: don't apply the face check, use it. Set `hero.credit: "Photo: silverkblack / Pexels"`. Landscape 16:9; images.py crops it to 3:2 from the centre, which keeps her in frame. |
