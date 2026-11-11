// /ads.txt: the authorised-sellers file ad networks check before they serve. Generated from the
// AdSense publisher ID in src/data/ads.json, so it is right as soon as the network is switched on.
import { ADS } from '../lib/ads';

export function GET() {
  const pub = ADS.network.client.replace(/^ca-/, '');
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : '# No ad network is set up yet. See docs/ads.md.\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
