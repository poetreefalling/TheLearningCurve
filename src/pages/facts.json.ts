// /facts.json: the same facts as /facts/, for anything that would rather read data than a page.
import type { APIRoute } from 'astro';
import facts from '../data/facts.json';
import { SITE } from '../site.config';

export const GET: APIRoute = () => {
  const abs = (u: string) => (u.startsWith('/') ? `${SITE.url}${u}` : u);
  const body = {
    name: SITE.name,
    url: SITE.url,
    page: `${SITE.url}/facts/`,
    checked: facts.checked,
    facts: facts.groups.flatMap((g) =>
      g.facts.map((f) => ({ id: f.id, group: g.title, label: f.label, value: f.value, source: abs(f.source), checked: f.checked })),
    ),
  };
  return new Response(JSON.stringify(body, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
