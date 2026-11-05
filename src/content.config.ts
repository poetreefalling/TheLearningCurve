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
      format: z.enum(['percent', 'number', 'compact', 'usd-billions', 'millions', 'sd']),
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

export const collections = { platforms, charts, articles, stories, evidence };
