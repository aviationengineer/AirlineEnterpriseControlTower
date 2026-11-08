# WestJet Enterprise Aviation Intelligence & Control Tower — Coordinator Brief

Single source of truth for the build workstreams, condensed from the master build
prompt (user: Ehsan). Read this file before doing any work in this project.

## 0. Project facts

- Working directory: `~/workspace/westjet-control-tower/`
- Packages (exact names):
  - `01_WestJet_Control_Tower_Streamlit/` — Python + Streamlit
  - `02_WestJet_Control_Tower_HTML_JS/` — HTML + JavaScript
  - `03_Shared/` — shared specification (KPI dictionary, data model, scenario
    definitions, data-quality rules, wireframe analysis)
- Target repo (currently EMPTY, user-supplied): `aviationengineer/AirlineEnterpriseControlTower`
  — **Do NOT push to GitHub yet.** Local build only.
- Wireframe / UX reference ONLY:
  `~/workspace/user/files/PowerBI_Enterprise_Control_Tower_Wireframe_values__2__-_Copy.html`
  (titled "Qatar Airways — Enterprise Control Tower", Chart.js 4.4.1; pages
  overview/performance/planes/passenger/people/group/simulator/outcome; KPI
  categories cost/ops/people/revenue).
- Excel input template (`WestJet_Enterprise_Control_Tower_Input_Template.xlsx`)
  was NOT attached and is NOT in the repo or workspace. **Do NOT invent the
  workbook schema.** Do NOT write the data loader, validator, or KPI engine
  against guessed columns — that work waits for the workbook.

## 1. Hard constraints (never violate)

- NEVER copy Qatar Airways branding, hard-coded values, hard-coded KPI logic,
  or static datasets from the wireframe. It is a UX/interaction reference only.
- NEVER hard-code KPI values, dates, 2025/2026, or synthetic results into UI.
- NEVER present scenario output as actual company performance; always label
  simulated values as simulated.
- NEVER imply synthetic data is real WestJet data. Visible badge: **SYNTHETIC DATA**.
- NEVER silently ignore validation errors. Never fabricate enterprise system
  integrations (TRAX/eMRO, AMOS, etc. are future sources only).
- NEVER duplicate business logic unnecessarily between the two packages. Both
  packages must use the same data model, KPI definitions, formulas, targets,
  comparison logic, scenario logic, data-quality rules, and formatting rules.
- No credentials, API keys, passwords, or connection strings hard-coded anywhere.
  Environment variables for future enterprise integrations.
- The workbook holds ~5 years of monthly synthetic data (Jan 2022–Dec 2026).
  The apps must support 2/3/4/5 years without code changes and detect the
  available date range dynamically. Do not assume 2025/2026.

## 2. Architecture

Excel Workbook → File/Data Loader → Schema Validation → Data Quality Validation
Engine → Canonical Aviation Data Model → KPI Calculation Engine → Scenario
Engine → WestJet Control Tower → Streamlit App + HTML/JS App.

Centralised KPI engine only — never calculate important KPIs inside individual
UI components. Shared logical spec covers: data mappings, KPI definitions,
formulas, targets, comparison logic, scenario logic, data-quality rules,
formatting rules.

## 3. Data domains (all 15 must be supported)

1. **Flight Operations**: Scheduled Flights, Departures, Cancellations,
   On-Time Departures, D0, D15, ASM, RPM, Load Factor, Block Hours, Aircraft
   Utilization, Active Aircraft, Capacity, Operational reliability.
2. **MRO / Tech Ops** (first-class domain; design so extra MRO fields can be
   added without changing dashboard architecture): Active Aircraft, Maintenance
   Events, Maintenance Hours, Available Maintenance Hours, Aircraft Downtime,
   Dispatch Reliability, AOG Events, AOG Rate, MEL Items, Deferred Defects,
   Parts Availability, Maintenance Cost, Maintenance Cost / Flight Hour,
   Maintenance Cost / Cycle, Repeat Defects, Component Removals, Reliability,
   Maintenance TAT, Aircraft Availability, Line Maintenance, Heavy Maintenance.
