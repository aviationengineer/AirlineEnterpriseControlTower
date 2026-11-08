"""models/scenario_model.py — scenario inputs, definitions and results.

Preset scenarios are read from the workbook's Scenarios sheet at load time
(S001-S009); interactive input bounds come from brief section 12 (proposed,
not workbook-derived): default 0% for every input, min -50% / max +50%,
except fuel price -30% / +100% and cancellation -100% / +100%.
Every scenario output is labelled simulated.
"""

from __future__ import annotations

from dataclasses import dataclass, field

# Input field -> (minimum %, maximum %) per brief section 12.
INPUT_BOUNDS: dict[str, tuple[float, float]] = {
    "passenger_demand": (-50.0, 50.0),
    "yield_pct": (-50.0, 50.0),
    "load_factor": (-50.0, 50.0),
    "capacity": (-50.0, 50.0),
    "flights": (-50.0, 50.0),
    "aircraft_utilisation": (-50.0, 50.0),
    "fuel_price": (-30.0, 100.0),
    "fuel_volume": (-50.0, 50.0),
    "maintenance_cost": (-50.0, 50.0),
    "aircraft_availability": (-50.0, 50.0),
    "labour_cost": (-50.0, 50.0),
    "headcount": (-50.0, 50.0),
    "cancellation": (-100.0, 100.0),
    "d0": (-50.0, 50.0),
    "d15": (-50.0, 50.0),
    "cargo_demand": (-50.0, 50.0),
    "cargo_yield": (-50.0, 50.0),
    "ancillary_revenue": (-50.0, 50.0),
    "fx": (-50.0, 50.0),
}

# Workbook Scenarios sheet "Variable" -> ScenarioInput field.
PRESET_VARIABLE_MAP: dict[str, str] = {
    "Fuel Price": "fuel_price",
    "Passenger Demand": "passenger_demand",
    "Capacity": "capacity",
    "Maintenance Cost": "maintenance_cost",
    "Labour Cost": "labour_cost",
    "Yield": "yield_pct",
    "Ancillary Revenue": "ancillary_revenue",
    "Flight Cancellations": "cancellation",
}


@dataclass
class ScenarioDefinition:
    """One row of the workbook's Scenarios sheet (a preset scenario)."""

    scenario_id: str
    name: str
    variable: str
    change_pct: float
    description: str
    primary_kpi_impact: str


@dataclass
class ScenarioInput:
    """Interactive simulator inputs, all as percentages (e.g. 20 = +20%).

    Defaults are 0% for every input (brief section 12). Values are clamped
    to INPUT_BOUNDS by validate().
    """

    passenger_demand: float = 0.0
    yield_pct: float = 0.0
    load_factor: float = 0.0
    capacity: float = 0.0
    flights: float = 0.0
    aircraft_utilisation: float = 0.0
    fuel_price: float = 0.0
    fuel_volume: float = 0.0
    maintenance_cost: float = 0.0
    aircraft_availability: float = 0.0
    labour_cost: float = 0.0
    headcount: float = 0.0
    cancellation: float = 0.0
    d0: float = 0.0
    d15: float = 0.0
    cargo_demand: float = 0.0
    cargo_yield: float = 0.0
    ancillary_revenue: float = 0.0
    fx: float = 0.0
    label: str = "Interactive scenario"

    def validate(self) -> list[str]:
        """Clamp out-of-range inputs to their bounds; return warnings."""
        warnings: list[str] = []
        for fname, (lo, hi) in INPUT_BOUNDS.items():
            value = getattr(self, fname)
            if value < lo:
                warnings.append(f"{fname} clamped from {value}% to {lo}%")
                setattr(self, fname, lo)
            elif value > hi:
                warnings.append(f"{fname} clamped from {value}% to {hi}%")
                setattr(self, fname, hi)
        return warnings

    def changed_variables(self) -> dict[str, float]:
        """Only the inputs that differ from the 0% default."""
        return {f: getattr(self, f) for f in INPUT_BOUNDS
                if getattr(self, f) != 0.0}


@dataclass
class ScenarioResult:
    """Simulated outcomes for one scenario applied to a baseline period.

    All values are SIMULATED — never present them as actual performance.
    """

    label: str
    is_simulated: bool = True
    total_revenue: float | None = None
    operating_cost: float | None = None
    operating_margin: float | None = None
    rask: float | None = None
    cask: float | None = None
    load_factor: float | None = None
    cash_position: float | None = None
    ebit_style: float | None = None  # Total Revenue - Operating Cost
    passengers: float | None = None
    asm: float | None = None
    revenue_impact: float | None = None
    cost_impact: float | None = None
    margin_impact_pp: float | None = None
    cash_impact: float | None = None
    assumptions: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "label": self.label, "is_simulated": True,
            "total_revenue": self.total_revenue,
            "operating_cost": self.operating_cost,
            "operating_margin": self.operating_margin,
            "rask": self.rask, "cask": self.cask,
            "load_factor": self.load_factor,
            "cash_position": self.cash_position,
            "ebit_style": self.ebit_style,
            "passengers": self.passengers, "asm": self.asm,
            "revenue_impact": self.revenue_impact,
            "cost_impact": self.cost_impact,
            "margin_impact_pp": self.margin_impact_pp,
            "cash_impact": self.cash_impact,
            "assumptions": self.assumptions,
        }


def load_scenario_definitions(frame) -> list[ScenarioDefinition]:
    """Build preset definitions from the Scenarios sheet frame."""
    return [ScenarioDefinition(
        scenario_id=str(row["Scenario ID"]), name=str(row["Scenario Name"]),
        variable=str(row["Variable"]), change_pct=float(row["Change %"]),
        description=str(row["Description"]),
        primary_kpi_impact=str(row["Primary KPI Impact"]),
    ) for _, row in frame.iterrows()]


def preset_to_input(definition: ScenarioDefinition) -> ScenarioInput:
    """Convert a preset scenario (e.g. S001) into simulator inputs."""
    field_name = PRESET_VARIABLE_MAP.get(definition.variable)
    if field_name is None:
        raise ValueError(
            f"Scenario {definition.scenario_id}: unknown variable "
            f"'{definition.variable}' — cannot map to a simulator input."
        )
    inputs = ScenarioInput(label=f"{definition.scenario_id} {definition.name}")
    setattr(inputs, field_name, definition.change_pct)
    return inputs
