# Scenario Definitions — WestJet Enterprise Aviation Intelligence & Control Tower

**Status:** Shared specification — authoritative for both packages
(`01_WestJet_Control_Tower_Streamlit/` and `02_WestJet_Control_Tower_HTML_JS/`).
**Sources:** `COORDINATOR_BRIEF.md` sections 12, 13 and 14, and the
verified input workbook
`~/workspace/user/files/WestJet_Enterprise_Control_Tower_Input_Template.xlsx`
(`Scenarios` sheet: S001–S009; `KPI_Definitions` and `KPI_Targets`
sheets — verified 2026-11-08 by reading the workbook).
**Spelling:** en-GB throughout (scenario names and variable names are
reproduced exactly as in the workbook).

> **Two kinds of scenario input exist in this build and they must not
> be confused:**
> 1. **Preset scenarios S001–S009** — defined in the workbook's
>    `Scenarios` sheet (§2). These are fixed, named scenarios with a
>    single variable change each.
> 2. **Interactive simulator inputs** — the sliders in brief §12
>    (§3). These are user-adjusted, with ranges that are
>    **PROPOSED** in this spec (not workbook-derived) and must be
>    confirmed.
>
> **Simulated values are always labelled SIMULATED and are never
> presented as actual performance** (brief §1, §13; labelling rule
> §7).

## Contents

