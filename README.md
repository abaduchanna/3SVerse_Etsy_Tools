# 3SVerse Etsy Tools

Open-source, local-first Etsy research suite. It combines public-data workflows commonly found in Alura, eRank, and EHunt without copying their source code, branding, private APIs, or proprietary datasets.

## Included tools

- Keyword discovery, Etsy search snapshots, listing audits, and opportunity reports
- Product and shop research tables
- Listing title, description, and 13-tag optimizer
- Etsy-compatible tag generator
- Profit, fee, cost, and margin calculator
- Local competitor tracker
- Transparent sales/revenue estimator from review velocity
- Etsy Ads CSV import, conversion-gap analysis, and ROAS
- Reverse listing-to-keyword lookup over captured research
- JSON and CSV export
- Optional logged-in eRank workflow for data the user is authorized to view
- Full dashboard plus compact extension popup

## Install

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome, Edge, Brave, or another Chromium browser.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this repository folder.
5. Pin **3SVerse Etsy Tools** and open its dashboard.

## Research pipeline

| Step | Action | Result |
|---|---|---|
| 1 | Discover | Related phrases from public Etsy suggestions |
| 2 | Capture | Public Etsy search-result snapshots |
| 3 | Audit | Listing and shop signals visible to the user |
| 4 | Score | Evidence-based opportunity report |

The extension stores research in `chrome.storage.local`. It has no 3SVerse account requirement, license check, analytics, or remote code. See [PRIVACY.md](PRIVACY.md).

## Data accuracy

Public page values are captured as displayed. Estimates are labeled as estimates. Exact commercial-tool search volume, click, ad, and historical databases are not fabricated. Optional eRank fields appear only when the user runs the authorized logged-in workflow and those values are visible in their account.

## Package

```powershell
.\scripts\package.ps1
```

The release ZIP is created in `dist/`.

## Clean-room record

Feature research, license boundaries, and REA evidence identifiers are documented in [docs/CLEAN_ROOM_RESEARCH.md](docs/CLEAN_ROOM_RESEARCH.md). It also records the independent feature mapping from EtsyHunt, etsy-oracle, etsy-scout, and etsy-keyword-tool. Upstream attribution is preserved in [NOTICE](NOTICE).

## License

MIT. See [LICENSE](LICENSE). Alura, eRank, EHunt, and Etsy remain trademarks of their respective owners. This project is independent and not endorsed by them.
