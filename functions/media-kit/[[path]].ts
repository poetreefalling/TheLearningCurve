// Cloudflare Pages Function: GET /media-kit/*
// Serves the media kit PDF (public/media-kit/) only with a valid download link from /api/enquiry:
// ?t=<expiry>.<signature>, signed with MEDIA_KIT_SECRET (or RESEND_API_KEY). Without one, the
// visitor is sent to the "Request the media kit" form instead. Setup: docs/ads.md.

interface Env {
  ASSETS: { fetch(req: Request): Promise<Response> };
  MEDIA_KIT_SECRET?: string;
  RESEND_API_KEY?: string;
}

async function valid(t: string | null, secret: string): Promise<boolean> {
  if (!t) return false;
  const [exp, sig] = t.split('.');
  if (!exp || !sig || !/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`kit:${exp}`)));
  const expect = btoa(String.fromCharCode(...mac)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (expect.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expect.length; i++) diff |= expect.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const url = new URL(request.url);
  const secret = env.MEDIA_KIT_SECRET || env.RESEND_API_KEY;
  if (secret && !(await valid(url.searchParams.get('t'), secret))) {
    return Response.redirect(new URL('/advertising/#media-kit', url).toString(), 302);
  }
  const res = await env.ASSETS.fetch(new Request(new URL(url.pathname, url), request));
  const out = new Response(res.body, res);
  out.headers.set('X-Robots-Tag', 'noindex, nofollow');
  out.headers.set('Cache-Control', 'private, no-store');
  out.headers.set('Content-Disposition', 'attachment; filename="The-Learning-Curve-Media-Kit.pdf"');
  return out;
};
