// Cloudflare Pages Function: the review desk's API, at /api/admin/*.
// The page itself is public/admin/index.html. Every route here except login needs a session.
//
// Environment variables (Cloudflare Pages → Settings → Variables and secrets, Production):
//   ADMIN_PASSWORD   secret: the password for thelearningcurve.net/admin
//   GITHUB_TOKEN     secret: a fine-grained GitHub token for poetreefalling/TheLearningCurve
//                    with Contents: read and write, and Pull requests: read and write
//   GITHUB_REPO      optional, defaults to poetreefalling/TheLearningCurve
//
// The desk only touches open pull requests from `article/` branches: it reads their articles,
// commits Jim's edits to the same branch, and merges the PR when he presses Publish.
//
// The Changes tab lists every other open pull request (site, docs, ads) and merges one when Jim
// presses Merge, but only when its checks pass, GitHub says it merges cleanly, and it is still
// the exact version he was shown.
//
// It also lets Jim edit the text files a change touches (Edit, then pick a file): saving commits to
// that pull request's own branch, like the review desk does for articles, never to the live site.
//
// The ad manager (Ads tab) reads src/data/ads.json from the default branch and saves it, plus any
// new ad images in public/ads/, as one commit there. Cloudflare then rebuilds the live site.
// The file's rules are in src/lib/ads.ts and docs/ads.md; they are checked here too, so a save
// can't break the build.
//
// The facts editor (Facts tab) does the same for src/data/facts.json, the data behind /facts/ and
// /facts.json: it reads the file from the default branch and saves it as one commit there.
//
// Review links (Sharing tab): every branch preview (*.thelearningcurve-1qx.pages.dev) sits behind a
// Cloudflare Access application that lets only Jim in. Sharing a draft adds a more specific Access
// application for that one preview hostname, which Access uses instead of the wildcard:
//   - invite: Jim plus the invited email addresses can sign in with an emailed one-time code; the
//     link is the branch preview, so reviewers always see the latest version of the draft
//   - open link: anyone with the link can view, no sign-in; the link is the preview of that exact
//     version (an unguessable deployment address), so later edits aren't shown
// Each share has an end date. Expired and revoked shares are removed from Access whenever the
// Sharing tab is opened or a share is created. Shares are kept in D1 (the submissions database).
// Extra settings (docs/admin.md, "Review links"):
//   CF_API_TOKEN          secret: a Cloudflare API token with Account > Access: Apps and Policies > Edit
//   CF_ACCOUNT_ID         the Cloudflare account ID
//   ACCESS_OWNER_EMAILS   secret: Jim's addresses, comma-separated, always allowed on every preview
//   ACCESS_IDP_ID         optional: the Access login method to use (the email one-time code)
//   RESEND_API_KEY        optional: emails the invitation (already set for /api/submit)

interface SubStmt { bind(...v: unknown[]): SubStmt; all<T>(): Promise<{ results: T[] }>; run(): Promise<unknown> }
interface SubDb {
  prepare(sql: string): SubStmt;
}
interface Env {
  ADMIN_PASSWORD?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  // Platform submissions from /submit (functions/api/submit.ts, docs/submissions.md)
  SUBMISSIONS_DB?: SubDb;
  CHECKS_DB?: SubDb;
  // Listening Post notes (functions/api/comments/[slug].ts, docs/listening-post.md)
  COMMENTS_DB?: SubDb;
  COMMENTS_AUTO_APPROVE?: string;
  // Review links (Sharing tab)
  CF_API_TOKEN?: string;
  CF_ACCOUNT_ID?: string;
  ACCESS_OWNER_EMAILS?: string;
  ACCESS_IDP_ID?: string;
  RESEND_API_KEY?: string;
}

type Ctx = { request: Request; env: Env; params: { path?: string | string[] } };

const COOKIE = 'tlc_admin';
const SESSION_DAYS = 14;
const FLAG = /\[(?:JIM|TO VERIFY)\b[^\]]*\]/g;
const ARTICLE = /^src\/content\/articles\/(library|guides|reviews|trends)\/([^/]+)\.mdx?$/;

export const onRequest = async (ctx: Ctx): Promise<Response> => {
  const { request, env } = ctx;
  const route = [ctx.params.path ?? []].flat().join('/');
  if (!env.ADMIN_PASSWORD || !env.GITHUB_TOKEN) {
    return json(500, { error: 'The review desk is not set up yet: ADMIN_PASSWORD and GITHUB_TOKEN are missing in Cloudflare.' });
  }
  try {
    if (route === 'login' && request.method === 'POST') return await login(request, env);
    if (route === 'logout' && request.method === 'POST') return logout();
    if (!(await hasSession(request, env))) return json(401, { error: 'Please sign in.' });

    const gh = github(env);
    if (route === 'session') return json(200, { ok: true });
    if (route === 'queue' && request.method === 'GET') return json(200, await queue(gh));
    if (route === 'file' && request.method === 'GET') {
      const u = new URL(request.url);
      return json(200, await readArticle(gh, Number(u.searchParams.get('pr')), u.searchParams.get('path') ?? ''));
    }
    if (route === 'save' && request.method === 'POST') return json(200, await save(gh, await request.json()));
    if (route === 'publish' && request.method === 'POST') return await publish(gh, await request.json());
    if (route === 'changes' && request.method === 'GET') return json(200, await listChanges(gh));
    if (route === 'changes/files' && request.method === 'GET') {
      return json(200, await changeFiles(gh, Number(new URL(request.url).searchParams.get('pr'))));
    }
    if (route === 'changes/file' && request.method === 'GET') {
      const u = new URL(request.url);
      return json(200, await readChangeFile(gh, Number(u.searchParams.get('pr')), u.searchParams.get('path') ?? ''));
    }
    if (route === 'changes/save' && request.method === 'POST') return json(200, await saveChangeFile(gh, await request.json()));
    if (route === 'changes/merge' && request.method === 'POST') return await mergeChange(gh, await request.json());
    if (route === 'ads' && request.method === 'GET') return json(200, await readAds(gh));
    if (route === 'ads/save' && request.method === 'POST') return json(200, await saveAds(gh, await request.json()));
    if (route === 'facts' && request.method === 'GET') return json(200, await readFacts(gh));
    if (route === 'facts/save' && request.method === 'POST') return json(200, await saveFacts(gh, await request.json()));
    if (route === 'submissions' && request.method === 'GET') return json(200, await listSubmissions(env));
    if (route === 'submissions/status' && request.method === 'POST') return json(200, await setSubmission(env, await request.json()));
    if (route === 'comments' && request.method === 'GET') return json(200, await listComments(env));
    if (route === 'comments/status' && request.method === 'POST') return json(200, await setComment(env, await request.json()));
    if (route === 'shares' && request.method === 'GET') return json(200, await listShares(env, gh));
    if (route === 'shares/create' && request.method === 'POST') return json(200, await createShare(env, gh, await request.json()));
    if (route === 'shares/revoke' && request.method === 'POST') return json(200, await revokeShare(env, await request.json()));
    return json(404, { error: 'Not found.' });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(e instanceof Problem ? e.status : 500, { error: msg });
  }
};

