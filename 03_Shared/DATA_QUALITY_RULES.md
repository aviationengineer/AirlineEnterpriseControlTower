# Data Quality Rules — WestJet Enterprise Aviation Intelligence & Control Tower

**Status:** Shared specification — authoritative for both packages
(`01_WestJet_Control_Tower_Streamlit/` and `02_WestJet_Control_Tower_HTML_JS/`).
**Sources:** `COORDINATOR_BRIEF.md` sections 19 and 20, and the
verified input workbook
`~/workspace/user/files/WestJet_Enterprise_Control_Tower_Input_Template.xlsx`
(`Data_Quality` sheet: DQ001–DQ008 — verified 2026-11-08 by reading
the workbook).
**Spelling:** en-GB throughout (sheet and column names are reproduced
exactly as in the workbook).

> **Two sources of rules, one list.** Rules DQ001–DQ008 are the
> workbook's own rules (severity Critical/High as given in the
> workbook). Rules BR-01–BR-07 are the additional rules from brief
> §19 that the workbook's `Data_Quality` sheet does not list; their
> severities are **proposed** in this spec (see §3) and must be
> confirmed.
>
> **Never silently ignore validation errors** (brief §1). Every
> failed rule produces an entry in the validation report (§4), and
> the data status (§5) reflects the worst failure found.

## Contents

