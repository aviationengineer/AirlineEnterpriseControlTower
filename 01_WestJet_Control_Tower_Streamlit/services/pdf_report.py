"""services/pdf_report.py — downloadable PDF snapshot of the whole tower.

Builds one self-contained PDF covering every dashboard section (in
``config.PAGES`` order, Theme & Branding excluded): a cover block, one
KPI table per section (latest month, target, change vs previous month),
a Scenario Outcome section and a Scenario Summary of the 9 workbook
presets. All values come from the existing KPI engine
(``services/kpi_engine.aggregate_kpis``), the pages' own measure specs
(``dashboards.*.MEASURES``) and ``config`` formatting helpers — no KPI
maths is re-implemented here.

The data is synthetic/demo data and the PDF says so: a SYNTHETIC DATA
marker on the cover and in the footer of every page.
"""

from __future__ import annotations

from datetime import datetime
from io import BytesIO
from xml.sax.saxutils import escape

import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from config import (
    EXECUTIVE_KPIS,
    PAGES,
    SIMULATOR_INPUTS,
    format_change,
    format_money,
    format_number,
    format_pct,
    format_value,
    is_pct_kpi,
    measure_value,
    pct_change,
    simulator_bounds,
)
from models.scenario_model import load_scenario_definitions
from services.kpi_engine import aggregate_kpis, prior_month

# Engine-KPI list per section, mirroring each page's render_kpi_grid call
# (Executive uses config.EXECUTIVE_KPIS, the shared source). Pages not
# listed here show domain measures and/or their own tables instead.
SECTION_KPIS: dict[str, list[str]] = {
    "executive": EXECUTIVE_KPIS,
    "flight_ops": ["Load Factor", "D0", "D15", "Aircraft Utilization"],
    "mro": ["Dispatch Reliability", "Maintenance Cost / Flight Hour",
            "AOG Rate"],
    "revenue": ["Total Revenue", "RASK", "Yield"],
    "baggage": ["Baggage Mishandling Rate"],
    "cargo": ["Cargo Yield"],
    "finance": ["Total Revenue", "Operating Cost", "Operating Margin",
                "CASM"],
    "ancillary": ["Ancillary Revenue / Passenger"],
    "data_platform": ["Data Quality", "Platform Availability",
                      "Ticket Deflection Rate"],
    "ai_products": ["Data Product Adoption"],
}

# Dashboard module -> its module-level MEASURES spec list (the same list
# the page itself renders via render_measure_grid).
_MEASURE_MODULES: dict[str, str] = {
    "flight_ops": "dashboards.flight_ops",
    "mro": "dashboards.mro",
    "passenger": "dashboards.passenger",
    "revenue": "dashboards.revenue",
    "people": "dashboards.people",
    "baggage": "dashboards.baggage",
    "cargo": "dashboards.cargo",
    "ground": "dashboards.ground",
    "fuel": "dashboards.fuel",
    "finance": "dashboards.finance",
    "ancillary": "dashboards.ancillary",
    "data_platform": "dashboards.data_platform",
    "ai_products": "dashboards.ai_products",
    "governance": "dashboards.governance",
}


def _measure_specs(page_key: str) -> list[dict]:
    """The page module's own MEASURES list ([] when it defines none)."""
    module_name = _MEASURE_MODULES.get(page_key)
    if module_name is None:
        return []
    import importlib

    module = importlib.import_module(module_name)
    return list(getattr(module, "MEASURES", []))


def _format_measure(spec: dict, value: float | None) -> str:
    """Format a domain measure exactly as the KPI cards do."""
    fmt = spec.get("fmt", "number")
    if fmt == "money":
        return format_money(value)
    if fmt == "pct":
        return format_pct(value)
    return format_number(value)


def _change_text(current: float | None, previous: float | None,
                 *, pct_style: bool) -> str:
    """Change vs previous month: pp for percentage KPIs, % otherwise."""
    if current is None or previous is None:
        return "n/a"
    if pct_style:
        return format_change(float(current) - float(previous),
                             is_pct_kpi=True)
    return format_change(pct_change(current, previous), is_pct_kpi=False)