class Problem extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// ---------- platform submissions (/submit) ----------

const SUB_STATUSES = ['new', 'reviewing', 'accepted', 'declined'];
const SUB_TABLE = `CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY, at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  name TEXT, email TEXT, organisation TEXT, role TEXT, org_type TEXT,
  product TEXT, url TEXT, category TEXT, stage TEXT, audience TEXT,
  description TEXT, learning TEXT, access TEXT, notes TEXT, editor_note TEXT
)`;

function subDb(env: Env) {
  const db = env.SUBMISSIONS_DB ?? env.CHECKS_DB;
  if (!db) throw new Problem(503, 'Submissions storage is not set up yet: add the SUBMISSIONS_DB binding in Cloudflare (docs/submissions.md).');
  return db;
}

async function listSubmissions(env: Env) {
  const db = subDb(env);
  await db.prepare(SUB_TABLE).run();
  const { results } = await db.prepare('SELECT * FROM submissions ORDER BY at DESC LIMIT 300').all<Record<string, unknown>>();
  return { items: results, statuses: SUB_STATUSES };
}

async function setSubmission(env: Env, body: { id?: string; status?: string; note?: string }) {
  const db = subDb(env);
  if (!body.id || !SUB_STATUSES.includes(String(body.status))) throw new Problem(400, 'Unknown submission or status.');
  await db.prepare('UPDATE submissions SET status = ?, editor_note = ? WHERE id = ?')
    .bind(String(body.status), String(body.note ?? '').slice(0, 2000), String(body.id)).run();
  return { ok: true };
}

// ---------- Listening Post notes (/api/comments/<slug>) ----------

const COMMENT_STATUSES = ['pending', 'approved', 'hidden'];
const COMMENTS_TABLE = `CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  name TEXT, role TEXT, text TEXT NOT NULL, voter TEXT NOT NULL
)`;

function commentDb(env: Env) {
  const db = env.COMMENTS_DB ?? env.CHECKS_DB;
  if (!db) throw new Problem(503, 'Listening Post storage is not set up yet: it uses the CHECKS_DB binding (docs/listening-post.md).');
  return db;
}

async function listComments(env: Env) {
  const db = commentDb(env);
  await db.prepare(COMMENTS_TABLE).run();
  const { results } = await db.prepare('SELECT id, slug, at, status, name, role, text FROM comments ORDER BY at DESC LIMIT 500').all<Record<string, unknown>>();
  return { items: results, statuses: COMMENT_STATUSES, autoApprove: env.COMMENTS_AUTO_APPROVE === '1' };
}

async function setComment(env: Env, body: { id?: string; status?: string; remove?: boolean }) {
  const db = commentDb(env);
  if (!body.id) throw new Problem(400, 'Unknown note.');
  if (body.remove) {
    await db.prepare('DELETE FROM comments WHERE id = ?').bind(String(body.id)).run();
    return { ok: true };
  }
  if (!COMMENT_STATUSES.includes(String(body.status))) throw new Problem(400, 'Unknown status.');
  await db.prepare('UPDATE comments SET status = ? WHERE id = ?').bind(String(body.status), String(body.id)).run();
  return { ok: true };
}

// ---------- review links (Sharing tab) ----------

const PREVIEW_ZONE = 'thelearningcurve-1qx.pages.dev';
const SHARE_TABLE = `CREATE TABLE IF NOT EXISTS review_shares (
  id TEXT PRIMARY KEY, at INTEGER NOT NULL, expires INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0,
  cleaned INTEGER NOT NULL DEFAULT 0, mode TEXT NOT NULL, host TEXT NOT NULL, url TEXT NOT NULL,
  pr INTEGER, title TEXT, name TEXT, email TEXT, note TEXT
)`;
const EMAIL_RE = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;

type Share = { id: string; at: number; expires: number; revoked: number; cleaned: number; mode: string; host: string; url: string; pr: number; title: string; name: string; email: string; note: string };

function sharesReady(env: Env) {
  return !!(env.CF_API_TOKEN && env.CF_ACCOUNT_ID && env.ACCESS_OWNER_EMAILS);
}

async function shareDb(env: Env) {
  const db = subDb(env);
  await db.prepare(SHARE_TABLE).run();
  return db;
}

async function cf(env: Env, path: string, init: RequestInit = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const msg = data?.errors?.[0]?.message || `error ${res.status}`;
    if (res.status === 401 || res.status === 403) throw new Problem(500, `Cloudflare refused the API token (${msg}). Check CF_API_TOKEN has Access: Apps and Policies: Edit.`);
    throw new Problem(502, `Cloudflare: ${msg}`);
  }
  return data.result;
}

