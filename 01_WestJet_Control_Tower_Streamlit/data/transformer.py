"""data/transformer.py — transform validated raw frames into the canonical model.

Month becomes a month-start datetime on every frame, Total Revenue is
computed (Passenger + Cargo + Ancillary + Other Revenue — there is no source
column for it), route-month grain is preserved for Network_Routes, and
KPI_Calculated is populated by the KPI engine (not here, and not from the
workbook's empty KPI_Calculated sheet).
"""

from __future__ import annotations

import pandas as pd

from models.aviation_model import DOMAIN_SHEETS, AviationModel
from services.kpi_engine import compute_kpi_frame


def build_model(frames: dict[str, pd.DataFrame],
                targets: dict[str, float] | None = None) -> AviationModel:
    """Build the canonical AviationModel from loaded (validated) frames."""
    domains: dict[str, pd.DataFrame] = {}
    for domain, sheet in DOMAIN_SHEETS.items():
        frame = frames[sheet].copy()
        frame = frame.sort_values("Month").reset_index(drop=True)
        # Normalise Month to month-start datetime.
        frame["Month"] = pd.to_datetime(frame["Month"]).dt.to_period("M") \
            .dt.to_timestamp()
        domains[domain] = frame

    calendar = domains["calendar"]
    model = AviationModel(
        domains=domains,
        targets=dict(targets or {}),
        date_min=calendar["Month"].min() if len(calendar) else None,
        date_max=calendar["Month"].max() if len(calendar) else None,
    )
    model.kpi_calculated = compute_kpi_frame(model)
    return model


def total_revenue(revenue_frame: pd.DataFrame) -> pd.Series:
    """Total Revenue per row from the four revenue components."""
    components = ["Passenger Revenue", "Cargo Revenue",
                  "Ancillary Revenue", "Other Revenue"]
    return revenue_frame[components].sum(axis=1)
