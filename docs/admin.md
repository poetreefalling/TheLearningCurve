# Admin: the review desk and the ad manager (thelearningcurve.net/admin)

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

## Changes tab

Every other open pull request: site features, docs, plans and settings (anything not on an
`article/` branch), oldest first. Each shows its site check, a link to the preview, the changed
files and the description. **Merge** makes it live; the site rebuilds in about two minutes.

**Edit** opens the change's files. Text files (wording in docs, data files such as
`section-intros.json`, page templates) open in a plain editor; images and deleted files are listed
but left to GitHub. **Save to this change** commits the file to that pull request's own branch
("Edit via changes desk: …"), never to the live site, so the site check and preview run again
before you merge. Data files (`.json`) are checked before saving, so a missing comma can't break
the build. Like the article editor, it refuses to overwrite a file Claude changed after you opened
it (reload and make the change again).

Merge stays disabled until the site check passes, and the server refuses if GitHub reports a
conflict, the PR is a draft, or it changed after you loaded the list (reload to see the latest).
Articles never appear here: they're published from the Articles tab, which checks every flag first.

## Ads tab

The ad manager: book sponsors into the ad slots, pause or remove them, and switch the AdSense
fallback on or off. Changes stay on the page until **Save and publish**, which commits
`src/data/ads.json` (and any new images, into `public/ads/`) to `main` in one commit; the live site
rebuilds in about two minutes. How the slots work, the image sizes and the AdSense setup are in
`docs/ads.md`.

Saving needs the same token as the review desk (Contents: read and write). If `main` has branch
protection that blocks direct commits, the save fails with GitHub's message: allow the token to
push, or ask Claude to open a pull request with the change instead.

## Facts tab

The facts behind /facts/ and /facts.json: who runs the site, how it's funded, how it works. Edit
any label, detail or source, rename a group, reorder or remove facts, or add one. Each fact needs a
source (a page on this site such as `/about/`, or a full https:// address; the source name is
optional) and the date you last checked it: **Today** sets one, and **Mark every fact checked
today** sets them all, once you've read them against their sources. The page's "Last checked" date
is the newest of those dates. Facts not checked for six months are counted at the top.

**Save and publish** commits `src/data/facts.json` to `main` in one commit ("Facts: … (via the
facts editor)"); the live site rebuilds in about two minutes. Like the Ads tab, it refuses to
overwrite if the file changed after you opened it (reload and make the change again), and it needs
the same token.

## Submissions tab

Platforms put forward at /submit. Filter by status, open the vendor's site, email them, add a
private note, and set New, Reviewing, Accepted or Declined. New entries older than 3 days are
flagged as overdue. Setup and storage: `docs/submissions.md`.

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
