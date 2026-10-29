// One place for the settings Jim may need to change.
export const SITE = {
  name: 'The Learning Curve',
  url: 'https://thelearningcurve.net',
  tagline: 'Research, practice and reviews for people who build courses',
  description:
    'An independent publication on how to design online courses that work: the research on how people learn, practical course design, and honest platform reviews.',
  author: {
    name: 'Jim Lounsbury',
    url: '/about/',
  },
  timezone: 'Australia/Sydney',
  // Newsletter provider. Leave null until Jim chooses one; the form then shows "Coming soon".
  // Example: { provider: 'beehiiv', action: 'https://embeds.beehiiv.com/...' }
  newsletter: null as null | { provider: string; action: string },
  // Cloudflare Web Analytics token (cookieless). Leave null to disable.
  analyticsToken: null as null | string,
};

export const SECTIONS = {
  library: { label: 'Library', blurb: 'One evergreen page per learning principle: what the research says, how to apply it, and how the platforms support it.' },
  guides: { label: 'Guides', blurb: 'Practical course design and instructional design, grounded in the evidence.' },
  reviews: { label: 'Reviews', blurb: 'Course platforms judged on how well they help people learn, using one published method.' },
  trends: { label: 'Trends', blurb: 'Dated news on where online education is going, and what it means for people who build courses.' },
} as const;

export type SectionKey = keyof typeof SECTIONS;
