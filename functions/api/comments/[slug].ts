// Cloudflare Pages Function: the Listening Post, readers' notes on an article, at /api/comments/<slug>.
//   GET   → the approved notes, newest first
//   POST  → { text, name?, role? } stores one note, then returns the approved notes
//
// An article gets a Listening Post with `listeningPost` in its frontmatter (docs/listening-post.md).
// Notes are held for Jim to approve in the Comments tab at /admin, unless COMMENTS_AUTO_APPROVE is
// "1", in which case they appear straight away and the tab is for removing them.
//
// Storage: the reader-checks D1 database (CHECKS_DB), or COMMENTS_DB if bound. The table is created on
// first use. Optional: RESEND_API_KEY emails Jim each new note (COMMENTS_NOTIFY_TO, default
// jim@thelearningcurve.net). We never store IP addresses: only a salted SHA-256 of IP + browser +
// article, used to limit each reader to a few notes a day.

interface D1Result<T> { results: T[] }
interface D1Stmt { bind(...v: unknown[]): D1Stmt; all<T>(): Promise<D1Result<T>>; first<T>(): Promise<T | null>; run(): Promise<unknown> }
interface D1 { prepare(sql: string): D1Stmt }
interface Env {
  COMMENTS_DB?: D1;
  CHECKS_DB?: D1;
  CHECK_SALT?: string;
  COMMENTS_AUTO_APPROVE?: string;
  RESEND_API_KEY?: string;
  COMMENTS_NOTIFY_TO?: string;
  COMMENTS_FROM?: string;
  ASSETS: { fetch(req: Request | string): Promise<Response> };
}
type Ctx = { request: Request; env: Env; params: { slug?: string | string[] } };
type Shape = { live: boolean; title: string; url: string };

const COMMENTS_TABLE = `CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, slug TEXT NOT NULL, at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending',
  name TEXT, role TEXT, text TEXT NOT NULL, voter TEXT NOT NULL
)`;
const SLUG = /^[a-z0-9-]{1,120}$/;
const PER_DAY = 3;
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|ru|xyz|top|info|biz)\b)/i;
let ready = false;

export const onRequest = async ({ request, env, params }: Ctx): Promise<Response> => {
  const slug = String([params.slug ?? ''].flat()[0]);
  if (!SLUG.test(slug)) return json(404, { error: 'Unknown article' });
  if (request.method !== 'GET' && request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  // Only articles whose frontmatter opens a Listening Post have this file
  const res = await env.ASSETS.fetch(new URL(`/comments/${slug}.json`, request.url).toString());
  if (!res.ok) return json(404, { error: 'This article has no Listening Post' });
  const shape = (await res.json()) as Shape;

  const db = env.COMMENTS_DB ?? env.CHECKS_DB;
  if (!db) return json(503, { error: 'The Listening Post is not switched on yet' });
  if (!ready) {
    await db.prepare(COMMENTS_TABLE).run();
    await db.prepare('CREATE INDEX IF NOT EXISTS comments_slug ON comments (slug, status, at)').run();
    ready = true;
  }

  let posted: 'approved' | 'pending' | null = null;
  if (request.method === 'POST') {
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== new URL(request.url).host) return json(403, { error: 'Not allowed' });
    if (!shape.live) return json(409, { error: 'This article is not published yet, so notes are not open' });

    let raw: Record<string, unknown>;
    try { raw = (await request.json()) as Record<string, unknown>; } catch { return json(400, { error: 'Bad request' }); }
    // Honeypot: people never fill this in
    if (raw.website_confirm) return json(200, { posted: 'pending', items: [] });

    const text = clean(raw.text, 600);
    const name = clean(raw.name, 60);
    const role = clean(raw.role, 80);
    if (text.length < 3) return json(400, { error: 'Write a little more first.' });
    if (LINK.test(text) || LINK.test(name) || LINK.test(role)) return json(400, { error: 'Links aren\'t allowed on the Listening Post. Please remove it and try again.' });

    const ip = request.headers.get('cf-connecting-ip') ?? '';
    const ua = request.headers.get('user-agent') ?? '';
    const voter = await sha256(`${env.CHECK_SALT ?? 'tlc'}|comments|${ip}|${ua}|${slug}`);
    const recent = await db.prepare('SELECT COUNT(*) AS n FROM comments WHERE slug = ? AND voter = ? AND at > ?')
      .bind(slug, voter, Date.now() - 86400000).first<{ n: number }>();
    if ((recent?.n ?? 0) >= PER_DAY) return json(429, { error: 'Thanks. You\'ve left a few notes today; come back tomorrow for more.' });

    posted = env.COMMENTS_AUTO_APPROVE === '1' ? 'approved' : 'pending';
    const id = crypto.randomUUID();
    await db.prepare('INSERT INTO comments (id, slug, at, status, name, role, text, voter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, slug, Date.now(), posted, name, role, text, voter).run();

    if (env.RESEND_API_KEY) {
      try {
        const r = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from: env.COMMENTS_FROM || 'The Learning Curve <listening@thelearningcurve.net>',
            to: [env.COMMENTS_NOTIFY_TO || 'jim@thelearningcurve.net'],
            subject: `Listening Post: a new note on "${shape.title}"`,
            text: [
              `${name || 'A reader'}${role ? `, ${role}` : ''} wrote on ${shape.url}:`, '', text, '',
              posted === 'pending' ? 'It is waiting for you in the Comments tab: https://thelearningcurve.net/admin/#comments' : 'It is live. Remove it in the Comments tab if needed: https://thelearningcurve.net/admin/#comments',
            ].join('\n'),
          }),
        });
        if (!r.ok) console.log('Resend error', r.status, await r.text());
      } catch (e) {
        console.log('Comment email failed', e instanceof Error ? e.message : e);
      }
    }
  }

  const rows = await db.prepare("SELECT id, at, name, role, text FROM comments WHERE slug = ? AND status = 'approved' ORDER BY at DESC LIMIT 200")
    .bind(slug).all<{ id: string; at: number; name: string; role: string; text: string }>();
  return json(200, { posted, items: rows.results });
};

function clean(v: unknown, max: number) {
  return String(v ?? '').replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '').replace(/\s+\n/g, '\n').trim().slice(0, max);
}

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
