// Cloudflare Pages Function: POST /api/enquiry
// An advertising enquiry ("Request the media kit") from /advertising/. Stores it in D1 and emails a
// notification so Jim can reply with the media kit. Setup: docs/ads.md ("Advertising enquiries").
//
// Bindings and variables (Cloudflare Pages → Settings):
//   SUBMISSIONS_DB          D1 binding. Falls back to CHECKS_DB, so the reader-checks database works too.
//   RESEND_API_KEY          secret, from resend.com (thelearningcurve.net verified there)
//   ADVERTISING_NOTIFY_TO   optional, defaults to advertising@thelearningcurve.net
//   SUBMIT_FROM             optional, defaults to "The Learning Curve <submissions@thelearningcurve.net>"
//   MEDIA_KIT_SECRET        optional, signs the media kit download link (falls back to RESEND_API_KEY)
//
// On success the enquirer gets a download link for the media kit PDF (public/media-kit/), valid for
// 7 days. functions/media-kit/[[path]].ts checks the link before serving the file.
//
// Saved even when email isn't set up, and emailed even if storage isn't. Only if both are missing
// does the reader see an error (with the address to write to instead).
//
// Accepts JSON (from the page's script) or a normal form post (no-JavaScript fallback).

interface D1Stmt { bind(...v: unknown[]): D1Stmt; run(): Promise<unknown> }
interface D1 { prepare(sql: string): D1Stmt }
interface Env {
  SUBMISSIONS_DB?: D1;
  CHECKS_DB?: D1;
  RESEND_API_KEY?: string;
  ADVERTISING_NOTIFY_TO?: string;
  SUBMIT_FROM?: string;
  MEDIA_KIT_SECRET?: string;
}

const KIT_PATH = '/media-kit/the-learning-curve-media-kit.pdf';
const KIT_DAYS = 7;

async function kitLink(env: Env): Promise<string> {
  const secret = env.MEDIA_KIT_SECRET || env.RESEND_API_KEY;
  if (!secret) return KIT_PATH;
  const exp = Math.floor(Date.now() / 1000) + KIT_DAYS * 86400;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`kit:${exp}`)));
  const sig = btoa(String.fromCharCode(...mac)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${KIT_PATH}?t=${exp}.${sig}`;
}

const TABLE = `CREATE TABLE IF NOT EXISTS ad_enquiries (
  id TEXT PRIMARY KEY, at INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'new',
  name TEXT, email TEXT, organisation TEXT, role TEXT, url TEXT,
  interests TEXT, timing TEXT, message TEXT
)`;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LIMITS: Record<string, number> = {
  name: 120, email: 254, organisation: 160, role: 120, url: 300, timing: 80, message: 2000,
};
const FALLBACK = 'advertising@thelearningcurve.net';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const isJson = (request.headers.get('content-type') ?? '').includes('application/json');
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return reply(isJson, 403, 'Not allowed.');

  let raw: Record<string, unknown> = {};
  try {
    if (isJson) raw = await request.json();
    else {
      const fd = await request.formData();
      raw = Object.fromEntries([...fd.keys()].map((k) => [k, k === 'interests' ? fd.getAll(k).map(String) : String(fd.get(k))]));
    }
  } catch {
    return reply(isJson, 400, 'Something went wrong. Please try again.');
  }

  // Honeypot: real people never fill this field in
  if (raw.website_confirm) return reply(isJson, 200, 'Thanks.');

  const d: Record<string, string> = {};
  for (const [k, max] of Object.entries(LIMITS)) d[k] = String(raw[k] ?? '').trim().slice(0, max);
  const interests = (Array.isArray(raw.interests) ? raw.interests : raw.interests ? [raw.interests] : [])
    .map((a) => String(a).slice(0, 40)).slice(0, 10).join(', ');
  d.email = d.email.toLowerCase();

  if (!d.name || !d.organisation) return reply(isJson, 400, 'Please fill in your name and organisation.');
  if (!EMAIL.test(d.email)) return reply(isJson, 400, 'Please enter a valid work email.');
  // Accept bare domains (example.com, www.example.com) by adding https://
  if (d.url && !/^https?:\/\//i.test(d.url)) d.url = `https://${d.url}`;
  if (d.url && !/^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(d.url)) return reply(isJson, 400, 'Please check your website address, for example yourcompany.com, or leave it blank.');

  const id = crypto.randomUUID();
  const at = Date.now();
  const db = env.SUBMISSIONS_DB ?? env.CHECKS_DB;
  let stored = false;
  let emailed = false;

  if (db) {
    try {
      await db.prepare(TABLE).run();
      await db.prepare(
        `INSERT INTO ad_enquiries (id, at, status, name, email, organisation, role, url, interests, timing, message)
         VALUES (?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(id, at, d.name, d.email, d.organisation, d.role, d.url, interests, d.timing, d.message).run();
      stored = true;
    } catch (e) {
      console.log('Enquiry store failed', e instanceof Error ? e.message : e);
    }
  }

  if (env.RESEND_API_KEY) {
    const to = env.ADVERTISING_NOTIFY_TO || FALLBACK;
    const from = env.SUBMIT_FROM || 'The Learning Curve <submissions@thelearningcurve.net>';
    const rows: [string, string][] = [
      ['From', `${d.name}${d.role ? `, ${d.role}` : ''}`], ['Organisation', d.organisation], ['Website', d.url],
      ['Email', d.email], ['Interested in', interests], ['Timing', d.timing],
    ];
    const text = [
      `Media kit request: ${d.organisation}`, '',
      ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), '',
      ...(d.message ? ['Message:', d.message, ''] : []),
      'They were given the media kit download on the site. Follow up, and check the advertiser against "Who we accept" first (/advertising/#who-we-accept).',
      stored ? '' : 'Not stored: the D1 binding is missing.',
    ].join('\n');
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], reply_to: d.email, subject: `Media kit request: ${d.organisation}`, text }),
      });
      emailed = res.ok;
      if (!res.ok) console.log('Resend error', res.status, await res.text());
    } catch (e) {
      console.log('Enquiry email failed', e instanceof Error ? e.message : e);
    }
  }

  // The enquirer gets the kit even if storage and email both failed; log it so it isn't silent.
  if (!stored && !emailed) console.log('Enquiry neither stored nor emailed', d.email, d.organisation);
  return reply(isJson, 200, 'Thanks. Your media kit is ready.', await kitLink(env));
};

function reply(isJson: boolean, status: number, message: string, download?: string) {
  if (isJson) {
    return new Response(JSON.stringify({ ok: status < 300, message, download }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  const to = status < 300
    ? `/advertising/thanks/${download ? `?kit=${encodeURIComponent(download)}` : ''}`
    : '/advertising/?error=1#media-kit';
  return Response.redirect(new URL(to, 'https://thelearningcurve.net').toString(), 303);
}
