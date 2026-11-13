import { defineCollection, reference, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

// The schema is the source of truth. A build fails if an article is incomplete.

const platforms = defineCollection({
  loader: file('src/data/platforms.json'),
  schema: z.object({
    name: z.string(),
    url: z.string().url(),
    // Jim sets this once a program approves him. The drafting routine never does.
    affiliateUrl: z.string().url().nullable().default(null),
    programNotes: z.string().optional(),
  }),
});

const charts = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/charts' }),
  schema: z.object({
    // The title states the finding, with its number
    title: z.string(),
    subtitle: z.string().optional(),
    type: z.enum(['bar', 'groupedBar', 'line', 'dotRange']),
    unit: z.string(), // e.g. "% correct on final test"
    // Which series name or label the title is about; drawn in the accent colour
    highlight: z.string().optional(),
    // bar: [{label, value}]; groupedBar/line: [{label, values: {seriesName: number}}];
    // dotRange: [{label, value, low, high}]
    series: z.array(
      z.object({
        label: z.string(),
        value: z.number().optional(),
        values: z.record(z.number()).optional(),
        low: z.number().optional(),
        high: z.number().optional(),
      }),
    ).min(1),
    yMax: z.number().optional(),
    source: z.object({
      authors: z.string(),
      year: z.number(),
      doi: z.string().optional(),
      url: z.string().url().optional(),
      figureOrTable: z.string(), // "Figure 2" or "Table 1"
    }),
  }),
});

// Interactive data-story charts (src/data/stories/<id>.json), drawn in the browser by
// src/scripts/datastory.ts and animated by <Scrolly> steps or on scroll. Numbers only from the
// cited source's own tables or figures, like the static charts.
const storyView = z.object({
  upTo: z.number().int().min(0).optional(), // reveal categories 0..upTo
  highlight: z.array(z.string()).optional(), // series ids at full strength; others fade
  focus: z.array(z.number().int().min(0)).optional(), // category indexes to emphasise (bars)
  annotations: z.array(z.object({ at: z.number().int().min(0), series: z.string().optional(), text: z.string().max(60) })).default([]),
});
const stories = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/stories' }),
  schema: z
    .object({
      title: z.string().max(120), // states the finding
      subtitle: z.string().max(160),
      type: z.enum(['line', 'column', 'bar', 'groupedBar']),
      format: z.enum(['percent', 'number', 'compact', 'usd', 'usd-billions', 'millions', 'sd']),
      yMax: z.number().optional(),
      categories: z.array(z.string()).min(1),
      series: z.array(z.object({
        id: z.string(),
        label: z.string(),
        values: z.array(z.number().nullable()),
        estimate: z.array(z.boolean()).optional(),
      })).min(1).max(3),
      views: z.record(storyView).default({}),
      notes: z.array(z.string()).default([]),
      sources: z.array(z.object({ label: z.string(), url: z.string().url(), figureOrTable: z.string() })).min(1),
    })
    .superRefine((c, ctx) => {
      c.series.forEach((s, i) => {
        if (s.values.length !== c.categories.length)
          ctx.addIssue({ code: 'custom', message: `series[${i}] has ${s.values.length} values for ${c.categories.length} categories` });
        if (s.estimate && s.estimate.length !== c.categories.length)
          ctx.addIssue({ code: 'custom', message: `series[${i}].estimate length must match categories` });
      });
      const ids = new Set(c.series.map((s) => s.id));
      for (const [name, v] of Object.entries(c.views)) {
        v.highlight?.forEach((h) => { if (!ids.has(h)) ctx.addIssue({ code: 'custom', message: `view "${name}": unknown series "${h}"` }); });
        v.annotations.forEach((a) => {
          if (a.at >= c.categories.length) ctx.addIssue({ code: 'custom', message: `view "${name}": annotation index ${a.at} out of range` });
          if (a.series && !ids.has(a.series)) ctx.addIssue({ code: 'custom', message: `view "${name}": unknown series "${a.series}"` });
        });
      }
    }),
});

