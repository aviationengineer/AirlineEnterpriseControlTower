"""dashboards/ground.py — Airport / Ground Operations dashboard."""

from __future__ import annotations

import streamlit as st

from components.charts import line_chart
from components.kpi_card import render_measure_grid
from config import PageContext
from dashboards import (
    domain_table_section,
    not_available_note,
    page_title,
    period_caption,
)

MEASURES = [
    {"label": "Aircraft Turns", "domain": "ground",
     "column": "Aircraft Turns", "agg": "sum", "fmt": "number"},
    {"label": "Average Turnaround Minutes", "domain": "ground",
     "column": "Average Turnaround Minutes", "agg": "mean", "fmt": "number",
     "direction": "lower"},
    {"label": "Ground OTP", "domain": "ground",
     "column": "Ground OTP", "agg": "mean", "fmt": "pct",
     "direction": "higher"},
    {"label": "Ground Incidents", "domain": "ground",
     "column": "Ground Incidents", "agg": "sum", "fmt": "number",
     "direction": "lower"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Airport / Ground", "Turns, turnaround time and ground OTP")
    period_caption(ctx)
    render_measure_grid(ctx, MEASURES, cols=4)
    frame = model.filter_period("ground", ctx.start, ctx.end)
    col1, col2 = st.columns(2)
    with col1:
        line_chart(frame, "Month", "Average Turnaround Minutes",
                   "Average Turnaround Minutes — monthly trend")
    with col2:
        line_chart(frame, "Month", "Ground OTP",
                   "Ground OTP — monthly trend", y_fmt="pct")
    domain_table_section(model, ctx, "ground",
                         "Airport / Ground — monthly detail", "ground.csv")
    not_available_note(
        ["Gate / Turn Performance (composite)",
         "Ground Handling Performance (composite)"],
        "No composite column exists; use Aircraft Turns, Average "
        "Turnaround Minutes, Ground OTP and Ground Incidents.")
