"""services/scenario_engine.py — scenario engine.

Applies preset scenarios (read from the workbook's Scenarios sheet) and
interactive simulator inputs (brief section 12) to a baseline period and
computes Revenue / Cost / RASK / CASK / Load Factor / Margin / Cash /
EBIT-style / Passenger / Capacity impacts.

Documented impact chains (brief section 13):
- Fuel Price +20% -> Fuel Cost +20% -> Operating Cost up -> CASM up ->
  Operating Margin down -> Cash / profitability impact.
- Passenger Demand +10% -> Passengers up -> RPM up -> Load Factor up ->
  Passenger Revenue up -> RASK up -> Operating Margin up.

Modelling assumptions (stated, not hidden):
- Demand scales Passengers, RPM, Passenger Revenue and Ancillary Revenue
  by the same % (yield held constant unless a Yield input is also set).
- Yield scales Passenger Revenue only (RPM unchanged).
- Capacity scales ASM, Block Hours, Fuel Volume, Fuel Cost and Other
  Operating Cost by the same %; passenger volume is unchanged unless a
  demand input is also set, so Load Factor falls when capacity rises alone.
- Maintenance Cost and Labour Cost are treated as part of Operating Cost
  for scenario purposes (they are not separate Finance columns in the
  workbook), so their increases add directly to Operating Cost.
- Cancellation increases reduce Departures one-for-one; Passengers, RPM
  and Passenger Revenue scale with the resulting Departures change.
- FX % scales Total Revenue and Operating Cost by the same % (net margin
  % unchanged, dollar margin scales).
- Headcount % has no direct financial impact in this model (no headcount
  cost column exists); it is recorded in the assumptions list.
- Load Factor % scales RPM directly.
- Cash impact = change in operating profit (revenue delta - cost delta)
  applied to the baseline Cash Position (last month of the period).

Every output is labelled simulated (ScenarioResult.is_simulated = True).
"""

from __future__ import annotations

import pandas as pd

from models.scenario_model import (
    ScenarioDefinition, ScenarioInput, ScenarioResult,
    load_scenario_definitions, preset_to_input,
)
from services.kpi_engine import aggregate_inputs, compute_kpis_for_month


def _pct(value: float) -> float:
    return 1.0 + float(value) / 100.0


def build_baseline(model, start, end) -> dict:
    """Baseline aggregates for [start, end], from summed model inputs."""
    inputs = aggregate_inputs(model, start, end)
    inputs["start"] = pd.to_datetime(start)
    inputs["end"] = pd.to_datetime(end)
    frame = model.filter_period("flight_operations", start, end)
    inputs["Cancellations"] = float(frame["Cancellations"].sum())
    return inputs