class _Styles:
    """Paragraph styles themed with the active theme's primary colour."""

    def __init__(self, primary: colors.Color) -> None:
        self.cover_airline = ParagraphStyle(
            "cover_airline", fontName="Helvetica-Bold", fontSize=22,
            leading=26, textColor=colors.white)
        self.cover_sub = ParagraphStyle(
            "cover_sub", fontName="Helvetica", fontSize=12, leading=15,
            textColor=colors.white)
        self.h1 = ParagraphStyle(
            "h1", fontName="Helvetica-Bold", fontSize=15, leading=19,
            textColor=primary, spaceAfter=4)
        self.h2 = ParagraphStyle(
            "h2", fontName="Helvetica-Bold", fontSize=11.5, leading=14,
            textColor=primary, spaceBefore=8, spaceAfter=3)
        self.body = ParagraphStyle(
            "body", fontName="Helvetica", fontSize=9.5, leading=13,
            textColor=colors.HexColor("#1F2937"))
        self.small = ParagraphStyle(
            "small", fontName="Helvetica", fontSize=8.5, leading=11,
            textColor=colors.HexColor("#4B5563"))
        self.badge = ParagraphStyle(
            "badge", fontName="Helvetica-Bold", fontSize=10, leading=13,
            textColor=colors.HexColor("#B42318"))
        self.cell = ParagraphStyle(
            "cell", fontName="Helvetica", fontSize=8.5, leading=11,
            textColor=colors.HexColor("#1F2937"))


