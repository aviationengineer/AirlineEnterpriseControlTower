"""UI tests: every dashboard page renders headlessly (AppTest) with zero
exceptions, the SYNTHETIC DATA badge and DATA STATUS banner appear on
every page, filters work, the simulator runs, and the outcome page
compares baseline vs simulated.

These tests run the real app against the real workbook.
"""

import sys
from pathlib import Path

import pytest

PACKAGE_DIR = Path(__file__).resolve().parent.parent
if str(PACKAGE_DIR) not in sys.path:
    sys.path.insert(0, str(PACKAGE_DIR))

from streamlit.testing.v1 import AppTest  # noqa: E402

from config import EXECUTIVE_KPIS, PAGE_LABELS, build_context  # noqa: E402
from components.kpi_card import card_data  # noqa: E402
from data.cache import get_model  # noqa: E402
from models.scenario_model import ScenarioInput  # noqa: E402
from services.scenario_engine import (  # noqa: E402
    apply_scenario,
    build_baseline,
)

APP = str(PACKAGE_DIR / "app.py")
TIMEOUT = 120


def _run(page_label: str | None = None, **session_state) -> AppTest:
    at = AppTest.from_file(APP)
    if page_label is not None:
        at.session_state["nav_page"] = page_label
    for key, value in session_state.items():
        at.session_state[key] = value
    at.run(timeout=TIMEOUT)
    return at


def _el_text(element) -> str:
    for attr in ("value", "label"):
        value = getattr(element, attr, None)
        if value:
            return str(value)
    return ""


def _markdown_text(at: AppTest) -> str:
    """All rendered text: markdown plus alert, caption, heading, metric
    and expander elements (Streamlit splits these across collections)."""
    parts = [str(m.value) for m in at.markdown]
    for collection in (at.warning, at.info, at.success, at.error,
                       at.caption, at.subheader, at.title, at.header,
                       at.expander):
        parts += [_el_text(e) for e in collection]
    for metric in at.metric:
        parts.append(f"{metric.label} {metric.value}")
    return " ".join(parts)


def _button(at: AppTest, label: str):
    for button in at.button:
        if button.label == label:
            return button
    raise AssertionError(f"button {label!r} not found")


@pytest.mark.parametrize("page_label", PAGE_LABELS)
def test_all_pages_render_without_exceptions(page_label):
    """All 19 pages render with zero exceptions (task acceptance check)."""
    at = _run(page_label)
    assert list(at.exception) == []
    text = _markdown_text(at)
    assert "SYNTHETIC DATA" in text
    assert "DATA STATUS: Warning" in text


def test_executive_overview_has_14_kpi_cards():
    """Brief section 8: the 14 executive KPI cards are present."""
    at = _run("Executive Overview")
    assert list(at.exception) == []
    text = _markdown_text(at)
    for kpi in EXECUTIVE_KPIS:
        label = "Passenger Volume" if kpi == "Passengers" else kpi
        assert label in text, f"missing executive KPI card: {label}"
    # Aircraft Utilisation target caveat (task constraint).
    assert "Target appears to be a daily figure" in text
    assert len(at.download_button) >= 1  # KPI summary export


def test_utilisation_status_withheld():
    """Aircraft Utilisation: target displayed, no pass/fail status."""
    model = get_model()
    ctx = build_context(model, model.date_min, model.date_max, {})
    data = card_data(ctx, "Aircraft Utilization")
    assert data["target"] == 10.5
    assert data["status"][0].startswith("Status withheld")


def test_year_filter_narrows_period():
    """Year quick-pick sets the effective range to that year."""
    at = _run("Executive Overview", flt_year="2024")
    assert list(at.exception) == []
    assert "January 2024" in _markdown_text(at)
    assert "December 2024" in _markdown_text(at)


def test_plan_series_shows_not_available_note():
    """No Plan/Forecast data: choosing Plan warns and keeps Actual."""
    at = _run("Executive Overview", flt_series="Plan")
    assert list(at.exception) == []
    text = _markdown_text(at)
    assert "Plan data is not available" in text
    assert "Total Revenue" in text  # Actual values still shown


def test_reset_filters_restores_defaults():
    """Reset Filters returns the Year filter to All."""
    at = _run("Executive Overview", flt_year="2024")
    assert at.session_state["flt_year"] == "2024"
    _button(at, "Reset Filters").click().run(timeout=TIMEOUT)
    assert list(at.exception) == []
    assert at.session_state["flt_year"] == "All"


def test_simulator_runs_fuel_scenario():
    """Simulator: Fuel Price +20% runs and labels outputs SIMULATED."""
    at = _run("Scenario Simulator")
    assert list(at.exception) == []
    at.slider(key="sim_fuel_price").set_value(20).run(timeout=TIMEOUT)
    _button(at, "Run simulation").click().run(timeout=TIMEOUT)
    assert list(at.exception) == []
    text = _markdown_text(at)
    assert "SIMULATED" in text
    assert "SCENARIO ASSUMPTIONS" in text
    assert "Fuel Price +20%" in text
    assert len(at.download_button) >= 1  # scenario results export


def test_outcome_page_without_scenario():
    """Outcome page with no scenario states 'No scenario applied'."""
    at = _run("Scenario Outcome")
    assert list(at.exception) == []
    assert "No scenario applied" in _markdown_text(at)


def test_outcome_page_with_scenario():
    """Outcome page compares Actual vs Baseline vs Simulated."""
    model = get_model()
    baseline = build_baseline(model, model.date_min, model.date_max)
    result = apply_scenario(
        baseline, ScenarioInput(fuel_price=20.0, label="Fuel Shock"))
    state = {
        "label": "S001 Fuel Shock",
        "preset_id": "S001",
        "inputs": {"fuel_price": 20.0},
        "result": result,
        "baseline": baseline,
    }
    at = _run("Scenario Outcome", scenario_state=state)
    assert list(at.exception) == []
    text = _markdown_text(at)
    assert "SIMULATED" in text
    assert "SCENARIO ASSUMPTIONS" in text
    # "Baseline (= Actual)" is a dataframe column header, not markdown.
    assert len(at.dataframe) >= 1
    columns = list(at.dataframe[0].value.columns)
    assert "Baseline (= Actual)" in columns
    assert "Simulated (SIMULATED)" in columns
    assert len(at.download_button) >= 1  # scenario outcome export


def test_network_route_ranking_present():
    """Network page shows the route ranking table."""
    at = _run("Network / Route Profitability")
    assert list(at.exception) == []
    assert "Route ranking" in _markdown_text(at)
    assert len(at.dataframe) >= 1
    assert len(at.download_button) >= 1


def test_data_quality_warnings_visible():
    """Validation warnings (the workbook quirks) surface on the page."""
    at = _run("Executive Overview")
    assert list(at.exception) == []
    assert "validation issues" in _markdown_text(at).lower()