// Make Cloudflare Access match the active shares for one preview hostname: no app when nothing is
// shared (the wildcard app then lets only Jim in), otherwise one app for exactly that hostname.
async function syncHost(env: Env, db: SubDb, host: string) {
  const now = Date.now();
  const { results } = await db.prepare('SELECT * FROM review_shares WHERE host = ? AND revoked = 0 AND expires > ?').bind(host, now).all<Share>();
  const apps: any[] = await cf(env, '/access/apps?per_page=1000');
  for (const app of apps.filter((a) => a.domain === host)) await cf(env, `/access/apps/${app.id}`, { method: 'DELETE' });
  if (!results.length) return;
  const open = results.some((s) => s.mode === 'link');
  const owners = String(env.ACCESS_OWNER_EMAILS).split(/[\s,;]+/).filter((e) => EMAIL_RE.test(e));
  const guests = results.filter((s) => s.mode === 'invite' && s.email).map((s) => s.email);
  const emails = [...new Set([...owners, ...guests].map((e) => e.toLowerCase()))];
  const until = Math.max(...results.map((s) => s.expires));
  await cf(env, '/access/apps', {
    method: 'POST',
    body: JSON.stringify({
      name: `Review link: ${host.split('.')[0]} (until ${new Date(until).toISOString().slice(0, 10)})`,
      type: 'self_hosted',
      domain: host,
      session_duration: '24h',
      app_launcher_visible: false,
      ...(env.ACCESS_IDP_ID ? { allowed_idps: [env.ACCESS_IDP_ID], auto_redirect_to_identity: true } : {}),
      policies: [open
        ? { name: 'Anyone with the link', decision: 'bypass', precedence: 1, include: [{ everyone: {} }] }
        : { name: 'Jim and invited reviewers', decision: 'allow', precedence: 1, include: emails.map((email) => ({ email: { email } })) }],
    }),
  });
}

// Remove expired and revoked shares from Access (once each).
async function cleanShares(env: Env, db: SubDb) {
  const { results } = await db.prepare('SELECT DISTINCT host FROM review_shares WHERE cleaned = 0 AND (revoked = 1 OR expires <= ?)').bind(Date.now()).all<{ host: string }>();
  for (const { host } of results) {
    await syncHost(env, db, host);
    await db.prepare('UPDATE review_shares SET cleaned = 1 WHERE host = ? AND (revoked = 1 OR expires <= ?)').bind(host, Date.now()).run();
  }
}

// The drafts that can be shared: open article pull requests (each article's page) and other open
// changes (the preview's home page).
async function shareableDrafts(gh: GH) {
  const prs: any[] = await gh('/pulls?state=open&per_page=50&sort=created&direction=asc');
  return Promise.all(prs.map(async (pr) => {
    const isArticle = String(pr.head.ref).startsWith('article/');
    const paths = isArticle
      ? (await articlePaths(gh, pr.number)).map((p) => { const [, section, slug] = p.match(ARTICLE)!; return { label: slug.replace(/-/g, ' '), path: `/${section}/${slug}/` }; })
      : [{ label: 'Home page', path: '/' }];
    return { pr: pr.number, title: pr.title, kind: isArticle ? 'article' : 'change', paths };
  }));
}

async function deploymentBase(gh: GH, number: number) {
  const comments: any[] = await gh(`/issues/${number}/comments?per_page=50`);
  for (const c of comments.reverse()) {
    const m = String(c.body ?? '').match(/<strong>Preview URL:<\/strong>[\s\S]*?href='([^']+)'/);
    if (m) return m[1].replace(/\/$/, '');
  }
  throw new Problem(409, 'This draft has no finished preview yet. Wait for its preview to build (a few minutes after each save) and try again.');
}

async function listShares(env: Env, gh: GH) {
  const drafts = await shareableDrafts(gh);
  if (!sharesReady(env)) return { ready: false, items: [], drafts };
  const db = await shareDb(env);
  await cleanShares(env, db);
  const { results } = await db.prepare('SELECT * FROM review_shares ORDER BY at DESC LIMIT 100').all<Share>();
  const now = Date.now();
  const items = results.map((s) => ({ ...s, status: s.revoked ? 'revoked' : s.expires <= now ? 'expired' : 'active' }));
  return { ready: true, items, drafts };
}