def _styled_table(headers: list[str], rows: list[list[str]],
                  widths: list[float], primary: colors.Color,
                  surface: colors.Color) -> Table:
    """Table with a primary-coloured header row and banded body rows."""
    data = [headers] + rows
    table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), primary),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("LEADING", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#D0D5DD")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]
    for idx in range(1, len(data)):
        if idx % 2 == 0:
            style.append(("BACKGROUND", (0, idx), (-1, idx), surface))
    table.setStyle(TableStyle(style))
    return table


def _kpi_rows(model, page_key: str, latest: pd.Timestamp,
              previous: pd.Timestamp | None,
              latest_kpis: dict, previous_kpis: dict) -> list[list[str]]:
    """KPI table rows for one section (engine KPIs + page measures)."""
    rows: list[list[str]] = []
    for kpi in SECTION_KPIS.get(page_key, []):
        current = latest_kpis.get(kpi)
        prior = previous_kpis.get(kpi)
        target = model.targets.get(kpi)
        rows.append([
            kpi,
            format_value(kpi, current),
            format_value(kpi, target) if target is not None else "n/a",
            _change_text(current, prior, pct_style=is_pct_kpi(kpi)),
        ])
    for spec in _measure_specs(page_key):
        current = measure_value(model, spec, latest, latest)
        prior = measure_value(model, spec, previous, previous) \
            if previous is not None else None
        target = spec.get("target")
        rows.append([
            spec["label"],
            _format_measure(spec, current),
            _format_measure(spec, target) if target is not None else "n/a",
            _change_text(current, prior,
                         pct_style=spec.get("fmt") == "pct"),
        ])
    return rows


def _split_scenario_results(scenario_results) -> tuple[list, dict]:
    """Normalise the optional scenario_results argument.

    Accepts None, a {scenario_id: ScenarioResult} mapping (as returned
    by services.scenario_engine.run_all_presets), or a dict with
    "definitions" / "results" entries. Definitions fall back to the
    bundled workbook's Scenarios sheet — the same source the app loads.
    """
    definitions: list = []
    results: dict = {}
    if isinstance(scenario_results, dict):
        if "definitions" in scenario_results or \
                "results" in scenario_results:
            definitions = list(scenario_results.get("definitions") or [])
            results = dict(scenario_results.get("results") or {})
        else:
            results = dict(scenario_results)
    if not definitions:
        try:
            from data.loader import load_workbook

            definitions = load_scenario_definitions(
                load_workbook().scenarios)
        except Exception:
            definitions = []
    return definitions, results


def build_pdf_report(model, report_summary: dict | None, theme: dict,
                     scenario_results=None) -> bytes:
    """Render the full-section PDF snapshot and return its bytes.

    model: the loaded AviationModel. report_summary: the data-quality
    summary dict from services.data_quality (may be None). theme: the
    active theme dict (airline, iata, primary, surface, ...).
    scenario_results: optional preset outcomes (see
    _split_scenario_results); definitions are always listed, outcomes
    are included only when results are passed in.
    """
    airline = str(theme.get("airline", "WestJet"))
    iata = str(theme.get("iata", ""))
    primary = colors.HexColor(theme.get("primary", "#002855"))
    surface = colors.HexColor(theme.get("surface", "#F2F4F7"))
    styles = _Styles(primary)
    generated = datetime.now()
    latest = model.date_max
    previous = prior_month(model, latest) if latest is not None else None
    latest_kpis = aggregate_kpis(model, latest, latest) \
        if latest is not None else {}
    previous_kpis = aggregate_kpis(model, previous, previous) \
        if previous is not None else {}
    definitions, results = _split_scenario_results(scenario_results)

    footer_text = (f"SYNTHETIC DATA — {airline} Enterprise Aviation "
                   "Intelligence & Control Tower")

    def _footer(canvas, doc) -> None:
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(colors.HexColor("#4B5563"))
        canvas.drawString(15 * mm, 10 * mm, footer_text)
        canvas.drawRightString(A4[0] - 15 * mm, 10 * mm,
                               f"Page {doc.page}")
        canvas.restoreState()

    buffer = BytesIO()
    doc = BaseDocTemplate(buffer, pagesize=A4,
                          leftMargin=15 * mm, rightMargin=15 * mm,
                          topMargin=14 * mm, bottomMargin=16 * mm,
                          title=f"{airline} Control Tower — PDF Snapshot",
                          author="Enterprise Aviation Control Tower")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height,
                  id="body")
    doc.addPageTemplates([PageTemplate(id="page", frames=[frame],
                                       onPage=_footer)])

    story: list = []

    # --- Cover block ---------------------------------------------------
    cover = Table(
        [[Paragraph(f"{escape(airline)} ({escape(iata)})",
                    styles.cover_airline)],
         [Paragraph("Enterprise Aviation Intelligence &amp; Control Tower",
                    styles.cover_sub)],
         [Paragraph("PDF Snapshot Report", styles.cover_sub)]],
        colWidths=[doc.width])
    cover.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), primary),
        ("TOPPADDING", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, -1), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ]))
    story.append(cover)
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph(
        "SYNTHETIC DATA — synthetic/demo values only; not actual "
        f"{escape(airline)} performance.", styles.badge))
    story.append(Spacer(1, 4 * mm))
    if model.date_min is not None and model.date_max is not None:
        period = (f"{model.date_min:%B %Y} – {model.date_max:%B %Y} "
                  f"({model.n_months} months)")
    else:
        period = "n/a"
    summary = report_summary or {}
    status = summary.get("data_status", "Unknown")
    platform_status = "Operational" if status != "Critical" \
        else "Attention needed"
    score = summary.get("data_quality_score")
    score_text = f"{score:.1f} / 100" if isinstance(score, (int, float)) \
        else "n/a"
    meta_rows = [
        ["Generated", generated.strftime("%d %B %Y %H:%M")],
        ["Data period", period],
        ["Latest month", f"{latest:%B %Y}" if latest is not None else "n/a"],
        ["Data Quality", score_text],
        ["Data Status", str(status)],
        ["Platform Status", platform_status],
    ]
    story.append(_styled_table(["Snapshot", "Value"], meta_rows,
                               [35 * mm, doc.width - 35 * mm],
                               primary, surface))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(
        "One section per dashboard page follows, in navigation order. "
        "Each table shows the latest month's value, the workbook target "
        "where one is defined, and the change versus the previous month "
        "(percentage points for percentage KPIs, % change otherwise). "
        "Values are computed by the centralised KPI engine from the "
        "input workbook.", styles.body))

    # --- One section per dashboard page (Theme & Branding excluded) ----
    widths = [58 * mm, 38 * mm, 38 * mm, doc.width - 134 * mm]
    for page_key, label, _module in PAGES:
        if page_key == "theme":
            continue
        story.append(PageBreak())
        story.append(Paragraph(escape(label), styles.h1))
        story.append(Paragraph(
            f"Latest month: {latest:%B %Y}" if latest is not None
            else "No data loaded.", styles.small))
        if page_key == "network":
            story.append(Paragraph(
                "Top 10 routes by revenue (full loaded period).",
                styles.h2))
            agg = model.route_aggregates().head(10)
            rows = [[
                str(r.Route), format_number(r.Flights),
                format_number(r.Passengers), format_money(r.Route_Revenue),
                format_money(r.Route_Cost), format_money(r.Route_Profit),
            ] for r in agg.itertuples()]
            story.append(_styled_table(
                ["Route", "Flights", "Passengers", "Route Revenue",
                 "Route Cost", "Route Profit"],
                rows,
                [30 * mm, 20 * mm, 26 * mm, 34 * mm, 34 * mm,
                 doc.width - 144 * mm], primary, surface))
        elif page_key == "simulator":
            story.append(Paragraph(
                "Simulator input definitions (defaults 0%; outcomes are "
                "simulated on the Scenario Outcome page).", styles.h2))
            rows = []
            for field_name, input_label, group in SIMULATOR_INPUTS:
                lo, hi = simulator_bounds(field_name)
                rows.append([input_label, group, f"{lo:+.0f}% to {hi:+.0f}%"])
            story.append(_styled_table(
                ["Input", "Group", "Range"], rows,
                [70 * mm, 40 * mm, doc.width - 110 * mm],
                primary, surface))
        elif page_key == "outcome":
            if results:
                story.append(Paragraph(
                    "Preset scenario outcomes (SIMULATED — not actual "
                    "performance).", styles.h2))
                rows = []
                for scenario_id in sorted(results):
                    result = results[scenario_id]
                    rows.append([
                        str(getattr(result, "label", scenario_id)),
                        format_money(getattr(result, "total_revenue",
                                             None)),
                        format_change(getattr(result, "revenue_impact",
                                              None), is_pct_kpi=False),
                        format_change(getattr(result, "cost_impact", None),
                                      is_pct_kpi=False),
                        format_change(getattr(result, "margin_impact_pp",
                                              None), is_pct_kpi=True),
                    ])
                story.append(_styled_table(
                    ["Scenario", "Simulated Total Revenue",
                     "Revenue Impact", "Cost Impact", "Margin Impact"],
                    rows,
                    [52 * mm, 36 * mm, 30 * mm, 30 * mm,
                     doc.width - 148 * mm], primary, surface))
            else:
                story.append(Paragraph(
                    "No scenario results were supplied with this "
                    "snapshot; preset outcomes are computed by the "
                    "scenario engine on the Scenario Outcome page. The "
                    "preset definitions are listed in the Scenario "
                    "Summary section.", styles.body))
        else:
            rows = _kpi_rows(model, page_key, latest, previous,
                             latest_kpis, previous_kpis)
            if rows:
                story.append(_styled_table(
                    ["KPI / Measure",
                     f"Latest ({latest:%b %Y})" if latest is not None
                     else "Latest",
                     "Target", "Change vs prev. month"],
                    rows, widths, primary, surface))
            else:
                story.append(Paragraph(
                    "No KPI table is defined for this section.",
                    styles.body))

    # --- Scenario Summary ----------------------------------------------
    story.append(PageBreak())
    story.append(Paragraph("Scenario Summary", styles.h1))
    story.append(Paragraph(
        "The 9 preset scenarios from the workbook's Scenarios sheet. "
        "All scenario outcomes are simulated.", styles.body))
    if definitions:
        rows = []
        for definition in definitions:
            rows.append([
                str(getattr(definition, "scenario_id", "")),
                Paragraph(escape(str(getattr(definition, "name", ""))),
                          styles.cell),
                str(getattr(definition, "variable", "")),
                f"{float(getattr(definition, 'change_pct', 0.0)):+.0f}%",
                Paragraph(escape(str(getattr(definition, "description",
                                             ""))), styles.cell),
                Paragraph(escape(str(getattr(definition,
                                             "primary_kpi_impact", ""))),
                          styles.cell),
            ])
        story.append(_styled_table(
            ["ID", "Scenario", "Variable", "Change", "Description",
             "Primary KPI Impact"],
            rows,
            [14 * mm, 30 * mm, 24 * mm, 16 * mm, 56 * mm,
             doc.width - 140 * mm], primary, surface))
    else:
        story.append(Paragraph(
            "No scenario definitions could be loaded.", styles.body))

    doc.build(story)
    return buffer.getvalue()
