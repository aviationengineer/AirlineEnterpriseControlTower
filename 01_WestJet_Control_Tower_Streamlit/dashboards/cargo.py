"""dashboards/cargo.py — Cargo dashboard."""

from __future__ import annotations

import streamlit as st

from components.charts import line_chart
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
    {"label": "Cargo Tonnes", "domain": "cargo",
     "column": "Cargo Tonnes", "agg": "sum", "fmt": "number"},
    {"label": "Cargo Shipments", "domain": "cargo",
     "column": "Cargo Shipments", "agg": "sum", "fmt": "number"},
    {"label": "Cargo Revenue (cargo sheet)", "domain": "cargo",
     "column": "Cargo Revenue", "agg": "sum", "fmt": "money"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Cargo", "Tonnes, shipments, revenue and yield")
    period_caption(ctx)
    render_kpi_grid(ctx, ["Cargo Yield"], cols=3)
    render_measure_grid(ctx, MEASURES, cols=3)
    st.caption("Cargo Revenue here is the Cargo sheet value (used for "
               "Cargo Yield). Total Revenue uses the Revenue_Management "
               "Cargo Revenue value instead — the two differ slightly and "
               "are flagged in the Data Quality area, not reconciled.")
    insight_box(ctx, ["Cargo Yield"])
    trend_section(ctx, "Cargo Yield")
    frame = model.filter_period("cargo", ctx.start, ctx.end)
    line_chart(frame, "Month", "Cargo Tonnes", "Cargo Tonnes — monthly trend")
    domain_table_section(model, ctx, "cargo",
                         "Cargo — monthly detail", "cargo.csv")
    not_available_note(
        ["Cargo Revenue vs Plan"],
        "No planned cargo revenue column exists in the workbook.")
