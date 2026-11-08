"""dashboards/governance.py — Data Governance dashboard."""

from __future__ import annotations

import streamlit as st

from components.charts import line_chart
from components.kpi_card import render_measure_grid
from config import PageContext
from dashboards import (
    derived_ratio_card,
    domain_table_section,
    not_available_note,
    page_title,
    period_caption,
)

MEASURES = [
    {"label": "Registered Data Assets (period-end)", "domain": "governance",
     "column": "Registered Data Assets", "agg": "last", "fmt": "number"},
    {"label": "Classified Assets (period-end)", "domain": "governance",
     "column": "Classified Assets", "agg": "last", "fmt": "number",
     "direction": "higher"},
    {"label": "Assets with Owner (period-end)", "domain": "governance",
     "column": "Assets with Owner", "agg": "last", "fmt": "number",
     "direction": "higher"},
    {"label": "Governance Quality %", "domain": "governance",
     "column": "Governance Quality %", "agg": "mean", "fmt": "pct",
     "direction": "higher"},
    {"label": "Open Governance Exceptions", "domain": "governance",
     "column": "Open Governance Exceptions", "agg": "sum", "fmt": "number",
     "direction": "lower"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Data Governance",
               "Classification, ownership, quality and exceptions")
    period_caption(ctx)
    render_measure_grid(ctx, MEASURES, cols=3)
    col1, col2 = st.columns(2)
    with col1:
        derived_ratio_card(
            ctx, "Classification Coverage",
            {"domain": "governance", "column": "Classified Assets",
             "agg": "last"},
            {"domain": "governance", "column": "Registered Data Assets",
             "agg": "last"},
            direction="higher")
    with col2:
        derived_ratio_card(
            ctx, "Ownership Coverage",
            {"domain": "governance", "column": "Assets with Owner",
             "agg": "last"},
            {"domain": "governance", "column": "Registered Data Assets",
             "agg": "last"},
            direction="higher")
    st.caption("Classification Coverage and Ownership Coverage are derived "
               "from the workbook columns (KPI Dictionary §21); they are "
               "not among the 18 engine KPIs.")
    gov = model.filter_period("governance", ctx.start, ctx.end)
    if len(gov) and (gov["Registered Data Assets"] > 0).all():
        coverage = float(
            (gov["Assets with Owner"] / gov["Registered Data Assets"]).mean())
        st.warning(f"Assets with Owner average only {coverage:.1%} of "
                   "Registered Data Assets in the selected period "
                   "(ownership coverage is low). This is reported as-is "
                   "in the Data Quality area and is not reconciled.")
    frame = model.filter_period("governance", ctx.start, ctx.end)
    line_chart(frame, "Month", "Governance Quality %",
               "Governance Quality % — monthly trend", y_fmt="pct")
    line_chart(frame, "Month", "Open Governance Exceptions",
               "Open Governance Exceptions by month")
    domain_table_section(model, ctx, "governance",
                         "Data Governance — monthly detail",
                         "governance.csv")
    not_available_note(
        ["Data Stewardship (separate measure)", "Quality Exceptions "
         "(separate count)"],
        "Ownership Coverage is the closest supplied stewardship measure; "
        "Open Governance Exceptions is the supplied exception count.")
