"""components/status.py — header, SYNTHETIC DATA badge, DATA STATUS banner.

All text comes from the loaded model / validation report; nothing here
hard-codes dates, values or targets.
"""

from __future__ import annotations

import datetime
from pathlib import Path

import streamlit as st

from config import (
    APP_SUBTITLE,
    APP_TAGLINE,
    APP_TITLE,
    SYNTHETIC_BADGE_TEXT,
    WORKBOOK_PATH,
)


def synthetic_badge() -> None:
    """Visible SYNTHETIC DATA badge — rendered on every page (app.py)."""
    st.markdown(
        '<div style="background-color:#FFF3CD;border:1px solid #FFC72C;'
        'border-radius:6px;padding:6px 12px;margin-bottom:12px;'
        'font-weight:700;color:#7A5A00;">⚠ '
        + SYNTHETIC_BADGE_TEXT + '</div>',
        unsafe_allow_html=True,
    )


def render_header(model, report_summary: dict | None = None,
                  theme: dict | None = None) -> None:
    """Page header: logo + airline name, title, subheader, Data Period,
    Last Refresh, Data Quality, Platform Status (brief section 17).

    The logo is a remote URL (Wikimedia Commons, verified) — never a file
    in the repo. If it fails to load, the image hides itself and the
    airline name (always rendered as text) remains.
    """
    from config import DEFAULT_THEME_ID, THEMES

    theme = theme or THEMES[DEFAULT_THEME_ID]
    name = theme.get("airline", APP_TITLE)
    logo_url = theme.get("logo_url") or ""
    if logo_url:
        col_logo, col_title = st.columns([1, 6])
        with col_logo:
            st.markdown(
                f'<img src="{logo_url}" alt="{name} logo" '
                "onerror=\"this.style.display='none'\" "
                'style="max-height:48px;max-width:180px;">',
                unsafe_allow_html=True,
            )
        with col_title:
            st.markdown(f"## {name.upper()} &nbsp;·&nbsp; {APP_SUBTITLE}")
    else:
        st.markdown(f"## {name.upper()} &nbsp;·&nbsp; {APP_SUBTITLE}")
    st.caption(APP_TAGLINE)
    period = "n/a"
    if model.date_min is not None and model.date_max is not None:
        period = (f"{model.date_min:%B %Y} – {model.date_max:%B %Y} "
                  f"({model.n_months} months)")
    quality = "n/a"
    status = "Unknown"
    if report_summary is not None:
        quality = (f"{report_summary['data_quality_score']:.1f} / 100 "
                   f"({report_summary['data_status']})")
        status = report_summary["data_status"]
    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Data Period", period)
    col2.metric("Last Refresh", _last_refresh())
    col3.metric("Data Quality", quality)
    col4.metric("Platform Status",
                "Operational" if status != "Critical"
                else "Attention needed")


def _last_refresh() -> str:
    """Workbook file modification time (the last successful refresh)."""
    try:
        mtime = Path(WORKBOOK_PATH).stat().st_mtime
        moment = datetime.datetime.fromtimestamp(mtime)
        return moment.strftime("%Y-%m-%d %H:%M")
    except OSError:
        return "n/a"


def data_status_banner(report) -> None:
    """DATA STATUS banner (brief section 18): Healthy / Warning / Critical,
    plus score, errors, warnings and checks. Never silently ignored."""
    status = report.data_status
    score = report.data_quality_score
    text = (f"**DATA STATUS: {status}** — data-quality score {score:.1f}/100 "
            f"· {len(report.errors)} error(s) · {len(report.warnings)} "
            f"warning(s) · {report.n_checks} checks run.")
    if status == "Critical":
        st.error(text)
    elif status == "Warning":
        st.warning(text)
    else:
        st.success(text)


def validation_expander(report) -> None:
    """Data Quality area: every validation issue, warnings included."""
    issues = report.issues
    with st.expander(
            f"Data quality — validation issues ({len(issues)})",
            expanded=False):
        if not issues:
            st.write("No validation issues. All checks passed.")
            return
        for issue in issues:
            icon = "🔴" if issue.severity == "Critical" else (
                "🟠" if issue.severity == "High" else "🟡")
            st.write(f"{icon} **{issue.rule_id}** [{issue.severity}] "
                     f"{issue.sheet} / {issue.column or '—'} — "
                     f"{issue.message}")
        st.caption("Workbook quirks are flagged here as warnings and are "
                   "reported as-is; the KPI engine uses each KPI's primary "
                   "source, so the quirks do not change any KPI value.")
