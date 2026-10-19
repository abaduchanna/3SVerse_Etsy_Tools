# Clean-room research record

Date: 2026-10-19

## Goal

Build an independent, open-source Etsy research suite from public feature descriptions and public pages. No proprietary source code, private API, private dataset, copied branding, or access-control bypass is used.

## Open-source search

| Repository | License finding | Decision |
|---|---|---|
| `vtoxi/EtsyHunt` | MIT license file verified | Used as attributed technical base |
| `brainbytes-dev/etsy-oracle` | AGPL-3.0 | Not incorporated into this MIT project |
| `rxpelle/etsy-scout` | README mentions MIT but no license file verified | Not incorporated |
| `GamalMehI/etsy-keyword-tool` | No license file verified | Not incorporated |

No complete open-source clone of Alura, eRank, or EHunt was found.

The public feature behavior of EtsyHunt, etsy-oracle, etsy-scout, and etsy-keyword-tool was also mapped. Implemented equivalents include the local pipeline, transparent review-velocity sales estimate, recursive keyword research action, product/shop comparison, reverse listing lookup, competitor snapshots, Etsy Ads CSV analysis, 13-tag export, niche scoring, and JSON/CSV export. AGPL or unverified-license code was not copied.

## Public feature evidence

REA captured only public pages in a controlled browser:

- Alura public homepage — `ev_f3fc7ef125681dbde3d5eee6226395b40a6aca7270f986332f1ed269c2d9b9a7`
- eRank public features page — `ev_2daec213354c7f7921ca771a2b093bf698b098ae2cf3650545176adbe6b2412a`
- EHunt public homepage — `ev_0343380958a3fffa2420e805cf8bb1999bfc81d99be4a0562c4f00b7c9eab2cf`

Observed public feature families included keyword, product, shop, competitor, listing, tag, profit, trend, tracking, and AI-assisted content tools. This implementation maps only features that can be supported honestly by public Etsy pages, local calculations, user-entered content, or an optional page the logged-in user is authorized to view.

## Non-equivalence boundary

Commercial vendors' historical databases, search-volume models, ad datasets, proprietary scoring, server infrastructure, and private account features are not available publicly. The project does not invent exact values or present estimates as vendor data.

## Attribution

The extension retains the upstream MIT license and repository history. See `NOTICE` and `LICENSE`.
