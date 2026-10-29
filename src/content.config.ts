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
      const words = a.summary.trim().split(/\s+/).length;
      if (words < 35 || words > 70) {
        ctx.addIssue({ code: 'custom', message: `summary is ${words} words; aim for 40-60` });
      }
    }),
});

export const collections = { platforms, charts, articles };
