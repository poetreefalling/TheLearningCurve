# The technology directory

The directory is the product database behind Discover, Compare and Intelligence. It matters more
than any page built on top of it: every profile, comparison, shortlist and market map is drawn
from these records. The schema in `src/content.config.ts` is the source of truth, and a build
fails if a record breaks it.

Nothing in the directory is shown on the site yet. Pages come in the next step of the rollout.

## Four linked records

| Record | Where | Holds |
| --- | --- | --- |
| Vendor | `src/data/directory/vendors/<id>.json` | The company: website, headquarters, founded, size, funding, ownership, status |
| Product | `src/data/directory/products/<id>.json` | One product, in one main category, with the fields below |
| Evaluation | `src/data/directory/evaluations/<product>-<yyyy-mm>.json` | A hands-on test: method version, date, tester, plan, scores |
| Article | `src/content/articles/…` | Tagged with `categories`, `products` and `vendors`, so it appears on their pages |

Ids are lowercase and hyphenated, and the file name is the id (`learnworlds.json` → `learnworlds`).

## Categories

Set in `src/data/directory/categories.json`, signed off 7 November 2026:

1. LMS Platforms (`lms-platforms`)
2. Course Platforms (`course-platforms`)
3. AI for Learning (`ai-for-learning`)
4. Authoring Tools (`authoring-tools`)
5. Assessment & Credentialing (`assessment-credentialing`)
6. Learning Analytics (`learning-analytics`)
7. Video & Interactive Learning (`video-interactive`)
8. Emerging Technologies (`emerging-technologies`)

A product has one main `category` and any number of `secondaryCategories`.

## Product fields

