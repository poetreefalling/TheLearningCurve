# Ads

How advertising works on The Learning Curve, and how to run it. You manage everything in the
**Ads** tab at thelearningcurve.net/admin; this page explains what it does.

## The rule of the house

- **Direct sponsors first, the network second.** Each slot shows a live sponsor booking if there
  is one; otherwise Google AdSense fills it (if switched on); otherwise the slot doesn't appear at
  all. Pages never show an empty box.
- **No ads on reviews or comparisons.** An ad next to a platform score would read as part of the
  score. The site enforces this; there is no switch for it.
- **Ads never look like editorial.** Every ad is labelled "Advertisement" (sponsored cards:
  "Sponsored" and the sponsor's name), sits on white with a hairline, and never uses the marigold
  or tomato. All ad links carry `rel="sponsored"`.
- **No ad before the short answer, inside a research card or chart, or as a pop-up.** At most two
  ads inside an article (one in the body or the rail, one at the end).

## The slots

| Slot | Image size | Where it shows |
|---|---|---|
| Billboard | 970 × 250 | Home page between the first and second rows; the end of each article (scaled to the column) |
| Medium rectangle | 300 × 250 | Home page rail, beside the section bands (under Start here); inside articles, after the fifth paragraph, on screens narrower than 1240 px or when no half page is booked |
| Half page | 300 × 600 | A sticky rail beside articles on screens 1240 px and wider |
| Sponsored card | 1200 × 800 (3:2) | Home page grid, styled like an article card. Direct sponsors only |

Supply images at the size shown, or twice it for sharp screens: WebP or JPEG, under 1.5 MB. The
billboard image scales down on phones (to about 360 × 93), so any text in it needs to be large.

On the home page, a booked sponsored card takes the last cell of the second row, and the article it
displaces moves down into the section bands. The medium rectangle sits in the rail beside the
section bands, under Start here, so it is never placed right under the billboard.

## Booking a sponsor

Ads tab → **Add a sponsor campaign**: name (for you), sponsor, slot, image, a description of the
image for screen readers, the link (with the sponsor's UTM tags if they want them), start and end
dates (the end date is the last day it shows). Then **Save and publish**.

- One booking shows per slot at a time. If two overlap, the one that started most recently shows.
- Campaigns switch on and off at the scheduled rebuilds (00:00 and 12:00 Sydney time), so a
  campaign starting on the 10th appears at midnight on the 10th. One that has ended also hides
  itself in readers' browsers straight away, even before the next rebuild.
- **Pause** keeps a booking but takes it down; **Remove** deletes it. Its image stays in
  `public/ads/` (harmless; ask Claude to tidy old ones).

There's no click or impression counting built in. Use the sponsor's UTM tags (their analytics
see the visits) or a link shortener with stats.

## Switching on AdSense (the fallback)

1. Apply at adsense.google.com with thelearningcurve.net. Google reviews the site.
2. Once approved, in AdSense → Privacy & messaging, set up the **European regulations** (GDPR)
   message so visitors in the UK and Europe are asked for consent. Google serves it through the
   same ad code; nothing else to install.
3. AdSense → Ads → By ad unit: create three **display** units (responsive) for the billboard,
   medium rectangle and half page. Copy each unit's ID (the `data-ad-slot` number).
4. In the Ads tab: tick **Fill empty slots with Google AdSense**, paste the publisher ID
   (`ca-pub-…`) and the three unit IDs, then **Save and publish**.

The site then loads the AdSense script only on pages with an ad slot (never on reviews or
comparisons), and `/ads.txt` lists Google as an authorised seller automatically.

## Files

- `src/data/ads.json`: the bookings and network settings (written by the ad manager)
- `src/lib/ads.ts`: the rules (slot sizes, which ad a slot shows), checked at build time, so a bad
  file fails the build rather than the live site
- `src/components/AdSlot.astro`, `src/components/SponsoredCard.astro`: the slots
- `src/pages/ads.txt.ts`: `/ads.txt`
- `public/ads/`: sponsor images
- `functions/api/admin/[[path]].ts` and `public/admin/index.html`: the ad manager
