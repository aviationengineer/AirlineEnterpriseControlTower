# WestJet Enterprise Aviation Control Tower — Streamlit Package

## Purpose
Python + Streamlit implementation of the WestJet Enterprise Aviation
Intelligence & Control Tower: 19 dashboard pages (Executive Overview,
Flight Operations, MRO / Tech Ops, Passenger / Commercial, Revenue
Management, Network / Route Profitability, Crew / People, Baggage, Cargo,
Airport / Ground, Fuel, Finance, Ancillary Revenue, Data Platform,
AI / Data Products, Data Governance, Scenario Simulator, Scenario Outcome,
Theme & Branding),
driven by a centralised KPI engine and a scenario engine over the input
workbook.

**SYNTHETIC DATA.** All values are synthetic/demo data from the input
workbook and must not be interpreted as actual WestJet performance. Every
page carries a visible **SYNTHETIC DATA** badge, and every scenario output
is labelled **SIMULATED**.

## Status
Implemented (2026-11-08). All 19 pages, the data loader, schema and
data-quality validation, the canonical model, the KPI engine, the
scenario engine, the comparison engine, global filters, category toggles
and CSV exports are built and verified — see [Verification](#verification).
The input workbook is bundled at
`data/WestJet_Enterprise_Control_Tower_Input_Template.xlsx` (23 sheets,
monthly data Jan 2022–Dec 2026, 60 months, synthetic/demo only).

## How to run
```sh
cd 01_WestJet_Control_Tower_Streamlit
.venv/bin/streamlit run app.py
# open http://localhost:8501/
```
The project virtual environment is `.venv` (Python 3.12.3); use it —
do not run with the system Python. To rebuild it:
`.venv/bin/pip install -r requirements.txt` (see `DEPLOYMENT.md` in
`03_Shared/` for the full procedure, Cloud notes and troubleshooting).
`run.bat` still carries the scaffold placeholder text and does not
launch the app; use the command above.

## Data
The app loads the workbook from `data/` on start-up (path in
`config.py:WORKBOOK_PATH`) and detects the date range dynamically
(supports 2–5 years without code changes). Validation runs on every
load: on the supplied workbook the result is **DATA STATUS Warning,
data-quality score 95.0, 0 errors, 5 warnings, 192 checks** — all
five warnings are the documented workbook quirks (`DATA_MODEL.md`
§7: Ancillary Passengers, Active Aircraft, Assets with Owner,
Ancillary Revenue and Cargo Revenue cross-sheet differences),
surfaced, not reconciled. See `03_Shared/DATA_QUALITY_RULES.md`
and `03_Shared/USER_GUIDE.md` §10 for how to read the validation
area.

## Pages (19)
Executive Overview (14 KPI cards: current, previous, YoY %, target,
variance to target, mini trend, status) · Flight Operations · MRO / Tech
Ops (11 top KPIs + warning states) · Passenger / Commercial · Revenue
Management · Network / Route Profitability (route ranking) · Crew / People ·
Baggage · Cargo · Airport / Ground · Fuel (with live S001 scenario support) ·
Finance · Ancillary Revenue · Data Platform (10 primary KPIs + executive
summary) · AI / Data Products · Data Governance · Scenario Simulator
(presets S001–S009 + 19 interactive inputs) · Scenario Outcome (Actual vs
Baseline vs Simulated) · Theme & Branding (8 starter airline themes +
custom airlines; branding only, data stays WestJet synthetic).

## Key behaviours and caveats (all deliberate, per the specs)
- **No Plan/Forecast data exists** in the workbook: the Actual/Plan/
  Forecast control shows only Actual as available; Plan/Forecast are
  disabled with an explanatory note. No plan/forecast values are faked.
- **Aircraft Utilisation target caveat:** the workbook formula yields
  ~248 hrs/aircraft/month while the target is 10.5 (looks like a daily
  figure). The target value is displayed but no pass/fail status is shown
  against it; the footnote reads "Target appears to be a daily figure —
  status withheld pending confirmation."
- **Aircraft Utilisation over a multi-month period:** the engine sums
  Block Hours over the period and divides by mean Active Aircraft, so a
  60-month selection shows ~14,220 hrs/aircraft (a period total,
  arithmetically consistent with the formula) while a single month shows
  ~248 hrs. See `03_Shared/USER_GUIDE.md` §8 — a per-month-average
  display is a recommended follow-up refinement, not yet implemented.
- **Period Cargo Yield quirk:** monthly rows use the `Cargo` sheet's
  Cargo Revenue; multi-month period aggregates use the
  `Revenue_Management` Cargo Revenue sum (over 60 months $805.71/tonne
  vs $804.38/tonne on the `Cargo` sheet alone). Documented in
  `03_Shared/KPI_DICTIONARY.md` §14.
- **FX %:** the engine scales Total Revenue and Operating Cost by
  (1 + FX % / 100) — an engine assumption, because the workbook has no
  FX base measure. Reconciled in `03_Shared/SCENARIO_DEFINITIONS.md`
  §3.9 and §4.10 on 2026-11-08 (the earlier "shown but unapplied"
  wording is superseded); the JS engine follows the same behaviour.
- **Cash impact on multi-month baselines is illustrative** — cash is a
  period-end stock while revenue/cost impacts are period flows (e.g. the
  S001 full-period cash position falls to ~$20.5m). Every cash-impact
  display carries the "illustrative" label.
- **Simulator/Outcome are connected** (unlike the wireframe, whose
  Outcome page used flat constants and received no slider state): both
  pages share one scenario state; the Outcome page recomputes from the
  scenario engine. Baseline = Actual (no separate baseline series exists
  in the workbook) and is labelled "Baseline (= Actual)".
- **Training Compliant is a count** in the workbook, not a proportion:
  shown as a count, with a derived compliance share (Training Compliant /
  Headcount) labelled as derived.
- **Workbook quirks are surfaced, not reconciled:** Ancillary Passengers,
  Active Aircraft, Assets with Owner, and the Ancillary/Cargo Revenue
  cross-sheet differences appear in the Data Quality area (5 warnings,
  data status Warning, score 95.0% in the loaded file).
- **KPI values not in the workbook are not computed:** e.g. Repeat
  Defects, Maintenance TAT, Aircraft Availability, Forward Load Factor,
  EBIT-style measures — each page states this where relevant instead of
  showing invented values.
- Simulator slider ranges are the brief §12 **proposed** ranges (default
  0%; −50%/+50% generally; Fuel Price −30%/+100%; Cancellation
  −100%/+100%).

## Exports
- KPI summary export (all 18 KPIs: current, previous, YoY %, target,
  variance to target) — header button in the filter bar.
- Filtered table export (the current page's table, filtered by the
  global filters) — header button and per-page button.
- Scenario results export (Actual/Baseline/Simulated table, impacts,
  SCENARIO ASSUMPTIONS, changed variables) — Simulator and Outcome pages.
- Every export carries a SYNTHETIC DATA note; scenario exports also carry
  the SIMULATED label.

## Verification
```sh
.venv/bin/python -m pytest tests/ -q    # 89 tests
.venv/bin/streamlit run app.py --server.port 8502   # then curl http://localhost:8502/ → HTTP 200
```
Result on 2026-11-08: **89 passed**. The suite covers the loader
(workbook loading, missing sheet/column, invalid values), the KPI
engine (Load Factor, RASK, CASM, Yield, D0, D15, Operating Margin,
MRO and Data Platform metrics), the scenario engine (Fuel +20%,
Demand +10%/−10%, Maintenance Cost +12%, Labour Cost +7%, Yield +5%
and the other presets), the validator (DQ/BR rules, quirks, score and
status), the theme system (8 starter themes, validation, custom-add
rejection, theme switching), analytics (GA4 off by default, snippet
content, ID validation, secrets precedence, once-per-session loader,
page-change events), and the UI pages (all 19 pages render,
filters, reset).
Spot values asserted include Dec 2026 Load Factor 0.798508, RASK
0.128060 and Total Revenue 467,101,901, and the S001/S002 preset
results over the full 60-month baseline. The HTML/JS package
independently verifies the same ground truth (`node tests/test.js`,
23/23 checks) — see its README.

## Theme
Default theme is WestJet (tokens below, shared by both packages).
The Theme & Branding page (19th page) offers 8 starter airline themes
— WestJet, Air Canada, Emirates, Qatar Airways, Lufthansa, British
Airways, Delta Air Lines, Air France — plus a form to add a custom
airline. Themes live in `config.py` (`THEMES`, with `validate_theme`,
`get_theme`, `theme_css`); the choice lives in session state
(`theme_id`, `custom_themes`) for the session. Logos are remote
Wikimedia Commons URLs, never files in the repo. The starter themes are
also kept in the “Airline Themes & Branding” Google Sheet — see
`03_Shared/THEME_SYSTEM.md` for the full system (fields, persistence
limits, logo policy, how to add an airline). Theming changes branding
only; the data stays WestJet synthetic data.

WestJet theme tokens (shared by both packages):
- Primary yellow: #FFC72C
- Deep navy: #002855
- Dark charcoal: #1F2937
- White: #FFFFFF
- Light neutral grey: #F2F4F7
- Restrained blue accent: #2E6EA6
- Restrained teal accent: #0E7C7B
Yellow is used strategically (active navigation, KPI highlights, key actions)
and never excessively.

Streamlit theme tokens live in `.streamlit/config.toml` (WestJet
fallback; the selected theme is injected as CSS at runtime).

## Analytics (Google Analytics 4)

The app reports anonymous usage to Google Analytics 4 (GA4) once a
Measurement ID is configured — until then tracking is completely off and
the app behaves exactly as before.

**What is tracked:** a `page_view` when the app loads, plus a
`page_navigation` event (with the page name) whenever the sidebar page
changes. No personal data is sent — no user IDs, no custom dimensions,
nothing that identifies a visitor. GA4 anonymises IP addresses by
default. The injection lives in `analytics.py` (`inject_analytics`,
called once in `app.py` after the page is chosen); the fallback
Measurement ID constant is `GA_MEASUREMENT_ID` in `config.py` (empty by
default). Tests are in `tests/test_analytics.py`.

**Setup (one GA4 property, three streams):** create one GA4 property
for the three Streamlit apps at https://analytics.google.com, then add
one web data stream per app URL
(`fleet-intelligence-2026.streamlit.app`,
`global-fleet-intelligence.streamlit.app`,
`aviationenterprisect.streamlit.app`). Each stream has its own
Measurement ID (`G-XXXXXXXXXX`). In Streamlit Cloud, open the app →
Manage app → Settings → Secrets and add:

```
GA_MEASUREMENT_ID = "G-XXXXXXXXXX"
```

(using this app's own stream ID). Tracking starts on the next run;
remove the secret to switch it off again. The ID can also be set as the
`GA_MEASUREMENT_ID` constant in `config.py`, but secrets are preferred
— never commit a real Measurement ID to the repo.

Note: Streamlit Cloud's built-in "App analytics" (view counts in the
Cloud dashboard) is separate from Google Analytics; this integration
does not affect it.

## Structure map
- `app.py` — entry point, routing, layout, navigation
- `config.py` — configuration and page registry
- `data/` — loader, validator, transformer, cache, export_web_json,
  plus the input workbook
- `models/` — aviation model, KPI model, scenario model
- `services/` — KPI engine, scenario engine, comparison engine, data quality
- `dashboards/` — the 18 dashboard pages
- `components/` — KPI card, charts, filters, status, tables
- `tests/` — pytest suite (89 tests)
- `requirements.txt` — dependencies, pinned (streamlit==1.67.0,
  pandas==3.1.1, openpyxl==3.1.5, plotly==7.1.0, pytest==9.2.0)
- `.venv/` — project virtual environment (Python 3.12.3)
- `run.bat` — Windows launcher (still scaffold placeholder text; see above)
