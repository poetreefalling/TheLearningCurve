// Helpers for the Discover pages: which directory records are live, and how each field reads.
// Rules: docs/directory.md. A field we couldn't find or verify reads "Research ongoing".
import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_UNPUBLISHED } from './articles';

export type Product = CollectionEntry<'products'>;
export type Vendor = CollectionEntry<'vendors'>;

export const RESEARCH_ONGOING = 'Research ongoing';

export const productUrl = (id: string) => `/discover/${id}/`;
export const categoryUrl = (id: string) => `/discover/${id}/`;

const live = <T extends { data: { draft: boolean } }>(e: T) => SHOW_UNPUBLISHED || !e.data.draft;

export async function getProducts(category?: string) {
  const all = (await getCollection('products')).filter(live);
  return all
    .filter((p) => !category || p.data.category.id === category || p.data.secondaryCategories.some((c) => c.id === category))
    .sort((a, b) => a.data.name.localeCompare(b.data.name, 'en', { sensitivity: 'base' }));
}

export async function getVendorMap() {
  return new Map((await getCollection('vendors')).map((v) => [v.id, v]));
}

export const MARKETS: Record<string, string> = {
  'higher-education': 'Higher education', schools: 'Schools', vet: 'VET', corporate: 'Corporate',
  government: 'Government', creators: 'Creators', nonprofit: 'Non-profit',
};
export const BASIS: Record<string, string> = {
  'per-seat': 'Per seat', 'per-active-user': 'Per active user', 'per-learner': 'Per learner', flat: 'Flat fee',
  usage: 'Usage-based', quote: 'Quote only', free: 'Free', 'open-source': 'Open source',
};
export const DEPLOYMENT: Record<string, string> = { cloud: 'Cloud', 'self-hosted': 'Self-hosted', hybrid: 'Hybrid' };
export const STANDARDS: Record<string, string> = {
  'lti-1.1': 'LTI 1.1', 'lti-1.3': 'LTI 1.3', 'lti-advantage': 'LTI Advantage', 'scorm-1.2': 'SCORM 1.2',
  'scorm-2004': 'SCORM 2004', xapi: 'xAPI', cmi5: 'cmi5', aicc: 'AICC', qti: 'QTI', caliper: 'Caliper',
  oneroster: 'OneRoster', 'open-badges-2': 'Open Badges 2', 'open-badges-3': 'Open Badges 3', clr: 'CLR',
};
export const OWNERSHIP: Record<string, string> = {
  independent: 'Independent', 'venture-backed': 'Venture-backed', 'private-equity': 'Private-equity owned',
  public: 'Publicly listed', subsidiary: 'Part of a larger group', 'open-source': 'Open-source foundation', other: '',
};
export const TRAINS: Record<string, string> = {
  no: 'No', yes: 'Yes', 'opt-out': 'Yes, unless the customer opts out', 'opt-in': 'Only if the customer opts in',
};
export const ORIGIN: Record<string, string> = { verified: 'Verified', 'vendor-supplied': 'Vendor-supplied', estimated: 'Estimated' };
/** Evidence & Assurance levels (docs/directory.md; explained to readers at /evidence-and-assurance/). */
export type EvidenceLevel = 'research-ongoing' | 'vendor-disclosed' | 'vendor-confirmed' | 'independently-corroborated' | 'independently-assured';
export const LEVELS: Record<EvidenceLevel, { n: number; label: string; meaning: string }> = {
  'research-ongoing': { n: 0, label: RESEARCH_ONGOING, meaning: 'Not yet established. We are looking, usually by asking the company.' },
  'vendor-disclosed': { n: 1, label: 'Vendor disclosed', meaning: 'Information published by the vendor.' },
  'vendor-confirmed': { n: 2, label: 'Vendor confirmed', meaning: 'Information confirmed directly by the vendor.' },
  'independently-corroborated': { n: 3, label: 'Independently corroborated', meaning: 'Claims supported by independent evidence.' },
  'independently-assured': { n: 4, label: 'Independently assured', meaning: 'Relevant controls supported by current third-party assurance or technical assessment.' },
};
export const LEVEL_ORDER = Object.keys(LEVELS) as EvidenceLevel[];
export const EVIDENCE_URL = '/evidence-and-assurance/';

/** The four AI comparison criteria, in the order they appear everywhere. */
export const AI_AREAS = [
  { key: 'dataPrivacy', title: 'Data privacy', short: 'Data privacy', blurb: 'Whether learner and staff data trains AI models, how long it is kept and who processes it.' },
  { key: 'learnerOversight', title: 'Learner oversight', short: 'Oversight', blurb: 'Minimum learner age, and what staff can review, limit and see.' },
  { key: 'pedagogy', title: 'Pedagogical approach', short: 'Pedagogy', blurb: 'Whether it coaches or simply answers, works from your own content and shows its sources.' },
  { key: 'outputOwnership', title: 'Output ownership', short: 'Ownership', blurb: 'Who owns the courses, questions, feedback and other material the AI produces.' },
] as const;
export type AiAreaKey = (typeof AI_AREAS)[number]['key'];
type Answer = { question: string; value?: string; level: EvidenceLevel; conflict?: boolean };
/** How many answers in an area are established, and the strongest level among them. */
export function areaSummary(answers: Answer[]) {
  const done = answers.filter((a) => a.level !== 'research-ongoing');
  const top = done.reduce<EvidenceLevel>((t, a) => (LEVELS[a.level].n > LEVELS[t].n ? a.level : t), 'research-ongoing');
  return { answered: done.length, total: answers.length, top, conflict: answers.some((a) => a.conflict) };
}

/** The workbook's gap names, grouped by the field they belong to on the profile. */
const GAP_FIELDS: Record<string, string> = {
  primaryMarket: 'markets', 'pricing basis': 'pricing', 'price from': 'priceFrom', 'free tier': 'freeTier', trial: 'trial',
  deployment: 'deployment', standards: 'standards', 'accessibility standard': 'accessibility', security: 'security',
  'data residency': 'residency', 'geographic availability': 'availability', 'AI models': 'aiModels',
  'AI trains on customer data': 'aiTraining', headquarters: 'headquarters', founded: 'founded', size: 'size',
  funding: 'funding', ownership: 'ownership',
};
export const gapsOf = (e: { data: { dataGaps?: { field: string }[] } }) =>
  new Set((e.data.dataGaps ?? []).map((g) => GAP_FIELDS[g.field] ?? g.field));

export const fmtDate = (d?: Date) =>
  d ? d.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Australia/Sydney' }) : '';

export const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};