async function createShare(env: Env, gh: GH, body: any) {
  if (!sharesReady(env)) throw new Problem(503, 'Review links are not set up yet: add CF_API_TOKEN, CF_ACCOUNT_ID and ACCESS_OWNER_EMAILS in Cloudflare (docs/admin.md).');
  const number = Number(body?.pr);
  const mode = body?.mode === 'link' ? 'link' : 'invite';
  const days = Math.min(30, Math.max(1, Math.round(Number(body?.days) || 7)));
  const name = String(body?.name ?? '').trim().slice(0, 120);
  const note = String(body?.note ?? '').trim().slice(0, 1500);
  const email = String(body?.email ?? '').trim().toLowerCase();
  if (mode === 'invite' && !EMAIL_RE.test(email)) throw new Problem(400, 'Add the reviewer\'s email address: they sign in with a code sent to it.');
  if (email && !EMAIL_RE.test(email)) throw new Problem(400, 'That email address doesn\'t look right.');
  const pr = await gh(`/pulls/${number}`);
  if (pr.state !== 'open') throw new Problem(409, 'That draft is no longer open, so there is nothing to share. Reload the list.');
  const drafts = await shareableDrafts(gh);
  const draft = drafts.find((d) => d.pr === number);
  const path = draft?.paths.some((p) => p.path === body?.path) ? String(body.path) : draft?.paths[0]?.path ?? '/';
  const base = mode === 'link' ? await deploymentBase(gh, number) : await previewBase(gh, number, pr.head.ref);
  const host = new URL(base).hostname;
  if (!host.endsWith('.' + PREVIEW_ZONE)) throw new Problem(500, `Unexpected preview address: ${host}`);
  const url = base + path;
  const db = await shareDb(env);
  const id = crypto.randomUUID();
  const now = Date.now();
  const expires = now + days * 86400_000;
  await db.prepare('INSERT INTO review_shares (id, at, expires, mode, host, url, pr, title, name, email, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, now, expires, mode, host, url, number, String(pr.title).slice(0, 300), name, email, note).run();
  try {
    await syncHost(env, db, host);
  } catch (e) {
    await db.prepare('DELETE FROM review_shares WHERE id = ?').bind(id).run();
    throw e;
  }
  await cleanShares(env, db).catch(() => {});
  let emailed = false;
  if (email && body?.send !== false && env.RESEND_API_KEY) emailed = await sendInvite(env, { email, name, note, url, mode, expires, title: String(pr.title) });
  const until = new Date(expires).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short' });
  return {
    ok: true, url,
    message: `${mode === 'link' ? 'Open link' : 'Invitation'} ready until ${until}.${emailed ? ` We've emailed it to ${email}.` : email ? ' Copy the link below and send it yourself.' : ' Copy the link below to share it.'} It can take a minute for Cloudflare to apply.`,
  };
}

async function revokeShare(env: Env, body: any) {
  if (!sharesReady(env)) throw new Problem(503, 'Review links are not set up yet.');
  const db = await shareDb(env);
  const { results } = await db.prepare('SELECT * FROM review_shares WHERE id = ?').bind(String(body?.id ?? '')).all<Share>();
  const share = results[0];
  if (!share) throw new Problem(404, 'Unknown review link.');
  await db.prepare('UPDATE review_shares SET revoked = 1 WHERE id = ?').bind(share.id).run();
  await syncHost(env, db, share.host);
  await db.prepare('UPDATE review_shares SET cleaned = 1 WHERE id = ?').bind(share.id).run();
  return { ok: true, message: `Stopped. ${share.name || share.email || 'That link'} can no longer open the preview (within a minute or so).` };
}

async function sendInvite(env: Env, s: { email: string; name: string; note: string; url: string; mode: string; expires: number; title: string }) {
  const until = new Date(s.expires).toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney', weekday: 'long', day: 'numeric', month: 'long' });
  const title = s.title.replace(/^[A-Z][a-z]{2} \d{1,2} [A-Z][a-z]{2} \d{2}:\d{2} · /, '');
  const esc = (t: string) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
  const how = s.mode === 'invite'
    ? `Open the link and enter this email address (${s.email}). Cloudflare will email you a one-time code to sign in.`
    : 'Open the link: no sign-in needed.';
  const text = [`Hi ${s.name || 'there'},`, '', `Jim Lounsbury has shared a draft from The Learning Curve for you to review: "${title}".`, '', s.note, '', s.url, '', how, `The link works until ${until}. Please don't share it further.`, '', 'The Learning Curve', 'https://thelearningcurve.net/'].filter((l, i, a) => !(l === '' && a[i - 1] === '')).join('\n');
  const html = `<div style="font:16px/1.55 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16181d;max-width:560px">
<p>Hi ${esc(s.name || 'there')},</p>
<p>Jim Lounsbury has shared a draft from <strong>The Learning Curve</strong> for you to review:</p>
<p style="font:700 20px/1.3 Georgia,serif;margin:16px 0">${esc(title)}</p>
${s.note ? `<p style="background:#f7f4ee;border-left:3px solid #f6c847;padding:10px 14px;white-space:pre-wrap">${esc(s.note)}</p>` : ''}
<p><a href="${esc(s.url)}" style="display:inline-block;background:#16181d;color:#f6c847;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:999px">Open the draft</a></p>
<p style="font-size:14px;color:#3a3c42">${esc(how)} The link works until ${esc(until)}. Please don't share it further.</p>
<p style="font-size:13px;color:#6a6660;margin-top:24px">The Learning Curve · <a href="https://thelearningcurve.net/" style="color:#6a6660">thelearningcurve.net</a></p></div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'The Learning Curve <hello@thelearningcurve.net>', to: [s.email], reply_to: 'jim@thelearningcurve.net', subject: `Draft for your review: ${title}`.slice(0, 200), html, text }),
  }).catch(() => null);
  return !!res && res.ok;
}

// ---------- sessions ----------

async function login(request: Request, env: Env) {
  let password = '';
  try {
    password = String(((await request.json()) as { password?: string }).password ?? '');
  } catch {}
  if (!(await sameText(password, env.ADMIN_PASSWORD!))) {
    await new Promise((r) => setTimeout(r, 1200)); // slow down guessing
    return json(401, { error: 'That password is not right.' });
  }
  const expires = Date.now() + SESSION_DAYS * 86400_000;
  const value = `${expires}.${await sign(String(expires), env.ADMIN_PASSWORD!)}`;
  return json(200, { ok: true }, {
    'Set-Cookie': `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_DAYS * 86400}`,
  });
}

function logout() {
  return json(200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
}

async function hasSession(request: Request, env: Env) {
  const cookie = (request.headers.get('cookie') ?? '').split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`));
  if (!cookie) return false;
  const [expires, sig] = cookie.slice(COOKIE.length + 1).split('.');
  if (!expires || !sig || Number(expires) < Date.now()) return false;
  return sameText(sig, await sign(expires, env.ADMIN_PASSWORD!));
}

async function sign(text: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(`tlc-admin:${secret}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sameText(a: string, b: string) {
  // Compare digests so the comparison takes the same time whatever the input
  const [x, y] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))));
  const ax = new Uint8Array(x), by = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < ax.length; i++) diff |= ax[i] ^ by[i];
  return diff === 0;
}

// ---------- GitHub ----------

type GH = <T = any>(path: string, init?: RequestInit) => Promise<T>;

function github(env: Env): GH {
  const repo = env.GITHUB_REPO || 'poetreefalling/TheLearningCurve';
  return async (path, init = {}) => {
    const res = await fetch(`https://api.github.com/repos/${repo}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'thelearningcurve-review-desk',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    const data: any = res.status === 204 ? {} : await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) throw new Problem(500, 'GitHub refused the token. Check GITHUB_TOKEN in Cloudflare.');
      throw new Problem(res.status, data?.message ? `GitHub: ${data.message}` : `GitHub error ${res.status}`);
    }
    return data;
  };
}

const decode = (b64: string) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, '')), (c) => c.charCodeAt(0)));
const encode = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};

async function openArticlePr(gh: GH, number: number) {
  if (!Number.isInteger(number) || number <= 0) throw new Problem(400, 'Unknown article.');
  const pr = await gh(`/pulls/${number}`);
  if (pr.state !== 'open' || !String(pr.head.ref).startsWith('article/')) {
    throw new Problem(400, 'That article is no longer waiting for review.');
  }
  return pr;
}

async function articlePaths(gh: GH, number: number) {
  const files: any[] = await gh(`/pulls/${number}/files?per_page=100`);
  return files.filter((f) => f.status !== 'removed' && ARTICLE.test(f.filename)).map((f) => f.filename as string);
}

async function readArticle(gh: GH, number: number, path: string, pr?: any) {
  pr ??= await openArticlePr(gh, number);
  if (!ARTICLE.test(path)) throw new Problem(400, 'Unknown article file.');
  const file = await gh(`/contents/${path}?ref=${encodeURIComponent(pr.head.ref)}`);
  return { path, sha: file.sha as string, content: decode(file.content) };
}

// ---------- reading an article ----------

function field(text: string, key: string) {
  const m = text.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : '';
}

