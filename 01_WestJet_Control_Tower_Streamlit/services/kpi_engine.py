"""services/kpi_engine.py — centralised KPI calculation engine.

The ONLY place important KPIs are calculated; UI components never calculate
KPIs themselves. All 18 formulas come from the workbook's KPI_Definitions
sheet (brief section 4). Primary sources are honoured per KPI_Definitions:
- Ancillary Revenue / Passenger uses the Ancillary_Revenue sheet's
  Passengers column (not Passenger_Commercial's — the two differ slightly).
- Aircraft Utilization and AOG Rate use their own sheet's Active Aircraft.
- Dispatch Reliability, Ticket Deflection Rate, Data Quality and Platform
  Availability are PASSTHROUGH input values from their source sheets.

Ticket Deflection Rate note: the workbook states its formula as
"Deflected Tickets / Platform Demand", but neither a "Deflected Tickets"
nor a "Platform Demand" column exists in the workbook, so the ratio cannot
be computed from the available columns. The engine therefore uses the
Data_Platform "Ticket Deflection Rate" input column as a passthrough value
and documents this explicitly here. If those columns are ever added, this
function should compute the ratio instead.

All comparisons work on any selected date range; no year is assumed.
"""

from __future__ import annotations

import pandas as pd

from models.kpi_model import KPI_NAMES


def _safe_div(numerator, denominator):
    """Divide, returning None on a zero / missing denominator."""
    if numerator is None or denominator is None:
        return None
    try:
        if float(denominator) == 0:
            return None
    except (TypeError, ValueError):
        return None
    return float(numerator) / float(denominator)


# --- Scalar KPI functions (one per KPI, named calculate_*) ---------------

def calculate_load_factor(rpm, asm):
    """Load Factor = RPM / ASM."""
    return _safe_div(rpm, asm)


def calculate_rask(passenger_revenue, asm):
    """RASK = Passenger Revenue / ASM."""
    return _safe_div(passenger_revenue, asm)


def calculate_casm(operating_cost, asm):
    """CASM = Operating Cost / ASM."""
    return _safe_div(operating_cost, asm)


def calculate_yield(passenger_revenue, rpm):
    """Yield = Passenger Revenue / RPM."""
    return _safe_div(passenger_revenue, rpm)


def calculate_d0(on_time_departures, departures):
    """D0 = On-Time Departures / Departures."""
    return _safe_div(on_time_departures, departures)


def calculate_d15(d15_departures, departures):
    """D15 = D15 Departures / Departures."""
    return _safe_div(d15_departures, departures)


def calculate_aircraft_utilization(block_hours, active_aircraft):
    """Aircraft Utilization = Block Hours / Active Aircraft."""
    return _safe_div(block_hours, active_aircraft)


def calculate_dispatch_reliability(dispatch_reliability):
    """Dispatch Reliability = MRO_TechOps input value (passthrough)."""
    return None if dispatch_reliability is None else float(dispatch_reliability)


def calculate_maintenance_cost_per_flight_hour(maintenance_cost, block_hours):
    """Maintenance Cost / Flight Hour = Maintenance Cost / Block Hours."""
    return _safe_div(maintenance_cost, block_hours)


def calculate_aog_rate(aog_events, active_aircraft):
    """AOG Rate = AOG Events / Active Aircraft (MRO sheet's aircraft)."""
    return _safe_div(aog_events, active_aircraft)


def calculate_baggage_mishandling_rate(mishandled_bags, bags_handled):
    """Baggage Mishandling Rate = Mishandled Bags / Bags Handled."""
    return _safe_div(mishandled_bags, bags_handled)


def calculate_cargo_yield(cargo_revenue, cargo_tonnes):
    """Cargo Yield = Cargo Revenue / Cargo Tonnes."""
    return _safe_div(cargo_revenue, cargo_tonnes)


def calculate_operating_margin(total_revenue, operating_cost):
    """Operating Margin = (Total Revenue - Operating Cost) / Total Revenue."""
    if total_revenue is None or operating_cost is None:
        return None
    return _safe_div(float(total_revenue) - float(operating_cost),
                     total_revenue)


def calculate_ancillary_revenue_per_passenger(ancillary_revenue, passengers):
    """Ancillary Revenue / Passenger (Ancillary_Revenue sheet passengers)."""
    return _safe_div(ancillary_revenue, passengers)