// ---------------------------------------------------------------------------------------------
// The technology directory: the product database behind Discover, Compare and Intelligence.
// Field guide and rules: docs/directory.md. Four linked records: vendors, products, evaluations,
// and articles (tagged to them). Every fact about a product carries its provenance.
// ---------------------------------------------------------------------------------------------

// Where a value came from, when it was checked, and how much to trust it.
const origin = z.enum(['verified', 'vendor-supplied', 'estimated']);
const fact = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    value,
    source: z.string().url(), // the page actually opened to get this value
    checked: z.coerce.date(),
    origin,
  });

const categories = defineCollection({
  loader: file('src/data/directory/categories.json'),
  schema: z.object({
    name: z.string(),
    description: z.string().max(200),
    intro: z.string().max(300).optional(), // the category page's opening line; falls back to description
    comparison: z.enum(['live', 'planned']),
    order: z.number().int(),
  }),
});

const vendors = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/directory/vendors' }),
  schema: z.object({
    name: z.string(),
    website: z.string().url(),
    headquarters: fact(z.string()).optional(), // "Sydney, Australia"
    founded: fact(z.number().int()).optional(),
    size: fact(z.string()).optional(), // "51-200 employees"
    funding: fact(z.string()).optional(), // "Series B, US$40M total"
    ownership: fact(z.enum(['independent', 'venture-backed', 'private-equity', 'public', 'subsidiary', 'open-source', 'other'])).optional(),
    ownershipDetail: fact(z.string()).optional(), // "Owned by funds managed by KKR, with Dragoneer"
    legalEntity: z.string().optional(), // the contracting company, e.g. "Moodle Pty Ltd (ABN 55 116 513 636)"
    status: z.enum(['active', 'acquired', 'closed']),
    acquiredBy: reference('vendors').optional(),
    // Left out until the whole record has been checked; required once draft is false.
    lastVerified: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    researchTasks: z.array(z.string()).default([]), // internal to-do list; never shown to readers
    // Fields we looked for and couldn't find or verify (internal; notes never shown). Readers see
    // "Research ongoing" in each listed field. Never a reason to keep a record off the site.
    dataGaps: z.array(z.object({ field: z.string(), note: z.string() })).default([]),
  }).superRefine((v, ctx) => {
    if (!v.draft && !v.lastVerified) ctx.addIssue({ code: 'custom', message: 'A published vendor needs lastVerified' });
  }),
});

// Evidence & Assurance levels, shown on every profile (docs/directory.md, /evidence-and-assurance/).
// 1 vendor-disclosed: published by the vendor. 2 vendor-confirmed: confirmed to us directly by the
// vendor. 3 independently-corroborated: supported by independent evidence. 4 independently-assured:
// relevant controls covered by current third-party assurance or technical assessment whose scope
// and date we have checked. "research-ongoing": not yet established (shown as "Research ongoing").
const evidenceLevel = z.enum(['research-ongoing', 'vendor-disclosed', 'vendor-confirmed', 'independently-corroborated', 'independently-assured']);

// The assurance layer: what a buyer's procurement team will ask about, and how well each answer
// is evidenced. Findings are the members' layer; the free profile shows the levels.
const assuranceArea = z.object({
  level: evidenceLevel,
  finding: z.string().max(700), // our words: what the evidence says
  caveat: z.string().max(500).optional(), // scope limits: versions, modules, regions, expiry
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })).default([]),
  checked: z.coerce.date(),
});
const assurance = z.object({
  accessibility: assuranceArea.optional(),
  security: assuranceArea.optional(),
  dataResidency: assuranceArea.optional(), // Australian data residency first; other regions in the finding
  ai: assuranceArea.optional(),
  procurementChecks: z.array(z.string()).default([]), // what a buyer should ask for before signing
});

// One answer in an AI profile area. A value without a source stays "research-ongoing".
const aiAnswer = z
  .object({
    question: z.string(), // "Trains AI on customer data"
    value: z.string().optional(), // as recorded; left out when unknown
    level: evidenceLevel,
    source: z.string().url().optional(),
    checked: z.coerce.date().optional(),
    note: z.string().optional(), // scope or caveat, e.g. "Edu and business plans only"
    conflict: z.boolean().default(false), // sources disagree; shown, never presented as resolved
  })
  .superRefine((a, ctx) => {
    if (a.level !== 'research-ongoing' && !a.source) ctx.addIssue({ code: 'custom', message: `"${a.question}": an evidence level above research-ongoing needs a source` });
  });
