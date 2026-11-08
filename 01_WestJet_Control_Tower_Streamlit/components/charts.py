"""components/charts.py — reusable chart helpers wrapping Plotly.

Line, bar, grouped comparison bar, waterfall and heatmap. All charts take
already-computed frames/values; no KPI logic lives here. Falls back to
Streamlit's built-in charts when Plotly is unavailable.
"""

from __future__ import annotations

import pandas as pd
import streamlit as st

try:
    import plotly.express as px
    import plotly.graph_objects as go
    _HAS_PLOTLY = True
except Exception:  # pragma: no cover - environment without plotly
    px = None
    go = None
    _HAS_PLOTLY = False

NAVY = "#002855"
YELLOW = "#FFC72C"
BLUE = "#2E6EA6"
TEAL = "#0E7C7B"


def line_chart(frame: pd.DataFrame, x: str, y: str, title: str,
               target: float | None = None,
               y_fmt: str | None = None) -> None:
    """Monthly trend line, with an optional workbook-target reference line."""
    if frame is None or len(frame) == 0 or y not in frame.columns:
        st.caption(f"{title}: no data for the selected period.")
        return
    if not _HAS_PLOTLY:
        st.line_chart(frame.set_index(x)[y])
        st.caption(title)
        return
    fig = px.line(frame, x=x, y=y, title=title, markers=True,
                  color_discrete_sequence=[NAVY])
    if target is not None:
        fig.add_hline(y=target, line_dash="dash", line_color=YELLOW,
                      annotation_text="Target")
    fig.update_layout(height=320, margin=dict(l=10, r=10, t=40, b=10),
                      title_font_size=14)
    if y_fmt == "pct":
        fig.update_yaxes(tickformat=".1%")
    st.plotly_chart(fig, width="stretch")


def bar_chart(frame: pd.DataFrame, x: str, y: str, title: str,
              colour: str = BLUE, horizontal: bool = False) -> None:
    """Single-series bar chart (e.g. route ranking, monthly totals)."""
    if frame is None or len(frame) == 0 or y not in frame.columns:
        st.caption(f"{title}: no data for the selected period.")
        return
    if not _HAS_PLOTLY:
        st.bar_chart(frame.set_index(x)[y])
        st.caption(title)
        return
    fig = px.bar(frame, x=x, y=y, title=title, orientation="h" if horizontal
                 else "v", color_discrete_sequence=[colour])
    fig.update_layout(height=320, margin=dict(l=10, r=10, t=40, b=10),
                      title_font_size=14)
    st.plotly_chart(fig, width="stretch")


def grouped_bar_chart(categories: list[str], series: dict[str, list],
                      title: str, y_fmt: str | None = None) -> None:
    """Grouped bars: one bar per series per category (Actual vs Baseline
    vs Simulated on the Outcome page)."""
    if not _HAS_PLOTLY:
        frame = pd.DataFrame(series, index=categories)
        st.bar_chart(frame)
        st.caption(title)
        return
    fig = go.Figure()
    colours = [NAVY, "#8A94A6", YELLOW]
    for (name, values), colour in zip(series.items(), colours):
        fig.add_trace(go.Bar(name=name, x=categories, y=values,
                             marker_color=colour))
    fig.update_layout(barmode="group", title=title, height=320,
                      margin=dict(l=10, r=10, t=40, b=10),
                      title_font_size=14)
    if y_fmt == "pct":
        fig.update_yaxes(tickformat=".1%")
    st.plotly_chart(fig, width="stretch")


def waterfall_chart(labels: list[str], values: list[float],
                    title: str) -> None:
    """Simple waterfall (revenue / cost bridge)."""
    if not _HAS_PLOTLY:
        st.caption(f"{title}: waterfall needs Plotly.")
        return
    measures = ["relative"] * (len(values) - 1) + ["total"]
    fig = go.Figure(go.Waterfall(
        x=labels, y=values, measure=measures,
        increasing=dict(marker=dict(color=TEAL)),
        decreasing=dict(marker=dict(color="#B42318")),
        totals=dict(marker=dict(color=NAVY))))
    fig.update_layout(title=title, height=320,
                      margin=dict(l=10, r=10, t=40, b=10),
                      title_font_size=14)
    st.plotly_chart(fig, width="stretch")


def heatmap_chart(frame: pd.DataFrame, title: str,
                  fmt: str = ".2f") -> None:
    """Matrix heatmap (rows x columns of monthly values)."""
    if frame is None or frame.empty or not _HAS_PLOTLY:
        if frame is not None and not frame.empty:
            st.dataframe(frame.style.background_gradient(cmap="Blues"))
        else:
            st.caption(f"{title}: no data for the selected period.")
        return
    fig = px.imshow(frame, title=title, aspect="auto",
                    color_continuous_scale="Blues", text_auto=fmt)
    fig.update_layout(height=360, margin=dict(l=10, r=10, t=40, b=10),
                      title_font_size=14)
    st.plotly_chart(fig, width="stretch")
