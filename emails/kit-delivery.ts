// The kit delivery email, sent through Resend by functions/api/subscribe.ts when someone asks for
// The Evidence-Based Course Design Kit. Table layout and inline styles so it holds up in Gmail and
// Outlook; Fraunces loads where the client allows (Apple Mail), Georgia elsewhere. Links come from
// src/data/kit.ts. Design: the "Delivery email" artboard on the kit's Claude canvas.
import { KIT, ITEMS } from '../src/data/kit';

const SITE_URL = 'https://thelearningcurve.net';
export const KIT_EMAIL_SUBJECT = 'Your Evidence-Based Course Design Kit';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export function kitEmail(firstName: string): { subject: string; html: string; text: string } {
  const name = esc(firstName || 'there');
  const rows = ITEMS.map((i) => {
    const href = i.copy || `${SITE_URL}${KIT.pdf}`;
    return `<tr><td style="padding:11px 0;border-bottom:1px solid #e3ded4;"><strong style="font-family:Fraunces,Georgia,serif;font-weight:800;font-size:16px;margin-right:8px;">${i.n}</strong>${esc(i.title)}</td><td align="right" style="padding:11px 0;border-bottom:1px solid #e3ded4;font-size:13px;white-space:nowrap;"><a href="${href}" style="color:#1f2e4d;">${i.copy ? 'Make a copy' : 'In the PDF'} &rsaquo;</a></td></tr>`;
  }).join('\n');
  const html = `<!DOCTYPE html>
<html lang="en-AU" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Your Evidence-Based Course Design Kit</title>
<!--[if mso]><style>table,td,h1,p,a{font-family:Georgia,serif !important;}</style><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;background:#e3ded4;-webkit-text-size-adjust:100%;}
  a{color:#1f2e4d;}
  @media (max-width:620px){
    .wrap{width:100% !important;}
    .pad{padding-left:24px !important;padding-right:24px !important;}
    .h1{font-size:28px !important;}
    .btncell{display:block !important;width:100% !important;padding-right:0 !important;}
    .btn{display:block !important;width:100% !important;box-sizing:border-box;text-align:center !important;margin:0 0 10px 0 !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#e3ded4;">
<!-- Preview text -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#e3ded4;">Seven templates, eight evidence cards, and where to start.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e3ded4;">
<tr><td align="center" style="padding:24px 12px;">

<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#f7f4ee;">

  <!-- Masthead -->
  <tr><td class="pad" style="background:#f6c847;border-bottom:2px solid #16181d;padding:20px 36px;">
    <img src="${SITE_URL}/kit/tlc-wordmark-email.png" width="190" height="33" alt="The Learning Curve" style="display:block;border:0;width:190px;height:auto;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#16181d;">
  </td></tr>

  <!-- Intro -->
  <tr><td class="pad" style="padding:36px 36px 8px;">
    <p style="margin:0 0 14px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#c0391b;">Your free kit</p>
    <h1 class="h1" style="margin:0 0 18px;font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:34px;line-height:1.08;font-weight:800;letter-spacing:-0.5px;color:#16181d;">Here's your Evidence-Based Course Design Kit</h1>
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#16181d;">Hi ${name},</p>
    <p style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#16181d;">Thanks for signing up. The whole kit is below: one printable PDF, and every template as a Google Doc or Sheet you can copy into your own Drive.</p>
    <!-- Buttons -->
    <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
      <td class="btncell" style="padding:0 10px 10px 0;"><a class="btn" href="${SITE_URL}${KIT.pdf}" style="display:inline-block;background:#16181d;color:#f7f4ee;text-decoration:none;font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;line-height:20px;padding:14px 22px;border:2px solid #16181d;">Download the PDF</a></td>
      <td class="btncell" style="padding:0 0 10px 0;"><a class="btn" href="${KIT.folder}" style="display:inline-block;background:#f7f4ee;color:#16181d;text-decoration:none;font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;line-height:20px;padding:14px 22px;border:2px solid #16181d;">Open the editable templates</a></td>
    </tr></table>
  </td></tr>

  <!-- What's inside -->
  <tr><td class="pad" style="padding:20px 36px 0;">
    <p style="margin:0;padding-top:12px;border-top:2px dotted #16181d;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#16181d;">What's inside</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;color:#16181d;">
      ${rows}
    </table>
  </td></tr>

  <!-- Where to start -->
  <tr><td class="pad" style="padding:28px 36px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
      <tr><td style="padding:0;"><div style="width:64px;height:4px;background:#f6c847;font-size:0;line-height:0;">&nbsp;</div></td></tr>
      <tr><td style="padding:16px 22px 20px;">
        <p style="margin:0 0 8px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#16181d;">Not sure where to start?</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:#3a3c42;">Building something new: start with <strong style="color:#16181d;">01, the objectives builder</strong>. Improving a course you already run: start with <strong style="color:#16181d;">07, the audit</strong>, and fix the zeros first.</p>
      </td></tr>
    </table>
  </td></tr>

  <!-- Sign-off -->
  <tr><td class="pad" style="padding:28px 36px 36px;">
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#16181d;">One favour: hit reply and tell us what you're building at the moment. Every reply gets read, and they shape the templates we add next.</p>
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#16181d;">Happy course building!<br>Jim Lounsbury<br><span style="font-style:italic;color:#3a3c42;">Editor, The Learning Curve</span></p>
  </td></tr>

  <!-- Footer -->
  <tr><td class="pad" style="background:#16181d;padding:24px 36px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#cfcbc3;">
    You're getting this because you asked for the kit at <a href="https://thelearningcurve.net/kit/" style="color:#f6c847;">thelearningcurve.net</a>. You'll also get our monthly newsletter, which you can leave at any time. <a href="https://thelearningcurve.net/disclosure/#email" style="color:#f6c847;">How we handle your email</a>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>
`;
  const text = [
    `Hi ${firstName || 'there'},`,
    '',
    'Thanks for signing up. Here is The Evidence-Based Course Design Kit.',
    '',
    `Download the PDF: ${SITE_URL}${KIT.pdf}`,
    `Open the editable templates: ${KIT.folder}`,
    '',
    "What's inside (each link makes your own copy):",
    ...ITEMS.map((i) => `${i.n} ${i.title}: ${i.copy || 'in the PDF'}`),
    '',
    'Not sure where to start? Building something new: start with 01, the objectives builder. Improving a course you already run: start with 07, the audit, and fix the zeros first.',
    '',
    "One favour: hit reply and tell us what you're building at the moment. Every reply gets read, and they shape the templates we add next.",
    '',
    'Happy course building!',
    'Jim Lounsbury',
    'Editor, The Learning Curve',
    '',
    "You're getting this because you asked for the kit at thelearningcurve.net. You'll also get our monthly newsletter, which you can leave at any time.",
  ].join('\n');
  return { subject: KIT_EMAIL_SUBJECT, html, text };
}