function frontmatter(content: string) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  return m ? m[1] : '';
}

function flagsIn(content: string) {
  // Match across the whole text, not line by line: a flag can wrap onto the next line, and the
  // build check (src/lib/articles.ts) counts those too.
  const lines = content.split('\n');
  const out: { text: string; line: number; context: string }[] = [];
  for (const m of content.matchAll(FLAG)) {
    const start = content.slice(0, m.index).split('\n').length - 1;
    const end = start + m[0].split('\n').length - 1;
    // The paragraph around the flag, so Jim sees what it belongs to
    let a = start, b = end;
    while (a > 0 && lines[a - 1].trim() !== '' && !lines[a - 1].startsWith('---')) a--;
    while (b < lines.length - 1 && lines[b + 1].trim() !== '') b++;
    out.push({ text: m[0], line: start + 1, context: lines.slice(a, b + 1).join('\n') });
  }
  return out;
}

function sourcesIn(fm: string) {
  const block = fm.split(/^sources:\s*$/m)[1]?.split(/^\S/m)[0] ?? '';
  return block
    .split(/^\s*-\s+(?=authors:)/m)
    .slice(1)
    .map((item) => ({
      authors: field(item.replace(/^\s+/gm, ''), 'authors'),
      year: field(item.replace(/^\s+/gm, ''), 'year'),
      title: field(item.replace(/^\s+/gm, ''), 'title'),
      url: field(item.replace(/^\s+/gm, ''), 'url'),
      doi: field(item.replace(/^\s+/gm, ''), 'doi'),
    }));
}

function cardsIn(fm: string) {
  return [...fm.matchAll(/^\s*-\s+excerpt:\s*"((?:[^"\\]|\\.)*)"\s*\n\s+highlight:[^\n]*\n\s+sourceIndex:\s*(\d+)/gm)].map((m) => ({
    excerpt: m[1].replace(/\\"/g, '"'),
    sourceIndex: Number(m[2]),
  }));
}

function sydneySlot(iso: string) {
  const d = new Date(iso);
  if (isNaN(+d)) return iso;
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Sydney', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
}

async function checksFor(gh: GH, sha: string) {
  const data = await gh(`/commits/${sha}/check-runs?per_page=50`);
  const runs: any[] = data.check_runs ?? [];
  const build = runs.find((r) => r.name === 'build');
  if (!build) return 'pending';
  if (build.status !== 'completed') return 'pending';
  return build.conclusion === 'success' ? 'passing' : 'failing';
}

async function previewBase(gh: GH, number: number, ref: string) {
  try {
    const comments: any[] = await gh(`/issues/${number}/comments?per_page=50`);
    for (const c of comments.reverse()) {
      const m = String(c.body ?? '').match(/Branch Preview URL:[\s\S]*?href='([^']+)'/);
      if (m) return m[1].replace(/\/$/, '');
    }
  } catch {}
  const alias = ref.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 28).replace(/-+$/, '');
  return `https://${alias}.thelearningcurve-1qx.pages.dev`;
}

async function describe(gh: GH, pr: any) {
  const paths = await articlePaths(gh, pr.number);
  const articles = await Promise.all(
    paths.map(async (path) => {
      const { content, sha } = await readArticle(gh, pr.number, path, pr);
      const fm = frontmatter(content);
      const [, section, slug] = path.match(ARTICLE)!;
      const sources = sourcesIn(fm);
      return {
        path, sha, section, slug,
        title: field(fm, 'title'),
        published: field(fm, 'published'),
        slot: sydneySlot(field(fm, 'published')),
        flags: flagsIn(content),
        cards: cardsIn(fm).map((c) => ({ ...c, source: sources[c.sourceIndex] ?? null })),
        sources,
      };
    }),
  );
  const [checks, preview] = await Promise.all([checksFor(gh, pr.head.sha), previewBase(gh, pr.number, pr.head.ref)]);
  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    branch: pr.head.ref,
    checks,
    preview,
    articles: articles.map((a) => ({ ...a, previewUrl: `${preview}/${a.section}/${a.slug}/` })),
    flagCount: articles.reduce((n, a) => n + a.flags.length, 0),
  };
}

async function queue(gh: GH) {
  const prs: any[] = await gh('/pulls?state=open&per_page=50&sort=created&direction=asc');
  const items = await Promise.all(prs.filter((p) => String(p.head.ref).startsWith('article/')).map((p) => describe(gh, p)));
  const firstPublished = (i: any) => i.articles[0]?.published ?? '';
  return { items: items.sort((a, b) => firstPublished(a).localeCompare(firstPublished(b))) };
}

// GitHub works out whether a pull request merges cleanly in the background, so the first read
// after main moves often says "unknown" (null). Its API responses can also be cached for up to a
// minute, which kept serving that first null. Read fresh (a cache-busting query) a few times.
// If GitHub still hasn't decided, the caller just tries the merge: GitHub refuses it itself (405)
// when the change conflicts, and (409) when the branch moved, so nothing unsafe can land.
async function freshMergeable(gh: GH, number: number): Promise<boolean | null> {
  for (let i = 0; i < 5; i++) {
    const pr = await gh(`/pulls/${number}?fresh=${Date.now()}-${i}`);
    if (pr.mergeable !== null && pr.mergeable !== undefined) return pr.mergeable as boolean;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

async function mergePr(gh: GH, number: number, sha: string, title: string, what: 'article' | 'change') {
  try {
    await gh(`/pulls/${number}/merge`, {
      method: 'PUT',
      body: JSON.stringify({ merge_method: 'merge', sha, commit_title: `${title} (#${number})` }),
    });
  } catch (e) {
    if (e instanceof Problem && e.status === 405) {
      throw new Problem(409, what === 'article'
        ? 'GitHub says this article can\'t be merged yet (usually a clash with a line in the backlog). Ask Claude to fix the conflict, then publish.'
        : 'GitHub says this change can\'t be merged yet: it clashes with something already on the live site. Ask Claude to fix the conflict, then merge.');
    }
    if (e instanceof Problem && e.status === 409) {
      throw new Problem(409, 'This changed on GitHub a moment ago. Reload and look at the latest version before merging.');
    }
    throw e;
  }
}

// ---------- saving and publishing ----------

async function save(gh: GH, body: any) {
  const pr = await openArticlePr(gh, Number(body?.pr));
  const path = String(body?.path ?? '');
  const content = String(body?.content ?? '');
  if (!ARTICLE.test(path)) throw new Problem(400, 'Unknown article file.');
  if (!content.startsWith('---\n')) throw new Problem(400, 'The article must start with its --- settings block.');
  if (content.length > 400_000) throw new Problem(400, 'That article is too long to save.');
  const current = await readArticle(gh, pr.number, path, pr);
  if (body?.sha && body.sha !== current.sha) {
    throw new Problem(409, 'This article changed since you opened it (perhaps Claude updated it). Reload to get the latest version, then make your change again.');
  }
  if (current.content === content) return { ok: true, unchanged: true, sha: current.sha };
  const title = field(frontmatter(content), 'title') || path;
  const res = await gh(`/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Edit via review desk: ${title}`,
      content: encode(content.endsWith('\n') ? content : content + '\n'),
      sha: current.sha,
      branch: pr.head.ref,
    }),
  });
  return { ok: true, sha: res.content?.sha as string };
}