def apply_scenario(baseline: dict, inputs: ScenarioInput) -> ScenarioResult:
    """Apply simulator inputs to a baseline; return SIMULATED results."""
    warnings = inputs.validate()
    assumptions = list(warnings)
    b = baseline

    # --- Start from baseline values -------------------------------------
    asm = b["ASM"]
    rpm = b["RPM"]
    passengers = b["Passengers"]
    passenger_revenue = b["Passenger Revenue"]
    cargo_revenue = b["Cargo Revenue"]
    ancillary_revenue = b["Ancillary Revenue"]
    other_revenue = b["Other Revenue"]
    operating_cost = b["Operating Cost"]
    labour_cost = b["Labour Cost"]
    fuel_cost = b["Fuel Cost"]
    other_op_cost = b["Other Operating Cost"]
    maintenance_cost = b["Maintenance Cost"]
    cargo_tonnes = b["Cargo Tonnes"]
    block_hours = b["Block Hours"]
    departures = b["Departures"]
    cancellations = b.get("Cancellations", 0.0)
    cash = b["Cash Position"]
    maint_delta = 0.0  # maintenance increase, added to Operating Cost once
    labour_delta = 0.0  # labour increase, added to Operating Cost once

    # --- Capacity first (drives ASM, block hours, fuel, other cost) -----
    if inputs.capacity:
        f = _pct(inputs.capacity)
        asm *= f
        block_hours *= f
        fuel_cost *= f
        other_op_cost *= f
        assumptions.append(
            f"Capacity {inputs.capacity:+.0f}%: ASM, Block Hours, Fuel "
            f"Cost and Other Operating Cost scaled by {f:.2f}.")
    if inputs.flights:
        f = _pct(inputs.flights)
        departures *= f
        assumptions.append(f"Flights {inputs.flights:+.0f}%: Departures "
                           f"scaled by {f:.2f}.")
    if inputs.aircraft_availability:
        assumptions.append(
            f"Aircraft Availability {inputs.aircraft_availability:+.0f}%: "
            f"recorded; no direct financial impact in this model.")
    if inputs.aircraft_utilisation:
        f = _pct(inputs.aircraft_utilisation)
        block_hours *= f
        assumptions.append(
            f"Aircraft Utilisation {inputs.aircraft_utilisation:+.0f}%: "
            f"Block Hours scaled by {f:.2f}.")

    # --- Demand (passengers, RPM, passenger + ancillary revenue) --------
    if inputs.passenger_demand:
        f = _pct(inputs.passenger_demand)
        passengers *= f
        rpm *= f
        passenger_revenue *= f
        ancillary_revenue *= f
        assumptions.append(
            f"Passenger Demand {inputs.passenger_demand:+.0f}%: Passengers, "
            f"RPM, Passenger Revenue and Ancillary Revenue scaled by "
            f"{f:.2f} (yield held constant).")
    if inputs.load_factor:
        f = _pct(inputs.load_factor)
        rpm *= f
        assumptions.append(
            f"Load Factor {inputs.load_factor:+.0f}%: RPM scaled by "
            f"{f:.2f} (ASM unchanged).")
    if inputs.yield_pct:
        f = _pct(inputs.yield_pct)
        passenger_revenue *= f
        assumptions.append(
            f"Yield {inputs.yield_pct:+.0f}%: Passenger Revenue scaled by "
            f"{f:.2f} (RPM unchanged).")

    # --- Cancellations (reduce departures, then volume/revenue) ---------
    if inputs.cancellation:
        extra = cancellations * inputs.cancellation / 100.0
        new_departures = max(departures - extra, 0.0)
        ratio = (new_departures / departures) if departures else 1.0
        departures = new_departures
        passengers *= ratio
        rpm *= ratio
        passenger_revenue *= ratio
        assumptions.append(
            f"Cancellations {inputs.cancellation:+.0f}%: Departures fall "
            f"to {departures:,.0f}; Passengers, RPM and Passenger Revenue "
            f"scaled by {ratio:.3f}.")

    # --- Cargo / ancillary ----------------------------------------------
    if inputs.cargo_demand:
        f = _pct(inputs.cargo_demand)
        cargo_tonnes *= f
        cargo_revenue *= f
        assumptions.append(
            f"Cargo Demand {inputs.cargo_demand:+.0f}%: Cargo Tonnes and "
            f"Cargo Revenue scaled by {f:.2f}.")
    if inputs.cargo_yield:
        f = _pct(inputs.cargo_yield)
        cargo_revenue *= f
        assumptions.append(
            f"Cargo Yield {inputs.cargo_yield:+.0f}%: Cargo Revenue scaled "
            f"by {f:.2f}.")
    if inputs.ancillary_revenue:
        f = _pct(inputs.ancillary_revenue)
        ancillary_revenue *= f
        assumptions.append(
            f"Ancillary Revenue {inputs.ancillary_revenue:+.0f}%: "
            f"Ancillary Revenue scaled by {f:.2f}.")

    # --- Costs: fuel, maintenance, labour -------------------------------
    if inputs.fuel_price:
        f = _pct(inputs.fuel_price)
        fuel_cost *= f
        assumptions.append(
            f"Fuel Price {inputs.fuel_price:+.0f}%: Fuel Cost scaled by "
            f"{f:.2f} -> Operating Cost up -> CASM up -> Margin down.")
    if inputs.fuel_volume:
        f = _pct(inputs.fuel_volume)
        fuel_cost *= f
        assumptions.append(
            f"Fuel Volume {inputs.fuel_volume:+.0f}%: Fuel Cost scaled by "
            f"{f:.2f}.")
    if inputs.maintenance_cost:
        maint_delta = maintenance_cost * inputs.maintenance_cost / 100.0
        maintenance_cost += maint_delta
        assumptions.append(
            f"Maintenance Cost {inputs.maintenance_cost:+.0f}%: Operating "
            f"Cost up by ${maint_delta:,.0f} (maintenance treated as part of "
            f"Operating Cost).")
    if inputs.labour_cost:
        labour_delta = labour_cost * inputs.labour_cost / 100.0
        labour_cost += labour_delta
        assumptions.append(
            f"Labour Cost {inputs.labour_cost:+.0f}%: Operating Cost up by "
            f"${labour_delta:,.0f}.")
    if inputs.headcount:
        assumptions.append(
            f"Headcount {inputs.headcount:+.0f}%: recorded; no direct "
            f"financial impact in this model (no headcount cost column).")
    if inputs.d0 or inputs.d15:
        assumptions.append(
            f"D0 {inputs.d0:+.0f}% / D15 {inputs.d15:+.0f}%: recorded; "
            f"no direct financial impact in this model.")

    # Operating Cost is rebuilt exactly once from its final components,
    # so combined inputs (capacity + fuel + maintenance + labour) can never
    # double-count a delta.
    operating_cost = (labour_cost + fuel_cost + other_op_cost + maint_delta)

    # --- FX ---------------------------------------------------------------
    if inputs.fx:
        f = _pct(inputs.fx)
        passenger_revenue *= f
        cargo_revenue *= f
        ancillary_revenue *= f
        other_revenue *= f
        operating_cost *= f
        assumptions.append(
            f"FX {inputs.fx:+.0f}%: Total Revenue and Operating Cost both "
            f"scaled by {f:.2f}.")

    # --- Derived simulated KPIs ------------------------------------------
    total_revenue = (passenger_revenue + cargo_revenue
                     + ancillary_revenue + other_revenue)
    base_total = b["Total Revenue"]
    base_cost = b["Operating Cost"]
    ebit = total_revenue - operating_cost
    base_ebit = base_total - base_cost
    margin = (total_revenue - operating_cost) / total_revenue \
        if total_revenue else None
    base_margin = (base_total - base_cost) / base_total if base_total else None
    rask = passenger_revenue / asm if asm else None
    cask = operating_cost / asm if asm else None
    load_factor = rpm / asm if asm else None
    # Cap load factor at 100% for reporting; note it if capped.
    if load_factor is not None and load_factor > 1.0:
        assumptions.append(
            f"Simulated Load Factor {load_factor:.1%} exceeds 100% and is "
            f"capped at 100% for reporting.")
        load_factor = 1.0
    cash_sim = (cash + (ebit - base_ebit)) if cash is not None else None

    return ScenarioResult(
        label=inputs.label,
        total_revenue=total_revenue,
        operating_cost=operating_cost,
        operating_margin=margin,
        rask=rask,
        cask=cask,
        load_factor=load_factor,
        cash_position=cash_sim,
        ebit_style=ebit,
        passengers=passengers,
        asm=asm,
        revenue_impact=total_revenue - base_total,
        cost_impact=operating_cost - base_cost,
        margin_impact_pp=((margin - base_margin) * 100
                          if margin is not None and base_margin is not None
                          else None),
        cash_impact=(cash_sim - cash) if cash_sim is not None
        and cash is not None else None,
        assumptions=assumptions,
    )


def run_preset_scenario(model, definition: ScenarioDefinition,
                        start, end) -> ScenarioResult:
    """Run one preset scenario (S001-S009) over [start, end]."""
    baseline = build_baseline(model, start, end)
    inputs = preset_to_input(definition)
    return apply_scenario(baseline, inputs)


def run_all_presets(model, scenarios_frame, start, end
                    ) -> dict[str, ScenarioResult]:
    """Run every preset scenario in `scenarios_frame` over [start, end]."""
    results: dict[str, ScenarioResult] = {}
    for definition in load_scenario_definitions(scenarios_frame):
        results[definition.scenario_id] = run_preset_scenario(
            model, definition, start, end)
    return results
