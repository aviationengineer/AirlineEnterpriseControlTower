"""dashboards/revenue.py — Revenue Management dashboard."""

from __future__ import annotations

import streamlit as st

from components.charts import bar_chart
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
    {"label": "Passenger Revenue", "domain": "revenue",
     "column": "Passenger Revenue", "agg": "sum", "fmt": "money"},
    {"label": "Cargo Revenue", "domain": "revenue",
     "column": "Cargo Revenue", "agg": "sum", "fmt": "money"},
    {"label": "Ancillary Revenue", "domain": "revenue",
     "column": "Ancillary Revenue", "agg": "sum", "fmt": "money"},
    {"label": "Other Revenue", "domain": "revenue",
     "column": "Other Revenue", "agg": "sum", "fmt": "money"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Revenue Management",
               "Passenger, cargo, ancillary and other revenue")
    period_caption(ctx)
    render_kpi_grid(ctx, ["Total Revenue", "RASK", "Yield"], cols=3)
    render_measure_grid(ctx, MEASURES, cols=4)
    insight_box(ctx, ["Total Revenue", "RASK", "Yield"])
    col1, col2 = st.columns(2)
    with col1:
        trend_section(ctx, "RASK")
    with col2:
        trend_section(ctx, "Yield")
    rev = model.total_revenue_frame()
    rev = rev[(rev["Month"] >= ctx.start) & (rev["Month"] <= ctx.end)]
    bar_chart(rev, "Month", "Total Revenue",
              "Total Revenue by month", colour="#002855")
    domain_table_section(model, ctx, "revenue",
                         "Revenue Management — monthly detail",
                         "revenue.csv")
    not_available_note(
        ["Revenue per Passenger", "Revenue vs Plan"],
        "Revenue per Passenger has no agreed definition in the workbook; "
        "Revenue vs Plan needs plan data, which the workbook does not "
        "contain.")
