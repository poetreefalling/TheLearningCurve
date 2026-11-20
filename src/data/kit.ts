// The Evidence-Based Course Design Kit (November 2026): the free lead magnet behind /kit/.
// The PDF is the printable kit (designed on the Claude canvas, exported, landscape pages turned
// upright). Each template is also a Google Doc or Sheet in Jim's Drive folder, shared as
// "Anyone with the link can view"; the /copy links take readers straight to File › Make a copy.
// The delivery email (emails/kit-delivery.ts, sent through Resend by functions/api/subscribe.ts)
// draws its links from here, so a changed link is changed in one place.
export const KIT = {
  slug: 'kit',
  title: 'The Evidence-Based Course Design Kit',
  magnet: 'course-design-kit',
  pdf: '/kit/tlc-evidence-based-course-design-kit.pdf',
  pages: 11,
  folder: 'https://drive.google.com/drive/folders/1ZM49VcB7tUBBlFtRfJRStLgUEkQ2h9tw',
  howTo: 'https://docs.google.com/document/d/1w573pVxzT2cxWa6lC6A-3c99ICaEu8UO5IFIIBeN_Ho/copy',
};

export type KitItem = { n: string; kind: string; title: string; body: string; basis: string; format: string; copy: string };
export const ITEMS: KitItem[] = [
  { n: '01', kind: 'Template', title: 'Learning objectives builder', format: 'Google Doc',
    body: 'Turn a vague goal into objectives a learner can meet and you can assess, with verbs matched to the level of thinking you want.',
    basis: 'writing learning objectives, Bloom’s taxonomy',
    copy: 'https://docs.google.com/document/d/1-pa4qHPcYsNtrZ_SATHcFPjnAdXQOy-BhZ8Sn6egEsw/copy' },
  { n: '02', kind: 'Template', title: 'Retrieval Practice Kit', format: 'Google Sheet',
    body: 'Plan where every key idea gets recalled again, so nothing important is tested once and forgotten.',
    basis: 'retrieval practice and spacing',
    copy: 'https://docs.google.com/spreadsheets/d/1oWFqwqWHuKSN3LdzaiuNnRaNNl2EfSqe_XigB1wo73Q/copy' },
  { n: '03', kind: 'Template', title: 'Lesson storyboard', format: 'Google Doc',
    body: 'Sketch each lesson screen by screen: the objective, what’s shown, what’s said, and the check at the end.',
    basis: 'cognitive load, dual coding',
    copy: 'https://docs.google.com/document/d/1oz-SOdQNn3TUYkh2_p2LMB4nt0LLw7oiBCXgs40Sk4s/copy' },
  { n: '04', kind: 'Template', title: 'Script sheet', format: 'Google Doc',
    body: 'Write narration that sounds like a person talking, timed against what’s on screen.',
    basis: 'dual coding, the redundancy effect',
    copy: 'https://docs.google.com/document/d/1MCAH7of5XQvv9NyG7T4b5Vdaa4r6c4HL7_y3-77IfK8/copy' },
  { n: '05', kind: 'Template', title: 'Quiz question bank', format: 'Google Sheet',
    body: 'Write multiple-choice questions with plausible distractors and feedback that teaches, one row per question.',
    basis: 'effective feedback, formative assessment',
    copy: 'https://docs.google.com/spreadsheets/d/1zWP19NDk6xoVRdVOQV9sHnJa2WyZsHipV97oeEjvM94/copy' },
  { n: '06', kind: 'Template', title: 'Mixed-audience planner', format: 'Google Doc',
    body: 'Decide where beginners get worked examples and where experienced learners can skip ahead.',
    basis: 'the expertise reversal effect',
    copy: 'https://docs.google.com/document/d/1ryELmf0UDPgC34uqzgtOXtH5lUTrsZ-5JCsmi_mv5Xg/copy' },
  { n: '07', kind: 'Audit', title: 'Course design audit', format: 'Google Sheet',
    body: 'Score a course you’ve already built against 24 evidence-based checks, and see where to fix first.',
    basis: 'the whole research library',
    copy: 'https://docs.google.com/spreadsheets/d/1zDh4KNF0HIXfBTfqmclAqseCOhdXlUbkXYOygsEI89k/copy' },
  { n: '08', kind: 'Cards', title: 'Eight evidence cards', format: 'PDF',
    body: 'One printable page per principle: what it is, how strong the evidence is, and what to do on Monday.',
    basis: 'our library entries and the studies they cite',
    copy: '' },
];

// "What do you build?" on the sign-up form. Stored in Beehiiv as the custom field "What do you build"
// once Jim creates it; until then the sign-up goes through without it.
export const ROLES = [
  'Self-paced courses I sell',
  'Workplace training',
  'University, TAFE or school courses',
  "I'm moving into instructional design",
  'Something else',
];

export const FAQS = [
  { q: 'Is it really free?', a: 'Yes. You give us your name and email, and we send the kit. You’ll also get our monthly newsletter, which you can leave with one click.' },
  { q: 'What format are the templates?', a: 'Each one is a Google Doc or Sheet you copy into your own Drive, and the whole kit also comes as one printable PDF. Copies open in Word and Excel too.' },
  { q: 'Do I need to know the research first?', a: 'No. Each template explains what it’s built on in a line or two and links to the library entry if you want the detail.' },
  { q: 'Does it work with my course platform?', a: 'Yes. The kit is for planning and writing, so it works whatever you build in: an LMS, a course platform or an authoring tool.' },
];