const aiArea = z.object({ summary: z.string().max(400).optional(), answers: z.array(aiAnswer).default([]) });

const productStatus = z.enum(['active', 'beta', 'acquired', 'discontinued']);
const standard = z.enum([
  'lti-1.1', 'lti-1.3', 'lti-advantage', 'scorm-1.2', 'scorm-2004', 'xapi', 'cmi5', 'aicc',
  'qti', 'caliper', 'oneroster', 'open-badges-2', 'open-badges-3', 'clr',
]);

const products = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/directory/products' }),
  schema: z
    .object({
      name: z.string(),
      vendor: reference('vendors'),
      category: reference('categories'),
      secondaryCategories: z.array(reference('categories')).default([]),
      website: z.string().url(),
      // The affiliate record in platforms.json, if one exists. Jim sets affiliate links there.
      platform: reference('platforms').optional(),
      summary: z.string().max(300), // our words, never the vendor's marketing copy
      primaryMarket: fact(z.array(z.enum(['higher-education', 'schools', 'vet', 'corporate', 'government', 'creators', 'nonprofit'])).min(1)).optional(),
      useCases: fact(z.array(z.string()).min(1)).optional(),
      keyFeatures: fact(z.array(z.string()).min(1)).optional(),
      integrations: fact(z.array(z.string())).optional(), // other products: "Canvas", "Microsoft Teams"
      standards: fact(z.array(standard)).optional(), // interoperability standards, kept apart from integrations
      pricing: fact(z.object({
        public: z.boolean(), // false = quote only
        from: z.string().optional(), // "US$149 a month, billed annually"
        notes: z.string().optional(),
      })).optional(),
      pricingModel: fact(z.object({
        basis: z.enum(['per-seat', 'per-active-user', 'per-learner', 'flat', 'usage', 'quote', 'free', 'open-source']),
        freeTier: z.boolean().optional(), // left out when the vendor doesn't say
        trial: z.boolean().optional(),
      })).optional(),
      deployment: fact(z.array(z.enum(['cloud', 'self-hosted', 'hybrid'])).min(1)).optional(),
      accessibility: fact(z.object({
        standard: z.string().optional(), // "WCAG 2.2 AA"
        evidence: z.string().optional(), // "VPAT 2.5, published March 2026"
      })).optional(),
      security: fact(z.array(z.string())).optional(), // "ISO 27001", "SOC 2 Type II"
      dataPrivacy: fact(z.object({
        dataResidency: z.array(z.string()).default([]), // "Australia", "EU"
        gdpr: z.boolean().optional(),
        australianPrivacyAct: z.string().optional(),
        notes: z.string().optional(),
      })).optional(),
      aiDisclosure: fact(z.object({
        models: z.array(z.string()), // "GPT-4o", "in-house"; [] if the vendor doesn't say
        trainsOnCustomerData: z.enum(['no', 'yes', 'opt-out', 'opt-in', 'not-disclosed']),
        notes: z.string().optional(),
      })).optional(),
      evidence: z.array(z.object({
        kind: z.enum(['research', 'case-study', 'independent-evaluation']),
        title: z.string(),
        url: z.string().url(),
        year: z.number().int().optional(),
      })).default([]),
      // Left empty until there is a way to verify that reviewers actually use the product.
      // Ratings are never copied from G2, Capterra or similar sites.
      userSentiment: z.null().default(null),
      geographicAvailability: fact(z.array(z.string()).min(1)).optional(), // "Worldwide", "Australia"
      alternatives: z.array(reference('products')).default([]),
      // Any money between The Learning Curve and the vendor. Shown on the profile.
      // Money never touches scores, rankings, inclusion or coverage (docs/directory.md).
      commercialRelationship: z.object({
        kind: z.enum(['none', 'affiliate', 'sponsor', 'vendor-subscriber']),
        since: z.coerce.date().optional(),
        notes: z.string().optional(),
      }),
      // Logo and screenshots for the profile page, from public/images/directory/<id>/ (docs/directory.md).
      media: z
        .object({
          logo: z.object({ src: z.string(), alt: z.string(), source: z.string().url().optional() }).optional(),
          screenshots: z
            .array(z.object({
              src: z.string(), // 1600 px wide WebP (or its native width, set in width), plus an -800 copy
              alt: z.string().min(20),
              caption: z.string().optional(),
              credit: z.string(),
              width: z.number().int().positive().default(1600),
              still: z.string().optional(), // first frame of an animated screenshot, for reduced motion
              frame: z.boolean().default(false), // thin border, for flat UI captures (not device mock-ups)
            }))
            .default([]),
        })
        .optional(),
      // AI profile: the four comparison criteria for AI products (data privacy, learner oversight,
      // pedagogical approach, output ownership) plus what the AI does and who uses it. Every answer
      // carries its own evidence level and, once established, its source.
      aiProfile: z
        .object({
          toolTypes: z.array(z.string()).default([]),
          audience: z.array(z.string()).default([]),
          areas: z.object({
            dataPrivacy: aiArea,
            learnerOversight: aiArea,
            pedagogy: aiArea,
            outputOwnership: aiArea,
          }),
        })
        .optional(),
      // Evidence & assurance (members and procurement). Optional until researched.
      assurance: assurance.optional(),
      status: productStatus,
      // Left out until the whole record has been checked; required once draft is false.
      lastVerified: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      researchTasks: z.array(z.string()).default([]), // internal to-do list and open conflicts; never shown to readers
      // Fields we looked for and couldn't find or verify (internal; notes never shown). Readers see
      // "Research ongoing" in each listed field. Never a reason to keep a record off the site.
      dataGaps: z.array(z.object({ field: z.string(), note: z.string() })).default([]),
    })
    .superRefine((p, ctx) => {
      const isAi = p.category.id === 'ai-for-learning' || p.secondaryCategories.some((c) => c.id === 'ai-for-learning');
      if (isAi && !p.aiDisclosure) {
        ctx.addIssue({ code: 'custom', message: 'An AI for Learning product needs aiDisclosure (use models: [] and "not-disclosed" if the vendor says nothing)' });
      }
      if (!p.draft && !p.lastVerified) {
        ctx.addIssue({ code: 'custom', message: 'A published product needs lastVerified (the date the whole record was checked)' });
      }
      if (p.commercialRelationship.kind !== 'none' && !p.commercialRelationship.since) {
        ctx.addIssue({ code: 'custom', message: 'A commercial relationship needs its start date (`since`)' });
      }
    }),
});

