# MASTER PROMPT — WorldView: Global Atlas & India Strategic Intelligence Platform

> Combines three source prompts: (1) the Country Profile Knowledge Engine, (2) the India-perspective Geopolitical Intelligence Dashboard, and (3) the WorldView Interactive Atlas spec. Where they overlapped, the stronger version was kept; where they conflicted, the resolution is noted.

---

## 0. Role

Act simultaneously as:

1. **Principal Software Architect & Lead Full-Stack Engineer** — owns system design, code quality, performance, and delivery.
2. **Senior Geopolitical Analyst (Indian foreign policy / strategic studies)** — owns the India Lens: framing, terminology, impact analysis.
3. **Authoritative Knowledge Engine** — owns every fact shown in a country profile: accurate, current, sourced, neutral.
4. **Principal Product Designer** — owns UX: fast, beautiful, accessible, consistent across all ~200 countries.

---

## 1. Product Vision

**WorldView — Explore Every Nation.** A production-grade, interactive world map. Click any country and get an encyclopedic, consistently structured profile. Switch on the **India Lens** and the same map becomes a strategic intelligence console: groupings, corridors, chokepoints, bilateral posture, and live, translated event tracking — in **English, हिंदी and मराठी**.

### Non-negotiable principles
- **Never invent information.** Unknown, disputed or unavailable → say so explicitly in the UI.
- **Every volatile number carries an "as of" date and a source** (population, GDP, leaders, elections, indices). Hover/tap on any figure reveals source + year.
- **Current facts vs. historical context are visually distinct.**
- **Neutral, encyclopedic tone** in profiles; the India Lens is clearly labelled as an analytical perspective, not as neutral fact.
- **Uniformity:** every country uses the same template; missing fields render an explicit "Not available" state, never silently disappear.
- **Disputed territories:** show the commonly recognised version and name the dispute neutrally. Provide a *map edition* setting (see §4.3).

---

## 2. Phased Delivery

| Phase | Scope | Exit criteria |
|---|---|---|
| **P1 — Atlas** | Map, search, choropleths, country drawer with all tabs, compare, favourites, recently viewed, dark/light, offline cache, EN/HI/MR UI | All countries clickable; 5 fully hand-curated profiles (India, USA, Japan, Brazil, Germany); all others from APIs + static dataset |
| **P2 — India Lens** | Grouping overlays (Quad, BRICS, SCO, G20, I2U2, BIMSTEC, SAARC, IORA, ASEAN…), maritime chokepoints, IMEC corridor, India Bilateral Matrix, distance/neighbourhood analytics | Lens toggle works on any country; layer toggles performant |
| **P3 — Live Intelligence** | Ingestion pipeline, NER, impact scoring, 3-bullet briefs, trilingual translation with lexicon, live ticker, alert system | < 5 min ingest-to-screen latency; human-review queue for high-impact items |
| **P4 — Hardening** | Analyst workflows, auth/roles, audit trail, SEO, monitoring, load testing | SLOs met; accessibility AA |

---

## 3. Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js (App Router) + React + TypeScript + Tailwind CSS** | SSR/ISR for SEO on `/country/[iso3]` pages |
| Motion | **Framer Motion** | Drawer/bottom-sheet, tab transitions |
| Map (2D/3D) | **MapLibre GL JS + deck.gl** (vector tiles, globe projection, arcs/paths/scatter layers) | Replaces react-simple-maps/Leaflet: needed for layer toggles, 3D globe, and thousands of live event points. Keep a **d3-geo SVG fallback** for low-end devices |
| Charts | **Recharts** (GDP trend, population pyramid, religion pie, language bars) | |
| i18n | **next-intl** + ICU messages; `Intl.DisplayNames` for country/language/currency names in `hi`/`mr` | Native, accurate localized names |
| State | Zustand (UI state) + TanStack Query (server data, caching) | |
| Offline | Service worker (Workbox) + IndexedDB for viewed countries | Spec asked for localStorage; IndexedDB handles the payload sizes |
| Backend API | **Python FastAPI** | Shares code with the NLP pipeline |
| Pipeline | Celery/Arq workers, Redis streams | |
| Data | **PostgreSQL + PostGIS** (geometry, events), **Redis** (cache, pub/sub for ticker) | |
| Search | Postgres full-text + trigram (or Meilisearch) across EN/HI/MR | |
| LLM orchestration | LangChain or LlamaIndex; structured JSON outputs validated against schemas | |
| Realtime | WebSocket / Server-Sent Events from FastAPI | |
| CI/CD | GitHub Actions, Playwright E2E, Lighthouse CI | |

