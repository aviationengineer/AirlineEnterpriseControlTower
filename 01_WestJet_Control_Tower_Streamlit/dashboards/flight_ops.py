"""dashboards/flight_ops.py — Flight Operations dashboard (brief §9.2)."""

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
    {"label": "Scheduled Flights", "domain": "flight_operations",
     "column": "Scheduled Flights", "agg": "sum", "fmt": "number"},
    {"label": "Departures", "domain": "flight_operations",
     "column": "Departures", "agg": "sum", "fmt": "number"},
    {"label": "Cancellations", "domain": "flight_operations",
     "column": "Cancellations", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "Block Hours", "domain": "flight_operations",
     "column": "Block Hours", "agg": "sum", "fmt": "number"},
    {"label": "ASM", "domain": "flight_operations",
     "column": "ASM", "agg": "sum", "fmt": "number"},
    {"label": "RPM", "domain": "flight_operations",
     "column": "RPM", "agg": "sum", "fmt": "number"},
    {"label": "Active Aircraft (avg)", "domain": "flight_operations",
     "column": "Active Aircraft", "agg": "mean", "fmt": "number"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Flight Operations", "Capacity, punctuality and reliability")
    period_caption(ctx)
    render_kpi_grid(ctx, ["Load Factor", "D0", "D15",
                          "Aircraft Utilization"], cols=4)
    st.caption("Aircraft Utilisation: target shown without a pass/fail "
               "status — target appears to be a daily figure; status "
               "withheld pending confirmation.")
    render_measure_grid(ctx, MEASURES, cols=3)
    insight_box(ctx, ["Load Factor", "D0", "D15", "Aircraft Utilization"])
    col1, col2 = st.columns(2)
    with col1:
        trend_section(ctx, "D0")
    with col2:
        trend_section(ctx, "Load Factor")
    frame = model.filter_period("flight_operations", ctx.start, ctx.end)
    bar_chart(frame, "Month", "Departures",
              "Departures by month", colour="#2E6EA6")
    domain_table_section(model, ctx, "flight_operations",
                         "Flight Operations — monthly detail",
                         "flight_operations.csv")
    not_available_note(
        ["Operational Reliability"],
        "No column supplies it and no composite formula is defined in "
        "the workbook.")
