# User Guide — WestJet Enterprise Aviation Intelligence & Control Tower

**Status:** Implemented 2026-11-08. This guide describes the build as
it exists in `01_WestJet_Control_Tower_Streamlit/` and
`02_WestJet_Control_Tower_HTML_JS/`.
**Sources:** `COORDINATOR_BRIEF.md` §5–§18, §23; `KPI_DICTIONARY.md`;
`DATA_MODEL.md`; `SCENARIO_DEFINITIONS.md`; `SCENARIO_ENGINE.md`;
`DATA_QUALITY_RULES.md`.
**Spelling:** en-GB throughout.
**Audience:** executives and aviation data leaders. No technical
knowledge is needed to use the apps; the "Known caveats" section
(§8) is the one part worth reading in full before relying on any
number.

> **SYNTHETIC DATA.** Every value in both apps comes from a
> synthetic/demo workbook (Jan 2022–Dec 2026, 60 months). Nothing
> here is actual WestJet performance. Every page carries a visible
> **SYNTHETIC DATA** badge, and every scenario value is labelled
> **SIMULATED**. Do not quote figures from this app as WestJet
> results.

## Contents

1. [Starting the apps](#1-starting-the-apps)
2. [The screen at a glance](#2-the-screen-at-a-glance)
3. [The 18 pages](#3-the-18-pages)
4. [Filters — changing what you see](#4-filters--changing-what-you-see)
5. [KPI-category toggles](#5-kpi-category-toggles)
6. [Reading a KPI card](#6-reading-a-kpi-card)
7. [The scenario workflow (Simulator → Outcome)](#7-the-scenario-workflow-simulator--outcome)
8. [Known caveats — read before relying on a number](#8-known-caveats--read-before-relying-on-a-number)
9. [Exports](#9-exports)
10. [Reading the validation / data-status area](#10-reading-the-validation--data-status-area)
11. [What the apps cannot show (and why)](#11-what-the-apps-cannot-show-and-why)
12. [Common tasks](#12-common-tasks)

---

## 1. Starting the apps

- **Streamlit app:** see `DEPLOYMENT.md` §2 — from the Streamlit
  package folder, run `.venv/bin/streamlit run app.py`, then open
  http://localhost:8501.
- **HTML/JS app:** see `DEPLOYMENT.md` §3 — from the HTML/JS
  package folder, run `python3 -m http.server 8000`, then open
  http://localhost:8000/. Do not open `index.html` directly: the
  browser blocks the data load from `file://` and you will see the
  "Input workbook not found" message instead of the dashboards.

Both apps open on the **Executive Overview**. Both show the same
data, the same KPIs and the same scenario results; pick whichever
suits the setting (the Streamlit app for an analyst session, the
HTML app for a plain browser with no Python).

## 2. The screen at a glance

Every page shares the same shell:

- **Header** — "WESTJET / Enterprise Aviation Control Tower",
  subheader "Operations · Commercial · MRO · Finance · Data · AI",
  plus the **SYNTHETIC DATA** badge, the Data Period, Last Refresh,
  Data Quality and Platform Status.
- **Left navigation** — the 18 pages, in order (see §3). The active
  page is highlighted in WestJet yellow.
- **DATA STATUS banner** — Healthy / Warning / Critical, with the
  data-quality score, records loaded, date range, and counts of
  validation errors and warnings (see §10).
- **Global filters** — date range, year, quarter, month, domain,
  KPI category, Actual / Plan / Forecast, scenario, route (see §4).
- **Page content** — KPI cards, charts, tables, and (on the two
  scenario pages) the simulator and outcome views.
- **Exports** — KPI summary, filtered table and scenario-results CSV
  downloads (see §9).

The intended flow is: **Enterprise performance → domain → KPI →
driver → scenario → decision**. Start on the Executive Overview,
click into a domain page for the detail behind a KPI, then use the
Simulator to test what would change the result.

## 3. The 18 pages

| # | Page | What it answers | Key content |
|---|---|---|---|
| 1 | Executive Overview | How is the enterprise doing, overall? | 14 KPI cards: Total Revenue, Operating Cost, Operating Margin, RASK, CASM, Load Factor, D0, Dispatch Reliability, Aircraft Utilization, Passenger Volume, Cash Position, Data Quality, Platform Availability, Data Product Adoption. Each card: current value, previous period, YoY %, target, variance to target, mini trend, status |
| 2 | Flight Operations | Are we flying the schedule reliably and full? | Scheduled Flights, Departures, Cancellations, D0, D15, ASM, RPM, Load Factor, Block Hours, Aircraft Utilization, Active Aircraft |
| 3 | MRO / Tech Ops | Is the fleet available and reliable? | 11 top KPIs: Aircraft Availability (not in workbook — see §11), Dispatch Reliability, AOG, MEL, Deferred Defects, Maintenance Hours, Maintenance Cost, Cost / Flight Hour, Parts Availability, Maintenance TAT (not in workbook), Repeat Defects (not in workbook); fleet availability, dispatch reliability, AOG, MEL and deferred-defect trends; warning states when a KPI deteriorates |
| 4 | Passenger / Commercial | Are passengers booking, flying and staying? | Bookings, Passengers, Cancellation Rate, Book-to-Cancel Ratio, Corporate Retention, Direct Channel Share, Advance Purchase Ratio, NPS, Passenger Growth |
| 5 | Revenue Management | Is revenue per unit of capacity growing? | Passenger / Cargo / Ancillary / Other Revenue, Total Revenue, RASK, Yield, Revenue Growth, Revenue vs Prior Year |
| 6 | Network / Route Profitability | Which routes make money? | Route ranking by Route Profitability (Route Revenue − Route Cost), then Route Revenue; Revenue / Cost per Flight; Route Contribution. 8 routes × 60 months |
| 7 | Crew / People | Do we have the people, trained and staying? | Headcount, Training Compliance, Open Critical Vacancies, Voluntary Leave Rate, Sentiment Index |
| 8 | Baggage | Are bags arriving with their passengers? | Bags Handled, Mishandled Bags, Baggage Mishandling Rate, Successful Delivery Rate |
| 9 | Cargo | Is cargo paying per tonne? | Cargo Tonnes, Cargo Shipments, Cargo Revenue, Cargo Yield, Cargo Growth |
| 10 | Airport / Ground | Are turns on time and incident-free? | Aircraft Turns, Average Turnaround Minutes, Ground OTP, Ground Incidents |
| 11 | Fuel | What is fuel costing us, and how exposed are we? | Fuel Price per Litre, Fuel Volume Litres, Hedged %, Fuel Cost (from Finance); live S001 Fuel Shock support |
| 12 | Finance | Are we profitable, and where is the cash? | Total Revenue, Operating Cost, Labour Cost, Fuel Cost, Other Operating Cost, Cash Position, Operating Margin, CASM. EBIT-style measures: not in the workbook (see §11) |
| 13 | Ancillary Revenue | Are passengers buying more than the seat? | Ancillary Revenue, Ancillary Revenue / Passenger, Attach Rate, Ancillary Growth, Revenue Contribution |
| 14 | Data Platform | Is the data platform adopted, reliable and good? | 10 primary KPIs: Self-Service Adoption, Knowledge Base Usage, Ticket Deflection, Registered Users, Active Users, Security Groups, Data Quality, Platform Availability, Freshness, Platform Tickets; executive summary: Platform Health, Adoption, Reliability, Quality, Support Efficiency |
| 15 | AI / Data Products | Are data products live and creating value? | Registered / Active Data Products, Data Product Adoption, Estimated Business Value, Critical Incidents. No lifecycle-stage data exists in the workbook, so the Idea → … → Retired lifecycle is not displayed |
| 16 | Data Governance | Is our data classified, owned and clean? | Registered Data Assets, Classified Assets, Assets with Owner, Governance Quality, Open Governance Exceptions, Classification / Ownership Coverage |
| 17 | Scenario Simulator | What if…? | Preset scenarios S001–S009 plus 19 interactive inputs (see §7) |
| 18 | Scenario Outcome | What does the scenario do, vs actual? | Actual vs Baseline vs Simulated charts for 9 KPIs, 4 impact tiles, SCENARIO ASSUMPTIONS (see §7) |

## 4. Filters — changing what you see

The global filters sit at the top of every page (Streamlit: sidebar
and filter bar; HTML: filter bar above the page). **Every applicable
visual responds** to a filter change — charts, KPI cards and tables
all recompute for the selected range.

| Filter | What it does | Notes |
|---|---|---|
| Date From / Date To | Sets the selected period (any contiguous range in the loaded data) | From ≤ To is enforced — if you pick From after To, To is moved to match From |
| Year | Short-cut to a full calendar year | Sets Date From/To to 1 Jan – 31 Dec of that year |
| Quarter | Short-cut to a calendar quarter | Sets Date From/To to that quarter |
| Month | Short-cut to a single month | Sets Date From/To to that month |
| Domain | Limits category-filtered views to a domain | Page navigation itself is the main domain selector |
| KPI Category | Toggles the ten categories (see §5) | — |
| Actual / Plan / Forecast | Chooses the primary series | **Only Actual is available**: the workbook has no Plan or Forecast columns, so Plan/Forecast show "not available in the loaded workbook" rather than invented values |
| Scenario | Selects a preset scenario (S001–S009) for the Simulator/Outcome pages | Presets come from the workbook's `Scenarios` sheet, not from the code |
| Route | Limits the Network page (and route-aware tables) to one route | 8 routes in the workbook. Airport / Aircraft / Fleet / Geography filters have no workbook dimension and are not offered |
| **Reset Filters** | Returns every filter to the full loaded range and defaults | Use this whenever a page looks empty after filtering — the most common cause is a narrow date range left over from an earlier selection |

The available date range is detected from the loaded workbook
(Jan 2022–Dec 2026 in the supplied file, 60 months). The apps
support any 2–5 year range without a code change; no year is
assumed. If a comparison period falls outside the loaded range
(e.g. YoY for a month in the first loaded year), the comparison
shows "n/a", not zero.

## 5. KPI-category toggles

Ten categories can be toggled on/off, and the toggle applies across
every page that shows KPI cards (not just the Overview):

Revenue · Cost · Operations · People · Customer · MRO · Network ·
Data Platform · AI / Data Products · Governance

Toggling a category off hides its KPIs from category-filtered views.
It does not delete data and does not affect other pages' KPI cards.
Each KPI belongs to one primary category (see `KPI_DICTIONARY.md`
§6); a few appear under a secondary category as well — Data Quality
% appears under both Data Platform and Governance (primary: Data
Platform), and Operating Margin is Revenue (primary) and is also
shown on the Finance page.

## 6. Reading a KPI card

Every KPI card carries the same anatomy:

- **Title** — the KPI name.
- **Current value** — the value for the selected period, in the
  KPI's units (%, $/ASM, $/tonne, hours, …). Currency is shown as
  "$" exactly as supplied in the workbook; no currency (CAD/USD)
  is assumed.
- **Previous period** — the value for the immediately preceding
  equivalent period.
- **YoY %** — change vs the same period one year earlier. For
  percentage KPIs this is shown in percentage points (pp); for
  level KPIs as a percent. "n/a" where the prior-year period is
  outside the loaded range.
- **Target** — the workbook `KPI_Targets` value where one exists
  (all 18 targets are labelled in the workbook itself as "Synthetic
  baseline – replace with approved target"). Where no workbook
  target exists (Total Revenue, Operating Cost, Passenger Volume,
  Cash Position), the card shows "n/a" — never zero.
- **Variance to target** — actual minus target, coloured
  favourable/unfavourable according to the KPI's direction
  ("Higher is better" / "Lower is better"). Shown only where a
  target exists.
- **Mini trend** — sparkline over the selected range (monthly
  points).
- **Status indicator** — favourable / neutral / unfavourable,
  derived from variance to target where a target exists, otherwise
  YoY, otherwise prior period.
- **Hover** — shows the KPI definition and formula.
- **Drill-down** — where applicable, clicking a card navigates
  KPI → Domain Dashboard → Detailed Data.

Ratios over a period are computed from the **summed numerator and
summed denominator** over that period (e.g. Load Factor over a
quarter = total RPM ÷ total ASM for the quarter), never by averaging
monthly ratios. The exceptions are the passthrough KPIs (Dispatch
Reliability, Ticket Deflection Rate, Data Quality, Platform
Availability), which are supplied monthly as values and are averaged
across the months of the period. If a denominator is zero or
missing, the KPI shows "n/a" — never zero — and the data-quality
layer reports the underlying problem.

## 7. The scenario workflow (Simulator → Outcome)

### Step 1 — Pick a starting point (Simulator, page 17)

- **Preset scenario:** choose one of S001–S009 (Fuel Shock +20%,
  Demand Upside +10%, Demand Downside −10%, Capacity Growth +8%,
  Maintenance Inflation +12%, Labour Inflation +7%, Yield
  Improvement +5%, Ancillary Upside +10%, Cancellation Shock +15%)
  and click **Apply preset**. A preset is a single-variable change
  exactly as stated in the workbook.
- **Or start from scratch:** leave the preset at "None (interactive
  inputs only)" and move the sliders.

### Step 2 — Adjust inputs

19 inputs in 9 groups, each with a slider, a numeric input, a
default of 0%, a min/max and a reset button:

| Group | Inputs |
|---|---|
| Commercial | Passenger Demand %, Yield %, Load Factor % |
| Capacity | Capacity %, Flights %, Aircraft Utilization % |
| Fuel | Fuel Price % (−30% / +100%), Fuel Volume % |
| MRO | Maintenance Cost %, Aircraft Availability % |
| Workforce | Labour Cost %, Headcount % |
| Operations | Cancellation % (−100% / +100%), D0 %, D15 % |
| Cargo | Cargo Demand %, Cargo Yield % |
| Ancillary | Ancillary Revenue % |
| FX | FX % |

Defaults are 0% everywhere; the general range is −50% / +50%
(except Fuel Price and Cancellation, above). The ranges are the
brief §12 **proposed** ranges, not workbook-derived. Values typed
outside a range are clamped to the bound. Every input's reset button
returns it to 0%; **Reset all inputs** resets the whole simulator.
Changes apply live — there is no Apply button — and every output
updates in place.

What each input does is documented in `SCENARIO_ENGINE.md` §6
(impact chains) and in the assumptions list the page shows. Two
inputs deserve a note here because their behaviour surprises
first-time users:

- **FX %.** There is no FX column in the workbook, so the engine
  applies FX % as a stated assumption: it scales **Total Revenue
  and Operating Cost by the same factor** (1 + FX % / 100). An
  FX-only change therefore moves RASK and CASM by the FX % but
  leaves Operating Margin unchanged. See §8 and
  `SCENARIO_DEFINITIONS.md` §3.9.
- **Headcount %.** Moves Headcount only. No cost or productivity
  effect is defined for it, so changing Headcount % alone changes
  no financial output. This is a known open question, not a bug.

### Step 3 — Read the simulated outputs

The Simulator shows the simulated levels and the impacts
(simulated − baseline) for Revenue, Cost, RASK, CASK, Load Factor,
Operating Margin, Cash, EBIT-style (operating profit — see §8),
Passengers and Capacity. **Every simulated value is labelled
SIMULATED** and is never presented as actual performance.

### Step 4 — Go to the Outcome page (page 18)

Click **VIEW OUTCOME** (or navigate to page 18). The Outcome page
recomputes from the same scenario state — it does not hold its own
copy — and shows:

- **Comparison charts** (one per KPI): Actual vs Baseline vs
  Simulated for RASK, CASK, Revenue, Operating Cost, Margin, Cash,
  Load Factor, Capacity, Passenger Volume. Baseline = Actual in
  this build and is labelled "Baseline (= Actual)".
- **Summary tiles:** Revenue Impact, Cost Impact, Margin Impact,
  Cash Impact (simulated − baseline, with direction).
- **SCENARIO ASSUMPTIONS:** the complete list of changed variables
  — every preset applied and every input that differs from its
  default, with its value — plus every assumption the engine applied
  (e.g. "RPM assumed to move with Passengers", "Load Factor capped
  at 100%", the FX assumption, "variable-cost saving assumed:
  none"). A simulated number without its assumptions visible is
  incomplete; if the assumptions section is empty, no scenario is
  applied and the page states "No scenario applied".

### Step 5 — Export (optional)

Scenario-results export (CSV) includes the Actual/Baseline/
Simulated table, the impacts, the SCENARIO ASSUMPTIONS list, the
SIMULATED label and the SYNTHETIC DATA note (see §9).

## 8. Known caveats — read before relying on a number

These are deliberate, documented behaviours — not bugs. Each is also
recorded in the specification it belongs to.

1. **Aircraft Utilisation over a multi-month period (presentation
   caveat).** The engine computes Aircraft Utilisation as Block
   Hours ÷ Active Aircraft. Over a selected period it sums Block
   Hours over the whole period and divides by **mean** Active
   Aircraft. A single month therefore shows ~248 hrs/aircraft
   (Dec 2026: 248.18 hrs), while a 60-month selection shows
   **~14,220 hrs/aircraft** — a period total, arithmetically
   consistent with the formula, but not a monthly rate. Do not
   compare a multi-month Utilisation figure with the single-month
   figure or with the 10.5 target as if they were the same kind of
   number. Recommended follow-up refinement (not yet implemented):
   show the per-month average (period total ÷ number of months)
   alongside the period total.
2. **Aircraft Utilisation target (10.5) looks like a daily
   figure.** The workbook formula yields ~248 hrs/aircraft/month
   while the target is 10.5. The apps display the target value but
   show **no pass/fail status** against it; the footnote reads
   "Target appears to be a daily figure — status withheld pending
   confirmation."
3. **Cash impact on multi-month baselines is illustrative.** Cash
   Position is a period-end stock; revenue/cost impacts are period
   flows. The engine applies the simulated change in operating
   profit to the baseline Cash Position, which overstates the cash
   movement on a long baseline (e.g. the S001 full-period cash
   position falls to ~$20.5m). Every cash-impact display carries
   the "illustrative" label. Treat it as direction and order of
   magnitude, not a forecast cash balance
   (`SCENARIO_ENGINE.md` §11).
4. **FX % is an engine assumption.** The workbook has no FX base
   measure. The engine scales Total Revenue and Operating Cost by
   the FX % and states this in the assumptions list. It does not
   know which revenues or costs are actually FX-exposed
   (`SCENARIO_DEFINITIONS.md` §3.9).
5. **Period Cargo Yield uses a different Cargo Revenue sum than
   monthly Cargo Yield.** Monthly rows use the `Cargo` sheet's
   Cargo Revenue; multi-month period aggregates use the
   `Revenue_Management` Cargo Revenue sum (the same sum used for
   Total Revenue). The two columns differ slightly, so the period
   figure differs slightly from the `Cargo`-sheet-only figure (over
   60 months: $805.71/tonne vs $804.38/tonne). Both packages do
   this identically (`KPI_DICTIONARY.md` §14 note).
6. **Workbook quirks are surfaced, not reconciled.** The same
   quantity appears in two sheets with slightly different values in
   five places: Ancillary Passengers, Active Aircraft, Assets with
   Owner (ownership coverage averages only 23.8% of registered
   assets), Ancillary Revenue and Cargo Revenue. Each KPI uses its
   documented primary source (`DATA_MODEL.md` §7); the apps do not
   average or adjust the figures to match, and the differences
   appear as the 5 warnings in the validation area.
7. **Training Compliant is a count, not a proportion.** The
   workbook's `Crew_People.Training Compliant` column holds counts,
   so the People page shows it as a count, with a derived
   compliance share (Training Compliant ÷ Headcount) labelled as
   derived.
8. **EBIT-style is operating profit, not a workbook EBIT.** The
   scenario engine's "EBIT-style" output is Total Revenue −
   Operating Cost, labelled SIMULATED. As an actual KPI it is not
   computed — the Finance page shows "n/a — no EBIT measure in the
   workbook".
9. **No Plan / Forecast data.** Variance to plan, variance to
   forecast, the Actual/Plan/Forecast toggle beyond Actual, and
   every "vs plan" KPI cannot be computed until plan/forecast data
   is supplied. They show "not available in the loaded workbook".
10. **Targets are synthetic baselines.** All 18 workbook targets
    carry the workbook's own note "Synthetic baseline – replace with
    approved target". Treat variance-to-target as a demo baseline
    comparison, not an approved-target assessment.

## 9. Exports

All exports are CSV downloads (Streamlit: download buttons;
HTML/JS: client-side Blob downloads). Every export carries a
SYNTHETIC DATA note; scenario exports also carry the SIMULATED
label.

| Export | Contents | Where |
|---|---|---|
| KPI summary | All 18 KPIs: current, previous, YoY %, target, variance to target | Header button in the filter bar (both apps) |
| Filtered table | The current page's table, filtered by the global filters | Header button and per-page button |
| Scenario results | Actual/Baseline/Simulated table, impacts, SCENARIO ASSUMPTIONS, changed variables | Simulator and Outcome pages |
| Downloadable datasets | (Streamlit only) the underlying filtered frames | Per-page download buttons |

An exported file never contains a value that is not visible in the
app, and a simulated value is never exported without its SIMULATED
label and its assumptions list.

## 10. Reading the validation / data-status area

The DATA STATUS banner is on every page (brief §18). It shows:

- **Status:** Healthy / Warning / Critical (see below).
- **Last successful refresh** — when the workbook was last loaded.
- **Records loaded** — rows per table and total.
- **Date range** — the detected range (Jan 2022–Dec 2026 in the
  supplied file).
- **Data-quality score** — 1 − (weighted failed checks ÷ total
  checks performed), as a percentage to one decimal place
  (`DATA_QUALITY_RULES.md` §7).
- **Validation errors / warnings** — counts, with the full list in
  the expandable validation area below the banner.

| Status | Meaning | What to do |
|---|---|---|
| **Healthy** | No rule failed. Zero errors, zero warnings | Nothing — the load is clean |
| **Warning** | At least one High-severity rule failed; no Critical failure. Data loads; affected values are flagged | Read the validation list. On the supplied workbook the status is **Warning, score 95.0, 0 errors, 5 warnings, 192 checks** — and all five warnings are the documented workbook quirks (§8 item 6), not data errors. No action is needed |
| **Critical** | At least one Critical rule failed (e.g. a missing sheet/column, ASM < RPM, an unparseable Month), or the workbook is missing | Read the exact message (brief §20 wording, e.g. "Sheet: Flight_Operations / Missing column: ASM"). The affected pages show the error instead of KPIs. Fix the workbook — do not work around it in the app |

The validation report lists, for each failed check: rule ID
(DQ001–DQ008 or BR-01–BR-07), table and column, month/row affected,
severity, the user-facing message, and the action taken (row
excluded / value treated as missing / sheet not loaded). If no rule
fails, the report states "No validation issues found" with the
counts at zero. Validation errors are never silently ignored.

**Known quirks are not validation failures.** The five differences
in §8 item 6 are expected workbook properties and are reported as
warnings for transparency; they do not mean the data is wrong.

## 11. What the apps cannot show (and why)

The workbook defines what is computable. The following brief KPIs
have **no column in the workbook** and are therefore **not
computed** — the pages state this where relevant instead of showing
an invented value (full list in `KPI_DICTIONARY.md` §§7–21):

- Maintenance Cost / Cycle, Repeat Defects, Component Removals,
  Maintenance TAT, Aircraft Availability, Line / Heavy Maintenance
  split (MRO)
- Crew Recency Compliance, SIM / CBT Completion, Communications
  Reach, Training Pipeline, Productivity, Headcount vs Plan (People)
- Forward Load Factor, Booking Intake, Revenue per Passenger
  (undefined — see `KPI_DICTIONARY.md` §24 item 5) (Passenger /
  Revenue)
- Route Load Factor (no route ASM/RPM), fleet/geography filtering
  of routes (Network)
- EBIT/EBITDA as an actual, cost/revenue/margin variance to plan or
  forecast (Finance)
- Data-product lifecycle stages, Product Reliability, Product
  Quality, Consumer Adoption (AI / Data Products)
- Any Plan or Forecast series, anywhere (see §8 item 9)

If a future workbook supplies one of these, the page can show it
without a spec change to the KPI dictionary's "not computed" entry
being removed first — the apps read the workbook, they do not invent
the measure.

## 12. Common tasks

- **"How did we do last month?"** — Executive Overview, set Month
  to the month you want, read the 14 cards (current, previous, YoY
  %, target, variance).
- **"Why did the margin move?"** — Finance page for the margin and
  cost split; Revenue Management for the revenue split; then the
  Simulator to test the driver (e.g. Fuel Price +20%).
- **"Which routes should we look at?"** — Network page, ranked by
  Route Profitability; use the Route filter to isolate one route.
- **"What if fuel rises 20%?"** — Simulator, apply preset **S001
  Fuel Shock**, read the impacts, then Outcome for the Actual vs
  Baseline vs Simulated charts and the assumptions list.
- **"What if demand rises 10% and fuel rises 20% together?"** —
  Simulator, apply S002, then also move Fuel Price to +20% (or
  apply S001 first, then add Passenger Demand +10%). The engine
  applies combined inputs in a fixed order and recomputes once, so
  nothing is double-counted. The Outcome assumptions list shows
  both changes.
- **"Is the data trustworthy?"** — DATA STATUS banner and the
  validation area (§10). Warning with 5 quirk warnings is the
  expected state for the supplied workbook.
- **"Give me the numbers for a meeting."** — KPI summary export
  (§9) for the selected period; scenario-results export if a
  scenario is involved. Both carry the SYNTHETIC DATA note — keep
  it attached when you share the file.
- **"Start over."** — **Reset Filters** (filters) and **Reset all
  inputs** (simulator). If a page looks empty, reset the filters
  first: a leftover narrow date range is the usual cause.

---

*End of User Guide. Companion docs: `DEPLOYMENT.md` (how to run),
`ARCHITECTURE.md` (how it is built), `SCENARIO_ENGINE.md` (scenario
detail), `KPI_DICTIONARY.md` (every KPI), `DATA_MODEL.md` (the
workbook), `DATA_QUALITY_RULES.md` (validation rules).*