| Field | What goes in it |
| --- | --- |
| `name`, `website` | As the vendor styles them |
| `vendor` | The vendor record's id |
| `category`, `secondaryCategories` | Category ids |
| `platform` | The matching id in `src/data/platforms.json`, if there is one (that's where affiliate links live) |
| `summary` | Up to 300 characters, in our words, never the vendor's marketing copy |
| `primaryMarket` | `higher-education`, `schools`, `vet`, `corporate`, `government`, `creators`, `nonprofit` |
| `useCases`, `keyFeatures` | Short plain-English lists |
| `integrations` | Other products it connects to: "Canvas", "Microsoft Teams" |
| `standards` | Interoperability standards only: `lti-1.3`, `scorm-2004`, `xapi`, `cmi5`, `open-badges-3`… |
| `pricing` | Whether prices are public, the entry price as published, notes |
| `pricingModel` | Basis (`per-seat`, `per-active-user`, `flat`, `quote`…), free tier, trial |
| `deployment` | `cloud`, `self-hosted`, `hybrid` |
| `accessibility` | Standard claimed and the evidence (a VPAT or accessibility conformance report) |
| `security` | Certifications: "ISO 27001", "SOC 2 Type II" |
| `dataPrivacy` | Where data is stored, GDPR, Australian Privacy Act notes |
| `aiDisclosure` | Required for AI for Learning products: models used, whether customer data trains them |
| `evidence` | Independent research, case studies and evaluations, each with a link |
| `userSentiment` | Always empty for now (see the rules below) |
| `geographicAvailability` | Markets served |
| `alternatives` | Ids of comparable products |
| `commercialRelationship` | `none`, `affiliate`, `sponsor` or `vendor-subscriber`, with the start date |
| `assurance` | The evidence & assurance layer (below) |
| `status`, `lastVerified` | `active`, `beta`, `acquired`, `discontinued`, and the date the whole profile was last checked. `lastVerified` is left out while `draft` is true and required once it is false |
| `draft` | `true` keeps the record off production. A record publishes once it has its basics (name, vendor, category, website, summary, status) and a `lastVerified` date, whatever else is missing |
| `researchTasks` | Internal to-do list: open conflicts, sources to re-open. Never shown to readers, and never a reason to hold a record back |
| `dataGaps` | Internal name for fields we looked for and couldn't find or verify, each with a short note. Readers see "Research ongoing" in that field; the words "data gap" never appear on the site, and the notes stay internal |

Vendors have the same `draft`, optional `lastVerified`, `researchTasks` and `dataGaps`, plus
`ownershipDetail` (who owns it, in words, with provenance) and `legalEntity` (the contracting company).

## Evidence & assurance

The questions a procurement team asks before signing, and how well each answer is evidenced.
Each product can carry four areas, each with a `status`, a `finding` in our words, a `caveat` on
scope, `sources` and a `checked` date:

| Area | Covers |
| --- | --- |
| `accessibility` | Accessibility conformance report or accreditation, its standard, date and scope |
| `security` | SOC 2, ISO certifications and what they cover |
| `dataResidency` | Where data is stored and processed, Australia first |
| `ai` | AI providers and models, and whether customer data trains them |

Statuses, strongest first:

- `independently-evidenced`: a third-party report or certificate whose scope and date we have
  checked (an accessibility audit by an outside firm, a certificate from the certification body)
- `publicly-stated`: the vendor says it publicly; we have not seen the underlying report
- `vendor-confirmation-required`: the vendor says the evidence exists on request, or it is unclear
- `not-disclosed`: nothing public found

`procurementChecks` lists what a buyer should ask for before signing. The assurance layer is a
members' feature; the free profile shows the statuses only.

## Provenance: every fact says where it came from

Most fields are wrapped in a provenance record:

```json
"pricingModel": {
  "value": { "basis": "per-active-user", "trial": true },
  "source": "https://example.com/pricing",
  "checked": "2026-11-20",
  "origin": "verified"
}
```

- `source` is the page actually opened to get the value.
- `checked` is the date it was opened.
- `origin` is `verified` (we confirmed it ourselves, from the product or its documentation),
  `vendor-supplied` (the vendor told us, including through a claimed profile) or `estimated`
  (our best reading where the vendor doesn't say; use sparingly and never for prices).

Leave a field out rather than guess. An empty field is honest; a wrong one costs trust.

**Publish with gaps.** Most vendors don't publish everything we'd like to record, and that is
useful information in itself. A missing or unverifiable value is never a reason to hold a
record back: leave the field out, add an entry to `dataGaps` saying what was looked for, and
publish. The profile shows "Research ongoing" for that field.

"Research ongoing" is literal: we contact the product team for every open gap. When they answer,
record the value with `origin: "vendor-supplied"` and the page or document they pointed to as the
`source` (or, for an answer by email, our page that records it), then remove the gap. An answer
by email alone with nothing published stays `vendor-supplied` and is worth re-checking at the
next 90-day review.

## The rules

1. **Profiled is not evaluated.** A product with only a profile is *profiled*. It becomes
   *evaluated* only when an evaluation record exists from hands-on testing against the published
   method. Volume targets never turn one into the other.
2. **Methods are versioned.** `v1-course-platforms` is the published how-we-review method; the
   build checks that its overall score is 60% learning design and 40% business tools. `v2` is the
   cross-category framework, once published. Old scores are never re-weighted silently; a
   re-test is a new evaluation record.
3. **The vendor firewall.** Money can buy an enhanced profile, media, lead routing and clearly
   labelled sponsored research. It never touches scores, rankings, inclusion in the directory or
   editorial coverage. Every commercial relationship is recorded and shown on the profile.
4. **Re-check every 90 days.** A profile whose `lastVerified` is more than 90 days old is due for a
   re-check: prices first, then status, features and standards.
5. **No borrowed ratings.** Ratings and reviews are never copied from G2, Capterra, app stores or
   similar sites. `userSentiment` stays empty until there is a way to verify that reviewers
   actually use the product.
6. **Our words.** Summaries and feature lists are written fresh, never pasted from vendor pages.
7. **CredentialCraft** is Jim's own business. If it is ever listed, it carries the ownership note
   from `docs/editorial.md` and is never scored, ranked or placed in a comparison.

## Logos and screenshots

A product can carry `media`: a `logo` and any number of `screenshots`, stored in
`public/images/directory/<product-id>/` as WebP (screenshots at 1600 px wide plus an `-800` copy).

- **Logos** come from the vendor's own site or brand kit, unaltered, and identify the product on
  its own profile. They never imply endorsement, and we don't place them in ads or rankings.
- **Screenshots** are best when we took them ourselves (Jim's testing). A vendor's own product
  image is fine with its credit ("Image: 360Learning") and alt text that describes what's on
  screen. Never add words or claims to a screenshot.
- **Animated screenshots** (a GIF from the vendor or our own screen recording) are saved as
  animated WebP with a `still` first frame, which visitors who prefer reduced motion see instead.
  Set `width` when the capture is narrower than 1600 px, and `frame: true` for flat UI captures
  that need a border (not device mock-ups).

## Importing from the data-entry workbook

The first 25 LMS records were filled in a spreadsheet (one row per product and vendor, with a
source, date and origin beside each fact) and imported with:

```
python3 scripts/import-directory-xlsx.py <workbook.xlsx> --annotate <annotated.xlsx>
```

The importer updates the JSON records in place and keeps the fields the workbook doesn't cover
(summary, features, integrations, alternatives, evidence, assurance). It never guesses: a value
that is missing or doesn't fit the schema is left out and recorded in the record's
`dataGaps`. With `--annotate` it also writes a copy of the workbook
with those cells marked `*` and a comment saying why. Research tasks marked done (`y`) are closed.
Every record with a `lastVerified` date is published (`draft: false`); gaps don't hold it back.

## Adding a product

1. Make sure the vendor record exists; add it if not.
2. Copy the template below to `src/data/directory/products/<id>.json` and fill it from the
   vendor's own current pages, recording `source`, `checked` and `origin` for each fact.
3. Run `npm run build`. Fix anything it reports.

```json
{
  "name": "Example LMS",
  "vendor": "example-vendor",
  "category": "lms-platforms",
  "secondaryCategories": [],
  "website": "https://example.com/",
  "summary": "One or two sentences, in our words, on what it is and who it suits.",
  "primaryMarket": { "value": ["higher-education"], "source": "https://example.com/", "checked": "2026-11-20", "origin": "verified" },
  "standards": { "value": ["lti-1.3", "scorm-2004"], "source": "https://example.com/docs/standards", "checked": "2026-11-20", "origin": "verified" },
  "pricingModel": { "value": { "basis": "quote", "freeTier": false, "trial": true }, "source": "https://example.com/pricing", "checked": "2026-11-20", "origin": "verified" },
  "alternatives": [],
  "commercialRelationship": { "kind": "none" },
  "status": "active",
  "lastVerified": "2026-11-20"
}
```