def calculate_ticket_deflection_rate(ticket_deflection_rate):
    """Ticket Deflection Rate = Data_Platform input column (passthrough).

    The stated formula "Deflected Tickets / Platform Demand" cannot be
    computed: the workbook has no Deflected Tickets or Platform Demand
    column. See the module docstring.
    """
    return None if ticket_deflection_rate is None else float(ticket_deflection_rate)


def calculate_data_quality(data_quality_pct):
    """Data Quality = Data_Platform "Data Quality %" (passthrough)."""
    return None if data_quality_pct is None else float(data_quality_pct)


def calculate_platform_availability(platform_availability_pct):
    """Platform Availability = Data_Platform input column (passthrough)."""
    return None if platform_availability_pct is None \
        else float(platform_availability_pct)


def calculate_data_product_adoption(active_products, registered_products):
    """Data Product Adoption = Active Data Products / Registered Products."""
    return _safe_div(active_products, registered_products)


def calculate_total_revenue(passenger_revenue, cargo_revenue,
                            ancillary_revenue, other_revenue):
    """Total Revenue = Passenger + Cargo + Ancillary + Other Revenue."""
    parts = [passenger_revenue, cargo_revenue, ancillary_revenue,
             other_revenue]
    if any(p is None for p in parts):
        return None
    return float(sum(parts))


# --- Monthly KPI frame -----------------------------------------------------

# (KPI name, source domain, source column) for passthrough / extra KPIs.
def compute_kpis_for_month(row: dict) -> dict[str, float | None]:
    """Compute all 18 KPIs from one merged monthly row (dict of values)."""
    total_revenue = calculate_total_revenue(
        row.get("Passenger Revenue"), row.get("Cargo Revenue"),
        row.get("Ancillary Revenue"), row.get("Other Revenue"))
    return {
        "Load Factor": calculate_load_factor(row.get("RPM"), row.get("ASM")),
        "RASK": calculate_rask(row.get("Passenger Revenue"), row.get("ASM")),
        "CASM": calculate_casm(row.get("Operating Cost"), row.get("ASM")),
        "Yield": calculate_yield(row.get("Passenger Revenue"), row.get("RPM")),
        "D0": calculate_d0(row.get("On-Time Departures"), row.get("Departures")),
        "D15": calculate_d15(row.get("D15 Departures"), row.get("Departures")),
        "Aircraft Utilization": calculate_aircraft_utilization(
            row.get("Block Hours"), row.get("Active Aircraft")),
        "Dispatch Reliability": calculate_dispatch_reliability(
            row.get("Dispatch Reliability")),
        "Maintenance Cost / Flight Hour":
            calculate_maintenance_cost_per_flight_hour(
                row.get("Maintenance Cost"), row.get("Block Hours")),
        "AOG Rate": calculate_aog_rate(row.get("AOG Events"),
                                       row.get("Active Aircraft_mro")),
        "Baggage Mishandling Rate": calculate_baggage_mishandling_rate(
            row.get("Mishandled Bags"), row.get("Bags Handled")),
        "Cargo Yield": calculate_cargo_yield(row.get("Cargo Revenue_cargo"),
                                             row.get("Cargo Tonnes")),
        "Operating Margin": calculate_operating_margin(
            total_revenue, row.get("Operating Cost")),
        "Ancillary Revenue / Passenger":
            calculate_ancillary_revenue_per_passenger(
                row.get("Ancillary Revenue_anc"),
                row.get("Passengers_anc")),
        "Ticket Deflection Rate": calculate_ticket_deflection_rate(
            row.get("Ticket Deflection Rate")),
        "Data Quality": calculate_data_quality(row.get("Data Quality %")),
        "Platform Availability": calculate_platform_availability(
            row.get("Platform Availability %")),
        "Data Product Adoption": calculate_data_product_adoption(
            row.get("Active Data Products"),
            row.get("Registered Data Products")),
    }