1. [How the scenario engine works](#1-how-the-scenario-engine-works)
2. [Preset scenarios S001–S009 (workbook)](#2-preset-scenarios-s001s009-workbook)
3. [Interactive simulator inputs (brief §12) — PROPOSED ranges](#3-interactive-simulator-inputs-brief-12--proposed-ranges)
4. [Impact chains](#4-impact-chains)
5. [Engine outputs](#5-engine-outputs)
6. [Scenario Outcome page (brief §14)](#6-scenario-outcome-page-brief-14)
7. [Labelling rule — simulated values](#7-labelling-rule--simulated-values)
8. [Worked examples](#8-worked-examples)
9. [Open questions / assumptions to confirm](#9-open-questions--assumptions-to-confirm)

---

## 1. How the scenario engine works

- **Baseline.** The baseline is the workbook actuals for the
  selected period (the KPI engine's computed values from
  `KPI_DICTIONARY.md` §2). A preset scenario or a set of slider
  inputs is applied to the baseline to produce **simulated** values.
  The baseline itself is never modified.
- **What changes.** Each scenario input is a percentage change
  applied to one base measure (or, for yield-type inputs, to a rate
  that is then applied to its base). The engine recomputes the
  affected measures, then recomputes every KPI that depends on them
  using the **same formulas** as the KPI engine
  (`KPI_DICTIONARY.md` §2). No scenario-specific KPI formula exists.
- **Single source of logic.** The impact chains (§4) and the output
  list (§5) are identical in both packages. Scenario logic lives in
  the scenario engine only — never inside individual UI components.
- **Scope of a scenario.** A scenario applies to the **selected
  period** (the global date filter). It does not rewrite history: it
  shows what the selected period would have looked like under the
  changed assumptions.
- **Reset.** Every input has a reset button returning it to its
  default (0% for interactive inputs; no change for presets). A
  global reset returns all inputs to defaults.
- **No workbook base for some inputs.** Fuel, demand, capacity,
  maintenance, labour, yield, cancellation, cargo and ancillary
  inputs all map to workbook measures (§3, "Workbook base" column).
  **FX has no workbook base measure** (see §3.9) — there is no FX
  column, rate or currency split anywhere in the workbook. The
  implemented engine nevertheless applies FX % as a defined
  assumption: it scales Total Revenue and Operating Cost by the FX %
  (see §3.9 and §4.10). The earlier wording of this spec ("FX is
  shown but unapplied") is superseded by the implemented behaviour.

## 2. Preset scenarios S001–S009 (workbook)

Transcribed from the workbook's `Scenarios` sheet (columns: Scenario
ID, Scenario Name, Variable, Change %, Description, Primary KPI
Impact). These are the workbook's own presets — fixed values, not
proposed ranges. "Change %" is read as a percentage change to the
named variable (e.g. +20 means the variable increases by 20%).

| ID | Scenario Name | Variable | Change % | Description (workbook) | Primary KPI Impact (workbook) |
|---|---|---|---|---|---|
| S001 | Fuel Shock | Fuel Price | +20 | Increase fuel price by 20% | CASM / Operating Margin |
| S002 | Demand Upside | Passenger Demand | +10 | Increase passenger demand by 10% | Load Factor / Revenue |
| S003 | Demand Downside | Passenger Demand | −10 | Decrease passenger demand by 10% | Load Factor / Revenue |
| S004 | Capacity Growth | Capacity | +8 | Increase capacity by 8% | ASM / Load Factor / Revenue |
| S005 | Maintenance Inflation | Maintenance Cost | +12 | Increase maintenance cost by 12% | CASM / Margin |
| S006 | Labour Inflation | Labour Cost | +7 | Increase labour cost by 7% | Operating Cost / Margin |
| S007 | Yield Improvement | Yield | +5 | Increase passenger yield by 5% | RASK / Revenue |
| S008 | Ancillary Upside | Ancillary Revenue | +10 | Increase ancillary revenue by 10% | Revenue / Margin |
| S009 | Cancellation Shock | Flight Cancellations | +15 | Increase cancellations by 15% | Capacity / Revenue |

Rules for presets:

- A preset is applied as a **single-variable change** exactly as
  stated. The user may then adjust further variables with the
  interactive inputs (§3); the Outcome page must list every changed
  variable, preset and interactive alike (§6).
- Presets are **not** hard-coded in the apps: the apps read the
  `Scenarios` sheet at load, so a future workbook can add, remove
  or change presets without a code change. If the sheet and this
  spec disagree, flag it in the validation report (see
  `DATA_MODEL.md` §9).
- Each preset's impact chain is given in §4 (S001–S009 map to chains
  4.1–4.8; S003 is the reverse of S002, S009 is chain 4.6).

## 3. Interactive simulator inputs (brief §12) — PROPOSED ranges

Each input needs a slider, a numeric input, a default, a minimum, a
maximum and a reset button (brief §12). The ranges below are
**PROPOSED** by this spec — they are **not** workbook-derived
(the workbook's `Scenarios` sheet gives only the nine preset values
in §2, not slider ranges). They must be confirmed against the
workbook / with Ehsan before the simulator UI is finalised.

**Proposed rule (applies to every input unless its row says
otherwise): default 0%; minimum −50%; maximum +50%.**

| Group | Input | Default | Min | Max | Workbook base (measure the % is applied to) |
|---|---|---|---|---|---|
| Commercial | Passenger Demand % | 0% | −50% | +50% | `Passenger_Commercial.Passengers` (and RPM — see §4.2 assumption) |
| Commercial | Yield % | 0% | −50% | +50% | Yield rate (Passenger Revenue / RPM); applied via Passenger Revenue (see §4.5) |
| Commercial | Load Factor % | 0% | −50% | +50% | Load Factor (RPM / ASM); applied by changing RPM at constant ASM unless Capacity % is also changed (see §4.2) |
| Capacity | Capacity % | 0% | −50% | +50% | `Flight_Operations.ASM` |
| Capacity | Flights % | 0% | −50% | +50% | `Flight_Operations.Departures` (and Scheduled Flights) |
| Capacity | Aircraft Utilization % | 0% | −50% | +50% | Aircraft Utilization (Block Hours / Active Aircraft); applied via Block Hours at constant Active Aircraft unless Availability % is also changed |
| Fuel | Fuel Price % | 0% | **−30%** | **+100%** | `Fuel.Fuel Price per Litre` |
| Fuel | Fuel Volume % | 0% | −50% | +50% | `Fuel.Fuel Volume Litres` |
| MRO | Maintenance Cost % | 0% | −50% | +50% | `MRO_TechOps.Maintenance Cost` |
| MRO | Aircraft Availability % | 0% | −50% | +50% | Aircraft Availability — **no workbook column** (see §9); applied via Active Aircraft as a proxy until an availability measure is supplied |
| Workforce | Labour Cost % | 0% | −50% | +50% | `Finance.Labour Cost` |
| Workforce | Headcount % | 0% | −50% | +50% | `Crew_People.Headcount` |
| Operations | Cancellation % | 0% | **−100%** (i.e. to zero cancellations) | **+100%** | `Flight_Operations.Cancellations` |
| Operations | D0 % | 0% | −50% | +50% | D0 (On-Time Departures / Departures); applied via On-Time Departures at constant Departures |
| Operations | D15 % | 0% | −50% | +50% | D15 (D15 Departures / Departures); applied via D15 Departures at constant Departures |
| Cargo | Cargo Demand % | 0% | −50% | +50% | `Cargo.Cargo Tonnes` (and Cargo Shipments — see §4.7) |
| Cargo | Cargo Yield % | 0% | −50% | +50% | Cargo Yield rate (Cargo Revenue / Cargo Tonnes); applied via Cargo Revenue |
| Ancillary | Ancillary Revenue % | 0% | −50% | +50% | `Ancillary_Revenue.Ancillary Revenue` (and `Revenue_Management.Ancillary Revenue` for Total Revenue — both move together; see §4.8) |
| FX | FX % | 0% | −50% | +50% | **No workbook base measure** — implemented behaviour is defined in §3.9 and §4.10 |

### 3.1 Notes on the proposed ranges

- **Fuel Price (−30% / +100%)** is wider on the upside than the
  general range because fuel-price spikes are historically larger
  than 50%; the −30% floor reflects that a fuel-price fall of more
  than 30% in a single scenario period is outside the plausible
  planning range. Both bounds are proposed, not workbook-derived.
- **Cancellation (−100% / +100%)** — the −100% floor means
  cancellations can be reduced to zero, and no further; the +100%
  ceiling means cancellations can double. A cancellation increase
  that would exceed Scheduled Flights is capped: simulated
  Cancellations ≤ Scheduled Flights, and simulated Departures ≥ 0.
- **Load Factor %** is a percentage-point or percentage change?
  This spec treats every "%" input as a **relative percentage change
  to the underlying measure**, and Load Factor % as a relative change
  to the Load Factor rate itself (e.g. +10% on a 80% load factor
  gives 88%, not 90%). The engine must cap simulated Load Factor at
  100% (RPM ≤ ASM) and floor it at 0%. Confirm the interpretation
  with Ehsan (see §9).
- **D0 % / D15 %** are likewise relative changes to the rate, capped
  at 100% and floored at 0%.
- **Aircraft Availability %** has no workbook column; the proxy in
  the table above (via Active Aircraft) is a proposed assumption,
  not a workbook fact (see §9).

### 3.9 FX input — no workbook base; implemented behaviour

There is no FX (foreign-exchange) column, rate or currency split
anywhere in the workbook. The FX % input therefore cannot be applied
to a workbook base measure, and the earlier version of this spec
said the engine must treat FX % as **defined but unapplied**
("shown but unapplied", "no KPI impact applied"). **That wording is
superseded.** The implemented engine (Python
`services/scenario_engine.py`, mirrored in the JS
`js/scenario-engine.js`) applies FX % as follows, and both UIs
follow the engine:

- FX % scales **Total Revenue and Operating Cost by the same
  factor** (1 + FX % / 100). In the Python engine this is done by
  scaling each of the four Total Revenue components (Passenger
  Revenue, Cargo Revenue, Ancillary Revenue, Other Revenue — all
  from `Revenue_Management`) and the rebuilt Operating Cost by
  that factor, after all other scenario deltas have been applied
  to Operating Cost, so the FX scaling covers the
  maintenance/labour/fuel deltas as well.
- Because revenue and cost are scaled by the **same** factor,
  Operating Margin is unchanged by an FX-only change, while RASK
  and CASM both move by the FX % (their numerators scale, ASM
  does not). Cash Position moves by the change in operating profit
  implied by the scaling (see §5 — first-order cash treatment).
- The assumption recorded for every FX change is: "FX +x%: Total
  Revenue and Operating Cost both scaled by (1 + x/100)".

This is an **engine assumption, not a workbook fact**: the workbook
has no FX base measure, so no FX-exposed share of revenue or cost
can be derived from it. The engine does not invent an FX
pass-through rate or an assumed foreign-currency share; it applies
the uniform scaling above and states it in the assumptions list
(§6.3) so the user can see exactly what was assumed. If a
currency split is supplied later, this section — and the engine —
must be revised to apply FX only to the FX-exposed components, and
the uniform-scaling assumption must be removed. Until then the
behaviour in this section governs, and any text elsewhere in this
spec that still says FX is unapplied is superseded by it.

## 4. Impact chains

Each chain states the causal sequence the engine must implement.
Chains are computed with the KPI formulas in `KPI_DICTIONARY.md`
§2; no chain invents a new formula. A "+" sign means the variable
increases; the direction of each downstream step follows from the
formula (e.g. a higher cost raises CASM and lowers margin).

### 4.1 Fuel Price +20% (S001; brief §13 example chain)

> Fuel Price +20% → Fuel Cost +20% (Fuel Price × Fuel Volume, volume
> unchanged) → Operating Cost up (Fuel Cost is a component of
> Operating Cost; the engine adds the fuel-cost delta to Operating
> Cost) → CASM up (Operating Cost / ASM, ASM unchanged) →
> Operating Margin down ((Total Revenue − Operating Cost) /
> Total Revenue, revenue unchanged) → Cash / profitability impact
> (Cash Position reduced by the operating-cost increase, as a
> first-order effect; EBIT-style impact in the same direction).

Workbook mapping: `Fuel.Fuel Price per Litre` +20% → derived Fuel
Cost +20% → `Finance.Operating Cost` + delta. Note the engine uses
the **derived** fuel cost for the scenario delta, not the supplied
`Finance.Fuel Cost`, because the scenario changes the price; the
baseline `Finance.Fuel Cost` is the starting point and the delta is
(Fuel Price change × Fuel Volume). See §9, item 3.

### 4.2 Passenger Demand +10% (S002; brief §13 example chain) and −10% (S003)

> Passenger Demand +10% → Passengers up 10% → RPM up 10%
> (passengers fly the same average distance — **assumption**, see
> §9) → Load Factor up (RPM / ASM, ASM unchanged) → Passenger
> Revenue up 10% (same yield — **assumption**) → RASK up
> (Passenger Revenue / ASM) → Operating Margin up (revenue up,
> cost unchanged in this single-variable chain).

S003 is the exact reverse (all steps negated). Load Factor is capped
at 100% (RPM ≤ ASM); if the demand increase would breach the cap,
the engine caps RPM at ASM and notes the cap in the assumptions.

### 4.3 Capacity +8% (S004)

> Capacity +8% → ASM up 8% → Load Factor down (RPM / ASM, RPM
> unchanged in this single-variable chain) → RASK down (Passenger
> Revenue / ASM, revenue unchanged) → CASM down (Operating Cost /
> ASM, cost unchanged) → Operating Margin unchanged in the
> single-variable chain (revenue and cost unchanged), but the
> capacity headroom is available for demand growth — the Outcome
> page must not present the CASM fall as a cost saving.

### 4.4 Maintenance Cost +12% (S005)

> Maintenance Cost +12% → Operating Cost up (Maintenance Cost is a
> component of Operating Cost; add the delta) → CASM up (Operating
> Cost / ASM) → Maintenance Cost / Flight Hour up 12%
> (Maintenance Cost / Block Hours, block hours unchanged) →
> Operating Margin down → Cash / profitability impact down.

### 4.5 Labour Cost +7% (S006)

> Labour Cost +7% → Operating Cost up (add the delta) → CASM up →
> Operating Margin down → Cash / profitability impact down.
> (No headcount or productivity change in this single-variable
> chain; Headcount % is a separate input.)

### 4.6 Yield +5% (S007)

> Yield +5% → Passenger Revenue up 5% (Yield × RPM, RPM unchanged
> in this single-variable chain) → RASK up 5% (Passenger Revenue /
> ASM) → Total Revenue up → Operating Margin up → Cash /
> profitability impact up.

### 4.7 Cancellation +15% (S009)

> Cancellations +15% → Departures down (Scheduled Flights
> unchanged; Departures = Scheduled Flights − Cancellations) →
> Capacity down (ASM falls in proportion to the departure fall —
> **assumption**, see §9) → RPM down in the same proportion
> (passengers on cancelled flights do not fly — **assumption**) →
> Passenger Revenue down → RASK broadly unchanged (revenue and ASM
> fall together) → Load Factor broadly unchanged (RPM and ASM fall
> together) → Operating Margin down (revenue falls faster than the
> costs that can be avoided — **assumption**: only fuel and
> directly variable costs fall; labour and maintenance costs are
> unchanged in this single-variable chain) → Cash impact down.
> The Outcome page must show the assumed variable-cost saving (if
> any) explicitly; if no cost saving is assumed, it must say so.

### 4.8 Cargo Demand and Cargo Yield (interactive inputs; no preset)

> Cargo Demand +x% → Cargo Tonnes up x% (and Cargo Shipments up in
> the same proportion — **assumption**) → Cargo Revenue up x% (same
> yield — **assumption**) → Total Revenue up → Operating Margin up.
>
> Cargo Yield +x% → Cargo Revenue up x% (Cargo Revenue = Cargo
> Yield × Cargo Tonnes, tonnes unchanged) → Total Revenue up →
> Operating Margin up.

### 4.9 Ancillary Revenue +10% (S008)

> Ancillary Revenue +10% → Total Revenue up (Ancillary Revenue is a
> component of Total Revenue) → Operating Margin up → Ancillary
> Revenue / Passenger up 10% (passengers unchanged) → Cash /
> profitability impact up.
> Both `Ancillary_Revenue.Ancillary Revenue` and
> `Revenue_Management.Ancillary Revenue` move together by the same
> amount (see §7 quirk note in `DATA_MODEL.md` — the engine changes
> the value, not the source).

### 4.10 FX % (interactive input; no preset, no workbook base)

> FX +x% → Total Revenue scaled by (1 + x/100) **and** Operating
> Cost scaled by (1 + x/100) (see §3.9) → RASK up by x% (Passenger
> Revenue scales, ASM unchanged) → CASM up by x% (Operating Cost
> scales, ASM unchanged) → Operating Margin unchanged (revenue and
> cost scale by the same factor) → Cash / profitability impact by
> the change in operating profit (see §5).
>
> This is the implemented engine behaviour. It is an assumption
> made because the workbook has no FX base measure — not a workbook
> fact — and it is stated in the assumptions list on every run that
> changes FX %.

### 4.11 Combined (multi-variable) scenarios

When several inputs change at once, the engine applies the chains
in this order and recomputes KPIs once at the end (not chain by
chain, so that a measure changed by two inputs is not double
counted):

1. Capacity / Flights / Utilisation / Availability (ASM, Block
   Hours, Active Aircraft, Departures).
2. Demand / Load Factor / Cancellations (Passengers, RPM).
3. Yield / Cargo Yield (revenue rates).
4. Fuel Price / Fuel Volume (Fuel Cost).
5. Maintenance Cost / Labour Cost / Headcount (Operating Cost).
6. Cargo Demand / Ancillary Revenue (revenue components).
7. FX (scales Total Revenue and Operating Cost — see §4.10).
8. Recompute all KPIs from the simulated measures (Total Revenue,
   Operating Cost, Load Factor, RASK, CASM, Yield, Operating
   Margin, and the rest of §5).

## 5. Engine outputs

For the selected period, the scenario engine produces each of the
following, as **simulated** values with a baseline value alongside
(brief §13). Each output is the difference (simulated − baseline)
as well as the simulated level.

| Output | Definition | Derivation |
|---|---|---|
| Revenue Impact | Change in Total Revenue | Simulated Total Revenue − Baseline Total Revenue (currency $) |
| Cost Impact | Change in Operating Cost | Simulated Operating Cost − Baseline Operating Cost (currency $) |
| RASK Impact | Change in RASK | Simulated RASK − Baseline RASK ($/ASM) |
| CASK Impact | Change in CASM (same measure; brief §13 spells it CASK) | Simulated CASM − Baseline CASM ($/ASM) |
| Load Factor Impact | Change in Load Factor | Simulated − Baseline (pp) |
| Operating Margin Impact | Change in Operating Margin | Simulated − Baseline (pp) |
| Cash Impact | Change in Cash Position | Simulated Cash Position − Baseline Cash Position (currency $). First-order: cash moves by (Revenue Impact − Cost Impact) unless the scenario changes a non-cash item — state the treatment in the assumptions. |
| EBIT-style impact | Change in EBIT-style profitability | **Not computable from the workbook** — no EBIT column exists (see KPI_DICTIONARY.md §12). The engine must show "n/a — no EBIT measure in the workbook" rather than inventing one. |
| Passenger Impact | Change in Passengers | Simulated − Baseline (passengers; also shown as %) |
| Capacity Impact | Change in ASM | Simulated − Baseline (seat-miles; also shown as %) |

Additional outputs the Outcome page shows (brief §14): simulated
Operating Cost, simulated Cash Position, simulated Passenger Volume,
and the simulated values of every KPI in §5's list (not only the
deltas).

## 6. Scenario Outcome page (brief §14)

Page: **18 Scenario Outcome**. The page compares three series for
the selected period:

- **Actual** — workbook actuals (baseline) for the selected period.
- **Baseline** — the same as Actual in this build (the workbook has
  no separate baseline/forecast series; if a forecast is supplied
  later, Baseline becomes that forecast — see §9, item 5). Until
  then the page must label the middle series "Baseline (=
  Actual)" and not imply a separate forecast exists.
- **Simulated** — the scenario-engine output (§5).

### 6.1 Comparison charts (one chart per KPI)

Actual vs Baseline vs Simulated for each of: RASK, CASK (CASM),
Revenue (Total Revenue), Operating Cost, Margin (Operating Margin),
Cash (Cash Position), Load Factor, Capacity (ASM), Passenger Volume
(Passengers). Each chart shows all three values side by side (or as
three series) with the simulated value visibly labelled SIMULATED.

### 6.2 Summary tiles

Four tiles: Revenue Impact, Cost Impact, Margin Impact, Cash
Impact. Each tile shows the simulated-minus-baseline delta (currency
or pp, per §5) and the direction (favourable/unfavourable per the
KPI's direction in `KPI_DICTIONARY.md` §2).

### 6.3 Scenario assumptions

A **SCENARIO ASSUMPTIONS** section listing the **complete list of
changed variables**: every preset applied (e.g. "S001 Fuel Shock —
Fuel Price +20%") and every interactive input that differs from its
default (e.g. "Passenger Demand +10%"), with its value. Inputs at
default (0%) are listed as unchanged or omitted — but the list must
be complete for everything that changed, and must state explicitly
where an assumption was applied (e.g. "RPM assumed to move with
Passengers", "Load Factor capped at 100%", "FX +10%: Total Revenue
and Operating Cost both scaled by 1.10 (engine assumption — no FX
base measure in the workbook, see §3.9)", "variable-cost saving assumed:
none").

### 6.4 Page rules

- The Outcome page is reachable only with a scenario defined (a
  preset selected or at least one input changed); with no scenario,
  it shows the baseline and states "No scenario applied".
- All simulated values on the page carry the SIMULATED label (§7).
- The page offers scenario-results export (CSV) including the
  assumptions list and the SYNTHETIC DATA note (see
  `DATA_MODEL.md` §12).

## 7. Labelling rule — simulated values

- **Every simulated value is labelled SIMULATED** wherever it
  appears: simulator page outputs, Outcome page charts and tiles,
  exports, and any KPI card that shows a simulated value.
- **Simulated values are never presented as actual performance.**
  The Simulator and Outcome pages carry the **SYNTHETIC DATA**
  badge (the underlying data is synthetic) **and** the SIMULATED
  label (the values are scenario outputs, not workbook values).
- A simulated value must never be written into `KPI_Calculated`
  or into any table that also holds actuals without a column or
  flag distinguishing simulated from actual.
- The assumptions list (§6.3) is part of the labelling: a simulated
  number without its assumptions visible is incomplete.

## 8. Worked examples

These use the brief §13 example chains. They are **illustrative
arithmetic on the chain logic, not workbook results** — no workbook
values are used, and the percentages are the chain inputs, not
computed outcomes. (A worked example with real workbook numbers
belongs in the test suite, not in this spec.)

### 8.1 Fuel Price +20% (S001)

Fuel Price +20% → Fuel Cost +20% → Operating Cost rises by 20% of
baseline Fuel Cost → CASM rises by (20% × Fuel Cost) / ASM →
Operating Margin falls by (20% × Fuel Cost) / Total Revenue
(approximately, holding revenue and ASM constant) → Cash falls by
20% of baseline Fuel Cost (first-order).

### 8.2 Passenger Demand +10% (S002)

Passengers +10% → RPM +10% → Load Factor rises by 10% relatively
(e.g. 80% → 88%, capped at 100%) → Passenger Revenue +10% →
RASK +10% → Operating Margin rises by (10% × Passenger Revenue) /
Total Revenue (approximately, holding cost constant).

## 9. Open questions / assumptions to confirm

1. **FX definition — resolved as an engine assumption (was open;
   superseded 2026-11-08).** The workbook has no FX column, rate or
   currency split, so no FX-exposed share of revenue or cost can be
   derived from it. The earlier version of this spec therefore said
   FX % was shown but unapplied (§3.9, §4.10). The implemented
   engine instead scales Total Revenue and Operating Cost by the FX
   % (§3.9, §4.10), and both UIs follow the engine. That uniform
   scaling is the governing behaviour until a currency split is
   supplied; if one is, this section must be revised to apply FX
   only to the FX-exposed components. The open question that
   remains is the same one: which costs/revenues are FX-exposed, in
   which currency, and which direction does a positive FX % move
   them? — but it is now a question for a future revision, not a
   description of current behaviour.
2. **Demand → RPM assumption.** Does a Passenger Demand change move
   RPM in the same proportion (constant average distance)? Confirm.
3. **Fuel-cost delta in scenarios.** The engine derives the fuel-cost
   delta from Fuel Price × Fuel Volume. Confirm this is preferred
   over scaling the supplied `Finance.Fuel Cost` by the same % (the
   two agree only if the supplied Fuel Cost equals Price × Volume,
   which is not guaranteed — see KPI_DICTIONARY.md §24, item 6).
4. **Load Factor % / D0 % / D15 % interpretation.** Relative change
   to the rate (this spec's assumption) or percentage-point change?
   Confirm.
5. **Baseline vs Actual.** The workbook has no forecast/baseline
   series, so Baseline = Actual in this build. Confirm, or supply a
   baseline series.
6. **Aircraft Availability proxy.** No workbook availability column
   exists. Is the Active Aircraft proxy acceptable, or is
   Availability % out of scope until an availability measure is
   supplied?
7. **Cancellation chain assumptions.** Which costs fall when flights
   are cancelled (fuel only? fuel + variable handling?), and does
   ASM fall in proportion to departures? Confirm.
8. **Cash Impact treatment.** First-order cash = Revenue Impact −
   Cost Impact (this spec's assumption). Confirm, including whether
   any scenario input should move cash without moving revenue or
   cost.
9. **Proposed slider ranges (§3).** Confirm the defaults (0%), the
   general range (−50% / +50%), Fuel Price (−30% / +100%) and
   Cancellation (−100% / +100%). These are proposed, not
   workbook-derived.
10. **Headcount % impact.** A Headcount % change currently moves
    only Headcount itself (no cost or productivity effect is
    defined). Confirm whether it should also move Labour Cost, and
    by what rule.

---

*End of Scenario Definitions. Companion specs: `KPI_DICTIONARY.md`,
`DATA_MODEL.md`, `DATA_QUALITY_RULES.md`. Workbook:
`~/workspace/user/files/WestJet_Enterprise_Control_Tower_Input_Template.xlsx`.*
