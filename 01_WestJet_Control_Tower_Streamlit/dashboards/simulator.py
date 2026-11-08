"""dashboards/simulator.py — Scenario Simulator (brief §12/§13).

Every input has a slider, a numeric input, a default (0%), a min/max
(proposed ranges from brief §12) and a reset button. Preset scenarios
S001–S009 are read from the workbook's Scenarios sheet at load time,
never hard-coded. Every output is labelled SIMULATED; cash impact on a
multi-month baseline is labelled illustrative.
"""

from __future__ import annotations

import streamlit as st

from components.tables import csv_download_button, scenario_results_frame
from config import (
    CASH_ILLUSTRATIVE_NOTE,
    SIMULATOR_GROUPS,
    SIMULATOR_INPUTS,
    PageContext,
    format_money,
    simulator_bounds,
)
from dashboards import page_title, period_caption
from data.cache import get_workbook
from models.scenario_model import (
    ScenarioInput,
    load_scenario_definitions,
    preset_to_input,
)
from services.scenario_engine import apply_scenario, build_baseline


def _sync_from_slider(field: str) -> None:
    st.session_state[f"simnum_{field}"] = st.session_state[f"sim_{field}"]


def _sync_from_number(field: str) -> None:
    st.session_state[f"sim_{field}"] = st.session_state[f"simnum_{field}"]


def _reset_one(field: str) -> None:
    st.session_state[f"sim_{field}"] = 0.0
    st.session_state[f"simnum_{field}"] = 0.0


def _current_inputs() -> dict[str, float]:
    return {field: float(st.session_state.get(f"sim_{field}", 0.0))
            for field, _label, _group in SIMULATOR_INPUTS}


def _run_scenario(model, ctx, inputs: dict[str, float],
                  label: str, preset_id: str | None) -> None:
    scenario_input = ScenarioInput(**inputs, label=label)
    baseline = build_baseline(model, ctx.start, ctx.end)
    result = apply_scenario(baseline, scenario_input)
    st.session_state["scenario_state"] = {
        "label": label,
        "preset_id": preset_id,
        "inputs": dict(inputs),
        "result": result,
        "baseline": baseline,
    }


