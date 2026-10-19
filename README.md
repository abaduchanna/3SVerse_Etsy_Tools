# 3SVerse Etsy Tools

**Free, open-source, 100% client-side Etsy seller toolkit.** No signup, no API keys, no tracking — everything runs locally in your browser and nothing you type ever leaves the page.

![license](https://img.shields.io/badge/license-MIT-green) ![offline](https://img.shields.io/badge/offline-100%25-blue) ![deps](https://img.shields.io/badge/dependencies-zero-orange)

---

## Why this exists

Commercial Etsy research suites (Alura, eRank, EHunt/EtsyHunt) are paid, closed-source SaaS products. There is no open-source copy of them anywhere — and legally there cannot be, since their code and data are proprietary. **3SVerse Etsy Tools is an original, independent, MIT-licensed implementation** that covers the same core *feature categories* so that every seller can have a free baseline toolkit:

> This project is an original work. It uses **no code, no data, no assets, and no content** from Alura, eRank, EHunt, or Etsy. It is not affiliated with or endorsed by any of them.

## Tools included (v1.0.0)

| Tool | What it does |
|------|--------------|
| **Keyword Research** | Turn one seed keyword into 60+ long-tail ideas (audience / occasion / style / category formats). Each idea gets heuristic competition, demand, and opportunity scores, plus a taggable check (20-char Etsy tag limit). Export any result set to CSV. |
| **Tag Generator** | Paste a listing title, get up to 13 ranked, deduped tags — all within Etsy's 20-character tag limit, with live char counters, click-to-remove chips, and auto-fill from the ranked pool. |
| **Fee & Profit Calculator** | Full 2026 Etsy fee model: $0.20 listing, 6.5% transaction, region-based payment processing (US/UK/DE/AU/CA or custom %), Offsite Ads 12%/15%. Shows total fees, net profit, margin %, and break-even price. |
| **Listing Grader** | Paste a title + tags, get a 0-100 score across 8 weighted checks: title length, main keyword in first 40 chars, keyword stuffing, 13-tag usage, tag length limits, duplicates, phrase ratio, and tag-title overlap. |
| **Trend Buzz** | Score up to 12 keywords for seasonal timing (Christmas, Valentine, Halloween, Mother's Day, graduation...) and buyer-intent modifiers, with in-season / off-season flags. |

All scores are **local heuristics** — clearly labeled as estimates, never presented as live Etsy search data. They are designed for fast relative comparison between keyword candidates, not as absolutes.

## Run it

No build step, no install:

```bash
# Option 1 — just open it
open index.html          # macOS
xdg-open index.html      # Linux

# Option 2 — serve it
npx serve .
```

Or use the live GitHub Pages deployment (see the repo links column).

## Repo layout

```
etsy_tools_v100/
├── index.html    # single-page UI, 5 tool panels
├── styles.css    # 3SVerse dark theme
├── app.js        # helpers, tabs, keyword research, tag generator
├── extra.js      # fee calculator, listing grader, trend buzz
├── LICENSE       # MIT
└── README.md
```

## Fee reference

Defaults follow Etsy's published seller fee structure (listing $0.20, transaction 6.5%, Offsite Ads 12% or 15%, payment processing varies by country). Every field is editable — always verify current numbers at `etsy.com/seller-fees` before pricing decisions.

## Contributing

PRs welcome. Keep it dependency-free and 100% client-side; that is the whole point.

## License

[MIT](LICENSE) © 2026 Abad Umair Channa (3SVerse)
