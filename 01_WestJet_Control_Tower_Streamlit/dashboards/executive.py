"""dashboards/executive.py — Executive Overview (landing page, brief §8).

The 14 KPI cards (current, previous period, YoY %, target, variance to
target, mini trend, status), revenue/cost and load-factor trends, the
KPI explorer table (driven by the Domain and KPI Category filters) and
the KPI summary export. All values come from services/kpi_engine.py.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from components.charts import line_chart
from components.kpi_card import render_kpi_grid
from components.tables import csv_download_button, kpi_summary_frame
from config import (
    EXECUTIVE_KPIS,
    KPI_CATEGORY_MAP,
    PageContext,
)
from dashboards import insight_box, page_title, period_caption, trend_section
from models.kpi_model import KPI_NAMES

# Domain filter value -> KPI categories shown in the explorer table.
DOMAIN_CATEGORIES: dict[str, list[str] | None] = {
    "All domains": None,
    "Flight Operations": ["Operations"],
    "MRO / Tech Ops": ["MRO", "Cost"],
    "Crew / People": ["People"],
    "Passenger / Commercial": ["Customer", "Revenue"],
    "Revenue Management": ["Revenue"],
    "Network / Routes": ["Network", "Revenue"],
    "Finance": ["Cost", "Revenue"],
    "Baggage": ["Operations"],
    "Cargo": ["Revenue", "Operations"],
    "Airport / Ground": ["Operations"],
    "Fuel": ["Cost"],
    "Ancillary Revenue": ["Revenue"],
    "Data Platform": ["Data Platform"],
    "AI / Data Products": ["AI / Data Products"],
    "Data Governance": ["Governance", "Data Platform"],
}


def render(model, ctx: PageContext) -> None:
    page_title("Executive Overview",
               "Enterprise Performance · Operations · Commercial · MRO · "
               "Data & AI")
    period_caption(ctx)

    st.subheader("Executive KPIs")
    render_kpi_grid(ctx, EXECUTIVE_KPIS, cols=3)
    st.caption("Aircraft Utilisation: target shown without a pass/fail "
               "status — target appears to be a daily figure; status "
               "withheld pending confirmation.")

    insight_box(ctx, ["Total Revenue", "Operating Margin", "Load Factor",
                      "D0", "Dispatch Reliability"])

    col1, col2 = st.columns(2)
    with col1:
        line_chart(ctx.kpi_frame, "Month", "Total Revenue",
                   "Total Revenue — monthly trend")
    with col2:
        trend_section(ctx, "Load Factor")

    st.subheader("KPI explorer")
    st.caption("Filtered by the Domain and KPI Category global filters. "
               "Targets are read from the workbook at load time; "
               "‘n/a’ means the workbook carries no target for that KPI.")
    categories = ctx.filters.get("categories") or []
    domain_cats = DOMAIN_CATEGORIES.get(
        ctx.filters.get("domain", "All domains"))
    all_kpis = EXECUTIVE_KPIS + [k for k in KPI_NAMES
                                 if k not in EXECUTIVE_KPIS]
    rows = []
    for kpi in all_kpis:
        cat = KPI_CATEGORY_MAP.get(kpi, "—")
        if categories and cat not in categories:
            continue
        if domain_cats is not None and cat not in domain_cats:
            continue
        current = ctx.current.get(kpi)
        target = ctx.target_for(kpi)
        rows.append({
            "KPI": kpi,
            "Category": cat,
            "Current": current,
            "Previous period": ctx.prior.get(kpi) if ctx.prior else None,
            "YoY change": ctx.yoy_pct(kpi),
            "Target": target,
        })
    explorer = pd.DataFrame(rows)
    st.dataframe(explorer, width="stretch")
    st.caption(f"Showing {len(explorer)} of {len(all_kpis)} KPIs.")

    summary = kpi_summary_frame(ctx, EXECUTIVE_KPIS)
    csv_download_button("Download KPI summary (CSV)", summary,
                        "executive_kpi_summary.csv")