def render(model, ctx: PageContext) -> None:
    page_title("Scenario Simulator",
               "What-if analysis — all outputs are SIMULATED")
    period_caption(ctx)
    st.caption("Defaults are 0% for every input. Ranges are the proposed "
               "ranges from brief §12 (fuel price −30% / +100%; "
               "cancellation −100% / +100%; all others −50% / +50%) — "
               "proposed, not workbook-derived.")

    for field, _label, _group in SIMULATOR_INPUTS:
        st.session_state.setdefault(f"sim_{field}", 0.0)
        st.session_state.setdefault(f"simnum_{field}", 0.0)

    # --- Preset scenarios (workbook Scenarios sheet) ----------------------
    workbook = get_workbook()
    definitions = load_scenario_definitions(workbook.scenarios)
    preset_options = ["None (interactive inputs only)"] + [
        f"{d.scenario_id} — {d.name} ({d.variable} "
        f"{d.change_pct:+.0f}%)" for d in definitions]
    preset_choice = st.selectbox("Preset scenario", preset_options,
                                 key="sim_preset_choice")
    if st.button("Apply preset"):
        if preset_choice.startswith("None"):
            st.info("No preset selected — use the sliders below.")
        else:
            preset_id = preset_choice.split(" — ")[0]
            definition = next(d for d in definitions
                              if d.scenario_id == preset_id)
            inputs = preset_to_input(definition)
            for field, _label, _group in SIMULATOR_INPUTS:
                value = float(getattr(inputs, field))
                st.session_state[f"sim_{field}"] = value
                st.session_state[f"simnum_{field}"] = value
            st.success(f"Applied {definition.scenario_id} "
                       f"{definition.name}: {definition.description}")

    if st.button("Reset all inputs"):
        for field, _label, _group in SIMULATOR_INPUTS:
            _reset_one(field)
        st.session_state.pop("scenario_state", None)
        st.rerun()

    # --- Interactive inputs -------------------------------------------------
    for group in SIMULATOR_GROUPS:
        st.subheader(group)
        for field, label, grp in SIMULATOR_INPUTS:
            if grp != group:
                continue
            lo, hi = simulator_bounds(field)
            col1, col2, col3 = st.columns([3, 2, 1])
            with col1:
                # No value= here: the widget key's session-state value
                # (initialised above) is the source of truth; passing
                # value= as well trips Streamlit's session-state rules.
                st.slider(label, min_value=float(lo), max_value=float(hi),
                          step=1.0, key=f"sim_{field}",
                          on_change=_sync_from_slider, args=(field,))
            with col2:
                st.number_input(f"{label} (value)", min_value=float(lo),
                                max_value=float(hi),
                                step=1.0, key=f"simnum_{field}",
                                on_change=_sync_from_number, args=(field,))
            with col3:
                st.button("Reset", key=f"reset_{field}",
                          on_click=_reset_one, args=(field,))
            st.caption(f"Default 0% · range {lo:+.0f}% to {hi:+.0f}%")

    if st.button("Run simulation", type="primary"):
        inputs = _current_inputs()
        changed = {k: v for k, v in inputs.items() if v != 0.0}
        preset_id = st.session_state.get("scenario_preset_id")
        label = "Interactive scenario" + (
            f" (preset {preset_id})" if preset_id else "")
        _run_scenario(model, ctx, inputs, label, preset_id)
        if not changed:
            st.info("No inputs changed from 0% — the simulated result "
                    "equals the baseline.")
        st.rerun()

    state = st.session_state.get("scenario_state")
    if state is None:
        st.info("No simulation has been run yet in this session. Set the "
                "inputs above and press “Run simulation”. Results also "
                "appear on the Scenario Outcome page.")
        return

    result = state["result"]
    baseline = state["baseline"]
    st.subheader(f"Simulated results — {state['label']} (SIMULATED)")
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Revenue Impact (SIMULATED)",
                format_money(result.revenue_impact))
    col2.metric("Cost Impact (SIMULATED)",
                format_money(result.cost_impact))
    col3.metric("Margin Impact (SIMULATED)",
                f"{result.margin_impact_pp:+.2f} pp"
                if result.margin_impact_pp is not None else "n/a")
    col4.metric("Cash Impact (SIMULATED)",
                format_money(result.cash_impact))
    st.caption(CASH_ILLUSTRATIVE_NOTE)

    rows = [
        ("Total Revenue", baseline.get("Total Revenue"),
         result.total_revenue),
        ("Operating Cost", baseline.get("Operating Cost"),
         result.operating_cost),
        ("Operating Margin", baseline.get("Operating Margin"),
         result.operating_margin),
        ("RASK", baseline.get("RASK"), result.rask),
        ("CASM", baseline.get("CASM"), result.cask),
        ("Load Factor", baseline.get("Load Factor"), result.load_factor),
        ("Cash Position", baseline.get("Cash Position"),
         result.cash_position),
        ("Passengers", baseline.get("Passengers"), result.passengers),
        ("Capacity (ASM)", baseline.get("ASM"), result.asm),
    ]
    st.dataframe(
        [{"Metric": name + " (SIMULATED)", "Baseline": base,
          "Simulated": sim} for name, base, sim in rows],
        width="stretch")

    with st.expander("SCENARIO ASSUMPTIONS", expanded=True):
        changed = {k: v for k, v in state["inputs"].items() if v != 0.0}
        if state.get("preset_id"):
            st.write(f"Preset applied: {state['preset_id']}")
        if changed:
            for field, value in changed.items():
                st.write(f"• {field}: {value:+.0f}%")
        else:
            st.write("• No inputs changed from the 0% defaults.")
        for assumption in result.assumptions:
            st.write("• " + assumption)
        st.caption("Cash impact = change in operating profit applied to "
                   "the baseline cash position (first-order, illustrative "
                   "on multi-month baselines).")

    export = scenario_results_frame(result, baseline, result.assumptions)
    csv_download_button("Download scenario results (CSV)", export,
                        "scenario_results.csv")
