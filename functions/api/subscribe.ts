// Cloudflare Pages Function: POST /api/subscribe
// Adds a reader to The Learning Curve's Beehiiv publication. The API key stays on the server.
//
// Environment variables (Cloudflare Pages → Settings → Variables and secrets):
//   BEEHIIV_API_KEY         secret, from Beehiiv → Settings → API
//   BEEHIIV_PUBLICATION_ID  e.g. pub_00000000-0000-0000-0000-000000000000
//   RESEND_API_KEY          secret (already set for /api/submit); sends the kit delivery email
//   KIT_FROM                optional, default "The Learning Curve <hello@thelearningcurve.net>"
//
// Accepts JSON (from the site's script) or a normal form post (no-JavaScript fallback).

import { kitEmail } from '../../emails/kit-delivery';
import { guideEmail } from '../../emails/teacher-guide-delivery';
import { ROLES } from '../../src/data/kit';

interface Env {
  BEEHIIV_API_KEY?: string;
  BEEHIIV_PUBLICATION_ID?: string;
  RESEND_API_KEY?: string;
  KIT_FROM?: string;
}

const MAGNETS: Record<string, string> = { 'ai-report': 'AI report', 'course-design-kit': 'Course design kit', 'teacher-guide': 'Teacher career guide' };
// The Beehiiv automation that delivers each lead magnet. Its sign-up trigger only fires for new
// subscribers, so the site also enrols every requester through the automation's API trigger;
// that way people already on the list get the email too. Enrolment is "limited" (once per
// person), so a new subscriber caught by both triggers still gets one email.
const MAGNET_AUTOMATIONS: Record<string, string> = { 'ai-report': 'aut_c21b98cc-5af3-40a5-8cbc-46f8f1cc5399' };
// Lead magnets delivered by the site itself through Resend (no Beehiiv automation needed).
const RESEND_MAGNETS = new Set(['course-design-kit', 'teacher-guide']);
const NEXT = new Set(['/reports/ai-tools-for-learning-design/thanks/', '/kit/thanks/', '/reports/classroom-to-instructional-design/thanks/']);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// UTM values from the client: letters, digits and - _ . + only, 50 characters at most.
const tag = (v?: string) => (v ?? '').replace(/[^\w.+-]/g, '').slice(0, 50);

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
  ];
  const subscribe = (custom_fields: { name: string; value: string }[]) =>
    fetch(`https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.BEEHIIV_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        reactivate_existing: false,
        send_welcome_email: true,
        // Campaign tags from the landing URL (e.g. a Meta ad) when present, else the form placement.
        utm_source: tag(data.utm_source) || 'thelearningcurve.net',
        utm_medium: tag(data.utm_medium) || 'website',
        utm_campaign: tag(data.utm_campaign) || (data.placement ?? 'site').slice(0, 50),
        referring_site: page ? `https://thelearningcurve.net${page}` : 'https://thelearningcurve.net/',
        custom_fields,
      }),
    });

  // "What do you build?" from the kit form: only the form's own options are accepted.
  const role = ROLES.includes(data.role ?? '') ? data.role! : '';
  const extra = [
    ...(magnet ? [{ name: 'Lead magnet', value: magnet }] : []),
    ...(role ? [{ name: 'What do you build', value: role }] : []),
  ];
  let res = await subscribe([...fields, ...extra]);
  // If a custom field ("Lead magnet", "What do you build") hasn't been created in Beehiiv yet,
  // never lose the sign-up over it.
  if (!res.ok && extra.length) {
    console.log('Beehiiv error with custom fields, retrying without them', res.status, await res.text());
    res = await subscribe(fields);
  }

  if (!res.ok) {
    console.log('Beehiiv error', res.status, await res.text());
    return reply(isJson, 502, 'Something went wrong. Please try again in a minute.');
  }
  if (magnet && RESEND_MAGNETS.has(data.magnet ?? '')) {
    // Send the kit by email. Never fail the sign-up over this: the PDF is already on the page.
    if (env.RESEND_API_KEY) {
      const mail = data.magnet === 'teacher-guide' ? guideEmail(firstName) : kitEmail(firstName);
      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: env.KIT_FROM || 'The Learning Curve <hello@thelearningcurve.net>',
          to: [email],
          reply_to: 'jim@thelearningcurve.net',
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
          tags: [{ name: 'magnet', value: data.magnet! }, { name: 'placement', value: (data.placement ?? 'site').replace(/[^\w-]/g, '').slice(0, 50) || 'site' }],
        }),
      }).catch((e) => { console.log('Resend send failed', String(e)); return null; });
      if (sent && !sent.ok) console.log('Resend error', sent.status, await sent.text());
    } else {
      console.log('RESEND_API_KEY not set: kit email not sent');
    }
    return reply(isJson, 200, data.magnet === 'teacher-guide' ? 'Thanks. Your guide is ready, and a copy is on its way to your inbox.' : 'Thanks. Check your inbox for the kit.', next);
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
