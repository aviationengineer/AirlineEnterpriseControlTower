"""dashboards/fuel.py — Fuel dashboard, with scenario support (brief §3.10).

Fuel price, volume, hedging and cost. The what-if panel applies a Fuel
Price % change through the scenario engine; every output is labelled
SIMULATED and cash impact is labelled illustrative.
"""

from __future__ import annotations

import streamlit as st

from components.charts import line_chart
from components.kpi_card import render_measure_grid
from config import CASH_ILLUSTRATIVE_NOTE, PageContext
from dashboards import (
    domain_table_section,
    not_available_note,
    page_title,
    period_caption,
)
from models.scenario_model import ScenarioInput
from services.scenario_engine import apply_scenario, build_baseline

MEASURES = [
    {"label": "Fuel Price per Litre (avg)", "domain": "fuel",
     "column": "Fuel Price per Litre", "agg": "mean", "fmt": "number",
     "direction": "lower"},
    {"label": "Fuel Volume Litres", "domain": "fuel",
     "column": "Fuel Volume Litres", "agg": "sum", "fmt": "number"},
    {"label": "Hedged % (avg)", "domain": "fuel",
     "column": "Hedged %", "agg": "mean", "fmt": "pct"},
    {"label": "Fuel Cost (Finance, supplied)", "domain": "finance",
     "column": "Fuel Cost", "agg": "sum", "fmt": "money",
     "direction": "lower"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Fuel", "Price, volume, hedging and cost")
    period_caption(ctx)
    render_measure_grid(ctx, MEASURES, cols=4)
    st.caption("Fuel Cost is the supplied Finance.Fuel Cost value. The "
               "derivable figure (Fuel Price per Litre × Fuel Volume "
               "Litres) is not reconciled against it — see KPI Dictionary "
               "§16.")
    frame = model.filter_period("fuel", ctx.start, ctx.end)
    col1, col2 = st.columns(2)
    with col1:
        line_chart(frame, "Month", "Fuel Price per Litre",
                   "Fuel Price per Litre — monthly trend")
    with col2:
        line_chart(frame, "Month", "Fuel Volume Litres",
                   "Fuel Volume Litres — monthly trend")

    st.subheader("What-if — fuel price (SIMULATED)")
    st.caption("Scenario support: change the fuel price and see the "
               "simulated impact on fuel cost, operating cost, CASM and "
               "margin. All values below are SIMULATED, not actuals.")
    fuel_change = st.slider("Fuel Price %", min_value=-30.0, max_value=100.0,
                            value=0.0, step=1.0, key="fuel_whatif_pct")
    if fuel_change != 0:
        baseline = build_baseline(model, ctx.start, ctx.end)
        result = apply_scenario(
            baseline, ScenarioInput(fuel_price=fuel_change,
                                    label=f"Fuel what-if {fuel_change:+.0f}%"))
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Simulated Cost Impact (SIMULATED)",
                    f"${result.cost_impact:,.0f}")
        col2.metric("Simulated CASM (SIMULATED)",
                    f"${result.cask:,.4f}" if result.cask is not None
                    else "n/a")
        col3.metric("Simulated Margin Impact (SIMULATED)",
                    f"{result.margin_impact_pp:+.2f} pp"
                    if result.margin_impact_pp is not None else "n/a")
        col4.metric("Simulated Cash Impact (SIMULATED)",
                    f"${result.cash_impact:,.0f}"
                    if result.cash_impact is not None else "n/a")
        st.caption(CASH_ILLUSTRATIVE_NOTE)
        with st.expander("Scenario assumptions", expanded=False):
            for assumption in result.assumptions:
                st.write("• " + assumption)
    else:
        st.caption("Set the Fuel Price % slider away from 0% to see the "
                   "simulated impact.")

    domain_table_section(model, ctx, "fuel",
                         "Fuel — monthly detail", "fuel.csv")
    not_available_note(
        ["Fuel Price Variance"],
        "No planned/forecast fuel price column exists in the workbook.")
