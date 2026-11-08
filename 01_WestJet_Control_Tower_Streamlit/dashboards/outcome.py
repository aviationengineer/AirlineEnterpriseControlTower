"""dashboards/outcome.py — Scenario Outcome page (brief §14).

Actual vs Baseline vs Simulated comparison charts for RASK, CASK,
Revenue, Operating Cost, Margin, Cash, Load Factor, Capacity and
Passenger Volume. Summary tiles: Revenue Impact, Cost Impact, Margin
Impact, Cash Impact. SCENARIO ASSUMPTIONS lists every changed variable.

Baseline = Actual in this build (the workbook has no separate
baseline/forecast series), so the middle series is labelled
"Baseline (= Actual)". With no scenario defined, the page shows the
baseline and states "No scenario applied".
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from components.charts import grouped_bar_chart
from components.tables import csv_download_button, scenario_results_frame
from config import (
    CASH_ILLUSTRATIVE_NOTE,
    SIMULATOR_INPUTS,
    PageContext,
    format_money,
    format_number,
    format_pct,
)
from dashboards import page_title, period_caption
from models.scenario_model import ScenarioInput
from services.comparison_engine import (
    OUTCOME_METRICS,
    compare_scenarios,
    summary_tiles,
)
from services.kpi_engine import aggregate_kpis
from services.scenario_engine import apply_scenario, build_baseline

_METRIC_FMT = {
    "RASK": "currency4", "CASK": "currency4",
    "Revenue": "money", "Operating Cost": "money", "Cash": "money",
    "Margin": "pct", "Load Factor": "pct",
    "Capacity": "number", "Passenger Volume": "number",
}


def _fmt(metric: str, value) -> str:
    if value is None:
        return "n/a"
    kind = _METRIC_FMT[metric]
    if kind == "pct":
        return format_pct(value)
    if kind == "money":
        return format_money(value)
    if kind == "currency4":
        return f"${value:,.4f}"
    return format_number(value)


def _metric_chart(metric: str, actual, baseline, simulated) -> None:
    grouped_bar_chart(
        ["Value"],
        {"Actual": [actual],
         "Baseline (= Actual)": [baseline],
         "Simulated": [simulated]},
        f"{metric} — Actual vs Baseline vs Simulated (SIMULATED)",
        y_fmt="pct" if _METRIC_FMT[metric] == "pct" else None)


def render(model, ctx: PageContext) -> None:
    page_title("Scenario Outcome",
               "Actual vs Baseline vs Simulated — SIMULATED values")
    period_caption(ctx)

    state = st.session_state.get("scenario_state")
    inputs = state["inputs"] if state else None
    label = state["label"] if state else "No scenario applied"
    preset_id = state.get("preset_id") if state else None

    baseline_inputs = build_baseline(model, ctx.start, ctx.end)
    baseline_kpis = aggregate_kpis(model, ctx.start, ctx.end)

    if inputs is None or all(v == 0.0 for v in inputs.values()):
        st.info("No scenario applied — showing the baseline (Actual) only. "
                "Run a simulation on the Scenario Simulator page, or apply "
                "a preset scenario there, to compare a simulated outcome.")
        if inputs is None:
            st.dataframe(
                pd.DataFrame([{
                    "Metric": m,
                    "Actual (= Baseline)": baseline_kpis.get(
                        {"RASK": "RASK", "CASK": "CASM",
                         "Revenue": "Total Revenue",
                         "Operating Cost": "Operating Cost",
                         "Margin": "Operating Margin",
                         "Cash": "Cash Position",
                         "Load Factor": "Load Factor",
                         "Capacity": "ASM",
                         "Passenger Volume": "Passengers"}[m]),
                } for m in OUTCOME_METRICS]),
                width="stretch")
            return

    scenario_input = ScenarioInput(**inputs, label=label)
    result = apply_scenario(baseline_inputs, scenario_input)
    simulated = result.to_dict()
    rows = compare_scenarios(baseline_kpis, simulated,
                             actual=baseline_kpis)
    tiles = summary_tiles(baseline_kpis, simulated)

    st.subheader(f"Summary — {label} (SIMULATED)")
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Revenue Impact (SIMULATED)",
                format_money(tiles["revenue_impact"]))
    col2.metric("Cost Impact (SIMULATED)",
                format_money(tiles["cost_impact"]))
    col3.metric("Margin Impact (SIMULATED)",
                f"{tiles['margin_impact_pp']:+.2f} pp"
                if tiles["margin_impact_pp"] is not None else "n/a")
    col4.metric("Cash Impact (SIMULATED)",
                format_money(tiles["cash_impact"]))
    st.caption(CASH_ILLUSTRATIVE_NOTE)

    st.subheader("Actual vs Baseline vs Simulated")
    table_rows = [{
        "Metric": r["metric"],
        "Actual": _fmt(r["metric"], r["actual"]),
        "Baseline (= Actual)": _fmt(r["metric"], r["baseline"]),
        "Simulated (SIMULATED)": _fmt(r["metric"], r["simulated"]),
        "Simulated vs Baseline": (
            f"{r['simulated_vs_baseline_pct']:+.2%}"
            if r["simulated_vs_baseline_pct"] is not None else "n/a"),
    } for r in rows]
    st.dataframe(pd.DataFrame(table_rows), width="stretch")

    st.subheader("Comparison charts")
    keys = {"RASK": "RASK", "CASK": "CASM", "Revenue": "Total Revenue",
            "Operating Cost": "Operating Cost",
            "Margin": "Operating Margin", "Cash": "Cash Position",
            "Load Factor": "Load Factor", "Capacity": "ASM",
            "Passenger Volume": "Passengers"}
    for i in range(0, len(OUTCOME_METRICS), 3):
        cols = st.columns(3)
        for col, metric in zip(cols, OUTCOME_METRICS[i:i + 3]):
            with col:
                row = next(r for r in rows if r["metric"] == metric)
                key = keys[metric]
                _metric_chart(metric, baseline_kpis.get(key),
                              baseline_kpis.get(key),
                              simulated.get({
                                  "RASK": "rask", "CASK": "cask",
                                  "Revenue": "total_revenue",
                                  "Operating Cost": "operating_cost",
                                  "Margin": "operating_margin",
                                  "Cash": "cash_position",
                                  "Load Factor": "load_factor",
                                  "Capacity": "asm",
                                  "Passenger Volume": "passengers",
                              }[metric]))

    with st.expander("SCENARIO ASSUMPTIONS", expanded=True):
        if preset_id:
            st.write(f"Preset applied: {preset_id}")
        changed = {k: v for k, v in inputs.items() if v != 0.0}
        if changed:
            field_labels = {f: lbl for f, lbl, _g in SIMULATOR_INPUTS}
            for field, value in changed.items():
                st.write(f"• {field_labels.get(field, field)}: "
                         f"{value:+.0f}%")
        else:
            st.write("• No inputs changed from the 0% defaults.")
        for assumption in result.assumptions:
            st.write("• " + assumption)
        st.caption("Baseline = Actual in this build: the workbook has no "
                   "separate baseline/forecast series. All simulated "
                   "values are labelled SIMULATED and are never presented "
                   "as actual performance.")

    export = scenario_results_frame(result, baseline_inputs,
                                    result.assumptions)
    csv_download_button("Download scenario results (CSV)", export,
                        "scenario_outcome.csv")