async function publish(gh: GH, body: any) {
  const pr = await openArticlePr(gh, Number(body?.pr));
  const item = await describe(gh, pr);
  if (item.flagCount > 0) {
    return json(409, { error: `There ${item.flagCount === 1 ? 'is 1 item' : `are ${item.flagCount} items`} still to resolve before this can be published.` });
  }
  if (item.checks === 'pending') {
    return json(409, { error: 'The site check is still running on your latest save. Try again in a minute or two.' });
  }
  if (item.checks === 'failing') {
    return json(409, { error: 'The site check failed on the latest version, so publishing would break the live site. Ask Claude to look at it.' });
  }
  if ((await freshMergeable(gh, pr.number)) === false) {
    return json(409, { error: 'This article clashes with something already published (usually a line in the backlog). Ask Claude to fix the conflict, then publish.' });
  }
  await mergePr(gh, pr.number, pr.head.sha, pr.title, 'article');
  const slots = item.articles.map((a: any) => a.slot).join(', ');
  const overdue = item.articles.every((a: any) => new Date(a.published).getTime() <= Date.now());
  return json(200, {
    ok: true,
    message: overdue
      ? `Published. Its slot (${slots}) has already passed, so it goes live in a few minutes.`
      : `Published. It goes live at its slot (${slots}, Sydney time).`,
  });
}


// ---------- other changes (non-article pull requests) ----------

async function describeChange(gh: GH, pr: any) {
  const [checks, preview] = await Promise.all([checksFor(gh, pr.head.sha), previewBase(gh, pr.number, pr.head.ref)]);
  return {
    number: pr.number,
    title: pr.title,
    url: pr.html_url,
    branch: pr.head.ref,
    sha: pr.head.sha,
    draft: !!pr.draft,
    opened: pr.created_at,
    body: String(pr.body ?? '').replace(/\r/g, '').slice(0, 4000),
    checks,
    preview,
  };
}

async function listChanges(gh: GH) {
  const prs: any[] = await gh('/pulls?state=open&per_page=50&sort=created&direction=asc');
  const others = prs.filter((p) => !String(p.head.ref).startsWith('article/'));
  return { items: await Promise.all(others.map((p) => describeChange(gh, p))) };
}

async function mergeChange(gh: GH, body: any) {
  const number = Number(body?.pr);
  if (!Number.isInteger(number) || number <= 0) throw new Problem(400, 'Unknown pull request.');
  const pr = await gh(`/pulls/${number}`);
  if (pr.state !== 'open') throw new Problem(409, 'This change is no longer open (it may already be merged or closed). Reload the list.');
  if (String(pr.head.ref).startsWith('article/')) {
    throw new Problem(400, 'Articles are published from the Articles tab, which checks every editor flag first.');
  }
  if (pr.draft) throw new Problem(409, 'This pull request is still marked as a draft on GitHub.');
  if (body?.sha && body.sha !== pr.head.sha) {
    throw new Problem(409, 'This change was updated since you opened the list. Reload and look at the latest version before merging.');
  }
  const checks = await checksFor(gh, pr.head.sha);
  if (checks === 'pending') return json(409, { error: 'The site check is still running. Try again in a minute or two.' });
  if (checks === 'failing') return json(409, { error: 'The site check failed, so merging could break the live site. Ask Claude to look at it.' });
  if ((await freshMergeable(gh, number)) === false) return json(409, { error: 'This change clashes with something already on the live site. Ask Claude to fix the conflict, then merge.' });
  await mergePr(gh, number, pr.head.sha, pr.title, 'change');
  return json(200, { ok: true, message: `Merged #${number}. The live site rebuilds in about two minutes.` });
}

// ---------- editing a change's files ----------

// Text files the editor can open; images and other binary files are left to GitHub
const TEXT_FILE = /\.(md|mdx|json|astro|ts|tsx|js|mjs|cjs|css|html|txt|ya?ml|toml|svg|xml|csv)$/i;
const MAX_TEXT = 400_000;

async function openChangePr(gh: GH, number: number) {
  if (!Number.isInteger(number) || number <= 0) throw new Problem(400, 'Unknown pull request.');
  const pr = await gh(`/pulls/${number}`);
  if (pr.state !== 'open') throw new Problem(409, 'This change is no longer open (it may already be merged or closed). Reload the list.');
  if (String(pr.head.ref).startsWith('article/')) throw new Problem(400, 'Articles are edited in the Articles tab.');
  if (pr.head.repo?.full_name !== pr.base.repo?.full_name) throw new Problem(400, 'This change comes from another copy of the repository, so it can only be edited on GitHub.');
  return pr;
}

async function changeFiles(gh: GH, number: number) {
  const pr = await openChangePr(gh, number);
  const files: any[] = await gh(`/pulls/${number}/files?per_page=100`);
  return {
    number,
    title: pr.title,
    branch: pr.head.ref,
    files: files.map((f) => {
      const path = String(f.filename);
      const editable = f.status !== 'removed' && TEXT_FILE.test(path);
      return {
        path,
        status: f.status as string,
        additions: f.additions as number,
        deletions: f.deletions as number,
        editable,
        why: editable ? '' : f.status === 'removed' ? 'Deleted in this change' : 'Not a text file',
      };
    }),
  };
}

