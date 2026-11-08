# Wireframe Analysis — Enterprise Control Tower (UX / Interaction Reference Only)

> **Status:** UX/interaction reference only. This document describes *patterns* found in the
> wireframe file `~/workspace/user/files/PowerBI_Enterprise_Control_Tower_Wireframe_values__2__-_Copy.html`
> (single self-contained HTML file, Chart.js 4.4.1 via CDN, ~116 KB, 2,095 lines).
> It deliberately reproduces **no** source branding, **no** hard-coded KPI values, and **no**
> datasets from the wireframe. KPI figures, route names, initiative names/values, and the
> wireframe's monthly series are **not** carried over — only the structure, controls, and
> interaction logic are recorded, so the WestJet build can reuse the *ideas* and discard the
> *content*.
>
> Source of truth for the build remains `COORDINATOR_BRIEF.md`. Where this wireframe
> conflicts with the brief, §10 lists the conflict and the brief wins.

---

## 1. Pages / navigation structure

**8 pages, single-page app.** Only one page is visible at a time; pages are `<div class="pbi-page">`
blocks toggled by an `active` class. Navigation is a bottom tab strip (Power BI report-page tabs),
not the left-side nav the brief specifies (§16).

| # | Page id | Tab label (wireframe) | Wireframe subtitle / role |
|---|---------|----------------------|---------------------------|
| 1 | `pg-overview` | Overview (default/active on load) | Executive summary — KPI card grid |
| 2 | `pg-passenger` | Passenger | "P1 — Passenger Dashboard" |
| 3 | `pg-people` | People | "P2 — People Dashboard" |
| 4 | `pg-planes` | Planes | "P3 — Planes Dashboard" |
| 5 | `pg-performance` | Performance | "P4 — Performance Dashboard" |
| 6 | `pg-group` | Group | "P5 — Group Dashboard" |
| 7 | `pg-simulator` | Simulator | Scenario Simulator |
| 8 | `pg-outcome` | Outcome | Scenario Outcome |

**How navigation works**

- Tab strip at the bottom of the canvas: one `.pbi-tab` per page (`data-page` + `onclick="activatePage('<id>')"`),
  plus a trailing "+" tab (decorative — no handler, adds no page).
- `activatePage(id)` removes `active` from all pages/tabs, adds it to the selected page/tab, updates
  the workspace subtitle text (`#workspace-sub`, e.g. "KPI Overview — Executive Summary"), and
  re-initialises that page's charts after a short delay (`setTimeout(..., 20)` — charts are built
  lazily on first visit, not all up front).
- A second navigation path exists: the Simulator page has a **"VIEW OUTCOME →"** button that calls
  `activatePage('outcome')`. No other cross-page links exist.
- The Overview cards carry small "go to dashboard" captions (e.g. a card labelled as the P1/P2/P3
  dashboard) and ⋮ / ⤢ icons, but those are **decorative — no click handlers**. There is no
  KPI → domain → detail drill-down in the wireframe (see §8).
- The file also renders a fake Power BI chrome around the canvas: a top ribbon (File / Home / Insert /
  Modeling / View / Optimize / Help), a workspace title bar, and a right-hand "Visualizations + Fields"
  pane. All of it is static decoration; none of it is functional. **Do not reproduce the Power BI
  chrome** — the brief (§16–17) wants a WestJet control-tower shell with left-side navigation.

**Page ordering quirk:** the tab order is Overview, Passenger, People, Planes, Performance, Group,
Simulator, Outcome — i.e. domain pages are numbered P1–P5 in a "rebound phase" framing (Passenger,
People, Planes, Performance, Group) that does not match the brief's 18-page structure (§9).

---

## 2. KPI cards

### Overview page — 12 cards in 4 flex rows (3 per row)

Each card (`.vc`, "visual card") follows the same anatomy, top to bottom:

1. **Title** — short KPI name (some titles combine two measures, e.g. a "vs" pair or a KPI plus a
   related margin).
2. **Headline value** — one large number, the card's current-period figure.
3. **Delta line** — a ▲/▼ arrow plus a comparison (vs a prior month, vs prior year, vs peak, or a
   forward-looking note). Direction colouring is semantic: green for favourable, red for adverse
   (the wireframe hard-codes which direction is "good" per card — e.g. a fall in a cost-type
   measure is shown green).
4. **Mini trend chart** — a small Chart.js canvas at the foot of the card (line or bar, axes and
   legend hidden, tooltips disabled — see §7).
5. **Card chrome** — a coloured top border, a ⋮ menu icon and a ⤢ expand icon (both decorative),
   and on some cards a footer caption naming the dashboard the card "belongs" to.

The 12 Overview cards, by category (see §4 for the category mapping):

