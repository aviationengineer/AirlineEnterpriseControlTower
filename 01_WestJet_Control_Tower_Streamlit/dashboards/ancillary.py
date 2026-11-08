"""dashboards/ancillary.py — Ancillary Revenue dashboard."""

from __future__ import annotations

import streamlit as st

from components.charts import line_chart
from components.kpi_card import render_kpi_grid, render_measure_grid
from config import PageContext
from dashboards import (
    domain_table_section,
    insight_box,
    page_title,
    period_caption,
    trend_section,
)

MEASURES = [
    {"label": "Ancillary Revenue (ancillary sheet)", "domain": "ancillary",
     "column": "Ancillary Revenue", "agg": "sum", "fmt": "money"},
    {"label": "Passengers (ancillary sheet)", "domain": "ancillary",
     "column": "Passengers", "agg": "sum", "fmt": "number"},
    {"label": "Ancillary Attach Rate", "domain": "ancillary",
     "column": "Ancillary Attach Rate", "agg": "mean", "fmt": "pct",
     "direction": "higher"},
]


def render(model, ctx: PageContext) -> None:
    page_title("Ancillary Revenue", "Revenue per passenger and attach rate")
    period_caption(ctx)
    render_kpi_grid(ctx, ["Ancillary Revenue / Passenger"], cols=3)
    render_measure_grid(ctx, MEASURES, cols=3)
    st.caption("Ancillary Revenue / Passenger uses the Ancillary_Revenue "
               "sheet's Passengers column (its primary source). That column "
               "differs slightly from Passenger_Commercial Passengers — "
               "flagged in the Data Quality area, not reconciled.")
    insight_box(ctx, ["Ancillary Revenue / Passenger"])
    trend_section(ctx, "Ancillary Revenue / Passenger")
    frame = model.filter_period("ancillary", ctx.start, ctx.end)
    line_chart(frame, "Month", "Ancillary Attach Rate",
               "Ancillary Attach Rate — monthly trend", y_fmt="pct")
    domain_table_section(model, ctx, "ancillary",
                         "Ancillary Revenue — monthly detail",
                         "ancillary.csv")