---

## 4. Map & Cartography

### 4.1 Interaction
- Hover → country name tooltip (in active language) + one key metric for the active choropleth.
- Click → detail drawer (right slide-in on desktop, bottom sheet on mobile) and deep-linkable URL `/country/IND?tab=economy&lang=hi`.
- Zoom, pan, drag, double-click zoom, keyboard navigation (arrow keys pan, +/- zoom, Tab cycles countries).
- Search bar with fuzzy, multilingual autocomplete (e.g. "Bharat", "भारत", "Japan", "जपान") → fly-to + highlight.
- 2D map ↔ 3D globe toggle.

### 4.2 Choropleths (toggle)
Continent/region · Population · Population density · Area · GDP (nominal) · GDP per capita · HDI · India grouping membership. Every choropleth shows its legend, unit, source and year.

### 4.3 Boundaries & editions
- Base geometry: **Natural Earth** admin-0 (with all 193 UN members + Taiwan, Kosovo, Palestine, Vatican City, Western Sahara handled explicitly).
- **Map edition setting:** *Global (de facto)* and *India (official)*. The India edition uses Natural Earth's India point-of-view dataset so Jammu & Kashmir and Ladakh render per the Survey of India official map — required for maps published in India. Other editions can be added the same way. Disputed areas get a hatched style and a neutral explainer.

### 4.4 Strategic layers (India Lens)
Maritime trade routes · Chokepoints (Malacca, Hormuz, Bab el-Mandeb, Suez, Lombok, Sunda, 6°/9°/10° channels, Taiwan Strait, Panama, Gibraltar, Bosporus) · **IMEC corridor** · INSTC · Energy pipelines · Defence bases (open-source only) · Regional hotspots · Live events (P3).

---

## 5. Country Profile — Unified Template

The profile generator (human curator or LLM) must output **exactly** this structure, in this order. Tabs in the UI map 1:1 to sections.

**Tab 1 — Overview & Identity**
Common / official / native name · Capital (lat/long, population, significance) · Continent, subregion, hemisphere · ISO 3166-1 alpha-2 / alpha-3 / numeric · TLD · Calling code · Time zones · Driving side · Date format · Currency (name, ISO code, symbol, exchange rate vs INR & USD with date) · National motto · National anthem (name, description; audio + licensed lyrics only) · Flag (image + design & symbolism) · Coat of arms / emblem (image + description) · National day · National animal, bird, flower, sport, dish · Emergency numbers · Plug type & voltage.

**Tab 2 — Geography & Territory**
Total / land area (km², sq mi, world rank), water % · Coastline · Land borders · Highest & lowest points · Mountains, rivers, lakes, deserts, islands · Climate zones, seasons, best time to visit · Natural resources · Natural hazards · Environmental issues · Mini terrain/satellite map (OpenStreetMap).

**Tab 3 — People & Demographics**
Population (estimate + year + rank) · Density · Growth rate · Age structure / median age (population pyramid) · Sex ratio · Ethnic groups · Official & widely spoken languages (with % speakers, script) · Religions (% chart) · Literacy · Life expectancy (M/F/overall) · Urban vs rural · Top 8–10 cities with population **and significance** (e.g. "Mumbai — financial capital") · Diaspora.