| Card (pattern) | Category | Chart pattern |
|---|---|---|
| Unit-revenue vs unit-cost pair (two lines) | Revenue | Line, 2 series (solid + dashed) |
| Operating cost / profit (actual + forward bars) | Cost | Grouped bar, actual + forward series |
| Capacity / flights (actual + forward bars) | Ops | Grouped bar, actual + forward series |
| Passenger volume (RPK line) | Revenue | Line, 1 series |
| Seat load factor | Ops | Line — **no source data** (mock, see below) |
| Cargo revenue (line) | Revenue | Line, 1 series |
| Active fleet (aircraft count bars) | Ops | Bar, threshold-coloured |
| Fuel benchmark price (actual + forward line) | Cost | Line, solid actual + dashed forward |
| Punctuality (OTP line) | Ops | Line, 1 series |
| Cash position | Cost | **No source data** (mock) |
| Customer score (NPS) | Revenue | **No source data** (mock, headline shows "TBC") |
| Headcount | People | Bar, threshold-coloured |

**"No source data" pattern (important, reusable):** cards whose series is absent are rendered by
`applyMockOverlay()` — the chart area is greyed with a ⊘ "No source data" overlay, the headline is
replaced with "TBC", and the delta line is emptied. The card keeps its place in the grid. This is a
good pattern to adopt for the WestJet build (missing/failed data must be shown, never silently
blank — brief §19–20), but the WestJet version must distinguish *no data in the workbook* from
*validation failure* and surface the validation message.

**What each card does NOT show (vs brief §8):** no previous-period value alongside the headline, no
YoY % on the card face (only a free-text delta), no target value, no variance-to-target, and no
status indicator (no Healthy/Warning/Critical badge). The delta line is a single free-text string,
not a structured comparison. The brief's Executive Overview cards require current value, previous
period, YoY %, target, variance to target, mini trend, and status — the wireframe supplies only
value + delta + mini trend, so the card component must be extended, not copied.

### Domain pages — KPI card grids + one table/chart section

- **Passenger (P1):** 15 KPI cards in a grid (booking intake, forward load factor, book-to-cancel
  ratio, cancellation rate, corporate retention, direct channel share, advance purchase ratio, new
  booking pace, unit revenue, passenger unit revenue, revenue load factor, yield, ancillary per
  passenger, OTP, customer satisfaction) + a "Route Profitability — Top & Bottom 5" ranked list
  (two ranked lists of five routes each with a margin %) + a "CSAT (Post-Flight)" card + an
  "Initiative List & KPI Tracker" table (see below).
