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
// The ad manager (Ads tab) reads src/data/ads.json from the default branch and saves it, plus any
// new ad images in public/ads/, as one commit there. Cloudflare then rebuilds the live site.
// The file's rules are in src/lib/ads.ts and docs/ads.md; they are checked here too, so a save
// can't break the build.

interface SubDb {
  prepare(sql: string): { bind(...v: unknown[]): any; all<T>(): Promise<{ results: T[] }>; run(): Promise<unknown> };
}
interface Env {
  ADMIN_PASSWORD?: string;
  GITHUB_TOKEN?: string;
  GITHUB_REPO?: string;
  // Platform submissions from /submit (functions/api/submit.ts, docs/submissions.md)
  SUBMISSIONS_DB?: SubDb;
  CHECKS_DB?: SubDb;
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
    if (route === 'changes/merge' && request.method === 'POST') return await mergeChange(gh, await request.json());
    if (route === 'ads' && request.method === 'GET') return json(200, await readAds(gh));
    if (route === 'ads/save' && request.method === 'POST') return json(200, await saveAds(gh, await request.json()));
    if (route === 'submissions' && request.method === 'GET') return json(200, await listSubmissions(env));
    if (route === 'submissions/status' && request.method === 'POST') return json(200, await setSubmission(env, await request.json()));
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
  const full = await gh(`/pulls/${pr.number}`);
  if (full.mergeable === false) {
    return json(409, { error: 'This article clashes with something already published (usually a line in the backlog). Ask Claude to fix the conflict, then publish.' });
  }
  if (full.mergeable === null) {
    return json(409, { error: 'GitHub is still checking this article against the live site. Try again in a few seconds.' });
  }
  await gh(`/pulls/${pr.number}/merge`, {
    method: 'PUT',
    body: JSON.stringify({ merge_method: 'merge', sha: pr.head.sha, commit_title: `${pr.title} (#${pr.number})` }),
  });
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
  if (pr.mergeable === false) return json(409, { error: 'This change clashes with something already on the live site. Ask Claude to fix the conflict, then merge.' });
  if (pr.mergeable === null) return json(409, { error: 'GitHub is still checking this change against the live site. Try again in a few seconds.' });
  await gh(`/pulls/${number}/merge`, {
    method: 'PUT',
    body: JSON.stringify({ merge_method: 'merge', sha: pr.head.sha, commit_title: `${pr.title} (#${number})` }),
  });
  return json(200, { ok: true, message: `Merged #${number}. The live site rebuilds in about two minutes.` });
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