3. **Crew / People**: Headcount, Headcount vs Plan, Training Compliance, Crew
   Recency Compliance, SIM Completion, CBT Completion, Voluntary Leave Rate,
   Critical Vacancies, Sentiment Index, Communications Reach, Training
   Pipeline, Productivity.
4. **Passenger / Commercial**: Bookings, Passengers, Cancellation Rate,
   Booking Intake, Forward Load Factor, Book-to-Cancel Ratio, Corporate
   Retention, Direct Channel Share, Advance Purchase Ratio, NPS, Passenger Growth.
5. **Revenue Management**: Passenger Revenue, Cargo Revenue, Ancillary Revenue,
   Other Revenue, Total Revenue, RASK, Yield, Revenue per Passenger, Revenue
   Growth, Revenue vs Plan, Revenue vs Prior Year.
6. **Finance**: Total Revenue, Operating Cost, Labour Cost, Fuel Cost, Other
   Operating Cost, Cash Position, Operating Margin, EBIT-style profitability
   measures, Cost variance, Revenue variance, Margin variance.
7. **Baggage**: Bags Handled, Mishandled Bags, Mishandling Rate, Successful
   Delivery Rate, Baggage Performance, Baggage-related operational impact.
8. **Cargo**: Cargo Tonnes, Cargo Shipments, Cargo Revenue, Cargo Yield,
   Cargo Growth, Cargo Revenue vs Plan.
9. **Airport / Ground Operations**: Aircraft Turns, Turnaround Time, Ground
   OTP, Ground Incidents, Gate/Turn Performance, Ground Handling Performance.
10. **Fuel**: Fuel Price, Fuel Volume, Fuel Cost, Fuel Hedging %, Fuel Price
    Variance, Fuel Cost Impact. Support scenario simulation for fuel-price changes.
11. **Network / Routes**: Route, Flights, Passengers, Route Revenue, Route
    Cost, Route Profitability, Revenue per Flight, Cost per Flight, Load Factor,
    Route Contribution. Provide route-level ranking.
12. **Ancillary Revenue**: Ancillary Revenue, Ancillary Revenue / Passenger,
    Attach Rate, Ancillary Growth, Revenue Contribution.
13. **Data Platform** (dedicated dashboard; management metrics): Active
    Self-Service Users, Registered Users, Platform Tickets, Ticket Deflection
    Rate, Data Quality %, Platform Availability %, Average Data Freshness,
    Knowledge Base Usage, Security Groups, Platform Adoption, Platform
    Reliability. Management metrics: Self-Service Adoption, Knowledge Base
    Usage, Ticket Deflection Rate, Security Groups, Registered Users,
    Logs / Platform Activity, Data Quality, Availability, Freshness.
14. **AI / Data Products**: Registered Data Products, Active Data Products,
    Data Product Adoption, Estimated Business Value, Critical Incidents,
    Product Reliability, Product Quality, Consumer Adoption. Lifecycle:
    Idea → Discovery → Development → Certified → Production → Adopted →
    Scaled → Retired.
15. **Data Governance**: Registered Data Assets, Classified Assets, Assets
    with Owner, Governance Quality, Open Governance Exceptions, Data
    Stewardship, Classification Coverage, Ownership Coverage, Quality Exceptions.

## 4. KPI formulas (canonical — both packages identical)

- Load Factor = RPM / ASM
- RASK = Passenger Revenue / ASM
- CASM = Operating Cost / ASM
- Yield = Passenger Revenue / RPM
- D0 = On-Time Departures / Departures
- D15 = D15 Departures / Departures
- Aircraft Utilization = Block Hours / Active Aircraft
- Maintenance Cost / Flight Hour = Maintenance Cost / Block Hours
- AOG Rate = AOG Events / Active Aircraft
- Baggage Mishandling Rate = Mishandled Bags / Bags Handled
- Cargo Yield = Cargo Revenue / Cargo Tonnes
- Operating Margin = (Total Revenue − Operating Cost) / Total Revenue
- Ancillary Revenue / Passenger = Ancillary Revenue / Passengers
- Data Product Adoption = Active Data Products / Registered Data Products
- (Also required in the KPI engine: dispatch reliability, MRO cost per cycle,
  baggage successful delivery rate, ticket deflection rate, data quality %,
  platform availability %, classification/ownership coverage, governance quality.)