- **People (P2):** 7 KPI cards (crew recency compliance, SIM & CBT completions, voluntary leave
  rate, open critical vacancies, sentiment index, comms reach score, training pipeline fill) +
  a "Headcount vs Plan — Waterfall" panel that contains only a placeholder label ("Waterfall
  Visual") — **no waterfall is actually drawn**.
- **Planes (P3):** 6 KPI cards (fleet utilisation, AOG events, OTP controllable, fleet
  reactivation, fleet vs plan, heavy maintenance cost vs plan) + a "Fleet Reactivation Timeline"
  panel that contains only a placeholder label ("Line Chart — Fleet Recovery Curve") — **no line
  chart is actually drawn**.
- **Performance (P4):** 12 KPI cards (cash runway, cost reduction vs target, fuel hedge coverage,
  weekly cash burn, unit cost, fuel cost per ASK, EBITDA margin, net debt/EBITDA, unrestricted
  cash, route profitability, operating cost reduction, revenue per employee) + an Initiative table.
- **Group (P5):** 4 KPI cards (subsidiary cash burn, non-aviation revenue pipeline, group revenue
  recovery, subsidiary EBITDA) + a right-hand filter panel (see §3).

**Initiative tables (Passenger + Performance):** a static HTML table — columns `# | Initiative |
Priority | KPI | Est. Value`. Passenger lists 9 of a claimed 10 initiatives (one id is skipped in
the sequence); Performance lists 6 of a claimed 10. Rows are hard-coded HTML, not data-bound, and
there is no sorting, filtering, or drill-down. Pattern worth keeping: *initiatives tied to a KPI
and an estimated value*; implementation must be data-driven (workbook or a defined list), not
hard-coded rows.

**Delta semantics on domain cards:** each card shows one delta with ▲/▼ and a unit-appropriate
change (%, pp, x, days, currency, points). As on Overview, "good" vs "bad" direction is decided
per card in the markup, not by a rule — the WestJet build needs a per-KPI direction rule in the
KPI dictionary (brief §4/§8) so colouring is computed, not hand-set.

---

## 3. Global filters / slicers

There is **no true global filter bar**. Filtering is split across three unrelated mechanisms, all
of which only affect the Overview page's charts (domain pages ignore them):

### (a) Top slicer bar (Overview only)
A horizontal bar above the Overview grid containing, left to right:

- **From / To month selectors** (`#sel-from`, `#sel-to`) — two `<select>` dropdowns over a fixed
  24-month axis (Jan of year 1 → Dec of year 2). Changing either fires `applyPeriodFilter()`:
  it clamps From ≤ To (if From > To, To is forced equal to From), stores the index range, syncs
  the year chips (below), and rebuilds all charts (`rebuildCharts()` — destroys every Chart.js
  instance and re-runs `initCharts` for the active page).
- **View chips** — three mutually exclusive buttons: **Actual** (default, active), **vs Plan**
  (rendered disabled, `title="Coming soon — not yet available"`, no handler), **vs LY** (active
  comparison mode). See §8 for `vs LY` behaviour.
- **vs LY legend bar** (`#vsly-legend`) — hidden by default; shown only in vs LY mode, explaining
  the grey dashed prior-year series.

### (b) Right-hand filter panel (Group page only, "Filters" pane)
- **Year** — two single-select chips: "YTD [year 2]" (checked by default) and "[year 1]".
  `setYearFilter()` sets the From/To range to the full year (year 1) or the year-2 range, resets
  the view to Actual, and rebuilds charts. Note it only exists on the Group page even though it
  drives the same global range variables.
- **Region** — "coming soon": options listed (All Regions + three regions) but non-functional.
- **Fleet Type** — "coming soon": options listed (All Types + three types) but non-functional.
- **Data Source** — static text only ("Live feed · [date]", "Refresh: Every 15 min"). Not a filter.

### (c) What is missing vs brief §6
No Year / Quarter / Month filter beyond the two month dropdowns; no Domain, KPI Category (that is
a separate toggle, §4), Actual/Plan/Forecast selector that works (vs Plan is disabled; there is no
Forecast anywhere); no Route, Airport, Aircraft, Fleet, or Geography filter (Region/Fleet Type are
dead "coming soon" labels); **no Reset Filters button anywhere**. Filters do not propagate to
domain pages, the Simulator, or the Outcome page. The WestJet build must implement the brief's
full filter set as genuinely global (every applicable visual responds) with a Reset Filters control.

**Data-range model in the wireframe (for contrast, not adoption):** the axis is a fixed 24-month
window; actual data covers only the first 15 months and the remaining 9 are `null` (rendered as
gaps / ghost bars — see §7). The app boots to the year-2 range. The brief (§1) requires a dynamic
date range detected from the workbook (2–5 years, no hard-coded years) — the wireframe's fixed
24-month axis and hard-coded year labels are exactly what must *not* be copied.

---

## 4. KPI-category toggles

**Location:** right-hand "Visualizations + Fields" pane, section titled "KPI Categories" (the pane
itself is fake Power BI chrome, but the toggle control inside it is functional).

**Categories (4 only):** Revenue, Cost, Operational ("ops"), People. Each is a list item
(`.kpi-filter-btn`, `data-cat`) that starts in the `active` state.

**How show/hide works** (`toggleKpiCat` + `KPI_CAT_MAP`):

- A static map links each category to the Overview card canvas ids belonging to it:
  Revenue → 4 cards; Cost → 3 cards; Ops → 4 cards; People → 1 card.
  (One Overview card — the NPS card — is in the Revenue list even though its chart is a mock.)
- Clicking a category toggles its `active` class. Cards in that category get/lose the
  `.kpi-hidden` class (`display: none !important`).
- After toggling, each Overview `.row` is checked: if **all** filterable cards in a row are hidden,
  the whole row is hidden (`display: none`), so the grid reflows without empty rows. Rows with no
  filterable cards are never hidden.
- The toggle is **Overview-only** (selector is scoped to `#pg-overview .vc[data-kpi-cat]`) and the
  category state is not reflected anywhere else; there is no "show all / hide all" control and no
  count of visible cards.

**Gap vs brief §7:** the brief requires **10** toggleable categories — Revenue, Cost, Operations,
People, Customer, MRO, Network, Data Platform, AI / Data Products, Governance. The wireframe has
4, with no Customer, MRO, Network, Data Platform, AI/Data Products, or Governance category, and
its mapping is hard-coded canvas-id lists rather than a data-driven KPI→category attribute. The
WestJet implementation should derive category membership from the KPI dictionary (each KPI carries
its category) and apply the toggle across every page that shows KPI cards, not just Overview.

---

## 5. Scenario Simulator page

**Layout:** a single page, no charts. Six slider rows stacked vertically, then a "Scenario Summary"
panel, then a "VIEW OUTCOME →" button.

**Inputs — 6 sliders** (all `<input type="range">`, `step 0.1`, range **−10% to +10%**, each
pre-set to a non-zero starting position):

| Slider (id) | Label in wireframe | Unit shown |
|---|---|---|
| `sl-fuel` | Fuel Cost | currency per barrel |
| `sl-labor` | Labor Cost | currency (billions) |
| `sl-rask` | Yield (RASK) | cents |
| `sl-cap` | Capacity / ASK | flights per day |
| `sl-util` | Utilisation / Blk Hrs | hours per day |
| `sl-lf` | Load Factor | % |

**Per-slider row anatomy:** label + baseline value (with unit) on the left; below it, the −10% and
+10% endpoint labels (each showing the computed value at that extreme); a coloured slider track
(each slider has its own accent colour); and a "SIM:" readout showing the simulated value and its
delta vs baseline (%, or pp for load factor), coloured green/red by a per-slider "good direction"
rule (e.g. a fuel-cost *decrease* is green; a RASK *increase* is green).

**Behaviour (`updateSim()`, on every `input` event — live, no Apply button):**

- Each simulated value is a simple proportional scaling of a fixed baseline constant:
  `simulated = baseline × (1 + slider% / 100)`.
- The four summary outputs are computed from the slider positions with **fixed linear
  multipliers** (revenue impact from the three "positive" sliders; cost impact from the two cost
  sliders; margin impact as a scaled sum of the two; cash impact as revenue + cost). There is no
  chain of KPI formulas, no interaction between inputs, no capacity/demand constraint (load factor
  can be pushed past 100% in principle), and no link to the workbook or to any KPI engine.
- Colouring: summary values get a `sv-pos` / `sv-neg` class (green/red) by sign.

**Summary panel ("Scenario Summary"):** four tiles — Revenue Impact, Cost Impact, Margin Impact,
Cash Impact — each a single signed figure. No breakdown, no waterfall, no per-KPI impact list.

**What is missing vs brief §12–13:**

- Only 6 of the brief's ~20 simulator inputs exist (grouped in the brief as Commercial, Capacity,
  Fuel, MRO, Workforce, Operations, Cargo, Ancillary, FX). Missing entirely: passenger demand,
  capacity %, flights %, aircraft utilisation as a % input, fuel volume, maintenance cost,
  aircraft availability, headcount, cancellation %, D0 %, D15 %, cargo demand/yield, ancillary
  revenue, FX.