// Method v1 = the published course-platform method (how-we-review): 60% learning design,
// 40% business tools. v2 = the cross-category Technology Assessment Framework, once published.
const V1_LEARNING = ['retrieval', 'assessment', 'credentials', 'analytics'] as const;
const V1_BUSINESS = ['pricing', 'payments', 'marketing'] as const;
const evaluations = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/directory/evaluations' }),
  schema: z
    .object({
      product: reference('products'),
      method: z.enum(['v1-course-platforms', 'v2']),
      testedOn: z.coerce.date(),
      tester: z.string(),
      plan: z.string(), // the plan tested
      scores: z.record(z.number().min(1).max(5)),
      overall: z.number().min(1).max(5),
      article: reference('articles').optional(), // the published evaluation, if any
      notes: z.record(z.string()).default({}),
    })
    .superRefine((e, ctx) => {
      if (e.method !== 'v1-course-platforms') return;
      const keys = [...V1_LEARNING, ...V1_BUSINESS];
      const missing = keys.filter((k) => e.scores[k] === undefined);
      const extra = Object.keys(e.scores).filter((k) => !(keys as readonly string[]).includes(k));
      if (missing.length || extra.length) {
        ctx.addIssue({ code: 'custom', message: `v1 scores need exactly ${keys.join(', ')} (missing: ${missing.join(', ') || 'none'}; extra: ${extra.join(', ') || 'none'})` });
        return;
      }
      const avg = (ks: readonly string[]) => ks.reduce((s, k) => s + e.scores[k], 0) / ks.length;
      const expected = Math.round((avg(V1_LEARNING) * 0.6 + avg(V1_BUSINESS) * 0.4) * 10) / 10;
      if (Math.abs(expected - e.overall) > 0.001) {
        ctx.addIssue({ code: 'custom', message: `overall should be ${expected} under method v1 (60% learning design, 40% business tools), not ${e.overall}` });
      }
    }),
});

