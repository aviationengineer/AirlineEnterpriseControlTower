"""KPI tests: all 18 KPIs against hand-computed values from the workbook's
own first and last months, plus time-intelligence helpers."""

import pandas as pd
import pytest

from models.kpi_model import KPI_NAMES
from services.kpi_engine import (
    aggregate_kpis,
    calculate_aog_rate,
    calculate_aircraft_utilization,
    calculate_ancillary_revenue_per_passenger,
    calculate_baggage_mishandling_rate,
    calculate_cargo_yield,
    calculate_casm,
    calculate_d0,
    calculate_d15,
    calculate_data_product_adoption,
    calculate_dispatch_reliability,
    calculate_load_factor,
    calculate_maintenance_cost_per_flight_hour,
    calculate_operating_margin,
    calculate_rask,
    calculate_ticket_deflection_rate,
    calculate_yield,
    prior_month,
    prior_year_month,
    rolling_12m,
    ytd_range,
)


def _row(workbook_data, sheet, idx):
    return workbook_data.frames[sheet].iloc[idx]


def _expected(workbook_data, idx):
    """Hand-computed KPIs straight from the raw workbook rows."""
    fo = _row(workbook_data, "Flight_Operations", idx)
    mro = _row(workbook_data, "MRO_TechOps", idx)
    rev = _row(workbook_data, "Revenue_Management", idx)
    fin = _row(workbook_data, "Finance", idx)
    bag = _row(workbook_data, "Baggage", idx)
    cargo = _row(workbook_data, "Cargo", idx)
    anc = _row(workbook_data, "Ancillary_Revenue", idx)
    dp = _row(workbook_data, "Data_Platform", idx)
    ai = _row(workbook_data, "AI_Data_Products", idx)
    total = (rev["Passenger Revenue"] + rev["Cargo Revenue"]
             + rev["Ancillary Revenue"] + rev["Other Revenue"])
    return {
        "Load Factor": fo["RPM"] / fo["ASM"],
        "RASK": rev["Passenger Revenue"] / fo["ASM"],
        "CASM": fin["Operating Cost"] / fo["ASM"],
        "Yield": rev["Passenger Revenue"] / fo["RPM"],
        "D0": fo["On-Time Departures"] / fo["Departures"],
        "D15": fo["D15 Departures"] / fo["Departures"],
        "Aircraft Utilization": fo["Block Hours"] / fo["Active Aircraft"],
        "Dispatch Reliability": mro["Dispatch Reliability"],
        "Maintenance Cost / Flight Hour":
            mro["Maintenance Cost"] / fo["Block Hours"],
        "AOG Rate": mro["AOG Events"] / mro["Active Aircraft"],
        "Baggage Mishandling Rate":
            bag["Mishandled Bags"] / bag["Bags Handled"],
        "Cargo Yield": cargo["Cargo Revenue"] / cargo["Cargo Tonnes"],
        "Operating Margin": (total - fin["Operating Cost"]) / total,
        "Ancillary Revenue / Passenger":
            anc["Ancillary Revenue"] / anc["Passengers"],
        "Ticket Deflection Rate": dp["Ticket Deflection Rate"],
        "Data Quality": dp["Data Quality %"],
        "Platform Availability": dp["Platform Availability %"],
        "Data Product Adoption":
            ai["Active Data Products"] / ai["Registered Data Products"],
    }


@pytest.mark.parametrize("idx", [0, 59])
def test_all_18_kpis_first_and_last_month(model, workbook_data, idx):
    frame = model.kpi_calculated
    assert len(frame) == 60
    assert list(frame.columns[5:]) == KPI_NAMES
    computed = frame.iloc[idx]
    expected = _expected(workbook_data, idx)
    for kpi, value in expected.items():
        assert computed[kpi] == pytest.approx(value, rel=1e-9), kpi


def test_scalar_kpi_functions():
    assert calculate_load_factor(800, 1000) == pytest.approx(0.8)
    assert calculate_rask(145, 1000) == pytest.approx(0.145)
    assert calculate_casm(125, 1000) == pytest.approx(0.125)
    assert calculate_yield(175, 1000) == pytest.approx(0.175)
    assert calculate_d0(82, 100) == pytest.approx(0.82)
    assert calculate_d15(90, 100) == pytest.approx(0.90)
    assert calculate_aircraft_utilization(105, 10) == pytest.approx(10.5)
    assert calculate_dispatch_reliability(0.985) == pytest.approx(0.985)
    assert calculate_maintenance_cost_per_flight_hour(1350, 10) == \
        pytest.approx(135.0)
    assert calculate_aog_rate(16, 100) == pytest.approx(0.16)
    assert calculate_baggage_mishandling_rate(4, 1000) == pytest.approx(0.004)
    assert calculate_cargo_yield(8000, 10) == pytest.approx(800.0)
    assert calculate_operating_margin(1000, 880) == pytest.approx(0.12)
    assert calculate_ancillary_revenue_per_passenger(2400, 100) == \
        pytest.approx(24.0)
    assert calculate_ticket_deflection_rate(0.4) == pytest.approx(0.4)
    assert calculate_data_product_adoption(75, 100) == pytest.approx(0.75)
    # Zero denominators return None, never raise.
    assert calculate_load_factor(800, 0) is None
    assert calculate_rask(100, 0) is None
    assert calculate_operating_margin(0, 100) is None


def test_total_revenue_is_computed_not_sourced(model):
    frame = model.kpi_calculated
    assert frame["Total Revenue"].iloc[0] == pytest.approx(
        315538320 + 28213360 + 51813585 + 8087991)
    assert frame["Total Revenue"].iloc[-1] == pytest.approx(
        369740690 + 29507757 + 59315405 + 8538049)


def test_aggregate_kpis_recompute_from_sums(model):
    # 2026 full year: Load Factor from summed RPM/ASM, not averaged rates.
    agg = aggregate_kpis(model, "2026-01-01", "2026-12-01")
    fo = model.filter_period("flight_operations", "2026-01-01", "2026-12-01")
    assert agg["Load Factor"] == pytest.approx(
        fo["RPM"].sum() / fo["ASM"].sum())


def test_prior_month_and_prior_year(model):
    assert prior_month(model, "2026-12-01") == pd.Timestamp("2026-11-01")
    assert prior_year_month(model, "2026-12-01") == pd.Timestamp("2025-12-01")
    assert prior_month(model, "2022-01-01") is None
    assert prior_year_month(model, "2022-06-01") is None


def test_ytd_range_uses_the_given_year(model):
    start, end = ytd_range(model, "2024-06-01")
    assert start == pd.Timestamp("2024-01-01")
    assert end == pd.Timestamp("2024-06-01")


def test_rolling_12m(model):
    series = rolling_12m(model.domains["flight_operations"], "ASM")
    assert len(series) == 60
    assert series.iloc[11] == pytest.approx(
        model.domains["flight_operations"]["ASM"].iloc[:12].sum())