- Range is ±10% for everything; the brief proposes −50%/+50% defaults (fuel price −30%/+100%,
  cancellation −100%/+100%). The wireframe's ±10% range is far too narrow for stress scenarios.
- No numeric input alongside the slider, no per-input reset, no global reset, no defaults of 0%
  (sliders boot at non-zero positions, so the page loads in a non-baseline state), no min/max
  display beyond the ±10% endpoints.
- No scenario assumptions list, no changed-variables list, no "simulated" labelling on the outputs
  (the word "SIM:" appears per slider, but the summary tiles carry no simulated/actual label —
  brief §1/§13 requires every scenario value to be labelled simulated).
- The "VIEW OUTCOME →" button navigates to the Outcome page, but **no slider state is passed**:
  the Outcome page does not read the sliders (see §6). The two pages are visually linked and
  functionally disconnected.
- The simulator has no chart at all ("Adjust Parameters & Visualise Impact" is the subtitle, but
  nothing is visualised on the page itself).

---

## 6. Scenario Outcome page

**Structure (top to bottom):**

1. **Header + legend:** "KPI Overview — Actual vs Simulated Scenario" with a legend
   (■ Actual, ■ Simulated, ▲ Positive, ▼ Negative).
2. **Four comparison tiles** (`.outcome-tile`, 4-column grid), each with: a title, a headline
   delta, a sub-line giving the latest actual figure with its reference point (peak, target, or
   budget), and a two-line Chart.js chart (`mkOutLine`):
   - RASK vs CASK — delta in %; chart: actual unit-revenue series vs a flat simulated series.
   - DOC + Operating Margin — delta in pp; chart: actual series vs a flat simulated series.
   - Operative Revenue — delta in %; chart: actual revenue vs a flat simulated series.
   - Cash Position — delta in currency; chart: actual OTP series vs a flat target line
     (note: the tile is titled Cash but the chart plots OTP — a wireframe wiring error, see §10).
3. **Eight "actuals" tiles** (`.ot-kpi-tile`, lower grid): Revenue, Profit, Capacity, OTP,
   Pax Rev, OpRev, Headcount, Brent. Each tile shows: a label, a subtitle, and three or four
   reference facts (peak, first-month value, latest-month value, and a one-line interpretation
   such as "below target" or "vs peak %"). No charts on these tiles.
4. **Data summary strip:** a single line summarising the period (FY profit, peak revenue, peak
   aircraft, a disruption note, fuel-price move).

**How "actual vs simulated" is actually implemented (critical finding):**

- The "simulated" series in all four charts is **not derived from the Simulator page**. It is a
  flat constant array generated on the Outcome page itself (one constant per chart — a fixed
  unit-revenue level, a fixed revenue level, a fixed 88% line, a fixed headcount level). The
  "Actual" series is the wireframe's monthly series sliced to the selected range.
- The headline deltas on the four tiles are also static text, not computed from the slider state.
- Colours: Actual is blue, Simulated is green (both solid lines with a light fill to the axis;
  Simulated is dashed). OTP's Actual line is red, its Simulated line green. The legend's ▲/▼
  semantics are not applied per tile by rule.
- Chart axes *are* shown here (unlike the mini sparklines): x-axis month labels, y-axis gridlines,
  8-point tick font. Tooltips and legend remain disabled (`plugins.legend.display: false`).

**Gap vs brief §14:** the brief requires Actual vs Baseline vs Simulated comparison charts for
RASK, CASK, Revenue, Operating Cost, Margin, Cash, Load Factor, Capacity, and Passenger Volume;
summary tiles for Revenue, Cost, Margin, and Cash impact; a SCENARIO ASSUMPTIONS block; and a
complete list of changed variables. The wireframe has 4 charts (not 9), no Baseline series at all
(only Actual + a flat "Simulated"), no Cost/Margin/Cash-impact tiles as defined by the brief (its
Cash tile plots the wrong series), no assumptions block, and no changed-variables list. The
Outcome page must be rebuilt as a genuine function of the simulator state passed through the
scenario engine.

---

## 7. Chart types used per page (Chart.js config patterns, not data)

