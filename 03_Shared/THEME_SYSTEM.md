# Theme System — Airline Themes & Branding

The control tower can be re-skinned with an airline theme. Theming
changes **branding only** — header, navigation, buttons, links, KPI-card
accents, logo and airline name. It never changes the data: the workbook
and every KPI value stay WestJet synthetic data whatever the theme, and
the SYNTHETIC DATA badge and DATA STATUS banner are untouched by theming.

## The 8 starter themes

| Airline | IATA | Primary | Secondary | Accent |
|---|---|---|---|---|
| WestJet (default) | WS | #002855 | #0E7C7B | #FFC72C |
| Air Canada | AC | #E31837 | #1A1A1A | #FF6B6B |
| Emirates | EK | #C8102E | #A67C37 | #D4A017 |
| Qatar Airways | QR | #5C0632 | #7A1E4A | #C9A227 |
| Lufthansa | LH | #05164D | #FFAD00 | #FFAD00 |
| British Airways | BA | #075AAA | #00247D | #CC0000 |
| Delta Air Lines | DL | #003366 | #C01933 | #C01933 |
| Air France | AF | #051039 | #0091D2 | #ED1C24 |

Each theme also carries `background`, `surface` and `text` colours
(mostly white / light grey / dark charcoal, so content stays readable),
a `logo_url` and a short `notes` field. The palettes are
**brand-inspired design choices** for this feature, not official
brand-guideline values — verify against the airline's brand guidelines
before any external use.

## Where the themes live (three copies, kept in sync)

1. **Streamlit app** — the `THEMES` dict in
   `01_WestJet_Control_Tower_Streamlit/config.py` (with `validate_theme`,
   `get_theme` and `theme_css` helpers). The active theme id lives in
   session state (`theme_id`); custom themes in `custom_themes`.
2. **HTML/JS app** — `02_WestJet_Control_Tower_HTML_JS/data/themes.json`,
   loaded at startup by `js/theme.js` (`WJ.theme`). The active theme id
   lives in `localStorage` (`wj-theme-id`); custom themes in
   `localStorage` (`wj-custom-themes`).
3. **Reference sheet** — the “Airline Themes & Branding” Google Sheet
   (see “Reference sheet” below). Human-readable; the apps bundle the
   same values.

All three must carry the same 8 airlines and the same values. After any
change, compare them: read the sheet's Themes tab and diff it against
`config.py` `THEMES` and `data/themes.json` (same column order as the
sheet: Airline | IATA | Primary | Secondary | Accent | Background |
Surface | Text | Logo URL | Notes).

## Theme fields

| Field | Meaning | Rules |
|---|---|---|
| `airline` | Display name | Required, non-empty |
| `iata` | IATA code | Required, 2–3 letters, unique across themes |
| `primary` | Header, nav, buttons, KPI-card accent | Required, #RRGGBB hex |
| `secondary` | Hover states, secondary accents | Required, #RRGGBB hex |
| `accent` | Active navigation, highlights, link hover | Required, #RRGGBB hex |
| `background` | Page background | Required, #RRGGBB hex |
| `surface` | Cards, panels, sidebar | Required, #RRGGBB hex |
| `text` | Headings / body text | Required, #RRGGBB hex |
| `logo_url` | Airline logo | Optional; empty = name-only. Must be http(s) |
| `notes` | Short note | Optional |

Validation lives in `config.validate_theme` (Streamlit) and
`WJ.theme.validateTheme` (HTML/JS) — same rules on both sides. A theme
that fails validation is rejected, never partially applied.

## How a theme is applied

**Streamlit** — `app.py` reads `theme_id` from session state on every
run (default `westjet`), resolves the theme with `get_theme`, and
injects `theme_css(theme)` as a `<style>` block. The header
(`components/status.py:render_header`) shows the logo and airline name;
the KPI-card value colour comes from `ctx.theme` via
`components/kpi_card.py`. Plotly chart series colours stay on the
static WestJet palette — only the chrome (sidebar, header, buttons,
links, KPI values) follows the theme. The Streamlit-native theme in
`.streamlit/config.toml` stays WestJet; it is the fallback before any
theme is applied.

