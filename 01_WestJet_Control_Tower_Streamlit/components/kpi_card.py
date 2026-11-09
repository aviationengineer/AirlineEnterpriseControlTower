"""components/kpi_card.py — reusable KPI card (brief section 8 / KPI
dictionary section 23).

Every card shows: current value, previous period, YoY %, target, variance
to target, mini trend, status indicator. All values come from
``services/kpi_engine.py`` via the page context — this component never
computes a KPI formula. Domain measures (raw sums/means) are aggregated
by ``config.measure_value`` only.

Aircraft Utilisation caveat: the workbook formula yields ~248
hrs/aircraft/month against a target of 10.5, so the target is displayed
but no pass/fail status is shown, with the footnote from config.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from config import (
    EXECUTIVE_LABELS,
    KPI_FORMATS,
    LEVEL_DIRECTIONS,
    UTILISATION_FOOTNOTE,
    PageContext,
    describe_change,
    format_change,
    format_value,
    is_pct_kpi,
    measure_value,
    pct_change,
)
from models.kpi_model import LOWER_IS_BETTER


def _status_text(kpi: str, value, target, yoy) -> tuple[str, str]:
    """(status label, colour) for a card.

    Engine KPIs: status vs target where one exists. Level KPIs without a
    target: status vs YoY direction. Aircraft Utilisation: withheld.
    """
    if kpi == "Aircraft Utilization":
        return ("Status withheld — see note", "grey")
    if target is not None and value is not None:
        if kpi in LOWER_IS_BETTER:
            good = value <= target
        else:
            good = value >= target
        return ("🟢 On target" if good else "🔴 Off target",
                "green" if good else "red")
    if yoy is None:
        return ("⚪ No comparison", "grey")
    lower_better = kpi in LOWER_IS_BETTER or \
        LEVEL_DIRECTIONS.get(kpi) == "lower"
    good = (yoy <= 0) if lower_better else (yoy >= 0)
    if yoy == 0:
        return ("⚪ Flat YoY", "grey")
    return ("🟢 Favourable YoY" if good else "🔴 Unfavourable YoY",
            "green" if good else "red")


def card_data(ctx: PageContext, kpi: str) -> dict:
    """Assemble one card's display values from the engine aggregates."""
    current = ctx.current.get(kpi)
    prior = ctx.prior.get(kpi) if ctx.prior else None
    yoy = ctx.yoy_pct(kpi)
    target = ctx.target_for(kpi)
    var = None
    if target not in (None, 0) and current is not None:
        var = (float(current) - float(target)) / abs(float(target))
    trend = ctx.trend(kpi)
    return {
        "kpi": kpi,
        "label": EXECUTIVE_LABELS.get(kpi, kpi),
        "current": current,
        "prior": prior,
        "yoy": yoy,
        "target": target,
        "variance_to_target": var,
        "trend": trend,
        "status": _status_text(kpi, current, target, yoy),
        # KPI-card accent: the active theme's primary colour.
        "accent": (ctx.theme or {}).get("primary", "#002855"),
    }


def measure_card_data(ctx: PageContext, spec: dict) -> dict:
    """Card data for a raw domain measure (count / sum / mean / last).

    spec: {"label", "domain", "column", "agg", "fmt": "number"|"money"|
    "pct", "direction": "higher"|"lower"|None, "target": float|None}.
    The value is a plain aggregation of a workbook column — not a KPI
    formula — and YoY is the same aggregation over the prior-year range.
    """
    from config import _shift_range

    model = ctx.model
    current = measure_value(model, spec, ctx.start, ctx.end)
    prior = None
    if ctx.n_months:
        shifted = _shift_range(model, ctx.start, ctx.end,
                               months=ctx.n_months)
        if shifted is not None:
            prior = measure_value(model, spec, shifted[0], shifted[1])
    yoy = None
    shifted_y = _shift_range(model, ctx.start, ctx.end, years=1)
    if shifted_y is not None:
        prev_y = measure_value(model, spec, shifted_y[0], shifted_y[1])
        yoy = pct_change(current, prev_y)
    target = spec.get("target")
    var = None
    if target not in (None, 0) and current is not None:
        var = (float(current) - float(target)) / abs(float(target))
    frame = model.filter_period(spec["domain"], ctx.start, ctx.end)
    trend = frame[spec["column"]] if spec["column"] in frame.columns \
        else pd.Series(dtype=float)
    label = spec["label"]
    direction = spec.get("direction")
    if target is not None and current is not None:
        good = (current <= target) if direction == "lower" \
            else (current >= target)
        status = ("🟢 On target" if good else "🔴 Off target",
                  "green" if good else "red")
    elif yoy is None:
        status = ("⚪ No comparison", "grey")
    else:
        good = (yoy <= 0) if direction == "lower" else (yoy >= 0)
        status = ("🟢 Favourable YoY" if good else "🔴 Unfavourable YoY",
                  "green" if good else "red")
    return {
        "kpi": label, "label": label, "current": current, "prior": prior,
        "yoy": yoy, "target": target, "variance_to_target": var,
        "trend": trend, "status": status,
        "fmt": spec.get("fmt", "number"),
        # KPI-card accent: the active theme's primary colour.
        "accent": (ctx.theme or {}).get("primary", "#002855"),
    }