Global Chart.js defaults: font Open Sans/Arial 9px, tick colour muted grey; **tooltips disabled
everywhere** (`tooltip: {enabled: false}`) and legends hidden everywhere (`legend: {display: false}`).
Mini charts hide both axes; full charts show the x-axis (month labels, 7–8px, up to 35° rotation)
and hide the y-axis except on the Outcome page.

| Page | Chart | Type | Series / encoding pattern |
|---|---|---|---|
| Overview | RASK vs CASK | Line | 2 series: solid unit-revenue line; dashed unit-cost line (lighter shade). In vs LY mode a 3rd grey dashed prior-year line is added. `tension: 0.35`, `spanGaps: false`, point radius ~1.5. |
| Overview | DOC / operating profit | Bar | Grouped bars: actual series + forward series in orange; nulls render as transparent zero-height bars. In vs LY, a grey prior-year bar series is added. `barPercentage: 0.72` (0.5 in vs LY). |
| Overview | Capacity / flights | Bar | Same grouped actual + forward pattern as above. |
| Overview | Passengers (RPK) | Line | 1 series; + grey dashed LY line in vs LY mode. |
| Overview | Cargo revenue | Line | 1 series; + grey dashed LY line in vs LY mode. |
| Overview | Brent price | Line | 2 series: solid actual + dashed orange forward prices, with a clean break between them (forward series has no shared point). |
| Overview | Active fleet | Bar | Single series, bars coloured by threshold (above/below a fleet-size threshold); future months show faint grey "ghost" bars carrying the prior-year value. |
| Overview | Headcount | Bar | Single series, bars coloured by threshold (above/below a headcount threshold); same ghost-bar treatment for future months. |
| Overview | OTP | Line | 1 series (gold); + grey dashed LY line in vs LY mode. |
| Overview | Cash, SLF, NPS | — | No chart: mock "No source data" overlay (§2). |
| Passenger | RASK, OTP | Line / Bar | RASK: single line. OTP: bars coloured by threshold bands (≥85 green, 80–85 brand, <80 red). The other 13 card canvases are mocks. |
| Passenger | Route profitability | — | Static HTML ranked lists (Top 5 / Bottom 5), not a chart. |
| People | Headcount | Bar | Single series, bars coloured by threshold. The other 6 card canvases are mocks. Headcount-vs-plan "waterfall" is a text placeholder only — no waterfall chart exists. |
| Planes | Aircraft, OTP, Block hours | Bar | Aircraft: bars by threshold bands. OTP: bars by threshold bands. Block hours vs budget: bars coloured by whether actual ≥ budget. The other 3 canvases are mocks. Fleet-reactivation "line chart" is a text placeholder only. |
| Performance | Profit, profit vs budget, block hours vs budget, revenue, revenue vs budget, revenue per employee | Bar / Line | Profit: bars coloured by sign (≥0 brand, <0 red). Profit vs budget: variance bars coloured by sign. Block hours vs budget: % bars coloured by ≥100%. Revenue: bars by threshold. Revenue vs budget: line. Revenue/employee: line. The other 6 canvases are mocks. |
| Group | Cargo, revenue, profit | Bar | Bars coloured by threshold/sign (profit bars clamped at zero, so negative months render as zero-height). 1 of 4 canvases is a mock. |
| Outcome | 4 comparison charts | Line | 2 series each: solid Actual (blue, or red for OTP) with light area fill; dashed Simulated (green) with light fill. Flat constant "simulated" series (see §6). |

**Reusable chart idioms worth keeping (as patterns):**
- Actual vs forward split: solid actual + orange forward (bars) or dashed forward (line), with
  `null` for not-yet-available months so the forward segment is visually separate.
- Prior-year overlay: grey dashed line / grey bars added only in vs LY mode, with a legend bar
  that appears only in that mode.
- "Ghost" bars: where the current period is `null`, a faint grey bar shows the prior-year value at
  that position so the axis stays populated.
- Threshold-coloured bars: bar colour chosen per value by a threshold rule (sign, ≥ target,
  ≥ budget) — but in the wireframe the thresholds are hard-coded per chart; the WestJet build
  should take them from targets in the KPI dictionary.
- `spanGaps: false` on lines so missing months break the line instead of interpolating.

**Chart types the brief requires that the wireframe never demonstrates:** waterfall (only a
placeholder label), heatmap, scatter, Pareto, matrix, and any gauge/status visual. The wireframe
uses only line and bar charts (plus static HTML lists/tables). All other visual types must be
designed from the brief (§15), not from the wireframe.

**Data model behind the charts (structure only):** one flat `DATA` object of ~20 named monthly
series (24 slots each: 12 months × 2 years) plus a `DATA_LY` prior-year object (12 slots) and
forward series for a few measures. Series are sliced by the From/To index range (`fSlice` /
`fSliceLY`). There is no workbook, no schema, no validation, and no KPI engine — values are
in-line arrays. The WestJet data layer (brief §2) replaces this entirely; nothing about the
wireframe's series list should be treated as a schema.

---

## 8. Interaction patterns

