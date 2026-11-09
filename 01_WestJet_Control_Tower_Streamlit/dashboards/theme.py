"""dashboards/theme.py — Theme & Branding (19th page).

Pick one of the 8 starter airline themes or add a custom airline. The
choice lives in session state for the session (``theme_id`` /
``custom_themes``); app.py reads it on every run and injects the theme
CSS, so the header, navigation, buttons, links and KPI-card accents
follow the selected airline immediately.

The workbook data stays WestJet synthetic data whatever the theme — only
the branding changes. Custom themes added here are session-only; to make
one permanent, add a row to the "Airline Themes & Branding" reference
sheet and to the runtime theme files (see 03_Shared/THEME_SYSTEM.md).
"""

from __future__ import annotations

import re

import streamlit as st

from config import (
    DEFAULT_THEME_ID,
    THEMES,
    THEME_SHEET_URL,
    get_theme,
    validate_theme,
)


def _slug(name: str) -> str:
    """URL-safe id from an airline name (lowercase, hyphens)."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")
    return slug or "custom-airline"


def _all_themes() -> dict[str, dict]:
    """Starter themes plus any custom themes from this session."""
    merged = dict(THEMES)
    merged.update(st.session_state.get("custom_themes", {}))
    return merged


def _swatches(theme: dict) -> str:
    """Colour swatch row (HTML) for a theme."""
    cells = ""
    for field in ("primary", "secondary", "accent", "background",
                  "surface", "text"):
        colour = theme.get(field, "#FFFFFF")
        cells += (
            f'<div title="{field}: {colour}" '
            f'style="background:{colour};width:48px;height:32px;'
            f'border:1px solid #D0D5DD;border-radius:4px;"></div>'
        )
    return f'<div style="display:flex;gap:8px;flex-wrap:wrap;">{cells}</div>'


def render(model, ctx) -> None:
    st.subheader("Theme & Branding")
    st.write(
        "Re-skin the control tower with an airline theme. The theme "
        "changes the header, navigation, buttons, links and KPI-card "
        "accents. The data stays WestJet synthetic data — theming "
        "changes branding only, never the numbers."
    )

    themes = _all_themes()
    current_id = st.session_state.get("theme_id", DEFAULT_THEME_ID)
    if current_id not in themes:
        current_id = DEFAULT_THEME_ID
    theme = get_theme(current_id,
                      st.session_state.get("custom_themes", {}))

    st.markdown("### Current theme")
    st.markdown(f"**{theme['airline']}** ({theme['iata']})")
    if theme.get("logo_url"):
        st.image(theme["logo_url"], width=200)
    st.markdown(_swatches(theme), unsafe_allow_html=True)
    st.caption(
        f"Primary {theme['primary']} · Secondary {theme['secondary']} · "
        f"Accent {theme['accent']} · Background {theme['background']} · "
        f"Surface {theme['surface']} · Text {theme['text']}")
    if theme.get("notes"):
        st.caption(theme["notes"])

    st.markdown("### Choose an airline theme")
    options = list(themes)
    labels = {tid: f"{t['airline']} ({t['iata']})"
              for tid, t in themes.items()}
    st.radio(
        "Airline theme",
        options,
        format_func=lambda tid: labels[tid],
        index=options.index(current_id),
        key="theme_id",
    )
    st.caption("The theme applies immediately on every page.")

    st.markdown("### Add a custom airline")
    st.write(
        "Add your own airline theme. Colours must be #RRGGBB hex and the "
        "logo URL must be an http(s) link (a Wikimedia Commons file URL "
        "works well). Custom themes live in session state only — they "
        "disappear when the page reloads."
    )
    with st.form("add_custom_theme"):
        name = st.text_input("Airline name", placeholder="e.g. WestJet")
        iata = st.text_input("IATA code", placeholder="e.g. WS",
                             max_chars=3)
        col1, col2, col3 = st.columns(3)
        primary = col1.color_picker("Primary colour", "#002855")
        secondary = col2.color_picker("Secondary colour", "#0E7C7B")
        accent = col3.color_picker("Accent colour", "#FFC72C")
        col4, col5, col6 = st.columns(3)
        background = col4.color_picker("Background", "#FFFFFF")
        surface = col5.color_picker("Surface", "#F2F4F7")
        text = col6.color_picker("Text", "#1F2937")
        logo_url = st.text_input(
            "Logo URL (optional)",
            placeholder="https://upload.wikimedia.org/…/logo.svg")
        submitted = st.form_submit_button("Add custom airline")
    if submitted:
        candidate = {
            "airline": name.strip(), "iata": iata.strip().upper(),
            "primary": primary, "secondary": secondary,
            "accent": accent, "background": background,
            "surface": surface, "text": text,
            "logo_url": logo_url.strip(),
            "notes": "Custom airline theme added in this session.",
        }
        errors = validate_theme(candidate)
        theme_id = _slug(candidate["airline"])
        customs = st.session_state.setdefault("custom_themes", {})
        if theme_id in THEMES or theme_id in customs:
            errors.append(
                f"An airline theme named {candidate['airline']!r} "
                "already exists.")
        if any(t["iata"].upper() == candidate["iata"]
               for t in themes.values()):
            errors.append(
                f"IATA code {candidate['iata']!r} is already in use.")
        if errors:
            for error in errors:
                st.error(error)
        else:
            customs[theme_id] = candidate
            st.session_state["theme_id"] = theme_id
            st.success(
                f"Added {candidate['airline']} ({candidate['iata']}) — "
                "theme applied.")
            st.rerun()

    customs = st.session_state.get("custom_themes", {})
    if customs:
        st.markdown("### Custom themes (this session)")
        for theme_id, custom in list(customs.items()):
            col_a, col_b = st.columns([4, 1])
            col_a.write(f"{custom['airline']} ({custom['iata']})")
            if col_b.button("Remove", key=f"remove_{theme_id}"):
                del st.session_state["custom_themes"][theme_id]
                if st.session_state.get("theme_id") == theme_id:
                    st.session_state["theme_id"] = DEFAULT_THEME_ID
                st.rerun()

    st.markdown("### Reference sheet")
    if THEME_SHEET_URL:
        st.markdown(
            "The starter themes are also kept in the "
            f"[Airline Themes & Branding]({THEME_SHEET_URL}) Google "
            "Sheet — the human-readable reference for the values the "
            "apps bundle. To add an airline permanently, add a row "
            "there and to the runtime theme files; the in-app form "
            "above is session-only.")
    else:
        st.write(
            "The starter themes are also kept in the “Airline Themes & "
            "Branding” Google Sheet — the human-readable reference for "
            "the values the apps bundle.")
    st.caption(
        "Logos are linked, never stored in the repo: a missing or "
        "unreachable logo falls back to the airline name.")
