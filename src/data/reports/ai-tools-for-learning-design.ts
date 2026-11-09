// The 25 AI Tools for Learning Design field guide (November 2026): the facts its landing page
// draws on, copied from the guide itself (pages 4–6 and 37). Tool ids are Discover profiles.
export const REPORT = {
  slug: 'ai-tools-for-learning-design',
  title: '25 AI tools for learning design, and how to use them well',
  pdf: '/reports/ai-tools-for-learning-design/tlc-25-ai-tools-for-learning-design.pdf',
  pages: 41,
  researched: '9 November 2026',
  magnet: 'ai-report',
  homeCard: true, // feature card in the home page's first row of stories (src/pages/index.astro)
};

export type Tool = { n: number; name: string; id: string };
export const TOOLS: Tool[] = [
  { n: 1, name: 'ChatGPT', id: 'chatgpt' }, { n: 2, name: 'Gemini', id: 'gemini-for-education' },
  { n: 3, name: 'Copilot', id: 'microsoft-copilot' }, { n: 4, name: 'Claude', id: 'claude' },
  { n: 5, name: 'NotebookLM', id: 'notebooklm' }, { n: 6, name: 'Khanmigo', id: 'khanmigo' },
  { n: 7, name: 'MagicSchool', id: 'magicschool-ai' }, { n: 8, name: 'SchoolAI', id: 'schoolai' },
  { n: 9, name: 'Brisk Teaching', id: 'brisk-teaching' }, { n: 10, name: 'Diffit', id: 'diffit' },
  { n: 11, name: 'Curipod', id: 'curipod' }, { n: 12, name: 'Quizlet', id: 'quizlet' },
  { n: 13, name: 'Wayground', id: 'wayground' }, { n: 14, name: 'Kahoot!', id: 'kahoot' },
  { n: 15, name: 'Grammarly', id: 'grammarly' }, { n: 16, name: 'Perplexity', id: 'perplexity' },
  { n: 17, name: 'Gradescope', id: 'gradescope' }, { n: 18, name: 'Turnitin', id: 'turnitin' },
  { n: 19, name: 'Duolingo Max', id: 'duolingo-max' }, { n: 20, name: 'Photomath', id: 'photomath' },
  { n: 21, name: 'Coursebox', id: 'coursebox' }, { n: 22, name: 'Mindsmith', id: 'mindsmith' },
  { n: 23, name: 'Articulate 360 AI', id: 'articulate-360-ai' }, { n: 24, name: 'Synthesia', id: 'synthesia' },
  { n: 25, name: 'Docebo AI', id: 'docebo' },
];

// Page 4: 25 tools across eight jobs (the guide's editorial grouping; not a ranking).
export const JOBS = [
  { key: 'assistants', name: 'General assistants', note: 'Briefs, outlines, scenarios, critique.', tools: [1, 2, 3, 4] },
  { key: 'research', name: 'Research & sources', note: 'Build and question a source pack.', tools: [5, 16] },
  { key: 'tutoring', name: 'Tutoring & practice', note: 'Questions and hints instead of answers.', tools: [6, 8, 19, 20] },
  { key: 'toolkits', name: 'Teacher toolkits', note: 'Planning, differentiation, adaptation.', tools: [7, 9, 10] },
  { key: 'engage', name: 'Engagement & quizzing', note: 'Participation and retrieval practice.', tools: [11, 12, 13, 14] },
  { key: 'assess', name: 'Assessment & integrity', note: 'Marking, feedback and integrity.', tools: [17, 18, 15] },
  { key: 'authoring', name: 'Course authoring', note: 'From source document to draft course.', tools: [21, 22, 23] },
  { key: 'media', name: 'Media & platforms', note: 'Video, and AI in the learning stack.', tools: [24, 25] },
];

// Page 5: tools recommended as a "best starting tool" for each role.
export const ROLES = [
  { key: 'designer', name: 'Learning designer', job: 'Turn expertise into structured, engaging learning.', tools: [1, 4, 5, 24, 22, 23] },
  { key: 'ld', name: 'L&D manager', job: 'Build capability and make learning operations scale.', tools: [1, 24, 21, 3, 25] },
  { key: 'educator', name: 'Educator', job: 'More responsive teaching, more active learning.', tools: [5, 7, 9, 10, 8, 6, 11, 14, 13] },
  { key: 'academic', name: 'Academic & course leader', job: 'Protect quality while improving course development.', tools: [1, 4, 5, 17, 18] },
  { key: 'entrepreneur', name: 'Learning entrepreneur', job: 'Turn specialist knowledge into a learning product.', tools: [1, 4, 24, 22, 23, 21, 16] },
];

// Page 6: the operating model.
export const METHOD = [
  { step: 'Define', q: 'What performance or learning problem are we solving?', ai: 'Summarise stakeholder notes; draft problem statements to choose from.', you: 'The problem, the audience and what success looks like.' },
  { step: 'Ground', q: 'What approved evidence, standards and context should the AI use?', ai: 'Organise a source pack; extract concepts, gaps and contradictions.', you: 'Which sources count, and SME sign-off on them.' },
  { step: 'Generate', q: 'What draft, analysis or prototype will speed up the work?', ai: 'Outlines, scenarios, items, scripts and first-draft media.', you: 'The brief, the constraints and the design architecture.' },
  { step: 'Judge', q: 'What needs human review for accuracy, pedagogy, accessibility and risk?', ai: 'Critique a draft against a rubric; flag missing practice.', you: 'The call on quality. Nothing ships unreviewed.' },
  { step: 'Measure', q: 'What evidence will tell us whether the learning worked?', ai: 'Summarise response data and surface patterns.', you: 'What counts as evidence of capability.' },
];
export const STAKES = ['Drafting a practice question', 'Writing feedback on learner work', 'Grading a student', 'Advising on safety, or handling sensitive learner data'];

// Page 37: the buying checklist (one question shown per group; 15 in the guide).
export const CHECKLIST = [
  { group: 'Learning value', q: 'Can you show better quality, access, practice or feedback, not just faster production?' },
  { group: 'Data & privacy', q: 'Is your data used for training or evaluation, by default or opt-in?' },
  { group: 'Control & assurance', q: 'Can staff review outputs, set limits and see learner interactions?' },
  { group: 'Integration & ownership', q: 'Who owns inputs, outputs and course assets?' },
  { group: 'Evidence & pilot', q: 'Run the same brief, source pack and learner task across tools.' },
];

// Page 8: one real profile excerpt, to show what's inside.
export const SAMPLE = {
  tool: 'ChatGPT',
  prompt: 'Create a 6-module learning design for [audience] on [topic]. Start with a performance problem, identify observable behaviours, write measurable outcomes, map practice and assessment to each outcome, and flag assumptions that need SME confirmation.',
  why: 'It starts from performance, not content, and asks the model to show its assumptions so you can check them.',
  watch: 'Fluent, fast and good at synthesis, but it can produce plausible errors and generic examples with full confidence.',
};
