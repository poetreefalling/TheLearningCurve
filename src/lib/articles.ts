import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { SITE } from '../site.config';

export type Article = CollectionEntry<'articles'>;

const branch = process.env.CF_PAGES_BRANCH;
/** Cloudflare preview builds (any branch but main), local dev, or an explicit flag. */
export const SHOW_UNPUBLISHED =
  import.meta.env.DEV || (!!branch && branch !== 'main') || process.env.SHOW_UNPUBLISHED === '1';
/** Production builds refuse to publish an article that still has editor flags in it. */
export const PUBLISH_CHECKS = process.env.PUBLISH_CHECKS === '1' || branch === 'main';

const NOW = new Date();

export const slugOf = (a: Article) => a.id.split('/').pop()!;
export const urlOf = (a: Article) => `/${a.data.section}/${slugOf(a)}/`;
export const isLive = (a: Article) => !a.data.draft && a.data.published <= NOW;
export const isVisible = (a: Article) => SHOW_UNPUBLISHED || isLive(a);

export const heroSrc = (a: Article, variant: '' | '-1200' | '-card' | '-og' = '') => {
  if (a.data.hero.src) return a.data.hero.src;
  const ext = variant === '-og' ? 'jpg' : 'webp';
  return `/images/articles/${slugOf(a)}${variant}.${ext}`;
};

export const heroCredit = (a: Article) =>
  ({
    documentary: '',
    risograph: 'Illustration: The Learning Curve',
    screenshot: 'Screenshot: The Learning Curve',
  })[a.data.hero.style];

const FLAG = /\[(JIM|TO VERIFY)\b[^\]]*\]/;

let checked = false;
function check(all: Article[]) {
  if (checked) return;
  checked = true;
  const problems: string[] = [];
  for (const a of all) {
    const body = a.body ?? '';
    const where = `src/content/articles/${a.id}`;
    a.data.researchCards.forEach((_, i) => {
      if (!new RegExp(`<ResearchCard\\s+n=\\{${i}\\}`).test(body)) {
        problems.push(`${where}: researchCards[${i}] is never placed (add <ResearchCard n={${i}} /> in the body)`);
      }
    });
    a.data.charts.forEach((c) => {
      if (!body.includes(`<Chart id="${c.id}"`)) {
        problems.push(`${where}: chart "${c.id}" is never placed (add <Chart id="${c.id}" /> in the body)`);
      }
    });
    if (PUBLISH_CHECKS && !a.data.draft) {
      const flagged = [body, JSON.stringify(a.data)].join('\n').match(FLAG);
      if (flagged) problems.push(`${where}: still contains ${flagged[0].slice(0, 60)}… Resolve it or set draft: true.`);
    }
  }
  if (problems.length) throw new Error('Article checks failed:\n  ' + problems.join('\n  '));
}

/** Every article readers can see in this build, newest first. */
export async function getArticles(section?: string) {
  const all = await getCollection('articles');
  check(all);
  return all
    .filter(isVisible)
    .filter((a) => !section || a.data.section === section)
    .sort((a, b) => b.data.published.valueOf() - a.data.published.valueOf());
}

export async function getPlatform(id: string) {
  return getEntry('platforms', id);
}

/** True when any platform the article covers has an affiliate link set. */
export async function hasAffiliateLinks(a: Article) {
  const ids = new Set(a.data.platforms.map((p) => p.id));
  if (a.data.review) ids.add(a.data.review.platform.id);
  for (const id of ids) {
    const p = await getEntry('platforms', id);
    if (p?.data.affiliateUrl) return true;
  }
  return false;
}

export function readingTime(a: Article) {
  const words = (a.body ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-AU', { timeZone: SITE.timezone, ...opts });
export const formatDate = (d: Date) => fmt({ day: 'numeric', month: 'long', year: 'numeric' }).format(d);
export const formatShortDate = (d: Date) => fmt({ day: 'numeric', month: 'short' }).format(d);
export const formatSlot = (d: Date) =>
  fmt({ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

/** srcset for the hero, when it uses the generated image set */
export const heroSrcset = (a: Article) =>
  a.data.hero.src ? undefined : `${heroSrc(a, '-card')} 800w, ${heroSrc(a, '-1200')} 1200w, ${heroSrc(a)} 2000w`;
