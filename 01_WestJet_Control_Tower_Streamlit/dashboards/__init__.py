"""Dashboard pages package (18 pages).

Shared page scaffolding lives here so the 18 page modules stay small:
title/caption helpers, the monthly-trend section, the filtered-table
section with CSV export, the "not in workbook" note, and the generated
insight box. No KPI logic lives here — values come from the KPI engine
via the page context.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from components.charts import line_chart
from components.kpi_card import insight_line
from components.tables import filtered_table


def page_title(title: str, subtitle: str) -> None:
    """Page heading + subtitle."""
    st.title(title)
    st.caption(subtitle)


def period_caption(ctx) -> None:
    """Selected-period caption shown on every dashboard page."""
    st.caption(
        f"Selected period: {ctx.start:%B %Y} – {ctx.end:%B %Y} "
        f"({ctx.n_months} month(s)) · "
        f"Domain filter: {ctx.filters.get('domain', 'All domains')} · "
        f"Series: {ctx.filters.get('series_effective', 'Actual')}")
    if ctx.filters.get("series_requested") in ("Plan", "Forecast"):
        st.info("Plan / Forecast data is not available in the loaded "
                "workbook — showing Actual values.")


def insight_box(ctx, kpis: list[str]) -> None:
    """Auto-generated insights (labelled as generated, not raw data)."""
    with st.expander("Generated insights — what happened, and is it "
                     "good or bad?", expanded=False):
        for kpi in kpis:
            st.write("• " + insight_line(ctx, kpi))
        st.caption("Insights are generated from the KPI engine values for "
                   "the selected period (current vs prior year, and vs "
                   "target where one exists).")


def trend_section(ctx, kpi: str, title: str | None = None,
                  target: bool = True) -> None:
    """Monthly trend line for one engine KPI over the selected range."""
    frame = ctx.kpi_frame
    if frame is None or len(frame) == 0:
        st.caption(f"{title or kpi}: no data for the selected period.")
        return
    tgt = ctx.target_for(kpi) if target else None
    line_chart(frame, "Month", kpi, title or f"{kpi} — monthly trend",
               target=tgt,
               y_fmt="pct" if kpi in (
                   "Load Factor", "D0", "D15", "Dispatch Reliability",
                   "Operating Margin", "Baggage Mishandling Rate",
                   "Ticket Deflection Rate", "Data Quality",
                   "Platform Availability", "Data Product Adoption")
               else None)


def domain_table_section(model, ctx, domain: str, title: str,
                         filename: str) -> None:
    """Filtered monthly domain table + CSV export."""
    frame = model.filter_period(domain, ctx.start, ctx.end)
    if "Month" in frame.columns:
        frame = frame.copy()
        frame["Month"] = pd.to_datetime(frame["Month"]).dt.strftime("%Y-%m")
    filtered_table(frame, title, filename)


def derived_ratio_card(ctx, label: str, num_spec: dict, den_spec: dict,
                       direction: str | None = None) -> None:
    """Card for a documented derivable ratio (KPI dictionary: 'Derivable').

    The numerator and denominator are plain aggregations of workbook
    columns over the selected period; the ratio itself is not one of the
    18 engine KPIs, so it is labelled 'Derived' on the card.
    """
    from components.kpi_card import render_kpi_card
    from config import _shift_range, measure_value, pct_change

    model = ctx.model
    num = measure_value(model, num_spec, ctx.start, ctx.end)
    den = measure_value(model, den_spec, ctx.start, ctx.end)
    current = (num / den) if num is not None and den not in (None, 0) \
        else None
    prior = None
    yoy = None
    if ctx.n_months:
        shifted = _shift_range(model, ctx.start, ctx.end,
                               months=ctx.n_months)
        if shifted is not None:
            n2 = measure_value(model, num_spec, shifted[0], shifted[1])
            d2 = measure_value(model, den_spec, shifted[0], shifted[1])
            prior = (n2 / d2) if n2 is not None and d2 not in (None, 0) \
                else None
    shifted_y = _shift_range(model, ctx.start, ctx.end, years=1)
    if shifted_y is not None:
        n3 = measure_value(model, num_spec, shifted_y[0], shifted_y[1])
        d3 = measure_value(model, den_spec, shifted_y[0], shifted_y[1])
        prev_y = (n3 / d3) if n3 is not None and d3 not in (None, 0) \
            else None
        yoy = pct_change(current, prev_y)
    if yoy is None:
        status = ("⚪ No comparison", "grey")
    else:
        good = (yoy <= 0) if direction == "lower" else (yoy >= 0)
        status = ("🟢 Favourable YoY" if good else "🔴 Unfavourable YoY",
                  "green" if good else "red")
    frame = model.filter_period(num_spec["domain"], ctx.start, ctx.end)
    trend = frame[num_spec["column"]] if num_spec["column"] in \
        frame.columns else pd.Series(dtype=float)
    render_kpi_card({
        "kpi": label, "label": f"{label} (derived)",
        "current": current, "prior": prior, "yoy": yoy, "target": None,
        "variance_to_target": None, "trend": trend, "status": status,
        "fmt": "pct",
    })


def not_available_note(items: list[str], reason: str) -> None:
    """Explicitly list brief KPIs that have no workbook column — they are
    shown as unavailable, never invented."""
    if not items:
        return
    st.info("Not available from the loaded workbook — not computed: "
            + ", ".join(items) + f". {reason}")
