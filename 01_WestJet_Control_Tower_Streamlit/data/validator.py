"""data/validator.py — schema validation and DQ001-DQ008 checks.

Produces a ValidationReport (errors, warnings, data-quality score,
DATA STATUS Healthy / Warning / Critical). Validation errors are never
silently ignored: every failed check is recorded, and the report — not an
exception — is the carrier for data problems found after loading. Schema
problems that prevent loading at all are raised by data/loader.py instead.

Known quirks (flagged as warnings, never silently reconciled):
- Ancillary_Revenue Passengers differs slightly from Passenger_Commercial
  Passengers in the same month.
- MRO_TechOps Active Aircraft differs slightly from Flight_Operations
  Active Aircraft.
- Data_Governance Assets with Owner is far below Registered Data Assets
  (ownership coverage is low; this is a data fact, not a loader error).
Each KPI uses its documented Primary Source, so the quirks do not change
any KPI value.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

from data.loader import REQUIRED_SCHEMA

# Columns that must never be negative (counts, money, volumes, hours).
NON_NEGATIVE_COLUMNS: dict[str, list[str]] = {
    "Flight_Operations": ["Scheduled Flights", "Departures", "Cancellations",
                          "On-Time Departures", "D15 Departures", "ASM",
                          "RPM", "Block Hours", "Active Aircraft"],
    "MRO_TechOps": ["Active Aircraft", "Maintenance Events",
                    "Maintenance Hours", "Available Maintenance Hours",
                    "Aircraft Downtime Hours", "AOG Events", "MEL Items",
                    "Deferred Defects", "Parts Availability",
                    "Maintenance Cost"],
    "Crew_People": ["Headcount", "Training Compliant",
                    "Open Critical Vacancies"],
    "Passenger_Commercial": ["Bookings", "Passengers", "Cancelled Bookings"],
    "Revenue_Management": ["Passenger Revenue", "Cargo Revenue",
                           "Ancillary Revenue", "Other Revenue"],
    "Finance": ["Operating Cost", "Labour Cost", "Fuel Cost",
                "Other Operating Cost"],
    "Baggage": ["Bags Handled", "Mishandled Bags",
                "Bags Delivered Successfully"],
    "Cargo": ["Cargo Tonnes", "Cargo Shipments", "Cargo Revenue"],
    "Airport_Ground": ["Aircraft Turns", "Average Turnaround Minutes",
                       "Ground Incidents"],
    "Fuel": ["Fuel Price per Litre", "Fuel Volume Litres"],
    "Network_Routes": ["Flights", "Passengers", "Route Revenue",
                       "Route Cost"],
    "Ancillary_Revenue": ["Passengers", "Ancillary Revenue"],
    "Data_Platform": ["Active Self-Service Users", "Registered Users",
                      "Platform Tickets", "Average Freshness Minutes",
                      "Knowledge Base Uses", "Security Groups"],
    "AI_Data_Products": ["Registered Data Products", "Active Data Products",
                         "Estimated Business Value", "Critical Incidents"],
    "Data_Governance": ["Registered Data Assets", "Classified Assets",
                        "Assets with Owner", "Open Governance Exceptions"],
}

# Columns that are proportions and must lie in [0, 1].
PERCENT_COLUMNS: dict[str, list[str]] = {
    "MRO_TechOps": ["Dispatch Reliability", "Parts Availability"],
    "Crew_People": ["Voluntary Leave Rate"],
    "Passenger_Commercial": ["Corporate Retention", "Direct Channel Share",
                             "Advance Purchase Ratio"],
    "Airport_Ground": ["Ground OTP"],
    "Fuel": ["Hedged %"],
    "Ancillary_Revenue": ["Ancillary Attach Rate"],
    "Data_Platform": ["Ticket Deflection Rate", "Data Quality %",
                      "Platform Availability %"],
    "AI_Data_Products": ["Adoption Rate"],
    "Data_Governance": ["Governance Quality %"],
}


@dataclass
class ValidationIssue:
    rule_id: str  # e.g. "DQ002", "SCHEMA", "NULL", "DUPLICATE", "QUIRK"
    severity: str  # "Critical" / "High" / "Warning"
    sheet: str
    column: str
    message: str
    n_rows: int = 0


@dataclass
class ValidationReport:
    issues: list[ValidationIssue] = field(default_factory=list)
    n_checks: int = 0

    @property
    def errors(self) -> list[ValidationIssue]:
        return [i for i in self.issues if i.severity in ("Critical", "High")]

    @property
    def warnings(self) -> list[ValidationIssue]:
        return [i for i in self.issues if i.severity == "Warning"]

    @property
    def critical_errors(self) -> list[ValidationIssue]:
        return [i for i in self.issues if i.severity == "Critical"]

    @property
    def data_quality_score(self) -> float:
        """0-100. -15 per Critical, -5 per High, -1 per Warning."""
        score = 100.0
        score -= 15 * len(self.critical_errors)
        score -= 5 * len([i for i in self.issues if i.severity == "High"])
        score -= 1 * len(self.warnings)
        return max(0.0, round(score, 1))

    @property
    def data_status(self) -> str:
        """DATA STATUS: Healthy / Warning / Critical (brief section 18)."""
        if self.critical_errors:
            return "Critical"
        if self.errors or self.warnings:
            return "Warning"
        return "Healthy"

    def issues_for_rule(self, rule_id: str) -> list[ValidationIssue]:
        return [i for i in self.issues if i.rule_id == rule_id]

    def to_dict(self) -> dict:
        return {
            "data_status": self.data_status,
            "data_quality_score": self.data_quality_score,
            "n_errors": len(self.errors),
            "n_warnings": len(self.warnings),
            "n_checks": self.n_checks,
            "issues": [vars(i) for i in self.issues],
        }


def _is_monthly(sheet: str) -> bool:
    return sheet not in ("KPI_Definitions", "KPI_Targets", "Scenarios",
                         "Reference_Data", "Data_Quality", "KPI_Calculated")


def validate_schema(frames: dict[str, pd.DataFrame]) -> ValidationReport:
    """Required sheets/columns, types, nulls, duplicates (brief sec. 19)."""
    report = ValidationReport()
    for sheet, columns in REQUIRED_SCHEMA.items():
        report.n_checks += 1
        if sheet not in frames:
            report.issues.append(ValidationIssue(
                "SCHEMA", "Critical", sheet, "",
                f"Missing sheet: {sheet}"))
            continue
        frame = frames[sheet]
        for col in columns:
            report.n_checks += 1
            if col not in frame.columns:
                report.issues.append(ValidationIssue(
                    "SCHEMA", "Critical", sheet, col,
                    f"Sheet: {sheet} / Missing column: {col}"))
        if frame is None or len(frame) == 0:
            # KPI_Calculated is legitimately empty (header only); the
            # Calendar and domain sheets must not be.
            if sheet != "KPI_Calculated":
                report.issues.append(ValidationIssue(
                    "SCHEMA", "Critical", sheet, "",
                    f"Sheet: {sheet} has no data rows."))
            continue
        # Nulls in required columns.
        for col in columns:
            if col in frame.columns and frame[col].isna().any():
                n = int(frame[col].isna().sum())
                report.issues.append(ValidationIssue(
                    "NULL", "High", sheet, col,
                    f"{n} null value(s) in {sheet}.{col}", n))
        # Duplicate months / duplicate route-month records.
        # Network_Routes is route-month grain (several routes per month),
        # so Month alone legitimately repeats there; only Month+Route
        # duplicates count.
        if _is_monthly(sheet) and "Month" in frame.columns \
                and sheet != "Network_Routes":
            dup = int(frame.duplicated(subset=["Month"]).sum())
            if dup:
                report.issues.append(ValidationIssue(
                    "DUPLICATE", "High", sheet, "Month",
                    f"{dup} duplicate month(s) in {sheet}", dup))
        if sheet == "Network_Routes":
            dup = int(frame.duplicated(subset=["Month", "Route"]).sum())
            if dup:
                report.issues.append(ValidationIssue(
                    "DUPLICATE", "High", sheet, "Route",
                    f"{dup} duplicate route-month record(s)", dup))
        # Non-numeric values in numeric columns. Only the monthly domain
        # sheets have numeric columns; the definition/reference sheets
        # (KPI_Definitions, KPI_Targets, Scenarios, Reference_Data,
        # Data_Quality) are text by design and are not type-checked here.
        if _is_monthly(sheet):
            for col in columns:
                if col in ("Month", "Route", "Month Name", "Quarter",
                           "Year-Month", "Period Type", "Rolling Period"):
                    continue
                if col in frame.columns and not pd.api.types.is_numeric_dtype(
                        frame[col]):
                    coerced = pd.to_numeric(frame[col], errors="coerce")
                    if coerced.isna().any():
                        report.issues.append(ValidationIssue(
                            "TYPE", "High", sheet, col,
                            f"Non-numeric value(s) in {sheet}.{col}"))
        # Negatives where invalid.
        for col in NON_NEGATIVE_COLUMNS.get(sheet, []):
            if col in frame.columns:
                bad = frame[col] < 0
                if bool(bad.any()):
                    report.issues.append(ValidationIssue(
                        "NEGATIVE", "High", sheet, col,
                        f"{int(bad.sum())} negative value(s) in "
                        f"{sheet}.{col}", int(bad.sum())))
        # Percentages in [0, 1].
        for col in PERCENT_COLUMNS.get(sheet, []):
            if col in frame.columns:
                bad = (frame[col] < 0) | (frame[col] > 1)
                if bool(bad.any()):
                    report.issues.append(ValidationIssue(
                        "RANGE", "High", sheet, col,
                        f"{int(bad.sum())} value(s) outside 0-1 in "
                        f"{sheet}.{col}", int(bad.sum())))
    return report


def validate_data_quality(frames: dict[str, pd.DataFrame],
                          date_min: pd.Timestamp | None = None,
                          date_max: pd.Timestamp | None = None
                          ) -> ValidationReport:
    """DQ001-DQ008 plus the brief section 19 cross-field rules."""
    report = ValidationReport()

    def add(rule, severity, sheet, col, msg, n=0):
        report.issues.append(ValidationIssue(
            rule, severity, sheet, col, msg, n))

    # DQ001 — Month populated and within the detected range (Critical).
    # The range is detected from the Calendar sheet, never hard-coded, so
    # 2-5 years of data are all valid.
    monthly = {s: f for s, f in frames.items() if _is_monthly(s)}
    cal = frames.get("Calendar")
    if cal is not None and len(cal):
        lo, hi = cal["Month"].min(), cal["Month"].max()
    else:
        lo = hi = None
    for sheet, frame in monthly.items():
        report.n_checks += 1
        if "Month" not in frame.columns:
            continue
        nulls = int(frame["Month"].isna().sum())
        if nulls:
            add("DQ001", "Critical", sheet, "Month",
                f"{nulls} month(s) not populated in {sheet}", nulls)
        if lo is not None:
            out = frame["Month"].dropna()
            bad = int(((out < lo) | (out > hi)).sum())
            if bad:
                add("DQ001", "Critical", sheet, "Month",
                    f"{bad} month(s) outside {lo:%Y-%m} to {hi:%Y-%m} "
                    f"in {sheet}", bad)

    fo = frames.get("Flight_Operations")
    if fo is not None and len(fo):
        # DQ002 — ASM >= RPM (Critical).
        bad = fo["ASM"] < fo["RPM"]
        report.n_checks += 1
        if bool(bad.any()):
            add("DQ002", "Critical", "Flight_Operations", "ASM",
                f"{int(bad.sum())} month(s) where ASM < RPM",
                int(bad.sum()))
        # DQ003 — Departures <= Scheduled Flights (High).
        bad = fo["Departures"] > fo["Scheduled Flights"]
        report.n_checks += 1
        if bool(bad.any()):
            add("DQ003", "High", "Flight_Operations", "Departures",
                f"{int(bad.sum())} month(s) where Departures exceed "
                "Scheduled Flights", int(bad.sum()))

    pc = frames.get("Passenger_Commercial")
    if pc is not None and len(pc):
        # DQ004 — Cancelled Bookings <= Bookings (High).
        bad = pc["Cancelled Bookings"] > pc["Bookings"]
        report.n_checks += 1
        if bool(bad.any()):
            add("DQ004", "High", "Passenger_Commercial",
                "Cancelled Bookings",
                f"{int(bad.sum())} month(s) where Cancelled Bookings "
                "exceed Bookings", int(bad.sum()))

    mro = frames.get("MRO_TechOps")
    if mro is not None and len(mro):
        # DQ005 — Dispatch Reliability 0-1 (High).
        bad = (mro["Dispatch Reliability"] < 0) | \
              (mro["Dispatch Reliability"] > 1)
        report.n_checks += 1
        if bool(bad.any()):
            add("DQ005", "High", "MRO_TechOps", "Dispatch Reliability",
                f"{int(bad.sum())} month(s) where Dispatch Reliability "
                "is outside 0-1", int(bad.sum()))

    dp = frames.get("Data_Platform")
    if dp is not None and len(dp):
        # DQ006 — Data Quality % 0-1 (High).
        bad = (dp["Data Quality %"] < 0) | (dp["Data Quality %"] > 1)
        report.n_checks += 1
        if bool(bad.any()):
            add("DQ006", "High", "Data_Platform", "Data Quality %",
                f"{int(bad.sum())} month(s) where Data Quality % is "
                "outside 0-1", int(bad.sum()))
        # DQ007 — Platform Availability % 0-1 (High).
        bad = (dp["Platform Availability %"] < 0) | \
              (dp["Platform Availability %"] > 1)
        report.n_checks += 1
        if bool(bad.any()):
            add("DQ007", "High", "Data_Platform", "Platform Availability %",
                f"{int(bad.sum())} month(s) where Platform Availability % "
                "is outside 0-1", int(bad.sum()))

    gov = frames.get("Data_Governance")
    if gov is not None and len(gov):
        # DQ008 — Classified Assets <= Registered Data Assets (High).
        bad = gov["Classified Assets"] > gov["Registered Data Assets"]
        report.n_checks += 1
        if bool(bad.any()):
            add("DQ008", "High", "Data_Governance", "Classified Assets",
                f"{int(bad.sum())} month(s) where Classified Assets "
                "exceed Registered Data Assets", int(bad.sum()))

    # Brief section 19 — Active Products <= Registered Products (High).
    ai = frames.get("AI_Data_Products")
    if ai is not None and len(ai):
        bad = ai["Active Data Products"] > ai["Registered Data Products"]
        report.n_checks += 1
        if bool(bad.any()):
            add("DQ009", "High", "AI_Data_Products", "Active Data Products",
                f"{int(bad.sum())} month(s) where Active Data Products "
                "exceed Registered Data Products", int(bad.sum()))

    _flag_quirks(frames, report)
    return report


def _flag_quirks(frames: dict[str, pd.DataFrame],
                 report: ValidationReport) -> None:
    """Flag the three known cross-sheet quirks as warnings (never fix them).

    The KPI engine uses each KPI's Primary Source, so these differences do
    not change any KPI value; they are reported so nobody reconciles them
    silently.
    """
    # Quirk 1: Ancillary_Revenue Passengers vs Passenger_Commercial.
    an = frames.get("Ancillary_Revenue")
    pc = frames.get("Passenger_Commercial")
    if an is not None and pc is not None and len(an) and len(pc):
        merged = pd.merge(an[["Month", "Passengers"]],
                          pc[["Month", "Passengers"]],
                          on="Month", suffixes=("_anc", "_pax"))
        diff = (merged["Passengers_anc"] - merged["Passengers_pax"]).abs()
        n = int((diff > 0).sum())
        if n:
            report.issues.append(ValidationIssue(
                "QUIRK", "Warning", "Ancillary_Revenue", "Passengers",
                f"Ancillary_Revenue Passengers differs from "
                f"Passenger_Commercial Passengers in {n} month(s) "
                f"(max difference {int(diff.max()):,}); KPI uses the "
                f"Ancillary_Revenue source per KPI_Definitions.", n))
    # Quirk 2: MRO Active Aircraft vs Flight Operations Active Aircraft.
    mro = frames.get("MRO_TechOps")
    fo = frames.get("Flight_Operations")
    if mro is not None and fo is not None and len(mro) and len(fo):
        merged = pd.merge(mro[["Month", "Active Aircraft"]],
                          fo[["Month", "Active Aircraft"]],
                          on="Month", suffixes=("_mro", "_fo"))
        diff = (merged["Active Aircraft_mro"]
                - merged["Active Aircraft_fo"]).abs()
        n = int((diff > 0).sum())
        if n:
            report.issues.append(ValidationIssue(
                "QUIRK", "Warning", "MRO_TechOps", "Active Aircraft",
                f"MRO_TechOps Active Aircraft differs from "
                f"Flight_Operations Active Aircraft in {n} month(s) "
                f"(max difference {int(diff.max())}); each KPI uses its "
                f"own Primary Source.", n))
    # Quirk 3: Assets with Owner far below Registered Data Assets.
    gov = frames.get("Data_Governance")
    if gov is not None and len(gov):
        ratio = (gov["Assets with Owner"]
                 / gov["Registered Data Assets"]).mean()
        if ratio < 0.5:
            report.issues.append(ValidationIssue(
                "QUIRK", "Warning", "Data_Governance", "Assets with Owner",
                f"Assets with Owner averages only {ratio:.1%} of "
                f"Registered Data Assets (ownership coverage is low); "
                f"reported as-is, not reconciled.", len(gov)))
    # Two further cross-sheet differences of the same pattern, found while
    # building the KPI engine (not in the original three-quirks brief, but
    # flagged the same way, never reconciled):
    # Quirk 4: Ancillary_Revenue Ancillary Revenue vs Revenue_Management.
    rev = frames.get("Revenue_Management")
    if an is not None and rev is not None and len(an) and len(rev):
        merged = pd.merge(an[["Month", "Ancillary Revenue"]],
                          rev[["Month", "Ancillary Revenue"]],
                          on="Month", suffixes=("_anc", "_rev"))
        diff = (merged["Ancillary Revenue_anc"]
                - merged["Ancillary Revenue_rev"]).abs()
        n = int((diff > 0).sum())
        if n:
            report.issues.append(ValidationIssue(
                "QUIRK", "Warning", "Ancillary_Revenue",
                "Ancillary Revenue",
                f"Ancillary_Revenue Ancillary Revenue differs from "
                f"Revenue_Management Ancillary Revenue in {n} month(s) "
                f"(max difference ${int(diff.max()):,}); Total Revenue "
                f"uses Revenue_Management, Ancillary Revenue / Passenger "
                f"uses Ancillary_Revenue, per KPI_Definitions.", n))
    # Quirk 5: Cargo Cargo Revenue vs Revenue_Management Cargo Revenue.
    cargo = frames.get("Cargo")
    if cargo is not None and rev is not None and len(cargo) and len(rev):
        merged = pd.merge(cargo[["Month", "Cargo Revenue"]],
                          rev[["Month", "Cargo Revenue"]],
                          on="Month", suffixes=("_cargo", "_rev"))
        diff = (merged["Cargo Revenue_cargo"]
                - merged["Cargo Revenue_rev"]).abs()
        n = int((diff > 0).sum())
        if n:
            report.issues.append(ValidationIssue(
                "QUIRK", "Warning", "Cargo", "Cargo Revenue",
                f"Cargo Cargo Revenue differs from Revenue_Management "
                f"Cargo Revenue in {n} month(s) (max difference "
                f"${int(diff.max()):,}); Total Revenue uses "
                f"Revenue_Management, Cargo Yield uses Cargo, per "
                f"KPI_Definitions.", n))


def validate_all(frames: dict[str, pd.DataFrame]) -> ValidationReport:
    """Run schema validation and DQ001-DQ008 and merge the reports."""
    schema = validate_schema(frames)
    dq = validate_data_quality(frames)
    merged = ValidationReport(
        issues=schema.issues + dq.issues,
        n_checks=schema.n_checks + dq.n_checks,
    )
    return merged
