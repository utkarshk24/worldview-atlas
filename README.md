# WorldView Atlas — Explore Every Nation

An interactive world map built from the Indian strategic perspective. Click any country for a structured profile; switch on the **India Lens** for groupings, corridors and maritime chokepoints. The interface is available in **English, हिंदी and मराठी**.

## Features

- Clickable map of every country, as a flat Equal Earth map or a draggable 3D globe
- Multilingual search ("Bharat", "भारत", "Japan", "जपान")
- Choropleths: region, population, density, area, GDP, GDP per capita, HDI, Gini, groupings shared with India
- 12-tab country profiles for 241 countries (all 193 UN members), including Education & Health; deep hand-curated profiles for India, the USA, Japan, Brazil and Germany
- HDI (UNDP HDR 2025) and Gini for every country, as tiles and map colouring; population pyramids; major cities with population
- Clickable dots for small states (Singapore, Maldives, Monaco, Vatican, island nations)
- **Live on the deployed site:** current officeholders (Wikidata), coat of arms and anthem recording (Wikimedia Commons), weather at the capital (Open-Meteo), exchange rate against ₹ and $ (open.er-api.com)
- Verified leadership updates since February 2026 (Bangladesh, Nepal, Myanmar, Thailand, UK, Iran, Israel)
- Works offline after the first visit (service worker) and can be added to a phone's home screen
- India Lens: Quad, BRICS, SCO, G20, I2U2, IMEC, BIMSTEC, SAARC, IORA, Colombo Security Conclave; 15 chokepoints; IMEC, INSTC and Indian Ocean sea-lane layers; bilateral matrix; EN/HI/MR strategic lexicon
- Map edition switch: **India (official)**, per the Survey of India depiction, or **Global (de facto)**
- Dark/light themes, favourites, recently viewed, two-country comparison, copy summary, read aloud
- Deep links: `#IND`, `#JPN.government`, `#BRA.india`

## Repository layout

```
site/                 ← everything GitHub Pages serves
  index.html          ← the app (HTML, CSS and JS in one file)
  data/               ← countries, curated profiles, two boundary editions, profile shards
tools/                ← scripts that rebuild site/data from the open datasets
  src/                ← editable sources (index.src.html, app.js, i18n.js, strategic.js)
docs/MASTER_PROMPT.md ← the product and architecture brief
.github/workflows/pages.yml
```

## Deploy

1. Push this repository to GitHub (branch `main`).
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow runs on every push to `main`. The site appears at `https://<your-username>.github.io/<repo-name>/`.

GitHub Pages on a free account requires a **public** repository.

## Run locally

The app loads its data with `fetch`, so it must be served over HTTP:

```bash
cd site
python3 -m http.server 8000
# open http://localhost:8000
```

## Checks

`python3 tools/validate.py` checks every country, both map editions, profiles, HDI and the leadership file. The deploy workflow runs it first and stops if anything fails.

## Rebuilding the data

The `tools/` scripts regenerate `site/data` from:
[world-countries](https://github.com/mledoze/countries), [datasets/population](https://github.com/datasets/population) and [datasets/gdp](https://github.com/datasets/gdp) (World Bank),
[factbook.json](https://github.com/factbook/factbook.json), [Natural Earth](https://github.com/nvkelso/natural-earth-vector) admin-0 (default and India point-of-view, simplified with mapshaper),
[flag-icons](https://github.com/lipis/flag-icons) and [countries-and-timezones](https://github.com/manuelmhtr/countries-and-timezones).

To edit the app itself, change files in `tools/src/`, then run `python3 tools/inline.py` to rebuild `site/index.html`.

## Data notes

- Population: World Bank 2025. GDP: World Bank, or the newer Factbook 2024 figure where available (source shown on every figure).
- HDI: UNDP Human Development Report 2025 (2023 data).
- Gap analysis and remaining work: [docs/GAP_ANALYSIS.md](docs/GAP_ANALYSIS.md).
- Country profiles: CIA World Factbook, **final edition (frozen February 2026)**. Leaders and elections for non-curated countries may have changed since.
- Curated profiles (IND, USA, JPN, BRA, DEU): checked 12 October 2026. Brazil's presidential runoff is on 25 October 2026; update after the result.
- Profile text is in English; the UI is fully localised.

See [DATA-LICENSES.md](DATA-LICENSES.md) for attributions.
