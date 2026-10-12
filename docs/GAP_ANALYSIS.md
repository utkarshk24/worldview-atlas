# WorldView Atlas — Gap analysis (12 October 2026)

Audit of version 1 against the project brief and `MASTER_PROMPT.md`, with what was fixed in version 2 and what remains.

## Fixed in v2

| # | Gap found | Fix |
|---|---|---|
| 1 | **United States and Netherlands had no profile text.** Factbook files were matched by internet domain, and `.us`/`.nl` are shared with US Minor Outlying Islands and Caribbean Netherlands. | Match by country name first, then domain, preferring UN members. All 193 UN members now have profiles (checked by `tools/validate.py`). |
| 2 | **HDI missing** (required by the brief). | Added UNDP Human Development Report 2025 values (2023 data) for all 193 ranked countries; HDI tiles, HDI map colouring, comparison row. Table validated: 193 rows, ranks consistent with values. |
| 3 | **Gini only as raw text.** | Parsed for 148 countries with year; Gini tile, map colouring, comparison row. |
| 4 | **GDP was 2023** for most countries. | Uses the newer 2024 Factbook figure where available (194 countries; India $3.91 trillion, 2024). Every figure shows its source and year. |
| 5 | **Leaders stale** after the Factbook froze in Feb 2026. | Verified leadership updates with sources for Bangladesh, Nepal, Myanmar, Thailand, United Kingdom, Iran and Israel (election date). On the deployed site, current officeholders also load live from Wikidata for every country. |
| 6 | **27 small UN members were unclickable** (Singapore, Maldives, Monaco, Vatican, Pacific and Caribbean states). | Clickable dots at their capitals, coloured by the active map mode. |
| 7 | **No education & health section** (brief and master prompt Tab 8). | New "Education & Health" tab: HDI, life expectancy, literacy, infant mortality tiles and the Factbook health and education fields. |
| 8 | **No population pyramid.** | Male/female pyramid from Factbook age structure. |
| 9 | **Major cities only for 5 countries.** | City cards with population for every country from Factbook urban areas; curated significance kept for the five deep profiles. |
| 10 | **No emblem image, anthem audio, weather or exchange rate.** | Live on the deployed site: coat of arms and anthem recording (Wikidata/Wikimedia Commons), 7-day weather at the capital (Open-Meteo), rate against the rupee and dollar (open.er-api.com). The Claude preview cannot reach outside services and says so in the profile. |
| 11 | Groupings out of date. | Seychelles added to the Colombo Security Conclave (joined Nov 2025); BRICS note updated for India's 2026 chair and Saudi Arabia's unconfirmed status. |
| 12 | Curated facts out of date. | India: BRICS 2026 chair, India–EU FTA concluded 27 Jan 2026. USA: Feb 2026 framework trade deal (tariff cut toward 18%). Germany: India–EU FTA. |
| 13 | Search failed on typos. | Typo-tolerant fallback ("jermany" finds Germany). |
| 14 | Phone: the profile sheet hid the map. | Collapse/expand button on the sheet. |
| 15 | No offline use on the deployed site. | Service worker caches the app and data after the first visit; web app manifest for "Add to home screen". |
| 16 | No automated checks. | `tools/validate.py` runs in the deploy workflow and blocks a broken deploy. |

## Remaining gaps

| Gap | Why it remains | Suggested next step |
|---|---|---|
| Profile text in Hindi and Marathi | The UI is fully translated; translating 241 profiles accurately needs the lexicon-enforced pipeline (master prompt §7). | Build the translation pipeline with human review for the five curated profiles first. |
| Live intelligence feed (MEA, PIB, RSS) | Needs a backend to fetch, score and translate news. | Phase 3 of the master prompt: FastAPI worker + a small JSON feed the site reads. |
| Culture, cuisine, sports, tourism for 236 countries | No open structured dataset; must be curated. | Extend `curated.json` in batches, starting with India's neighbourhood and Quad partners. |
| Driving side, plug type, emergency numbers for all countries | Only in the five curated profiles. | Add an open dataset (for example the REST Countries `car.side` field) at build time. |
| French overseas regions (Réunion, Guiana, etc.) open France | Natural Earth draws them as part of France. | Use Natural Earth admin-0 map units for separate shapes. |
| Leaders for countries not listed above | Verified only where change was likely; the rest rely on the Feb 2026 Factbook (live Wikidata fixes this on the deployed site). | Re-run leadership verification monthly. |
| Brazil runoff (25 Oct 2026) | Future event. | Update `curated.json` after the result. |

## Sources used for verification

UNDP HDR 2025 statistical annex; Dawn (Bangladesh, 17 Feb 2026); Wikipedia, Premiership of Balen Shah; ConstitutionNet (Myanmar, Apr 2026); Thailand PRD (19 Mar 2026); EWN (UK, 20 Jul 2026); Wikipedia, Mojtaba Khamenei; Business Today BRICS explainer (Sep 2026); Drishti IAS (Seychelles joins CSC, Nov 2025); Morgan Lewis (US–India trade deal, Feb 2026); European Commission (EU–India FTA, Jan 2026).
