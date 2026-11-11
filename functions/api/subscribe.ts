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

const MAGNETS: Record<string, string> = { 'ai-report': 'AI report' };
// The Beehiiv automation that delivers each lead magnet. Its sign-up trigger only fires for new
// subscribers, so the site also enrols every requester through the automation's API trigger;
// that way people already on the list get the email too. Enrolment is "limited" (once per
// person), so a new subscriber caught by both triggers still gets one email.
const MAGNET_AUTOMATIONS: Record<string, string> = { 'ai-report': 'aut_c21b98cc-5af3-40a5-8cbc-46f8f1cc5399' };
const NEXT = new Set(['/reports/ai-tools-for-learning-design/thanks/']);

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
  // Lead magnets: a form that offers a download sends `magnet` (e.g. "AI report"). It's stored in
  // the Beehiiv custom field "Lead magnet" so the welcome automation can send the file and Jim can
  // see which offer and placement earned each subscriber. Only known values are accepted.
  const magnet = MAGNETS[data.magnet ?? ''] ?? '';
  // Where a no-JavaScript form goes after signing up: only the known thank-you pages.
  const next = NEXT.has(data.next ?? '') ? data.next! : '';

  // First name, for the email greeting ({{first_name|there}} in Beehiiv). Optional on the API side.
  const firstName = (data.first_name ?? '').replace(/[<>{}]/g, '').trim().slice(0, 60);
  const fields = [
    ...(firstName ? [{ name: 'First Name', value: firstName }] : []),
    { name: 'Signup page', value: page || '/' },
    { name: 'CredentialCraft opt-in', value: credentialcraft ? 'Yes' : 'No' },
  ];
  const subscribe = (custom_fields: { name: string; value: string }[]) =>
    fetch(`https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
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
        custom_fields,
      }),
    });

  let res = await subscribe(magnet ? [...fields, { name: 'Lead magnet', value: magnet }] : fields);
  // If the "Lead magnet" field hasn't been created in Beehiiv yet, never lose the sign-up over it.
  if (!res.ok && magnet) {
    console.log('Beehiiv error with Lead magnet field, retrying without it', res.status, await res.text());
    res = await subscribe(fields);
  }

  if (!res.ok) {
    console.log('Beehiiv error', res.status, await res.text());
    return reply(isJson, 502, 'Something went wrong. Please try again in a minute.');
  }
  if (magnet) {
    const automation = MAGNET_AUTOMATIONS[data.magnet ?? ''];
    if (automation) {
      const enrol = await fetch(
        `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/automations/${automation}/journeys`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${env.BEEHIIV_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        },
      ).catch((e) => { console.log('Beehiiv automation enrolment failed', String(e)); return null; });
      // Never fail the sign-up over this: the download is already on the page.
      if (enrol && !enrol.ok) console.log('Beehiiv automation enrolment error', enrol.status, await enrol.text());
    }
    return reply(isJson, 200, 'Thanks. Your download is ready.', next);
  }
  return reply(isJson, 200, 'Thanks for subscribing. Look out for a welcome email.', next);
};

function reply(isJson: boolean, status: number, message: string, next = '') {
  if (isJson) {
    return new Response(JSON.stringify({ ok: status < 300, message }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  const to = status < 300 ? next || '/newsletter/thanks/' : '/newsletter/?error=1';
  return Response.redirect(new URL(to, 'https://thelearningcurve.net').toString(), 303);
}