async function readChangeFile(gh: GH, number: number, path: string, pr?: any) {
  pr ??= await openChangePr(gh, number);
  if (!TEXT_FILE.test(path) || path.includes('..') || path.startsWith('/')) throw new Problem(400, 'That file can\'t be edited here.');
  const files: any[] = await gh(`/pulls/${number}/files?per_page=100`);
  if (!files.some((f) => f.filename === path && f.status !== 'removed')) throw new Problem(400, 'That file isn\'t part of this change.');
  const file = await gh(`/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(pr.head.ref)}`);
  if (typeof file.content !== 'string' || (!file.content && file.size > 0)) throw new Problem(400, 'That file is too large to edit here. Ask Claude, or edit it on GitHub.');
  return { path, sha: file.sha as string, content: decode(file.content), headSha: pr.head.sha as string };
}

async function saveChangeFile(gh: GH, body: any) {
  const pr = await openChangePr(gh, Number(body?.pr));
  const path = String(body?.path ?? '');
  let content = String(body?.content ?? '');
  if (content.length > MAX_TEXT) throw new Problem(400, 'That file is too long to save here.');
  if (/\.json$/i.test(path)) {
    try { JSON.parse(content); } catch (e) {
      throw new Problem(400, `That isn't valid JSON, so it would break the build: ${e instanceof Error ? e.message : e}. Check for a missing comma or quote.`);
    }
  }
  const current = await readChangeFile(gh, pr.number, path, pr);
  if (body?.sha && body.sha !== current.sha) {
    throw new Problem(409, 'This file changed since you opened it (perhaps Claude updated it). Reload to get the latest version, then make your change again.');
  }
  if (!content.endsWith('\n') && current.content.endsWith('\n')) content += '\n';
  if (current.content === content) return { ok: true, unchanged: true, sha: current.sha };
  const res = await gh(`/contents/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `Edit via changes desk: ${path}`,
      content: encode(content),
      sha: current.sha,
      branch: pr.head.ref,
    }),
  });
  return { ok: true, sha: res.content?.sha as string };
}

// ---------- ads ----------

const ADS_PATH = 'src/data/ads.json';
const AD_SLOTS = ['billboard', 'rectangle', 'halfpage', 'card'] as const;
const AD_IMAGE = /^\/ads\/[a-z0-9][a-z0-9._-]*\.(webp|jpe?g|png|gif)$/i;
const UPLOAD_NAME = /^[a-z0-9][a-z0-9._-]{0,100}\.(webp|jpe?g|png|gif)$/i;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_IMAGE = 1_500_000;

async function defaultBranch(gh: GH) {
  const repo = await gh('');
  return String(repo.default_branch || 'main');
}

async function readAds(gh: GH) {
  const branch = await defaultBranch(gh);
  const file = await gh(`/contents/${ADS_PATH}?ref=${encodeURIComponent(branch)}`);
  return { config: JSON.parse(decode(file.content)), sha: file.sha as string, branch };
}

function checkAds(c: any) {
  const bad = (m: string) => { throw new Problem(400, m); };
  if (!c || typeof c !== 'object') bad('The ad settings are missing.');
  const n = c.network ?? {};
  if (typeof n.enabled !== 'boolean') bad('Network: choose on or off.');
  if (n.client && !/^ca-pub-\d{10,20}$/.test(n.client)) bad('Network: the AdSense publisher ID looks like ca-pub-1234567890123456.');
  if (n.enabled && !n.client) bad('Network: add the AdSense publisher ID before switching it on.');
  for (const k of ['billboard', 'rectangle', 'halfpage']) {
    if (n.slots?.[k] && !/^\d+$/.test(n.slots[k])) bad(`Network: the ${k} ad unit ID should be digits only.`);
  }
  if (!Array.isArray(c.campaigns)) bad('Campaigns are missing.');
  const ids = new Set<string>();
  c.campaigns.forEach((k: any, i: number) => {
    const where = `Campaign ${i + 1}${k?.name ? ` (${k.name})` : ''}`;
    if (!k.id || ids.has(k.id)) bad(`${where}: missing or repeated id.`);
    ids.add(k.id);
    if (!k.name || String(k.name).length > 120) bad(`${where}: give it a name (up to 120 characters).`);
    if (!k.sponsor || String(k.sponsor).length > 80) bad(`${where}: add the sponsor's name.`);
    if (!AD_SLOTS.includes(k.slot)) bad(`${where}: choose a slot.`);
    if (!['home', 'articles', 'both'].includes(k.pages)) bad(`${where}: choose where it shows.`);
    if (!AD_IMAGE.test(String(k.image ?? ''))) bad(`${where}: add an image.`);
    if (!k.alt || String(k.alt).length < 3 || String(k.alt).length > 200) bad(`${where}: describe the image for screen readers (3 to 200 characters).`);
    try { if (new URL(k.url).protocol !== 'https:') throw 0; } catch { bad(`${where}: the link must be a full https:// address.`); }
    if (!DAY.test(k.start) || !DAY.test(k.end)) bad(`${where}: add a start and an end date.`);
    if (k.end < k.start) bad(`${where}: it ends before it starts.`);
    if (k.slot === 'card' && !k.headline) bad(`${where}: a sponsored card needs a headline.`);
    if (k.headline && String(k.headline).length > 90) bad(`${where}: keep the headline to 90 characters.`);
    if (k.text && String(k.text).length > 160) bad(`${where}: keep the line of text to 160 characters.`);
    if (typeof k.active !== 'boolean') bad(`${where}: choose whether it's running or paused.`);
  });
}

