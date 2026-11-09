"""config.py — application configuration for the Streamlit control tower.

Workbook path, the 19-page registry, WestJet theme constants, formatting
helpers, the Executive Overview KPI list, KPI-category mapping, simulator
input definitions, and the shared page-context builder.

No KPI values, dates or targets are hard-coded here: targets are read from
the workbook at load time (``model.targets``) and every KPI value comes
from ``services/kpi_engine.py`` via the context builder.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import pandas as pd

from models.kpi_model import KPI_FORMATS, format_kpi, kpi_status
from models.scenario_model import INPUT_BOUNDS
from services.kpi_engine import aggregate_kpis, filter_period

# ---------------------------------------------------------------------------
# Paths / theme
# ---------------------------------------------------------------------------

PACKAGE_DIR = Path(__file__).resolve().parent
WORKBOOK_PATH = PACKAGE_DIR / "data" / \
    "WestJet_Enterprise_Control_Tower_Input_Template.xlsx"

NAVY = "#002855"
YELLOW = "#FFC72C"
CHARCOAL = "#1F2937"
LIGHT_GREY = "#F2F4F7"
BLUE = "#2E6EA6"
TEAL = "#0E7C7B"
GREEN = "#1B7A3D"
RED = "#B42318"
AMBER = "#B54708"

SYNTHETIC_BADGE_TEXT = (
    "SYNTHETIC DATA — synthetic/demo values only; "
    "not actual WestJet performance."
)
UTILISATION_FOOTNOTE = (
    "Target appears to be a daily figure — status withheld pending "
    "confirmation."
)
CASH_ILLUSTRATIVE_NOTE = (
    "Cash impact on a multi-month baseline is illustrative: it applies the "
    "simulated change in operating profit to the baseline cash position."
)

APP_TITLE = "WESTJET"
APP_SUBTITLE = "Enterprise Aviation Control Tower"
APP_TAGLINE = "Operations · Commercial · MRO · Finance · Data · AI"

# ---------------------------------------------------------------------------
# Themes / branding — the Theme & Branding page (19th page).
#
# Single source for the Streamlit app: THEMES below, data/themes.json in
# the HTML/JS app, and the "Airline Themes & Branding" Google Sheet
# (THEME_SHEET_URL) carry the same 8 airlines and the same values; see
# 03_Shared/THEME_SYSTEM.md. Logos are remote URLs only (Wikimedia
# Commons, verified HTTP 200) — no logo binaries live in the repo.
# Colours are brand-inspired palettes chosen for this feature, not
# official brand-guideline values.
# ---------------------------------------------------------------------------

THEME_FIELDS: list[str] = [
    "airline", "iata", "primary", "secondary", "accent", "background",
    "surface", "text", "logo_url", "notes",
]

# Colour fields that must be #RRGGBB hex.
THEME_HEX_FIELDS: list[str] = [
    "primary", "secondary", "accent", "background", "surface", "text",
]

DEFAULT_THEME_ID = "westjet"

# Reference store for the themes (human-readable; the apps bundle the
# same values). Filled in once the sheet is created.
THEME_SHEET_ID = "14JMUnluNef0wlNNcdCkZ6YfkUTBgv7JP09qcRKARTzY"
THEME_SHEET_URL = "https://docs.google.com/spreadsheets/d/14JMUnluNef0wlNNcdCkZ6YfkUTBgv7JP09qcRKARTzY"

THEMES: dict[str, dict[str, str]] = {
    "westjet": {
        "airline": "WestJet", "iata": "WS",
        "primary": "#002855", "secondary": "#0E7C7B",
        "accent": "#FFC72C", "background": "#FFFFFF",
        "surface": "#F2F4F7", "text": "#1F2937",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/1/16/WestJetLogo2018.svg",
        "notes": "Default theme. WestJet navy, teal and yellow — "
                 "the control tower's original palette.",
    },
    "air-canada": {
        "airline": "Air Canada", "iata": "AC",
        "primary": "#E31837", "secondary": "#1A1A1A",
        "accent": "#FF6B6B", "background": "#FFFFFF",
        "surface": "#F2F4F7", "text": "#1F2937",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/2/24/Air_Canada_2017.svg",
        "notes": "Brand-inspired red and black palette.",
    },
    "emirates": {
        "airline": "Emirates", "iata": "EK",
        "primary": "#C8102E", "secondary": "#A67C37",
        "accent": "#D4A017", "background": "#FFFFFF",
        "surface": "#F7F3EC", "text": "#1F2937",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/1/1d/Emirates_Logo.svg",
        "notes": "Brand-inspired red and gold palette.",
    },
    "qatar-airways": {
        "airline": "Qatar Airways", "iata": "QR",
        "primary": "#5C0632", "secondary": "#7A1E4A",
        "accent": "#C9A227", "background": "#FFFFFF",
        "surface": "#F7F2F5", "text": "#1F2937",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/7/75/Qatar_Airways_logo.svg",
        "notes": "Brand-inspired burgundy and gold palette.",
    },
    "lufthansa": {
        "airline": "Lufthansa", "iata": "LH",
        "primary": "#05164D", "secondary": "#FFAD00",
        "accent": "#FFAD00", "background": "#FFFFFF",
        "surface": "#F2F4F7", "text": "#1F2937",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Lufthansa_Logo_2018.svg",
        "notes": "Brand-inspired dark blue and yellow palette.",
    },
    "british-airways": {
        "airline": "British Airways", "iata": "BA",
        "primary": "#075AAA", "secondary": "#00247D",
        "accent": "#CC0000", "background": "#FFFFFF",
        "surface": "#F2F4F7", "text": "#1F2937",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/8/8c/Logo_wordmark_British_Airways.png",
        "notes": "Brand-inspired blue and red palette.",
    },
    "delta-air-lines": {
        "airline": "Delta Air Lines", "iata": "DL",
        "primary": "#003366", "secondary": "#C01933",
        "accent": "#C01933", "background": "#FFFFFF",
        "surface": "#F2F4F7", "text": "#1F2937",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/d/d1/Delta_logo.svg",
        "notes": "Brand-inspired navy and red palette.",
    },
    "air-france": {
        "airline": "Air France", "iata": "AF",
        "primary": "#051039", "secondary": "#0091D2",
        "accent": "#ED1C24", "background": "#FFFFFF",
        "surface": "#F2F4F7", "text": "#1F2937",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/44/Air_France_Logo.svg",
        "notes": "Brand-inspired navy, blue and red palette.",
    },
}


def is_hex_colour(value: str) -> bool:
    """True for a #RRGGBB hex colour string."""
    if not isinstance(value, str) or len(value) != 7 or value[0] != "#":
        return False
    return all(c in "0123456789abcdefABCDEF" for c in value[1:])


