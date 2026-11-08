"""data/loader.py — load the input workbook into typed raw frames.

Architecture: Excel Workbook -> loader -> validator -> transformer ->
canonical aviation data model -> KPI engine -> scenario engine.

The workbook is the ONLY data source. Sheet/column names below were read
from the supplied workbook (WestJet_Enterprise_Control_Tower_Input_Template.xlsx,
23 sheets, monthly data Jan 2022-Dec 2026); they are schema identifiers, not
hard-coded values. KPI targets, scenario changes and KPI definitions are read
from the workbook at load time, never hard-coded here. The date range is
detected dynamically from the Calendar sheet, so 2-5 years of monthly data
work without code changes.

Error messages follow COORDINATOR_BRIEF.md section 20 exactly.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

WORKBOOK_FILENAME = "WestJet_Enterprise_Control_Tower_Input_Template.xlsx"
MISSING_WORKBOOK_MESSAGE = (
    "Input workbook not found. Please upload: "
    "WestJet_Enterprise_Control_Tower_Input_Template.xlsx"
)

# Required schema: sheet -> required columns, read from the supplied workbook.
REQUIRED_SCHEMA: dict[str, list[str]] = {
    "Calendar": ["Month", "Year", "Month Name", "Month Number", "Quarter",
                 "Year-Month", "Period Type", "Rolling Period"],
    "Flight_Operations": ["Month", "Scheduled Flights", "Departures",
                          "Cancellations", "On-Time Departures",
                          "D15 Departures", "ASM", "RPM", "Block Hours",
                          "Active Aircraft"],
    "MRO_TechOps": ["Month", "Active Aircraft", "Maintenance Events",
                    "Maintenance Hours", "Available Maintenance Hours",
                    "Aircraft Downtime Hours", "Dispatch Reliability",
                    "AOG Events", "MEL Items", "Deferred Defects",
                    "Parts Availability", "Maintenance Cost"],
    "Crew_People": ["Month", "Headcount", "Training Compliant",
                    "Open Critical Vacancies", "Voluntary Leave Rate",
                    "Sentiment Index"],
    "Passenger_Commercial": ["Month", "Bookings", "Passengers",
                             "Cancelled Bookings", "Corporate Retention",
                             "Direct Channel Share", "Advance Purchase Ratio",
                             "NPS"],
    "Revenue_Management": ["Month", "Passenger Revenue", "Cargo Revenue",
                           "Ancillary Revenue", "Other Revenue"],
    "Finance": ["Month", "Operating Cost", "Labour Cost", "Fuel Cost",
                "Other Operating Cost", "Cash Position"],
    "Baggage": ["Month", "Bags Handled", "Mishandled Bags",
                "Bags Delivered Successfully"],
    "Cargo": ["Month", "Cargo Tonnes", "Cargo Shipments", "Cargo Revenue"],
    "Airport_Ground": ["Month", "Aircraft Turns",
                       "Average Turnaround Minutes", "Ground OTP",
                       "Ground Incidents"],
    "Fuel": ["Month", "Fuel Price per Litre", "Fuel Volume Litres",
             "Hedged %"],
    "Network_Routes": ["Month", "Route", "Flights", "Passengers",
                       "Route Revenue", "Route Cost"],
    "Ancillary_Revenue": ["Month", "Passengers", "Ancillary Revenue",
                          "Ancillary Attach Rate",
                          "Ancillary Revenue per Passenger"],
    "Data_Platform": ["Month", "Active Self-Service Users",
                      "Registered Users", "Platform Tickets",
                      "Ticket Deflection Rate", "Data Quality %",
                      "Platform Availability %",
                      "Average Freshness Minutes", "Knowledge Base Uses",
                      "Security Groups"],
    "AI_Data_Products": ["Month", "Registered Data Products",
                         "Active Data Products", "Adoption Rate",
                         "Estimated Business Value", "Critical Incidents"],
    "Data_Governance": ["Month", "Registered Data Assets",
                        "Classified Assets", "Assets with Owner",
                        "Governance Quality %",
                        "Open Governance Exceptions"],
    "KPI_Definitions": ["KPI", "Domain", "Formula / Logic", "Unit",
                        "Direction", "Primary Source"],
    "KPI_Targets": ["KPI", "Target", "Target Type", "Notes"],
    "Scenarios": ["Scenario ID", "Scenario Name", "Variable", "Change %",
                  "Description", "Primary KPI Impact"],
    "Reference_Data": ["Domain", "Code", "Description"],
    "Data_Quality": ["Rule ID", "Table", "Column", "Rule", "Severity"],
    # KPI_Calculated is an OUTPUT sheet: header only, 0 data rows in the
    # supplied workbook. The app computes these values; an empty sheet is
    # NOT an error. Its columns are validated only if rows exist.
    "KPI_Calculated": ["Month", "Total Revenue", "ASM", "RPM",
                       "Operating Cost", "Load Factor", "RASK", "CASM",
                       "Yield", "Operating Margin", "Aircraft Utilization",
                       "Maintenance Cost / Flight Hour", "AOG Rate",
                       "Baggage Mishandling Rate", "Cargo Yield",
                       "Ancillary Revenue / Passenger",
                       "Data Product Adoption"],
}

MONTHLY_SHEETS = [s for s in REQUIRED_SCHEMA
                  if s not in ("KPI_Definitions", "KPI_Targets", "Scenarios",
                               "Reference_Data", "Data_Quality",
                               "KPI_Calculated", "Calendar")]

DEFAULT_WORKBOOK_PATH = (
    Path(__file__).resolve().parent / WORKBOOK_FILENAME
)


class WorkbookNotFoundError(FileNotFoundError):
    """Raised when the input workbook cannot be found."""


class MissingSheetError(ValueError):
    """Raised when a required sheet is absent from the workbook."""


class MissingColumnError(ValueError):
    """Raised when a required column is absent from a sheet."""


@dataclass
class WorkbookData:
    """All frames loaded from the workbook, plus derived metadata."""

    frames: dict[str, pd.DataFrame] = field(default_factory=dict)
    path: str = ""
    date_min: pd.Timestamp | None = None
    date_max: pd.Timestamp | None = None
    n_months: int = 0

    def __getitem__(self, sheet: str) -> pd.DataFrame:
        return self.frames[sheet]

    @property
    def targets(self) -> dict[str, float]:
        """KPI targets read from the KPI_Targets sheet at load time."""
        frame = self.frames["KPI_Targets"]
        return {str(row["KPI"]): float(row["Target"])
                for _, row in frame.iterrows()}

    @property
    def scenarios(self) -> pd.DataFrame:
        return self.frames["Scenarios"]

    @property
    def kpi_definitions(self) -> pd.DataFrame:
        return self.frames["KPI_Definitions"]


def _check_sheet_columns(sheet: str, frame: pd.DataFrame) -> None:
    missing = [c for c in REQUIRED_SCHEMA[sheet] if c not in frame.columns]
    if missing:
        # Brief section 20 format, naming the sheet and the column.
        raise MissingColumnError(
            f"Sheet: {sheet} / Missing column: {missing[0]}"
            + (f" (also missing: {', '.join(missing[1:])})"
               if len(missing) > 1 else "")
        )


def load_workbook(path: str | os.PathLike | None = None) -> WorkbookData:
    """Load every required sheet of the workbook into raw frames.

    Raises WorkbookNotFoundError with the exact user-facing message from
    brief section 20 when the file is missing, MissingSheetError naming the
    sheet, and MissingColumnError naming sheet and column.
    """
    resolved = Path(path) if path is not None else DEFAULT_WORKBOOK_PATH
    if not resolved.exists():
        raise WorkbookNotFoundError(MISSING_WORKBOOK_MESSAGE)

    xls = pd.ExcelFile(resolved)
    present = set(xls.sheet_names)
    for sheet in REQUIRED_SCHEMA:
        if sheet not in present:
            raise MissingSheetError(f"Missing sheet: {sheet}")

    frames: dict[str, pd.DataFrame] = {}
    for sheet in REQUIRED_SCHEMA:
        frame = pd.read_excel(xls, sheet_name=sheet)
        _check_sheet_columns(sheet, frame)
        frames[sheet] = frame

    for sheet in MONTHLY_SHEETS + ["Calendar"]:
        frames[sheet]["Month"] = pd.to_datetime(frames[sheet]["Month"])

    calendar = frames["Calendar"]
    months = calendar["Month"].dropna().sort_values()
    return WorkbookData(
        frames=frames,
        path=str(resolved),
        date_min=months.iloc[0] if len(months) else None,
        date_max=months.iloc[-1] if len(months) else None,
        n_months=int(len(months)),
    )


def detect_date_range(data: WorkbookData) -> tuple[pd.Timestamp, pd.Timestamp]:
    """Return (first month, last month) detected from the loaded Calendar."""
    if data.date_min is None or data.date_max is None:
        raise ValueError("No months found in the Calendar sheet.")
    return data.date_min, data.date_max