const source = z.object({
  authors: z.string(), // "Roediger, H. L., & Karpicke, J. D."
  year: z.number(),
  title: z.string(),
  journal: z.string().optional(),
  doi: z.string().optional(), // "10.1111/j.1467-9280.2006.01693.x"
  url: z.string().url(), // the page the routine actually opened
});

const researchCard = z.object({
  excerpt: z.string().max(400), // verbatim, at most two sentences
  highlight: z.string(), // must appear inside excerpt
  sourceIndex: z.number().int().min(0), // index into sources[]
  page: z.string().optional(),
});

// Groups on the evidence map, in display order
export const LIBRARY_CATEGORIES = [
  'Memory and practice',
  'Presenting information',
  'Feedback and assessment',
  'Course structure',
  'Motivation and engagement',
  'Myths and misconceptions',
] as const;

// Video timelines (src/data/timelines/<id>.json): one video planned segment by segment, drawn by
// <VideoTimeline id="…" /> as lanes for what's on screen, with the research behind each segment.
// The timings are a design; every research claim names a source the routine opened.
const timelines = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/timelines' }),
  schema: z
    .object({
      title: z.string().max(120), // states the finding
      subtitle: z.string().max(220), // says what the plan is, and that the timings are ours
      duration: z.number().int().positive(), // seconds
      wordsPerMinute: z.number().int().positive().optional(), // narration pace for word budgets
      segments: z.array(z.object({
        id: z.string(),
        start: z.number().int().min(0), // seconds
        end: z.number().int().positive(),
        mode: z.enum(['camera', 'slides', 'drawing', 'practice']),
        inset: z.enum(['slides']).optional(), // e.g. instructor with a slide beside them
        label: z.string().max(60), // the segment's job: "Explain the idea"
        onScreen: z.string().max(160),
        research: z.string().max(700), // what the studies found, with numbers from the source
        practice: z.string().max(300), // what we'd do
        sources: z.array(z.string()).min(1), // ids from sources[]
      })).min(2),
      sources: z.array(z.object({ id: z.string(), label: z.string(), url: z.string().url() })).min(1),
      notes: z.array(z.string()).default([]),
    })
    .superRefine((t, ctx) => {
      const ids = new Set(t.sources.map((s) => s.id));
      t.segments.forEach((s, i) => {
        if (s.end <= s.start) ctx.addIssue({ code: 'custom', message: `segments[${i}] ends before it starts` });
        if (i === 0 && s.start !== 0) ctx.addIssue({ code: 'custom', message: 'the first segment must start at 0' });
        if (i > 0 && s.start !== t.segments[i - 1].end) ctx.addIssue({ code: 'custom', message: `segments[${i}] doesn't start where segments[${i - 1}] ends` });
        s.sources.forEach((id) => { if (!ids.has(id)) ctx.addIssue({ code: 'custom', message: `segments[${i}]: unknown source "${id}"` }); });
      });
      const last = t.segments[t.segments.length - 1];
      if (last && last.end !== t.duration) ctx.addIssue({ code: 'custom', message: `the last segment ends at ${last.end}s, not at duration ${t.duration}s` });
    }),
});

// Popular claims about learning that the evidence doesn't back, shown on the evidence map
const myths = defineCollection({
  loader: file('src/data/myths.json'),
  schema: z.object({
    claim: z.string().max(140), // the popular version, in quotes on the page
    rating: z.enum(['Not supported', 'Overstated']),
    summary: z.string().max(500), // what the evidence says, in two or three sentences
    sources: z.array(z.object({ label: z.string(), url: z.string().url() })).min(1),
    article: z.string().optional(), // slug of our full article; linked once it's live
    related: z.array(z.string()).default([]), // slugs of library entries to point to instead
  }),
});

