# Architecture — WestJet Enterprise Aviation Intelligence & Control Tower

**Status:** Implemented 2026-11-08. This document describes the build as
it exists in `01_WestJet_Control_Tower_Streamlit/` and
`02_WestJet_Control_Tower_HTML_JS/`.
**Sources:** `COORDINATOR_BRIEF.md` §2 (layered architecture), §21–22
(package structures), §24 (future sources); `DATA_MODEL.md`,
`KPI_DICTIONARY.md`, `SCENARIO_DEFINITIONS.md`, `DATA_QUALITY_RULES.md`.
**Spelling:** en-GB throughout.

> The brief (`COORDINATOR_BRIEF.md`) as held in this workspace is
> numbered §0–§27. References below are to those sections: §2 for the
> layered architecture, §23 for the documentation list, §24 for future
> sources. There are no §29 or §38 sections in the brief on file; the
> deliverable inventory is covered in the project `README.md` instead.

## Contents

1. [The layered pipeline](#1-the-layered-pipeline)
2. [Package layouts (as built)](#2-package-layouts-as-built)
3. [Data flow, step by step](#3-data-flow-step-by-step)
4. [Where each rule lives](#4-where-each-rule-lives)
5. [How the two packages stay equivalent](#5-how-the-two-packages-stay-equivalent)
6. [Caching and performance](#6-caching-and-performance)
7. [Future source architecture (brief §24)](#7-future-source-architecture-brief-24)
8. [What is deliberately not built](#8-what-is-deliberately-not-built)

---

## 1. The layered pipeline

The build follows the brief §2 pipeline exactly. No layer is skipped,
and no layer reaches past its neighbour: dashboards never read the
workbook, and the KPI engine never reads the workbook directly — it
reads only the canonical model.

```
Excel Workbook
  → File / Data Loader
  → Schema Validation
  → Data Quality Validation Engine
  → Canonical Aviation Data Model
  → KPI Calculation Engine
  → Scenario Engine
  → Comparison Engine
  → WestJet Control Tower
      → Streamlit App
      → HTML/JS App
```

Each layer has one job:

| Layer | Job | It must never… |
|---|---|---|
| File / Data Loader | Read the workbook sheets into raw frames; report a missing workbook, sheet or column with the exact brief §20 message | Invent a column, a sheet, or a value that is not in the file |
| Schema Validation | Check required sheets and columns exist, with exact names | Silently load a sheet with a missing column |
| Data Quality Validation Engine | Apply DQ001–DQ008 and BR-01–BR-07; produce the validation report, the data-quality score and the Healthy / Warning / Critical status | Silently ignore a failed rule; treat a null measure as zero |
| Canonical Aviation Data Model | One monthly table per domain (plus the route-month table and the Calendar table); Month normalised to month-start; Total Revenue computed | Hold a KPI value — the model holds measures only; KPIs are computed from it |
| KPI Calculation Engine | Compute the 18 workbook-defined KPIs from the canonical model, for one month and for any selected period | Compute a KPI inside a UI component; invent a KPI with no workbook column |
| Scenario Engine | Apply preset scenarios and interactive inputs to a baseline and recompute the affected KPIs with the same formulas | Present a simulated value as actual performance |
| Comparison Engine | Prior period, YoY, variance to target, and Actual vs Baseline vs Simulated comparison | Compare against a plan/forecast series that does not exist |
| Control Tower (the two apps) | Render the 19 pages, the global filters, the DATA STATUS area, exports | Hard-code a KPI value, a date, or another airline's branding outside the theme system |

## 2. Package layouts (as built)

### 2.1 Streamlit package — `01_WestJet_Control_Tower_Streamlit/`

```
01_WestJet_Control_Tower_Streamlit/
├── app.py                    # Entry point: routing, header, navigation,
│                             # global filters, DATA STATUS banner, badge
├── config.py                 # Workbook path, 18-page registry, theme
│                             # constants, KPI-category mapping, simulator
│                             # input definitions, page-context builder
├── .streamlit/config.toml    # Streamlit theme (WestJet tokens)
├── requirements.txt          # Pinned: streamlit==1.67.0, pandas==3.1.1,
│                             # openpyxl==3.1.5, plotly==7.1.0, pytest==9.2.0
├── run.bat                   # Windows launcher — still carries the
│                             # scaffold placeholder text; see DEPLOYMENT.md
├── .venv/                    # Project virtual environment (Python 3.12.3)
├── data/
│   ├── WestJet_Enterprise_Control_Tower_Input_Template.xlsx
│   │                         # Input workbook (copy; 23 sheets, Jan 2022–
│   │                         # Dec 2026, 60 months, synthetic/demo)
│   ├── loader.py             # Workbook → raw frames; brief §20 errors
│   ├── validator.py          # Schema + DQ001–DQ008 + BR-01–BR-07
│   ├── transformer.py        # Raw frames → canonical AviationModel
│   ├── cache.py              # Path + mtime keyed workbook/model cache
│   └── export_web_json.py    # Converts workbook + computed KPIs to the
│                             # JSON the HTML/JS app loads (see §5)
├── models/
│   ├── aviation_model.py     # AviationModel: domains, targets, Calendar
│   ├── kpi_model.py          # KPI names, formats, status rules
│   └── scenario_model.py     # ScenarioInput (19 inputs, INPUT_BOUNDS),
│                             # preset-variable map, ScenarioResult
├── services/
│   ├── kpi_engine.py         # compute_kpis_for_month, compute_kpi_frame,
│   │                         # aggregate_inputs, aggregate_kpis, time
│   │                         # intelligence (prior month / prior year)
│   ├── scenario_engine.py    # apply_scenario: presets + inputs → result
│   ├── comparison_engine.py  # Outcome metrics, YoY / variance to target
│   └── data_quality.py       # Thin wrapper over validator (score/status)
├── dashboards/               # One module per page (18): executive,
│                             # flight_ops, mro, passenger, revenue,
│                             # network, people, baggage, cargo, ground,
│                             # fuel, finance, ancillary, data_platform,
│                             # ai_products, governance, simulator, outcome
├── components/
│   ├── kpi_card.py           # KPI card (value, previous, YoY %, target,
│   │                         # variance, mini trend, status)
│   ├── charts.py             # Plotly chart helpers
│   ├── filters.py            # Global filters + Reset Filters
│   ├── status.py             # Header, SYNTHETIC DATA badge, DATA STATUS
│   │                         # banner, validation expander
│   └── tables.py             # Filtered tables, KPI summary, scenario
│                             # results frames, CSV download buttons
└── tests/                    # pytest suite — 69 tests, all passing
                              # (test_kpi, test_loader, test_scaffold,
                              #  test_scenario, test_ui_pages, test_validator)
```

### 2.2 HTML/JS package — `02_WestJet_Control_Tower_HTML_JS/`

```
02_WestJet_Control_Tower_HTML_JS/
├── index.html                # App shell: header, left navigation, DATA
│                             # STATUS banner, global filters, page container
├── css/
│   ├── westjet-theme.css     # Theme tokens as CSS variables
│   ├── dashboard.css         # Layout and components
│   └── responsive.css        # Tablet / narrow-viewport rules
├── js/
│   ├── app.js                # Boot, routing, page registry, exports
│   ├── data-loader.js        # Loads data/sample-data.json (or an
│   │                         # uploaded converted JSON); brief §20 errors
│   ├── data-validator.js     # Surfaces the validation block; schema checks
│   ├── kpi-engine.js         # JS mirror of services/kpi_engine.py
│   ├── comparison-engine.js  # JS mirror of services/comparison_engine.py
│   ├── scenario-engine.js    # JS mirror of services/scenario_engine.py
│   ├── charts.js             # Chart.js 4.4.1 helpers (table fallback if
│   │                         # Chart.js is unavailable)
│   ├── filters.js            # Global filters, category toggles, Reset,
│   │                         # KPI-summary and filtered-table CSV export
│   └── dashboards/           # One module per page (18), same page names
│                             # as the Streamlit dashboards/ folder
├── data/
│   ├── WestJet_Enterprise_Control_Tower_Input_Template.xlsx
│   │                         # Input workbook (copy, as in the Streamlit
│   │                         # package; the browser app does not parse it)
│   └── sample-data.json      # Generated converted data (see §5): domain
│                             # tables, kpi_calculated, targets, KPI
│                             # definitions, scenarios S001–S009,
│                             # preset_results, route aggregates, validation
├── assets/                   # Reserved for static assets (empty)
└── tests/
    ├── test.js               # Node verification vs Python ground truth —
    │                         # 23 checks, all passing
    └── smoke.js              # Headless render smoke test (DOM stub, no
                              # browser needed) — renders all 19 pages
```

### 2.3 Shared specification — `03_Shared/`

```
03_Shared/
├── KPI_DICTIONARY.md         # The 18 workbook-defined KPIs, targets,
│                             # comparisons, category mapping, per-domain
│                             # entries, "not in workbook" list
├── DATA_MODEL.md             # Workbook inventory (23 sheets), canonical
│                             # tables, Calendar, primary-source rule and
│                             # known quirks, KPI_Calculated, meta sheets
├── SCENARIO_DEFINITIONS.md   # Presets S001–S009, interactive inputs and
│                             # bounds, impact chains, outputs, Outcome
│                             # page, SIMULATED labelling rule
├── DATA_QUALITY_RULES.md     # DQ001–DQ008, BR-01–BR-07, validation
│                             # report, data-status derivation, error text
├── WIREFRAME_ANALYSIS.md     # UX/interaction reference analysis of the
│                             # wireframe file (patterns only — no branding,
│                             # values or datasets carried over)
├── ARCHITECTURE.md           # This document
├── SCENARIO_ENGINE.md        # Scenario engine reference (see §4)
├── DEPLOYMENT.md             # How to run, serve and deploy both apps
└── USER_GUIDE.md             # How an executive uses the 19 pages
```

## 3. Data flow, step by step

### 3.1 Streamlit app

1. **Boot.** `app.py` calls `data/cache.py:get_model()`, which loads
   the workbook at `data/WestJet_Enterprise_Control_Tower_
   Input_Template.xlsx` (the path in `config.py:WORKBOOK_PATH`) unless
   the cached copy is still current (see §6).
2. **Load.** `data/loader.py:load_workbook()` opens the workbook with
   `openpyxl` (via pandas), reads every required sheet, and raises
   the exact brief §20 errors: workbook missing → "Input workbook
   not found. Please upload:
   WestJet_Enterprise_Control_Tower_Input_Template.xlsx"; missing
   sheet → "Input workbook is missing sheet: [Sheet]"; missing
   column → "Sheet: [Sheet] / Missing column: [Column]". The
   workbook's empty `KPI_Calculated` sheet is never read as a source.
3. **Validate.** `app.py` runs `data/validator.py:validate_all()` on
   the raw frames: schema first (BR-06), then DQ001–DQ008 and
   BR-01–BR-07, plus the five documented workbook quirks reported as
   warnings (QUIRK). The result is a `ValidationReport` with the
   data-quality score and the Healthy / Warning / Critical status.
   On the supplied workbook the result is **Warning, score 95.0,
   0 errors, 5 warnings, 192 checks** — all five warnings are the
   known quirks, not data errors.
4. **Transform.** `data/transformer.py:build_model()` normalises
   `Month` to a month-start datetime on every frame, sorts by Month,
   computes Total Revenue (Passenger + Cargo + Ancillary + Other
   Revenue from `Revenue_Management`), preserves the route-month
   grain of `Network_Routes`, and builds the `AviationModel`
   (domains + targets + Calendar). The KPI frame
   (`KPI_Calculated`, one row per month) is populated by the KPI
   engine at this stage, not by reading the workbook's empty sheet.
5. **Page context.** `config.py:build_context()` assembles, for the
   selected date range, the aggregate KPIs (via
   `services/kpi_engine.py:aggregate_kpis()`), the prior-period and
   prior-year comparisons (via `services/comparison_engine.py`),
   the targets, the validation report and the scenario state. Every
   dashboard page receives this one context object; no page loads
   data itself.
6. **Render.** `app.py` renders the header (SYNTHETIC DATA badge,
   DATA STATUS banner), the left navigation, the global filters
   (`components/filters.py`), then the selected dashboard module.
   KPI cards come from `components/kpi_card.py`; charts from
   `components/charts.py` (Plotly); tables and CSV downloads from
   `components/tables.py`.
7. **Scenario.** The Simulator page (`dashboards/simulator.py`)
   builds a `ScenarioInput` from the preset selector and the 19
   sliders/numeric inputs, calls
   `services/scenario_engine.py:apply_scenario()`, and shows the
   simulated outputs labelled SIMULATED. The Outcome page
   (`dashboards/outcome.py`) takes the same scenario state and
   renders the Actual vs Baseline vs Simulated comparison via the
   comparison engine. Simulator and Outcome share one scenario
   state — unlike the wireframe, whose Outcome page used flat
   constants and received no slider state.

### 3.2 HTML/JS app

1. **Boot.** `index.html` loads Chart.js 4.4.1 from CDN, then the
   `js/` modules. `js/app.js` calls
   `js/data-loader.js:loadData()`, which fetches
   `data/sample-data.json` (default) or a user-uploaded converted
   JSON file. The browser app **does not parse .xlsx**: the workbook
   must first be converted to JSON by the Python core (see §5).
   If the fetch fails, the app shows the brief §20 message and
   offers the upload control.
2. **Shape check.** `checkShape()` verifies the JSON has
   `metadata`, `domains`, `kpi_calculated`, `targets`,
   `kpi_definitions` and `scenarios`; a missing section is reported
   as a missing sheet, in the brief §20 wording.
3. **Engines.** `js/kpi-engine.js`, `js/comparison-engine.js` and
   `js/scenario-engine.js` are line-for-line mirrors of the Python
   services (same formulas, same aggregation, same bounds, same
   impact chains). They run in the browser over the loaded JSON —
   including recomputing the monthly KPI frame, so the JSON's
   `kpi_calculated` rows are a cross-check, not the only source of
   KPI values.
4. **Render.** `js/app.js` routes between the 18 dashboard modules
   in `js/dashboards/`, renders the DATA STATUS banner from the
   JSON validation block, applies the global filters
   (`js/filters.js`) and the ten category toggles, and draws charts
   with Chart.js (`js/charts.js`). If Chart.js fails to load, every
   chart degrades to a data table rather than a blank panel.
5. **Scenario.** The Simulator and Outcome dashboard modules share
   one scenario state object, exactly as in the Streamlit app, and
   recompute from `js/scenario-engine.js`. Presets are read from
   the loaded JSON (the workbook's `Scenarios` sheet), never
   hard-coded.

## 4. Where each rule lives

One rule, one home. UI components never re-implement a rule.

| Rule / behaviour | Python home | JS home | Spec |
|---|---|---|---|
| KPI formulas (18 KPIs) | `services/kpi_engine.py` (`compute_kpis_for_month`, `compute_kpi_frame`); formats/status in `models/kpi_model.py` | `js/kpi-engine.js` | `KPI_DICTIONARY.md` §2 |
| Period aggregation (sums; mean for Active Aircraft and passthroughs; last value for Cash Position) | `services/kpi_engine.py` (`aggregate_inputs`, `aggregate_kpis`) | `js/kpi-engine.js` (aggregate function) | `KPI_DICTIONARY.md` §1, §5 |
| Total Revenue = sum of the four `Revenue_Management` components | `data/transformer.py`, `services/kpi_engine.py` | `js/kpi-engine.js` | `KPI_DICTIONARY.md` §11 |
| Targets (18, workbook `KPI_Targets`) | Read at load into `model.targets` (`data/loader.py`, `models/aviation_model.py`) | Read from JSON `targets` | `KPI_DICTIONARY.md` §3 |
| Time intelligence (MTD/YTD/rolling 12m, prior month, prior year, YoY, variance to target) | `services/kpi_engine.py` (`filter_period`, `prior_month`, `prior_year_month`); `services/comparison_engine.py` | `js/kpi-engine.js`, `js/comparison-engine.js` | `KPI_DICTIONARY.md` §5 |
| Scenario inputs, bounds, preset mapping | `models/scenario_model.py` (`INPUT_BOUNDS`, `PRESET_VARIABLE_MAP`, `ScenarioInput`, `ScenarioResult`) | `js/scenario-engine.js` (bounds table) | `SCENARIO_DEFINITIONS.md` §2–§3 |
| Scenario impact chains and outputs | `services/scenario_engine.py` (`apply_scenario`) | `js/scenario-engine.js` | `SCENARIO_DEFINITIONS.md` §4–§5; `SCENARIO_ENGINE.md` |
| Actual vs Baseline vs Simulated comparison; Outcome metrics (RASK, CASK, Revenue, Operating Cost, Margin, Cash, Load Factor, Capacity, Passenger Volume) | `services/comparison_engine.py` (`OUTCOME_METRICS`) | `js/comparison-engine.js` | `SCENARIO_DEFINITIONS.md` §6 |
| Schema validation, DQ001–DQ008, BR-01–BR-07, quirks, score, status | `data/validator.py` (`ValidationReport`); summary in `services/data_quality.py` | `js/data-validator.js` (surfaces the validation block; JSON carries the Python report) | `DATA_QUALITY_RULES.md` |
| Error messages (brief §20) | `data/loader.py` (`MISSING_WORKBOOK_MESSAGE`, `MissingSheetError`, `MissingColumnError`, `WorkbookNotFoundError`) | `js/data-loader.js` | `DATA_QUALITY_RULES.md` §6 |
| Date-range detection (dynamic, 2–5 years, no hard-coded year) | `data/loader.py` + `models/aviation_model.py` (range from Calendar) | `js/filters.js` (months derived from loaded `kpi_calculated`) | `DATA_MODEL.md` §6 |
| Primary-source rule and known quirks | `data/transformer.py` (merge order and suffixes); `data/validator.py` (QUIRK warnings) | `js/kpi-engine.js` (same merge/suffix logic) | `DATA_MODEL.md` §7 |
| Formatting (currency, %, pp, $/ASM, $/tonne, hours) | `models/kpi_model.py` (`KPI_FORMATS`, `format_kpi`) | `js/app.js` helpers (`U.fmt…`) | `KPI_DICTIONARY.md` §23 |
| WestJet theme tokens | `config.py` constants; `.streamlit/config.toml` | `css/westjet-theme.css` (CSS variables) | Brief §17; project `README.md` |
| Page registry (19 pages: brief §9's 18 + Theme & Branding) | `config.py` (`PAGE_LABELS`, `PAGE_KEY_BY_LABEL`) | `js/app.js` | Brief §9 |

### 4.1 Known engine behaviours that look like quirks but are the spec

- **Period Cargo Yield.** Monthly rows use the `Cargo` sheet's
  Cargo Revenue; multi-month period aggregates use the
  `Revenue_Management` Cargo Revenue sum (see `KPI_DICTIONARY.md`
  §14 note). Both engines do this identically.
- **FX %.** The engine scales Total Revenue and Operating Cost by
  (1 + FX % / 100) — an engine assumption, because the workbook has
  no FX base measure (see `SCENARIO_DEFINITIONS.md` §3.9, §4.10).
- **Aircraft Utilisation over a multi-month period.** The engine
  sums Block Hours over the period and divides by mean Active
  Aircraft, so a 60-month selection shows a period total
  (~14,220 hrs/aircraft) while a single month shows ~248 hrs. See
  `USER_GUIDE.md` (known caveats).
- **Cash impact.** Cash is a period-end stock; the scenario cash
  impact applies the simulated change in operating profit to the
  baseline Cash Position. On multi-month baselines this is
  illustrative and is labelled as such (see `SCENARIO_ENGINE.md`).

## 5. How the two packages stay equivalent

Equivalence is enforced by construction, not by convention:

1. **Python is the ground truth.** The KPI engine, scenario engine
   and comparison engine are written once in Python
   (`services/`), and the JS engines are mirrors of them. Where the
   spec and the Python engine ever disagreed, the spec was corrected
   to the engine (see the FX reconciliation in
   `SCENARIO_DEFINITIONS.md` §3.9, §4.10 and §9 item 1) — the JS
   engine was already following Python.
2. **One conversion step.** `data/sample-data.json` is generated
   from the workbook by the Python core:
   `01_…/data/export_web_json.py` (run as
   `python -m data.export_web_json` from the Streamlit package). It
   embeds the domain tables, the computed `kpi_calculated` rows,
   targets, KPI definitions, the nine presets S001–S009, the
   Python `preset_results`, route aggregates and the validation
   block. The JSON is generated output — do not edit its values by
   hand; regenerate it from the workbook instead.
3. **A machine-checked equivalence test.** `02_…/tests/test.js`
   loads `data/sample-data.json`, runs the JS KPI/scenario engines
   and asserts them against the Python-generated ground truth: the
   monthly KPI frame matches `kpi_calculated` for all 60 months ×
   18 KPIs + aggregates; Dec 2026 spot values (Load Factor
   0.798508, RASK 0.128060, Total Revenue 467,101,901); all nine
   presets S001–S009 over the full 60-month baseline match
   `preset_results` exactly; plus comparison (Dec 2026 YoY),
   validation block, input clamping and route ranking. Result on
   2026-11-08: **23/23 checks pass, no mismatches**. The Streamlit
   side is covered by its own pytest suite (**69 tests pass**).
4. **Same specs, same inputs.** Both packages read the same
   `03_Shared/` specifications, the same workbook targets, the same
   preset scenarios (read from the `Scenarios` sheet / JSON, never
   hard-coded), the same proposed simulator bounds
   (`INPUT_BOUNDS`), and the same brief §20 error text.
5. **Same gaps, stated the same way.** Where the workbook has no
   data (no Plan/Forecast columns, no EBIT column, no route
   ASM/RPM, no fleet/aircraft/airport/geography dimensions), both
   packages show the same "not available / not computed" state
   instead of inventing a value. The Finance page in both packages
   states "n/a — no EBIT measure in the workbook", and the
   Actual/Plan/Forecast control offers only Actual.

## 6. Caching and performance

- **Streamlit — workbook/model cache** (`data/cache.py`). The
  loaded workbook and the built `AviationModel` are cached in a
  module-level dict keyed by **workbook path + file modification
  time**, so replacing the workbook file reloads it automatically
  while repeated filtering never reloads it. `clear_cache()` exists
  for tests. The cache holds the loaded data and the model only —
  the validation report is recomputed per load and never cached
  across a reload, per `DATA_QUALITY_RULES.md` §5.
- **Streamlit — per-interaction work.** Filtering and scenario
  recalculation operate on the cached model: `aggregate_kpis()`
  sums the already-loaded monthly frames over the selected range
  and recomputes the ratios from those sums. The full monthly KPI
  frame (`compute_kpi_frame()`) is built once at model build time,
  not on every interaction. The dataset is small (60 months × 15
  domains + 480 route-month rows), so this is comfortably fast; the
  design still avoids re-reading the workbook or rebuilding the
  model per interaction, as brief §23 requires.
- **HTML/JS — load once, compute in memory.** The JSON is fetched
  once at boot and held in memory; every filter change, page change
  and slider movement recomputes from the in-memory data. There is
  no server round-trip and no re-fetch. Charts are built lazily per
  page (the pattern taken from the wireframe analysis), not all up
  front.
- **No other caching.** There is no HTTP cache configuration, no
  CDN caching policy and no service worker in this build. If the
  HTML app is deployed behind a cache, the operator should version
  or bust `data/sample-data.json` when the workbook changes,
  because the filename is stable.

## 7. Future source architecture (brief §24)

Brief §24 lists the future sources the design must accommodate
**without implementing them**: TRAX / eMRO, AMOS, Flight Operations,
Crew Systems, Revenue Management, Passenger Systems, Baggage
Systems, Cargo Systems, Airport Systems, Finance, Data Platform and
External APIs. The target shape is:

```
Source Systems → Data Ingestion → Enterprise Data Platform →
Canonical Aviation Model → KPI / Semantic Layer → Control Tower
```

What the current build does to stay ready for that shape — and what
it deliberately does not do:

- **The canonical model is the seam.** The KPI engine, scenario
  engine and dashboards read only the `AviationModel` (Python) or
  the converted JSON (JS). A future ingestion layer only has to
  produce those same tables; no dashboard or KPI code changes.
  `DATA_MODEL.md` §3 is written as a table-per-domain contract for
  exactly this reason.
- **The loader is sheet-name driven.** `data/loader.py` maps
  workbook sheets to canonical tables by name
  (`models/aviation_model.py:DOMAIN_SHEETS`). A future source that
  supplies the same columns under the same names slots into the
  same mapping; a source with different names needs a mapping
  entry, not a rewrite.
- **MRO is a first-class domain.** `DATA_MODEL.md` §3.2 requires
  the loader to map `MRO_TechOps` columns by name and pass through
  additional columns (flagging them as unmapped) rather than
  failing on an unknown column, so extra MRO fields can be added
  without changing the dashboard architecture.
- **No enterprise integration is fabricated.** No TRAX/eMRO, AMOS
  or other system is named as connected, no connection string or
  credential exists anywhere in the code, and no "live feed" status
  is shown. The DATA STATUS area reports the workbook load only.
  Environment variables are the reserved mechanism for future
  enterprise integrations (brief §1); none are read today.
- **Plan/Forecast is the first expected extension.** The
  Actual/Plan/Forecast control, the variance-to-plan/forecast
  comparisons and the "Baseline (= Actual)" label on the Outcome
  page are all built to accept a plan/forecast series when one is
  supplied; today they show "not available in the loaded workbook"
  because no Plan/Forecast columns exist (`DATA_MODEL.md` §13).

## 8. What is deliberately not built

- **No live data connection.** Both apps run on the supplied
  workbook (Streamlit) or its converted JSON (HTML/JS). There is no
  polling, no refresh schedule and no "live feed".
- **No write-back to the input workbook.** `KPI_Calculated` is
  populated in memory (and embedded in the generated JSON); writing
  it back to the workbook is optional per `DATA_MODEL.md` §8 and is
  not implemented. If it ever is, it must write to a separate
  output file, never overwrite the input.
- **No authentication, no server-side code, no credentials.** The
  HTML app is static files. The Streamlit app runs locally under
  the user's own session. Nothing in either package stores or
  transmits a credential.
- **No KPI outside the 18 defined ones is computed.** Brief KPIs
  with no workbook column (Repeat Defects, Maintenance TAT,
  Aircraft Availability, Forward Load Factor, EBIT as an actual,
  and the rest listed in `KPI_DICTIONARY.md` §§7–21) are shown as
  "not in workbook — not computed" where the page mentions them, and
  are never given a value.

---

*End of Architecture. Companion specs: `KPI_DICTIONARY.md`,
`DATA_MODEL.md`, `SCENARIO_DEFINITIONS.md`, `DATA_QUALITY_RULES.md`,
`SCENARIO_ENGINE.md`, `DEPLOYMENT.md`, `USER_GUIDE.md`.*