| Pattern | Wireframe behaviour | Notes for the build |
|---|---|---|
| Page navigation | Bottom tabs + one "VIEW OUTCOME →" button; lazy chart init per page (`initCharts` on a 20 ms delay after activation). | Adopt lazy init; move nav to the brief's left-side nav (§16). |
| Date-range filtering | From/To month dropdowns; From ≤ To clamped; charts destroyed and rebuilt on change (`rebuildCharts`). | Adopt clamp + rebuild semantics; extend to the brief's dynamic date range and full filter set. |
| View mode | Actual / vs Plan / vs LY chips. **vs Plan is disabled ("Coming soon")** — the mode exists in code (`VIEW_MODE` accepts `'vsplan'`) but no chart branch handles it, so it can never render. vs LY locks the selectors to year-2 only (disables year-1 options, forces Jan→Dec year 2), adds grey dashed LY series, and shows the LY legend. | vs Plan / vs Forecast must be real modes in the WestJet build (brief §5–6), driven by Plan/Forecast data, not a disabled chip. |
| Year shortcut | Year chips set the range to a full year and reset the view to Actual. | Keep as a shortcut pattern, but drive it from the workbook's actual date range. |
| Category toggle | §4 — show/hide Overview cards by category, rows reflow. | Extend to 10 categories and all pages. |
| Simulator sliders | Live `oninput` recalculation, no Apply button; simulated readouts + 4 summary tiles update in place. | Adopt live update; add numeric inputs, per-input and global reset, wider ranges, and real scenario-engine outputs (brief §12–13). |
| Simulator → Outcome | Button navigates only; **no state is passed** (Outcome uses flat constants). | Must pass the full scenario definition; Outcome must recompute from the scenario engine. |
| Hover | **No hover interaction anywhere**: Chart.js tooltips are disabled globally, legends hidden, and card ⋮/⤢ icons have no handlers. Hover CSS exists only as a colour change on tabs/chips/cards. | Brief §16 requires hover on KPI cards (with trend/comparison/status). Tooltips must be enabled and informative in the WestJet build. |
| Drill-down | None. No click handler on any KPI card, chart, route row, or initiative row leads anywhere. | Brief §16 requires KPI → Domain → Detail drill-down; design it fresh. |
| Reset | **No Reset Filters button, no simulator reset, no "reset view" control.** The only "reset" is an internal comment in `setYearFilter` ("Reset view chips") that just re-activates the Actual chip. | Brief §6 explicitly requires a Reset Filters button; brief §12 requires a reset per simulator input. |
| Responsive behaviour | **None.** No `@media` queries in the CSS; layout is fixed flex rows (`.row {display: flex}`) with `overflow-x: hidden` on the body, a `viewport` meta tag, and fixed pixel heights. On a narrow viewport the 3-across card rows will compress/overflow rather than reflow. | Brief §23 requires desktop/laptop/tablet responsive grids without horizontal scrolling. The wireframe's layout is a desktop-only reference. |
| Export / share | None. No CSV/download/print control; the ribbon's "Share" button is decorative. | Brief §23 requires CSV, filtered-table, scenario-results, and KPI-summary exports. |
| Data status / refresh | Static text only: a "Live · D+40 · [date]" badge, a "Data loaded — [range] · [airline] Group · 15 months" banner, and a "Live feed · [date] / Refresh: Every 15 min" line. No live status, no validation, no last-refresh computation. | Replace with the brief's DATA STATUS block (§18): Healthy/Warning/Critical from validation, last refresh, records loaded, date range, quality score, errors/warnings. |
| Empty / missing data | Mock overlay pattern (§2) — greyed chart + "No source data" + headline "TBC". Applied inconsistently: some cards with no series are mocks, but other panels show placeholder text instead ("Waterfall Visual", "Line Chart — Fleet Recovery Curve"). | Adopt the overlay pattern uniformly; never use placeholder text as a substitute for a missing visual. |

---

## 9. Visual design notes (objective description — do NOT adopt as branding)

- **Layout:** Power BI report chrome — dark top ribbon, workspace title bar, canvas with a light
  grey background, white cards with a 1px border, small shadow, and a coloured top border on each
  card. Bottom page-tab strip. Right-hand "Visualizations + Fields" pane (fake). Dense: base font
  12px, KPI headline ~28px bold, delta 11px, chart tick labels 7–9px, section labels 9–10px
  uppercase with letter-spacing. Cards are compact (roughly 10–12px padding) with the mini chart
  occupying the bottom ~40px of each card.
- **Colour usage (as tokens, described structurally):** one dominant dark brand colour used for
  the ribbon, tab-active state, card top borders, headline values, and primary chart series; a
  metallic gold/silver accent used for secondary series and threshold highlights; green for
  favourable, red for adverse, orange for forward-looking series; grey for prior-year comparison
  series and for mock/ghost states; purple for one simulator slider only. Backgrounds are warm
  off-white/grey; panels are white. The palette is a single-airline brand system (maroon + gold)
  tied to the source airline — **it must not be carried into the WestJet build**, which has its
  own theme in brief §17 (yellow / deep navy / charcoal / white / neutral grey, yellow used
  sparingly for active nav, highlights, and key actions).
- **Density & hierarchy:** high density, many small cards per page (12 on Overview, 15 on
  Passenger); hierarchy is carried by headline size and the coloured card top border, not by
  spacing. Section headers on domain pages are a page title + a "KPIs & Measurement · Rebound
  Phase" subtitle — the "Rebound Phase" framing is specific to the source airline's situation
  and must not be reused.