## 5. Time intelligence

MTD, YTD, Prior Month, Prior Year, YoY $ and YoY %, Variance to Plan,
Variance to Forecast, Variance to Target, Rolling 12 Months, 3-Year Trend,
5-Year Trend, Selected Date Range, Monthly, Quarterly, Annual. Date selection
dynamic; never assume 2025/2026.

## 6. Global filters

Date From, Date To, Year, Quarter, Month, Domain, KPI Category,
Actual / Plan / Forecast, Scenario, Route, Airport, Aircraft, Fleet,
Geography where applicable. All applicable components must respond to them.
Include a Reset Filters button.

## 7. KPI category filter

Users can toggle categories on/off: Revenue, Cost, Operations, People,
Customer, MRO, Network, Data Platform, AI / Data Products, Governance.

## 8. Executive Overview (landing page)

Title: "WestJet Enterprise Aviation Control Tower". Subtitle: "Enterprise
Performance · Operations · Commercial · MRO · Data & AI". Top-level KPI cards
(each with current value, previous period, YoY %, target, variance to target,
mini trend, status indicator):
Total Revenue, Operating Cost, Operating Margin, RASK, CASM, Load Factor, D0,
Dispatch Reliability, Aircraft Utilization, Passenger Volume, Cash Position,
Data Quality, Platform Availability, Data Product Adoption.

## 9. Dashboard pages (18)

1 Executive Overview · 2 Flight Operations · 3 MRO / Tech Ops · 4 Passenger /
Commercial · 5 Revenue Management · 6 Network / Route Profitability ·
7 Crew / People · 8 Baggage · 9 Cargo · 10 Airport / Ground · 11 Fuel ·
12 Finance · 13 Ancillary Revenue · 14 Data Platform · 15 AI / Data Products ·
16 Data Governance · 17 Scenario Simulator · 18 Scenario Outcome.

## 10. MRO dashboard

Top KPIs: Aircraft Availability, Dispatch Reliability, AOG, MEL, Deferred
Defects, Maintenance Hours, Maintenance Cost, Cost / Flight Hour, Parts
Availability, Maintenance TAT, Repeat Defects. Visualizations: fleet
availability trend, dispatch reliability trend, AOG trend, MEL trend, deferred
defect trend, maintenance hours, maintenance cost, cost per flight hour,
parts availability, aircraft downtime, fleet comparison, Pareto of
maintenance issues, heatmap by month, reliability trend. Warning states for
deterioration.

## 11. Data Platform dashboard

Primary KPIs: Self-Service Adoption, Knowledge Base Usage, Ticket Deflection,
Registered Users, Active Users, Security Groups, Data Quality, Platform
Availability, Data Freshness, Platform Tickets. Visuals: self-service adoption
trend, ticket volume, ticket deflection trend, knowledge base usage,
registered vs active users, security-group growth, data-quality trend,
availability trend, freshness trend, top ticket categories, platform usage
heatmap. Executive summary: Platform Health, Adoption, Reliability, Quality,
Support Efficiency.

## 12. Scenario simulator inputs (each needs slider, numeric input, default,
min, max, reset button)

- Commercial: Passenger Demand %, Yield %, Load Factor %
- Capacity: Capacity %, Flights %, Aircraft Utilization %
- Fuel: Fuel Price %, Fuel Volume %
- MRO: Maintenance Cost %, Aircraft Availability %
- Workforce: Labour Cost %, Headcount %
- Operations: Cancellation %, D0 %, D15 %
- Cargo: Cargo Demand %, Cargo Yield %
- Ancillary: Ancillary Revenue %
- FX: FX %