1. [Severity scheme](#1-severity-scheme)
2. [Workbook rules DQ001–DQ008](#2-workbook-rules-dq001dq008)
3. [Additional brief rules BR-01–BR-07](#3-additional-brief-rules-br-01br-07)
4. [Validation report](#4-validation-report)
5. [Data status derivation — Healthy / Warning / Critical](#5-data-status-derivation--healthy--warning--critical)
6. [Error handling (brief §20)](#6-error-handling-brief-20)
7. [Data-quality score](#7-data-quality-score)
8. [Open questions](#8-open-questions)

---

## 1. Severity scheme

The workbook uses two severities: **Critical** and **High**. This
spec maps them to the error/warning handling the apps need, without
changing the workbook's labels:

| Workbook severity | Handling in the apps | Meaning |
|---|---|---|
| Critical | **Error** — blocks loading of the affected data | A structural failure: the data cannot be trusted or used as loaded. The affected table (or the whole workbook, for DQ001) is not loaded; the user is told exactly what is wrong (§6). |
| High | **Warning** — data loads, but flagged | A data-quality issue: the data loads and KPIs are computed, but the affected rows/values are flagged in the validation report and the data status is downgraded (§5). The user must be able to see which rows failed. |

Proposed brief rules (BR-01–BR-07) are assigned Critical/Error or
High/Warning in §3 on this principle: **structural failures
(missing sheet/column, duplicate keys, wrong type) = Error;
data-quality issues (invalid values, broken inequalities) =
Warning**, except that a broken inequality the KPI engine depends
on for a safe computation (ASM ≥ RPM) is already Critical in the
workbook (DQ002) and stays so.

Severity labels shown to the user are the workbook's labels
(Critical / High) for DQ rules, and the same labels for BR rules.
Internally the apps may also use Error/Warning; the mapping above
is the bridge between the two vocabularies.

## 2. Workbook rules DQ001–DQ008

Transcribed from the workbook's `Data_Quality` sheet (columns: Rule
ID, Table, Column, Rule, Severity). "Check" and "User-facing
message" are specified here so both packages implement each rule
identically.

### DQ001 — Month populated and in range

| Field | Content |
|---|---|
| Rule ID | DQ001 |
| Table | All monthly tables |
| Column | Month |
| Rule (workbook) | Must be populated and within 2022-01 to 2026-12 |
| Severity | **Critical** (Error) |
| Check | For every row in every monthly table (all 14 domain tables, `Network_Routes` and `Calendar`): `Month` is non-null, is a valid date, and falls in 2022-01-01 to 2026-12-01 inclusive. Note: the date range in the rule is the workbook's own range; the loader must read the range from the workbook (or from Calendar) rather than hard-coding 2022/2026 — see `DATA_MODEL.md` §6. If a future workbook covers a different range, the rule's range moves with it and the rule text is updated, not the code. |
| User-facing message | "Month is missing or outside the loaded date range (2022-01 to 2026-12) in [Table], row [n]." |
| On failure | The affected row is not loaded. If any row fails, data status is Critical (§5). |

### DQ002 — ASM ≥ RPM

| Field | Content |
|---|---|
| Rule ID | DQ002 |
| Table | Flight_Operations |
| Column | ASM |
| Rule (workbook) | Must be >= RPM |
| Severity | **Critical** (Error) |
| Check | For every row: `ASM >= RPM`. (Load Factor = RPM / ASM would exceed 100% otherwise.) |
| User-facing message | "ASM must be greater than or equal to RPM in Flight_Operations, [Month]: ASM [value], RPM [value]." |
| On failure | The affected row is not loaded (Load Factor cannot be computed safely for it). Data status is Critical. |

### DQ003 — Departures ≤ Scheduled Flights

| Field | Content |
|---|---|
| Rule ID | DQ003 |
| Table | Flight_Operations |
| Column | Departures |
| Rule (workbook) | Must be <= Scheduled Flights |
| Severity | **High** (Warning) |
| Check | For every row: `Departures <= Scheduled Flights`. |
| User-facing message | "Departures must not exceed Scheduled Flights in Flight_Operations, [Month]: Departures [value], Scheduled Flights [value]." |
| On failure | Row loads and is flagged; D0/D15 for that month are flagged as unreliable in the validation report. Data status is at best Warning. |

### DQ004 — Cancelled Bookings ≤ Bookings

| Field | Content |
|---|---|
| Rule ID | DQ004 |
| Table | Passenger_Commercial |
| Column | Cancelled Bookings |
| Rule (workbook) | Must be <= Bookings |
| Severity | **High** (Warning) |
| Check | For every row: `Cancelled Bookings <= Bookings`. |
| User-facing message | "Cancelled Bookings must not exceed Bookings in Passenger_Commercial, [Month]: Cancelled Bookings [value], Bookings [value]." |
| On failure | Row loads and is flagged; Cancellation Rate for that month is flagged as unreliable. Data status is at best Warning. |

### DQ005 — Dispatch Reliability between 0 and 1

| Field | Content |
|---|---|
| Rule ID | DQ005 |
| Table | MRO_TechOps |
| Column | Dispatch Reliability |
| Rule (workbook) | Must be between 0 and 1 |
| Severity | **High** (Warning) |
| Check | For every row: `0 <= Dispatch Reliability <= 1`. |
| User-facing message | "Dispatch Reliability must be between 0 and 1 in MRO_TechOps, [Month]: value [value]." |
| On failure | Row loads and is flagged; Dispatch Reliability for that month is shown as "n/a" (a proportion outside [0, 1] is not a usable reliability figure). Data status is at best Warning. |

### DQ006 — Data Quality % between 0 and 1

| Field | Content |
|---|---|
| Rule ID | DQ006 |
| Table | Data_Platform |
| Column | Data Quality % |
| Rule (workbook) | Must be between 0 and 1 |
| Severity | **High** (Warning) |
| Check | For every row: `0 <= Data Quality % <= 1`. |
| User-facing message | "Data Quality % must be between 0 and 1 in Data_Platform, [Month]: value [value]." |
| On failure | Row loads and is flagged; Data Quality for that month is shown as "n/a". Data status is at best Warning. |

### DQ007 — Platform Availability % between 0 and 1

| Field | Content |
|---|---|
| Rule ID | DQ007 |
| Table | Data_Platform |
| Column | Platform Availability % |
| Rule (workbook) | Must be between 0 and 1 |
| Severity | **High** (Warning) |
| Check | For every row: `0 <= Platform Availability % <= 1`. |
| User-facing message | "Platform Availability % must be between 0 and 1 in Data_Platform, [Month]: value [value]." |
| On failure | Row loads and is flagged; Platform Availability for that month is shown as "n/a". Data status is at best Warning. |

### DQ008 — Classified Assets ≤ Registered Data Assets

| Field | Content |
|---|---|
| Rule ID | DQ008 |
| Table | Data_Governance |
| Column | Classified Assets |
| Rule (workbook) | Must be <= Registered Data Assets |
| Severity | **High** (Warning) |
| Check | For every row: `Classified Assets <= Registered Data Assets`. |
| User-facing message | "Classified Assets must not exceed Registered Data Assets in Data_Governance, [Month]: Classified Assets [value], Registered Data Assets [value]." |
| On failure | Row loads and is flagged; Classification Coverage for that month is flagged as unreliable. Data status is at best Warning. |

## 3. Additional brief rules BR-01–BR-07

These rules come from brief §19. The workbook's `Data_Quality`
sheet does not list them, so their severities below are
**proposed** (following the principle in §1) and must be confirmed.
Each rule states the check and the user-facing message so both
packages implement it identically.

### BR-01 — Duplicate route records

| Field | Content |
|---|---|
| Rule ID | BR-01 (proposed) |
| Table | Network_Routes |
| Column | Month + Route |
| Rule (brief §19) | No duplicate route records |
| Severity | **High** (Warning) — proposed |
| Check | No two rows share the same (Month, Route) pair. |
| User-facing message | "Duplicate route record in Network_Routes: Route [route], Month [month] appears [n] times. Only the first occurrence was loaded." |
| On failure | First occurrence loads; duplicates are excluded and flagged. Data status is at best Warning. |

### BR-02 — Active Products ≤ Registered Products

| Field | Content |
|---|---|
| Rule ID | BR-02 (proposed) |
| Table | AI_Data_Products |
| Column | Active Data Products |
| Rule (brief §19) | Active Products ≤ Registered Products |
| Severity | **High** (Warning) — proposed |
| Check | For every row: `Active Data Products <= Registered Data Products`. (Data Product Adoption = Active / Registered would exceed 100% otherwise.) |
| User-facing message | "Active Data Products must not exceed Registered Data Products in AI_Data_Products, [Month]: Active [value], Registered [value]." |
| On failure | Row loads and is flagged; Data Product Adoption for that month is flagged as unreliable. Data status is at best Warning. |

### BR-03 — Duplicate dates (duplicate Month within a monthly table)

| Field | Content |
|---|---|
| Rule ID | BR-03 (proposed) |
| Table | All monthly tables |
| Column | Month |
| Rule (brief §19) | No duplicate dates |
| Severity | **High** (Warning) — proposed |
| Check | No two rows in the same monthly table share the same Month. |
| User-facing message | "Duplicate month in [Table]: [Month] appears [n] times. Only the first occurrence was loaded." |
| On failure | First occurrence loads; duplicates are excluded and flagged. Data status is at best Warning. |

### BR-04 — Percentages between 0 and 1 (general rule)

| Field | Content |
|---|---|
| Rule ID | BR-04 (proposed) |
| Table | All tables |
| Column | Every proportion / percentage column |
| Rule (brief §19) | Percentages between 0 and 1 |
| Severity | **High** (Warning) — proposed |
| Check | For every row, every proportion column lies in [0, 1]. Columns covered (in addition to DQ005–DQ007): `MRO_TechOps.Parts Availability`; `Crew_People.Training Compliant`, `Crew_People.Voluntary Leave Rate`; `Passenger_Commercial.Corporate Retention`, `Passenger_Commercial.Direct Channel Share`, `Passenger_Commercial.Advance Purchase Ratio`; `Airport_Ground.Ground OTP`; `Fuel.Hedged %`; `Ancillary_Revenue.Ancillary Attach Rate`; `AI_Data_Products.Adoption Rate`; `Data_Governance.Governance Quality %`. (NPS is a score, not a proportion, and is excluded; Sentiment Index is an index and is excluded.) |
| User-facing message | "[Column] must be between 0 and 1 in [Table], [Month]: value [value]." |
| On failure | The affected value is treated as missing for that month (KPI "n/a" for the affected KPI); the row otherwise loads. Data status is at best Warning. |

Note: `Ancillary_Revenue.Ancillary Revenue per Passenger` is a
currency value, not a proportion, and is not covered by BR-04.

### BR-05 — Negative values where invalid

| Field | Content |
|---|---|
| Rule ID | BR-05 (proposed) |
| Table | All tables |
| Column | Every count and currency measure |
| Rule (brief §19) | Negative values where invalid |
| Severity | **High** (Warning) — proposed |
| Check | No negative value in any count column (flights, departures, passengers, bags, events, users, assets, products, tickets, tonnes, shipments, turns) or any currency column (revenues, costs, cash, business value). Counts and currency measures in this workbook are never legitimately negative. |
| User-facing message | "[Column] must not be negative in [Table], [Month]: value [value]." |
| On failure | The affected value is treated as missing for that month (KPI "n/a" for the affected KPI); the row otherwise loads. Data status is at best Warning. |

### BR-06 — Required sheets and required columns (schema validation)

| Field | Content |
|---|---|
| Rule ID | BR-06 (proposed) |
| Table | Workbook (all sheets) |
| Column | — |
| Rule (brief §19) | Required sheets; required columns |
| Severity | **Critical** (Error) — proposed |
| Check | (a) Every sheet listed in `DATA_MODEL.md` §2 is present. (b) Every column listed in `DATA_MODEL.md` §3–§5 and §9 is present in its sheet, with the exact name (case-sensitive, including "%" where present). (c) `KPI_Calculated` is present but is **not** a required input — its emptiness is expected, not a failure. |
| User-facing message | Missing sheet: "Input workbook is missing sheet: [Sheet]." Missing column: "Sheet: [Sheet] / Missing column: [Column]" (exact format from brief §20 — see §6). |
| On failure | The affected sheet/table is not loaded. If a domain sheet or a meta sheet (`KPI_Definitions`, `KPI_Targets`, `Scenarios`, `Data_Quality`) is missing, the affected pages show the error instead of KPIs. Data status is Critical. |

### BR-07 — Data types and null values

| Field | Content |
|---|---|
| Rule ID | BR-07 (proposed) |
| Table | All tables |
| Column | All columns |
| Rule (brief §19) | Data types; null values |
| Severity | **Critical** (Error) for a wrong type in a key column (Month, Route); **High** (Warning) for a null or wrong type in a measure column — proposed |
| Check | (a) `Month` parses as a date; `Route` is text; count/currency/proportion columns parse as numbers. (b) No null in `Month` (covered by DQ001) or in `Route` (`Network_Routes`). (c) A null in a measure column is flagged per column (not silently treated as zero). |
| User-facing message | Wrong type in a key column: "Invalid [Column] in [Table], row [n]: expected [type], found [value]." Null measure: "[Column] is missing in [Table], [Month]. The affected KPI is shown as n/a for that month." |
| On failure | Wrong type in a key column: the row is not loaded (Critical). Null/wrong type in a measure: the value is treated as missing for that month (Warning). Data status follows the worst failure (§5). |

## 4. Validation report

Every load produces a validation report, shown in the apps (data
status area, brief §18) and available as an export. The report
contains, for each failed check:

- Rule ID (DQ001–DQ008 or BR-01–BR-07)
- Table and column
- Month / row affected (Month value, or row number where Month is
  itself the problem)
- Severity (Critical / High)
- The user-facing message (§2–§3)
- The action taken (row excluded / value treated as missing / sheet
  not loaded)

The report also states, for the load as a whole:

- Records loaded (per table and total)
- Date range loaded (from Calendar)
- Data-quality score (§7)
- Data status (§5)
- Validation errors (count) and validation warnings (count)

**The report is never empty by suppression.** If no rule fails, the
report states "No validation issues found" with the counts at zero.
Validation errors are never silently ignored (brief §1).

## 5. Data status derivation — Healthy / Warning / Critical

Always shown (brief §18), with last successful refresh, records
loaded, date range, data-quality score, validation errors and
validation warnings. Derivation:

| Data status | Condition |
|---|---|
| **Healthy** | No rule failed. Zero errors, zero warnings. All required sheets and columns present; all rows loaded. |
| **Warning** | At least one High (Warning) rule failed (DQ003–DQ008, BR-01–BR-05, BR-07 measure-level) and **no** Critical rule failed. Data loads; affected values are flagged per §2–§3. |
| **Critical** | At least one Critical (Error) rule failed (DQ001, DQ002, BR-06, BR-07 key-column level), **or** the workbook is missing (§6), **or** a required sheet is missing. Affected tables/sheets are not loaded; the affected pages show the error instead of KPIs. |

Rules:

- The status is the **worst** failure found: one Critical failure
  makes the whole load Critical even if everything else is Healthy.
- The status is computed at load and recomputed if the workbook is
  reloaded. It is never cached across a reload.
- The status badge is shown on every page (header area, brief §17)
  alongside Data Period, Last Refresh, Data Quality and Platform
  Status.
- **Known quirks are not validation failures.** The differences
  documented in `DATA_MODEL.md` §7 (passenger-count differences,
  Active Aircraft differences, low Assets with Owner, duplicated
  revenue columns) are expected workbook properties, not rule
  failures, and must not downgrade the data status.

## 6. Error handling (brief §20)

Exact messages and behaviour. The apps must **never crash with an
obscure Python/JavaScript error**; every failure below produces the
stated message in the UI.

### 6.1 Workbook missing

Condition: the workbook file
`WestJet_Enterprise_Control_Tower_Input_Template.xlsx` cannot be
found at the configured location.

Message (exact, brief §20):

> "Input workbook not found. Please upload:
> WestJet_Enterprise_Control_Tower_Input_Template.xlsx"

Behaviour: no page renders KPIs. Data status is Critical. The user
is offered the upload action; no synthetic or placeholder data is
substituted.

### 6.2 Missing sheet

Condition: a required sheet (BR-06) is absent from the workbook.

Message (exact format, brief §20 — "show the exact missing sheet"):

> "Input workbook is missing sheet: [Sheet]"

where `[Sheet]` is the exact sheet name (e.g.
"Input workbook is missing sheet: MRO_TechOps").

Behaviour: the affected table is not loaded; pages depending on it
show this message. Data status is Critical. Other tables still load
and their pages still work.

### 6.3 Missing column

Condition: a required column (BR-06) is absent from its sheet.

Message (exact format, brief §20):

> "Sheet: [Sheet] / Missing column: [Column]"

Example (given in the brief):

> "Sheet: Flight_Operations / Missing column: ASM"

Behaviour: the affected sheet is not loaded; pages depending on it
show this message. Data status is Critical.

### 6.4 Other load failures

- **Unreadable / corrupt file:** "Input workbook could not be
  read. Please check the file is a valid Excel workbook and try
  again." Data status Critical; no partial load is presented as
  complete.
- **Wrong file type:** "Please upload an Excel workbook
  (.xlsx)." Data status Critical.

## 7. Data-quality score

The data-quality score is a single number shown with the data status
(brief §18). Definition (proposed — the workbook supplies a
`Data Quality %` KPI, which is a *platform* quality measure, not
this score; do not confuse the two):

```
Data-quality score = 1 − (weighted failed checks ÷ total checks performed)
```

- Each check performed is one rule applied to one row (or one
  sheet/column for BR-06).
- Critical failures weigh 1.0; High failures weigh 0.5. (Proposed
  weights — confirm with Ehsan.)
- The score is shown as a percentage, rounded to one decimal place.
- A Healthy load scores 100%. A load with only High failures scores
  below 100% but above the Critical threshold; any Critical failure
  also forces the data status to Critical (§5) regardless of the
  score.
- The score's inputs (checks performed, failed, by severity) are
  shown in the validation report (§4) so the score is auditable.

## 8. Open questions

1. **BR severities.** Confirm the proposed severities for BR-01–
   BR-05 and BR-07 (High/Warning, with BR-07 Critical only for key
   columns) and for BR-06 (Critical/Error).
2. **Data-quality score weights.** Confirm the proposed weights
   (Critical 1.0, High 0.5) and the score definition in §7, or
   supply a different definition.
3. **DQ001 range.** The workbook's rule text states the range
   2022-01 to 2026-12. Confirm the rule should follow the detected
   range of a future workbook (this spec's assumption) rather than
   staying fixed at 2022–2026.
4. **Null handling.** Confirm that a null measure is treated as
   missing ("n/a") rather than zero (this spec's assumption, BR-07).
5. **Duplicate handling.** Confirm "first occurrence loads,
   duplicates excluded" for BR-01 and BR-03, or whether duplicates
   should block the table instead.
6. **BR-04 column list.** Confirm the proportion-column list in
   BR-04 is complete, in particular whether `Crew_People.Training
   Compliant` is a proportion (see KPI_DICTIONARY.md §24, item 4)
   and whether `AI_Data_Products.Adoption Rate` is a proportion.

---

*End of Data Quality Rules. Companion specs: `KPI_DICTIONARY.md`,
`DATA_MODEL.md`, `SCENARIO_DEFINITIONS.md`. Workbook:
`~/workspace/user/files/WestJet_Enterprise_Control_Tower_Input_Template.xlsx`.*
