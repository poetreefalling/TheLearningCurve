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
| Medium rectangle | 300 × 250 | Home page grid (last cell of the second row); inside articles, after the fifth paragraph, on screens narrower than 1240 px or when no half page is booked |
| Half page | 300 × 600 | A sticky rail beside articles on screens 1240 px and wider |
| Sponsored card | 1200 × 800 (3:2) | Home page grid, styled like an article card. Direct sponsors only |

Supply images at the size shown, or twice it for sharp screens: WebP or JPEG, under 1.5 MB. The
billboard image scales down on phones (to about 360 × 93), so any text in it needs to be large.

On the home page, a booked sponsored card and rectangle take the last two cells of the second row;
the articles they displace move down into "Latest".

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

1. **Sign up** at adsense.google.com with the Google account you want paid through, and add
   thelearningcurve.net as your site. Enter your payment address and tax details while you wait.
2. **Save your publisher ID first, with the network off.** Copy the ID AdSense shows
   (`ca-pub-` and 16 digits). In the Ads tab, paste it into **AdSense publisher ID**, leave
   **Fill empty slots with Google AdSense** unticked, and **Save and publish**. About two minutes
   later the site carries Google's verification meta tag on every page, and
   thelearningcurve.net/ads.txt lists your ID. No ads show yet.
3. **Verify and request review.** In AdSense → Sites, choose the **Meta tag** (or **Ads.txt**)
   method, tick that you've added it, click **Verify**, then **Request review**. Review usually
   takes a few days and can take two to four weeks.
4. **Set up the consent message.** AdSense → Privacy & messaging → European regulations: create
   and publish a message (Google's own consent tool is certified). Without it, visitors in the UK,
   Europe and Switzerland only get limited, non-personalised ads.
5. **Turn Auto ads off.** AdSense → Ads → By site → thelearningcurve.net: switch Auto ads off. The
   site places its own units; Auto ads would add extra ads Google chooses, including pop-up
   style "vignette" and anchor ads, which break the house rules above.
6. **Once approved, create three ad units.** AdSense → Ads → By ad unit → Display ads, responsive:
   one each for the billboard, medium rectangle and half page. Copy each unit's ID (the
   `data-ad-slot` number in its code).
7. **Switch on.** In the Ads tab, paste the three unit IDs, tick **Fill empty slots with Google
   AdSense**, and **Save and publish**.

The site loads the AdSense script only on pages with an ad slot (never on reviews or
comparisons). New units can take up to an hour to start showing ads; blank slots in the meantime
are normal.

## Files

- `src/data/ads.json`: the bookings and network settings (written by the ad manager)
- `src/lib/ads.ts`: the rules (slot sizes, which ad a slot shows), checked at build time, so a bad
  file fails the build rather than the live site
- `src/components/AdSlot.astro`, `src/components/SponsoredCard.astro`: the slots
- `src/pages/ads.txt.ts`: `/ads.txt`
- `public/ads/`: sponsor images
- `functions/api/admin/[[path]].ts` and `public/admin/index.html`: the ad manager