def _format_card_value(data: dict) -> str:
    fmt = data.get("fmt")
    if fmt == "money":
        from config import format_money
        return format_money(data["current"])
    if fmt == "pct":
        from config import format_pct
        return format_pct(data["current"])
    if data["kpi"] in KPI_FORMATS or data["kpi"] in (
            "Total Revenue", "Operating Cost", "Cash Position", "Passengers"):
        return format_value(data["kpi"], data["current"])
    from config import format_number
    return format_number(data["current"])


def render_kpi_card(data: dict, *, show_trend: bool = True) -> None:
    """Render one KPI card from pre-computed card data."""
    label = data["label"]
    value_text = _format_card_value(data)
    yoy = data["yoy"]
    yoy_text = format_change(yoy, is_pct_kpi=is_pct_kpi(data["kpi"])) \
        if yoy is not None else "n/a"
    prior_text = _format_card_value({**data, "current": data["prior"]}) \
        if data["prior"] is not None else "n/a"
    target = data["target"]
    target_text = _format_card_value({**data, "current": target}) \
        if target is not None else "n/a"
    var = data["variance_to_target"]
    var_text = format_change(var, is_pct_kpi=is_pct_kpi(data["kpi"])) \
        if var is not None else "n/a"
    status_label, _colour = data["status"]

    st.markdown(f"**{label}**")
    accent = data.get("accent", "#002855")
    st.markdown(f"<span style='font-size:1.5em;font-weight:700;color:{accent};'>"
                f"{value_text}</span>", unsafe_allow_html=True)
    st.caption(f"Previous period: {prior_text} · YoY: {yoy_text}")
    st.caption(f"Target: {target_text} · Variance to target: {var_text}")
    st.caption(status_label)
    if data["kpi"] == "Aircraft Utilization":
        st.caption(f"ℹ️ {UTILISATION_FOOTNOTE}")
    if show_trend:
        trend = data["trend"]
        if trend is not None and len(trend) >= 2:
            st.line_chart(trend, height=70)
        elif trend is not None and len(trend) == 1:
            st.caption("Trend: single month in range.")


def render_kpi_grid(ctx: PageContext, kpis: list[str],
                    cols: int = 3) -> None:
    """Grid of engine-KPI cards (executive + domain pages)."""
    for row_start in range(0, len(kpis), cols):
        row = kpis[row_start:row_start + cols]
        columns = st.columns(len(row))
        for col, kpi in zip(columns, row):
            with col:
                render_kpi_card(card_data(ctx, kpi))


def render_measure_grid(ctx: PageContext, specs: list[dict],
                        cols: int = 3) -> None:
    """Grid of raw domain-measure cards."""
    for row_start in range(0, len(specs), cols):
        row = specs[row_start:row_start + cols]
        columns = st.columns(len(row))
        for col, spec in zip(columns, row):
            with col:
                render_kpi_card(measure_card_data(ctx, spec))


def insight_line(ctx: PageContext, kpi: str) -> str:
    """Auto-generated insight line for one KPI (labelled as generated)."""
    return describe_change(kpi, ctx.current.get(kpi), ctx.yoy_pct(kpi))
