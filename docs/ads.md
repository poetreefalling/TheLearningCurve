# Ads

How advertising works on The Learning Curve, and how to run it. You manage everything in the
**Ads** tab at thelearningcurve.net/admin; this page explains what it does.

## The rule of the house

- **Direct sponsors first, the network second, our own promos third.** Each slot shows a live
  sponsor booking if there is one; otherwise Google AdSense, but only once Google has actually
  filled the unit; otherwise a house promo (below). Pages never show an empty box: an AdSense unit
  takes no space until it is filled, and disappears if Google reports it unfilled.
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

## House promos (our own billboards)

`src/data/house-ads.json` holds promos for our own pages: the newsletter, the evidence map, the
course design checklist and the directory. A slot shows one while AdSense hasn't filled (for
example while the AdSense account is still under review, or when Google has no ad for the page),
and keeps it if AdSense never fills. When AdSense does fill, the ad replaces the promo.

- Labelled **"From The Learning Curve"**, never "Advertisement", and styled as our own content
  (the newsletter promo on marigold, the rest on white with an ink rule).
- Each page gets the same promo on every build, a different one in each slot, and never a promo
  for the page it's on.
- Never on reviews or comparisons, like every other slot.
- To add or change one, edit the file (kicker, headline, text, button label, link, which slots).
  The build checks the lengths.

How it works: AdSense marks each unit `data-ad-status="filled"` or `"unfilled"` once it has
decided. The stylesheet keeps the unit at zero height and shows the promo until it is filled.

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

## The advertise page and media kit enquiries

`/advertising/` is the public page: who reads the site, the formats, where ads appear, and the full
advertising and sponsorship policy. It never shows prices. Rates, packages and the founding partner
offer go out one-to-one in the media kit deck. Every "Advertisement" label links to it, as do the
footer, the disclosure page and /submit.

- **Changing the policy:** edit `src/pages/advertising/index.astro` and set
  `SITE.advertising.policyUpdated` in `src/site.config.ts` to the date, so "Last updated" stays true.
- **Enquiries:** the "Request the media kit" form posts to `functions/api/enquiry.ts`, which saves
  each one in the D1 table `ad_enquiries` (the same database as submissions) and emails it, with
  reply-to set to the enquirer. The email goes to `ADVERTISING_NOTIFY_TO` (Cloudflare Pages →
  Settings → Variables), or advertising@thelearningcurve.net if that isn't set. It uses the same
  `RESEND_API_KEY` as submissions. Check the advertiser against "Who we accept" before following up.
- **The media kit download:** after a successful enquiry the thanks page offers the PDF at
  `public/media-kit/the-learning-curve-media-kit.pdf`. The link is signed and lasts 7 days;
  `functions/media-kit/[[path]].ts` checks it and sends anyone without a valid link to the form. Signed
  with `MEDIA_KIT_SECRET` (any long random string, Cloudflare Pages → Settings → Variables), or
  `RESEND_API_KEY` if that isn't set. To update the kit, export the new PDF from the design canvas and
  replace that file under the same name.

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
- `src/data/house-ads.json`: house promos, shown when no paid ad fills a slot
- `src/components/AdSlot.astro`, `src/components/SponsoredCard.astro`: the slots
- `src/pages/ads.txt.ts`: `/ads.txt`
- `public/ads/`: sponsor images
- `src/pages/advertising/`: the advertise page and its thanks page; `functions/api/enquiry.ts`: its form
- `functions/api/admin/[[path]].ts` and `public/admin/index.html`: the ad manager
