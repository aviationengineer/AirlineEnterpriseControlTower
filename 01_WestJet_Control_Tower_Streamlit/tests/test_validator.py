"""Validator tests: schema checks and every DQ rule, incl. failing cases."""

import copy

import pandas as pd

from data.validator import validate_all, validate_data_quality, validate_schema


def _mutated(workbook_data, sheet, column, row_idx, value):
    frames = {k: v.copy() for k, v in workbook_data.frames.items()}
    frames[sheet].loc[row_idx, column] = value
    return frames


def test_real_workbook_passes_dq_rules(workbook_data):
    report = validate_data_quality(workbook_data.frames)
    for rule in ["DQ001", "DQ002", "DQ003", "DQ004", "DQ005", "DQ006",
                 "DQ007", "DQ008"]:
        assert report.issues_for_rule(rule) == [], rule


def test_real_workbook_flags_the_three_quirks(workbook_data):
    report = validate_all(workbook_data.frames)
    quirks = report.issues_for_rule("QUIRK")
    # The three briefed quirks, plus two more of the same pattern found
    # while building the KPI engine (ancillary and cargo revenue).
    assert len(quirks) == 5
    text = " ".join(i.message for i in quirks)
    assert "Ancillary_Revenue Passengers differs" in text
    assert "MRO_TechOps Active Aircraft differs" in text
    assert "Assets with Owner averages only" in text
    assert "Ancillary_Revenue Ancillary Revenue differs" in text
    assert "Cargo Cargo Revenue differs" in text
    assert report.data_status == "Warning"


def test_dq001_month_out_of_range(workbook_data):
    frames = _mutated(workbook_data, "Flight_Operations", "Month", 0,
                      pd.Timestamp("2031-01-01"))
    report = validate_data_quality(frames)
    assert report.issues_for_rule("DQ001")
    assert report.data_status == "Critical"


def test_dq002_asm_below_rpm(workbook_data):
    frames = _mutated(workbook_data, "Flight_Operations", "ASM", 0, 1)
    report = validate_data_quality(frames)
    issues = report.issues_for_rule("DQ002")
    assert len(issues) == 1 and issues[0].severity == "Critical"


def test_dq003_departures_above_scheduled(workbook_data):
    frames = _mutated(workbook_data, "Flight_Operations", "Departures", 0,
                      999999)
    assert validate_data_quality(frames).issues_for_rule("DQ003")


def test_dq004_cancelled_bookings_above_bookings(workbook_data):
    frames = _mutated(workbook_data, "Passenger_Commercial",
                      "Cancelled Bookings", 0, 9999999)
    assert validate_data_quality(frames).issues_for_rule("DQ004")


def test_dq005_dispatch_reliability_out_of_range(workbook_data):
    frames = _mutated(workbook_data, "MRO_TechOps",
                      "Dispatch Reliability", 0, 1.5)
    assert validate_data_quality(frames).issues_for_rule("DQ005")


def test_dq006_data_quality_out_of_range(workbook_data):
    frames = _mutated(workbook_data, "Data_Platform", "Data Quality %", 0,
                      1.5)
    assert validate_data_quality(frames).issues_for_rule("DQ006")


def test_dq007_platform_availability_out_of_range(workbook_data):
    frames = _mutated(workbook_data, "Data_Platform",
                      "Platform Availability %", 0, -0.1)
    assert validate_data_quality(frames).issues_for_rule("DQ007")


def test_dq008_classified_above_registered(workbook_data):
    frames = _mutated(workbook_data, "Data_Governance",
                      "Classified Assets", 0, 999999)
    assert validate_data_quality(frames).issues_for_rule("DQ008")


def test_schema_missing_column_reported(workbook_data):
    frames = {k: v.copy() for k, v in workbook_data.frames.items()}
    frames["Flight_Operations"] = frames["Flight_Operations"].drop(
        columns=["ASM"])
    report = validate_schema(frames)
    assert any(i.column == "ASM" and "Flight_Operations" in i.message
               for i in report.issues)


def test_schema_duplicate_month_reported(workbook_data):
    frames = {k: v.copy() for k, v in workbook_data.frames.items()}
    frames["Flight_Operations"] = pd.concat(
        [frames["Flight_Operations"],
         frames["Flight_Operations"].iloc[[0]]], ignore_index=True)
    report = validate_schema(frames)
    assert any(i.rule_id == "DUPLICATE" for i in report.issues)


def test_schema_null_reported(workbook_data):
    frames = _mutated(workbook_data, "Finance", "Operating Cost", 0, None)
    report = validate_schema(frames)
    assert any(i.rule_id == "NULL" and i.column == "Operating Cost"
               for i in report.issues)


def test_active_products_above_registered_reported(workbook_data):
    frames = _mutated(workbook_data, "AI_Data_Products",
                      "Active Data Products", 0, 9999)
    assert validate_data_quality(frames).issues_for_rule("DQ009")
