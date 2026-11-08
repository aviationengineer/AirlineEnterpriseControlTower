"""services/data_quality.py — data-quality score and DATA STATUS.

Thin wrapper over data/validator.py: the report object is the single source
of truth for score and status (brief section 18). Kept here so dashboards
import from services/, not from data/.
"""

from __future__ import annotations

from data.validator import ValidationReport, validate_all


def build_data_quality_summary(report: ValidationReport) -> dict:
    """Summary dict for headers / status components."""
    return {
        "data_status": report.data_status,
        "data_quality_score": report.data_quality_score,
        "n_errors": len(report.errors),
        "n_warnings": len(report.warnings),
        "n_checks": report.n_checks,
        "critical_errors": [vars(i) for i in report.critical_errors],
        "issues": [vars(i) for i in report.issues],
    }


def data_status_for(frames: dict) -> dict:
    """Validate frames and return the data-quality summary in one call."""
    return build_data_quality_summary(validate_all(frames))