def validate_theme(theme: dict) -> list[str]:
    """Validate a theme dict (starter or custom). Returns error strings.

    Required: every THEME_FIELDS entry present and non-empty, except
    ``logo_url`` and ``notes`` which may be empty. Colour fields must be
    #RRGGBB hex; a non-empty logo URL must be http(s). IATA must be 2–3
    letters.
    """
    errors: list[str] = []
    for field in THEME_FIELDS:
        if field in ("logo_url", "notes"):
            continue
        value = theme.get(field)
        if value is None or (isinstance(value, str) and not value.strip()):
            errors.append(f"Missing value: {field}")
    for field in THEME_HEX_FIELDS:
        value = theme.get(field)
        if value is not None and not is_hex_colour(value):
            errors.append(f"Invalid hex colour for {field}: {value!r}")
    iata = theme.get("iata")
    if iata is not None and (not isinstance(iata, str)
                             or not iata.isalpha()
                             or not 2 <= len(iata) <= 3):
        errors.append(f"Invalid IATA code: {iata!r} (2–3 letters)")
    logo = theme.get("logo_url")
    if logo and (not isinstance(logo, str)
                 or not logo.startswith(("http://", "https://"))):
        errors.append(f"Invalid logo URL: {logo!r} (must be http(s))")
    return errors