def compute_kpi_frame(model) -> pd.DataFrame:
    """Monthly KPI frame for the whole model period (KPI_Calculated).

    Merges the domain frames on Month, honouring each KPI's Primary Source
    (suffixes keep the MRO / Ancillary / Cargo copies of shared columns
    separate). Total Revenue is computed; it has no source column.
    """
    d = model.domains
    merged = d["flight_operations"].copy()
    merged = merged.merge(
        d["mro"][["Month", "Active Aircraft", "Dispatch Reliability",
                  "AOG Events", "Maintenance Cost"]],
        on="Month", suffixes=("", "_mro"))
    merged = merged.merge(
        d["revenue"][["Month", "Passenger Revenue", "Cargo Revenue",
                      "Ancillary Revenue", "Other Revenue"]],
        on="Month", suffixes=("", "_rev"))
    merged = merged.merge(d["finance"][["Month", "Operating Cost"]],
                          on="Month")
    merged = merged.merge(
        d["baggage"][["Month", "Bags Handled", "Mishandled Bags"]],
        on="Month")
    merged = merged.merge(
        d["cargo"][["Month", "Cargo Tonnes", "Cargo Revenue"]],
        on="Month", suffixes=("", "_cargo"))
    merged = merged.merge(
        d["ancillary"][["Month", "Passengers", "Ancillary Revenue"]],
        on="Month", suffixes=("", "_anc"))
    # "Passengers" here is the Ancillary_Revenue sheet's column (the
    # Passenger_Commercial sheet is not merged into the KPI frame); rename
    # it so the KPI function reads the documented Primary Source.
    merged = merged.rename(columns={"Passengers": "Passengers_anc"})
    merged = merged.merge(
        d["data_platform"][["Month", "Ticket Deflection Rate",
                            "Data Quality %", "Platform Availability %"]],
        on="Month")
    merged = merged.merge(
        d["ai_products"][["Month", "Registered Data Products",
                          "Active Data Products"]],
        on="Month")

    rows = []
    for _, r in merged.iterrows():
        row = r.to_dict()
        kpis = compute_kpis_for_month(row)
        # Total Revenue from the Revenue_Management components (its own
        # sheet). Note the Ancillary_Revenue / Cargo sheets carry slightly
        # different revenue figures for the same month; each KPI uses its
        # documented Primary Source (see validator quirks).
        total_revenue = calculate_total_revenue(
            row.get("Passenger Revenue"), row.get("Cargo Revenue"),
            row.get("Ancillary Revenue"), row.get("Other Revenue"))
        rows.append({
            "Month": row["Month"],
            "Total Revenue": total_revenue,
            "ASM": row.get("ASM"),
            "RPM": row.get("RPM"),
            "Operating Cost": row.get("Operating Cost"),
            **kpis,
        })
    frame = pd.DataFrame(rows)
    # Keep the workbook KPI_Calculated column order first, then the rest.
    ordered = ["Month", "Total Revenue", "ASM", "RPM", "Operating Cost"] \
        + KPI_NAMES
    return frame[ordered] if len(frame) else pd.DataFrame(columns=ordered)


# --- Time intelligence -----------------------------------------------------

def filter_period(frame: pd.DataFrame, start, end) -> pd.DataFrame:
    """Rows with Month in [start, end] (inclusive)."""
    mask = (frame["Month"] >= pd.to_datetime(start)) & \
           (frame["Month"] <= pd.to_datetime(end))
    return frame.loc[mask].copy()


