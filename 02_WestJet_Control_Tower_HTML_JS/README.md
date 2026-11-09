# WestJet Enterprise Aviation Control Tower — HTML/JS Package

## Purpose
Standalone browser implementation of the WestJet Enterprise Aviation
Intelligence & Control Tower: the same 19 dashboard pages, data model, KPI
definitions, formulas, targets, comparison logic, scenario logic,
data-quality rules, and formatting rules as the Streamlit package, loading
converted JSON data generated from the input workbook
(`WestJet_Enterprise_Control_Tower_Input_Template.xlsx`).

**SYNTHETIC DATA.** All values are synthetic/demo data from the input
workbook and must not be interpreted as actual WestJet performance. Every
page carries a visible **SYNTHETIC DATA** badge, and every scenario output
is labelled **SIMULATED**.

## Status
Implemented (2026-11-08). All 19 pages, the KPI engine, the scenario
engine, comparison logic, global filters, validation display and CSV
exports are built. Verified against the Python ground truth — see
[Verification](#verification).

## How to run
Serve the folder with a static server (browsers block `fetch` from
`file://`, so opening `index.html` directly will show the
"Input workbook not found" error with an upload control instead):

```sh
cd 02_WestJet_Control_Tower_HTML_JS
python3 -m http.server 8000
# open http://localhost:8000/
```

No build step, no credentials, no server-side code. Chart.js 4.4.1 is
loaded from a CDN (as the wireframe used); **offline use needs the
library vendored** — download `chart.umd.min.js` into the folder and
point the `<script>` tag in `index.html` at it. If Chart.js is
unavailable, every chart degrades to a data table rather than a blank
panel.

## Data
`data/sample-data.json` is converted from the input workbook by the
Python core (60 months, Jan 2022–Dec 2026 in this file; the app detects
the date range dynamically and supports 2–5 years without code changes).
It contains the domain tables, the computed `kpi_calculated` rows, targets,
KPI definitions, the nine preset scenarios S001–S009, the Python
`preset_results`, route aggregates and the validation block. Do not edit
its values — it is generated output. If the file cannot be loaded, the
app shows the brief §20 message: "Input workbook not found. Please
upload: WestJet_Enterprise_Control_Tower_Input_Template.xlsx" and offers
a converted-JSON upload control.

## Structure map
- `index.html` — app shell (header, left navigation, DATA STATUS banner, global filters, page container)
- `css/` — westjet-theme.css (tokens), dashboard.css, responsive.css
- `js/` — data-loader.js, data-validator.js, kpi-engine.js,
  comparison-engine.js, scenario-engine.js, charts.js, filters.js, app.js
- `js/dashboards/` — one module per page (18): executive, flight_ops, mro,
  passenger, revenue, network, people, baggage, cargo, ground, fuel,
  finance, ancillary, data_platform, ai_products, governance, simulator,
  outcome
- `data/` — sample-data.json (generated; do not edit)
- `tests/` — test.js (Node verification vs Python ground truth),
  smoke.js (headless render smoke test, DOM stub, no browser needed)

## Pages (19)
Executive Overview (14 KPI cards: current, previous, YoY %, target,
variance to target, mini trend, status) · Flight Operations · MRO / Tech
Ops (11 top KPIs + warning states) · Passenger / Commercial · Revenue
Management · Network / Route Profitability (route ranking) · Crew / People ·
Baggage · Cargo · Airport / Ground · Fuel (with live S001 scenario support) ·
Finance · Ancillary Revenue · Data Platform (10 primary KPIs + executive
summary) · AI / Data Products · Data Governance · Scenario Simulator ·
Scenario Outcome (Actual vs Baseline vs Simulated) · Theme & Branding
(8 starter airline themes + custom airlines; branding only, data stays
WestJet synthetic).

## Key behaviours and caveats (all deliberate, per the specs)
- **No Plan/Forecast data exists** in the workbook: the Actual/Plan/
  Forecast control shows only Actual as available; Plan/Forecast are
  disabled with an explanatory note. No plan/forecast values are faked.
- **Aircraft Utilisation target caveat:** the workbook formula yields
  ~248 hrs/aircraft/month while the target is 10.5 (looks like a daily
  figure). The target value is displayed but no pass/fail status is shown
  against it; the footnote reads "Target appears to be a daily figure —
  status withheld pending confirmation."
- **Workbook quirks are surfaced, not reconciled:** Ancillary Passengers,
  Active Aircraft, Assets with Owner, and the Ancillary/Cargo Revenue
  cross-sheet differences appear in the Data Quality area (5 warnings,
  data status Warning, score 95.0% in the loaded file).
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
- **Aircraft Utilisation over a multi-month period:** the engine sums
  Block Hours over the period and divides by mean Active Aircraft, so a
  60-month selection shows ~14,220 hrs/aircraft (a period total,
  arithmetically consistent with the formula) while a single month shows
  ~248 hrs. See `03_Shared/USER_GUIDE.md` §8 — a per-month-average
  display is a recommended follow-up refinement, not yet implemented.
- **FX % (reconciled 2026-11-08):** the Python scenario engine scales
  Total Revenue and Operating Cost by the FX % — an engine assumption,
  because the workbook has no FX base measure — and the JS engine
  follows it. `SCENARIO_DEFINITIONS.md` §3.9 and §4.10 now state this
  implemented behaviour; the earlier spec wording ("FX % is shown but
  unapplied") is superseded. (Two code comments still describe the old
  discrepancy — the header of `js/scenario-engine.js` and a note in
  `js/dashboards/outcome.js` — because application code was not
  modified during the documentation pass; they are stale, not the
  behaviour. The behaviour itself matches the corrected spec.)
- **Period Cargo Yield quirk:** monthly rows use the `Cargo` sheet's
  Cargo Revenue; multi-month period aggregates follow the Python
  `aggregate_inputs()` behaviour of using the Revenue_Management Cargo
  Revenue sum (over 60 months $805.71/tonne vs $804.38/tonne on the
  `Cargo` sheet alone). Documented in `03_Shared/KPI_DICTIONARY.md` §14.
- **KPI values not in the workbook are not computed:** e.g. Repeat
  Defects, Maintenance TAT, Aircraft Availability, Forward Load Factor,
  EBIT-style measures — each page states this where relevant instead of
  showing invented values.
- Simulator slider ranges are the brief §12 **proposed** ranges (default
  0%; −50%/+50% generally; Fuel Price −30%/+100%; Cancellation
  −100%/+100%).

## Exports (client-side CSV download, Blob)
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
for f in js/*.js js/dashboards/*.js tests/*.js; do node --check "$f"; done   # 30 files
node tests/test.js    # 23 checks
node tests/smoke.js   # renders all 19 pages headlessly
```
`tests/test.js` loads `data/sample-data.json`, runs the JS KPI/scenario
engines and asserts against the Python-generated ground truth:
- the monthly KPI frame matches `kpi_calculated` for all 60 months ×
  18 KPIs + aggregates;
- Dec 2026 spot values: Load Factor 0.798508, RASK 0.128060,
  Total Revenue 467,101,901;
- all nine presets S001–S009 over the full 60-month baseline match
  `preset_results` exactly (including Fuel +20%: cost impact
  $1,116,244,265, margin −4.20pp; Demand +10%: revenue impact
  $2,433,905,160, Load Factor 0.878889);
- comparison (Dec 2026 YoY), validation block (Warning, 5 warnings),
  input clamping, route ranking;
- theme system (8 starter themes validate, `applyTheme` returns the
  CSS variables, custom-add validation rejects bad hex / URL / IATA).
Result on 2026-11-08: **all 23 checks pass, no mismatches found**
(`node --check`: 30/30 files pass). `tests/smoke.js` renders all 19
pages, applies a Fuel +20% scenario and checks the Simulator/Outcome
pages, applies a theme (Emirates) and checks the header brand follows
it, with no runtime errors. The Streamlit package independently
verifies the same ground truth (pytest, 79 tests) — see its README.
One item is **not** verified: a real browser render of the HTML app
(no live-browser access in the verification pass); the headless smoke
test covers page rendering without a browser.

## Theme
Default theme is WestJet (tokens below, shared by both packages).
The Theme & Branding page (19th page) offers 8 starter airline themes
— WestJet, Air Canada, Emirates, Qatar Airways, Lufthansa, British
Airways, Delta Air Lines, Air France — plus a form to add a custom
airline. Themes live in `data/themes.json`, loaded at startup by
`js/theme.js` (`WJ.theme`); the choice lives in `localStorage`
(`wj-theme-id`, custom themes in `wj-custom-themes`). Logos are remote
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

Theme tokens live in `css/westjet-theme.css` as CSS variables.
