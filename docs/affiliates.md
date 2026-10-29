# Affiliate programs

Jim owns this file. The routine reads it but never changes it, and never sets `affiliateUrl` in
`src/data/platforms.json`.

## Status

| Platform | Network | Applied | Approved | `affiliateUrl` set | Terms confirmed in dashboard |
|---|---|---|---|---|---|
| Thinkific | PartnerStack | – | – | – | – |
| LearnWorlds | PartnerStack | – | – | – | – |
| Teachable | PartnerStack | – | – | – | – |
| Kajabi | Kajabi partner portal | Decide first: requires a paid Kajabi plan | – | – | – |

## Terms as researched (29 October 2026, from third-party listings, so unconfirmed)

| Program | Commission | Paid for | Cookie | Catch |
|---|---|---|---|---|
| Thinkific | 30% recurring; $150/month for Plus referrals | Lifetime (some listings say 12 months) | 90 days | Confirm duration once approved |
| LearnWorlds | 30% recurring (some listings say 25%) | Lifetime | 90 days | No PPC linking directly to learnworlds.com |
| Teachable | 30% recurring | First 12 months | 30 days | Short cookie, capped at a year |
| Kajabi | 100% of month one for first 4 referrals, then 10–20% recurring | While subscribed | 30 days | Must be a paying customer; no new referral in 12 months ends commissions; no paid search |

When a program approves Jim, replace its row with the terms his dashboard shows, with the date.
That becomes the source of truth.

## Rules for every article

1. Commission never decides what's covered, how it scores, or where it ranks. A platform with
   no affiliate program gets the same treatment.
2. Disclosure line above the first affiliate link (wording in `docs/editorial.md`).
3. Affiliate links use `rel="sponsored noopener"` and come only from `platforms.json`.
4. No paid search on platform brand names, and no ads linking straight to a platform.
5. Don't quote a platform's prices without the "Prices checked on" date.
6. CredentialCraft is Jim's own business: disclosed inline, never ranked or scored against
   the platforms.

## Quarterly terms check

A separate scheduled task, first Monday of January, April, July and October: compare each
program's public terms page and Jim's notes above, and open an issue (not a PR) listing any
change.
