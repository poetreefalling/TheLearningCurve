// "From classroom to instructional design" career guide (November 2026): the facts its landing page
// draws on, copied from the guide itself. Page numbers are the guide's own. Every figure is the
// guide's, from the study it cites (Wang et al., 2021; Weber et al., 2024; Peck, 2023).
export const REPORT = {
  slug: 'classroom-to-instructional-design',
  title: 'From classroom to instructional design',
  pdf: '/reports/classroom-to-instructional-design/tlc-from-classroom-to-instructional-design.pdf',
  pages: 20,
  worksheets: 3,
  researched: 'November 2026',
  magnet: 'teacher-guide',
  event: 'Career guide signup',
};

export const SOURCES = {
  wang: { label: 'Wang et al., 2021', url: 'https://doi.org/10.1111/ijtd.12209' },
  weber: { label: 'Weber et al., 2024', url: 'https://doi.org/10.30935/cedtech/14606' },
  peck: { label: 'Peck, 2023', url: 'https://www.devlinpeck.com/content/id-hiring-manager-report' },
};

// Page 6: "Say it in their language". Teacher duty → design term → what to show.
export const TRANSLATE = [
  { did: 'Planned units and sequences of lessons', term: 'Course mapping and sequencing', show: 'A course map for one unit, rebuilt for adult learners' },
  { did: 'Wrote learning intentions and success criteria', term: 'Measurable learning objectives', show: 'Five objectives, each with the task that tests it' },
  { did: 'Designed tests, tasks and rubrics', term: 'Assessment design', show: 'One assessment and its rubric, with a sample answer' },
  { did: 'Differentiated for a mixed class', term: 'Learner analysis', show: 'A one-page learner brief' },
  { did: 'Gave written and verbal feedback', term: 'Feedback design', show: 'Quiz feedback that explains each wrong answer' },
  { did: "Changed a lesson when it wasn't working", term: 'Formative evaluation and iteration', show: 'A short revision log from a pilot' },
  { did: 'Worked with colleagues on a shared program', term: 'Stakeholder collaboration', show: 'A brief you agreed with someone else, and what changed after their review' },
  { did: 'Ran a faculty or year-level project to a deadline', term: 'Project management', show: 'A timeline with milestones, owners and a sign-off point' },
];

// Page 8: the four gaps.
export const GAPS = [
  { title: "Working through someone else's expertise", body: "A subject matter expert owns the content and someone else runs the course. Consulting experts was named in 57 per cent of job ads." },
  { title: 'Projects with deadlines, budgets and sign-off', body: 'Project management appeared in 30 per cent of ads. A school term has a rhythm; a design project has stakeholders who change their minds.' },
  { title: 'Authoring and media tools', body: "Authoring software appeared in roughly a third of ads. You don't need all of them. You need one well enough to build a sample." },
  { title: 'Explaining your decisions', body: "Teachers make good design decisions by instinct. Designers are asked to defend them to people who don't share that instinct." },
];

// Pages 9–10: the six-step plan, with the guide's worked example (an invented secondary science teacher).
export const STEPS = [
  { step: 'Choose a sector before you build anything', eg: 'Corporate ads in her city keep naming compliance training, SME interviews and one authoring tool, so that is what she builds towards.' },
  { step: "Rewrite your CV in the employer's language", eg: '"Taught Year 10 chemistry" becomes "Redesigned a ten-week chemistry unit around weekly low-stakes quizzes and a practical assessment with a published rubric."' },
  { step: 'Build one portfolio piece that shows your whole process', eg: 'A short module on laboratory chemical safety for new staff at a research facility: close to her expertise, but aimed at adults at work.' },
  { step: 'Learn one authoring tool well enough to build your sample', eg: 'The one that recurs in the twenty ads she read, learned by building her portfolio piece in it.' },
  { step: 'Get real experience working with a subject expert', eg: 'A small project where someone else owns the content, run with a brief, a review round and sign-off.' },
  { step: 'Apply where your background counts most', eg: 'Education-focused companies, university learning design teams and training roles close to her subject.' },
];

// Pages 13, 17 and 18.
export const WORKSHEETS = [
  { n: 1, title: 'Your portfolio project brief', note: 'Fill it in before you build anything.' },
  { n: 2, title: 'The twenty-ad audit', note: 'Tally what employers in your sector actually ask for.' },
  { n: 3, title: 'Translate your own experience', note: 'Six things you designed, renamed and evidenced.' },
];

// Page 16: two of the five mistakes, as a teaser.
export const MISTAKES = [
  { title: 'Leading with years of teaching', body: 'Employers read "twelve years in the classroom" as delivery experience. Lead with what you designed.' },
  { title: 'Building a portfolio of school lessons', body: 'A Year 7 lesson reminds hiring managers of the gap. Build for adults at work, even if the topic is close to your subject.' },
];
