"""dashboards/ai_products.py — AI / Data Products dashboard.

Lifecycle (Idea → Discovery → Development → Certified → Production →
Adopted → Scaled → Retired) has no workbook column, so no stage counts
are shown. AI_Data_Products.Adoption Rate is not displayed as Data
Product Adoption — its definition is not given in the workbook.
"""

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
    {"label": "Registered Data Products (period-end)",
     "domain": "ai_products", "column": "Registered Data Products",
     "agg": "last", "fmt": "number"},
    {"label": "Active Data Products (period-end)", "domain": "ai_products",
     "column": "Active Data Products", "agg": "last", "fmt": "number",
     "direction": "higher"},
    {"label": "Estimated Business Value", "domain": "ai_products",
     "column": "Estimated Business Value", "agg": "sum", "fmt": "money",
     "direction": "higher"},
    {"label": "Critical Incidents", "domain": "ai_products",
     "column": "Critical Incidents", "agg": "sum", "fmt": "number",
     "direction": "lower"},
]


def render(model, ctx: PageContext) -> None:
    page_title("AI / Data Products",
               "Registered and active data products, value and incidents")
    period_caption(ctx)
    render_kpi_grid(ctx, ["Data Product Adoption"], cols=3)
    render_measure_grid(ctx, MEASURES, cols=4)
    insight_box(ctx, ["Data Product Adoption"])
    trend_section(ctx, "Data Product Adoption")
    frame = model.filter_period("ai_products", ctx.start, ctx.end)
    line_chart(frame, "Month", "Estimated Business Value",
               "Estimated Business Value — monthly trend")
    line_chart(frame, "Month", "Critical Incidents",
               "Critical Incidents by month")
    domain_table_section(model, ctx, "ai_products",
                         "AI / Data Products — monthly detail",
                         "ai_products.csv")
    not_available_note(
        ["Product lifecycle stages (Idea → Retired)", "Product Reliability",
         "Product Quality", "Consumer Adoption"],
        "The workbook carries no lifecycle-stage column and no reliability, "
        "quality or consumer-adoption column. The supplied Adoption Rate "
        "column is not displayed: its definition is not given in the "
        "workbook.")