**Tab 4 — Government & Politics**
Government type · Head of state (name, photo, since) · Head of government (name, photo, since) · Ruling party/coalition (ideology, leader) · Main opposition · Legislature (name, uni/bicameral, houses, seats) · Judiciary · Constitution (adopted, major amendments) · Administrative divisions (with count) · Last & next election, electoral system · Stability notes · Corruption Perceptions Index, government stability index.

**Tab 5 — Economy**
GDP nominal & PPP (total, per capita, rank, year) · Growth · Inflation · Unemployment · Gini · HDI + rank · Central bank · Fiscal year · Industries · Exports / imports · Trading partners · Ease of doing business / cost of living · Strengths & challenges · GDP trend chart.

**Tab 6 — Foreign Relations & Defence**
Memberships (UN, NATO, EU, ASEAN, AU, BRICS, Quad, SCO, G20, …) · Major bilateral relationships · Allies / rivals · Military (active personnel, branches, doctrine, capabilities) · Defence budget (% GDP) · Nuclear status · Recent diplomatic/military developments (dated).

**Tab 7 — Society, Culture & Daily Life**
Culture & values · Etiquette · Traditional clothing · Festivals & holidays · Cuisine & street food · Music, dance, art, literature · Sports & achievements · Media & press freedom · UNESCO sites · Famous personalities · Nobel laureates · National awards.

**Tab 8 — Education & Health**
Education system · Top universities · Education index · Healthcare system · Life expectancy · Infant mortality · Hospital beds per 10k · Major health issues.

**Tab 9 — Tourism & Travel**
Top attractions · Visa requirements for Indian passport holders (and generic) · Annual arrivals · Safety/advisory · Major international airports.

**Tab 10 — Infrastructure & Communication**
Internet users %, speeds, mobile connections · Roads, rail, airports, seaports · Energy mix, electricity production.

**Tab 11 — History**
Era timeline (ancient → modern, vertical timeline UI) · Independence/foundation (date, from whom, story) · Colonial history · 5–10 pivotal events · Former names · Founder / father of the nation · Flag history.

**Tab 12 — India Lens** *(analytical perspective, clearly labelled)*
Shared groupings with India · Diplomatic relations since · Strategic partnership level · Key agreements/MOUs (dated) · Trade with India (exports/imports, top items, year) · Defence cooperation · Energy links · Diaspora size & safety notes · Chokepoint/corridor relevance · Impact score (−10…+10) on Indian interests with rationale · Recent India-related events (from P3 pipeline).

**Tab 13 — Quick Facts**
5–7 lesser-known, verifiable facts.

**Footer — Sources & Data Notes:** one line naming source types (UN, World Bank, IMF, national statistics office, MEA, etc.) with retrieval dates.

### Knowledge-engine rules (for any LLM generating profiles)
- Use the most recent reliable data; state the year for every volatile figure.
- Distinguish current facts from history.
- Describe flags, emblems, anthems accurately; the UI renders the actual media.
- If multiple official names or disputed territory exist, use the commonly recognised version and note the dispute neutrally.
- Output must validate against the Country JSON Schema (§9.1); unknown → `null` + `note`, never a guess.

---

## 6. Live Intelligence Pipeline (P3)

```
Sources ──► Ingest ──► Normalise/Dedup ──► NER & Geocode ──► Classify (pillar)
  │                                                          │
  │                                       Impact scoring (−10…+10, India + regional stability)
  │                                                          │
  └─ MEA, PIB, RSS, news APIs, trade data, OSINT            3-bullet brief (EN)
     (AIS vessel flows, ADS-B, satellite alerts)             │
                                              Translate HI / MR with Lexicon ─► QA checks
                                                             │
                                  PostGIS store ─► Redis pub/sub ─► Ticker / Alerts / Map
```

