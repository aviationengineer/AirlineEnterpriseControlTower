"""dashboards/data_platform.py — Data Platform dashboard (brief §11).

Primary KPIs: Self-Service Adoption, Knowledge Base Usage, Ticket
Deflection, Registered Users, Active Users, Security Groups, Data
Quality, Platform Availability, Data Freshness, Platform Tickets.
Executive summary: Platform Health, Adoption, Reliability, Quality,
Support Efficiency.
"""

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
    {"label": "Registered Users (period-end)", "domain": "data_platform",
     "column": "Registered Users", "agg": "last", "fmt": "number"},
    {"label": "Active Self-Service Users (period-end)",
     "domain": "data_platform", "column": "Active Self-Service Users",
     "agg": "last", "fmt": "number", "direction": "higher"},
    {"label": "Platform Tickets", "domain": "data_platform",
     "column": "Platform Tickets", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "Knowledge Base Uses", "domain": "data_platform",
     "column": "Knowledge Base Uses", "agg": "sum", "fmt": "number",
     "direction": "higher"},
    {"label": "Security Groups (period-end)", "domain": "data_platform",
     "column": "Security Groups", "agg": "last", "fmt": "number"},
    {"label": "Average Freshness Minutes", "domain": "data_platform",
     "column": "Average Freshness Minutes", "agg": "mean", "fmt": "number",
     "direction": "lower"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Data Platform",
               "Adoption, reliability, quality and support efficiency")
    period_caption(ctx)

    render_kpi_grid(ctx, ["Data Quality", "Platform Availability",
                          "Ticket Deflection Rate"], cols=3)
    render_measure_grid(ctx, MEASURES, cols=3)
    derived_ratio_card(
        ctx, "Self-Service Adoption",
        {"domain": "data_platform", "column": "Active Self-Service Users",
         "agg": "last"},
        {"domain": "data_platform", "column": "Registered Users",
         "agg": "last"},
        direction="higher")
    st.caption("Self-Service Adoption is derived as Active Self-Service "
               "Users ÷ Registered Users (KPI Dictionary §19). The "
               "derivation is unconfirmed — Platform Adoption would be the "
               "same ratio, so the two are not shown as different measures.")

    st.subheader("Executive summary")
    col1, col2, col3, col4, col5 = st.columns(5)
    col1.metric("Platform Health",
                f"{ctx.current.get('Platform Availability'):.1%}"
                if ctx.current.get("Platform Availability") is not None
                else "n/a")
    col2.metric("Adoption",
                f"{ctx.current.get('Ticket Deflection Rate'):.1%}"
                if ctx.current.get("Ticket Deflection Rate") is not None
                else "n/a")
    col3.metric("Reliability",
                f"{ctx.current.get('Platform Availability'):.1%}"
                if ctx.current.get("Platform Availability") is not None
                else "n/a")
    col4.metric("Quality",
                f"{ctx.current.get('Data Quality'):.1%}"
                if ctx.current.get("Data Quality") is not None else "n/a")
    col5.metric("Support Efficiency",
                f"{ctx.current.get('Ticket Deflection Rate'):.1%}"
                if ctx.current.get("Ticket Deflection Rate") is not None
                else "n/a")
    st.caption("Platform Health and Reliability both use Platform "
               "Availability %; Adoption and Support Efficiency both use "
               "Ticket Deflection Rate — the workbook supplies no separate "
               "health, reliability or efficiency measures.")

    insight_box(ctx, ["Data Quality", "Platform Availability",
                      "Ticket Deflection Rate"])
    col1, col2 = st.columns(2)
    with col1:
        trend_section(ctx, "Data Quality")
    with col2:
        trend_section(ctx, "Platform Availability")
    frame = model.filter_period("data_platform", ctx.start, ctx.end)
    line_chart(frame, "Month", "Platform Tickets",
               "Platform Tickets — monthly trend")
    line_chart(frame, "Month", "Knowledge Base Uses",
               "Knowledge Base Uses — monthly trend")
    domain_table_section(model, ctx, "data_platform",
                         "Data Platform — monthly detail",
                         "data_platform.csv")
    not_available_note(
        ["Logs / Platform Activity", "Platform Reliability (composite)"],
        "No log/activity column and no separate reliability measure exist "
        "in the workbook; use Platform Availability %.")
