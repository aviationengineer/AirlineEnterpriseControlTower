"""data/export_web_json.py — convert the workbook + computed KPIs into the
HTML/JS package's sample-data.json.

Run from the Streamlit package directory:
    python -m data.export_web_json
or:
    python data/export_web_json.py

Output: 02_WestJet_Control_Tower_HTML_JS/data/sample-data.json
(monthly series per domain, route aggregates, KPI values, targets,
scenarios, validation summary). All KPI values come from the Python KPI
engine, so the JSON matches the Python-computed values exactly.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd

PACKAGE_DIR = Path(__file__).resolve().parent.parent
if str(PACKAGE_DIR) not in sys.path:
    sys.path.insert(0, str(PACKAGE_DIR))

from data.cache import clear_cache, get_model  # noqa: E402
from data.loader import load_workbook  # noqa: E402
from data.validator import validate_all  # noqa: E402
from services.scenario_engine import run_all_presets  # noqa: E402

HTML_DATA_PATH = (
    PACKAGE_DIR.parent / "02_WestJet_Control_Tower_HTML_JS" / "data"
    / "sample-data.json"
)

DOMAIN_KEYS = {
    "flight_operations": "flight_operations",
    "mro": "mro",
    "people": "people",
    "passenger": "passenger",
    "revenue": "revenue",
    "finance": "finance",
    "baggage": "baggage",
    "cargo": "cargo",
    "ground": "ground",
    "fuel": "fuel",
    "network": "network",
    "ancillary": "ancillary",
    "data_platform": "data_platform",
    "ai_products": "ai_products",
    "governance": "governance",
}


def _frame_to_records(frame: pd.DataFrame) -> list[dict]:
    frame = frame.copy()
    if "Month" in frame.columns:
        frame["Month"] = pd.to_datetime(frame["Month"]).dt.strftime("%Y-%m")
    return json.loads(frame.to_json(orient="records"))


def build_web_json(workbook_path=None) -> dict:
    """Build the web JSON payload from the loaded workbook."""
    clear_cache()
    data = load_workbook(workbook_path)
    model = get_model(workbook_path)
    report = validate_all(data.frames)

    start, end = data.date_min, data.date_max
    presets = run_all_presets(model, data.frames["Scenarios"], start, end)

    payload = {
        "_note": "SYNTHETIC DATA — sample data converted from "
                 "WestJet_Enterprise_Control_Tower_Input_Template.xlsx. "
                 "KPI values are computed by the Python KPI engine; "
                 "scenario values are SIMULATED, not actual performance.",
        "metadata": {
            "data_period": {
                "start": start.strftime("%Y-%m"),
                "end": end.strftime("%Y-%m"),
            },
            "n_months": int(data.n_months),
            "last_refresh": pd.Timestamp.now().strftime("%Y-%m-%d"),
            "synthetic_data": True,
            "data_status": report.data_status,
            "data_quality_score": report.data_quality_score,
            "n_validation_errors": len(report.errors),
            "n_validation_warnings": len(report.warnings),
        },
        "domains": {
            key: _frame_to_records(model.domains[key])
            for key in DOMAIN_KEYS
        },
        "kpi_calculated": _frame_to_records(model.kpi_calculated),
        "targets": model.targets,
        "kpi_definitions": json.loads(
            data.frames["KPI_Definitions"].to_json(orient="records")),
        "scenarios": json.loads(
            data.frames["Scenarios"].to_json(orient="records")),
        "preset_results": {
            sid: result.to_dict() for sid, result in presets.items()
        },
        "route_aggregates": _frame_to_records(model.route_aggregates()),
        "validation": report.to_dict(),
    }
    return payload


def main() -> Path:
    payload = build_web_json()
    HTML_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    HTML_DATA_PATH.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {HTML_DATA_PATH} "
          f"({payload['metadata']['n_months']} months, "
          f"{payload['metadata']['data_period']['start']} to "
          f"{payload['metadata']['data_period']['end']}, "
          f"status {payload['metadata']['data_status']})")
    return HTML_DATA_PATH


if __name__ == "__main__":
    main()