const score = z.number().min(1).max(5);

// The quiz or poll at the end of an article ("reader check"). Readers answer, then see how
// everyone else answered as a bar chart. Rules for writing them: docs/editorial.md section 11.
const checkQuestion = z.object({
  q: z.string().max(200),
  options: z.array(z.string().max(120)).min(2).max(6),
  answer: z.number().int().min(0).optional(), // quiz only: index of the correct option
  why: z.string().max(400).optional(), // quiz only: one line on why that answer is right
});
const readerCheck = z.object({
  kind: z.enum(['quiz', 'poll']),
  questions: z.array(checkQuestion).min(1).max(3),
  // 'end' (default): after the article body. 'inline': wherever the body places <ReaderPoll />.
  placement: z.enum(['end', 'inline']).default('end'),
});

const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: z
    .object({
      section: z.enum(['library', 'guides', 'reviews', 'trends']),
      kind: z.enum(['library', 'guide', 'review', 'comparison', 'trends']),
      title: z.string().max(70),
      description: z.string().min(140).max(160),
      standfirst: z.string().max(220),
      kicker: z.string(),
      targetKeyword: z.string(),
      secondaryKeywords: z.array(z.string()).default([]),
      summary: z.string(), // "The short answer": 40-60 words
      keyTakeaways: z.array(z.string()).min(3).max(5),
      hero: z.object({
        style: z.enum(['documentary', 'risograph', 'screenshot']),
        alt: z.string().min(20),
        caption: z.string().optional(),
        // Defaults to /images/articles/<slug>.webp
        src: z.string().optional(),
      }),
      researchCards: z.array(researchCard).default([]),
      charts: z.array(reference('charts')).default([]),
      platforms: z.array(reference('platforms')).default([]),
      // Directory tags: an article appears on the profiles and category pages it is tagged to.
      categories: z.array(reference('categories')).default([]),
      products: z.array(reference('products')).default([]),
      vendors: z.array(reference('vendors')).default([]),
      review: z
        .object({
          platform: reference('platforms'),
          testedOn: z.coerce.date(),
          plan: z.string(),
          scores: z.object({
            retrieval: score,
            assessment: score,
            credentials: score,
            analytics: score,
            pricing: score,
            payments: score,
            marketing: score,
          }),
          notes: z.record(z.string()),
          verdict: z.string(),
          bestFor: z.string(),
          lookElsewhereIf: z.string(),
          pricesCheckedOn: z.coerce.date(),
          prices: z
            .array(z.object({ plan: z.string(), monthly: z.string(), includes: z.string() }))
            .default([]),
        })
        .optional(),
      comparison: z
        .object({
          rows: z.array(z.object({ criterion: z.string(), values: z.record(z.string()) })).min(3),
          bestFor: z.record(z.string()),
        })
        .optional(),
      library: z
        .object({
          principle: z.string(),
          question: z.string(),
          evidence: z.enum(['strong', 'moderate', 'emerging']),
          lastReviewed: z.coerce.date(),
          // The evidence map (/library/evidence-map/): one plain sentence on what to do, and a group
          verdict: z.string().max(200).optional(),
          category: z.enum(LIBRARY_CATEGORIES).optional(),
        })
        .optional(),
      readerCheck: readerCheck.optional(),
      faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(3),
      sources: z.array(source).default([]),
      featured: z.boolean().default(false),
      // Jim's own first-person piece: shown in the home page's "Jim's take" box.
      opinion: z.boolean().default(false),
      published: z.coerce.date(), // full datetime with offset, e.g. 2026-11-09T12:00:00+11:00
      updated: z.coerce.date().optional(),
      draft: z.boolean().default(false),
    })
    .superRefine((a, ctx) => {
      const sectionFor = {
        library: 'library',
        guide: 'guides',
        review: 'reviews',
        comparison: 'reviews',
        trends: 'trends',
      } as const;
      if (sectionFor[a.kind] !== a.section) {
        ctx.addIssue({ code: 'custom', message: `kind "${a.kind}" belongs in section "${sectionFor[a.kind]}"` });
      }
      if (a.kind === 'review' && !a.review) {
        ctx.addIssue({ code: 'custom', message: 'A review needs the `review` block' });
      }
      if (a.kind === 'comparison' && !a.comparison) {
        ctx.addIssue({ code: 'custom', message: 'A comparison needs the `comparison` block' });
      }
      if (a.kind === 'library' && !a.library) {
        ctx.addIssue({ code: 'custom', message: 'A library entry needs the `library` block' });
      }
      a.researchCards.forEach((card, i) => {
        if (!card.excerpt.includes(card.highlight)) {
          ctx.addIssue({ code: 'custom', message: `researchCards[${i}]: highlight is not inside the excerpt` });
        }
        if (card.sourceIndex >= a.sources.length) {
          ctx.addIssue({ code: 'custom', message: `researchCards[${i}]: sourceIndex ${card.sourceIndex} has no matching source` });
        }
      });
      if (a.readerCheck) {
        const rc = a.readerCheck;
        if (a.kind === 'review' || a.kind === 'comparison') {
          ctx.addIssue({ code: 'custom', message: 'Reviews and comparisons have no readerCheck (a poll must never sit next to a score)' });
        }
        if (a.kind === 'trends' && rc.kind !== 'poll') {
          ctx.addIssue({ code: 'custom', message: 'A trends article\'s readerCheck is always a poll' });
        }
        if (rc.kind === 'quiz' && rc.questions.length !== 3) {
          ctx.addIssue({ code: 'custom', message: `A quiz has exactly 3 questions (this one has ${rc.questions.length})` });
        }
        rc.questions.forEach((q, i) => {
          if (rc.kind === 'quiz') {
            if (q.answer === undefined || q.answer >= q.options.length) {
              ctx.addIssue({ code: 'custom', message: `readerCheck.questions[${i}]: a quiz question needs an answer that is the index of one of its options` });
            }
            if (!q.why) ctx.addIssue({ code: 'custom', message: `readerCheck.questions[${i}]: a quiz question needs a why` });
          } else if (q.answer !== undefined || q.why) {
            ctx.addIssue({ code: 'custom', message: `readerCheck.questions[${i}]: a poll has no right answer, so no answer or why` });
          }
        });
      }
      const words = a.summary.trim().split(/\s+/).length;
      if (words < 35 || words > 70) {
        ctx.addIssue({ code: 'custom', message: `summary is ${words} words; aim for 40-60` });
      }
    }),
});

