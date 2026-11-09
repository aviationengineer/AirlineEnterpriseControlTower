# Scenario Engine — WestJet Enterprise Aviation Intelligence & Control Tower

**Status:** Implemented 2026-11-08. This document describes the engine as
built in `01_WestJet_Control_Tower_Streamlit/services/scenario_engine.py`
(Python, ground truth) and mirrored in
`02_WestJet_Control_Tower_HTML_JS/js/scenario-engine.js`.
**Sources:** `COORDINATOR_BRIEF.md` §12–§14; `SCENARIO_DEFINITIONS.md`
(authoritative spec — this document is the implementation reference for
it); `KPI_DICTIONARY.md` §2 (formulas); `DATA_MODEL.md` §7 (primary
sources).
**Spelling:** en-GB throughout.

> All scenario values are **SIMULATED** and are never presented as actual
> performance (brief §1). Every simulated value is labelled SIMULATED
> wherever it appears: simulator outputs, Outcome charts and tiles,
> exports, and any KPI card showing a simulated value. The underlying
> data is synthetic — the **SYNTHETIC DATA** badge applies as well.

## Contents

1. [What the engine does](#1-what-the-engine-does)
2. [Where it lives](#2-where-it-lives)
3. [Baseline](#3-baseline)
4. [Preset scenarios S001–S009](#4-preset-scenarios-s001s009)
5. [Interactive inputs and bounds](#5-interactive-inputs-and-bounds)
6. [Impact chains (as implemented)](#6-impact-chains-as-implemented)
7. [Order of application (combined scenarios)](#7-order-of-application-combined-scenarios)
8. [Outputs](#8-outputs)
9. [Actual vs Baseline vs Simulated](#9-actual-vs-baseline-vs-simulated)
10. [The SIMULATED labelling rule](#10-the-simulated-labelling-rule)
11. [Cash — the illustrative caveat](#11-cash--the-illustrative-caveat)
12. [Worked examples (verified numbers)](#12-worked-examples-verified-numbers)
13. [Assumptions the engine makes (and states)](#13-assumptions-the-engine-makes-and-states)

---

## 1. What the engine does

The scenario engine takes the KPI engine's computed values for a
**selected period** (the global date filter) as the baseline, applies
a set of percentage changes to the underlying measures, and
recomputes every affected KPI **with the same formulas as the KPI
engine** (`KPI_DICTIONARY.md` §2). There is no scenario-specific KPI
formula. A scenario shows what the selected period would have looked
like under the changed assumptions; it does not rewrite history, and
the baseline itself is never modified.

Concretely, the engine:

1. Aggregates the baseline measures for the selected period
   (`aggregate_inputs` — sums for flows, mean for Active Aircraft
   and passthrough rates, last value for Cash Position).
2. Applies each changed input to its base measure (see §6).
3. Rebuilds Operating Cost **once** from its final components
   (Labour + Fuel + Other Operating Cost + Maintenance delta), so a
   measure changed by two inputs is never double-counted.
4. Applies the FX scaling (§6.9) last, to Total Revenue and
   Operating Cost.
5. Recomputes Total Revenue, Operating Margin, RASK, CASM, Load
   Factor and the remaining KPIs from the simulated measures.
6. Returns the simulated levels, the impacts (simulated − baseline)
   and the complete assumptions list.

## 2. Where it lives

| Piece | Python | JS |
|---|---|---|
| Engine | `services/scenario_engine.py` — `apply_scenario(inputs, baseline)` → `ScenarioResult` | `js/scenario-engine.js` — same function, same order, same assumptions text |
| Input model and bounds | `models/scenario_model.py` — `ScenarioInput` (19 fields, all default 0.0), `INPUT_BOUNDS`, `PRESET_VARIABLE_MAP`, `ScenarioResult` | Bounds table in `js/scenario-engine.js`; presets read from the loaded JSON |
| Preset definitions | Read from the workbook `Scenarios` sheet at load (`data/loader.py`) | Read from the JSON `scenarios` section (generated from the same sheet) |
| Simulator page | `dashboards/simulator.py` | `js/dashboards/simulator.js` |
| Outcome page | `dashboards/outcome.py` | `js/dashboards/outcome.js` |
| Comparison | `services/comparison_engine.py` (`OUTCOME_METRICS`) | `js/comparison-engine.js` |
| Export | `components/tables.py` (`scenario_results_frame`) | `js/app.js` / `js/filters.js` (CSV download) |

Presets are **not hard-coded** in either app. If a future workbook
adds, removes or changes a preset, the apps pick it up at load. If
the `Scenarios` sheet and `SCENARIO_DEFINITIONS.md` §2 disagree, the
disagreement is flagged in the validation report
(`DATA_MODEL.md` §9).

## 3. Baseline

- The baseline is the workbook actuals for the selected period —
  the KPI engine's computed values from `KPI_DICTIONARY.md` §2.
- A scenario applies to the **selected period only** (the global
  date filter). The full-period (60-month) baseline is the default
  when no narrower range is selected.
- There is no separate baseline/forecast series in the workbook, so
  **Baseline = Actual** in this build. The Outcome page labels the
  middle series "Baseline (= Actual)" and does not imply a separate
  forecast exists (`SCENARIO_DEFINITIONS.md` §6).

## 4. Preset scenarios S001–S009

Transcribed from the workbook's `Scenarios` sheet (verified
2026-11-08). Each preset is a **single-variable change** exactly as
stated; the user may then adjust further variables with the
interactive inputs (§5), and the Outcome page lists every changed
variable, preset and interactive alike.

| ID | Scenario Name | Variable | Change % | Primary KPI Impact (workbook) |
|---|---|---|---|---|
| S001 | Fuel Shock | Fuel Price | +20 | CASM / Operating Margin |
| S002 | Demand Upside | Passenger Demand | +10 | Load Factor / Revenue |
| S003 | Demand Downside | Passenger Demand | −10 | Load Factor / Revenue |
| S004 | Capacity Growth | Capacity | +8 | ASM / Load Factor / Revenue |
| S005 | Maintenance Inflation | Maintenance Cost | +12 | CASM / Margin |
| S006 | Labour Inflation | Labour Cost | +7 | Operating Cost / Margin |
| S007 | Yield Improvement | Yield | +5 | RASK / Revenue |
| S008 | Ancillary Upside | Ancillary Revenue | +10 | Revenue / Margin |
| S009 | Cancellation Shock | Flight Cancellations | +15 | Capacity / Revenue |

## 5. Interactive inputs and bounds

Each input has a slider, a numeric input, a default, a minimum, a
maximum and a reset button (brief §12), plus a global "Reset all
inputs". The ranges below are the **implemented** bounds, taken from
`models/scenario_model.py:INPUT_BOUNDS` (identical in the JS
engine). They are the brief §12 **proposed** ranges — default 0%
everywhere; −50% / +50% generally; Fuel Price −30% / +100%;
Cancellation −100% / +100% — not workbook-derived, and still to be
confirmed with Ehsan (`SCENARIO_DEFINITIONS.md` §3, §9 item 9).
Inputs typed outside their bounds are clamped to the bound
(verified by `tests/test.js`: "scenario inputs clamp to bounds").

| Group | Input | Default | Min | Max | Workbook base (measure the % is applied to) |
|---|---|---|---|---|---|
| Commercial | Passenger Demand % | 0% | −50% | +50% | `Passenger_Commercial.Passengers` (and RPM — see §6.2) |
| Commercial | Yield % | 0% | −50% | +50% | Yield rate (Passenger Revenue / RPM); applied via Passenger Revenue |
| Commercial | Load Factor % | 0% | −50% | +50% | Load Factor (RPM / ASM); applied by changing RPM at constant ASM unless Capacity % is also changed |
| Capacity | Capacity % | 0% | −50% | +50% | `Flight_Operations.ASM` |
| Capacity | Flights % | 0% | −50% | +50% | `Flight_Operations.Departures` (and Scheduled Flights) |
| Capacity | Aircraft Utilisation % | 0% | −50% | +50% | Aircraft Utilisation (Block Hours / Active Aircraft); applied via Block Hours at constant Active Aircraft unless Availability % is also changed |
| Fuel | Fuel Price % | 0% | **−30%** | **+100%** | `Fuel.Fuel Price per Litre` |
| Fuel | Fuel Volume % | 0% | −50% | +50% | `Fuel.Fuel Volume Litres` |
| MRO | Maintenance Cost % | 0% | −50% | +50% | `MRO_TechOps.Maintenance Cost` |
| MRO | Aircraft Availability % | 0% | −50% | +50% | No workbook column; applied via Active Aircraft as a proxy until an availability measure is supplied |
| Workforce | Labour Cost % | 0% | −50% | +50% | `Finance.Labour Cost` |
| Workforce | Headcount % | 0% | −50% | +50% | `Crew_People.Headcount` — moves Headcount only; no cost or productivity effect is defined |
| Operations | Cancellation % | 0% | **−100%** (to zero cancellations) | **+100%** | `Flight_Operations.Cancellations` |
| Operations | D0 % | 0% | −50% | +50% | D0 (On-Time Departures / Departures); applied via On-Time Departures at constant Departures |
| Operations | D15 % | 0% | −50% | +50% | D15 (D15 Departures / Departures); applied via D15 Departures at constant Departures |
| Cargo | Cargo Demand % | 0% | −50% | +50% | `Cargo.Cargo Tonnes` (and Cargo Shipments) |
| Cargo | Cargo Yield % | 0% | −50% | +50% | Cargo Yield rate (Cargo Revenue / Cargo Tonnes); applied via Cargo Revenue |
| Ancillary | Ancillary Revenue % | 0% | −50% | +50% | `Ancillary_Revenue.Ancillary Revenue` and `Revenue_Management.Ancillary Revenue` — both move together |
| FX | FX % | 0% | −50% | +50% | **No workbook base measure** — see §6.9 |

Interpretation rules (implemented, per `SCENARIO_DEFINITIONS.md`
§3.1): every "%" input is a **relative** percentage change to the
underlying measure. Load Factor %, D0 % and D15 % are relative
changes to the rate itself (e.g. +10% on an 80% load factor gives
88%, not 90%), capped at 100% and floored at 0%. A cancellation
increase that would exceed Scheduled Flights is capped: simulated
Cancellations ≤ Scheduled Flights, simulated Departures ≥ 0.

## 6. Impact chains (as implemented)

Each chain states the causal sequence the engine implements, using
the KPI formulas in `KPI_DICTIONARY.md` §2. A "+" means the variable
increases; the direction of each downstream step follows from the
formula.

### 6.1 Fuel Price +20% (S001)

> Fuel Price +20% → Fuel Cost +20% (Fuel Price × Fuel Volume,
> volume unchanged) → Operating Cost up (the fuel-cost delta is
> added to Operating Cost) → CASM up (Operating Cost / ASM, ASM
> unchanged) → Operating Margin down (revenue unchanged) → Cash /
> profitability impact down (first-order, see §11).

The engine derives the fuel-cost delta from Fuel Price × Fuel
Volume, not by scaling the supplied `Finance.Fuel Cost` — the two
agree only if the supplied Fuel Cost equals Price × Volume, which
is not guaranteed (`KPI_DICTIONARY.md` §24 item 6).

### 6.2 Passenger Demand +10% (S002) and −10% (S003)

> Passenger Demand +10% → Passengers up 10% → RPM up 10%
> (passengers fly the same average distance — **assumption**) →
> Load Factor up (RPM / ASM, ASM unchanged) → Passenger Revenue up
> 10% (same yield — **assumption**) → RASK up (Passenger Revenue /
> ASM) → Operating Margin up (revenue up, cost unchanged in this
> single-variable chain).

S003 is the exact reverse. Load Factor is capped at 100%
(RPM ≤ ASM); if the demand increase would breach the cap, RPM is
capped at ASM and the cap is noted in the assumptions.

### 6.3 Capacity +8% (S004)

> Capacity +8% → ASM up 8% → Load Factor down (RPM / ASM, RPM
> unchanged) → RASK down (Passenger Revenue / ASM, revenue
> unchanged) → CASM down (Operating Cost / ASM, cost unchanged) →
> Operating Margin unchanged in the single-variable chain (revenue
> and cost unchanged). The Outcome page must not present the CASM
> fall as a cost saving — it is a denominator effect, and the
> capacity headroom is available for demand growth.

### 6.4 Maintenance Cost +12% (S005)

> Maintenance Cost +12% → Operating Cost up (the maintenance delta
> is added once) → CASM up → Maintenance Cost / Flight Hour up 12%
> (Maintenance Cost / Block Hours, block hours unchanged) →
> Operating Margin down → Cash / profitability impact down.

### 6.5 Labour Cost +7% (S006)

> Labour Cost +7% → Operating Cost up (the labour delta is added
> once) → CASM up → Operating Margin down → Cash / profitability
> impact down. No headcount or productivity change in this
> single-variable chain; Headcount % is a separate input.

### 6.6 Yield +5% (S007)

> Yield +5% → Passenger Revenue up 5% (Yield × RPM, RPM unchanged)
> → RASK up 5% (Passenger Revenue / ASM) → Total Revenue up →
> Operating Margin up → Cash / profitability impact up.

### 6.7 Cancellation +15% (S009)

> Cancellations +15% → Departures down (Scheduled Flights
> unchanged; Departures = Scheduled Flights − Cancellations) →
> Capacity down (ASM falls in proportion to the departure fall —
> **assumption**) → RPM down in the same proportion (passengers on
> cancelled flights do not fly — **assumption**) → Passenger
> Revenue down → RASK broadly unchanged (revenue and ASM fall
> together) → Load Factor broadly unchanged (RPM and ASM fall
> together) → Operating Margin down (revenue falls faster than the
> costs that can be avoided — **assumption**: only fuel and
> directly variable costs fall; labour and maintenance costs are
> unchanged in this single-variable chain) → Cash impact down.
> The Outcome page shows the assumed variable-cost saving
> explicitly; if no cost saving is assumed, it says so.

### 6.8 Cargo Demand and Cargo Yield (interactive inputs; no preset)

> Cargo Demand +x% → Cargo Tonnes up x% (and Cargo Shipments up in
> the same proportion — **assumption**) → Cargo Revenue up x% (same
> yield — **assumption**) → Total Revenue up → Operating Margin up.
>
> Cargo Yield +x% → Cargo Revenue up x% (Cargo Revenue = Cargo
> Yield × Cargo Tonnes, tonnes unchanged) → Total Revenue up →
> Operating Margin up.

### 6.9 Ancillary Revenue +10% (S008)

> Ancillary Revenue +10% → Total Revenue up (Ancillary Revenue is
> a component of Total Revenue) → Operating Margin up → Ancillary
> Revenue / Passenger up 10% (passengers unchanged) → Cash /
> profitability impact up. Both `Ancillary_Revenue.Ancillary
> Revenue` and `Revenue_Management.Ancillary Revenue` move together
> by the same amount.

### 6.10 FX % (interactive input; no preset, no workbook base)

> FX +x% → Total Revenue scaled by (1 + x/100) **and** Operating
> Cost scaled by (1 + x/100) → RASK up by x% (Passenger Revenue
> scales, ASM unchanged) → CASM up by x% (Operating Cost scales,
> ASM unchanged) → Operating Margin unchanged (revenue and cost
> scale by the same factor) → Cash / profitability impact by the
> change in operating profit (see §11).
>
> This is the implemented engine behaviour, reconciled in
> `SCENARIO_DEFINITIONS.md` §3.9 and §4.10 on 2026-11-08. It is an
> **engine assumption, not a workbook fact**: the workbook has no FX
> column, rate or currency split, so no FX-exposed share of revenue
> or cost can be derived from it. The engine does not invent an FX
> pass-through rate or an assumed foreign-currency share; it applies
> the uniform scaling above and states it in the assumptions list.
> The earlier spec wording ("FX % is shown but unapplied") is
> superseded. If a currency split is supplied later, this chain
> must be revised to apply FX only to the FX-exposed components.

## 7. Order of application (combined scenarios)

When several inputs change at once, the engine applies the chains in
this order and recomputes KPIs **once at the end** (not chain by
chain), so a measure changed by two inputs is not double-counted:

1. Capacity / Flights / Utilisation / Availability (ASM, Block
   Hours, Active Aircraft, Departures).
2. Demand / Load Factor / Cancellations (Passengers, RPM).
3. Yield / Cargo Yield (revenue rates).
4. Fuel Price / Fuel Volume (Fuel Cost).
5. Maintenance Cost / Labour Cost / Headcount (Operating Cost).
6. Cargo Demand / Ancillary Revenue (revenue components).
7. FX (scales Total Revenue and Operating Cost — see §6.10).
8. Recompute all KPIs from the simulated measures (Total Revenue,
   Operating Cost, Load Factor, RASK, CASM, Yield, Operating Margin,
   and the rest of §8).

Operating Cost is rebuilt exactly once from its final components
(Labour + Fuel + Other Operating Cost + Maintenance delta) before
the FX step, so combined fuel + maintenance + labour changes add
their deltas once each.

## 8. Outputs

For the selected period, the engine produces each of the following
as a **simulated** value with its baseline alongside (brief §13).
Each impact is simulated − baseline.

| Output | Definition | Derivation |
|---|---|---|
| Revenue Impact | Change in Total Revenue | Simulated Total Revenue − Baseline Total Revenue ($) |
| Cost Impact | Change in Operating Cost | Simulated Operating Cost − Baseline Operating Cost ($) |
| RASK Impact | Change in RASK | Simulated RASK − Baseline RASK ($/ASM) |
| CASK Impact | Change in CASM (same measure; brief §13 spells it CASK) | Simulated CASM − Baseline CASM ($/ASM) |
| Load Factor Impact | Change in Load Factor | Simulated − Baseline (pp) |
| Operating Margin Impact | Change in Operating Margin | Simulated − Baseline (pp) |
| Cash Impact | Change in Cash Position | Simulated Cash Position − Baseline Cash Position ($). First-order: cash moves by the change in operating profit (see §11) |
| EBIT-style impact | Change in operating profit, labelled "EBIT-style (SIMULATED)" | Simulated (Total Revenue − Operating Cost) − Baseline (Total Revenue − Operating Cost) ($). **Caveat:** the workbook has no EBIT/EBITDA column, so this is operating profit (Total Revenue − Operating Cost), not a workbook EBIT measure. As an actual KPI, EBIT-style is **not computed** — the Finance page shows "n/a — no EBIT measure in the workbook" (`KPI_DICTIONARY.md` §12) |
| Passenger Impact | Change in Passengers | Simulated − Baseline (passengers; also shown as %) |
| Capacity Impact | Change in ASM | Simulated − Baseline (seat-miles; also shown as %) |

The Outcome page also shows the simulated levels themselves
(simulated Operating Cost, simulated Cash Position, simulated
Passenger Volume, and the simulated value of every KPI in this
table), not only the deltas.

## 9. Actual vs Baseline vs Simulated

Page 18, Scenario Outcome (brief §14), compares three series for the
selected period:

- **Actual** — workbook actuals (baseline) for the selected period.
- **Baseline** — the same as Actual in this build (the workbook has
  no separate baseline/forecast series). Labelled
  "Baseline (= Actual)"; it must not imply a separate forecast
  exists.
- **Simulated** — the scenario-engine output (§8), always labelled
  SIMULATED.

Comparison charts (one per KPI): RASK, CASK (CASM), Revenue (Total
Revenue), Operating Cost, Margin (Operating Margin), Cash (Cash
Position), Load Factor, Capacity (ASM), Passenger Volume (Passengers).
Summary tiles: Revenue Impact, Cost Impact, Margin Impact, Cash
Impact — each showing the simulated-minus-baseline delta and its
direction (favourable/unfavourable per the KPI's direction in
`KPI_DICTIONARY.md` §2).

The Outcome page is reachable only with a scenario defined (a preset
selected or at least one input changed); with no scenario it shows
the baseline and states "No scenario applied".

## 10. The SIMULATED labelling rule

- Every simulated value is labelled **SIMULATED** wherever it
  appears: simulator page outputs, Outcome page charts and tiles,
  exports, and any KPI card that shows a simulated value.
- Simulated values are never presented as actual performance. The
  Simulator and Outcome pages carry the **SYNTHETIC DATA** badge
  (the underlying data is synthetic) **and** the SIMULATED label
  (the values are scenario outputs, not workbook values).
- A simulated value must never be written into `KPI_Calculated`
  or into any table that also holds actuals without a column or
  flag distinguishing simulated from actual.
- The assumptions list is part of the labelling: a simulated number
  without its assumptions visible is incomplete. The
  **SCENARIO ASSUMPTIONS** section lists the complete list of
  changed variables — every preset applied (e.g. "S001 Fuel Shock —
  Fuel Price +20%") and every interactive input that differs from
  its default (e.g. "Passenger Demand +10%"), with its value, plus
  every assumption the engine applied (e.g. "RPM assumed to move
  with Passengers", "Load Factor capped at 100%", "FX +10%: Total
  Revenue and Operating Cost both scaled by 1.10 (engine assumption
  — no FX base measure in the workbook)", "variable-cost saving
  assumed: none"). Inputs at default (0%) are listed as unchanged
  or omitted.
- Scenario-results export (CSV) includes the assumptions list and
  the SYNTHETIC DATA note.

## 11. Cash — the illustrative caveat

Cash Position is a **period-end stock** (the `Finance.Cash
Position` value for the last month in the period), while revenue and
cost impacts are **period flows**. The engine's cash treatment is
first-order: simulated Cash Position = baseline Cash Position +
(simulated operating profit − baseline operating profit), where
operating profit is Total Revenue − Operating Cost. On a
single-month baseline this is a reasonable first-order effect; on a
multi-month baseline it applies a whole period's profit change to a
single period-end cash balance, which overstates the cash movement
(e.g. the S001 full-period cash position falls to ~$20.5m). Every
cash-impact display therefore carries the "illustrative" label:

> "Cash impact on a multi-month baseline is illustrative: it applies
> the simulated change in operating profit to the baseline cash
> position."

Read cash impact as a direction-and-order-of-magnitude indicator on
multi-month selections, not as a forecast cash balance. The same
caveat is in `USER_GUIDE.md` (known caveats).

## 12. Worked examples (verified numbers)

These are **verified engine outputs on the supplied workbook**,
not illustrative arithmetic. Both are over the **full 60-month
baseline (Jan 2022–Dec 2026)** unless stated otherwise, and both are
SIMULATED values. They are reproduced here because
`tests/test.js` asserts them against the Python ground truth
(`preset_results`) and all 23 checks pass.

### 12.1 Fuel Price +20% (S001)

- Cost impact: **+$1,116,244,265** (Operating Cost up by 20% of
  baseline Fuel Cost, via the derived Fuel Cost).
- Operating Margin impact: **−4.20pp**.
- Chain: Fuel Price +20% → Fuel Cost +20% → Operating Cost up →
  CASM up → Operating Margin down → Cash impact down (first-order,
  illustrative on this 60-month baseline).

### 12.2 Passenger Demand +10% (S002)

- Revenue impact: **+$2,433,905,160** (Passenger Revenue up 10% at
  constant yield).
- Simulated Load Factor: **0.878889** (87.89%), up from the baseline
  — RPM up 10% at constant ASM, capped at 100%.
- Chain: Passengers +10% → RPM +10% → Load Factor up → Passenger
  Revenue up 10% → RASK up 10% → Operating Margin up (cost
  unchanged in this single-variable chain).

### 12.3 The brief §13 chains, in words

- Fuel Price +20% → Fuel Cost +20% → Operating Cost up → CASM up →
  Operating Margin down → Cash / profitability impact.
- Passenger Demand +10% → Passengers up → RPM up → Load Factor up →
  Passenger Revenue up → RASK up → Operating Margin up.

## 13. Assumptions the engine makes (and states)

Every assumption below is recorded in the assumptions list on any
run it affects. Items marked "to confirm" are open questions in
`SCENARIO_DEFINITIONS.md` §9.

1. **Demand → RPM.** A Passenger Demand change moves RPM in the
   same proportion (constant average distance). To confirm.
2. **Demand → Passenger Revenue.** Passenger Revenue moves with
   Passengers at constant yield (unless Yield % is also changed).
3. **Fuel-cost delta.** Derived from Fuel Price × Fuel Volume, not
   by scaling the supplied `Finance.Fuel Cost`. To confirm.
4. **Load Factor % / D0 % / D15 %.** Relative change to the rate,
   not a percentage-point change; capped at 100%, floored at 0%.
   To confirm.
5. **Aircraft Availability proxy.** No workbook availability column
   exists; Availability % is applied via Active Aircraft as a
   proxy. To confirm.
6. **Cancellation chain.** ASM falls in proportion to the departure
   fall; RPM falls in the same proportion; only fuel and directly
   variable costs fall. To confirm which costs fall.
7. **Cash Impact.** First-order: cash moves by the change in
   operating profit (see §11). To confirm.
8. **Headcount %.** Moves Headcount only; no cost or productivity
   effect is defined. To confirm whether it should also move Labour
   Cost.
9. **FX %.** Uniform scaling of Total Revenue and Operating Cost
   (§6.10) — an engine assumption because the workbook has no FX
   base measure. To be revised if a currency split is supplied.
10. **Slider ranges.** Default 0%; −50% / +50% generally; Fuel
    Price −30% / +100%; Cancellation −100% / +100%. Proposed, not
    workbook-derived. To confirm.

---

*End of Scenario Engine. Companion specs: `SCENARIO_DEFINITIONS.md`
(authoritative), `KPI_DICTIONARY.md`, `DATA_MODEL.md`,
`DATA_QUALITY_RULES.md`, `ARCHITECTURE.md`, `USER_GUIDE.md`.*
