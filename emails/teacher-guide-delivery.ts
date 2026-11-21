// Delivery email for the career guide "From classroom to instructional design", sent through Resend
// by functions/api/subscribe.ts. Same table layout and palette as the kit email (emails/kit-delivery.ts)
// so it holds up in Gmail and Outlook. Links come from src/data/reports/classroom-to-instructional-design.ts.
import { REPORT, WORKSHEETS } from '../src/data/reports/classroom-to-instructional-design';

const SITE_URL = 'https://thelearningcurve.net';
export const GUIDE_EMAIL_SUBJECT = 'Your guide: From classroom to instructional design';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const READ_NEXT = [
  { title: 'Instructional design jobs for former teachers', href: `${SITE_URL}/guides/instructional-design-jobs-for-former-teachers/` },
  { title: 'Instructional design portfolio examples', href: `${SITE_URL}/guides/instructional-design-portfolio-examples/` },
  { title: 'The ADDIE model, explained', href: `${SITE_URL}/guides/addie-model/` },
];

export function guideEmail(firstName: string): { subject: string; html: string; text: string } {
  const name = esc(firstName || 'there');
  const pdf = `${SITE_URL}${REPORT.pdf}`;
  const sheets = WORKSHEETS.map((w) => `<tr><td style="padding:11px 0;border-bottom:1px solid #e3ded4;"><strong style="font-family:Fraunces,Georgia,serif;font-weight:800;font-size:16px;margin-right:8px;">0${w.n}</strong>${esc(w.title)}</td><td align="right" style="padding:11px 0;border-bottom:1px solid #e3ded4;font-size:13px;color:#3a3c42;">${esc(w.note)}</td></tr>`).join('\n');
  const reads = READ_NEXT.map((r) => `<li style="margin:0 0 6px;"><a href="${r.href}" style="color:#1f2e4d;">${esc(r.title)}</a></li>`).join('');
  const html = `<!DOCTYPE html>
<html lang="en-AU" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${GUIDE_EMAIL_SUBJECT}</title>
<!--[if mso]><style>table,td,h1,p,a{font-family:Georgia,serif !important;}</style><![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,800&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body{margin:0;padding:0;background:#e3ded4;-webkit-text-size-adjust:100%;}
  a{color:#1f2e4d;}
  @media (max-width:620px){
    .wrap{width:100% !important;}
    .pad{padding-left:24px !important;padding-right:24px !important;}
    .h1{font-size:28px !important;}
    .btn{display:block !important;width:100% !important;box-sizing:border-box;text-align:center !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background:#e3ded4;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#e3ded4;">What employers ask for, what already transfers, and a six-step plan.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#e3ded4;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" class="wrap" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#f7f4ee;">

  <tr><td class="pad" style="background:#f6c847;border-bottom:2px solid #16181d;padding:20px 36px;">
    <img src="${SITE_URL}/kit/tlc-wordmark-email.png" width="190" height="33" alt="The Learning Curve" style="display:block;border:0;width:190px;height:auto;font-family:Georgia,serif;font-size:22px;font-weight:bold;color:#16181d;">
  </td></tr>

  <tr><td class="pad" style="padding:36px 36px 8px;">
    <p style="margin:0 0 14px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#c0391b;">Your free career guide</p>
    <h1 class="h1" style="margin:0 0 18px;font-family:Fraunces,Georgia,'Times New Roman',serif;font-size:34px;line-height:1.08;font-weight:800;letter-spacing:-0.5px;color:#16181d;">From classroom to instructional design</h1>
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#16181d;">Hi ${name},</p>
    <p style="margin:0 0 22px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#16181d;">Thanks for signing up. Here's your copy: ${REPORT.pages} pages on what employers actually ask for, what already transfers from your classroom, and a plan to close the gaps.</p>
    <a class="btn" href="${pdf}" style="display:inline-block;background:#16181d;color:#f7f4ee;text-decoration:none;font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700;line-height:20px;padding:14px 22px;border:2px solid #16181d;">Download the guide (PDF)</a>
  </td></tr>

  <tr><td class="pad" style="padding:28px 36px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;">
      <tr><td style="padding:0;"><div style="width:64px;height:4px;background:#f6c847;font-size:0;line-height:0;">&nbsp;</div></td></tr>
      <tr><td style="padding:16px 22px 20px;">
        <p style="margin:0 0 8px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#16181d;">Do this first</p>
        <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:#3a3c42;">Open twenty job ads in the sector you want, copy every duty and tool into <strong style="color:#16181d;">worksheet 2</strong> (page 17), and mark each one you could already show evidence for. The unmarked items are your plan.</p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td class="pad" style="padding:24px 36px 0;">
    <p style="margin:0;padding-top:12px;border-top:2px dotted #16181d;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#16181d;">Three worksheets to print</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;color:#16181d;">
      ${sheets}
    </table>
  </td></tr>

  <tr><td class="pad" style="padding:24px 36px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.55;color:#16181d;">
    <p style="margin:0 0 8px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;">Read next</p>
    <ul style="margin:0;padding-left:20px;">${reads}</ul>
  </td></tr>

  <tr><td class="pad" style="padding:28px 36px 36px;">
    <p style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#16181d;">One favour: hit reply and tell us where you are in the move: still teaching and exploring, applying now, or already out of the classroom. Every reply gets read, and they shape what we write next.</p>
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6;color:#16181d;">Good luck with the switch.<br>Jim Lounsbury<br><span style="font-style:italic;color:#3a3c42;">Editor, The Learning Curve</span></p>
  </td></tr>

  <tr><td class="pad" style="background:#16181d;padding:24px 36px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#cfcbc3;">
    You're getting this because you asked for the guide at <a href="${SITE_URL}/reports/${REPORT.slug}/" style="color:#f6c847;">thelearningcurve.net</a>. You'll also get our monthly newsletter, which you can leave at any time. <a href="${SITE_URL}/disclosure/#email" style="color:#f6c847;">How we handle your email</a>
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
    `Thanks for signing up. Here's your copy of From classroom to instructional design (${REPORT.pages} pages).`,
    '',
    `Download the guide: ${pdf}`,
    '',
    'Do this first: open twenty job ads in the sector you want, copy every duty and tool into worksheet 2 (page 17), and mark each one you could already show evidence for. The unmarked items are your plan.',
    '',
    'Three worksheets to print:',
    ...WORKSHEETS.map((w) => `0${w.n} ${w.title}: ${w.note}`),
    '',
    'Read next:',
    ...READ_NEXT.map((r) => `${r.title}: ${r.href}`),
    '',
    'One favour: hit reply and tell us where you are in the move: still teaching and exploring, applying now, or already out of the classroom. Every reply gets read.',
    '',
    'Good luck with the switch.',
    'Jim Lounsbury',
    'Editor, The Learning Curve',
    '',
    "You're getting this because you asked for the guide at thelearningcurve.net. You'll also get our monthly newsletter, which you can leave at any time.",
  ].join('\n');
  return { subject: GUIDE_EMAIL_SUBJECT, html, text };
}
