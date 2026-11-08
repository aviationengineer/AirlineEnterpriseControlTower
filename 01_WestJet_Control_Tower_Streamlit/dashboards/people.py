"""dashboards/people.py — Crew / People dashboard."""

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
    {"label": "Headcount (period-end)", "domain": "people",
     "column": "Headcount", "agg": "last", "fmt": "number"},
    {"label": "Training Compliant", "domain": "people",
     "column": "Training Compliant", "agg": "mean", "fmt": "pct",
     "direction": "higher"},
    {"label": "Open Critical Vacancies", "domain": "people",
     "column": "Open Critical Vacancies", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "Voluntary Leave Rate", "domain": "people",
     "column": "Voluntary Leave Rate", "agg": "mean", "fmt": "pct",
     "direction": "lower"},
    {"label": "Sentiment Index", "domain": "people",
     "column": "Sentiment Index", "agg": "mean", "fmt": "number",
     "direction": "higher"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Crew / People", "Headcount, training, vacancies and sentiment")
    period_caption(ctx)
    render_measure_grid(ctx, MEASURES, cols=3)
    st.caption("Headcount is shown as the period-end value as supplied; "
               "the workbook does not state average vs period-end. "
               "Training Compliant is shown as the supplied proportion.")
    frame = model.filter_period("people", ctx.start, ctx.end)
    col1, col2 = st.columns(2)
    with col1:
        line_chart(frame, "Month", "Headcount", "Headcount — monthly trend")
    with col2:
        line_chart(frame, "Month", "Voluntary Leave Rate",
                   "Voluntary Leave Rate — monthly trend", y_fmt="pct")
    domain_table_section(model, ctx, "people",
                         "Crew / People — monthly detail", "people.csv")
    not_available_note(
        ["Headcount vs Plan", "Crew Recency Compliance", "SIM Completion",
         "CBT Completion", "Communications Reach", "Training Pipeline",
         "Productivity"],
        "No workbook column exists for these measures, and headcount vs "
        "plan needs plan data, which the workbook does not contain.")
