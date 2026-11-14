// One place for the settings Jim may need to change.
export const SITE = {
  name: 'The Learning Curve',
  url: 'https://thelearningcurve.net',
  tagline: 'Research, practice and reviews for people who build courses',
  // The line under the wordmark in the masthead
  motto: 'Intelligence for the people shaping the future of learning.',
  description:
    'An independent publication on how to design online courses that work: the research on how people learn, practical course design, and honest platform reviews.',
  author: {
    name: 'Jim Lounsbury',
    url: '/about/',
  },
  timezone: 'Australia/Sydney',
  // Newsletter: Beehiiv, via the /api/subscribe function (functions/api/subscribe.ts).
  // Set to null to switch every sign-up form back to "Coming soon".
  newsletter: { provider: 'beehiiv' } as null | { provider: string },
  // Cloudflare Web Analytics token (cookieless). Leave null to disable.
  analyticsToken: null as null | string,
  // /submit: where platform submissions are emailed, and the reply promise shown on the page.
  // Storage and email setup: docs/submissions.md.
  submissions: { notifyEmail: 'jim@thelearningcurve.net', replyDays: 3 },
  // /advertising: the public advertising page and policy. Media kit requests post to /api/enquiry.
  // `policyUpdated` is the "last changed" date shown on the page: change it whenever the policy does.
  advertising: { email: 'advertising@thelearningcurve.net', policyUpdated: '2026-11-14' },
};

// The main navigation (v2). Each entry is a hub page; the article sections below sit inside them,
// so `current` on a section page lights up its hub. Intelligence is the members' area.
export const NAV = [
  { key: 'discover', href: '/discover/', label: 'Discover', note: 'Find learning technologies, platforms and vendors', sections: [] },
  { key: 'compare', href: '/compare/', label: 'Compare', note: 'Evaluate products side by side, with our reviews', sections: ['reviews'] },
  { key: 'insights', href: '/insights/', label: 'Insights', note: 'News, trends and editorial', sections: ['trends'] },
  { key: 'resources', href: '/resources/', label: 'Resources', note: 'Guides, frameworks, templates and the Library', sections: ['library', 'guides'] },
  { key: 'intelligence', href: '/intelligence/', label: 'Intelligence', note: 'Market research, industry reports and analysis', sections: [], members: true },
] as const;

/** The nav key to highlight for a page's `current` (a hub key, or an article section). */
export function navKeyFor(current?: string): string | undefined {
  if (!current) return undefined;
  const hit = NAV.find((n) => n.key === current || (n.sections as readonly string[]).includes(current));
  return hit?.key;
}

export const SECTIONS = {
  library: { label: 'Library', blurb: 'One evergreen page per learning principle: what the research says, how to apply it, and how the platforms support it.' },
  guides: { label: 'Guides', blurb: 'Practical course design and instructional design, grounded in the evidence.' },
  reviews: { label: 'Reviews', blurb: 'Course platforms judged on how well they help people learn, using one published method.' },
  trends: { label: 'Trends', blurb: 'Dated news on where online education is going, and what it means for people who build courses.' },
} as const;

export type SectionKey = keyof typeof SECTIONS;
