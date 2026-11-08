"""dashboards/network.py — Network / Route Profitability dashboard.

Route-level ranking from model.route_aggregates() (route-month grain,
8 routes). Route Load Factor is not computable — Network_Routes carries
no ASM/RPM columns — so it is never displayed.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

from components.charts import bar_chart
from components.tables import csv_download_button
from config import PageContext
from dashboards import (
    not_available_note,
    page_title,
    period_caption,
)


def render(model, ctx: PageContext) -> None:
    page_title("Network / Route Profitability",
               "Route-level ranking by profitability")
    period_caption(ctx)

    net = model.filter_period("network", ctx.start, ctx.end)
    route_filter = ctx.filters.get("route", "All routes")
    if route_filter != "All routes":
        st.info(f"Route filter active: {route_filter} — ranking below is "
                "shown for that route only; clear the filter for all routes.")
        net = net[net["Route"] == route_filter]
    if len(net) == 0:
        st.caption("No route records for the selected period.")
        return

    agg = net.groupby("Route", as_index=False).agg(
        Flights=("Flights", "sum"),
        Passengers=("Passengers", "sum"),
        Route_Revenue=("Route Revenue", "sum"),
        Route_Cost=("Route Cost", "sum"),
    )
    agg["Route_Profit"] = agg["Route_Revenue"] - agg["Route_Cost"]
    agg["Margin"] = agg["Route_Profit"] / agg["Route_Revenue"]
    agg["Revenue_per_Flight"] = agg["Route_Revenue"] / agg["Flights"]
    agg["Cost_per_Flight"] = agg["Route_Cost"] / agg["Flights"]
    agg["Revenue_Share"] = agg["Route_Revenue"] / agg["Route_Revenue"].sum()
    agg = agg.sort_values("Route_Profit", ascending=False).reset_index(
        drop=True)
    agg.insert(0, "Rank", agg.index + 1)

    st.subheader("Route ranking — by Route Profit")
    st.dataframe(agg, width="stretch")
    csv_download_button("Download route ranking (CSV)", agg,
                        "route_ranking.csv")

    col1, col2 = st.columns(2)
    with col1:
        bar_chart(agg, "Route", "Route_Profit",
                  "Route Profit by route", colour="#0E7C7B")
    with col2:
        bar_chart(agg, "Route", "Route_Revenue",
                  "Route Revenue by route", colour="#002855")

    top = agg.iloc[0]
    bottom = agg.iloc[-1]
    st.info(f"Most profitable route in the selected period: "
            f"{top['Route']} (${top['Route_Profit']:,.0f} profit, "
            f"margin {top['Margin']:.1%}). Least profitable: "
            f"{bottom['Route']} (${bottom['Route_Profit']:,.0f} profit, "
            f"margin {bottom['Margin']:.1%}). Route Contribution is shown "
            f"as Revenue Share (route revenue ÷ total route revenue).")

    st.subheader("Route detail — monthly records")
    detail = net.copy()
    detail["Month"] = pd.to_datetime(detail["Month"]).dt.strftime("%Y-%m")
    st.dataframe(detail, width="stretch", height=320)
    csv_download_button("Download route detail (CSV)", detail,
                        "route_detail.csv")
    not_available_note(
        ["Route Load Factor"],
        "Network_Routes carries no ASM/RPM columns, so a route Load "
        "Factor cannot be computed.")
