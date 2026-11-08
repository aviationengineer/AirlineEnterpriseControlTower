"""dashboards/passenger.py — Passenger / Commercial dashboard."""

from __future__ import annotations

import streamlit as st

from components.charts import line_chart
from components.kpi_card import render_measure_grid
from config import PageContext
from dashboards import (
    derived_ratio_card,
    domain_table_section,
    insight_box,
    not_available_note,
    page_title,
    period_caption,
)

MEASURES = [
    {"label": "Bookings", "domain": "passenger",
     "column": "Bookings", "agg": "sum", "fmt": "number"},
    {"label": "Passengers", "domain": "passenger",
     "column": "Passengers", "agg": "sum", "fmt": "number"},
    {"label": "Cancelled Bookings", "domain": "passenger",
     "column": "Cancelled Bookings", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "Corporate Retention", "domain": "passenger",
     "column": "Corporate Retention", "agg": "mean", "fmt": "pct",
     "direction": "higher"},
    {"label": "Direct Channel Share", "domain": "passenger",
     "column": "Direct Channel Share", "agg": "mean", "fmt": "pct",
     "direction": "higher"},
    {"label": "Advance Purchase Ratio", "domain": "passenger",
     "column": "Advance Purchase Ratio", "agg": "mean", "fmt": "pct",
     "direction": "higher"},
    {"label": "NPS", "domain": "passenger",
     "column": "NPS", "agg": "mean", "fmt": "number", "direction": "higher"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Passenger / Commercial",
               "Bookings, passengers, retention and satisfaction")
    period_caption(ctx)
    render_measure_grid(ctx, MEASURES, cols=3)
    col1, col2 = st.columns(2)
    with col1:
        derived_ratio_card(
            ctx, "Cancellation Rate",
            {"domain": "passenger", "column": "Cancelled Bookings",
             "agg": "sum"},
            {"domain": "passenger", "column": "Bookings", "agg": "sum"},
            direction="lower")
    with col2:
        derived_ratio_card(
            ctx, "Book-to-Cancel Ratio",
            {"domain": "passenger", "column": "Bookings", "agg": "sum"},
            {"domain": "passenger", "column": "Cancelled Bookings",
             "agg": "sum"},
            direction="higher")
    st.caption("Cancellation Rate and Book-to-Cancel Ratio are derived "
               "from the workbook columns (KPI Dictionary §10); they are "
               "not among the 18 engine KPIs.")
    insight_box(ctx, ["Passengers"])
    frame = model.filter_period("passenger", ctx.start, ctx.end)
    line_chart(frame, "Month", "Passengers", "Passengers — monthly trend")
    line_chart(frame, "Month", "NPS", "NPS — monthly trend")
    domain_table_section(model, ctx, "passenger",
                         "Passenger / Commercial — monthly detail",
                         "passenger.csv")
    not_available_note(
        ["Booking Intake", "Forward Load Factor", "Crew Recency Compliance",
         "Communications Reach", "Training Pipeline", "Productivity"],
        "No workbook column exists for these measures.")