- **Entity extraction:** countries, heads of state/government, agreements, ports, sanctions, strategic assets, commodities.
- **Strategic pillars:** Defence & Security · Trade & Multilateral Deals · Maritime Chokepoints · Energy & Commodities · Diaspora & Soft Power · Bilateral Relations.
- **Impact scoring:** two scores (Indian strategic interest, regional stability) with a written rationale and the entities driving the score; scores ≥ |7| go to a human-review queue before alerting.
- **Briefs:** exactly 3 bullets, source-linked, timestamped, in EN + HI + MR.
- **Provenance:** every event keeps original URL, publisher, published time, language, and model version used.

---

## 7. Multilingual Engine

- UI fully localised in **English, हिंदी, मराठी**, instant switch, persisted per user; optional side-by-side view (EN + HI/MR).
- **Geopolitical Terminology Lexicon** (versioned table): canonical EN term → approved HI/MR rendering, transliteration, "do not translate" flag, context notes. Examples: Strategic Autonomy → सामरिक स्वायत्तता / सामरिक स्वायत्तता; Line of Actual Control (LAC) → वास्तविक नियंत्रण रेखा (LAC); Freedom of Navigation → नौवहन की स्वतंत्रता / नौवहन स्वातंत्र्य; Global South → ग्लोबल साउथ / वैश्विक दक्षिण.
- Translation prompt enforces lexicon terms, keeps acronyms, transliterates proper nouns phonetically, and prefers MEA-standard vocabulary over literal prose.
- Automated QA: lexicon-term presence check, number/date parity check between EN and target, back-translation similarity threshold.
- Use `Intl.DisplayNames` / CLDR for country, language and currency names.

---

## 8. Dashboard & UX Specification

### 8.1 Layout
- **Header:** "WorldView — Explore Every Nation", global search, language toggle (EN/हिं/मरा), theme toggle, India Lens toggle.
- **Map canvas** full-bleed; floating layer & choropleth panel; legend bottom-left.
- **Country drawer:** flag as blurred hero background, sticky tabs, skeleton loaders, error states with retry.
- **Widgets (India Lens):** Live Intelligence Ticker · India Bilateral Matrix · Trade & Supply-Chain Radar (crude, semiconductors, fertiliser, defence imports) · Strategic Alert System · Chokepoint monitor.

### 8.2 Features
Compare two countries side-by-side · Favourites · Recently viewed · Share/copy link · Text-to-speech for overview (EN/HI/MR voices) · Offline for viewed countries · Keyboard shortcuts (`/` search, `L` lens, `T` theme, `Esc` close).

### 8.3 Design system
Glassmorphism panels on a deep-navy dark theme and a paper light theme; one accent (saffron) for India Lens elements; numeric figures always carry an icon, unit and as-of chip; charts follow the same palette; WCAG 2.2 AA; respects reduced-motion.

---

## 9. Data Schemas

### 9.1 Country (abridged JSON Schema)
```json
{
  "$id": "country.schema.json",
  "type": "object",
  "required": ["cca3", "name", "updatedAt", "sources"],
  "properties": {
    "cca2": {"type": "string"}, "cca3": {"type": "string"}, "ccn3": {"type": "string"},
    "name": {"type": "object", "properties": {
      "common": {"type": "string"}, "official": {"type": "string"},
      "native": {"type": "string"}, "i18n": {"type": "object"}}},
    "capital": {"type": "object", "properties": {
      "name": {"type": "string"}, "latlng": {"type": "array"}, "significance": {"type": "string"}}},
    "metrics": {"type": "object", "additionalProperties": {"$ref": "#/$defs/metric"}},
    "government": {"type": "object"},
    "indiaLens": {"type": "object"},
    "sources": {"type": "array", "items": {"type": "object", "properties": {
      "name": {"type": "string"}, "url": {"type": "string"}, "retrieved": {"type": "string"}}}},
    "updatedAt": {"type": "string", "format": "date-time"}
  },
  "$defs": {
    "metric": {"type": "object", "required": ["value", "year", "source"], "properties": {
      "value": {"type": ["number", "string", "null"]}, "unit": {"type": "string"},
      "year": {"type": "integer"}, "source": {"type": "string"}, "rank": {"type": "integer"},
      "note": {"type": "string"}}}
  }
}
```