**HTML/JS** — `js/theme.js:applyTheme(id)` sets six CSS custom
properties on `:root` (`--wj-navy` ← primary, `--wj-blue` ← secondary,
`--wj-yellow` ← accent, `--wj-white` ← background,
`--wj-grey-light` ← surface, `--wj-charcoal` ← text) and updates the
header brand (`#brand-name` text and `#brand-logo` src). Every
stylesheet reads those tokens, so the header, nav, buttons, links and
KPI-card top borders follow the theme. Chart.js series colours use the
static `PALETTE` in `js/charts.js` and do not change with the theme.

## The Theme & Branding page (19th page, both apps)

- **Current theme** — name, IATA, logo, colour swatches, hex values.
- **Choose an airline theme** — one card / option per theme; applying
  is immediate on every page.
- **Add a custom airline** — form (name, IATA, primary / secondary /
  accent / background / surface / text, logo URL). Validated with the
  same rules as the starter themes; duplicates (name or IATA) rejected.
- **Reference sheet** — link to the Google Sheet (below).

## Persistence — and its limits

| App | Where a custom theme is stored | Lifetime |
|---|---|---|
| Streamlit | `st.session_state["custom_themes"]` | The browser session only — lost on page reload / new session |
| HTML/JS | `localStorage` (`wj-custom-themes`) | Survives reloads in the same browser; lost if browser data is cleared or on another device |

The selected theme id has the same limits (`theme_id` in session
state; `wj-theme-id` in localStorage). Neither app writes themes back
to the Google Sheet or to the repo.

## Logos — linked, never stored

- Logos are remote URLs only. No logo image files live in the repo
  (keeps the public repo free of trademark binaries).
- Every starter logo URL is a direct `upload.wikimedia.org` link to the
  airline's logo on Wikimedia Commons, verified HTTP 200 with an image
  content-type before use. A logo that cannot be verified is left
  empty — the airline then renders name-only.
- If a logo fails to load at runtime (offline, or the host is
  unreachable), the image hides itself and the airline name remains.
  In the Streamlit app the name text is always rendered next to the
  logo, so a failed image never leaves a blank header.

## Reference sheet

“Airline Themes & Branding” — Google Sheet, two tabs:

- Link: https://docs.google.com/spreadsheets/d/14JMUnluNef0wlNNcdCkZ6YfkUTBgv7JP09qcRKARTzY
  (sheet ID `14JMUnluNef0wlNNcdCkZ6YfkUTBgv7JP09qcRKARTzY`).
- **Themes** — one row per starter airline: Airline | IATA | Primary |
  Secondary | Accent | Background | Surface | Text | Logo URL | Notes.
  Same values as the apps.
- **How to use** — explains that the sheet is the human reference for
  the themes, the apps bundle the same values in their runtime theme
  files, and how to add an airline (add a row here AND use the in-app
  “Add custom airline” form, or edit the runtime theme file).

## How to add an airline (permanent)

1. Add a row to the sheet's Themes tab (all 10 columns; logo URL
   verified on Wikimedia Commons first).
2. Add the same theme to `config.py` `THEMES` (Streamlit) and to
   `data/themes.json` (HTML/JS) with identical values.
3. Add a test row to `tests/test_theme.py` (IATA set) and to
   `tests/test.js` (theme checks) if the airline is a starter theme.
4. Run both suites (Streamlit pytest, `node tests/test.js` +
   `node tests/smoke.js`) and confirm the sheet rows still match the
   runtime data exactly.

## What theming does NOT do

- It does not change any KPI value, target, scenario result or
  validation outcome.
- It does not change the underlying data (still the WestJet synthetic
  workbook).
- It does not imply any relationship with, or endorsement by, the
  airline whose branding is shown. The starter themes are a
  demonstration skin over synthetic data.
