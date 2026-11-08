"""services/comparison_engine.py — Actual vs Baseline vs Simulated comparison.

Comparison logic for the Scenario Outcome page (brief section 14): charts
and summary tiles for RASK, CASK, Revenue, Operating Cost, Margin, Cash,
Load Factor, Capacity and Passenger Volume. Also the generic time
comparisons (prior month / prior year / YoY / variance to target) used by
KPI cards. All comparisons work on any selected date range; no year is
assumed. Simulated values are always labelled simulated.
"""

from __future__ import annotations

import pandas as pd

from services.kpi_engine import aggregate_kpis, prior_month, prior_year_month

# Outcome-page metrics, in display order (brief section 14).
OUTCOME_METRICS = [
    "RASK", "CASK", "Revenue", "Operating Cost", "Margin", "Cash",
    "Load Factor", "Capacity", "Passenger Volume",
]

# Metric -> key in the aggregate_kpis() dict / ScenarioResult.to_dict().
_METRIC_KEYS = {
    "RASK": "RASK",
    "CASK": "CASM",
    "Revenue": "Total Revenue",
    "Operating Cost": "Operating Cost",
    "Margin": "Operating Margin",
    "Cash": "Cash Position",
    "Load Factor": "Load Factor",
    "Capacity": "ASM",
    "Passenger Volume": "Passengers",
}

# Metric -> key in ScenarioResult.to_dict().
_SIMULATED_KEYS = {
    "RASK": "rask",
    "CASK": "cask",
    "Revenue": "total_revenue",
    "Operating Cost": "operating_cost",
    "Margin": "operating_margin",
    "Cash": "cash_position",
    "Load Factor": "load_factor",
    "Capacity": "asm",
    "Passenger Volume": "passengers",
}


def _pct_change(new, old):
    if new is None or old in (None, 0):
        return None
    return (float(new) - float(old)) / abs(float(old))


def compare_actual_vs_prior(model, kpi: str, start, end) -> dict:
    """Current period vs prior month and vs the same period a year earlier.

    Returns the period value, prior-month value, prior-year value and the
    YoY $ / YoY % changes. Works on any date range.
    """
    current = aggregate_kpis(model, start, end)
    end_ts = pd.to_datetime(end)
    prev_month_end = prior_month(model, end_ts)
    prev_year_end = prior_year_month(model, end_ts)
    result = {
        "kpi": kpi,
        "current": current.get(kpi),
        "prior_month": None,
        "prior_year": None,
        "yoy_abs": None,
        "yoy_pct": None,
    }
    if prev_month_end is not None:
        prev = aggregate_kpis(model, prev_month_end, prev_month_end)
        result["prior_month"] = prev.get(kpi)
    if prev_year_end is not None:
        prev_y = aggregate_kpis(model, prev_year_end, prev_year_end)
        result["prior_year"] = prev_y.get(kpi)
        if current.get(kpi) is not None and prev_y.get(kpi) is not None:
            result["yoy_abs"] = current[kpi] - prev_y[kpi]
            result["yoy_pct"] = _pct_change(current[kpi], prev_y[kpi])
    return result


def variance_to_target(value, target):
    """Relative variance to target, or None if either is missing/zero."""
    if value is None or target in (None, 0):
        return None
    return (float(value) - float(target)) / abs(float(target))


def compare_scenarios(baseline: dict, simulated: dict,
                      actual: dict | None = None) -> list[dict]:
    """Actual vs Baseline vs Simulated table for the outcome page.

    `baseline` / `actual` are aggregate_kpis() dicts; `simulated` is a
    ScenarioResult.to_dict(). Every simulated value is labelled simulated.
    """
    rows = []
    for metric in OUTCOME_METRICS:
        base = baseline.get(_METRIC_KEYS[metric])
        sim = simulated.get(_SIMULATED_KEYS[metric])
        act = actual.get(_METRIC_KEYS[metric]) if actual else None
        rows.append({
            "metric": metric,
            "actual": act,
            "baseline": base,
            "simulated": sim,
            "is_simulated": True,
            "simulated_vs_baseline_abs":
                (sim - base) if sim is not None and base is not None else None,
            "simulated_vs_baseline_pct": _pct_change(sim, base),
            "actual_vs_baseline_pct": _pct_change(act, base),
        })
    return rows


def summary_tiles(baseline: dict, simulated: dict) -> dict:
    """Summary tiles for the outcome page (brief section 14)."""
    return {
        "revenue_impact": simulated.get("revenue_impact"),
        "cost_impact": simulated.get("cost_impact"),
        "margin_impact_pp": simulated.get("margin_impact_pp"),
        "cash_impact": simulated.get("cash_impact"),
        "is_simulated": True,
    }
