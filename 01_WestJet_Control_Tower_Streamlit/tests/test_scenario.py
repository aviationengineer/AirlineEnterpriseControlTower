"""Scenario tests: fuel, demand, maintenance, labour, yield, presets."""

import pytest

from models.scenario_model import (
    ScenarioInput, load_scenario_definitions, preset_to_input,
)
from services.scenario_engine import (
    apply_scenario, build_baseline, run_all_presets, run_preset_scenario,
)


@pytest.fixture
def baseline(model):
    # Single latest month as a tight, hand-checkable baseline.
    return build_baseline(model, "2026-12-01", "2026-12-01")


def test_zero_inputs_reproduce_baseline(baseline):
    result = apply_scenario(baseline, ScenarioInput())
    assert result.revenue_impact == pytest.approx(0.0)
    assert result.cost_impact == pytest.approx(0.0)
    assert result.is_simulated is True
    assert result.total_revenue == pytest.approx(baseline["Total Revenue"])
    assert result.operating_cost == pytest.approx(baseline["Operating Cost"])


def test_fuel_plus_20_chain(baseline):
    result = apply_scenario(baseline, ScenarioInput(fuel_price=20.0))
    fuel_delta = 0.20 * baseline["Fuel Cost"]
    assert result.cost_impact == pytest.approx(fuel_delta)
    assert result.operating_cost == pytest.approx(
        baseline["Operating Cost"] + fuel_delta)
    assert result.cask == pytest.approx(
        result.operating_cost / baseline["ASM"])
    base_margin = ((baseline["Total Revenue"] - baseline["Operating Cost"])
                   / baseline["Total Revenue"])
    assert result.operating_margin < base_margin
    assert result.cash_impact == pytest.approx(-fuel_delta)
    assert result.revenue_impact == pytest.approx(0.0)


def test_demand_plus_10_chain(baseline):
    result = apply_scenario(baseline, ScenarioInput(passenger_demand=10.0))
    assert result.passengers == pytest.approx(baseline["Passengers"] * 1.10)
    assert result.load_factor == pytest.approx(
        baseline["RPM"] * 1.10 / baseline["ASM"])
    expected_rev = baseline["Total Revenue"] + 0.10 * (
        baseline["Passenger Revenue"] + baseline["Ancillary Revenue"])
    assert result.total_revenue == pytest.approx(expected_rev)
    assert result.rask == pytest.approx(
        baseline["Passenger Revenue"] * 1.10 / baseline["ASM"])
    assert result.operating_margin > \
        (baseline["Total Revenue"] - baseline["Operating Cost"]) / \
        baseline["Total Revenue"]


def test_demand_minus_10(baseline):
    result = apply_scenario(baseline, ScenarioInput(passenger_demand=-10.0))
    assert result.passengers == pytest.approx(baseline["Passengers"] * 0.90)
    assert result.load_factor == pytest.approx(
        baseline["RPM"] * 0.90 / baseline["ASM"])
    assert result.total_revenue < baseline["Total Revenue"]


def test_maintenance_plus_12(baseline):
    result = apply_scenario(baseline, ScenarioInput(maintenance_cost=12.0))
    assert result.cost_impact == pytest.approx(
        0.12 * baseline["Maintenance Cost"])
    assert result.revenue_impact == pytest.approx(0.0)


def test_labour_plus_7(baseline):
    result = apply_scenario(baseline, ScenarioInput(labour_cost=7.0))
    assert result.cost_impact == pytest.approx(
        0.07 * baseline["Labour Cost"])


def test_yield_plus_5(baseline):
    result = apply_scenario(baseline, ScenarioInput(yield_pct=5.0))
    assert result.total_revenue == pytest.approx(
        baseline["Total Revenue"] + 0.05 * baseline["Passenger Revenue"])
    assert result.rask == pytest.approx(
        baseline["Passenger Revenue"] * 1.05 / baseline["ASM"])
    assert result.passengers == pytest.approx(baseline["Passengers"])


def test_input_bounds_are_clamped():
    inputs = ScenarioInput(fuel_price=500.0, cancellation=-500.0)
    warnings = inputs.validate()
    assert inputs.fuel_price == pytest.approx(100.0)
    assert inputs.cancellation == pytest.approx(-100.0)
    assert len(warnings) == 2


def test_preset_s001_end_to_end(model, workbook_data):
    definitions = load_scenario_definitions(workbook_data.frames["Scenarios"])
    s001 = next(d for d in definitions if d.scenario_id == "S001")
    assert s001.change_pct == pytest.approx(20.0)
    result = run_preset_scenario(model, s001, "2026-12-01", "2026-12-01")
    assert result.label.startswith("S001")
    assert result.is_simulated is True
    baseline = build_baseline(model, "2026-12-01", "2026-12-01")
    assert result.cost_impact == pytest.approx(0.20 * baseline["Fuel Cost"])


def test_all_presets_run(model, workbook_data):
    results = run_all_presets(model, workbook_data.frames["Scenarios"],
                              "2026-01-01", "2026-12-01")
    assert set(results) == {f"S00{i}" for i in range(1, 10)}
    assert all(r.is_simulated for r in results.values())
    # Demand upside raises revenue; demand downside lowers it.
    assert results["S002"].revenue_impact > 0
    assert results["S003"].revenue_impact < 0
    # Fuel shock and maintenance inflation raise cost.
    assert results["S001"].cost_impact > 0
    assert results["S005"].cost_impact > 0


def test_preset_to_input_mapping(workbook_data):
    definitions = load_scenario_definitions(workbook_data.frames["Scenarios"])
    by_id = {d.scenario_id: d for d in definitions}
    assert preset_to_input(by_id["S004"]).capacity == pytest.approx(8.0)
    assert preset_to_input(by_id["S007"]).yield_pct == pytest.approx(5.0)
    assert preset_to_input(by_id["S008"]).ancillary_revenue == \
        pytest.approx(10.0)
    assert preset_to_input(by_id["S009"]).cancellation == pytest.approx(15.0)