def get_theme(theme_id: str | None,
              custom: dict[str, dict] | None = None) -> dict:
    """Theme by id (custom themes first); unknown ids fall back to WestJet."""
    if theme_id and custom and theme_id in custom:
        return dict(custom[theme_id])
    if theme_id and theme_id in THEMES:
        return dict(THEMES[theme_id])
    return dict(THEMES[DEFAULT_THEME_ID])


def theme_css(theme: dict) -> str:
    """CSS that applies a theme to the Streamlit chrome: sidebar, header,
    buttons and links. Plotly chart series colours stay on the static
    WestJet palette (see THEME_SYSTEM.md) — only the chrome is themed."""
    primary = theme["primary"]
    secondary = theme["secondary"]
    accent = theme["accent"]
    surface = theme["surface"]
    background = theme["background"]
    text = theme["text"]
    return f"""<style>
/* Theme: {theme['airline']} ({theme['iata']}) — applied from session state. */
[data-testid="stSidebar"] {{ background-color: {surface}; }}
[data-testid="stSidebar"] h1, [data-testid="stSidebar"] h2,
[data-testid="stSidebar"] h3 {{ color: {primary}; }}
[data-testid="stHeader"] {{ background-color: {background}; }}
.stButton > button, .stDownloadButton > button {{
    background-color: {primary}; color: #FFFFFF; border-color: {primary}; }}
.stButton > button:hover, .stDownloadButton > button:hover {{
    background-color: {secondary}; border-color: {secondary}; }}
a {{ color: {primary}; }}
a:hover {{ color: {accent}; }}
div[data-testid="stRadio"] label:has(input:checked) {{ color: {primary}; font-weight: 700; }}
h1, h2, h3 {{ color: {text}; }}
</style>"""

# ---------------------------------------------------------------------------
# Page registry (brief section 9 — 18 pages, in order — plus the
# Theme & Branding page, 19th).
# ---------------------------------------------------------------------------

PAGES: list[tuple[str, str, str]] = [
    ("executive", "Executive Overview", "dashboards.executive"),
    ("flight_ops", "Flight Operations", "dashboards.flight_ops"),
    ("mro", "MRO / Tech Ops", "dashboards.mro"),
    ("passenger", "Passenger / Commercial", "dashboards.passenger"),
    ("revenue", "Revenue Management", "dashboards.revenue"),
    ("network", "Network / Route Profitability", "dashboards.network"),
    ("people", "Crew / People", "dashboards.people"),
    ("baggage", "Baggage", "dashboards.baggage"),
    ("cargo", "Cargo", "dashboards.cargo"),
    ("ground", "Airport / Ground", "dashboards.ground"),
    ("fuel", "Fuel", "dashboards.fuel"),
    ("finance", "Finance", "dashboards.finance"),
    ("ancillary", "Ancillary Revenue", "dashboards.ancillary"),
    ("data_platform", "Data Platform", "dashboards.data_platform"),
    ("ai_products", "AI / Data Products", "dashboards.ai_products"),
    ("governance", "Data Governance", "dashboards.governance"),
    ("simulator", "Scenario Simulator", "dashboards.simulator"),
    ("outcome", "Scenario Outcome", "dashboards.outcome"),
    ("theme", "Theme & Branding", "dashboards.theme"),
]

PAGE_LABELS: list[str] = [label for _, label, _ in PAGES]
PAGE_KEY_BY_LABEL: dict[str, str] = {label: key for key, label, _ in PAGES}

# ---------------------------------------------------------------------------
# KPI lists
# ---------------------------------------------------------------------------

# Brief section 8 — the 14 Executive Overview KPIs, in order.
EXECUTIVE_KPIS: list[str] = [
    "Total Revenue", "Operating Cost", "Operating Margin", "RASK", "CASM",
    "Load Factor", "D0", "Dispatch Reliability", "Aircraft Utilization",
    "Passengers", "Cash Position", "Data Quality", "Platform Availability",
    "Data Product Adoption",
]