- **Annotations:** the file contains its own wireframe labels (`.wf-label`, small italic uppercase
  captions marking zones) — a sign it was built as a mock-up, not a production report.
- **Typography:** Open Sans throughout (Google Fonts CDN), with italic used for the "TBC" mock
  headline and for disabled chips.

---

## 10. Conflicts / gaps vs the master prompt (brief)

Ordered by impact on the build. "Brief §n" refers to `COORDINATOR_BRIEF.md`.

### Must-fix conflicts (brief wins)

1. **Only 8 pages; the brief requires 18 (§9).** Missing entirely: Flight Operations, MRO /
   Tech Ops, Revenue Management, Network / Route Profitability, Baggage, Cargo, Airport / Ground,
   Fuel, Finance, Ancillary Revenue, Data Platform, AI / Data Products, Data Governance. The
   wireframe's five domain pages (Passenger, People, Planes, Performance, Group) do not map 1:1
   to any brief page — "Performance" is a finance-flavoured catch-all and "Group" is a
   subsidiary/group page with no brief equivalent. Do not extend the wireframe's page list;
   build the brief's 18.
2. **Only 4 KPI categories; the brief requires 10 (§7).** Missing: Customer, MRO, Network, Data
   Platform, AI / Data Products, Governance (§4).
3. **No MRO domain at all.** The brief makes MRO a first-class domain (§3.2, §10) with its own
   dashboard, KPIs (availability, dispatch reliability, AOG, MEL, deferred defects, TAT, parts
   availability, cost/flight hour, Pareto, heatmap), and warning states. The wireframe's closest
   content is three "Planes" cards (fleet utilisation, AOG events, heavy maintenance cost vs
   plan) — a fraction of the requirement, and AOG/OTP figures there are mocks or re-used series.
4. **No Data Platform, AI/Data Products, or Governance content.** Brief §3.13–3.15 and §11
   require dedicated dashboards with management metrics (adoption, deflection, quality,
   availability, freshness, product lifecycle, classification/ownership coverage). The wireframe
   has nothing in these areas — not even a mock.
5. **No Baggage, Cargo (as a page), Fuel, Finance (as a page), Ancillary, Network, or Ground
   content.** Cargo appears only as one Overview card and one Group chart; fuel only as a Brent
   price card and a simulator slider; finance only inside the "Performance" page. Route
   profitability appears as a static Top/Bottom-5 list on the Passenger page, not as the
   brief's Network page with route ranking, scatter, and contribution analysis (§3.11, §15).
6. **Simulator is a toy, not the brief's scenario engine (§12–13).** 6 sliders vs ~20 required
   inputs; ±10% range vs proposed −50%/+50% (fuel −30%/+100%, cancellation −100%/+100%); fixed
   linear multipliers instead of KPI-formula chains (e.g. fuel price → fuel cost → operating
   cost → CASM → margin → cash); no demand/capacity constraints; no numeric inputs; no resets;
   no assumptions list; outputs not labelled simulated. **None of the simulator's arithmetic may
   be reused** — the scenario engine must implement the brief's documented chains.
7. **Outcome page is disconnected from the Simulator (§14, §6 above).** "Simulated" series are
   flat constants generated on the Outcome page; headline deltas are static text; there is no
   Baseline series; only 4 of the brief's 9 comparison charts exist; no assumptions block; no
   changed-variables list; and one tile is mis-wired (the tile titled "Cash Position" plots the
   OTP series against a flat target line). Treat the Outcome page as a layout sketch only.
8. **vs Plan is a dead control; there is no Forecast mode (§5–6).** The `vsplan` chip is disabled
   and no chart code handles plan comparison, despite plan/budget series existing in the data
   object. The brief requires Actual / Plan / Forecast comparison, variance to plan/forecast/
   target, and YoY — all as working modes.
9. **No Reset Filters button (§6), no simulator reset (§12).** Confirmed by code search: no reset
   control or handler exists anywhere in the file.
10. **No data-status, validation, or error handling (§18–20).** No DATA STATUS indicator, no
    validation report, no "workbook not found / missing sheet / missing column" messaging. The
    only status text is a static "Live" badge and a "Data loaded" banner. The mock-overlay
    pattern (§2) is the one reusable idea here; everything else must be built to the brief.
11. **No SYNTHETIC DATA labelling, no "simulated" labelling (§1).** The wireframe presents its
    figures as live enterprise data ("Live feed", "Refresh: Every 15 min"). The WestJet build
    must carry the SYNTHETIC DATA badge and label every scenario value as simulated.
12. **Fixed 24-month axis with hard-coded years (§1, §5).** The wireframe's date handling assumes
    a fixed two-year window and boots to year 2. The brief requires dynamic range detection
    (2–5 years from the workbook, no assumed years). The From/To + vs LY mechanics are reusable;
    the fixed axis is not.
13. **Source-airline branding and framing throughout — do not copy.** Title, ribbon, "Rebound
    Phase" subtitles, route structure implied by the route lists, initiative names/values, and
    the maroon/gold token set all belong to the source airline. The WestJet theme is brief §17.
    The wireframe's own file name and its "Power BI" chrome are also not part of the product.

