// Ads: direct sponsors first, an ad network (Google AdSense) as the fallback.
//
// Everything lives in src/data/ads.json, which Jim edits in the ad manager at /admin (Ads tab).
// Saving there commits the file to main; Cloudflare rebuilds the site in about two minutes, and
// the scheduled rebuilds at 00:00 and 12:00 Sydney time start and end campaigns on their dates.
// The rules, the slot sizes and the setup are in docs/ads.md.

import { z } from 'astro/zod';
import raw from '../data/ads.json';
import houseRaw from '../data/house-ads.json';

export const SLOTS = {
  billboard: { label: 'Billboard', width: 970, height: 250, where: 'Home page between rows, and the end of each article' },
  rectangle: { label: 'Medium rectangle', width: 300, height: 250, where: 'Home page rail beside the section bands, and inside articles' },
  halfpage: { label: 'Half page', width: 300, height: 600, where: 'Sticky rail beside articles on wide screens' },
  card: { label: 'Sponsored card', width: 1200, height: 800, where: 'Home page grid, styled like an article card' },
} as const;
export type SlotId = keyof typeof SLOTS;
export type Page = 'home' | 'article';

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Dates are YYYY-MM-DD');
const campaign = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  sponsor: z.string().min(1).max(80),
  slot: z.enum(['billboard', 'rectangle', 'halfpage', 'card']),
  pages: z.enum(['home', 'articles', 'both']).default('both'),
  image: z.string().regex(/^\/ads\/[a-z0-9][a-z0-9._-]*\.(webp|jpe?g|png|gif)$/i, 'Images live in /ads/'),
  alt: z.string().min(3).max(200),
  url: z.string().url().startsWith('https://'),
  headline: z.string().max(90).optional(), // sponsored card only
  text: z.string().max(160).optional(), // sponsored card only
  start: day,
  end: day,
  active: z.boolean().default(true),
});
export type Campaign = z.infer<typeof campaign>;

const config = z.object({
  network: z.object({
    enabled: z.boolean().default(false),
    provider: z.literal('adsense').default('adsense'),
    client: z.string().regex(/^(ca-pub-\d{10,20})?$/, 'The AdSense publisher ID looks like ca-pub-1234567890123456').default(''),
    slots: z.object({ billboard: z.string().regex(/^\d*$/).default(''), rectangle: z.string().regex(/^\d*$/).default(''), halfpage: z.string().regex(/^\d*$/).default('') }).default({}),
  }),
  campaigns: z.array(campaign).default([]),
}).superRefine((c, ctx) => {
  c.campaigns.forEach((k, i) => {
    if (k.end < k.start) ctx.addIssue({ code: 'custom', message: `campaigns[${i}] (${k.name}) ends before it starts` });
    if (k.slot === 'card' && !k.headline) ctx.addIssue({ code: 'custom', message: `campaigns[${i}] (${k.name}) is a sponsored card and needs a headline` });
  });
});

export const ADS = config.parse(raw);

/** Today's date in Sydney, as YYYY-MM-DD: the day the build runs. */
export const todaySydney = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Sydney', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

/** Reviews and comparisons never carry ads: an ad next to a platform score would read as part of the score. */
export const adsAllowedFor = (kind?: string) => kind !== 'review' && kind !== 'comparison';

export const networkReady = () => ADS.network.enabled && !!ADS.network.client;

export type Pick =
  | { kind: 'direct'; campaign: Campaign }
  | { kind: 'network'; client: string; adSlot: string }
  | null;

/** The ad a slot shows: a live direct campaign first, else the network, else nothing (the slot collapses). */
export function pickAd(slot: SlotId, page: Page): Pick {
  const today = todaySydney();
  const live = ADS.campaigns
    .filter((k) => k.active && k.slot === slot && k.start <= today && k.end >= today)
    .filter((k) => k.pages === 'both' || (k.pages === 'home') === (page === 'home'))
    .sort((a, b) => b.start.localeCompare(a.start)); // the most recently started booking wins
  if (live[0]) return { kind: 'direct', campaign: live[0] };
  if (slot !== 'card' && networkReady()) {
    const adSlot = ADS.network.slots[slot];
    if (adSlot) return { kind: 'network', client: ADS.network.client, adSlot };
  }
  return null;
}

// ---- House promos: our own billboards for slots with nothing paid to show (src/data/house-ads.json) ----

const housePromo = z.object({
  id: z.string().min(1),
  kicker: z.string().max(40),
  headline: z.string().max(90),
  text: z.string().max(160),
  cta: z.string().max(30),
  url: z.string().startsWith('/'),
  slots: z.array(z.enum(['billboard', 'rectangle', 'halfpage'])).min(1),
  style: z.enum(['band', 'plain']).default('plain'),
});
export type HousePromo = z.infer<typeof housePromo>;
export const HOUSE = z.object({ promos: z.array(housePromo).default([]) }).parse(houseRaw).promos;

/** A house promo for this slot on this page: never one pointing at the page itself, and the same
 *  choice on every build of a page, and a different one in each slot (from a hash of its path). */
export function pickHouse(slot: Exclude<SlotId, 'card'>, path: string): HousePromo | null {
  const norm = (p: string) => p.replace(/\/?$/, '/');
  const options = HOUSE.filter((h) => h.slots.includes(slot) && norm(h.url) !== norm(path));
  if (!options.length) return null;
  let hash = 0;
  for (const ch of path) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  // A different promo in each slot on the same page: offset the pick by the slot.
  const offset = { rectangle: 0, billboard: 1, halfpage: 2 }[slot];
  return options[(hash + offset) % options.length];
}
