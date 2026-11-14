"""PDF snapshot tests: build_pdf_report renders a valid multi-section
PDF from the bundled workbook model, themed with the active theme and
carrying the SYNTHETIC DATA marker, section titles and scenario summary.
"""

from __future__ import annotations

import pytest

from config import THEMES
from services.data_quality import data_status_for
from services.pdf_report import build_pdf_report
from services.scenario_engine import run_all_presets


def _extract(pdf_bytes: bytes) -> tuple[int, str]:
    """(page count, full text) — pypdf when available, else raw bytes."""
    try:
        from pypdf import PdfReader
    except ImportError:
        return 0, pdf_bytes.decode("latin-1", errors="ignore")
    from io import BytesIO

    reader = PdfReader(BytesIO(pdf_bytes))
    text = "\n".join((page.extract_text() or "")
                     for page in reader.pages)
    return len(reader.pages), text


@pytest.fixture(scope="module")
def summary(workbook_data):
    return data_status_for(workbook_data.frames)


def test_pdf_report_builds_all_sections(model, summary):
    theme = dict(THEMES["emirates"])
    pdf = build_pdf_report(model, summary, theme)

    assert pdf[:4] == b"%PDF"
    pages, text = _extract(pdf)
    if pages:
        # Cover + 18 dashboard sections + Scenario Summary.
        assert pages >= 19
    assert "Emirates" in text
    assert "SYNTHETIC DATA" in text
    for title in ["Executive Overview", "Flight Operations",
                  "MRO / Tech Ops", "Finance", "Data Governance",
                  "Scenario Summary"]:
        assert title in text, title
    # Latest month of the bundled workbook, and at least one KPI name.
    assert "December 2026" in text
    assert "Load Factor" in text


def test_pdf_report_with_scenario_results(model, workbook_data, summary):
    theme = dict(THEMES["westjet"])
    results = run_all_presets(model, workbook_data.scenarios,
                              model.date_min, model.date_max)
    assert len(results) == 9
    pdf = build_pdf_report(model, summary, theme,
                           scenario_results=results)
    assert pdf[:4] == b"%PDF"
    _pages, text = _extract(pdf)
    assert "WestJet" in text
    assert "Scenario Outcome" in text
    assert "SIMULATED" in text


def test_pdf_report_tolerates_missing_summary(model):
    pdf = build_pdf_report(model, None, dict(THEMES["emirates"]))
    assert pdf[:4] == b"%PDF"