# Display label for the passenger-volume card (aggregate key is "Passengers").
EXECUTIVE_LABELS: dict[str, str] = {
    "Total Revenue": "Total Revenue",
    "Operating Cost": "Operating Cost",
    "Operating Margin": "Operating Margin",
    "RASK": "RASK",
    "CASM": "CASM",
    "Load Factor": "Load Factor",
    "D0": "D0",
    "Dispatch Reliability": "Dispatch Reliability",
    "Aircraft Utilization": "Aircraft Utilization",
    "Passengers": "Passenger Volume",
    "Cash Position": "Cash Position",
    "Data Quality": "Data Quality",
    "Platform Availability": "Platform Availability",
    "Data Product Adoption": "Data Product Adoption",
}

# Brief section 7 — KPI categories (toggleable).
KPI_CATEGORIES: list[str] = [
    "Revenue", "Cost", "Operations", "People", "Customer", "MRO",
    "Network", "Data Platform", "AI / Data Products", "Governance",
]

# Primary category per engine KPI / executive KPI (KPI dictionary section 6).
KPI_CATEGORY_MAP: dict[str, str] = {
    "Total Revenue": "Revenue", "Operating Cost": "Cost",
    "Operating Margin": "Revenue", "RASK": "Revenue", "CASM": "Cost",
    "Load Factor": "Operations", "D0": "Operations", "D15": "Operations",
    "Dispatch Reliability": "MRO", "Aircraft Utilization": "Operations",
    "Passengers": "Customer", "Cash Position": "Revenue",
    "Data Quality": "Data Platform",
    "Platform Availability": "Data Platform",
    "Data Product Adoption": "AI / Data Products",
    "Yield": "Revenue", "Maintenance Cost / Flight Hour": "Cost",
    "AOG Rate": "MRO", "Baggage Mishandling Rate": "Operations",
    "Cargo Yield": "Revenue", "Ancillary Revenue / Passenger": "Revenue",
    "Ticket Deflection Rate": "Data Platform",
}

# Higher-is-better direction for level KPIs that carry no workbook target.
LEVEL_DIRECTIONS: dict[str, str] = {
    "Total Revenue": "higher", "Operating Cost": "lower",
    "Passengers": "higher", "Cash Position": "higher",
}

# ---------------------------------------------------------------------------
# Simulator inputs (brief section 12; bounds from models.scenario_model)
# ---------------------------------------------------------------------------

# (field, label, group) — order matches brief section 12.
SIMULATOR_INPUTS: list[tuple[str, str, str]] = [
    ("passenger_demand", "Passenger Demand %", "Commercial"),
    ("yield_pct", "Yield %", "Commercial"),
    ("load_factor", "Load Factor %", "Commercial"),
    ("capacity", "Capacity %", "Capacity"),
    ("flights", "Flights %", "Capacity"),
    ("aircraft_utilisation", "Aircraft Utilisation %", "Capacity"),
    ("fuel_price", "Fuel Price %", "Fuel"),
    ("fuel_volume", "Fuel Volume %", "Fuel"),
    ("maintenance_cost", "Maintenance Cost %", "MRO"),
    ("aircraft_availability", "Aircraft Availability %", "MRO"),
    ("labour_cost", "Labour Cost %", "Workforce"),
    ("headcount", "Headcount %", "Workforce"),
    ("cancellation", "Cancellation %", "Operations"),
    ("d0", "D0 %", "Operations"),
    ("d15", "D15 %", "Operations"),
    ("cargo_demand", "Cargo Demand %", "Cargo"),
    ("cargo_yield", "Cargo Yield %", "Cargo"),
    ("ancillary_revenue", "Ancillary Revenue %", "Ancillary"),
    ("fx", "FX %", "FX"),
]

SIMULATOR_GROUPS: list[str] = [
    "Commercial", "Capacity", "Fuel", "MRO", "Workforce", "Operations",
    "Cargo", "Ancillary", "FX",
]


def simulator_bounds(field: str) -> tuple[float, float]:
    """(min %, max %) for a simulator input (brief section 12, proposed)."""
    return INPUT_BOUNDS[field]


