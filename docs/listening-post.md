# The Listening Post: reader notes on an article

Any article can end with a **Listening Post**: one question for readers, a box to answer it, and a
wall of the notes other readers have left. It's how the site practises what it preaches about
listening before building. Notes can shape what we write next, but like poll results they aren't
research: never quote them in an article as a finding.

## Turning it on for an article

Add to the frontmatter:

```yaml
listeningPost:
  prompt: "What's one thing your learning platform has never asked you?"
  intro: "Optional line under the question (defaults to a standard one)."
```

The Listening Post then appears after the reader poll or quiz. It only accepts notes once the article
is live, so notes left on a preview build are refused.

## Moderation: the Comments tab at /admin

- **New notes wait** in the Comments tab until you press **Approve**. Then they show on the article.
- **Hide** takes a live note down (it stays in the tab). **Delete** removes it for good.
- To let notes go live straight away instead, add the variable `COMMENTS_AUTO_APPROVE` = `1` in
  Cloudflare (Workers & Pages → thelearningcurve → Settings → Variables and secrets, Production)
  and redeploy. The tab is then for hiding or deleting.
- If `RESEND_API_KEY` is set (it is, for /submit), each new note is emailed to
  jim@thelearningcurve.net (change with `COMMENTS_NOTIFY_TO`).

## Setup

Nothing new: notes are stored in the reader-checks D1 database (`CHECKS_DB`, docs/reader-checks.md)
in a `comments` table created on first use. To keep them separate, bind another D1 database as
`COMMENTS_DB`.

## Guard rails

- Name and role are optional. No email is asked for.
- Notes are limited to 600 characters. Links (and things that look like web addresses) are refused.
- A hidden honeypot field catches most bots.
- Each reader can leave three notes per article per day, checked with a salted hash of IP + browser +
  article (the same approach as reader checks). No IP addresses are stored.

## Files

- `src/components/ListeningPost.astro`: the box and the wall
- `src/pages/comments/[slug].json.ts`: which articles have a Listening Post, and whether each is live
- `functions/api/comments/[slug].ts`: `GET` approved notes, `POST` a new one
- `functions/api/admin/[[path]].ts` and `public/admin/index.html`: the Comments tab
