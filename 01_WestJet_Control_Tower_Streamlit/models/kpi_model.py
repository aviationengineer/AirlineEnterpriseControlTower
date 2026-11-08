"""models/kpi_model.py — KPI definitions, targets and formatting.

KPI definitions and targets are read from the workbook's KPI_Definitions
and KPI_Targets sheets at load time (see data/loader.py). Nothing in this
module hard-codes a KPI value or a target: the constants below are only the
canonical list of the 18 KPI names and their display formats, which mirror
the workbook's KPI_Definitions sheet.
"""

from __future__ import annotations

from dataclasses import dataclass

# The 18 KPIs, in workbook KPI_Definitions order.
KPI_NAMES: list[str] = [
    "Load Factor", "RASK", "CASM", "Yield", "D0", "D15",
    "Aircraft Utilization", "Dispatch Reliability",
    "Maintenance Cost / Flight Hour", "AOG Rate",
    "Baggage Mishandling Rate", "Cargo Yield", "Operating Margin",
    "Ancillary Revenue / Passenger", "Ticket Deflection Rate",
    "Data Quality", "Platform Availability", "Data Product Adoption",
]

KPI_FORMATS: dict[str, str] = {
    "Load Factor": "pct", "RASK": "currency", "CASM": "currency",
    "Yield": "currency", "D0": "pct", "D15": "pct",
    "Aircraft Utilization": "number", "Dispatch Reliability": "pct",
    "Maintenance Cost / Flight Hour": "currency", "AOG Rate": "number",
    "Baggage Mishandling Rate": "pct", "Cargo Yield": "currency",
    "Operating Margin": "pct", "Ancillary Revenue / Passenger": "currency",
    "Ticket Deflection Rate": "pct", "Data Quality": "pct",
    "Platform Availability": "pct", "Data Product Adoption": "pct",
}

# Lower is better for these four; higher is better for the rest.
LOWER_IS_BETTER: frozenset[str] = frozenset({
    "CASM", "Maintenance Cost / Flight Hour", "AOG Rate",
    "Baggage Mishandling Rate",
})


@dataclass(frozen=True)
class KpiDefinition:
    """One row of the workbook's KPI_Definitions sheet."""

    name: str
    domain: str
    formula: str
    unit: str
    direction: str
    primary_source: str


@dataclass
class KpiValue:
    """A computed KPI value for one month (or one aggregated period)."""

    kpi: str
    value: float | None
    month: str | None = None
    target: float | None = None
    status: str | None = None

    @property
    def variance_to_target(self) -> float | None:
        if self.value is None or self.target in (None, 0):
            return None
        return (self.value - self.target) / abs(self.target)


def load_kpi_definitions(frame) -> list[KpiDefinition]:
    """Build KpiDefinition objects from the KPI_Definitions sheet frame."""
    return [KpiDefinition(
        name=str(row["KPI"]), domain=str(row["Domain"]),
        formula=str(row["Formula / Logic"]), unit=str(row["Unit"]),
        direction=str(row["Direction"]),
        primary_source=str(row["Primary Source"]),
    ) for _, row in frame.iterrows()]


def load_targets(frame) -> dict[str, float]:
    """Build the KPI -> target mapping from the KPI_Targets sheet frame."""
    return {str(row["KPI"]): float(row["Target"])
            for _, row in frame.iterrows()}


def kpi_status(kpi: str, value: float | None, target: float | None) -> str | None:
    """On/Above/Below target, honouring the KPI's direction."""
    if value is None or target is None:
        return None
    if kpi in LOWER_IS_BETTER:
        return "On Target" if value <= target else "Above Target"
    return "On Target" if value >= target else "Below Target"


def format_kpi(kpi: str, value: float | None) -> str:
    """Format a KPI value for display (en-GB)."""
    if value is None:
        return "n/a"
    fmt = KPI_FORMATS.get(kpi, "number")
    if fmt == "pct":
        return f"{value:.2%}"
    if fmt == "currency":
        return f"${value:,.2f}"
    return f"{value:,.2f}"