# ---------------------------------------------------------------------------
# Formatting (en-GB)
# ---------------------------------------------------------------------------

def format_money(value: float | None) -> str:
    """Compact currency: $1.23bn / $467.10m / $12,345."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "n/a"
    magnitude = abs(float(value))
    if magnitude >= 1e9:
        return f"${value / 1e9:,.2f}bn"
    if magnitude >= 1e6:
        return f"${value / 1e6:,.2f}m"
    return f"${value:,.0f}"


def format_number(value: float | None) -> str:
    """Plain number with thousands separators."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "n/a"
    return f"{value:,.0f}" if abs(float(value)) >= 100 else f"{value:,.2f}"


def format_pct(value: float | None) -> str:
    """Proportion (0-1) as a percentage."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "n/a"
    return f"{value:.2%}"


def format_change(value: float | None, *, is_pct_kpi: bool) -> str:
    """YoY / variance change: pp for percentage KPIs, % otherwise."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return "n/a"
    if is_pct_kpi:
        return f"{value * 100:+.2f} pp"
    return f"{value:+.2%}"


def format_value(kpi: str, value: float | None) -> str:
    """Display formatting for an engine KPI or a level KPI."""
    if kpi in KPI_FORMATS:
        return format_kpi(kpi, value)
    if kpi in ("Total Revenue", "Operating Cost", "Cash Position"):
        return format_money(value)
    if kpi == "Passengers":
        return format_number(value)
    return format_number(value)


def is_pct_kpi(kpi: str) -> bool:
    """True when the KPI is stored as a proportion (pp changes apply)."""
    return KPI_FORMATS.get(kpi) == "pct"


# ---------------------------------------------------------------------------
# Domain-measure aggregation helpers (plain sums/means of workbook columns).
#
# These aggregate raw domain measures only. Every ratio KPI is computed by
# services/kpi_engine.py and never here.
# ---------------------------------------------------------------------------

def period_sum(model, domain: str, column: str, start, end) -> float | None:
    """Sum of a domain column over [start, end]; None when no rows."""
    frame = model.filter_period(domain, start, end)
    if len(frame) == 0 or column not in frame.columns:
        return None
    return float(frame[column].sum())


def period_mean(model, domain: str, column: str, start, end) -> float | None:
    """Mean of a domain column over [start, end]; None when no rows."""
    frame = model.filter_period(domain, start, end)
    if len(frame) == 0 or column not in frame.columns:
        return None
    return float(frame[column].mean())


def period_last(model, domain: str, column: str, start, end) -> float | None:
    """Last month's value of a domain column over [start, end]."""
    frame = model.filter_period(domain, start, end)
    if len(frame) == 0 or column not in frame.columns:
        return None
    return float(frame[column].iloc[-1])


def measure_value(model, spec: dict, start, end) -> float | None:
    """Aggregate one domain measure spec over [start, end].

    spec: {"domain", "column", "agg": "sum" | "mean" | "last"}.
    """
    agg = spec.get("agg", "sum")
    if agg == "mean":
        return period_mean(model, spec["domain"], spec["column"], start, end)
    if agg == "last":
        return period_last(model, spec["domain"], spec["column"], start, end)
    return period_sum(model, spec["domain"], spec["column"], start, end)


def pct_change(new: float | None, old: float | None) -> float | None:
    """Relative change, or None when either side is missing/zero."""
    if new is None or old in (None, 0):
        return None
    return (float(new) - float(old)) / abs(float(old))


# ---------------------------------------------------------------------------
# Page context — everything a dashboard page needs, computed once per run
# from the KPI engine (never inside a page).
# ---------------------------------------------------------------------------

