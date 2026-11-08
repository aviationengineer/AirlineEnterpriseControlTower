"""app.py — Streamlit entry point: page routing, global layout, header,
navigation across the 18 dashboard pages, global filters, DATA STATUS
banner and the SYNTHETIC DATA badge.

All data and maths come from the core layer (data/loader, data/validator,
services/kpi_engine, services/scenario_engine, services/comparison_engine);
this file only wires config, components and dashboards together.
"""

from __future__ import annotations

import importlib

import streamlit as st

from components.filters import render_global_filters
from components.status import (
    data_status_banner,
    render_header,
    synthetic_badge,
    validation_expander,
)
from config import PAGE_LABELS, PAGE_KEY_BY_LABEL, build_context
from data.cache import get_model
from data.loader import (
    MISSING_WORKBOOK_MESSAGE,
    MissingColumnError,
    MissingSheetError,
    WorkbookNotFoundError,
)
from data.validator import validate_all
from services.data_quality import build_data_quality_summary

st.set_page_config(
    page_title="WestJet — Enterprise Aviation Control Tower",
    page_icon="✈️",
    layout="wide",
)


@st.cache_resource(show_spinner="Loading the input workbook…")
def _load_model_and_report():
    """Load the workbook, build the model and validate (cached)."""
    model = get_model()
    from data.cache import get_workbook
    workbook = get_workbook()
    report = validate_all(workbook.frames)
    return model, report, workbook


def _load_or_stop():
    try:
        return _load_model_and_report()
    except WorkbookNotFoundError:
        st.error(MISSING_WORKBOOK_MESSAGE)
        st.stop()
    except MissingSheetError as exc:
        st.error(f"Workbook is missing a required sheet: {exc}")
        st.stop()
    except MissingColumnError as exc:
        st.error(f"Workbook is missing a required column: {exc}")
        st.stop()
    except Exception as exc:  # pragma: no cover - defensive
        st.error(f"Could not load the input workbook: {exc}")
        st.stop()


def main() -> None:
    model, report, workbook = _load_or_stop()
    summary = build_data_quality_summary(report)

    synthetic_badge()
    render_header(model, summary)
    data_status_banner(report)
    validation_expander(report)

    st.sidebar.title("WestJet Control Tower")
    page_label = st.sidebar.radio(
        "Navigate", PAGE_LABELS, key="nav_page")
    st.sidebar.markdown("---")
    filters = render_global_filters(model, workbook.scenarios)

    ctx = build_context(model, filters["start"], filters["end"],
                        filters, report=report)

    st.sidebar.markdown("---")
    st.sidebar.caption(
        f"Data period: {model.date_min:%B %Y} – {model.date_max:%B %Y} · "
        f"{model.n_months} months · "
        f"DATA STATUS: {report.data_status} "
        f"({report.data_quality_score:.1f}/100)")
    st.sidebar.caption("SYNTHETIC DATA — synthetic/demo values only; "
                       "not actual WestJet performance.")

    page_key = PAGE_KEY_BY_LABEL[page_label]
    module_name = dict(
        (key, mod) for key, _label, mod in
        __import__("config").PAGES)[page_key]
    module = importlib.import_module(module_name)
    module.render(model, ctx)

    st.markdown("---")
    st.caption("WestJet Enterprise Aviation Control Tower · SYNTHETIC DATA "
               "— synthetic/demo values only; not actual WestJet "
               "performance. KPI values are computed by the centralised "
               "KPI engine from the input workbook; targets are read from "
               "the workbook at load time.")


if __name__ == "__main__":
    main()
