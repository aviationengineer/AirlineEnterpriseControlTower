"""components/tables.py — filtered tables with CSV export.

Exports (brief section 23): CSV export, filtered table export, scenario
results export, KPI summary export. Every export carries the SYNTHETIC
DATA note as a column, so the badge survives download.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from config import SYNTHETIC_BADGE_TEXT

DATA_NOTE_COLUMN = "Data note"
DATA_NOTE_VALUE = SYNTHETIC_BADGE_TEXT


def with_data_note(frame: pd.DataFrame) -> pd.DataFrame:
    """Add the SYNTHETIC DATA note column to an export frame."""
    out = frame.copy()
    out[DATA_NOTE_COLUMN] = DATA_NOTE_VALUE
    return out


def csv_download_button(label: str, frame: pd.DataFrame,
                        filename: str) -> None:
    """Download button for a CSV export (with the data note column)."""
    st.download_button(
        label=label,
        data=with_data_note(frame).to_csv(index=False).encode("utf-8"),
        file_name=filename, mime="text/csv")


def filtered_table(frame: pd.DataFrame, title: str, filename: str,
                   *, height: int = 320) -> None:
    """Show a filtered dataframe with a CSV export button."""
    st.subheader(title)
    if frame is None or len(frame) == 0:
        st.caption("No rows for the selected filters.")
        return
    st.dataframe(frame, width="stretch", height=height)
    csv_download_button(f"Download {title} (CSV)", frame, filename)


def kpi_summary_frame(ctx, kpis: list[str]) -> pd.DataFrame:
    """KPI summary export: one row per KPI with current / prior / YoY /
    target / variance to target / status — all from the KPI engine."""
    from components.kpi_card import card_data

    rows = []
    for kpi in kpis:
        data = card_data(ctx, kpi)
        rows.append({
            "KPI": data["label"],
            "Current": data["current"],
            "Previous period": data["prior"],
            "YoY change": data["yoy"],
            "Target": data["target"],
            "Variance to target": data["variance_to_target"],
            "Status": data["status"][0],
        })
    return pd.DataFrame(rows)


def scenario_results_frame(result, baseline: dict,
                           assumptions: list[str]) -> pd.DataFrame:
    """Scenario results export: baseline vs simulated (labelled SIMULATED)
    plus the assumptions list."""
    rows = [
        {"Metric": "Total Revenue (SIMULATED)", "Baseline": baseline.get(
            "Total Revenue"), "Simulated": result.total_revenue,
         "Impact": result.revenue_impact},
        {"Metric": "Operating Cost (SIMULATED)", "Baseline": baseline.get(
            "Operating Cost"), "Simulated": result.operating_cost,
         "Impact": result.cost_impact},
        {"Metric": "Operating Margin (SIMULATED)", "Baseline": baseline.get(
            "Operating Margin"), "Simulated": result.operating_margin,
         "Impact (pp)": result.margin_impact_pp},
        {"Metric": "RASK (SIMULATED)", "Baseline": baseline.get("RASK"),
         "Simulated": result.rask, "Impact": None},
        {"Metric": "CASM (SIMULATED)", "Baseline": baseline.get("CASM"),
         "Simulated": result.cask, "Impact": None},
        {"Metric": "Load Factor (SIMULATED)",
         "Baseline": baseline.get("Load Factor"),
         "Simulated": result.load_factor, "Impact": None},
        {"Metric": "Cash Position (SIMULATED)",
         "Baseline": baseline.get("Cash Position"),
         "Simulated": result.cash_position,
         "Impact": result.cash_impact},
        {"Metric": "EBIT-style (SIMULATED)", "Baseline":
         baseline.get("Total Revenue", 0)
         - baseline.get("Operating Cost", 0) if baseline.get(
             "Total Revenue") is not None and baseline.get(
             "Operating Cost") is not None else None,
         "Simulated": result.ebit_style, "Impact": None},
        {"Metric": "Passengers (SIMULATED)", "Baseline": baseline.get(
            "Passengers"), "Simulated": result.passengers, "Impact": None},
        {"Metric": "Capacity — ASM (SIMULATED)", "Baseline": baseline.get(
            "ASM"), "Simulated": result.asm, "Impact": None},
    ]
    frame = pd.DataFrame(rows)
    frame["Assumptions"] = "; ".join(assumptions)
    return frame
