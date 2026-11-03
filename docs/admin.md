# Review desk (thelearningcurve.net/admin)

A password-protected page for reviewing drafts without using GitHub. It lists every open
article pull request (branches starting `article/`), earliest slot first, and for each one:

- every `[JIM: …]` and `[TO VERIFY: …]` item, shown in its paragraph, with a box to type the
  replacement or a button to remove it
- the research-card quotes and the sources, linked, to check word for word
- a link to the branch preview, and a plain editor for the whole article
- **Publish**, which merges the pull request. It stays disabled until no items are left and the
  site check passes. The article then goes live at its slot.

Saving commits to the article's branch ("Edit via review desk: …"), so Claude and GitHub see the
same text. If Claude changed the article after you opened it, the desk refuses to overwrite and
asks you to reload.

## One-time setup

1. **GitHub token.** github.com → your photo → Settings → Developer settings → Personal access
   tokens → Fine-grained tokens → Generate new token. Name it "Review desk", choose an
   expiry (a year is fine), Repository access → Only select repositories →
   `poetreefalling/TheLearningCurve`. Under Repository permissions set **Contents: Read and
   write** and **Pull requests: Read and write**. Generate it and copy it.
2. **Cloudflare.** dash.cloudflare.com → Workers & Pages → thelearningcurve → Settings →
   Variables and secrets → Add, for **Production**:
   - `ADMIN_PASSWORD` (type Secret): the password you want for /admin
   - `GITHUB_TOKEN` (type Secret): the token from step 1
3. Redeploy so the new secrets apply: Deployments → the latest production deployment → ⋯ →
   Retry deployment (or simply merge the next article).
4. Visit https://thelearningcurve.net/admin and sign in. You stay signed in for 14 days on
   that browser.

Changing `ADMIN_PASSWORD` signs out every browser. When the token expires the desk shows
"GitHub refused the token": make a new one and replace `GITHUB_TOKEN`.

## Files

- `public/admin/index.html`: the page
- `functions/api/admin/[[path]].ts`: the API (a Cloudflare Pages Function), which holds the
  token and checks the password
