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

// The evidence & assurance layer: what a buyer's procurement team will ask about, and how well
// each answer is evidenced. "independently-evidenced" needs a third-party report or certificate
// whose scope and date we have checked; a vendor's own statement is "publicly-stated".
const assuranceStatus = z.enum(['independently-evidenced', 'publicly-stated', 'vendor-confirmation-required', 'not-disclosed']);
const assuranceArea = z.object({
  status: assuranceStatus,
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
            .array(z.object({ src: z.string(), alt: z.string().min(20), caption: z.string().optional(), credit: z.string() }))
            .default([]),
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
        })
        .optional(),
      readerCheck: readerCheck.optional(),
      faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(3),
      sources: z.array(source).default([]),
      featured: z.boolean().default(false),
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

export const collections = { platforms, charts, articles, stories, categories, vendors, products, evaluations };
