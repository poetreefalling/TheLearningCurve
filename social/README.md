# Instagram: @learn1ng.curve and Curiosity Corner

The Instagram account is a curiosity account: how the brain learns, remembers and gets fooled, through
puzzles, riddles, illusions and the science behind them. Every post also lives on the site at
/curiosity/ (Curiosity Corner), which is where the bio links and where the media is hosted for
Instagram to fetch. Strategy, pillars, series and voice: the "Growth Strategy" doc in the Learning
Curve project. This file is the runbook the scheduled tasks follow.

**Goal:** 10,000 followers by mid-March 2027, about 625–715 a week. Judge everything on sends and
reach to non-followers first, then follows.

## The rules that never bend

- Every factual claim names a source that was opened and read. No invented numbers, studies or quotes.
- Riddles and classic puzzles are retold in our own words and art, never copied from other accounts.
- "Ripped from the research" photocopies use only papers whose licence allows reproduction
  (Creative Commons Attribution: most PLOS, Frontiers and PMC open-access papers), with the licence
  credited on the card. Other papers get the placeholder-lines version (one verbatim sentence under
  15 words).
- Australian spelling, no emoji, brand fonts and colours (docs/design.md).
- Jim approves by merging the PR. Nothing is published to Instagram before its media is live on main.
- Never spend ad money. Boost recommendations go in the weekly scorecard for Jim to approve.

## Weekly rhythm

- Every day at 18:00 Sydney: one reel. Three a week go out as Trial Reels (non-followers first).
- Mondays: Can You Solve It? carousel. Thursdays: Memory Lab carousel. Saturdays: Myth or Fact? or
  Brain Fact. Every two to three weeks a Ripped from the research image replaces a Brain Fact.
- Daily Story riddle with a quiz sticker (once Stories can be produced as 1080×1920 images).

## How a post is made

1. **Carousel or image:** write the slides as `social/designs/<slug>/01.html`, `02.html`… by copying
   the closest existing design (1080×1350, `<!--FONTS-->` marker, brand template). Covers follow the
   series looks: Can You Solve It? (marigold, numbered tile), Brain Glitch (ink, marigold offset
   headline), Memory Lab (paper with notebook grid), Myth or Fact? (paper, big marigold ?), Brain
   Fact (ink, giant numerals). Every carousel ends on the marigold "For teachers and designers" card.
   Render with `python3 social/tools/render_slides.py <slug>` and LOOK at every JPEG.
2. **Reel:** copy `social/reels/stop-re-reading/` to `social/reels/<slug>/`, rewrite `reel.html`
   (keep `window.renderAt(t)`, 1080×1920, keep text out of the bottom 380px and right 120px where
   Instagram's UI sits) and `scenes.json`. 15–20 seconds; a hook that lands inside 3 seconds; one idea;
   end on a reason to send it. Render with `python3 social/tools/render_reel.py <slug> [voice.mp3]`,
   then grab frames with ffmpeg at each scene's busiest moment and look at them.
3. **Voice (reels):** ElevenLabs, voice "Tiffany P" (voice id L7sX0VDzoo4LqEWnA2wp), model eleven_v4,
   confident and punchy, written to the scene timings. If the audio file can't be retrieved into the
   session, publish the reel silent (on-screen text carries it) and say so in the PR.
4. **Site entry:** `src/data/curiosity/<slug>.json` (schema in src/content.config.ts) with `published`
   set to the queue date at 12:00 Sydney, the caption as `body`, every slide's alt text, the
   teachers-and-designers line and the sources.
5. **Caption:** in the site entry's body plus a send prompt and 5 hashtags. Keep it under 2,200
   characters.

## Scheduled tasks

- **Weekly production (Sundays):** produce every `planned` item in social/queue.json dated in the
  next 8 days, plus enough new `planned` items to keep the queue 14 days ahead. One PR,
  `social/week-<yyyy-mm-dd>`, titled "Instagram week of <date>: <n> posts". Mark produced items
  `ready` in the PR. Build must pass.
- **Daily publishing (18:00 Sydney):** publish the queue item dated today whose media URL on
  https://thelearningcurve.net returns 200, via the Windsor.ai for Social Media connector, account
  "The Learning Curve (learn1ng.curve)", id 17841479885322798. Never post to Film Fore. Before posting,
  read the account's recent media and skip anything already posted (idempotent). Report the permalink.
- **Weekly scorecard (Mondays):** followers, reach to non-followers, sends, saves and the best post,
  against the 625-a-week pace, with one boost recommendation for Jim to approve.
