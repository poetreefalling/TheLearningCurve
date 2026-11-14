// Cloudflare Pages Function: POST /api/submit
// A platform submission from /submit. Stores it in D1 (the Submissions tab at /admin reads it) and
// emails a notification. Setup: docs/submissions.md.
//
// Bindings and variables (Cloudflare Pages → Settings):
//   SUBMISSIONS_DB      D1 binding. Falls back to CHECKS_DB, so the reader-checks database works too.
//   RESEND_API_KEY      secret, from resend.com (the sending domain thelearningcurve.net must be verified there)
//   SUBMIT_NOTIFY_TO    optional, defaults to jim@thelearningcurve.net
//   SUBMIT_FROM         optional, defaults to "The Learning Curve <submissions@thelearningcurve.net>"
//
// The entry is saved even when email isn't set up, and email is still sent if storage isn't.
// Only if both are missing does the reader see an error.
//
// Accepts JSON (from the page's script) or a normal form post (no-JavaScript fallback).

interface D1Stmt { bind(...v: unknown[]): D1Stmt; run(): Promise<unknown> }
interface D1 { prepare(sql: string): D1Stmt }
interface Env {
  SUBMISSIONS_DB?: D1;
  CHECKS_DB?: D1;
  RESEND_API_KEY?: string;
  SUBMIT_NOTIFY_TO?: string;
  SUBMIT_FROM?: string;
}

const SUBMISSIONS_TABLE = `CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY, at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  name TEXT, email TEXT, organisation TEXT, role TEXT, org_type TEXT,
  product TEXT, url TEXT, category TEXT, stage TEXT, audience TEXT,
  description TEXT, learning TEXT, access TEXT, notes TEXT, editor_note TEXT
)`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS: Record<string, number> = {
  name: 120, email: 254, organisation: 160, role: 120, orgType: 60, product: 160, url: 300,
  category: 60, stage: 60, description: 2400, learning: 1600, access: 60, notes: 1600,
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const isJson = (request.headers.get('content-type') ?? '').includes('application/json');
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return reply(isJson, 403, 'Not allowed.');

  let raw: Record<string, unknown> = {};
  try {
    if (isJson) raw = await request.json();
    else {
      const fd = await request.formData();
      raw = Object.fromEntries([...fd.keys()].map((k) => [k, k === 'audience' ? fd.getAll(k).map(String) : String(fd.get(k))]));
    }
  } catch {
    return reply(isJson, 400, 'Something went wrong. Please try again.');
  }

  // Honeypot: real people never fill this field in
  if (raw.website_confirm) return reply(isJson, 200, 'Thanks. Your submission is in.');

  const d: Record<string, string> = {};
  for (const [k, max] of Object.entries(LIMITS)) d[k] = String(raw[k] ?? '').trim().slice(0, max);
  const audience = (Array.isArray(raw.audience) ? raw.audience : raw.audience ? [raw.audience] : [])
    .map((a) => String(a).slice(0, 40)).slice(0, 8).join(', ');
  d.email = d.email.toLowerCase();

  const missing = (['name', 'organisation', 'product', 'description'] as const).filter((k) => !d[k]);
  if (missing.length) return reply(isJson, 400, 'Please fill in your name, organisation, the platform name and what it does.');
  if (!EMAIL.test(d.email)) return reply(isJson, 400, 'Please enter a valid work email.');
  // Accept bare domains (example.com, www.example.com) by adding https://
  if (d.url && !/^https?:\/\//i.test(d.url)) d.url = `https://${d.url}`;
  if (!/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(d.url)) return reply(isJson, 400, 'Please check the platform\'s website address, for example yourplatform.com');
  if (!d.category) return reply(isJson, 400, 'Please choose a category.');
  if (raw.consent !== 'yes' && raw.consent !== 'on' && raw.consent !== true) return reply(isJson, 400, 'Please tick the box to confirm you understand how reviews work.');

  const id = crypto.randomUUID();
  const at = Date.now();
  const db = env.SUBMISSIONS_DB ?? env.CHECKS_DB;
  let stored = false;
  let emailed = false;

  if (db) {
    try {
      await db.prepare(SUBMISSIONS_TABLE).run();
      await db.prepare(
        `INSERT INTO submissions (id, at, status, name, email, organisation, role, org_type, product, url, category, stage, audience, description, learning, access, notes)
         VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, at, d.name, d.email, d.organisation, d.role, d.orgType, d.product, d.url, d.category, d.stage, audience, d.description, d.learning, d.access, d.notes).run();
      stored = true;
    } catch (e) {
      console.log('Submission store failed', e instanceof Error ? e.message : e);
    }
  }

  if (env.RESEND_API_KEY) {
    const to = env.SUBMIT_NOTIFY_TO || 'jim@thelearningcurve.net';
    const from = env.SUBMIT_FROM || 'The Learning Curve <submissions@thelearningcurve.net>';
    const rows: [string, string][] = [
      ['Platform', d.product], ['Website', d.url], ['Category', d.category], ['Stage', d.stage],
      ['Built for', audience], ['From', `${d.name}${d.role ? `, ${d.role}` : ''}`], ['Organisation', `${d.organisation}${d.orgType ? ` (${d.orgType})` : ''}`],
      ['Email', d.email], ['Reviewer access', d.access],
    ];
    const text = [
      `New platform submission: ${d.product}`, '',
      ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), '',
      'What it does:', d.description, '',
      ...(d.learning ? ['How it helps people learn:', d.learning, ''] : []),
      ...(d.notes ? ['Anything else:', d.notes, ''] : []),
      stored ? 'Review it in the Submissions tab: https://thelearningcurve.net/admin/#submissions' : 'Not stored: the D1 binding is missing (docs/submissions.md).',
    ].join('\n');
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], reply_to: d.email, subject: `Platform submission: ${d.product} (${d.organisation})`, text }),
      });
      emailed = res.ok;
      if (!res.ok) console.log('Resend error', res.status, await res.text());
    } catch (e) {
      console.log('Submission email failed', e instanceof Error ? e.message : e);
    }
  }

  if (!stored && !emailed) return reply(isJson, 503, 'Submissions open shortly. Please try again soon, or email jim@thelearningcurve.net.');
  return reply(isJson, 200, 'Thanks. Your submission is in.');
};

function reply(isJson: boolean, status: number, message: string) {
  if (isJson) {
    return new Response(JSON.stringify({ ok: status < 300, message }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  const to = status < 300 ? '/submit/thanks/' : '/submit/?error=1';
  return Response.redirect(new URL(to, 'https://thelearningcurve.net').toString(), 303);
}
