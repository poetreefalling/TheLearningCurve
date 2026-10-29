import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITE } from '../site.config';
import { getArticles, urlOf, isLive } from '../lib/articles';

export async function GET(context: APIContext) {
  const items = (await getArticles()).filter(isLive).slice(0, 50);
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site!,
    trailingSlash: true,
    items: items.map((a) => ({
      title: a.data.title,
      description: `${a.data.standfirst} ${a.data.summary}`,
      link: urlOf(a),
      pubDate: a.data.published,
      categories: [a.data.kicker, a.data.section],
      author: SITE.author.name,
    })),
    customData: '<language>en-au</language>',
  });
}
