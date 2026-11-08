"""Loader tests: workbook loads, missing file/sheet/column errors."""

import pandas as pd
import pytest

from data.loader import (
    MISSING_WORKBOOK_MESSAGE,
    MissingColumnError,
    MissingSheetError,
    WorkbookNotFoundError,
    load_workbook,
)
from tests.conftest import WORKBOOK


def test_workbook_loads_with_all_sheets(workbook_data):
    assert set(workbook_data.frames) >= {
        "Calendar", "Flight_Operations", "MRO_TechOps", "Crew_People",
        "Passenger_Commercial", "Revenue_Management", "Finance", "Baggage",
        "Cargo", "Airport_Ground", "Fuel", "Network_Routes",
        "Ancillary_Revenue", "Data_Platform", "AI_Data_Products",
        "Data_Governance", "KPI_Definitions", "KPI_Targets", "Scenarios",
        "Reference_Data", "Data_Quality", "KPI_Calculated",
    }
    assert len(workbook_data.frames["Flight_Operations"]) == 60
    assert len(workbook_data.frames["Network_Routes"]) == 480


def test_date_range_detected_dynamically(workbook_data):
    assert workbook_data.date_min == pd.Timestamp("2022-01-01")
    assert workbook_data.date_max == pd.Timestamp("2026-12-01")
    assert workbook_data.n_months == 60


def test_targets_read_from_workbook_not_hardcoded(workbook_data):
    targets = workbook_data.targets
    assert len(targets) == 18
    assert targets["Load Factor"] == pytest.approx(0.83)
    assert targets["RASK"] == pytest.approx(0.145)
    assert targets["Data Product Adoption"] == pytest.approx(0.75)


def test_scenarios_read_from_workbook(workbook_data):
    scenarios = workbook_data.frames["Scenarios"]
    assert len(scenarios) == 9
    assert list(scenarios["Scenario ID"]) == \
        [f"S00{i}" for i in range(1, 10)]
    s001 = scenarios[scenarios["Scenario ID"] == "S001"].iloc[0]
    assert s001["Variable"] == "Fuel Price"
    assert float(s001["Change %"]) == pytest.approx(20.0)


def test_missing_workbook_message_is_exact(tmp_path):
    missing = tmp_path / "no-such-workbook.xlsx"
    with pytest.raises(WorkbookNotFoundError) as exc:
        load_workbook(missing)
    assert str(exc.value) == MISSING_WORKBOOK_MESSAGE


def _write_subset(tmp_path, drop_sheet=None, drop_column=None):
    """Write a copy of the workbook minus one sheet / column."""
    source = load_workbook(WORKBOOK)
    out = tmp_path / "subset.xlsx"
    with pd.ExcelWriter(out, engine="openpyxl") as writer:
        for sheet, frame in source.frames.items():
            if sheet == drop_sheet:
                continue
            frame = frame.copy()
            if drop_column and sheet == "Flight_Operations":
                frame = frame.drop(columns=[drop_column])
            frame.to_excel(writer, sheet_name=sheet, index=False)
    return out


def test_missing_sheet_names_the_sheet(tmp_path):
    path = _write_subset(tmp_path, drop_sheet="Fuel")
    with pytest.raises(MissingSheetError) as exc:
        load_workbook(path)
    assert "Fuel" in str(exc.value)


def test_missing_column_names_sheet_and_column(tmp_path):
    path = _write_subset(tmp_path, drop_column="ASM")
    with pytest.raises(MissingColumnError) as exc:
        load_workbook(path)
    assert "Flight_Operations" in str(exc.value)
    assert "ASM" in str(exc.value)