async function commitFiles(gh: GH, branch: string, files: { path: string; base64: string }[], message: string) {
  const ref = await gh(`/git/ref/heads/${encodeURIComponent(branch)}`);
  const base = await gh(`/git/commits/${ref.object.sha}`);
  const tree = await Promise.all(files.map(async (f) => {
    const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: f.base64, encoding: 'base64' }) });
    return { path: f.path, mode: '100644', type: 'blob', sha: blob.sha };
  }));
  const newTree = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
  const commit = await gh('/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [ref.object.sha] }) });
  await gh(`/git/refs/heads/${encodeURIComponent(branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
  return commit.sha as string;
}

async function saveAds(gh: GH, body: any) {
  const config = body?.config;
  checkAds(config);
  const current = await readAds(gh);
  if (body?.sha && body.sha !== current.sha) {
    throw new Problem(409, 'The ad settings changed since you opened them (perhaps in another tab). Reload, then make your change again.');
  }
  const uploads: any[] = Array.isArray(body?.uploads) ? body.uploads : [];
  const used = new Set(config.campaigns.map((k: any) => k.image));
  const files = uploads
    .filter((u) => used.has(`/ads/${u?.name}`)) // drop images for campaigns removed before saving
    .map((u) => {
      if (!UPLOAD_NAME.test(String(u?.name ?? ''))) throw new Problem(400, 'An image has an unusable file name.');
      const data = String(u?.data ?? '').replace(/^data:[^,]*,/, '');
      if (data.length * 0.75 > MAX_IMAGE) throw new Problem(400, `${u.name} is too large: keep ad images under 1.5 MB (WebP or JPEG at the slot's size is plenty).`);
      return { path: `public/ads/${u.name}`, base64: data };
    });
  const text = JSON.stringify(config, null, 2) + '\n';
  if (!files.length && text === JSON.stringify(current.config, null, 2) + '\n') return { ok: true, unchanged: true, sha: current.sha };
  files.push({ path: ADS_PATH, base64: encode(text) });
  const summary = String(body?.summary ?? '').slice(0, 120) || 'update ad settings';
  await commitFiles(gh, current.branch, files, `Ads: ${summary} (via the ad manager)`);
  return { ok: true, sha: await blobSha(text) };
}

// ---------- facts (/facts/) ----------

const FACTS_PATH = 'src/data/facts.json';
const SLUG = /^[a-z0-9][a-z0-9-]{0,59}$/;

async function readFacts(gh: GH) {
  const branch = await defaultBranch(gh);
  let file: any;
  try {
    file = await gh(`/contents/${FACTS_PATH}?ref=${encodeURIComponent(branch)}`);
  } catch (e) {
    if (e instanceof Problem && e.status === 404) throw new Problem(404, 'The facts page isn\'t live yet: merge the "Facts page" change in the Changes tab first.');
    throw e;
  }
  return { facts: JSON.parse(decode(file.content)), sha: file.sha as string, branch };
}

function checkFacts(d: any) {
  const bad = (m: string) => { throw new Problem(400, m); };
  if (!d || !Array.isArray(d.groups) || !d.groups.length) bad('The facts are missing.');
  if (d.groups.length > 12) bad('Keep it to 12 groups or fewer.');
  const ids = new Set<string>();
  const groupIds = new Set<string>();
  d.groups.forEach((g: any, gi: number) => {
    const gw = `Group ${gi + 1}${g?.title ? ` (${g.title})` : ''}`;
    if (!SLUG.test(String(g?.id ?? '')) || groupIds.has(g.id)) bad(`${gw}: missing or repeated id.`);
    groupIds.add(g.id);
    if (!g.title || String(g.title).length > 60) bad(`${gw}: give it a heading (up to 60 characters).`);
    if (!Array.isArray(g.facts) || !g.facts.length) bad(`${gw}: add at least one fact, or remove the group.`);
    if (g.facts.length > 40) bad(`${gw}: keep it to 40 facts or fewer.`);
    g.facts.forEach((f: any, fi: number) => {
      const fw = `${g.title}, fact ${fi + 1}${f?.label ? ` (${f.label})` : ''}`;
      if (!SLUG.test(String(f?.id ?? '')) || ids.has(f.id)) bad(`${fw}: missing or repeated id.`);
      ids.add(f.id);
      if (!f.label || String(f.label).length > 60) bad(`${fw}: add a label (up to 60 characters).`);
      if (!f.value || String(f.value).length > 600) bad(`${fw}: add the detail (up to 600 characters).`);
      const src = String(f.source ?? '');
      const okSrc = /^\/[^\s]*$/.test(src) || (() => { try { return new URL(src).protocol === 'https:'; } catch { return false; } })();
      if (!okSrc) bad(`${fw}: the source must be a page on this site (starting /) or a full https:// address.`);
      if (f.sourceLabel != null && (typeof f.sourceLabel !== 'string' || f.sourceLabel.length > 50)) bad(`${fw}: keep the source name to 50 characters.`);
      if (!DAY.test(String(f.checked ?? ''))) bad(`${fw}: add the date you checked it.`);
    });
  });
}

async function saveFacts(gh: GH, body: any) {
  const facts = body?.facts;
  checkFacts(facts);
  const current = await readFacts(gh);
  if (body?.sha && body.sha !== current.sha) {
    throw new Problem(409, 'The facts changed since you opened them (perhaps in another tab, or Claude edited them). Reload, then make your change again.');
  }
  // The page's "Last checked" date is the newest date on any fact
  const dates = facts.groups.flatMap((g: any) => g.facts.map((f: any) => f.checked)).sort();
  const clean = {
    checked: dates[dates.length - 1],
    groups: facts.groups.map((g: any) => ({
      id: g.id,
      title: String(g.title).trim(),
      facts: g.facts.map((f: any) => {
        const o: any = { id: f.id, label: String(f.label).trim(), value: String(f.value).trim(), source: String(f.source).trim() };
        if (f.sourceLabel && String(f.sourceLabel).trim()) o.sourceLabel = String(f.sourceLabel).trim();
        o.checked = f.checked;
        return o;
      }),
    })),
  };
  const text = JSON.stringify(clean, null, 2) + '\n';
  if (text === JSON.stringify(current.facts, null, 2) + '\n') return { ok: true, unchanged: true, sha: current.sha, facts: clean };
  const summary = String(body?.summary ?? '').slice(0, 120) || 'update the facts page';
  await commitFiles(gh, current.branch, [{ path: FACTS_PATH, base64: encode(text) }], `Facts: ${summary} (via the facts editor)`);
  return { ok: true, sha: await blobSha(text), facts: clean };
}

// The SHA GitHub gives a file's contents, so the next save can check nothing changed in between
async function blobSha(text: string) {
  const bytes = new TextEncoder().encode(text);
  const head = new TextEncoder().encode(`blob ${bytes.length}\0`);
  const all = new Uint8Array(head.length + bytes.length);
  all.set(head); all.set(bytes, head.length);
  const d = await crypto.subtle.digest('SHA-1', all);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- helpers ----------

function json(status: number, data: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', ...headers },
  });
}
