# KPI Dictionary — WestJet Enterprise Aviation Intelligence & Control Tower

**Status:** Shared specification — authoritative for both packages
(`01_WestJet_Control_Tower_Streamlit/` and `02_WestJet_Control_Tower_HTML_JS/`).
**Sources:** `COORDINATOR_BRIEF.md` sections 3, 4, 5, 7 and 8, and the
verified input workbook
`~/workspace/user/files/WestJet_Enterprise_Control_Tower_Input_Template.xlsx`
(23 sheets, monthly data Jan 2022–Dec 2026, 60 months, synthetic/demo
only — verified 2026-11-08 by reading the workbook).
**Spelling:** en-GB throughout (KPI names are reproduced exactly as in
the brief and workbook).

> **Workbook is the source of truth for the 18 defined KPIs.**
> Where the brief and the workbook disagree, the workbook's
> `KPI_Definitions` sheet governs the formula, unit, direction and
> primary source. Where the brief lists a KPI that has **no column in
> the workbook**, this dictionary says so explicitly and the KPI is
> **not computed** — no value is invented for it.
>
> **Do not invent KPI values.** This dictionary contains no actual
> results. The only target values in it are the workbook's
> `KPI_Targets` values (§3), each labelled in the workbook itself as
> "Synthetic baseline – replace with approved target".

## Contents

