# Data Model — WestJet Enterprise Aviation Intelligence & Control Tower

**Status:** Shared specification — authoritative for both packages
(`01_WestJet_Control_Tower_Streamlit/` and `02_WestJet_Control_Tower_HTML_JS/`).
**Sources:** `COORDINATOR_BRIEF.md` sections 2, 3 and 5, and the verified
input workbook
`~/workspace/user/files/WestJet_Enterprise_Control_Tower_Input_Template.xlsx`
(23 sheets, monthly data Jan 2022–Dec 2026, 60 months, synthetic/demo
only — verified 2026-11-08 by reading the workbook).
**Spelling:** en-GB throughout (sheet and column names are reproduced
exactly as in the workbook).

> **Workbook schema is real and verified.** Sheet and column names
> below are transcribed from the workbook, not invented. Where the
> brief lists a field with no workbook column, this document says so.
>
> **Synthetic data.** All workbook values are synthetic/demo data.
> The apps must always show the visible **SYNTHETIC DATA** badge and
> never present workbook values as actual WestJet performance
> (brief §1).

## Contents

1. [Overview and architecture](#1-overview-and-architecture)
2. [Workbook inventory — all 23 sheets](#2-workbook-inventory--all-23-sheets)
3. [Canonical tables — the 15 domains](#3-canonical-tables--the-15-domains)
4. [Calendar table](#4-calendar-table)
5. [Network_Routes — route-month grain](#5-network_routes--route-month-grain)
6. [Dynamic date-range rule](#6-dynamic-date-range-rule)
7. [Primary-source rule and known quirks — do not reconcile](#7-primary-source-rule-and-known-quirks--do-not-reconcile)
8. [KPI_Calculated — output table, not an input](#8-kpi_calculated--output-table-not-an-input)
9. [Meta sheets — KPI_Definitions, KPI_Targets, Scenarios, Reference_Data, Data_Quality](#9-meta-sheets--kpi_definitions-kpi_targets-scenarios-reference_data-data_quality)
10. [Relationships between tables](#10-relationships-between-tables)
11. [Field types and conventions](#11-field-types-and-conventions)
12. [Synthetic-data labelling rule](#12-synthetic-data-labelling-rule)
13. [What the workbook does not contain](#13-what-the-workbook-does-not-contain)
14. [Open questions](#14-open-questions)

---

## 1. Overview and architecture

Pipeline (brief §2):

```
Excel Workbook → File/Data Loader → Schema Validation → Data Quality
Validation Engine → Canonical Aviation Data Model → KPI Calculation
Engine → Scenario Engine → WestJet Control Tower
(→ Streamlit App + HTML/JS App)
```

The canonical model is a set of monthly tables, one per domain, plus
a Calendar table and one route-month table. The loader maps each
workbook sheet to exactly one canonical table (sheet → table mapping
in §3). The KPI engine reads only the canonical model, never the
workbook directly. Both packages use the same canonical model, the
same KPI definitions (`KPI_DICTIONARY.md`), the same scenario logic
(`SCENARIO_DEFINITIONS.md`) and the same data-quality rules
(`DATA_QUALITY_RULES.md`).

**Grain.** Every domain table is **monthly per domain entity**:

- Monthly (one row per month) for the 14 single-entity domains.
- Monthly per route (`Network_Routes`): one row per route per month.
- The Calendar table is monthly (one row per month).

## 2. Workbook inventory — all 23 sheets

Verified by reading the workbook. Row counts include the header row.

| # | Sheet | Rows | Grain | Role |
|---|---|---|---|---|
| 1 | README | 9 | — | Workbook documentation (not loaded as data) |
| 2 | Calendar | 61 | Monthly | Date dimension |
| 3 | Flight_Operations | 61 | Monthly | Domain 1 |
| 4 | MRO_TechOps | 61 | Monthly | Domain 2 |
| 5 | Crew_People | 61 | Monthly | Domain 3 |
| 6 | Passenger_Commercial | 61 | Monthly | Domain 4 |
| 7 | Revenue_Management | 61 | Monthly | Domain 5 |
| 8 | Finance | 61 | Monthly | Domain 6 |
| 9 | Baggage | 61 | Monthly | Domain 7 |
| 10 | Cargo | 61 | Monthly | Domain 8 |
| 11 | Airport_Ground | 61 | Monthly | Domain 9 |
| 12 | Fuel | 61 | Monthly | Domain 10 |
| 13 | Network_Routes | 481 | Route-month | Domain 11 (8 routes × 60 months) |
| 14 | Ancillary_Revenue | 61 | Monthly | Domain 12 |
| 15 | Data_Platform | 61 | Monthly | Domain 13 |
| 16 | AI_Data_Products | 61 | Monthly | Domain 14 |
| 17 | Data_Governance | 61 | Monthly | Domain 15 |
| 18 | KPI_Definitions | 19 | — | Meta: 18 KPI definitions |
| 19 | KPI_Targets | 19 | — | Meta: 18 KPI targets |
| 20 | Scenarios | 10 | — | Meta: 9 preset scenarios S001–S009 |
| 21 | Reference_Data | 9 | — | Meta: 8 reference rows |
| 22 | Data_Quality | 9 | — | Meta: 8 rules DQ001–DQ008 |
| 23 | KPI_Calculated | 61 | Monthly | **Output** — header only, 0 data rows; the app populates it (see §8) |

"61 rows" = header + 60 monthly data rows (Jan 2022–Dec 2026).
"481 rows" = header + 480 route-month rows. `KPI_Calculated` has
61 rows in the file but all 60 data rows are entirely empty — 0 data
rows (verified).

## 3. Canonical tables — the 15 domains

One canonical table per domain. Column names below are the exact
workbook column names. "Measure" columns are the workbook's actual /
supplied values; there are **no Plan or Forecast columns** in any
sheet (see §13).

### 3.1 Flight Operations — `Flight_Operations`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key — joins to Calendar.Month |
| Scheduled Flights | Number (count) | Measure |
| Departures | Number (count) | Measure |
| Cancellations | Number (count) | Measure |
| On-Time Departures | Number (count) | Measure |
| D15 Departures | Number (count) | Measure |
| ASM | Number | Measure |
| RPM | Number | Measure |
| Block Hours | Number | Measure |
| Active Aircraft | Number (count) | Measure — **use for Aircraft Utilization** |

### 3.2 MRO / Tech Ops — `MRO_TechOps`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Active Aircraft | Number (count) | Measure — **use for AOG Rate** (differs slightly from Flight_Operations — see §7) |
| Maintenance Events | Number (count) | Measure |
| Maintenance Hours | Number | Measure |
| Available Maintenance Hours | Number | Measure |
| Aircraft Downtime Hours | Number | Measure |
| Dispatch Reliability | Proportion (0–1) | Passthrough KPI input (see KPI_DICTIONARY.md §2) |
| AOG Events | Number (count) | Measure |
| MEL Items | Number (count) | Measure |
| Deferred Defects | Number (count) | Measure |
| Parts Availability | Proportion (0–1) | Measure, as supplied |
| Maintenance Cost | Currency ($) | Measure |

Design note (brief §3.2): MRO is a first-class domain — extra MRO
fields must be addable without changing the dashboard architecture.
The loader must therefore map `MRO_TechOps` columns by name and pass
through any additional columns it finds (flagging them as unmapped
for the data-quality report) rather than failing on an unknown column.

### 3.3 Crew / People — `Crew_People`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Headcount | Number (count) | Measure |
| Training Compliant | Proportion (0–1) — see open question §14.1 | Measure, as supplied |
| Open Critical Vacancies | Number (count) | Measure |
| Voluntary Leave Rate | Proportion (0–1) | Measure, as supplied |
| Sentiment Index | Number (index) | Measure, as supplied |

### 3.4 Passenger / Commercial — `Passenger_Commercial`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Bookings | Number (count) | Measure |
| Passengers | Number (count) | Measure — **use for Passenger Volume** |
| Cancelled Bookings | Number (count) | Measure |
| Corporate Retention | Proportion (0–1) | Measure, as supplied |
| Direct Channel Share | Proportion (0–1) | Measure, as supplied |
| Advance Purchase Ratio | Proportion (0–1) | Measure, as supplied |
| NPS | Number (score, −100 to +100) | Measure, as supplied |

### 3.5 Revenue Management — `Revenue_Management`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Passenger Revenue | Currency ($) | Measure |
| Cargo Revenue | Currency ($) | Measure — **use for Total Revenue** |
| Ancillary Revenue | Currency ($) | Measure — **use for Total Revenue** |
| Other Revenue | Currency ($) | Measure |

Total Revenue is **computed** in the KPI engine (sum of the four
columns above). There is no Total Revenue source column.

### 3.6 Finance — `Finance`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Operating Cost | Currency ($) | Measure |
| Labour Cost | Currency ($) | Measure |
| Fuel Cost | Currency ($) | Measure |
| Other Operating Cost | Currency ($) | Measure |
| Cash Position | Currency ($) | Measure (period-end balance, as supplied) |

### 3.7 Baggage — `Baggage`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Bags Handled | Number (count) | Measure |
| Mishandled Bags | Number (count) | Measure |
| Bags Delivered Successfully | Number (count) | Measure |

### 3.8 Cargo — `Cargo`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Cargo Tonnes | Number | Measure |
| Cargo Shipments | Number (count) | Measure |
| Cargo Revenue | Currency ($) | Measure — **use for Cargo Yield** |

### 3.9 Airport / Ground Operations — `Airport_Ground`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Aircraft Turns | Number (count) | Measure |
| Average Turnaround Minutes | Number | Measure, as supplied |
| Ground OTP | Proportion (0–1) | Measure, as supplied |
| Ground Incidents | Number (count) | Measure |

### 3.10 Fuel — `Fuel`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Fuel Price per Litre | Currency ($/litre) | Measure |
| Fuel Volume Litres | Number | Measure |
| Hedged % | Proportion (0–1) | Measure, as supplied |

There is **no Fuel Cost column** in this sheet. Fuel Cost for
Finance KPIs comes from `Finance.Fuel Cost`.

### 3.11 Network / Routes — `Network_Routes`

See §5 (route-month grain).

### 3.12 Ancillary Revenue — `Ancillary_Revenue`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Passengers | Number (count) | Measure — **use for Ancillary Revenue / Passenger** (differs slightly from Passenger_Commercial.Passengers — see §7) |
| Ancillary Revenue | Currency ($) | Measure — **use for Ancillary Revenue / Passenger** |
| Ancillary Attach Rate | Proportion (0–1) | Measure, as supplied |
| Ancillary Revenue per Passenger | Currency ($/pax) | Measure, as supplied — **cross-check only**; the KPI engine computes Ancillary Revenue / Passenger from the two columns above (see KPI_DICTIONARY.md §18) |

### 3.13 Data Platform — `Data_Platform`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Active Self-Service Users | Number (count) | Measure |
| Registered Users | Number (count) | Measure |
| Platform Tickets | Number (count) | Measure |
| Ticket Deflection Rate | Proportion (0–1) | Passthrough KPI (see KPI_DICTIONARY.md §2) |
| Data Quality % | Proportion (0–1) | Passthrough KPI |
| Platform Availability % | Proportion (0–1) | Passthrough KPI |
| Average Freshness Minutes | Number | Measure, as supplied |
| Knowledge Base Uses | Number (count) | Measure |
| Security Groups | Number (count) | Measure |

### 3.14 AI / Data Products — `AI_Data_Products`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Registered Data Products | Number (count) | Measure |
| Active Data Products | Number (count) | Measure |
| Adoption Rate | Proportion (0–1) | Measure, as supplied — **definition not given in the workbook**; do not display as Data Product Adoption or Consumer Adoption (see KPI_DICTIONARY.md §20) |
| Estimated Business Value | Currency ($) | Measure |
| Critical Incidents | Number (count) | Measure |

### 3.15 Data Governance — `Data_Governance`

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key |
| Registered Data Assets | Number (count) | Measure |
| Classified Assets | Number (count) | Measure |
| Assets with Owner | Number (count) | Measure |
| Governance Quality % | Proportion (0–1) | Measure, as supplied (passthrough) |
| Open Governance Exceptions | Number (count) | Measure |

## 4. Calendar table

Sheet: `Calendar` (60 rows). Columns (exact):

| Column | Type | Role / notes |
|---|---|---|
| Month | Date (first of month, e.g. 2022-01-01) | Key — every domain table joins on this |
| Year | Number (e.g. 2022) | Year dimension / filter |
| Month Name | Text (e.g. "Jan") | Display label |
| Month Number | Number (1–12) | Month dimension / filter |
| Quarter | Text (e.g. "Q1") | Quarter dimension / filter |
| Year-Month | Text (e.g. "2022-01") | Display label / sort key |
| Period Type | Text (value "YTD" in all rows read) | As supplied — do not rely on it for period logic; the KPI engine derives MTD/YTD/rolling periods itself (KPI_DICTIONARY.md §5) |
| Rolling Period | Text (value "Rolling 12M" in all rows read) | As supplied — same caution as Period Type |

The Calendar table is the date dimension for all filters (Year,
Quarter, Month, Date From / Date To). The KPI engine must derive
period membership from `Month` itself, not from the `Period Type` /
`Rolling Period` text values, which are constant in the workbook as
supplied.

## 5. Network_Routes — route-month grain

Sheet: `Network_Routes` (480 rows = 8 routes × 60 months).

| Column | Type | Role |
|---|---|---|
| Month | Date (first of month) | Key — joins to Calendar.Month |
| Route | Text | Key — route dimension (origin–destination pair as supplied) |
| Flights | Number (count) | Measure |
| Passengers | Number (count) | Measure |
| Route Revenue | Currency ($) | Measure |
| Route Cost | Currency ($) | Measure |

**Composite key:** (Month, Route). Duplicate (Month, Route) pairs
are a data-quality failure (see `DATA_QUALITY_RULES.md` rule
BR-01). Route-level ranking is by Route Profitability (Route Revenue
− Route Cost), then Route Revenue (see KPI_DICTIONARY.md §17).
There are **no ASM/RPM columns** on this sheet, so route Load Factor
is not computable. There are **no fleet or geography columns** on
this sheet, so fleet/geography filtering of routes is not possible
from the workbook.

Route names themselves are workbook data (8 routes); they are not
reproduced in this spec because they are data, not schema — the apps
read them from the sheet at load.

## 6. Dynamic date-range rule

- **Detected at load.** The apps detect the available date range
  from the loaded workbook (minimum and maximum `Month` across the
  monthly tables / Calendar). The workbook as supplied covers
  **Jan 2022–Dec 2026 (60 months)**.
- **Support 2–5 years without code changes** (brief §1). The apps
  must work with any contiguous monthly range of 2, 3, 4 or 5 years.
  Never hard-code 2022, 2025, 2026, or any specific year or month
  into UI, KPI logic or comparisons.
- **Missing months.** If a month is missing from a table within the
  detected range, that is a data-quality finding (null Month handling
  — see `DATA_QUALITY_RULES.md`), not a reason to shift the range.
  The detected range is the range of months present in Calendar.
- **Comparisons and missing history.** YoY and prior-period
  comparisons return null ("n/a") where the comparison period falls
  outside the detected range (see KPI_DICTIONARY.md §5.3).
- **KPI_Calculated alignment.** The output table's Month column must
  cover exactly the detected range (see §8).

## 7. Primary-source rule and known quirks — do not reconcile

**Primary-source rule.** The KPI engine must use each KPI's Primary
Source exactly as given in `KPI_Definitions` (reproduced in
`KPI_DICTIONARY.md` §2). Where the same quantity appears in more than
one sheet, the engine uses the sheet named as primary source for that
KPI and **does not** average, reconcile or substitute the other
sheet's value.

**Known quirks — documented, not reconciled.** These differences
exist in the workbook as supplied. They are **not** errors to be
fixed by the loader, and the apps must not silently adjust one
figure to match another:

1. **Ancillary_Revenue.Passengers differs slightly from
   Passenger_Commercial.Passengers in the same month.**
   Consequence: Ancillary Revenue / Passenger uses
   `Ancillary_Revenue.Passengers`; Passenger Volume uses
   `Passenger_Commercial.Passengers`. The two passenger counts will
   not agree exactly, and that is expected.
2. **MRO_TechOps.Active Aircraft differs slightly from
   Flight_Operations.Active Aircraft in the same month.**
   Consequence: Aircraft Utilization uses
   `Flight_Operations.Active Aircraft`; AOG Rate uses
   `MRO_TechOps.Active Aircraft`.
3. **Data_Governance.Assets with Owner is far below Registered Data
   Assets.** Consequence: Ownership Coverage (Assets with Owner ÷
   Registered Data Assets) will be low. Document it on the
   Governance page as a data observation; do not adjust either
   figure.
4. **Cargo Revenue and Ancillary Revenue appear in two sheets
   each** (`Revenue_Management` and `Cargo` / `Ancillary_Revenue`).
   Consequence: Total Revenue and Operating Margin use the
   `Revenue_Management` values; Cargo Yield uses `Cargo.Cargo
   Revenue`; Ancillary Revenue / Passenger uses
   `Ancillary_Revenue.Ancillary Revenue`. The duplicated values
   may differ slightly; do not reconcile.
5. **Fuel Cost** is supplied in `Finance` and derivable (Fuel Price
   per Litre × Fuel Volume Litres) in `Fuel`. The two are not
   reconciled in this spec (see open question §14.3).

If a future workbook revision removes these differences, the
primary-source rule still governs — the engine code does not change,
only the data does.

## 8. KPI_Calculated — output table, not an input

Sheet: `KPI_Calculated` — header only, **0 data rows** in the
workbook as supplied (verified). Columns (exact, in order):

Month, Total Revenue, ASM, RPM, Operating Cost, Load Factor, RASK,
CASM, Yield, Operating Margin, Aircraft Utilization,
Maintenance Cost / Flight Hour, AOG Rate,
Baggage Mishandling Rate, Cargo Yield,
Ancillary Revenue / Passenger, Data Product Adoption

Rules:

- The **app computes and populates** these columns from the canonical
  model using the formulas in `KPI_DICTIONARY.md` §2. The loader
  must never read `KPI_Calculated` as a source of KPI values.
- The output covers exactly the detected date range (§6), one row
  per month.
- Total Revenue, ASM, RPM and Operating Cost in this table are the
  period aggregates the ratios are computed from (summed numerator /
  denominator per KPI_DICTIONARY.md §1), not independent inputs.
- The 17 columns cover 16 of the 18 defined KPIs plus the four
  aggregates. **Not in this output table:** D0, D15, Dispatch
  Reliability, Ticket Deflection Rate, Data Quality, Platform
  Availability — those six are still computed/passed through by the
  KPI engine and displayed in the apps; they simply have no column
  in `KPI_Calculated`. Do not add columns to the output table
  without a spec change.
- Writing the populated table back to the workbook is optional and
  must never overwrite the input file; if implemented, write to a
  separate output file.

## 9. Meta sheets — KPI_Definitions, KPI_Targets, Scenarios, Reference_Data, Data_Quality

These sheets are **specification data carried inside the workbook**.
The loader reads them at load so the apps use the workbook's own
definitions, targets, scenarios and rules — but the shared specs in
`03_Shared/` remain authoritative if the workbook's meta sheets and
this spec ever disagree (flag the disagreement in the validation
report; do not silently follow the workbook).

| Sheet | Columns (exact) | Content (verified) |
|---|---|---|
| KPI_Definitions | KPI, Domain, Formula/Logic, Unit, Direction, Primary Source | 18 KPIs — reproduced in KPI_DICTIONARY.md §2 |
| KPI_Targets | KPI, Target, Target Type, Notes | 18 targets, all Target Type "Enterprise Target", all Notes "Synthetic baseline – replace with approved target" — reproduced in KPI_DICTIONARY.md §3 |
| Scenarios | Scenario ID, Scenario Name, Variable, Change %, Description, Primary KPI Impact | S001–S009 — reproduced in SCENARIO_DEFINITIONS.md §2 |
| Reference_Data | Domain, Code, Description | 8 rows: Flight Operations D0 "Departure on time"; Flight Operations D15 "Departure within 15 minutes"; MRO / Tech Ops AOG "Aircraft on ground"; MRO / Tech Ops MEL "Minimum Equipment List"; Passenger / Commercial NPS "Net Promoter Score"; Data Platform KB "Knowledge Base"; Data Platform SSU "Self-Service User"; Data Governance DQ "Data Quality" |
| Data_Quality | Rule ID, Table, Column, Rule, Severity | DQ001–DQ008 — reproduced in DATA_QUALITY_RULES.md §2 |

## 10. Relationships between tables

All joins are on `Month` (date, first of month), plus `Route` for
the route table. There are no surrogate keys in the workbook.

```
Calendar (1) ──< (many) Flight_Operations        on Month
Calendar (1) ──< (many) MRO_TechOps             on Month
Calendar (1) ──< (many) Crew_People             on Month
Calendar (1) ──< (many) Passenger_Commercial    on Month
Calendar (1) ──< (many) Revenue_Management      on Month
Calendar (1) ──< (many) Finance                 on Month
Calendar (1) ──< (many) Baggage                 on Month
Calendar (1) ──< (many) Cargo                   on Month
Calendar (1) ──< (many) Airport_Ground          on Month
Calendar (1) ──< (many) Fuel                    on Month
Calendar (1) ──< (many) Ancillary_Revenue       on Month
Calendar (1) ──< (many) Data_Platform           on Month
Calendar (1) ──< (many) AI_Data_Products        on Month
Calendar (1) ──< (many) Data_Governance         on Month
Calendar (1) ──< (many) Network_Routes          on Month
Network_Routes (many) ── grouped by Route       (route dimension)
```

- **Cardinality:** each monthly table has at most one row per Month
  (duplicate Month within a monthly table is a data-quality
  failure — see `DATA_QUALITY_RULES.md` rule BR-03). Each
  `Network_Routes` row is unique on (Month, Route).
- **Cross-domain KPI joins** (e.g. RASK = Revenue_Management ÷
  Flight_Operations) join on Month only, using each KPI's primary
  source (§7).
- **No conformed dimensions** exist in the workbook for fleet,
  aircraft, airport or geography. Global filters for Route, Airport,
  Aircraft, Fleet and Geography (brief §6) therefore apply only
  where the workbook supplies the dimension: Route (from
  `Network_Routes.Route`) and the Calendar dimensions (Year,
  Quarter, Month). Airport / Aircraft / Fleet / Geography filters
  have no workbook dimension and must show "not available in the
  loaded workbook" rather than filtering on invented values.
- **KPI_Calculated** (output) joins back to Calendar on Month (1:1).

## 11. Field types and conventions

- **Month:** date, always the first day of the month (e.g.
  2022-01-01). The loader must normalise any month value to the
  first of its month before joining.
- **Counts:** non-negative integers (flights, passengers, bags,
  events, users, assets, products, tickets). Negative counts are a
  data-quality failure.
- **Currency:** numeric, in "$" as supplied. No currency conversion
  is performed.
- **Proportions:** numeric in [0, 1] (rates, shares, reliability,
  quality, availability, hedging). Values outside [0, 1] are a
  data-quality failure (DQ005–DQ007 and rule BR-04).
- **Nulls:** a null in a required measure column is a data-quality
  finding (see `DATA_QUALITY_RULES.md`). The KPI engine treats a
  null measure as missing (KPI null for that month), never as zero.
- **Column-name matching:** exact, case-sensitive, including spaces
  and the "%" in `Data Quality %`, `Platform Availability %`,
  `Governance Quality %` and `Hedged %`. A missing or renamed column
  is a schema error (see `DATA_QUALITY_RULES.md` §5).
- **README sheet:** documentation only; the loader does not load it
  as data.

## 12. Synthetic-data labelling rule

- Every page of both apps shows the visible badge
  **SYNTHETIC DATA** (brief §1).
- The badge is shown because the workbook is synthetic/demo data
  (its own README states: "Synthetic data is for development/demo
  only and must not be interpreted as actual WestJet performance").
- The badge must remain visible on exports (CSV / KPI summary /
  scenario results) as a column or header note, so an exported file
  cannot be mistaken for real WestJet data.
- The rule applies to all workbook-derived values. Scenario outputs
  carry the additional **SIMULATED** label (see
  `SCENARIO_DEFINITIONS.md` §7).
- If a future workbook replaces synthetic values with approved
  source-system data (as the README envisages), the badge is removed
  only by a spec change — the apps must not infer "real data" from
  the values themselves.

## 13. What the workbook does not contain

This section is explicit so that no build workstream invents these
as workbook facts. Anything listed here needs a new data supply (or
a spec change) before it can be built:

- **No Plan or Forecast columns** in any sheet (no planned
  headcount, revenue, cost, fuel price, cargo revenue, or any other
  plan/forecast measure). Variance to plan / forecast and the
  Actual/Plan/Forecast toggle cannot be computed from this workbook.
- **No lifecycle-stage column** for data products (no Idea →
  Discovery → … → Retired staging in `AI_Data_Products`).
- **No "Deflected Tickets" or "Platform Demand" columns** (Ticket
  Deflection Rate is a passthrough only).
- **No cycle count** (Maintenance Cost / Cycle not computable).
- **No ASM/RPM on `Network_Routes`** (route Load Factor not
  computable).
- **No fleet, aircraft, airport or geography columns** anywhere.
- **No line/heavy maintenance split** in `MRO_TechOps`.
- **No SIM/CBT, crew recency, communications reach, training
  pipeline or productivity columns** in `Crew_People`.
- **No forward-booking columns** (Forward Load Factor not
  computable).
- **No EBIT/EBITDA column** in `Finance`.
- **No log / platform-activity column** in `Data_Platform`.
- **No FX column** anywhere (the scenario FX input has no workbook
  base measure — see `SCENARIO_DEFINITIONS.md` §5).
- **No target values** for Total Revenue, Operating Cost, Passenger
  Volume or Cash Position (see KPI_DICTIONARY.md §3).

## 14. Open questions

1. **`Crew_People.Training Compliant`** — proportion (0–1) or count
   of compliant staff? If a count, no denominator exists in the
   workbook.
2. **D15 cumulative?** Does `D15 Departures` include on-time (D0)
   departures, or only departures delayed 1–15 minutes?
3. **Fuel Cost reconciliation** — which governs the Fuel page:
   `Finance.Fuel Cost` (supplied) or Fuel Price per Litre × Fuel
   Volume Litres (derivable)? Is a reconciliation check required,
   and with what tolerance?
4. **Passthrough aggregation** — over a multi-month period, are
   passthrough KPIs averaged across months or is the period-end
   month's value shown? (See KPI_DICTIONARY.md §24, item 7.)
5. **`AI_Data_Products.Adoption Rate`** — what is its definition,
   and how does it relate to Data Product Adoption and Consumer
   Adoption?
6. **Platform Adoption vs Self-Service Adoption** — same measure
   under two names, or distinct? (See KPI_DICTIONARY.md §24,
   item 8.)
7. **Route Contribution basis** — profit share or revenue share?
8. **Cargo Growth basis** — revenue or tonnes?
9. **Calendar `Period Type` / `Rolling Period`** — constant values
   ("YTD" / "Rolling 12M") in every row as supplied. Are these
   intended as per-row labels for a different grain, or are they
   simply static? The spec assumes static and derives periods from
   `Month`; confirm.
10. **Future plan/forecast supply** — will a plan/forecast workbook
    (or columns) follow, or are variance-to-plan/forecast and the
    Actual/Plan/Forecast toggle out of scope for this build?

---

*End of Data Model. Companion specs: `KPI_DICTIONARY.md`,
`SCENARIO_DEFINITIONS.md`, `DATA_QUALITY_RULES.md`. Workbook:
`~/workspace/user/files/WestJet_Enterprise_Control_Tower_Input_Template.xlsx`.*