### 9.2 Geopolitical event (JSON Schema)
```json
{
  "$id": "event.schema.json",
  "type": "object",
  "required": ["id", "publishedAt", "pillar", "countries", "brief", "source"],
  "properties": {
    "id": {"type": "string", "format": "uuid"},
    "publishedAt": {"type": "string", "format": "date-time"},
    "pillar": {"enum": ["defence_security", "trade_multilateral", "maritime_chokepoints",
                         "energy_commodities", "diaspora_soft_power", "bilateral"]},
    "countries": {"type": "array", "items": {"type": "string", "pattern": "^[A-Z]{3}$"}},
    "entities": {"type": "array", "items": {"type": "object", "properties": {
      "type": {"enum": ["person", "agreement", "port", "sanction", "asset", "org", "commodity"]},
      "name": {"type": "string"}, "wikidata": {"type": "string"}}}},
    "geometry": {"type": "object", "description": "GeoJSON Point/LineString"},
    "impact": {"type": "object", "properties": {
      "india": {"type": "integer", "minimum": -10, "maximum": 10},
      "regionalStability": {"type": "integer", "minimum": -10, "maximum": 10},
      "rationale": {"type": "string"}}},
    "brief": {"type": "object", "properties": {
      "en": {"type": "array", "minItems": 3, "maxItems": 3},
      "hi": {"type": "array", "minItems": 3, "maxItems": 3},
      "mr": {"type": "array", "minItems": 3, "maxItems": 3}}},
    "source": {"type": "object", "properties": {
      "publisher": {"type": "string"}, "url": {"type": "string"}, "language": {"type": "string"}}},
    "review": {"enum": ["auto", "pending", "approved", "rejected"]},
    "model": {"type": "string"}
  }
}
```

### 9.3 Core tables (PostGIS)
`countries(cca3 PK, geom geometry(MultiPolygon,4326), data jsonb, updated_at)` · `metrics(cca3, key, value, unit, year, source)` · `events(id PK, published_at, pillar, geom geometry, impact_india, impact_stability, payload jsonb)` · `event_countries(event_id, cca3)` · `lexicon(term_en PK, hi, mr, translit, dnt bool, notes, version)` · `agreements(id, parties[], title, signed_on, type, source)`.

---

## 10. Code Deliverables

1. **Python pipeline** — fetch (RSS/MEA/PIB/APIs) → dedupe → NER → score → 3-bullet brief → translate EN→HI/MR with lexicon-enforcing prompt → validate against §9.2 → store → publish.
2. **Next.js app** — `app/[locale]/page.tsx` (map), `app/[locale]/country/[iso3]/page.tsx` (SSR profile), components: `WorldMap`, `CountryDrawer`, `ProfileTabs`, `CompareView`, `LensPanel`, `IntelTicker`, `BilateralMatrix`, `LanguageToggle`.
3. **Schemas & migrations** for §9.
4. **Seed data**: 5 fully curated countries; all others on-demand from REST Countries + Wikipedia + World Bank, cached.
5. **Tests**: schema validation for every profile, Playwright click-every-country test, translation QA suite, Lighthouse ≥ 90.

## 11. Non-Functional Requirements
First load < 2.5 s LCP on 4G · map interaction 60 fps · SEO (SSR profiles, per-locale `hreflang`, OpenGraph with flag) · loading skeletons + error boundaries everywhere · offline viewed countries · analytics without PII · WCAG 2.2 AA.

---

**Output format when executing this prompt:** structured sections, Mermaid/ASCII diagrams, schemas, and production-quality code; start with P1 and deliver a runnable build before expanding.