// In-article evidence maps (src/data/evidence/<id>.json), drawn by <EvidenceMap id="…" />: the
// sources behind a feature, grouped into clusters, each with its method, the finding used and its limits.
const evidence = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/data/evidence' }),
  schema: z
    .object({
      title: z.string(),
      intro: z.string(),
      clusters: z.array(z.object({
        id: z.string(),
        name: z.string(),
        question: z.string(),
        sources: z.array(z.string()).min(1),
      })).min(1).max(6),
      sources: z.record(z.object({
        name: z.string(),
        publisher: z.string(),
        date: z.string(),
        type: z.string(), // "Vendor survey", "Official statistics", "Meta-analysis"…
        method: z.string(),
        findings: z.array(z.string()).min(1),
        limits: z.string(),
        url: z.string().url(),
      })),
    })
    .superRefine((m, ctx) => {
      const used = new Set<string>();
      m.clusters.forEach((c) => c.sources.forEach((s) => {
        used.add(s);
        if (!m.sources[s]) ctx.addIssue({ code: 'custom', message: `cluster "${c.id}": unknown source "${s}"` });
      }));
      Object.keys(m.sources).forEach((s) => {
        if (!used.has(s)) ctx.addIssue({ code: 'custom', message: `source "${s}" is in no cluster` });
      });
    }),
});

export const collections = { platforms, charts, articles, myths, stories, timelines, evidence, categories, vendors, products, evaluations };
