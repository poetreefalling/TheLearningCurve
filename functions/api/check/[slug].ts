// Cloudflare Pages Function: the results of each article's quiz or poll, at /api/check/<slug>.
//   GET   → how everyone has answered so far
//   POST  → { answers: [optionIndex, …] } records one reader's answers, then returns the results
//
// Storage: a Cloudflare D1 database bound to this Pages project as CHECKS_DB (setup in
// docs/reader-checks.md). The tables are created on first use. Without the binding, both routes
// answer 503 and the page still shows quiz answers, just without other readers' results.
//
// Optional secret CHECK_SALT: mixed into the hash used to stop the same browser counting twice.
// We never store IP addresses: only a salted SHA-256 of IP + browser + article.

interface D1Result<T> { results: T[] }
interface D1Stmt { bind(...v: unknown[]): D1Stmt; all<T>(): Promise<D1Result<T>>; first<T>(): Promise<T | null>; run(): Promise<unknown> }
interface D1 { prepare(sql: string): D1Stmt; batch(s: D1Stmt[]): Promise<unknown[]> }
interface Env {
  CHECKS_DB?: D1;
  CHECK_SALT?: string;
  ASSETS: { fetch(req: Request | string): Promise<Response> };
}
type Ctx = { request: Request; env: Env; params: { slug?: string | string[] } };
type Shape = { kind: 'quiz' | 'poll'; options: number[]; live: boolean };

const SLUG = /^[a-z0-9-]{1,120}$/;
let ready = false;

export const onRequest = async ({ request, env, params }: Ctx): Promise<Response> => {
  const slug = String([params.slug ?? ''].flat()[0]);
  if (!SLUG.test(slug)) return json(404, { error: 'Unknown article' });
  if (request.method !== 'GET' && request.method !== 'POST') return json(405, { error: 'Method not allowed' });

  // The article's shape, from the static file the build writes
  const res = await env.ASSETS.fetch(new URL(`/checks/${slug}.json`, request.url).toString());
  if (!res.ok) return json(404, { error: 'This article has no quiz or poll' });
  const shape = (await res.json()) as Shape;

  const db = env.CHECKS_DB;
  if (!db) return json(503, { error: 'Results are not switched on yet' });
  if (!ready) {
    await db.batch([
      db.prepare('CREATE TABLE IF NOT EXISTS tallies (slug TEXT NOT NULL, q INTEGER NOT NULL, opt INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (slug, q, opt))'),
      db.prepare('CREATE TABLE IF NOT EXISTS voters (slug TEXT NOT NULL, voter TEXT NOT NULL, at INTEGER NOT NULL, PRIMARY KEY (slug, voter))'),
    ]);
    ready = true;
  }

  let counted = false;
  if (request.method === 'POST') {
    // Same-site requests only
    const origin = request.headers.get('origin');
    if (origin && new URL(origin).host !== new URL(request.url).host) return json(403, { error: 'Not allowed' });
    if (!shape.live) return json(409, { error: 'This article is not published yet, so answers are not counted' });

    let answers: unknown;
    try {
      answers = ((await request.json()) as { answers?: unknown }).answers;
    } catch {
      return json(400, { error: 'Bad request' });
    }
    if (
      !Array.isArray(answers) || answers.length !== shape.options.length ||
      !answers.every((a, i) => Number.isInteger(a) && a >= 0 && a < shape.options[i])
    ) {
      return json(400, { error: 'Answers do not match the questions' });
    }

    const ip = request.headers.get('cf-connecting-ip') ?? '';
    const ua = request.headers.get('user-agent') ?? '';
    const voter = await sha256(`${env.CHECK_SALT ?? 'tlc'}|${ip}|${ua}|${slug}`);
    const seen = await db.prepare('SELECT 1 AS x FROM voters WHERE slug = ? AND voter = ?').bind(slug, voter).first();
    if (!seen) {
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO voters (slug, voter, at) VALUES (?, ?, ?)').bind(slug, voter, Date.now()),
        ...(answers as number[]).map((opt, q) =>
          db.prepare('INSERT INTO tallies (slug, q, opt, n) VALUES (?, ?, ?, 1) ON CONFLICT (slug, q, opt) DO UPDATE SET n = n + 1')
            .bind(slug, q, opt),
        ),
      ]);
      counted = true;
    }
  }

  const rows = await db.prepare('SELECT q, opt, n FROM tallies WHERE slug = ?').bind(slug).all<{ q: number; opt: number; n: number }>();
  const counts = shape.options.map((n) => Array(n).fill(0) as number[]);
  for (const r of rows.results) if (counts[r.q] && r.opt < counts[r.q].length) counts[r.q][r.opt] = r.n;
  const total = Math.max(0, ...counts.map((c) => c.reduce((s, v) => s + v, 0)));
  return json(200, { kind: shape.kind, total, counts, counted });
};

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
