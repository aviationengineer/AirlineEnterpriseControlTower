"""Theme tests: the starter themes are complete and valid, the default
is WestJet, custom-add validation rejects bad input, and the Theme &
Branding page renders and applies a selected theme (header + CSS)."""

import sys
from pathlib import Path

import pytest

PACKAGE_DIR = Path(__file__).resolve().parent.parent
if str(PACKAGE_DIR) not in sys.path:
    sys.path.insert(0, str(PACKAGE_DIR))

from streamlit.testing.v1 import AppTest  # noqa: E402

from config import (  # noqa: E402
    DEFAULT_THEME_ID,
    THEMES,
    THEME_FIELDS,
    get_theme,
    theme_css,
    validate_theme,
)

APP = str(PACKAGE_DIR / "app.py")
TIMEOUT = 120


def test_starter_themes_present():
    """8 starter airlines, WestJet first and the default."""
    assert len(THEMES) == 8
    assert DEFAULT_THEME_ID == "westjet"
    assert list(THEMES)[0] == "westjet"
    assert {t["iata"] for t in THEMES.values()} == {
        "WS", "AC", "EK", "QR", "LH", "BA", "DL", "AF"}


def test_every_theme_has_all_fields_and_valid_values():
    """Every starter theme carries all fields, valid hex colours and a
    usable logo URL (empty = name-only fallback)."""
    for theme_id, theme in THEMES.items():
        assert validate_theme(theme) == [], f"{theme_id}: {theme}"
        for field in THEME_FIELDS:
            assert field in theme, f"{theme_id} missing {field}"
        assert theme["logo_url"] == "" or theme["logo_url"].startswith(
            "https://upload.wikimedia.org/"), theme_id


def test_validate_theme_rejects_bad_hex():
    bad = dict(THEMES["westjet"], primary="navy")
    errors = validate_theme(bad)
    assert any("primary" in e for e in errors)
    bad2 = dict(THEMES["westjet"], accent="#FFC72")
    assert any("accent" in e for e in validate_theme(bad2))


def test_validate_theme_rejects_bad_url_and_iata():
    bad = dict(THEMES["westjet"], logo_url="ftp://example.com/logo.svg")
    assert any("logo URL" in e for e in validate_theme(bad))
    bad2 = dict(THEMES["westjet"], iata="W")
    assert any("IATA" in e for e in validate_theme(bad2))
    bad3 = dict(THEMES["westjet"], iata="W3ST")
    assert any("IATA" in e for e in validate_theme(bad3))
    bad4 = {k: v for k, v in THEMES["westjet"].items() if k != "primary"}
    assert any("primary" in e for e in validate_theme(bad4))


def test_get_theme_falls_back_to_westjet():
    assert get_theme("emirates")["airline"] == "Emirates"
    assert get_theme("no-such-theme")["airline"] == "WestJet"
    assert get_theme(None)["airline"] == "WestJet"
    custom = {"my-airline": dict(THEMES["westjet"], airline="My Airline",
                                 iata="MY")}
    assert get_theme("my-airline", custom)["airline"] == "My Airline"


def test_theme_css_carries_the_theme_colours():
    css = theme_css(THEMES["emirates"])
    assert "#C8102E" in css  # Emirates primary
    assert "#A67C37" in css  # Emirates secondary
    assert "#D4A017" in css  # Emirates accent
    assert "Emirates" in css


def test_theme_page_renders_and_lists_all_themes():
    """Theme & Branding page renders with no exceptions and lists the
    starter airlines."""
    at = AppTest.from_file(APP)
    at.session_state["nav_page"] = "Theme & Branding"
    at.run(timeout=TIMEOUT)
    assert list(at.exception) == []
    text = " ".join(str(m.value) for m in at.markdown)
    assert "WestJet" in text  # current theme shown on the page
    assert "Add a custom airline" in text
    # The picker itself is a radio widget: all 8 starter themes offered.
    assert len(at.radio) >= 1
    options = list(at.radio[0].options)
    assert len(options) == 8
    assert "WestJet (WS)" in options and "Emirates (EK)" in options


def test_selecting_a_theme_changes_header_and_css():
    """Emirates selected via session state: the header shows Emirates and
    the injected CSS carries the Emirates primary colour."""
    at = AppTest.from_file(APP)
    at.session_state["nav_page"] = "Executive Overview"
    at.session_state["theme_id"] = "emirates"
    at.run(timeout=TIMEOUT)
    assert list(at.exception) == []
    text = " ".join(str(m.value) for m in at.markdown)
    assert "EMIRATES" in text
    assert "#C8102E" in text  # injected theme CSS


def test_custom_theme_in_session_state_renders():
    """A custom theme stored in session state renders on the page."""
    custom = {
        "airline": "Test Airways", "iata": "TA",
        "primary": "#123456", "secondary": "#654321",
        "accent": "#ABCDEF", "background": "#FFFFFF",
        "surface": "#F2F4F7", "text": "#1F2937",
        "logo_url": "", "notes": "Test theme.",
    }
    assert validate_theme(custom) == []
    at = AppTest.from_file(APP)
    at.session_state["nav_page"] = "Theme & Branding"
    at.session_state["theme_id"] = "test-airways"
    at.session_state["custom_themes"] = {"test-airways": custom}
    at.run(timeout=TIMEOUT)
    assert list(at.exception) == []
    text = " ".join(str(m.value) for m in at.markdown)
    assert "Test Airways" in text