Proposed defaults for the spec (to be confirmed against the workbook):
default 0% for every input; min −50%, max +50% (fuel price min −30%,
max +100%; cancellation min −100% i.e. to zero, max +100%). Mark these as
proposed, not workbook-derived.

## 13. Scenario engine outputs

Revenue Impact, Cost Impact, RASK Impact, CASK Impact, Load Factor Impact,
Operating Margin Impact, Cash Impact, EBIT-style impact, Passenger Impact,
Capacity Impact. Example chains (document them):
- Fuel Price +20% → Fuel Cost +20% → Operating Cost up → CASM up →
  Operating Margin down → Cash / Profitability impact.
- Passenger Demand +10% → Passengers up → RPM up → Load Factor up →
  Passenger Revenue up → RASK up → Operating Margin up.
All scenario values labelled simulated, never presented as actual performance.

## 14. Scenario Outcome page

Actual vs Baseline vs Simulated comparison charts for RASK, CASK, Revenue,
Operating Cost, Margin, Cash, Load Factor, Capacity, Passenger Volume.
Summary tiles: Revenue Impact, Cost Impact, Margin Impact, Cash Impact.
Include SCENARIO ASSUMPTIONS and a complete list of changed variables.

## 15. Visualization requirements

KPI cards; line charts (trends, YoY, monthly, rolling 12m); bar charts
(domain comparisons, route rankings, cost/revenue components); waterfall
(revenue/cost/margin bridges, headcount vs plan, scenario impact); heatmaps
(operational performance, MRO reliability, route performance, data quality);
scatter plots (route profitability, utilization vs reliability, maintenance
cost vs aircraft age where data exists); Pareto (maintenance issues, baggage
issues, support tickets, governance exceptions); matrix (KPI status, route
performance, domain performance).

## 16. UX design

Power BI-inspired enterprise control-tower layout: left-side navigation,
page tabs, KPI cards, slicers, category filters, mini trend charts, scenario
pages, outcome comparison. Retain interaction concepts, redesign for WestJet.
KPI → Domain Dashboard → Detailed Data drill-down. Every filter updates
relevant visuals. KPI cards support hover, trend, comparison, status,
drill-down where applicable.

## 17. WestJet theme

Professional WestJet-inspired aviation design. Primary: WestJet yellow, deep
navy / dark charcoal, white, light neutral grey, restrained aviation
blue/teal accents. Yellow strategically for active navigation, KPI highlights,
key actions, branding. Avoid excessive yellow. Must look like an Enterprise
Airline Operations & Data Intelligence Platform, not a consumer travel site.
Header: "WESTJET / Enterprise Aviation Control Tower", subheader
"Operations · Commercial · MRO · Finance · Data · AI". Show Data Period,
Last Refresh, Data Quality, Platform Status.

## 18. Data status

Always show DATA STATUS: Healthy / Warning / Critical based on validation
results, plus last successful refresh, records loaded, date range,
data-quality score, validation errors, validation warnings.

## 19. Data validation rules (all must be enforced; never silently ignore)

Required sheets; required columns; data types; null values; duplicate dates;
duplicate route records; negative values where invalid; percentages between
0 and 1; ASM ≥ RPM; Departures ≤ Scheduled Flights; Cancelled Bookings ≤
Bookings; Classified Assets ≤ Registered Assets; Active Products ≤ Registered
Products. Produce a validation report.

## 20. Error handling

Workbook missing → "Input workbook not found. Please upload:
WestJet_Enterprise_Control_Tower_Input_Template.xlsx". Missing sheet → show
the exact missing sheet. Missing column → e.g. "Sheet: Flight_Operations /
Missing column: ASM". Never crash with an obscure Python/JavaScript error.

## 21. Streamlit package structure (section 24)

