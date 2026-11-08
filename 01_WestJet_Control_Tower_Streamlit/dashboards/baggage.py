"""dashboards/baggage.py — Baggage dashboard."""

from __future__ import annotations

import streamlit as st

from components.charts import line_chart
from components.kpi_card import render_kpi_grid, render_measure_grid
from config import PageContext
from dashboards import (
    derived_ratio_card,
    domain_table_section,
    insight_box,
    not_available_note,
    page_title,
    period_caption,
    trend_section,
)

MEASURES = [
    {"label": "Bags Handled", "domain": "baggage",
     "column": "Bags Handled", "agg": "sum", "fmt": "number"},
    {"label": "Mishandled Bags", "domain": "baggage",
     "column": "Mishandled Bags", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "Bags Delivered Successfully", "domain": "baggage",
     "column": "Bags Delivered Successfully", "agg": "sum", "fmt": "number"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Baggage", "Bags handled, mishandling and delivery")
    period_caption(ctx)
    render_kpi_grid(ctx, ["Baggage Mishandling Rate"], cols=3)
    render_measure_grid(ctx, MEASURES, cols=3)
    derived_ratio_card(
        ctx, "Successful Delivery Rate",
        {"domain": "baggage", "column": "Bags Delivered Successfully",
         "agg": "sum"},
        {"domain": "baggage", "column": "Bags Handled", "agg": "sum"},
        direction="higher")
    st.caption("Successful Delivery Rate is derived from the workbook "
               "columns (KPI Dictionary §13); it is not among the 18 "
               "engine KPIs.")
    insight_box(ctx, ["Baggage Mishandling Rate"])
    trend_section(ctx, "Baggage Mishandling Rate")
    frame = model.filter_period("baggage", ctx.start, ctx.end)
    line_chart(frame, "Month", "Mishandled Bags",
               "Mishandled Bags by month")
    domain_table_section(model, ctx, "baggage",
                         "Baggage — monthly detail", "baggage.csv")
    not_available_note(
        ["Baggage Performance (composite)",
         "Baggage-related operational impact"],
        "No composite or impact column exists; use Mishandling Rate and "
        "Successful Delivery Rate.")