@dataclass
class PageContext:
    """Shared per-run context handed to every dashboard page."""

    model: object
    start: pd.Timestamp
    end: pd.Timestamp
    filters: dict = field(default_factory=dict)
    targets: dict = field(default_factory=dict)
    report: object = None
    current: dict = field(default_factory=dict)
    prior: dict | None = None
    prior_year: dict | None = None
    kpi_frame: pd.DataFrame = field(default_factory=pd.DataFrame)
    n_months: int = 0
    theme: dict = field(default_factory=lambda: dict(THEMES[DEFAULT_THEME_ID]))

    def target_for(self, kpi: str) -> float | None:
        return self.targets.get(kpi)

    def status_for(self, kpi: str, value: float | None) -> str | None:
        """Target status, except Aircraft Utilisation (status withheld)."""
        if kpi == "Aircraft Utilization":
            return None
        if kpi in KPI_FORMATS:
            return kpi_status(kpi, value, self.targets.get(kpi))
        return None

    def yoy_pct(self, kpi: str) -> float | None:
        """YoY relative change for the selected period, or None."""
        if not self.prior_year:
            return None
        return pct_change(self.current.get(kpi),
                          self.prior_year.get(kpi))

    def trend(self, kpi: str) -> pd.Series:
        """Monthly values of a KPI over the selected range (mini trend)."""
        if self.kpi_frame is None or len(self.kpi_frame) == 0:
            return pd.Series(dtype=float)
        if kpi in self.kpi_frame.columns:
            return self.kpi_frame[kpi]
        model = self.model
        if kpi == "Passengers":
            frame = model.filter_period("passenger", self.start, self.end)
            return frame["Passengers"] if "Passengers" in frame else \
                pd.Series(dtype=float)
        if kpi == "Cash Position":
            frame = model.filter_period("finance", self.start, self.end)
            return frame["Cash Position"] if "Cash Position" in frame else \
                pd.Series(dtype=float)
        return pd.Series(dtype=float)


def _shift_range(model, start, end, *, months: int = 0,
                 years: int = 0) -> tuple[pd.Timestamp, pd.Timestamp] | None:
    """Shift [start, end] back; None when the shifted start is out of range."""
    new_start = pd.to_datetime(start) - pd.DateOffset(months=months,
                                                      years=years)
    new_end = pd.to_datetime(end) - pd.DateOffset(months=months, years=years)
    if model.date_min is not None and new_start < model.date_min:
        return None
    return new_start, new_end


def build_context(model, start, end, filters: dict,
                  report=None, theme: dict | None = None) -> PageContext:
    """Build the page context: engine aggregates for the selected period,
    the immediately preceding equivalent-length period, and the same
    period a year earlier (None where out of range — never zero)."""
    start = pd.to_datetime(start)
    end = pd.to_datetime(end)
    current = aggregate_kpis(model, start, end)
    n_months = int(len(filter_period(model.domains["calendar"], start, end)))
    prior = None
    shifted = _shift_range(model, start, end, months=n_months)
    if shifted is not None:
        prior = aggregate_kpis(model, shifted[0], shifted[1])
    prior_year = None
    shifted_y = _shift_range(model, start, end, years=1)
    if shifted_y is not None:
        prior_year = aggregate_kpis(model, shifted_y[0], shifted_y[1])
    frame = filter_period(model.kpi_calculated, start, end) \
        if len(model.kpi_calculated) else pd.DataFrame()
    return PageContext(
        model=model, start=start, end=end, filters=filters,
        targets=dict(model.targets), report=report, current=current,
        prior=prior, prior_year=prior_year, kpi_frame=frame,
        n_months=n_months,
        theme=dict(theme) if theme else dict(THEMES[DEFAULT_THEME_ID]),
    )


def describe_change(kpi: str, current: float | None,
                    yoy: float | None) -> str:
    """One-line auto-generated insight (labelled as generated, not data)."""
    if current is None:
        return f"{kpi}: no data for the selected period."
    value = format_value(kpi, current)
    if yoy is None:
        return (f"{kpi} is {value} for the selected period; no prior-year "
                "period is in the loaded range, so YoY is n/a.")
    direction = "up" if yoy > 0 else ("down" if yoy < 0 else "flat")
    change = format_change(yoy, is_pct_kpi=is_pct_kpi(kpi))
    return (f"{kpi} is {value} for the selected period, {direction} "
            f"{change} year on year.")