### Gaps / partial coverage (patterns to extend, not defects to fix in the wireframe)

14. **KPI cards lack the brief's required anatomy (§8):** no previous-period value, no YoY %,
    no target, no variance to target, no status indicator. Only value + free-text delta + mini
    trend exist.
15. **Executive Overview KPI set does not match the brief (§8).** The brief's 14 landing-page
    KPIs (Total Revenue, Operating Cost, Operating Margin, RASK, CASM, Load Factor, D0, Dispatch
    Reliability, Aircraft Utilization, Passenger Volume, Cash Position, Data Quality, Platform
    Availability, Data Product Adoption) are mostly absent: the wireframe has no CASM card, no
    D0 card, no dispatch reliability, no aircraft utilisation as a KPI, no operating margin as a
    computed KPI, and no data/AI KPIs at all. Several wireframe cards conflate two measures in
    one title, which the brief's one-KPI-per-card model does not do.
16. **Only line and bar charts are demonstrated (§15).** No waterfall (placeholder text only),
    heatmap, scatter, Pareto, or matrix visual exists in the file. The brief's visualisation
    requirements go well beyond what the wireframe shows.
17. **No drill-down, no hover detail, no exports (§16, §23).** Tooltips disabled globally; card
    icons decorative; no KPI → domain → detail path; no CSV/export control.
18. **Not responsive (§23).** No media queries; fixed flex rows; desktop-only layout.
19. **Mock coverage is uneven.** 3 of 12 Overview cards, 13 of 15 Passenger cards, 6 of 7 People
    cards, 3 of 6 Planes cards, 6 of 12 Performance cards, and 1 of 4 Group cards are mocks
    ("No source data"). The wireframe is therefore a partial mock-up even on its own terms: most
    of its domain-page cards have no series behind them. In the WestJet build, a card with no
    workbook data must show the no-data state *with the reason* (missing sheet/column/validation
    failure), not a silent mock.
20. **Internal inconsistencies (do not propagate):** the Outcome "Cash Position" tile plots OTP;
    the People page's only real chart is a headcount bar that does not match any People card
    title; the Passenger initiative table claims 10 initiatives but lists 9 (and Performance
    claims 10, lists 6); one Group canvas id is skipped (`gr-4` does not exist); the "Capacity"
    card's subtitle and the "Passengers" card's subtitle reference different measures than their
    headlines; the wireframe's own `DATA` object contains series (e.g. budget series) that no
    chart uses. Treat the wireframe as a sketch with known wiring errors, not as a spec.

### What the wireframe *does* contribute (adopt the pattern, rebuild the content)

- Bottom-tab / single-page navigation with lazy per-page chart initialisation.
- Overview KPI-card grid anatomy (title → headline → delta → mini trend) — extend with previous
  period, YoY %, target, variance, status (§8).
- Actual vs forward encoding (solid actual + orange forward) and prior-year grey dashed overlay
  with a mode-only legend.
- Ghost bars for not-yet-available future months; `spanGaps: false` so missing months break lines.
- Threshold-coloured bars (colour by sign / vs target / vs budget) — re-implement from KPI-dictionary targets.
- "No source data" overlay card state (greyed chart + ⊘ + headline "TBC") — adopt uniformly with a reason.
- KPI-category show/hide with row reflow — extend to 10 categories, all pages, dictionary-driven.
- From/To clamping, year shortcuts, live slider recalculation, and a Simulator → Outcome
  navigation link — all as interaction patterns, with real state passing added.
- Initiative-tracker table pattern (initiative → priority → KPI → estimated value) — re-implement
  data-driven if the workbook supports it.

---

## Appendix — file inventory (for traceability)

- **File analysed:** `PowerBI_Enterprise_Control_Tower_Wireframe_values__2__-_Copy.html`
  (116,145 bytes; 2,095 lines; Chart.js 4.4.1 via CDN; Open Sans via Google Fonts).
- **Structure:** one `<style>` block (design tokens + layout, no media queries); two `<script>`
  blocks (the second, ~34.5 KB, holds all logic); 8 page divs; 12 Overview canvases + 15
  Passenger + 7 People + 6 Planes + 12 Performance + 4 Group (one id skipped) + 4 Outcome
  canvases; 6 simulator sliders; 4 KPI-category toggles.
- **Key JS functions:** `activatePage`, `initCharts`, `rebuildCharts`, `mkChartReal`, `mkBar`,
  `mkLine`, `mkOutLine`, `mkMock`, `applyMockOverlay`, `updateSim`, `setViewMode`, `setYearFilter`,
  `toggleKpiCat`, `applyPeriodFilter`, plus slicing helpers `fLabels`, `fSlice`, `fSliceLY`,
  `futureGhost`, `ghostColors`.
- **Global state variables:** `VIEW_MODE` (`'actual' | 'vsplan' | 'vsly'`), `F_FROM` / `F_TO`
  (month indices into a fixed 24-slot axis).
- **No workbook, schema, KPI engine, validation, or data loading exists in the file.** All series
  are in-line arrays; all KPI figures, initiative rows, and route lists are hard-coded HTML/JS.
  Nothing in this file constitutes a data model for the WestJet build.
