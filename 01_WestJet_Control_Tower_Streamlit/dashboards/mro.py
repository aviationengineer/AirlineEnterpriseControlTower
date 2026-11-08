"""dashboards/mro.py — MRO / Tech Ops dashboard (brief §10).

Top KPIs: Aircraft Availability, Dispatch Reliability, AOG, MEL, Deferred
Defects, Maintenance Hours, Maintenance Cost, Cost / Flight Hour, Parts
Availability, Maintenance TAT, Repeat Defects. Three of those have no
workbook column and are shown as unavailable, never invented. Warning
states surface when a KPI deteriorates year on year.
"""

from __future__ import annotations

import streamlit as st

from components.charts import bar_chart, line_chart
from components.kpi_card import render_kpi_grid, render_measure_grid
from config import PageContext, _shift_range, measure_value, pct_change
from dashboards import (
    domain_table_section,
    insight_box,
    not_available_note,
    page_title,
    period_caption,
    trend_section,
)

MEASURES = [
    {"label": "Maintenance Events", "domain": "mro",
     "column": "Maintenance Events", "agg": "sum", "fmt": "number"},
    {"label": "Maintenance Hours", "domain": "mro",
     "column": "Maintenance Hours", "agg": "sum", "fmt": "number"},
    {"label": "Available Maintenance Hours", "domain": "mro",
     "column": "Available Maintenance Hours", "agg": "sum", "fmt": "number"},
    {"label": "Aircraft Downtime Hours", "domain": "mro",
     "column": "Aircraft Downtime Hours", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "AOG Events", "domain": "mro",
     "column": "AOG Events", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "MEL Items", "domain": "mro",
     "column": "MEL Items", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "Deferred Defects", "domain": "mro",
     "column": "Deferred Defects", "agg": "sum", "fmt": "number",
     "direction": "lower"},
    {"label": "Parts Availability", "domain": "mro",
     "column": "Parts Availability", "agg": "mean", "fmt": "pct",
     "direction": "higher"},
    {"label": "Maintenance Cost", "domain": "mro",
     "column": "Maintenance Cost", "agg": "sum", "fmt": "money",
     "direction": "lower"},
    {"label": "Active Aircraft (avg)", "domain": "mro",
     "column": "Active Aircraft", "agg": "mean", "fmt": "number"},
]


def _measure_yoy(model, ctx, spec) -> float | None:
    shifted = _shift_range(model, ctx.start, ctx.end, years=1)
    if shifted is None:
        return None
    current = measure_value(model, spec, ctx.start, ctx.end)
    prev = measure_value(model, spec, shifted[0], shifted[1])
    return pct_change(current, prev)


def render(model, ctx: PageContext) -> None:
    page_title("MRO / Tech Ops",
               "Fleet availability, dispatch reliability and maintenance cost")
    period_caption(ctx)

    render_kpi_grid(ctx, ["Dispatch Reliability",
                          "Maintenance Cost / Flight Hour", "AOG Rate"],
                    cols=3)
    render_measure_grid(ctx, MEASURES, cols=3)

    st.subheader("Warning states — deterioration vs prior year")
    warnings = []
    if (ctx.yoy_pct("Dispatch Reliability") or 0) < 0:
        warnings.append("Dispatch Reliability is down year on year.")
    if (ctx.yoy_pct("AOG Rate") or 0) > 0:
        warnings.append("AOG Rate is up year on year.")
    if (ctx.yoy_pct("Maintenance Cost / Flight Hour") or 0) > 0:
        warnings.append("Maintenance Cost / Flight Hour is up year on year.")
    aog_yoy = _measure_yoy(model, ctx, MEASURES[4])
    if (aog_yoy or 0) > 0:
        warnings.append("AOG Events are up year on year.")
    mel_yoy = _measure_yoy(model, ctx, MEASURES[5])
    if (mel_yoy or 0) > 0:
        warnings.append("MEL Items are up year on year.")
    if warnings:
        for warning in warnings:
            st.warning("⚠ " + warning)
    else:
        st.success("No MRO deterioration warnings for the selected period.")

    insight_box(ctx, ["Dispatch Reliability",
                      "Maintenance Cost / Flight Hour", "AOG Rate"])
    col1, col2 = st.columns(2)
    with col1:
        trend_section(ctx, "Dispatch Reliability")
    with col2:
        trend_section(ctx, "Maintenance Cost / Flight Hour")
    mro_frame = model.filter_period("mro", ctx.start, ctx.end)
    bar_chart(mro_frame, "Month", "AOG Events",
              "AOG Events by month", colour="#B42318")
    line_chart(mro_frame, "Month", "Parts Availability",
               "Parts Availability — monthly trend", y_fmt="pct")
    domain_table_section(model, ctx, "mro", "MRO / Tech Ops — monthly detail",
                         "mro.csv")
    not_available_note(
        ["Aircraft Availability", "Maintenance TAT", "Repeat Defects",
         "Component Removals", "Maintenance Cost / Cycle",
         "Line Maintenance", "Heavy Maintenance"],
        "No workbook column exists for these measures.")