1. [Conventions](#1-conventions)
2. [The 18 workbook-defined KPIs](#2-the-18-workbook-defined-kpis)
3. [Targets (workbook KPI_Targets)](#3-targets-workbook-kpi_targets)
4. [Status thresholds — concept](#4-status-thresholds--concept)
5. [Time intelligence and comparison logic](#5-time-intelligence-and-comparison-logic)
6. [KPI-category mapping (brief §7)](#6-kpi-category-mapping-brief-7)
7. [Domain 1 — Flight Operations](#7-domain-1--flight-operations)
8. [Domain 2 — MRO / Tech Ops](#8-domain-2--mro--tech-ops)
9. [Domain 3 — Crew / People](#9-domain-3--crew--people)
10. [Domain 4 — Passenger / Commercial](#10-domain-4--passenger--commercial)
11. [Domain 5 — Revenue Management](#11-domain-5--revenue-management)
12. [Domain 6 — Finance](#12-domain-6--finance)
13. [Domain 7 — Baggage](#13-domain-7--baggage)
14. [Domain 8 — Cargo](#14-domain-8--cargo)
15. [Domain 9 — Airport / Ground Operations](#15-domain-9--airport--ground-operations)
16. [Domain 10 — Fuel](#16-domain-10--fuel)
17. [Domain 11 — Network / Routes](#17-domain-11--network--routes)
18. [Domain 12 — Ancillary Revenue](#18-domain-12--ancillary-revenue)
19. [Domain 13 — Data Platform](#19-domain-13--data-platform)
20. [Domain 14 — AI / Data Products](#20-domain-14--ai--data-products)
21. [Domain 15 — Data Governance](#21-domain-15--data-governance)
22. [Executive Overview — the 14 landing-page KPIs (brief §8)](#22-executive-overview--the-14-landing-page-kpis-brief-8)
23. [KPI-card display contract](#23-kpi-card-display-contract)
24. [Ambiguities resolved by the workbook, and remaining open questions](#24-ambiguities-resolved-by-the-workbook-and-remaining-open-questions)

---

## 1. Conventions

- **KPI table columns.** Every KPI entry uses the same columns:
  - **Name** — as in the brief / workbook.
  - **Definition** — what the KPI measures, in plain language.
  - **Formula** — the canonical formula. For the 18 workbook-defined
    KPIs this is the `KPI_Definitions` formula verbatim. For other
    brief KPIs the entry states whether a workbook column exists to
    support it; if not, the formula column says **Not in workbook —
    not computed**.
  - **Units** — from `KPI_Definitions` where defined, otherwise as
    supplied in the workbook.
  - **Primary source** — the workbook sheet (and column) the KPI
    engine must read, from `KPI_Definitions` "Primary Source". Where
    two sheets feed one KPI, both are named and the primary-source
    rule in `DATA_MODEL.md` §7 applies (use each KPI's primary
    source; do not reconcile the known quirks).
  - **Direction** — from `KPI_Definitions` where defined ("Higher is
    better" / "Lower is better").
  - **Target** — the workbook `KPI_Targets` value where one exists,
    otherwise "No workbook target".
  - **Comparison** — which comparisons apply (prior period, YoY,
    variance to plan / forecast / target). See §5. **Important:**
    the workbook contains no Plan or Forecast columns in any sheet,
    so variance to plan and variance to forecast **cannot be
    computed from the workbook**; only variance to target is
    computable until plan/forecast data is supplied (see §24).
  - **Pages** — the dashboard pages (brief §9) that use the KPI.
- **Ratios and percentages.** Percentage KPIs are stored as
  proportions (0–1) in the canonical model and displayed as
  percentages, per the validation rules that percentages lie between
  0 and 1 (see `DATA_QUALITY_RULES.md`). Percentage-point (pp)
  changes are used for changes in percentage KPIs; percent (%)
  changes are used for changes in level KPIs.
- **Division by zero / missing denominator.** If a denominator is
  zero or missing, the KPI is null (not zero) and the card shows
  "n/a". The data-quality layer, not the KPI engine, reports the
  underlying data problem.
- **Aggregation.** Monthly KPIs aggregate from monthly measures, not
  by averaging monthly ratios: a ratio KPI over a period is computed
  from the summed numerator and summed denominator over that period
  (e.g. Load Factor over a quarter = total RPM ÷ total ASM for the
  quarter). **Exception — passthrough KPIs:** Dispatch Reliability,
  Ticket Deflection Rate, Data Quality and Platform Availability are
  supplied monthly as values in the workbook; over a period they are
  aggregated as the average of the monthly values (or as the
  period-end value — see §24, item 7), never recomputed from
  underlying counts, because the underlying counts are not in the
  workbook.
- **Currency.** Workbook revenue/cost figures are in "$" as supplied
  (unit "$/ASM", "$/RPM", "$/hour", "$/tonne", "$/pax" in
  `KPI_Definitions`). No currency is named in the workbook; do not
  assume CAD or USD in the UI — display "$" as supplied.
- **Page numbering** follows brief §9 (18 pages) plus the Theme & Branding page (19th).

## 2. The 18 workbook-defined KPIs

This table is transcribed from the workbook's `KPI_Definitions` sheet
(columns: KPI, Domain, Formula/Logic, Unit, Direction, Primary Source).
It is the complete list of KPIs the workbook defines. The KPI engine
must implement exactly these 18; `KPI_Calculated` (header only, 0 data
rows) is the output table the app populates with them (see
`DATA_MODEL.md` §8) — it is **not** an input and must never be read as
a source.

| # | KPI | Domain | Formula / Logic | Unit | Direction | Primary Source |
|---|---|---|---|---|---|---|
| 1 | Load Factor | Flight Operations | RPM / ASM | % | Higher is better | Flight_Operations |
| 2 | RASK | Revenue Management | Passenger Revenue / ASM | $/ASM | Higher is better | Revenue_Management + Flight_Operations |
| 3 | CASM | Finance | Operating Cost / ASM | $/ASM | Lower is better | Finance + Flight_Operations |
| 4 | Yield | Revenue Management | Passenger Revenue / RPM | $/RPM | Higher is better | Revenue_Management + Flight_Operations |
| 5 | D0 | Flight Operations | On-Time Departures / Departures | % | Higher is better | Flight_Operations |
| 6 | D15 | Flight Operations | D15 Departures / Departures | % | Higher is better | Flight_Operations |
| 7 | Aircraft Utilization | Flight Operations | Block Hours / Active Aircraft | hours | Higher is better | Flight_Operations |
| 8 | Dispatch Reliability | MRO / Tech Ops | Dispatch Reliability input (passthrough) | % | Higher is better | MRO_TechOps |
| 9 | Maintenance Cost / Flight Hour | MRO / Tech Ops | Maintenance Cost / Block Hours | $/hour | Lower is better | MRO_TechOps + Flight_Operations |
| 10 | AOG Rate | MRO / Tech Ops | AOG Events / Active Aircraft | rate | Lower is better | MRO_TechOps |
| 11 | Baggage Mishandling Rate | Baggage | Mishandled Bags / Bags Handled | % | Lower is better | Baggage |
| 12 | Cargo Yield | Cargo | Cargo Revenue / Cargo Tonnes | $/tonne | Higher is better | Cargo |
| 13 | Operating Margin | Finance | (Total Revenue − Operating Cost) / Total Revenue | % | Higher is better | Revenue_Management + Finance |
| 14 | Ancillary Revenue / Passenger | Ancillary Revenue | Ancillary Revenue / Passengers | $/pax | Higher is better | Ancillary_Revenue |
| 15 | Ticket Deflection Rate | Data Platform | Deflected Tickets / Platform Demand — **see note below** | % | Higher is better | Data_Platform |
| 16 | Data Quality | Data Platform / Governance | Quality score (passthrough) | % | Higher is better | Data_Platform |
| 17 | Platform Availability | Data Platform | Availability score (passthrough) | % | Higher is better | Data_Platform |
| 18 | Data Product Adoption | AI / Data Products | Active Products / Registered Products | % | Higher is better | AI_Data_Products |

**Notes on the three passthrough KPIs and Ticket Deflection Rate:**

- **Dispatch Reliability** — the workbook supplies a monthly
  `Dispatch Reliability` value in `MRO_TechOps`. The KPI is that
  value, passed through unchanged. There is no formula to compute
  it from disruptions/scheduled departures, because no disruption
  count exists in the workbook.
- **Ticket Deflection Rate** — the workbook states the formula as
  "Deflected Tickets / Platform Demand", but **neither "Deflected
  Tickets" nor "Platform Demand" is a column in the workbook**. The
  workbook carries only the resulting `Ticket Deflection Rate`
  column in `Data_Platform`. This KPI is therefore a **passthrough**,
  not computable from the workbook columns. Flagged here as the
  workbook's own formula is not executable against its own columns.
  Do not invent the two missing inputs.
- **Data Quality / Platform Availability** — monthly values supplied
  in `Data_Platform` (`Data Quality %`, `Platform Availability %`),
  passed through unchanged.
- **Total Revenue** (used by Operating Margin) is **computed, with no
  source column**: Total Revenue = Passenger Revenue + Cargo Revenue
  + Ancillary Revenue + Other Revenue, all from
  `Revenue_Management`. Note `Cargo` also carries a `Cargo Revenue`
  column and `Ancillary_Revenue` also carries an `Ancillary Revenue`
  column; for Total Revenue and Operating Margin use the
  `Revenue_Management` values, per the primary source in
  `KPI_Definitions` (see `DATA_MODEL.md` §7 — do not reconcile).

## 3. Targets (workbook KPI_Targets)

Transcribed from the workbook's `KPI_Targets` sheet (columns: KPI,
Target, Target Type, Notes). **All 18 targets are Target Type
"Enterprise Target" and all carry the note "Synthetic baseline –
replace with approved target".** They are synthetic baselines for
development/demo, not approved WestJet targets, and the UI must be
able to replace them without a code change. Targets are used for
variance-to-target and status (§4) only.

| KPI | Target | Unit |
|---|---|---|
| Load Factor | 0.83 | % (83%) |
| RASK | 0.145 | $/ASM |
| CASM | 0.125 | $/ASM |
| Yield | 0.175 | $/RPM |
| D0 | 0.82 | % (82%) |
| D15 | 0.90 | % (90%) |
| Aircraft Utilization | 10.5 | hours |
| Dispatch Reliability | 0.985 | % (98.5%) |
| Maintenance Cost / Flight Hour | 135 | $/hour |
| AOG Rate | 0.16 | rate |
| Baggage Mishandling Rate | 0.004 | % (0.4%) |
| Cargo Yield | 800 | $/tonne |
| Operating Margin | 0.12 | % (12%) |
| Ancillary Revenue / Passenger | 24 | $/pax |
| Ticket Deflection Rate | 0.40 | % (40%) |
| Data Quality | 0.99 | % (99%) |
| Platform Availability | 0.999 | % (99.9%) |
| Data Product Adoption | 0.75 | % (75%) |

**No workbook target exists** for Total Revenue, Operating Cost,
Passenger Volume (Passengers), Cash Position, or any brief KPI outside
the 18 above. For those KPIs the Executive Overview card shows target
as "n/a" (not zero) until a target is configured.

## 4. Status thresholds — concept

Every KPI card carries a status indicator (favourable / neutral /
unfavourable, or the equivalent RAG-style state used by the theme).
The status is derived from the KPI's variance against its comparison
basis, not from a fixed hard-coded value.

- **Thresholds are configurable.** Each KPI has a configurable
  threshold set (for example, a tolerance band around target, and a
  separate band around prior-year performance). The threshold values
  themselves are **not defined in this specification** and must not be
  invented: the workbook supplies target *values* (§3) but no
  threshold *bands*. Bands are to be configured by the user at run
  time (or supplied with approved targets).
- **Comparison basis for status.** Unless a KPI entry states
  otherwise, status is assessed first against **variance to target**
  where a target exists (§3), otherwise against **YoY** movement,
  otherwise against **prior period** movement. Direction ("Higher is
  better" / "Lower is better", §2) determines which side of the
  variance is favourable.
- **Deterioration warnings.** Domain dashboards (notably MRO, brief
  §10) must surface a warning state when a KPI deteriorates beyond
  its configured threshold, even if the absolute level still looks
  acceptable.

## 5. Time intelligence and comparison logic

Definitions from brief §5. All comparisons are computed by the
centralised KPI engine only — never inside individual UI components.

### 5.1 Period definitions

| Period | Definition |
|---|---|
| Monthly | One calendar month of the loaded date range. Workbook grain is monthly; `Month` is the first of the month (e.g. 2022-01-01). |
| Quarterly | Three consecutive calendar months (calendar quarters, from `Calendar.Quarter`). |
| Annual | One calendar year of the loaded date range (`Calendar.Year`). |
| MTD (month to date) | From the first day of the selected month to the selected end date within that month. With monthly-grain data, MTD equals the selected month. |
| YTD (year to date) | From 1 January of the selected year to the selected end date within that year. With monthly-grain data, YTD is the sum (or period ratio, per §1) of months January through the selected month. |
| Rolling 12 months | The 12 consecutive months ending at the selected end date, inclusive. |
| 3-year trend | Monthly (or annual) values over the three years ending at the selected end date. |
| 5-year trend | Monthly (or annual) values over the five years ending at the selected end date. |
| Selected date range | Any contiguous range chosen with the Date From / Date To filters (brief §6). All KPIs, charts and tables respond to it. |
| Prior Month | The calendar month immediately before the selected month. |
| Prior Year | The same month / quarter / year one calendar year before the selected period. |

### 5.2 Comparison types

| Comparison | Definition | Display |
|---|---|---|
| Prior period | Current period value minus the immediately preceding equivalent period (prior month for monthly, prior quarter for quarterly). | Absolute change; % change for level KPIs, pp change for percentage KPIs. |
| YoY $ | Current period value minus the same period one year earlier, in the KPI's own units (currency KPIs). | Currency amount. |
| YoY % | (Current period − same period prior year) ÷ same period prior year, for level KPIs. For percentage KPIs, the YoY change is expressed in percentage points. | % or pp. |
| Variance to Plan | Actual − Plan for the selected period. **Not computable from the workbook** — no Plan columns exist (see §1, §24). Shown only if plan data is supplied later. | Absolute and % (level KPIs) or pp (percentage KPIs). |
| Variance to Forecast | Actual − Forecast for the selected period. **Not computable from the workbook** — no Forecast columns exist. | As above. |
| Variance to Target | Actual − Target for the selected period, using the §3 targets. The Executive Overview cards (§22) show variance to target explicitly. | Absolute and % (level KPIs) or pp (percentage KPIs). Favourable/unfavourable per the KPI's direction. |
| Plan / Forecast / Target as a series | Targets (§3) are shown as a reference line/series alongside actuals in trend charts. Plan/forecast series do not exist in the workbook. | — |

### 5.3 Rules

- **Dynamic dates.** The available date range is detected at load
  (workbook range Jan 2022–Dec 2026; apps must support 2–5 years
  without code changes — see `DATA_MODEL.md` §6). No period
  definition assumes 2025 or 2026, and no comparison assumes a prior
  year exists: if the prior-year period is outside the loaded range,
  YoY is null ("n/a"), not zero.
- **Actual / Plan / Forecast toggle.** The global filter (brief §6)
  lets the user view Actual, Plan or Forecast as the primary series;
  with the current workbook only Actual is available — Plan and
  Forecast selections must show "not available in the loaded
  workbook" rather than fabricated values.
- **"Good or bad"** is always judged against target/benchmark where
  one exists (brief §25), never against the raw value alone.

## 6. KPI-category mapping (brief §7)

Users can toggle these ten categories on/off as a global filter. Each
KPI belongs to one primary category; a KPI may also appear under a
secondary category where noted.

| Category | Domains / KPIs covered |
|---|---|
| Revenue | Revenue Management; Finance revenue measures; Ancillary Revenue; Cargo Revenue; Route Revenue. |
| Cost | Finance cost measures; Fuel Cost; Maintenance Cost; Labour Cost; CASM; Cost / Flight Hour; Cost / Cycle. |
| Operations | Flight Operations; Airport / Ground Operations; Baggage; Dispatch Reliability; Aircraft Utilisation. |
| People | Crew / People (headcount, training, vacancies, sentiment). |
| Customer | Passenger / Commercial (NPS, retention, channel share, passenger growth, booking behaviour). |
| MRO | MRO / Tech Ops (all §8 KPIs). |
| Network | Network / Routes (route profitability, ranking, contribution). |
| Data Platform | Data Platform (all §19 KPIs). |
| AI / Data Products | AI / Data Products (all §20 KPIs). |
| Governance | Data Governance (all §21 KPIs). |

Notes:

- **Fuel** KPIs are split by category: Fuel Cost → Cost; Fuel Price /
  Fuel Volume / Hedging → Cost (primary), Operations (secondary).
- **Data Quality %** appears under both Data Platform and Governance;
  its primary category is Data Platform.
- **Operating Margin** is Cost + Revenue jointly; its primary category
  is Revenue for filter purposes, and it is also shown on the Finance
  page.
- Toggling a category off hides its KPIs from category-filtered views;
  it does not remove the underlying data or affect other pages' KPI
  cards.

---

## 7. Domain 1 — Flight Operations

Page: **2 Flight Operations**. Category: Operations (primary); Revenue
secondary for ASM/RPM-based revenue KPIs. Source sheet:
`Flight_Operations` (Month, Scheduled Flights, Departures,
Cancellations, On-Time Departures, D15 Departures, ASM, RPM,
Block Hours, Active Aircraft).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Scheduled Flights | Flights scheduled to operate in the period. | Count of scheduled flights | Flights | Flight_Operations.Scheduled Flights | — | No workbook target | Prior period, YoY | 2 |
| Departures | Flights that actually departed. | Count of departures | Flights | Flight_Operations.Departures | — | No workbook target | Prior period, YoY | 2 |
| Cancellations | Scheduled flights that did not operate. | Count, as supplied in `Cancellations` (do not recompute as Scheduled − Departures — the supplied column is authoritative) | Flights | Flight_Operations.Cancellations | Lower is better | No workbook target | Prior period, YoY | 2, 17, 18 |
| On-Time Departures | Departures leaving on time. Workbook `Reference_Data` defines D0 as "Departure on time". | Count of on-time departures | Flights | Flight_Operations.On-Time Departures | — | No workbook target | Prior period, YoY | 2 |
| D0 | Share of departures leaving on time. | **D0 = On-Time Departures / Departures** | % | Flight_Operations | Higher is better | 0.82 | Prior period, YoY, variance to target | 1, 2, 17, 18 |
| D15 | Share of departures leaving within 15 minutes of schedule (`Reference_Data`: "Departure within 15 minutes"). | **D15 = D15 Departures / Departures** | % | Flight_Operations | Higher is better | 0.90 | Prior period, YoY, variance to target | 2, 17, 18 |
| ASM | Available Seat Miles — total seat capacity offered. | Sum of ASM | Seat-miles | Flight_Operations.ASM | — | No workbook target | Prior period, YoY | 1, 2, 5, 6, 17, 18 |
| RPM | Revenue Passenger Miles — paying-passenger distance flown. | Sum of RPM | Passenger-miles | Flight_Operations.RPM | — | No workbook target | Prior period, YoY | 2, 5, 17, 18 |
| Load Factor | Share of available seat capacity filled by paying passengers. | **Load Factor = RPM / ASM** | % | Flight_Operations | Higher is better | 0.83 | Prior period, YoY, variance to target | 1, 2, 5, 6, 17, 18 |
| Block Hours | Total hours from block-out to block-in. | Sum of block hours | Hours | Flight_Operations.Block Hours | — | No workbook target | Prior period, YoY | 2, 6 |
| Aircraft Utilization | Average block hours flown per active aircraft. Uses `Flight_Operations.Active Aircraft` (see quirk note in `DATA_MODEL.md` §7 — `MRO_TechOps` carries a slightly different Active Aircraft figure; do not mix the two). | **Aircraft Utilization = Block Hours / Active Aircraft** | hours | Flight_Operations | Higher is better | 10.5 | Prior period, YoY, variance to target | 1, 2, 6, 17, 18 |
| Active Aircraft | Aircraft available for service in the period, as supplied. | Count, as supplied | Aircraft | Flight_Operations.Active Aircraft | — | No workbook target | Prior period, YoY | 2, 3, 6 |
| Capacity | Total capacity offered. **Not a separate workbook column** — ASM is the capacity measure in this build. | ASM (see note) | Seat-miles | Flight_Operations.ASM | — | No workbook target | Prior period, YoY | 2, 17, 18 |
| Operational Reliability | **Not in workbook — not computed.** No column supplies it; no composite formula is defined in the workbook. | — | — | None | — | — | — | 2 |

Validation constraints that bound these KPIs: ASM ≥ RPM (DQ002);
Departures ≤ Scheduled Flights (DQ003). See
`DATA_QUALITY_RULES.md`.

## 8. Domain 2 — MRO / Tech Ops

Page: **3 MRO / Tech Ops**. Category: MRO (primary); Cost secondary
for maintenance-cost KPIs. Source sheet: `MRO_TechOps` (Month, Active
Aircraft, Maintenance Events, Maintenance Hours, Available
Maintenance Hours, Aircraft Downtime Hours, Dispatch Reliability,
AOG Events, MEL Items, Deferred Defects, Parts Availability,
Maintenance Cost). Brief §10 top KPIs and visualisations apply.

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Active Aircraft | Aircraft available for service, as supplied in this sheet. Differs slightly from `Flight_Operations.Active Aircraft` — use this sheet's figure for MRO KPIs (see `DATA_MODEL.md` §7). | Count, as supplied | Aircraft | MRO_TechOps.Active Aircraft | — | No workbook target | Prior period, YoY | 3 |
| Maintenance Events | Count of maintenance events in the period. | Count | Events | MRO_TechOps.Maintenance Events | — | No workbook target | Prior period, YoY | 3 |
| Maintenance Hours | Total hours spent on maintenance. | Sum | Hours | MRO_TechOps.Maintenance Hours | — | No workbook target | Prior period, YoY | 3 |
| Available Maintenance Hours | Maintenance hours available (capacity). | Sum | Hours | MRO_TechOps.Available Maintenance Hours | — | No workbook target | Prior period, YoY | 3 |
| Aircraft Downtime | Time aircraft were unavailable due to maintenance. Workbook column is `Aircraft Downtime Hours`. | Sum | Hours | MRO_TechOps.Aircraft Downtime Hours | Lower is better | No workbook target | Prior period, YoY | 3 |
| Dispatch Reliability | Share of scheduled departures operating without a maintenance-caused disruption, as supplied monthly. **Passthrough — no formula is executable from the workbook columns.** | **Dispatch Reliability = input value from MRO_TechOps** | % | MRO_TechOps.Dispatch Reliability | Higher is better | 0.985 | Prior period, YoY, variance to target | 1, 3, 17, 18 |
| AOG Events | Count of Aircraft on Ground events (`Reference_Data`: AOG = "Aircraft on ground"). | Count | Events | MRO_TechOps.AOG Events | Lower is better | No workbook target | Prior period, YoY | 3 |
| AOG Rate | AOG events per active aircraft (active aircraft from this sheet). | **AOG Rate = AOG Events / Active Aircraft** | rate | MRO_TechOps | Lower is better | 0.16 | Prior period, YoY, variance to target | 3 |
| MEL Items | Count of Minimum Equipment List items open/carried (`Reference_Data`: MEL = "Minimum Equipment List"). | Count | Items | MRO_TechOps.MEL Items | Lower is better | No workbook target | Prior period, YoY | 3 |
| Deferred Defects | Count of defects deferred to a later maintenance opportunity. | Count | Defects | MRO_TechOps.Deferred Defects | Lower is better | No workbook target | Prior period, YoY | 3 |
| Parts Availability | Share of required parts available when needed, as supplied. | Value as supplied | % | MRO_TechOps.Parts Availability | Higher is better | No workbook target | Prior period, YoY | 3 |
| Maintenance Cost | Total maintenance cost in the period. | Sum | Currency ($) | MRO_TechOps.Maintenance Cost | Lower is better | No workbook target | Prior period, YoY | 3, 6, 12 |
| Maintenance Cost / Flight Hour | Maintenance cost per block hour flown (block hours from `Flight_Operations`). | **Maintenance Cost / Flight Hour = Maintenance Cost / Block Hours** | $/hour | MRO_TechOps + Flight_Operations | Lower is better | 135 | Prior period, YoY, variance to target | 3, 6, 12 |
| Maintenance Cost / Cycle | **Not in workbook — not computed.** No cycle count column exists. | — | — | None | — | — | — | 3, 6 |
| Repeat Defects | **Not in workbook — not computed.** No column exists. | — | — | None | — | — | — | 3 |
| Component Removals | **Not in workbook — not computed.** No column exists. | — | — | None | — | — | — | 3 |
| Reliability | **Not in workbook as a separate KPI — not computed.** Use Dispatch Reliability (§8 above) and Aircraft Availability where supplied; do not invent a composite. | — | — | None | — | — | — | 3 |
| Maintenance TAT | **Not in workbook — not computed.** No start/end or TAT column exists. | — | — | None | — | — | — | 3 |
| Aircraft Availability | **Not in workbook as a column — not computed.** (Available Maintenance Hours is supplied, but no availability % is; do not derive one.) | — | — | None | — | — | — | 3, 17, 18 |
| Line Maintenance | **Not in workbook — not computed.** No line/heavy split exists. | — | — | None | — | — | — | 3 |
| Heavy Maintenance | **Not in workbook — not computed.** No line/heavy split exists. | — | — | None | — | — | — | 3 |

## 9. Domain 3 — Crew / People

Page: **7 Crew / People**. Category: People. Source sheet:
`Crew_People` (Month, Headcount, Training Compliant, Open Critical
Vacancies, Voluntary Leave Rate, Sentiment Index). Only the measures
in this sheet are computable; the remaining brief §3.3 KPIs have no
workbook column and are **not computed**.

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Headcount | Number of people employed, as supplied (period value as supplied — the workbook does not state average vs period-end; see §24). | Count, as supplied | People | Crew_People.Headcount | — | No workbook target | Prior period, YoY | 7, 12 |
| Headcount vs Plan | **Not computable from the workbook** — no planned headcount column exists. | — | — | None | — | — | — | 7 |
| Training Compliance | Share of required training completed, as supplied in `Training Compliant`. Workbook column name is "Training Compliant"; treat the supplied value as the compliance proportion (0–1) unless the workbook's values show otherwise on load — see §24. | Value as supplied | % | Crew_People.Training Compliant | Higher is better | No workbook target | Prior period, YoY | 7 |
| Crew Recency Compliance | **Not in workbook — not computed.** | — | — | None | — | — | — | 7 |
| SIM Completion | **Not in workbook — not computed.** | — | — | None | — | — | — | 7 |
| CBT Completion | **Not in workbook — not computed.** | — | — | None | — | — | — | 7 |
| Voluntary Leave Rate | Share of staff leaving voluntarily, as supplied. | Value as supplied | % | Crew_People.Voluntary Leave Rate | Lower is better | No workbook target | Prior period, YoY | 7 |
| Critical Vacancies | Count of unfilled critical roles. Workbook column is `Open Critical Vacancies`. | Count, as supplied | Roles | Crew_People.Open Critical Vacancies | Lower is better | No workbook target | Prior period, YoY | 7 |
| Sentiment Index | Staff sentiment score as supplied (survey-based index). | Value as supplied | Index | Crew_People.Sentiment Index | Higher is better | No workbook target | Prior period, YoY | 7 |
| Communications Reach | **Not in workbook — not computed.** | — | — | None | — | — | — | 7 |
| Training Pipeline | **Not in workbook — not computed.** | — | — | None | — | — | — | 7 |
| Productivity | **Not in workbook — not computed.** | — | — | None | — | — | — | 7 |

## 10. Domain 4 — Passenger / Commercial

Page: **4 Passenger / Commercial**. Category: Customer (primary);
Revenue secondary for booking/revenue-linked measures. Source sheet:
`Passenger_Commercial` (Month, Bookings, Passengers, Cancelled
Bookings, Corporate Retention, Direct Channel Share, Advance Purchase
Ratio, NPS).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Bookings | Total bookings made in the period. | Count | Bookings | Passenger_Commercial.Bookings | — | No workbook target | Prior period, YoY | 4 |
| Passengers | Passengers carried (boarded). | Count | Passengers | Passenger_Commercial.Passengers | — | No workbook target | Prior period, YoY | 1, 4, 5, 17, 18 |
| Cancellation Rate | Share of bookings cancelled. Derivable from supplied columns (not one of the 18 defined KPIs, but computable). | Cancelled Bookings / Bookings | % | Passenger_Commercial | Lower is better | No workbook target | Prior period, YoY | 4, 17, 18 |
| Booking Intake | **Not in workbook as a separate column — not computed.** Bookings is the only booking-flow measure; do not present it as intake. | — | — | None | — | — | — | 4 |
| Forward Load Factor | **Not in workbook — not computed.** No forward-booking/capacity columns exist. | — | — | None | — | — | — | 4 |
| Book-to-Cancel Ratio | Derivable from supplied columns (not one of the 18 defined KPIs, but computable). | Bookings / Cancelled Bookings (null when Cancelled Bookings = 0) | Ratio | Passenger_Commercial | Higher is better | No workbook target | Prior period, YoY | 4 |
| Corporate Retention | Share of corporate accounts retained, as supplied. | Value as supplied | % | Passenger_Commercial.Corporate Retention | Higher is better | No workbook target | Prior period, YoY | 4 |
| Direct Channel Share | Share of bookings made through direct channels, as supplied. | Value as supplied | % | Passenger_Commercial.Direct Channel Share | Higher is better | No workbook target | Prior period, YoY | 4 |
| Advance Purchase Ratio | Share of bookings made in advance, as supplied. | Value as supplied | % | Passenger_Commercial.Advance Purchase Ratio | Higher is better | No workbook target | Prior period, YoY | 4 |
| NPS | Net Promoter Score as supplied (`Reference_Data`: NPS = "Net Promoter Score"). | Value as supplied | Score (−100 to +100) | Passenger_Commercial.NPS | Higher is better | No workbook target | Prior period, YoY | 4 |
| Passenger Growth | Change in passengers carried versus prior year. Derivable. | (Passengers − Passengers prior year) / Passengers prior year | % | Passenger_Commercial | Higher is better | No workbook target | YoY | 4 |

Validation constraint: Cancelled Bookings ≤ Bookings (DQ004).

## 11. Domain 5 — Revenue Management

Page: **5 Revenue Management**. Category: Revenue. Source sheet:
`Revenue_Management` (Month, Passenger Revenue, Cargo Revenue,
Ancillary Revenue, Other Revenue).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Passenger Revenue | Revenue from passenger ticket sales. | Sum | Currency ($) | Revenue_Management.Passenger Revenue | — | No workbook target | Prior period, YoY | 1, 5, 6, 12, 17, 18 |
| Cargo Revenue | Revenue from cargo (this sheet's value is the one used for Total Revenue; `Cargo.Cargo Revenue` is the cargo-domain value — see `DATA_MODEL.md` §7). | Sum | Currency ($) | Revenue_Management.Cargo Revenue | — | No workbook target | Prior period, YoY | 5, 8, 12 |
| Ancillary Revenue | Revenue from ancillary products (this sheet's value is the one used for Total Revenue; `Ancillary_Revenue.Ancillary Revenue` is the ancillary-domain value). | Sum | Currency ($) | Revenue_Management.Ancillary Revenue | — | No workbook target | Prior period, YoY | 5, 12, 13 |
| Other Revenue | Revenue outside passenger, cargo and ancillary. | Sum | Currency ($) | Revenue_Management.Other Revenue | — | No workbook target | Prior period, YoY | 5, 12 |
| Total Revenue | All revenue combined. **Computed — no source column.** | **Total Revenue = Passenger Revenue + Cargo Revenue + Ancillary Revenue + Other Revenue** (all from Revenue_Management) | Currency ($) | Revenue_Management (computed) | — | No workbook target | Prior period, YoY | 1, 5, 6, 12, 17, 18 |
| RASK | Revenue per Available Seat Mile (brief's formula is authoritative: passenger revenue, not total revenue). | **RASK = Passenger Revenue / ASM** | $/ASM | Revenue_Management + Flight_Operations | Higher is better | 0.145 | Prior period, YoY, variance to target | 1, 5, 6, 17, 18 |
| Yield | Average fare per revenue passenger mile. | **Yield = Passenger Revenue / RPM** | $/RPM | Revenue_Management + Flight_Operations | Higher is better | 0.175 | Prior period, YoY, variance to target | 5, 6, 17, 18 |
| Revenue per Passenger | **Not one of the 18 defined KPIs; not in workbook as a column.** Derivable only if a definition is agreed (Passenger Revenue ÷ Passengers, or Total Revenue ÷ Passengers — see §24). Do not display until defined. | — | — | None (derivable, undefined) | — | — | — | 5 |
| Revenue Growth | Change in total revenue versus prior year. Derivable. | (Total Revenue − Total Revenue prior year) / Total Revenue prior year | % | Revenue_Management (computed) | Higher is better | No workbook target | YoY | 5 |
| Revenue vs Plan | **Not computable from the workbook** — no planned revenue column exists. | — | — | None | — | — | — | 5, 12 |
| Revenue vs Prior Year | Variance of actual revenue to prior year. Derivable. | Actual − Prior Year actual | Currency ($); % | Revenue_Management (computed) | — | No workbook target | YoY | 5, 12 |

## 12. Domain 6 — Finance

Page: **12 Finance**. Category: Cost (cost measures), Revenue
(revenue measures); Operating Margin is Revenue (primary). Source
sheet: `Finance` (Month, Operating Cost, Labour Cost, Fuel Cost,
Other Operating Cost, Cash Position).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Total Revenue | All revenue combined (computed — see §11). | See §11 | Currency ($) | Revenue_Management (computed) | — | No workbook target | Prior period, YoY | 1, 12, 17, 18 |
| Operating Cost | Total operating cost, as supplied. | Sum, as supplied | Currency ($) | Finance.Operating Cost | Lower is better | No workbook target | Prior period, YoY | 1, 12, 17, 18 |
| Labour Cost | Cost of labour. | Sum | Currency ($) | Finance.Labour Cost | Lower is better | No workbook target | Prior period, YoY | 12, 17, 18 |
| Fuel Cost | Cost of fuel, as supplied in this sheet (also derivable in the Fuel domain — use this sheet's value for Finance KPIs). | Sum, as supplied | Currency ($) | Finance.Fuel Cost | Lower is better | No workbook target | Prior period, YoY | 11, 12, 17, 18 |
| Other Operating Cost | Operating cost outside labour and fuel. | Sum | Currency ($) | Finance.Other Operating Cost | Lower is better | No workbook target | Prior period, YoY | 12 |
| Cash Position | Cash held at period end, as supplied. | Period-end balance, as supplied | Currency ($) | Finance.Cash Position | Higher is better | No workbook target | Prior period, YoY | 1, 12, 17, 18 |
| Operating Margin | Share of total revenue retained after operating cost. | **Operating Margin = (Total Revenue − Operating Cost) / Total Revenue** | % | Revenue_Management + Finance | Higher is better | 0.12 | Prior period, YoY, variance to target | 1, 12, 17, 18 |
| CASM | Cost per Available Seat Mile. Defined in brief §4 and §8; listed here because `KPI_Definitions` assigns it to the Finance domain. | **CASM = Operating Cost / ASM** | $/ASM | Finance + Flight_Operations | Lower is better | 0.125 | Prior period, YoY, variance to target | 1, 5, 6, 12, 17, 18 |
| EBIT-style profitability measures | **Not in workbook — not computed.** No EBIT/EBITDA column exists and the brief does not define "EBIT-style". | — | — | None | — | — | — | 12, 17, 18 |
| Cost variance | **Not computable from the workbook** — no planned/forecast cost columns exist. | — | — | None | — | — | — | 12 |
| Revenue variance | **Not computable from the workbook** — no planned/forecast revenue columns exist. | — | — | None | — | — | — | 12 |
| Margin variance | Variance of actual operating margin to target is computable (target 0.12); variance to plan/forecast is not. | Actual Operating Margin − Target Operating Margin | pp | Revenue_Management + Finance | — | 0.12 | Variance to target | 12 |

Note: the brief §13 uses the spelling "CASK" for the scenario output;
CASM and CASK refer to the same measure in this build and the two
spellings must not be treated as different KPIs.

## 13. Domain 7 — Baggage

Page: **8 Baggage**. Category: Operations. Source sheet: `Baggage`
(Month, Bags Handled, Mishandled Bags, Bags Delivered Successfully).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Bags Handled | Total bags handled in the period. | Count | Bags | Baggage.Bags Handled | — | No workbook target | Prior period, YoY | 8 |
| Mishandled Bags | Bags mishandled, as supplied. | Count | Bags | Baggage.Mishandled Bags | Lower is better | No workbook target | Prior period, YoY | 8 |
| Baggage Mishandling Rate | Share of handled bags that were mishandled. | **Baggage Mishandling Rate = Mishandled Bags / Bags Handled** | % | Baggage | Lower is better | 0.004 | Prior period, YoY, variance to target | 8 |
| Successful Delivery Rate | Share of bags delivered successfully. Derivable from supplied columns (not one of the 18 defined KPIs, but computable). | Bags Delivered Successfully / Bags Handled | % | Baggage | Higher is better | No workbook target | Prior period, YoY | 8 |
| Baggage Performance | **Not in workbook as a separate KPI — not computed.** Use Mishandling Rate and Successful Delivery Rate; do not invent a composite. | — | — | None | — | — | — | 8 |
| Baggage-related operational impact | **Not in workbook — not computed.** No impact column exists. | — | — | None | — | — | — | 8 |

## 14. Domain 8 — Cargo

Page: **9 Cargo**. Category: Revenue (revenue/yield), Operations
(tonnes/shipments). Source sheet: `Cargo` (Month, Cargo Tonnes, Cargo
Shipments, Cargo Revenue).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Cargo Tonnes | Total cargo weight carried. | Sum | Tonnes | Cargo.Cargo Tonnes | — | No workbook target | Prior period, YoY | 9 |
| Cargo Shipments | Count of cargo shipments. | Count | Shipments | Cargo.Cargo Shipments | — | No workbook target | Prior period, YoY | 9 |
| Cargo Revenue | Revenue from cargo (cargo-domain value; the Total Revenue computation uses `Revenue_Management.Cargo Revenue` — see §11). | Sum | Currency ($) | Cargo.Cargo Revenue | — | No workbook target | Prior period, YoY | 5, 9, 12 |
| Cargo Yield | Revenue per tonne of cargo carried (uses this sheet's Cargo Revenue). | **Cargo Yield = Cargo Revenue / Cargo Tonnes** | $/tonne | Cargo | Higher is better | 800 | Prior period, YoY, variance to target | 9, 17, 18 |
| Cargo Growth | Change in cargo revenue versus prior year (revenue basis — see §24). Derivable. | (Cargo Revenue − Cargo Revenue prior year) / Cargo Revenue prior year | % | Cargo | Higher is better | No workbook target | YoY | 9 |
| Cargo Revenue vs Plan | **Not computable from the workbook** — no planned cargo revenue column exists. | — | — | None | — | — | — | 9 |

**Period-aggregate Cargo Yield quirk (implemented behaviour).**
Cargo Yield is defined as Cargo Revenue / Cargo Tonnes using the
`Cargo` sheet, and that is what the engine uses for **monthly**
rows: each month's Cargo Yield is the `Cargo` sheet's Cargo Revenue
for that month divided by that month's Cargo Tonnes. For a
**multi-month period aggregate**, however, the engine's
`aggregate_inputs` takes the Cargo Revenue sum from
`Revenue_Management` (the same sum used for Total Revenue) and
divides it by the Cargo Tonnes sum from the `Cargo` sheet. The two
Cargo Revenue columns differ slightly in the workbook (see
`DATA_MODEL.md` §7, quirk 4 — they are not reconciled), so the
period-aggregate Cargo Yield differs slightly from the value the
`Cargo` sheet alone would give. Over the full 60-month workbook
range the difference is small (Revenue_Management-based
$805.71/tonne vs Cargo-sheet-based $804.38/tonne), but it is a real
difference in the computed value, not a rounding effect. The JS
engine reproduces the same aggregate behaviour, so both packages
agree. This is documented here as implemented behaviour; a future
revision may align the period aggregate to the `Cargo` sheet, but
until then the Revenue_Management-based period aggregate governs.

## 15. Domain 9 — Airport / Ground Operations

Page: **10 Airport / Ground**. Category: Operations. Source sheet:
`Airport_Ground` (Month, Aircraft Turns, Average Turnaround Minutes,
Ground OTP, Ground Incidents).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Aircraft Turns | Count of aircraft turnarounds completed. | Count | Turns | Airport_Ground.Aircraft Turns | — | No workbook target | Prior period, YoY | 10 |
| Turnaround Time | Average time to turn an aircraft. Workbook column is `Average Turnaround Minutes`. | Value as supplied | Minutes | Airport_Ground.Average Turnaround Minutes | Lower is better | No workbook target | Prior period, YoY | 10 |
| Ground OTP | On-time performance attributable to ground operations, as supplied. | Value as supplied | % | Airport_Ground.Ground OTP | Higher is better | No workbook target | Prior period, YoY | 10 |
| Ground Incidents | Count of ground-handling incidents. | Count | Incidents | Airport_Ground.Ground Incidents | Lower is better | No workbook target | Prior period, YoY | 10 |
| Gate / Turn Performance | **Not in workbook as a separate KPI — not computed.** Use Aircraft Turns and Average Turnaround Minutes. | — | — | None | — | — | — | 10 |
| Ground Handling Performance | **Not in workbook as a separate KPI — not computed.** Use Ground OTP and Ground Incidents. | — | — | None | — | — | — | 10 |

## 16. Domain 10 — Fuel

Page: **11 Fuel**. Category: Cost. Supports scenario simulation for
fuel-price changes (see `SCENARIO_DEFINITIONS.md`). Source sheet:
`Fuel` (Month, Fuel Price per Litre, Fuel Volume Litres, Hedged %).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Fuel Price | Average fuel price in the period. Workbook column is `Fuel Price per Litre`. | Value as supplied | $/litre | Fuel.Fuel Price per Litre | Lower is better | No workbook target | Prior period, YoY | 11, 17, 18 |
| Fuel Volume | Fuel volume consumed. Workbook column is `Fuel Volume Litres`. | Sum | Litres | Fuel.Fuel Volume Litres | — | No workbook target | Prior period, YoY | 11, 17, 18 |
| Fuel Cost | Total fuel cost. **No Fuel Cost column exists in the Fuel sheet** — use `Finance.Fuel Cost` for the Finance KPI; within the Fuel domain the derivable figure is Fuel Price per Litre × Fuel Volume Litres (see §24 — the two are not reconciled in this spec). | Fuel Price per Litre × Fuel Volume Litres (derivable); or Finance.Fuel Cost (supplied) | Currency ($) | Fuel (derivable) / Finance.Fuel Cost | Lower is better | No workbook target | Prior period, YoY | 11, 12, 17, 18 |
| Fuel Hedging % | Share of fuel hedged. Workbook column is `Hedged %`. | Value as supplied | % | Fuel.Hedged % | — (higher hedging reduces price exposure; direction is not "better" in itself) | No workbook target | Prior period, YoY | 11 |
| Fuel Price Variance | **Not computable from the workbook** — no planned/forecast fuel price column exists. | — | — | None | — | — | — | 11 |
| Fuel Cost Impact | Impact of fuel-price/volume changes on cost. Computed by the scenario engine (see `SCENARIO_DEFINITIONS.md`), not a workbook column. | Scenario output | Currency ($) | Scenario engine | — | No workbook target | Scenario | 11, 17, 18 |

## 17. Domain 11 — Network / Routes

Page: **6 Network / Route Profitability**. Category: Network.
Route-level ranking is required (brief §3.11). Source sheet:
`Network_Routes` (Month, Route, Flights, Passengers, Route Revenue,
Route Cost) — **480 rows, route-month grain** (8 routes × 60 months;
route names are in the workbook — see `DATA_MODEL.md` §5).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Route | Route identifier (origin–destination pair as supplied). Dimension, not a KPI. | — | — | Network_Routes.Route | — | — | — | 6 |
| Flights | Flights operated on the route. | Count | Flights | Network_Routes.Flights | — | No workbook target | Prior period, YoY | 6 |
| Passengers | Passengers carried on the route. | Count | Passengers | Network_Routes.Passengers | — | No workbook target | Prior period, YoY | 6 |
| Route Revenue | Revenue attributable to the route. | Sum | Currency ($) | Network_Routes.Route Revenue | — | No workbook target | Prior period, YoY | 6 |
| Route Cost | Cost attributable to the route. | Sum | Currency ($) | Network_Routes.Route Cost | — | No workbook target | Prior period, YoY | 6 |
| Route Profitability | Profit on the route. Derivable (not one of the 18 defined KPIs). | Route Revenue − Route Cost; margin = (Route Revenue − Route Cost) / Route Revenue | Currency ($); % | Network_Routes | Higher is better | No workbook target | Prior period, YoY, ranking | 6 |
| Revenue per Flight | Route revenue per flight operated. Derivable. | Route Revenue / Flights | $/flight | Network_Routes | Higher is better | No workbook target | Prior period, YoY, ranking | 6 |
| Cost per Flight | Route cost per flight operated. Derivable. | Route Cost / Flights | $/flight | Network_Routes | Lower is better | No workbook target | Prior period, YoY, ranking | 6 |
| Load Factor | **Not computable at route level from the workbook** — `Network_Routes` carries no ASM/RPM columns. Do not display a route Load Factor. | — | — | None | — | — | — | 6 |
| Route Contribution | Share of total route profit/revenue from this route. Derivable. | Route Profit / Total Route Profit (or Route Revenue / Total Route Revenue — state which is shown; see §24) | % | Network_Routes | — | No workbook target | Prior period, YoY, ranking | 6 |

Ranking: routes are ranked by Route Profitability (primary), then by
Route Revenue. Ranking responds to the global filters (date range,
fleet, geography where applicable). Note the workbook has no
fleet/geography columns on `Network_Routes`, so fleet/geography
filtering of routes is not possible from the workbook.

## 18. Domain 12 — Ancillary Revenue

Page: **13 Ancillary Revenue**. Category: Revenue. Source sheet:
`Ancillary_Revenue` (Month, Passengers, Ancillary Revenue, Ancillary
Attach Rate, Ancillary Revenue per Passenger).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Ancillary Revenue | Revenue from ancillary products (ancillary-domain value; Total Revenue uses `Revenue_Management.Ancillary Revenue` — see §11). | Sum | Currency ($) | Ancillary_Revenue.Ancillary Revenue | — | No workbook target | Prior period, YoY | 5, 12, 13, 17, 18 |
| Ancillary Revenue / Passenger | Ancillary revenue per passenger carried. **Uses this sheet's `Passengers` column** (which differs slightly from `Passenger_Commercial.Passengers` — see `DATA_MODEL.md` §7; do not substitute). | **Ancillary Revenue / Passenger = Ancillary Revenue / Passengers** | $/pax | Ancillary_Revenue | Higher is better | 24 | Prior period, YoY, variance to target | 13 |
| Attach Rate | Share of passengers purchasing an ancillary product, as supplied. Workbook column is `Ancillary Attach Rate`. | Value as supplied | % | Ancillary_Revenue.Ancillary Attach Rate | Higher is better | No workbook target | Prior period, YoY | 13 |
| Ancillary Growth | Change in ancillary revenue versus prior year. Derivable. | (Ancillary Revenue − Ancillary Revenue prior year) / Ancillary Revenue prior year | % | Ancillary_Revenue | Higher is better | No workbook target | YoY | 13 |
| Revenue Contribution | Share of total revenue from ancillary revenue. Derivable. | Ancillary Revenue / Total Revenue | % | Ancillary_Revenue + Revenue_Management | — | No workbook target | Prior period, YoY | 13 |

Note: the workbook also supplies `Ancillary Revenue per Passenger` as
a column in this sheet. The KPI engine must **compute** the KPI from
Ancillary Revenue ÷ Passengers (per `KPI_Definitions`) and may use the
supplied column only as a cross-check; the computed value governs.

## 19. Domain 13 — Data Platform

Page: **14 Data Platform**. Category: Data Platform. Brief §11 gives
the primary KPIs and the executive summary groupings (Platform Health,
Adoption, Reliability, Quality, Support Efficiency). Source sheet:
`Data_Platform` (Month, Active Self-Service Users, Registered Users,
Platform Tickets, Ticket Deflection Rate, Data Quality %,
Platform Availability %, Average Freshness Minutes, Knowledge Base
Uses, Security Groups).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Active Self-Service Users | Users actively using self-service data capabilities. | Count | Users | Data_Platform.Active Self-Service Users | Higher is better | No workbook target | Prior period, YoY | 14 |
| Registered Users | Total registered platform users. | Count | Users | Data_Platform.Registered Users | — | No workbook target | Prior period, YoY | 14 |
| Platform Tickets | Support/platform tickets raised in the period. | Count | Tickets | Data_Platform.Platform Tickets | Lower is better | No workbook target | Prior period, YoY | 14 |
| Ticket Deflection Rate | Share of potential tickets avoided through self-service / knowledge base. **Passthrough** — formula "Deflected Tickets / Platform Demand" is not executable (neither input is a workbook column); the supplied `Ticket Deflection Rate` value governs. | **Ticket Deflection Rate = value as supplied in Data_Platform** | % | Data_Platform.Ticket Deflection Rate | Higher is better | 0.40 | Prior period, YoY, variance to target | 14 |
| Data Quality % | Share of data meeting quality standards, as supplied. **Passthrough.** | **Data Quality = value as supplied in Data_Platform ("Data Quality %")** | % | Data_Platform.Data Quality % | Higher is better | 0.99 | Prior period, YoY, variance to target | 1, 14, 16, 18 |
| Platform Availability % | Share of time the platform was available, as supplied. **Passthrough.** | **Platform Availability = value as supplied in Data_Platform ("Platform Availability %")** | % | Data_Platform.Platform Availability % | Higher is better | 0.999 | Prior period, YoY, variance to target | 1, 14, 18 |
| Average Data Freshness | Average age/latency of data on the platform. Workbook column is `Average Freshness Minutes`. | Value as supplied | Minutes | Data_Platform.Average Freshness Minutes | Lower is better | No workbook target | Prior period, YoY | 14 |
| Knowledge Base Usage | Usage of the knowledge base, as supplied. Workbook column is `Knowledge Base Uses` (`Reference_Data`: KB = "Knowledge Base"). | Count, as supplied | Uses | Data_Platform.Knowledge Base Uses | Higher is better | No workbook target | Prior period, YoY | 14 |
| Security Groups | Count of security groups (access groups) on the platform. | Count | Groups | Data_Platform.Security Groups | — | No workbook target | Prior period, YoY | 14 |
| Platform Adoption | Overall adoption of the platform. **Not supplied as a column** — derivable as Active Self-Service Users ÷ Registered Users (see §24 for confirmation). Do not display until the derivation is confirmed. | Active Self-Service Users / Registered Users (proposed, unconfirmed) | % | Data_Platform | Higher is better | No workbook target | Prior period, YoY | 14 |
| Platform Reliability | **Not in workbook as a separate KPI — not computed.** Use Platform Availability %; do not invent a composite. | — | — | None | — | — | — | 14 |
| Self-Service Adoption | Share of registered users actively using self-service. Derivable (same derivation as Platform Adoption — see §24; if both are shown they must not be presented as different measures without a defined distinction). | Active Self-Service Users / Registered Users | % | Data_Platform | Higher is better | No workbook target | Prior period, YoY | 14 |
| Logs / Platform Activity | **Not in workbook — not computed.** No log/activity column exists. | — | — | None | — | — | — | 14 |

## 20. Domain 14 — AI / Data Products

Page: **15 AI / Data Products**. Category: AI / Data Products.
Source sheet: `AI_Data_Products` (Month, Registered Data Products,
Active Data Products, Adoption Rate, Estimated Business Value,
Critical Incidents).

Lifecycle (brief §3.14): Idea → Discovery → Development → Certified →
Production → Adopted → Scaled → Retired. **The workbook carries no
lifecycle-stage column** — lifecycle cannot be displayed from the
workbook, and no stage counts as "active" beyond the supplied
`Active Data Products` count.

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Registered Data Products | Total data products registered. | Count | Products | AI_Data_Products.Registered Data Products | — | No workbook target | Prior period, YoY | 15 |
| Active Data Products | Data products in active use, as supplied. | Count | Products | AI_Data_Products.Active Data Products | Higher is better | No workbook target | Prior period, YoY | 15 |
| Data Product Adoption | Share of registered products that are active. | **Data Product Adoption = Active Data Products / Registered Data Products** | % | AI_Data_Products | Higher is better | 0.75 | Prior period, YoY, variance to target | 1, 15, 18 |
| Estimated Business Value | Estimated business value of data products, as supplied. | Sum | Currency ($) | AI_Data_Products.Estimated Business Value | Higher is better | No workbook target | Prior period, YoY | 15 |
| Critical Incidents | Count of critical incidents affecting data products. | Count | Incidents | AI_Data_Products.Critical Incidents | Lower is better | No workbook target | Prior period, YoY | 15 |
| Product Reliability | **Not in workbook — not computed.** No column exists. | — | — | None | — | — | — | 15 |
| Product Quality | **Not in workbook — not computed.** No column exists. | — | — | None | — | — | — | 15 |
| Consumer Adoption | **Not in workbook as a separate measure — not computed.** The workbook supplies `Adoption Rate` in this sheet; see note below. | — | — | None | — | — | — | 15 |

**Adoption Rate note.** `AI_Data_Products.Adoption Rate` is supplied
as a column but is **not** one of the 18 defined KPIs and its
definition is not given in the workbook. Do not display it as Data
Product Adoption (which is computed as Active ÷ Registered) and do
not display it as Consumer Adoption. It may be used only as a
cross-check once its definition is confirmed (see §24).

Validation constraint (brief §19, not a workbook DQ rule — see
`DATA_QUALITY_RULES.md` rule BR-02): Active Products ≤ Registered
Products.

## 21. Domain 15 — Data Governance

Page: **16 Data Governance**. Category: Governance. Source sheet:
`Data_Governance` (Month, Registered Data Assets, Classified Assets,
Assets with Owner, Governance Quality %, Open Governance Exceptions).

| Name | Definition | Formula | Units | Primary source | Direction | Target | Comparison | Pages |
|---|---|---|---|---|---|---|---|---|
| Registered Data Assets | Total data assets registered. | Count | Assets | Data_Governance.Registered Data Assets | — | No workbook target | Prior period, YoY | 16 |
| Classified Assets | Data assets with a classification applied. | Count | Assets | Data_Governance.Classified Assets | Higher is better | No workbook target | Prior period, YoY | 16 |
| Assets with Owner | Data assets with an assigned owner. | Count | Assets | Data_Governance.Assets with Owner | Higher is better | No workbook target | Prior period, YoY | 16 |
| Governance Quality | Overall governance quality, as supplied. Workbook column is `Governance Quality %`. **Passthrough — no composite formula is defined.** | Value as supplied | % | Data_Governance.Governance Quality % | Higher is better | No workbook target | Prior period, YoY | 16 |
| Open Governance Exceptions | Count of governance exceptions still open. | Count | Exceptions | Data_Governance.Open Governance Exceptions | Lower is better | No workbook target | Prior period, YoY | 16 |
| Data Stewardship | **Not in workbook as a separate KPI — not computed.** Ownership Coverage (below) is the closest supplied measure. | — | — | None | — | — | — | 16 |
| Classification Coverage | Share of registered assets that are classified. Derivable. | Classified Assets / Registered Data Assets | % | Data_Governance | Higher is better | No workbook target | Prior period, YoY | 16 |
| Ownership Coverage | Share of registered assets with an owner. Derivable. | Assets with Owner / Registered Data Assets | % | Data_Governance | Higher is better | No workbook target | Prior period, YoY | 16 |
| Quality Exceptions | **Not in workbook as a separate column — not computed.** Open Governance Exceptions is the supplied exception count; do not present it under two names. | — | — | None | — | — | — | 16 |

Validation constraint: Classified Assets ≤ Registered Data Assets
(DQ008). Known quirk: Assets with Owner is far below Registered
Data Assets in the workbook — document, do not reconcile (see
`DATA_MODEL.md` §7).

## 22. Executive Overview — the 14 landing-page KPIs (brief §8)

Page: **1 Executive Overview**. Title: "WestJet Enterprise Aviation
Control Tower". Subtitle: "Enterprise Performance · Operations ·
Commercial · MRO · Data & AI".

Each card shows: current value, previous period, YoY %, target,
variance to target, mini trend, status indicator (§4, §23). All 14
are defined in their domain sections above; this table is the
cross-reference and the landing-page contract — it defines no new
formula.

| # | KPI | Domain (§) | Category | Formula (canonical) | Target (workbook) |
|---|---|---|---|---|---|
| 1 | Total Revenue | Revenue Mgmt (§11) / Finance (§12) | Revenue | Passenger + Cargo + Ancillary + Other Revenue (computed) | No workbook target — show "n/a" |
| 2 | Operating Cost | Finance (§12) | Cost | Sum, as supplied in Finance | No workbook target — show "n/a" |
| 3 | Operating Margin | Finance (§12) | Revenue | **(Total Revenue − Operating Cost) / Total Revenue** | 0.12 |
| 4 | RASK | Revenue Mgmt (§11) | Revenue | **Passenger Revenue / ASM** | 0.145 |
| 5 | CASM | Finance (§12) | Cost | **Operating Cost / ASM** | 0.125 |
| 6 | Load Factor | Flight Ops (§7) | Operations | **RPM / ASM** | 0.83 |
| 7 | D0 | Flight Ops (§7) | Operations | **On-Time Departures / Departures** | 0.82 |
| 8 | Dispatch Reliability | MRO (§8) | MRO | Passthrough from MRO_TechOps | 0.985 |
| 9 | Aircraft Utilization | Flight Ops (§7) | Operations | **Block Hours / Active Aircraft** | 10.5 |
| 10 | Passenger Volume | Passenger (§10) | Customer | Count of Passengers (Passenger_Commercial) | No workbook target — show "n/a" |
| 11 | Cash Position | Finance (§12) | Revenue | Period-end balance, as supplied in Finance | No workbook target — show "n/a" |
| 12 | Data Quality | Data Platform (§19) | Data Platform | Passthrough from Data_Platform ("Data Quality %") | 0.99 |
| 13 | Platform Availability | Data Platform (§19) | Data Platform | Passthrough from Data_Platform ("Platform Availability %") | 0.999 |
| 14 | Data Product Adoption | AI / Data Products (§20) | AI / Data Products | **Active Data Products / Registered Data Products** | 0.75 |

## 23. KPI-card display contract

Applies to every KPI card on every page (brief §8, §15, §16):

- **Current value** — value for the selected period / date range, in
  the KPI's units, formatted per the shared formatting rules.
- **Previous period** — value for the immediately preceding
  equivalent period (§5.2).
- **YoY %** — YoY change (§5.2); "n/a" where the prior-year period
  is outside the loaded range.
- **Target** — the §3 target where one exists; "n/a" (not zero)
  where no workbook target exists.
- **Variance to target** — actual minus target, with favourable /
  unfavourable colouring per the KPI's direction (§2). Shown only
  where a target exists.
- **Mini trend** — sparkline over the selected range (monthly points).
- **Status indicator** — per §4.
- **Drill-down** — where applicable, clicking a card navigates
  KPI → Domain Dashboard → Detailed Data (brief §16).
- **Hover** — hover shows the definition and formula (from this
  dictionary) and the comparison values.
- **Synthetic-data badge** — every page carries the visible
  **SYNTHETIC DATA** badge (brief §1); KPI cards never present
  synthetic values as actual WestJet performance.

## 24. Ambiguities resolved by the workbook, and remaining open questions

### 24.1 Resolved by the workbook

1. **Dispatch Reliability** — resolved: passthrough from
   `MRO_TechOps.Dispatch Reliability`. No formula is needed.
2. **Data Quality / Platform Availability** — resolved: passthroughs
   from `Data_Platform`.
3. **Ticket Deflection Rate** — resolved as a passthrough, with the
   flag that its stated formula is not executable against the
   workbook columns (§2).
4. **Total Revenue** — resolved: computed as the sum of the four
   `Revenue_Management` components; no source column.
5. **CASM** — resolved: Finance domain, Operating Cost / ASM,
   target 0.125. CASM = CASK (same measure, two spellings).
6. **Targets** — resolved: 18 enterprise targets in `KPI_Targets`,
   all synthetic baselines to be replaced with approved targets.
7. **D0/D15** — resolved in part: `Reference_Data` defines D0 as
   "Departure on time" and D15 as "Departure within 15 minutes".
   Whether D15 departures include D0 departures (i.e. whether the
   D15 count is cumulative) is still open — see item 8 below.
8. **Route grain** — resolved: `Network_Routes` is route-month
   grain, 480 rows (8 routes × 60 months).

### 24.2 Still open — needs a decision from Ehsan before the KPI engine is written

1. **No Plan / Forecast columns anywhere in the workbook.** Variance
   to plan, variance to forecast, the Actual/Plan/Forecast toggle,
   and headcount/revenue/cost "vs plan" KPIs cannot be computed
   until plan/forecast data is supplied. Confirm whether a plan/
   forecast workbook (or columns) will follow, or whether those
   comparisons are out of scope for this build.
2. **D15 cumulative?** Is `D15 Departures` a count that includes
   on-time (D0) departures, or only departures delayed 1–15 minutes?
   (Affects only interpretation, not the D15 formula.)
3. **Headcount grain.** Is `Crew_People.Headcount` a period-end count
   or a period average? Affects nothing in the 18 defined KPIs, but
   affects any per-person derivation.
4. **`Crew_People.Training Compliant`.** Is the supplied value a
   proportion (0–1) or a count of compliant staff? If a count, the
   denominator (staff requiring training) is not in the workbook and
   Training Compliance cannot be computed as a rate.
5. **Revenue per Passenger.** Passenger Revenue ÷ Passengers, or
   Total Revenue ÷ Passengers? And which Passengers column
   (`Passenger_Commercial` or `Ancillary_Revenue`)?
6. **Fuel Cost reconciliation.** `Finance.Fuel Cost` (supplied) vs
   Fuel Price per Litre × Fuel Volume Litres (derivable). Which
   governs the Fuel page, and is a reconciliation check required?
7. **Passthrough aggregation.** Over a multi-month period, are
   passthrough KPIs (Dispatch Reliability, Ticket Deflection Rate,
   Data Quality, Platform Availability, and the supplied
   proportion columns) averaged across months, or is the period-end
   month's value shown? Recommend simple average of monthly values;
   confirm.
8. **Platform Adoption vs Self-Service Adoption.** Both derive as
   Active Self-Service Users ÷ Registered Users from the workbook
   columns. Are they the same measure under two names, or is there a
   distinction? Confirm before showing both.
9. **`AI_Data_Products.Adoption Rate`.** What is its definition, and
   how does it relate to Data Product Adoption (Active ÷ Registered)
   and to Consumer Adoption?
10. **Cargo Growth basis.** Revenue or tonnes? This spec assumes
    revenue (§14); confirm.
11. **Route Contribution basis.** Profit share or revenue share?
    This spec lists both; confirm which is displayed.
12. **Route Load Factor.** Not computable (no route ASM/RPM). Confirm
    it is out of scope rather than derived from route passengers by
    an assumed seat count.
13. **Brief KPIs with no workbook column** (§§7–21, marked "Not in
    workbook — not computed"): confirm they are out of scope for
    this build and must not appear as KPI cards, rather than being
    sourced from a second workbook to follow.
14. **Targets for Total Revenue, Operating Cost, Passenger Volume,
    Cash Position.** No workbook target exists. Confirm whether
    targets for these four Executive Overview KPIs will be supplied
    or whether their cards show target "n/a" permanently.

---

*End of KPI Dictionary. Companion specs: `DATA_MODEL.md`,
`SCENARIO_DEFINITIONS.md`, `DATA_QUALITY_RULES.md`. Workbook:
`~/workspace/user/files/WestJet_Enterprise_Control_Tower_Input_Template.xlsx`.*