streamlit_app/ — app.py, config.py, data/ (loader.py, validator.py,
transformer.py, cache.py), models/ (aviation_model.py, kpi_model.py,
scenario_model.py), services/ (kpi_engine.py, scenario_engine.py,
comparison_engine.py, data_quality.py), dashboards/ (executive.py,
flight_ops.py, mro.py, passenger.py, revenue.py, network.py, people.py,
baggage.py, cargo.py, ground.py, fuel.py, finance.py, ancillary.py,
data_platform.py, ai_products.py, governance.py, simulator.py, outcome.py),
components/ (kpi_card.py, charts.py, filters.py, status.py, tables.py),
tests/, requirements.txt, README.md, run.bat.

## 22. HTML/JS package structure (section 25)

web_app/ — index.html, css/ (westjet-theme.css, dashboard.css,
responsive.css), js/ (app.js, data-loader.js, data-validator.js,
kpi-engine.js, comparison-engine.js, scenario-engine.js, charts.js,
filters.js, dashboards/), data/ (sample-data.json), assets/, tests/,
README.md. Standalone browser app; capable of loading converted JSON/CSV
data generated from the Excel workbook. Browser-compatible libraries where
appropriate.

## 23. Responsive, exports, docs, testing, performance, security

- Responsive: desktop, laptop, tablet; desktop executive use prioritised;
  responsive grids; avoid horizontal scrolling where practical.
- Exports: CSV export, filtered table export, scenario results export, KPI
  summary export; Streamlit additionally downloadable datasets.
- Docs to generate: README.md, ARCHITECTURE.md, DATA_MODEL.md,
  KPI_DICTIONARY.md, SCENARIO_ENGINE.md, DEPLOYMENT.md, USER_GUIDE.md
  (setup, dependencies, workbook structure, data mapping, KPI formulas,
  scenario formulas, architecture, deployment, troubleshooting).
- Tests for: data (workbook loading, schema validation, missing columns,
  invalid values); KPI (Load Factor, RASK, CASM, Yield, D0, D15, Operating
  Margin, MRO metrics, Data Platform metrics); scenario (Fuel +20%,
  Demand +10%, Demand −10%, Maintenance Cost +12%, Labour Cost +7%,
  Yield +5%); UI (filters work, pages load, charts render, scenario results
  update, reset works, missing-data errors understandable).
- Performance: optimise for 5 years monthly data, route-level records,
  repeated filtering, scenario recalculation; cache static data; do not
  recalculate the entire dataset unnecessarily after every UI interaction.

## 24. Future data sources (design for, do NOT implement)

TRAX / eMRO, AMOS, Flight Operations, Crew Systems, Revenue Management,
Passenger Systems, Baggage Systems, Cargo Systems, Airport Systems, Finance,
Data Platform, External APIs. Future: Source Systems → Data Ingestion →
Enterprise Data Platform → Canonical Aviation Model → KPI / Semantic Layer →
Control Tower.

## 25. Executive storytelling

Every dashboard answers: What happened? Why did it happen? Is it good or
bad (target/benchmark)? What happens next (trend/forecast)? What can we do
(scenario/action)? Auto-generate concise insights, clearly distinguished from
raw data (e.g. "Revenue is 4.2% above prior year, primarily driven by
passenger growth"). Example driver chain: Dispatch Reliability 98.1%, ▼0.7pp
YoY, primary driver AOG +12%, scenario: reduce AOG by 10% → potential
operational improvement.

## 26. Design principle

DATA → TRUST → KPI → INSIGHT → SCENARIO → DECISION. A senior executive or
aviation data leader moves Enterprise performance → domain → KPI → driver →
scenario → decision within a few interactions. Build incrementally: data
layer, validation, KPI engine, executive dashboard, domain dashboards,
scenario engine, scenario outcome, testing, documentation, final packaging.

## 27. Acceptance criteria (for the full build; this phase covers specs +
scaffolds only)

Excel loads; all domains load; five years available; date filters work;
validation works; KPI calculations dynamic and documented; comparison and
targets work; all 18 pages exist; navigation works; filters work; visuals
update; executive overview works; full MRO dashboard; Data Platform metrics
all represented; simulator works; assumptions visible; outputs calculated
dynamically; outcome page compares baseline vs scenario; both applications work.
