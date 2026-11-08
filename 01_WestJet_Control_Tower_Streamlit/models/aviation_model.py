"""models/aviation_model.py — canonical aviation data model.

One typed frame per domain, Month as a month-start datetime, route-month
grain preserved for Network_Routes, Total Revenue computed, KPI_Calculated
populated by the KPI engine (services/kpi_engine.py). Both packages use
this same model.
"""

from __future__ import annotations

from dataclasses import dataclass, field

import pandas as pd

# Domain key -> workbook sheet name.
DOMAIN_SHEETS: dict[str, str] = {
    "calendar": "Calendar",
    "flight_operations": "Flight_Operations",
    "mro": "MRO_TechOps",
    "people": "Crew_People",
    "passenger": "Passenger_Commercial",
    "revenue": "Revenue_Management",
    "finance": "Finance",
    "baggage": "Baggage",
    "cargo": "Cargo",
    "ground": "Airport_Ground",
    "fuel": "Fuel",
    "network": "Network_Routes",
    "ancillary": "Ancillary_Revenue",
    "data_platform": "Data_Platform",
    "ai_products": "AI_Data_Products",
    "governance": "Data_Governance",
}

REVENUE_COMPONENTS = ["Passenger Revenue", "Cargo Revenue",
                      "Ancillary Revenue", "Other Revenue"]


@dataclass
class AviationModel:
    """Canonical model: typed frames per domain + computed KPI frame."""

    domains: dict[str, pd.DataFrame] = field(default_factory=dict)
    kpi_calculated: pd.DataFrame = field(
        default_factory=lambda: pd.DataFrame())
    targets: dict[str, float] = field(default_factory=dict)
    date_min: pd.Timestamp | None = None
    date_max: pd.Timestamp | None = None

    def __getitem__(self, domain: str) -> pd.DataFrame:
        return self.domains[domain]

    @property
    def n_months(self) -> int:
        cal = self.domains.get("calendar")
        return int(len(cal)) if cal is not None else 0

    def filter_period(self, domain: str, start, end) -> pd.DataFrame:
        """Rows of a domain within [start, end] (inclusive, month grain)."""
        frame = self.domains[domain]
        mask = (frame["Month"] >= pd.to_datetime(start)) & \
               (frame["Month"] <= pd.to_datetime(end))
        return frame.loc[mask].copy()

    def total_revenue_frame(self) -> pd.DataFrame:
        """Monthly Total Revenue = Passenger + Cargo + Ancillary + Other."""
        rev = self.domains["revenue"][["Month"] + REVENUE_COMPONENTS].copy()
        rev["Total Revenue"] = rev[REVENUE_COMPONENTS].sum(axis=1)
        return rev[["Month", "Total Revenue"]]

    def latest_month(self) -> pd.Timestamp | None:
        return self.date_max

    def route_aggregates(self) -> pd.DataFrame:
        """Route-level aggregates over the full period (route grain)."""
        net = self.domains["network"]
        agg = net.groupby("Route", as_index=False).agg(
            Flights=("Flights", "sum"),
            Passengers=("Passengers", "sum"),
            Route_Revenue=("Route Revenue", "sum"),
            Route_Cost=("Route Cost", "sum"),
        )
        agg["Route_Profit"] = agg["Route_Revenue"] - agg["Route_Cost"]
        agg["Revenue_per_Flight"] = agg["Route_Revenue"] / agg["Flights"]
        agg["Cost_per_Flight"] = agg["Route_Cost"] / agg["Flights"]
        return agg.sort_values("Route_Revenue", ascending=False)
