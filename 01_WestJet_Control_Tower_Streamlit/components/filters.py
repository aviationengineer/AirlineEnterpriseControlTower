"""components/filters.py — global filters (brief section 6) + Reset Filters.

Date From/To, Year, Quarter, Month, Domain, KPI Category, Actual/Plan/
Forecast, Scenario, Route, Airport, Aircraft, Fleet, Geography.

Behaviour notes (all driven by the loaded workbook, never hard-coded):
- The workbook holds monthly data; Date From/To are month pickers.
- Year / Quarter / Month are quick picks that set the date range
  (Month overrides Quarter overrides Year overrides Date From/To);
  the effective range is always contiguous, so engine aggregates stay
  correct, and it is shown under the filters.
- No Plan/Forecast data exists in the workbook: the Actual/Plan/
  Forecast control offers Actual as available and Plan/Forecast as
  unavailable — choosing one shows an explanatory note and the app
  keeps showing Actual values (never faked plan/forecast values).
- Airport / Aircraft / Fleet / Geography have no workbook columns, so
  those controls are disabled with an explanatory note.
- Route comes from the Network_Routes sheet (routes in the workbook).
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from config import KPI_CATEGORIES

DOMAINS: list[str] = [
    "All domains", "Flight Operations", "MRO / Tech Ops", "Crew / People",
    "Passenger / Commercial", "Revenue Management", "Network / Routes",
    "Finance", "Baggage", "Cargo", "Airport / Ground", "Fuel",
    "Ancillary Revenue", "Data Platform", "AI / Data Products",
    "Data Governance",
]

FILTER_DEFAULTS: dict = {
    "flt_year": "All",
    "flt_quarter": "All",
    "flt_month": "All",
    "flt_domain": "All domains",
    "flt_series": "Actual",
    "flt_route": "All routes",
}


def _month_options(model) -> list[pd.Timestamp]:
    cal = model.domains["calendar"]["Month"].sort_values()
    return [pd.Timestamp(m) for m in cal]


def _month_label(month: pd.Timestamp) -> str:
    return f"{month:%B %Y}"


def _ensure_defaults(model) -> None:
    months = _month_options(model)
    if "flt_date_from" not in st.session_state:
        st.session_state["flt_date_from"] = _month_label(months[0])
    if "flt_date_to" not in st.session_state:
        st.session_state["flt_date_to"] = _month_label(months[-1])
    for key, value in FILTER_DEFAULTS.items():
        st.session_state.setdefault(key, value)
    st.session_state.setdefault("flt_categories", list(KPI_CATEGORIES))
    st.session_state.setdefault("flt_scenario", "None")
    st.session_state.setdefault("flt_airport", "Not available in workbook")
    st.session_state.setdefault("flt_aircraft", "Not available in workbook")
    st.session_state.setdefault("flt_fleet", "Not available in workbook")
    st.session_state.setdefault("flt_geography", "Not available in workbook")


def _parse_month(label: str) -> pd.Timestamp:
    return pd.to_datetime(label)


def reset_filters(model) -> None:
    """Restore every global filter to its default and rerun."""
    for key in list(st.session_state.keys()):
        if key.startswith("flt_"):
            del st.session_state[key]
    _ensure_defaults(model)
    st.session_state["flt_scenario"] = "None"
    st.session_state["scenario_preset_id"] = None


def render_global_filters(model, scenarios_frame=None) -> dict:
    """Render the sidebar filters; return the effective filter dict."""
    _ensure_defaults(model)
    months = _month_options(model)
    labels = [_month_label(m) for m in months]
    years = sorted({m.year for m in months})

    st.sidebar.header("Global filters")
    date_from_label = st.sidebar.selectbox(
        "Date From", labels, key="flt_date_from")
    date_to_label = st.sidebar.selectbox(
        "Date To", labels, key="flt_date_to")
    year = st.sidebar.selectbox(
        "Year", ["All"] + [str(y) for y in years], key="flt_year")
    quarter = st.sidebar.selectbox(
        "Quarter", ["All", "Q1", "Q2", "Q3", "Q4"], key="flt_quarter")
    month_names = ["All"] + [f"{m:%B}" for m in pd.to_datetime(
        [f"2024-{i:02d}-01" for i in range(1, 13)])]
    month = st.sidebar.selectbox("Month", month_names, key="flt_month")

    domain = st.sidebar.selectbox("Domain", DOMAINS, key="flt_domain")
    categories = st.sidebar.multiselect(
        "KPI Category", KPI_CATEGORIES, key="flt_categories")
    series = st.sidebar.radio(
        "Actual / Plan / Forecast", ["Actual", "Plan", "Forecast"],
        key="flt_series")

    scenario_options = ["None"]
    if scenarios_frame is not None and len(scenarios_frame):
        scenario_options += [
            f"{row['Scenario ID']} — {row['Scenario Name']}"
            for _, row in scenarios_frame.iterrows()]
    scenario = st.sidebar.selectbox(
        "Scenario", scenario_options, key="flt_scenario")

    routes = ["All routes"] + sorted(
        model.domains["network"]["Route"].dropna().unique().tolist())
    route = st.sidebar.selectbox("Route", routes, key="flt_route")

    st.sidebar.selectbox("Airport", ["Not available in workbook"],
                         key="flt_airport", disabled=True)
    st.sidebar.selectbox("Aircraft", ["Not available in workbook"],
                         key="flt_aircraft", disabled=True)
    st.sidebar.selectbox("Fleet", ["Not available in workbook"],
                         key="flt_fleet", disabled=True)
    st.sidebar.selectbox("Geography", ["Not available in workbook"],
                         key="flt_geography", disabled=True)
    st.sidebar.caption("Airport / Aircraft / Fleet / Geography: no such "
                       "columns exist in the loaded workbook, so these "
                       "filters are unavailable.")

    if st.sidebar.button("Reset Filters"):
        reset_filters(model)
        st.rerun()

    # --- Effective range (Month > Quarter > Year > Date From/To) --------
    start = _parse_month(date_from_label)
    end = _parse_month(date_to_label)
    if start > end:
        start, end = end, start
    if year != "All":
        y = int(year)
        start = max(pd.Timestamp(year=y, month=1, day=1), months[0])
        end = min(pd.Timestamp(year=y, month=12, day=1), months[-1])
    if quarter != "All":
        q = int(quarter[1])
        y = int(year) if year != "All" else months[-1].year
        start = max(pd.Timestamp(year=y, month=(q - 1) * 3 + 1, day=1),
                    months[0])
        end = min(pd.Timestamp(year=y, month=q * 3, day=1), months[-1])
    if month != "All":
        m_num = pd.to_datetime(month, format="%B").month
        y = int(year) if year != "All" else months[-1].year
        candidate = pd.Timestamp(year=y, month=m_num, day=1)
        if candidate not in set(months):
            # Fall back to the latest year holding that month.
            held = [m for m in months if m.month == m_num]
            candidate = held[-1] if held else candidate
        start = end = candidate

    if series in ("Plan", "Forecast"):
        st.sidebar.warning(
            f"{series} data is not available in the loaded workbook — "
            "the workbook contains Actual values only. Showing Actual.")
    st.sidebar.caption(
        f"Effective range: {start:%B %Y} – {end:%B %Y}")

    preset_id = None
    if scenario != "None":
        preset_id = scenario.split(" — ")[0]
    st.session_state["scenario_preset_id"] = preset_id

    return {
        "start": start, "end": end,
        "date_from": date_from_label, "date_to": date_to_label,
        "year": year, "quarter": quarter, "month": month,
        "domain": domain, "categories": list(categories),
        "series_requested": series, "series_effective": "Actual",
        "scenario": scenario, "scenario_preset_id": preset_id,
        "route": route,
    }
