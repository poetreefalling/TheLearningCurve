# Platform submissions (/submit)

Companies, start-ups and EdTech developers put a platform forward at thelearningcurve.net/submit.
Each entry is **stored** in Cloudflare D1, where the **Submissions** tab at /admin lists it, and
**emailed** to jim@thelearningcurve.net. We promise a reply within 3 working days (set in
`src/site.config.ts` → `SITE.submissions`); the admin tab flags new entries older than that.

- Page: `src/pages/submit/index.astro` (thanks page: `src/pages/submit/thanks.astro`)
- Endpoint: `functions/api/submit.ts`
- Review: the Submissions tab in `public/admin/index.html`, backed by `functions/api/admin/[[path]].ts`

## Setup in Cloudflare (Pages → thelearningcurve → Settings)

1. **Storage.** Bindings → Add → D1 database. Variable name **`SUBMISSIONS_DB`**. You can pick the
   same database as `CHECKS_DB` (the reader checks) or make a new one. Until this binding exists,
   the endpoint falls back to `CHECKS_DB` if that is bound. The `submissions` table is created on
   first use.
2. **Email.** Create a free account at resend.com, add and verify the domain
   `thelearningcurve.net` (Resend gives you three DNS records to add in Cloudflare DNS), then make an
   API key. In Variables and secrets add **`RESEND_API_KEY`** as a secret.
   - Optional: `SUBMIT_NOTIFY_TO` (defaults to jim@thelearningcurve.net) and `SUBMIT_FROM`
     (defaults to `The Learning Curve <submissions@thelearningcurve.net>`).
   - Each email's Reply-To is the submitter, so replying answers them directly.
3. Redeploy (or merge any change) so the new bindings take effect.

If neither storage nor email is set up, the form tells people submissions open shortly.
With only one of them, entries still get through.

## Statuses

New → Reviewing → Accepted or Declined. A private note on each entry is visible only in /admin.
Accepted platforms go into the directory (`docs/directory.md`); the submission itself never
changes how a product is scored.