def aggregate_inputs(model, start, end) -> dict:
    """Sum/mean the raw inputs over [start, end] for KPI recomputation.

    Flow/volume columns are summed; Cash Position is the last month's value
    (a stock, not a flow); rates are recomputed from the summed inputs by
    the caller, never averaged.
    """
    def _sum(domain, column):
        frame = filter_period(model.domains[domain], start, end)
        return float(frame[column].sum()) if len(frame) else 0.0

    def _mean(domain, column):
        frame = filter_period(model.domains[domain], start, end)
        return float(frame[column].mean()) if len(frame) else None

    def _last(domain, column):
        frame = filter_period(model.domains[domain], start, end)
        return float(frame[column].iloc[-1]) if len(frame) else None

    pax_rev = _sum("revenue", "Passenger Revenue")
    cargo_rev = _sum("revenue", "Cargo Revenue")
    anc_rev = _sum("revenue", "Ancillary Revenue")
    other_rev = _sum("revenue", "Other Revenue")
    return {
        "ASM": _sum("flight_operations", "ASM"),
        "RPM": _sum("flight_operations", "RPM"),
        "Block Hours": _sum("flight_operations", "Block Hours"),
        "Departures": _sum("flight_operations", "Departures"),
        "On-Time Departures": _sum("flight_operations", "On-Time Departures"),
        "D15 Departures": _sum("flight_operations", "D15 Departures"),
        "Active Aircraft": _mean("flight_operations", "Active Aircraft"),
        "Passenger Revenue": pax_rev,
        "Cargo Revenue": cargo_rev,
        "Ancillary Revenue": anc_rev,
        "Other Revenue": other_rev,
        "Total Revenue": pax_rev + cargo_rev + anc_rev + other_rev,
        "Operating Cost": _sum("finance", "Operating Cost"),
        "Labour Cost": _sum("finance", "Labour Cost"),
        "Fuel Cost": _sum("finance", "Fuel Cost"),
        "Other Operating Cost": _sum("finance", "Other Operating Cost"),
        "Cash Position": _last("finance", "Cash Position"),
        "Maintenance Cost": _sum("mro", "Maintenance Cost"),
        "AOG Events": _sum("mro", "AOG Events"),
        "Active Aircraft_mro": _mean("mro", "Active Aircraft"),
        "Dispatch Reliability": _mean("mro", "Dispatch Reliability"),
        "Bags Handled": _sum("baggage", "Bags Handled"),
        "Mishandled Bags": _sum("baggage", "Mishandled Bags"),
        "Cargo Tonnes": _sum("cargo", "Cargo Tonnes"),
        "Cargo Revenue_cargo": cargo_rev,
        "Passengers": _sum("passenger", "Passengers"),
        "Passengers_anc": _sum("ancillary", "Passengers"),
        "Ancillary Revenue_anc": anc_rev,
        "Ticket Deflection Rate": _mean("data_platform",
                                        "Ticket Deflection Rate"),
        "Data Quality %": _mean("data_platform", "Data Quality %"),
        "Platform Availability %": _mean("data_platform",
                                         "Platform Availability %"),
        "Active Data Products": _sum("ai_products", "Active Data Products"),
        "Registered Data Products": _sum("ai_products",
                                         "Registered Data Products"),
        "n_months": len(filter_period(model.domains["calendar"], start, end)),
    }


def aggregate_kpis(model, start, end) -> dict[str, float | None]:
    """KPIs recomputed from summed inputs over [start, end]."""
    inputs = aggregate_inputs(model, start, end)
    kpis = compute_kpis_for_month(inputs)
    kpis["Total Revenue"] = inputs["Total Revenue"]
    kpis["Operating Cost"] = inputs["Operating Cost"]
    kpis["Cash Position"] = inputs["Cash Position"]
    kpis["Passengers"] = inputs["Passengers"]
    kpis["ASM"] = inputs["ASM"]
    return kpis


def prior_month(model, month) -> pd.Timestamp | None:
    """The month before `month`, if present in the data."""
    month = pd.to_datetime(month).to_period("M").to_timestamp()
    cal = model.domains["calendar"]["Month"]
    earlier = cal[cal < month]
    return earlier.max() if len(earlier) else None


def prior_year_month(model, month) -> pd.Timestamp | None:
    """The same month one year earlier, if present in the data."""
    month = pd.to_datetime(month).to_period("M").to_timestamp()
    target = month - pd.DateOffset(years=1)
    cal = model.domains["calendar"]["Month"]
    return target if target in set(cal) else None


def ytd_range(model, end) -> tuple[pd.Timestamp, pd.Timestamp]:
    """(1 Jan of end's year, end) — works for any year in the data."""
    end = pd.to_datetime(end).to_period("M").to_timestamp()
    return pd.Timestamp(year=end.year, month=1, day=1), end


def rolling_12m(frame: pd.DataFrame, value_column: str) -> pd.Series:
    """Rolling 12-month sum of a monthly flow column."""
    ordered = frame.sort_values("Month")
    return ordered[value_column].rolling(window=12, min_periods=1).sum()


def aggregate_by_period(frame: pd.DataFrame, freq: str) -> pd.DataFrame:
    """Monthly / quarterly / annual aggregation of a monthly frame.

    freq: "M" (monthly), "Q" (quarterly), "Y" (annual). Numeric columns
    are summed; Month is the period start.
    """
    ordered = frame.sort_values("Month").copy()
    ordered["Period"] = ordered["Month"].dt.to_period(
        {"M": "M", "Q": "Q", "Y": "A"}[freq]).dt.to_timestamp()
    numeric = ordered.select_dtypes(include="number").columns.tolist()
    return ordered.groupby("Period", as_index=False)[numeric].sum() \
        .rename(columns={"Period": "Month"})


def variance_to_target(value, target):
    """Relative variance to target, or None if either is missing/zero."""
    if value is None or target in (None, 0):
        return None
    return (float(value) - float(target)) / abs(float(target))
