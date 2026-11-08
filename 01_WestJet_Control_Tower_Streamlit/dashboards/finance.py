"""dashboards/finance.py — Finance dashboard."""

from __future__ import annotations

import streamlit as st

from components.charts import line_chart, waterfall_chart
from components.kpi_card import render_kpi_grid, render_measure_grid
from config import PageContext
from dashboards import (
    domain_table_section,
    insight_box,
    not_available_note,
    page_title,
    period_caption,
    trend_section,
)

MEASURES = [
    {"label": "Labour Cost", "domain": "finance",
     "column": "Labour Cost", "agg": "sum", "fmt": "money",
     "direction": "lower"},
    {"label": "Fuel Cost", "domain": "finance",
     "column": "Fuel Cost", "agg": "sum", "fmt": "money",
     "direction": "lower"},
    {"label": "Other Operating Cost", "domain": "finance",
     "column": "Other Operating Cost", "agg": "sum", "fmt": "money",
     "direction": "lower"},
    {"label": "Cash Position (period-end)", "domain": "finance",
     "column": "Cash Position", "agg": "last", "fmt": "money",
     "direction": "higher"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Finance", "Revenue, cost, margin and cash")
    period_caption(ctx)
    render_kpi_grid(ctx, ["Total Revenue", "Operating Cost",
                          "Operating Margin", "CASM"], cols=4)
    render_measure_grid(ctx, MEASURES, cols=4)
    insight_box(ctx, ["Total Revenue", "Operating Cost", "Operating Margin",
                      "CASM"])
    col1, col2 = st.columns(2)
    with col1:
        trend_section(ctx, "Operating Margin")
    with col2:
        trend_section(ctx, "Total Revenue", target=False)
    fin = model.filter_period("finance", ctx.start, ctx.end)
    rev = model.total_revenue_frame()
    rev = rev[(rev["Month"] >= ctx.start) & (rev["Month"] <= ctx.end)]
    total_rev = ctx.current.get("Total Revenue") or 0
    total_cost = ctx.current.get("Operating Cost") or 0
    waterfall_chart(
        ["Total Revenue", "Operating Cost", "Operating Profit"],
        [total_rev, -total_cost, 0],
        "Revenue → cost → operating profit bridge (selected period)")
    st.caption("Operating profit here is Total Revenue minus Operating "
               "Cost for the selected period. There is no EBIT/EBITDA "
               "column in the workbook, so no EBIT-style measure is shown "
               "as an actual — the scenario engine reports an EBIT-style "
               "figure only as a simulated revenue-minus-cost value.")
    line_chart(fin, "Month", "Cash Position", "Cash Position — monthly trend")
    domain_table_section(model, ctx, "finance",
                         "Finance — monthly detail", "finance.csv")
    not_available_note(
        ["EBIT / EBITDA", "Cost variance vs plan", "Revenue variance vs plan",
         "Margin variance vs plan"],
        "No EBIT column and no plan/forecast columns exist in the workbook.")
