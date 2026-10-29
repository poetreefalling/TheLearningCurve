// Cloudflare Pages Function: POST /api/subscribe
// Adds a reader to The Learning Curve's Beehiiv publication. The API key stays on the server.
//
// Environment variables (Cloudflare Pages → Settings → Variables and secrets):
//   BEEHIIV_API_KEY         secret, from Beehiiv → Settings → API
//   BEEHIIV_PUBLICATION_ID  e.g. pub_00000000-0000-0000-0000-000000000000
//
// Accepts JSON (from the site's script) or a normal form post (no-JavaScript fallback).

interface Env {
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const isJson = (request.headers.get('content-type') ?? '').includes('application/json');
  let data: Record<string, string> = {};
  try {
    data = isJson
      ? await request.json()
      : Object.fromEntries([...(await request.formData()).entries()].map(([k, v]) => [k, String(v)]));
  } catch {
    return reply(isJson, 400, 'Something went wrong. Please try again.');
  }

  // Honeypot: real people never fill this field in
  if (data.company) return reply(isJson, 200, 'Thanks for subscribing.');

  const email = (data.email ?? '').trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) {
    return reply(isJson, 400, 'Please enter a valid email address.');
  }
  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
    return reply(isJson, 503, 'Sign-ups open shortly. Please try again soon.');
  }

  const page = (data.page ?? '').slice(0, 200);
  const credentialcraft = data.credentialcraft === 'yes' || data.credentialcraft === 'on';

  const res = await fetch(
    `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.BEEHIIV_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        utm_source: 'thelearningcurve.net',
        utm_medium: 'website',
        utm_campaign: (data.placement ?? 'site').slice(0, 50),
        referring_site: page ? `https://thelearningcurve.net${page}` : 'https://thelearningcurve.net/',
        custom_fields: [
          { name: 'Signup page', value: page || '/' },
          { name: 'CredentialCraft opt-in', value: credentialcraft ? 'Yes' : 'No' },
        ],
      }),
    },
  );

  if (!res.ok) {
    console.log('Beehiiv error', res.status, await res.text());
    return reply(isJson, 502, 'Something went wrong. Please try again in a minute.');
  }
  return reply(isJson, 200, 'Thanks for subscribing. Look out for a welcome email.');
};

function reply(isJson: boolean, status: number, message: string) {
  if (isJson) {
    return new Response(JSON.stringify({ ok: status < 300, message }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  const to = status < 300 ? '/newsletter/thanks/' : '/newsletter/?error=1';
  return Response.redirect(new URL(to, 'https://thelearningcurve.net').toString(), 303);
}
