# WestJet Enterprise Aviation Intelligence & Control Tower

## Purpose
Enterprise aviation intelligence & control tower for WestJet: 18 dashboard
pages (Executive Overview, Flight Operations, MRO / Tech Ops, Passenger /
Commercial, Revenue Management, Network / Route Profitability, Crew /
People, Baggage, Cargo, Airport / Ground, Fuel, Finance, Ancillary Revenue,
Data Platform, AI / Data Products, Data Governance, Scenario Simulator,
Scenario Outcome), driven by a centralised KPI engine and a scenario engine
over the input workbook. Data flows: Excel Workbook → File/Data Loader →
Schema Validation → Data Quality Validation Engine → Canonical Aviation
Data Model → KPI Calculation Engine → Scenario Engine → Control Tower.

## Folders
- `01_WestJet_Control_Tower_Streamlit/` — Python + Streamlit package
  (app.py, config.py, data/, models/, services/, dashboards/ [19 pages],
  components/, tests/, requirements.txt, README.md, run.bat)
- `02_WestJet_Control_Tower_HTML_JS/` — standalone HTML + JavaScript package
  (index.html, css/, js/, data/sample-data.json, data/themes.json, assets/, tests/, README.md)
- `03_Shared/` — shared specification (KPI dictionary, data model, scenario
  definitions, data-quality rules, wireframe analysis, architecture,
  scenario engine, deployment, user guide, theme system)
- `docs/` — the original master build prompt, verbatim
  (`docs/MASTER_BUILD_PROMPT.md`, §1–§39, as sent 2026-11-08).
- `COORDINATOR_BRIEF.md` — the condensed working version of the brief used
  by the build workstreams (numbered §0–§27; the full prompt lives in
  `docs/`).

## Status
**Implemented and verified 2026-11-08.** Both packages are built:
the Streamlit app (19 pages, loader, validator, canonical model, KPI
engine, scenario engine, comparison engine, filters, exports; pytest
**89 passed**) and the HTML/JS app (same 19 pages, data model, KPI
definitions, formulas, targets, comparison logic, scenario logic,
data-quality rules and formatting rules; `node --check` 30/30 files,
`node tests/test.js` **23/23 checks pass** against the Python ground
truth, `node tests/smoke.js` passes). Both apps have a 19th page,
Theme & Branding, with 8 starter airline themes (see
`03_Shared/THEME_SYSTEM.md`). Analytics: the Streamlit app reports
anonymous GA4 page views once a Measurement ID is set in Streamlit
secrets — see `01_WestJet_Control_Tower_Streamlit/README.md`
(Analytics). The four project documents are
complete in `03_Shared/`: `ARCHITECTURE.md`, `SCENARIO_ENGINE.md`,
`DEPLOYMENT.md`, `USER_GUIDE.md`. The FX spec discrepancy is
reconciled (see `03_Shared/SCENARIO_DEFINITIONS.md` §3.9 — the engine
scales Total Revenue and Operating Cost by the FX %, and the earlier
"shown but unapplied" wording is superseded). The input workbook is
bundled in both packages (`data/WestJet_Enterprise_Control_Tower_
Input_Template.xlsx`, 23 sheets, Jan 2022–Dec 2026, 60 months,
synthetic/demo only). On the supplied workbook the load validates as
**DATA STATUS Warning, score 95.0, 0 errors, 5 warnings** (the five
warnings are the documented workbook quirks, not data errors).

One item is **not** verified: a real browser render of the HTML app
(no live-browser access in the verification pass).

No GitHub push yet — target repo `aviationengineer/AirlineEnterpriseControlTower`
is empty; local build only.

## Theme
WestJet theme tokens (shared by both packages):
- Primary yellow: #FFC72C
- Deep navy: #002855
- Dark charcoal: #1F2937
- White: #FFFFFF
- Light neutral grey: #F2F4F7
- Restrained blue accent: #2E6EA6
- Restrained teal accent: #0E7C7B
Yellow is used strategically (active navigation, KPI highlights, key actions)
and never excessively. No other airline branding is used anywhere.

