# Reader checks: the quiz or poll at the end of an article

Library, guide and trends articles end with a short **reader check**:

- a **quiz** (three questions on the article, each with the right answer and one line on why), or
- a **poll** (one to three questions about how readers work: their practice, the LMS or platform
  they use, the kind of courses they build, the software they prefer).

Readers see "Answer to see the results". Once they've answered every question, each option turns
into a bar showing how all readers of that page answered, with their own answer marked. A quiz
also shows the correct answer, a "Right" or "Not quite" and the reason, plus their score.

Library and guide articles alternate between quiz and poll. Trends articles always get a poll,
because their facts date quickly. Reviews and comparisons never get one, so a poll never sits
next to a score. The writing rules are in `docs/editorial.md` section 11.

## One-time setup (about 3 minutes)

The results are stored in a Cloudflare D1 database. Until it's connected, readers still answer
and quizzes still show the right answers, but no bars appear. The page says "Other readers'
results aren't available right now".

1. **The database.** It already exists: Claude created `thelearningcurve-reader-checks` in your
   Cloudflare account on 4 November 2026. (If you don't see it under Workers & Pages → D1, create
   a database with that name.) The tables are created automatically on first use.
2. **Connect it to the site.** dash.cloudflare.com → Workers & Pages → thelearningcurve →
   Settings → Bindings → Add → D1 database. Variable name **`CHECKS_DB`**, database
   `thelearningcurve-reader-checks`. Add it to **Production** only, so answers given on preview
   builds are never counted.
3. **Optional: a salt.** Settings → Variables and secrets → Add, Production, type Secret:
   `CHECK_SALT`, any long random string. It's mixed into the hash that stops one browser counting
   twice. Without it a fixed default is used.
4. **Redeploy** so the binding applies: Deployments → the latest production deployment → ⋯ →
   Retry deployment (or merge the next article).

To check it works, answer a quiz on the live site. The bars should appear with "1 reader has
answered so far".

## How it works

- `src/components/ReaderCheck.astro`: the widget, placed automatically after the article body
  when the frontmatter has `readerCheck`. No JavaScript means no widget, just a note.
- `src/pages/checks/[slug].json.ts`: builds `/checks/<slug>.json`, the shape of each check (how
  many questions and options, and whether the article is live). No question text or answers.
- `functions/api/check/[slug].ts`: `GET` returns the tallies; `POST` records one reader's answers
  and returns the tallies. It refuses answers that don't fit the article's shape, answers to
  articles that aren't live yet, and posts from other websites.
- **One count per reader per article.** The browser remembers that it has answered (and shows the
  results straight away on a return visit). The server also keeps a salted SHA-256 hash of IP
  address + browser + article, so answering again from the same browser isn't counted twice. No IP
  addresses or personal data are stored. People in one office on the same browser version may share
  an IP address, so a few genuine answers from them may go uncounted.
- **Changing a check after it's live.** If you edit a question's wording, the old tallies stay.
  If you change its options (add, remove or reorder them), reset that article's results, or the
  bars will be wrong. In the dashboard: D1 → thelearningcurve-reader-checks → Console:
  `DELETE FROM tallies WHERE slug = '<slug>'; DELETE FROM voters WHERE slug = '<slug>';`
- **Poll results aren't research.** They come from whoever chose to answer on that page. Never
  quote them in an article as a statistic. They can inform what we write next.

## The build check

From the slot of 6 November 2026, a production build fails if a library, guide or trends
article has no `readerCheck`, the same way it fails on an unresolved editor flag. Articles
published before then are exempt; all of them on `main` have one already.
