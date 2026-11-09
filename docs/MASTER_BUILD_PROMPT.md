# Master Build Prompt — WestJet Enterprise Aviation Intelligence & Control Tower

> **Source:** the brief Ehsan sent on 2026-11-08 (main chat) that commissioned this project.
> Reproduced verbatim below, from `# MASTER BUILD PROMPT` to the final line.
> Attachments that came with the brief (not stored here):
>
> - `PowerBI_Enterprise_Control_Tower_Wireframe_values__2__-_Copy.html` — Enterprise Control Tower HTML reference/wireframe (UX and interaction reference only)
> - `WestJet_Enterprise_Control_Tower_Input_Template.xlsx` — the input workbook (22 sheets, 60 months Jan 2022–Dec 2026)
>
> Working notes: `COORDINATOR_BRIEF.md` (condensed version used by the build workstreams) and the derived shared specification in `03_Shared/`.

---

# MASTER BUILD PROMPT
## WestJet Enterprise Aviation Intelligence & Control Tower

You are an expert enterprise software architect, aviation data architect, data engineer, UX designer, Python developer, Streamlit developer, JavaScript developer, visualization engineer, and AI product architect.

Build a production-quality **WestJet Enterprise Aviation Intelligence & Control Tower** using the attached:

1. Existing Enterprise Control Tower HTML reference/wireframe
2. `WestJet_Enterprise_Control_Tower_Input_Template.xlsx`

The existing HTML is a **UX and interaction reference only**. Do NOT copy Qatar Airways branding, hard-coded values, hard-coded KPI logic, or static datasets.

Rebuild the solution using a **WestJet enterprise aviation architecture**.

---

# 1. OBJECTIVE

Create two functionally equivalent application packages:

### Package A — Python + Streamlit

```text
westjet_control_tower_streamlit/
```

### Package B — HTML + JavaScript

```text
westjet_control_tower_web/
```

Both applications must use the **same data model, KPI definitions, calculation logic, filters, scenario engine, and business rules**.

The two implementations should produce materially equivalent results when supplied with the same Excel input.

---

# 2. CORE ARCHITECTURE

Implement:

```text
                    Excel Workbook
                          │
                          ▼
                ┌───────────────────┐
                │ File/Data Loader   │
                └─────────┬─────────┘
                          ▼
                ┌───────────────────┐
                │ Schema Validation  │
                └─────────┬─────────┘
                          ▼
                ┌───────────────────┐
                │ Data Quality       │
                │ Validation Engine  │
                └─────────┬─────────┘
                          ▼
                ┌───────────────────┐
                │ Canonical Aviation │
                │ Data Model         │
                └─────────┬─────────┘
                          ▼
                ┌───────────────────┐
                │ KPI Calculation   │
                │ Engine             │
                └─────────┬─────────┘
                          ▼
                ┌───────────────────┐
                │ Scenario Engine   │
                └─────────┬─────────┘
                          ▼
              ┌──────────────────────────┐
              │ WESTJET CONTROL TOWER    │
              └────────────┬─────────────┘
                           │
                 ┌─────────┴──────────┐
                 ▼                    ▼
          Streamlit App          HTML/JS App
```

Never duplicate business logic unnecessarily between the two applications.

Create a shared logical specification for:

- data mappings
- KPI definitions
- KPI formulas
- targets
- comparison logic
- scenario logic
- data-quality rules
- formatting rules

---

# 3. INPUT WORKBOOK

The primary input is:

`WestJet_Enterprise_Control_Tower_Input_Template.xlsx`

The application must dynamically read the workbook.

Do NOT hard-code the synthetic values.

The workbook contains approximately five years of monthly synthetic data:

```text
January 2022
through
December 2026
```

Support:

- 2 years
- 3 years
- 4 years
- 5 years

without changing application code.

The application must detect the available date range dynamically.

---

# 4. DATA DOMAINS

Support ALL of the following domains.

## 4.1 Flight Operations

Metrics:

- Scheduled Flights
- Departures
- Cancellations
- On-Time Departures
- D0
- D15
- ASM
- RPM
- Load Factor
- Block Hours
- Aircraft Utilization
- Active Aircraft
- Capacity
- Operational reliability

---

## 4.2 MRO / Tech Ops

Make MRO a first-class enterprise domain.

Metrics:

- Active Aircraft
- Maintenance Events
- Maintenance Hours
- Available Maintenance Hours
- Aircraft Downtime
- Dispatch Reliability
- AOG Events
- AOG Rate
- MEL Items
- Deferred Defects
- Parts Availability
- Maintenance Cost
- Maintenance Cost / Flight Hour
- Maintenance Cost / Cycle
- Repeat Defects
- Component Removals
- Reliability
- Maintenance TAT
- Aircraft Availability
- Line Maintenance
- Heavy Maintenance

Design the architecture so additional MRO fields can be added without changing the dashboard architecture.

---

## 4.3 Crew / People

Metrics:

- Headcount
- Headcount vs Plan
- Training Compliance
- Crew Recency Compliance
- SIM Completion
- CBT Completion
- Voluntary Leave Rate
- Critical Vacancies
- Sentiment Index
- Communications Reach
- Training Pipeline
- Productivity

---

## 4.4 Passenger / Commercial

Metrics:

- Bookings
- Passengers
- Cancellation Rate
- Booking Intake
- Forward Load Factor
- Book-to-Cancel Ratio
- Corporate Retention
- Direct Channel Share
- Advance Purchase Ratio
- NPS
- Passenger Growth

---

## 4.5 Revenue Management

Metrics:

- Passenger Revenue
- Cargo Revenue
- Ancillary Revenue
- Other Revenue
- Total Revenue
- RASK
- Yield
- Revenue per Passenger
- Revenue Growth
- Revenue vs Plan
- Revenue vs Prior Year

---

## 4.6 Finance

Metrics:

- Total Revenue
- Operating Cost
- Labour Cost
- Fuel Cost
- Other Operating Cost
- Cash Position
- Operating Margin
- EBIT-style profitability measures where applicable
- Cost variance
- Revenue variance
- Margin variance

---

## 4.7 Baggage

Metrics:

- Bags Handled
- Mishandled Bags
- Mishandling Rate
- Successful Delivery Rate
- Baggage Performance
- Baggage-related operational impact

---

## 4.8 Cargo

Metrics:

- Cargo Tonnes
- Cargo Shipments
- Cargo Revenue
- Cargo Yield
- Cargo Growth
- Cargo Revenue vs Plan

---

## 4.9 Airport / Ground Operations

Metrics:

- Aircraft Turns
- Turnaround Time
- Ground OTP
- Ground Incidents
- Gate/Turn Performance
- Ground Handling Performance

---

## 4.10 Fuel

Metrics:

- Fuel Price
- Fuel Volume
- Fuel Cost
- Fuel Hedging %
- Fuel Price Variance
- Fuel Cost Impact

Support scenario simulation for fuel-price changes.

---

## 4.11 Network / Routes

Metrics:

- Route
- Flights
- Passengers
- Route Revenue
- Route Cost
- Route Profitability
- Revenue per Flight
- Cost per Flight
- Load Factor
- Route Contribution

Provide route-level ranking.

---

## 4.12 Ancillary Revenue

Metrics:

- Ancillary Revenue
- Ancillary Revenue / Passenger
- Attach Rate
- Ancillary Growth
- Revenue Contribution

---

## 4.13 Data Platform

Create a dedicated enterprise Data Platform dashboard.

Metrics:

- Active Self-Service Users
- Registered Users
- Platform Tickets
- Ticket Deflection Rate
- Data Quality %
- Platform Availability %
- Average Data Freshness
- Knowledge Base Usage
- Security Groups
- Platform Adoption
- Platform Reliability

Include the management metrics:

```text
Self-Service Adoption
Knowledge Base Usage
Ticket Deflection Rate
Security Groups
Registered Users
Logs / Platform Activity
Data Quality
Availability
Freshness
```

---

## 4.14 AI / Data Products

Metrics:

- Registered Data Products
- Active Data Products
- Data Product Adoption
- Estimated Business Value
- Critical Incidents
- Product Reliability
- Product Quality
- Consumer Adoption

Support lifecycle:

```text
Idea
→ Discovery
→ Development
→ Certified
→ Production
→ Adopted
→ Scaled
→ Retired
```

---

## 4.15 Data Governance

Metrics:

- Registered Data Assets
- Classified Assets
- Assets with Owner
- Governance Quality
- Open Governance Exceptions
- Data Stewardship
- Classification Coverage
- Ownership Coverage
- Quality Exceptions

---

# 5. KPI ENGINE

Build a centralized KPI engine.

Do not calculate important KPIs directly inside individual UI components.

Example architecture:

```text
KPIEngine
 ├── calculate_load_factor()
 ├── calculate_rask()
 ├── calculate_casm()
 ├── calculate_yield()
 ├── calculate_d0()
 ├── calculate_d15()
 ├── calculate_aircraft_utilization()
 ├── calculate_dispatch_reliability()
 ├── calculate_aog_rate()
 ├── calculate_mro_cost_per_hour()
 ├── calculate_baggage_rate()
 ├── calculate_cargo_yield()
 ├── calculate_operating_margin()
 ├── calculate_ancillary_per_pax()
 ├── calculate_ticket_deflection()
 ├── calculate_data_quality()
 ├── calculate_platform_availability()
 └── calculate_data_product_adoption()
```

At minimum implement:

### Load Factor

```text
RPM / ASM
```

### RASK

```text
Passenger Revenue / ASM
```

### CASM

```text
Operating Cost / ASM
```

### Yield

```text
Passenger Revenue / RPM
```

### D0

```text
On-Time Departures / Departures
```

### D15

```text
D15 Departures / Departures
```

### Aircraft Utilization

```text
Block Hours / Active Aircraft
```

### Maintenance Cost / Flight Hour

```text
Maintenance Cost / Block Hours
```

### AOG Rate

```text
AOG Events / Active Aircraft
```

### Baggage Mishandling Rate

```text
Mishandled Bags / Bags Handled
```

### Cargo Yield

```text
Cargo Revenue / Cargo Tonnes
```

### Operating Margin

```text
(Total Revenue - Operating Cost) / Total Revenue
```

### Ancillary Revenue / Passenger

```text
Ancillary Revenue / Passengers
```

### Data Product Adoption

```text
Active Data Products / Registered Data Products
```

---

# 6. TIME INTELLIGENCE

The application must support:

- MTD
- YTD
- Prior Month
- Prior Year
- YoY $
- YoY %
- Variance to Plan
- Variance to Forecast
- Variance to Target
- Rolling 12 Months
- 3-Year Trend
- 5-Year Trend
- Selected Date Range
- Monthly
- Quarterly
- Annual

Date selection must be dynamic.

Do not assume 2025/2026.

---

# 7. GLOBAL FILTERS

Create a global filter framework.

Filters:

- Date From
- Date To
- Year
- Quarter
- Month
- Domain
- KPI Category
- Actual / Plan / Forecast
- Scenario
- Route
- Airport
- Aircraft
- Fleet
- Geography where applicable

All applicable dashboard components must respond to global filters.

---

# 8. KPI CATEGORY FILTER

Retain the concept from the reference application where users can toggle KPI categories.

Categories:

```text
Revenue
Cost
Operations
People
Customer
MRO
Network
Data Platform
AI / Data Products
Governance
```

Users should be able to show/hide categories.

---

# 9. EXECUTIVE OVERVIEW

Create an executive dashboard as the landing page.

Title:

**WestJet Enterprise Aviation Control Tower**

Subtitle:

**Enterprise Performance · Operations · Commercial · MRO · Data & AI**

Top-level KPI cards:

1. Total Revenue
2. Operating Cost
3. Operating Margin
4. RASK
5. CASM
6. Load Factor
7. D0
8. Dispatch Reliability
9. Aircraft Utilization
10. Passenger Volume
11. Cash Position
12. Data Quality
13. Platform Availability
14. Data Product Adoption

Each KPI card must contain:

- Current value
- Previous period
- YoY %
- Target
- Variance to target
- Mini trend
- Status indicator

---

# 10. DASHBOARD PAGES

Create the following navigation.

### 1. Executive Overview

Enterprise KPI summary.

### 2. Flight Operations

Operational reliability and capacity.

### 3. MRO / Tech Ops

Deep maintenance intelligence.

### 4. Passenger / Commercial

Bookings, demand, customer metrics.

### 5. Revenue Management

Revenue, RASK, yield, pricing performance.

### 6. Network / Route Profitability

Route-level performance.

### 7. Crew / People

Headcount, training, workforce.

### 8. Baggage

Baggage lifecycle and reliability.

### 9. Cargo

Cargo performance.

### 10. Airport / Ground

Turnaround and ground operations.

### 11. Fuel

Fuel consumption, pricing and exposure.

### 12. Finance

Revenue, cost, cash and margin.

### 13. Ancillary Revenue

Ancillary performance.

### 14. Data Platform

Self-service, tickets, quality, availability, freshness.

### 15. AI / Data Products

Data-product portfolio and adoption.

### 16. Data Governance

Governance and data quality.

### 17. Scenario Simulator

Interactive scenario modelling.

### 18. Scenario Outcome

Actual vs simulated outcome.

---

# 11. MRO DASHBOARD

Create a sophisticated MRO dashboard.

Top KPIs:

```text
Aircraft Availability
Dispatch Reliability
AOG
MEL
Deferred Defects
Maintenance Hours
Maintenance Cost
Cost / Flight Hour
Parts Availability
Maintenance TAT
Repeat Defects
```

Visualizations:

- Fleet availability trend
- Dispatch reliability trend
- AOG trend
- MEL trend
- Deferred defect trend
- Maintenance hours
- Maintenance cost
- Cost per flight hour
- Parts availability
- Aircraft downtime
- Fleet comparison
- Pareto of maintenance issues
- Heatmap by month
- Reliability trend

Add warning states for deterioration.

---

# 12. DATA PLATFORM DASHBOARD

Create an executive Data Platform control tower.

Primary KPIs:

```text
Self-Service Adoption
Knowledge Base Usage
Ticket Deflection
Registered Users
Active Users
Security Groups
Data Quality
Platform Availability
Data Freshness
Platform Tickets
```

Visuals:

- Self-service adoption trend
- Ticket volume
- Ticket deflection trend
- Knowledge base usage
- Registered vs active users
- Security-group growth
- Data-quality trend
- Availability trend
- Freshness trend
- Top ticket categories
- Platform usage heatmap

Include an executive summary:

```text
Platform Health
Adoption
Reliability
Quality
Support Efficiency
```

---

# 13. SCENARIO SIMULATOR

Build a real interactive scenario engine.

Inputs should include:

### Commercial

- Passenger Demand %
- Yield %
- Load Factor %

### Capacity

- Capacity %
- Flights %
- Aircraft Utilization %

### Fuel

- Fuel Price %
- Fuel Volume %

### MRO

- Maintenance Cost %
- Aircraft Availability %

### Workforce

- Labour Cost %
- Headcount %

### Operations

- Cancellation %
- D0 %
- D15 %

### Cargo

- Cargo Demand %
- Cargo Yield %

### Ancillary

- Ancillary Revenue %

### FX

- FX %

Every input must have:

- Slider
- Numeric input
- Default value
- Min
- Max
- Reset button

---

# 14. SCENARIO ENGINE

Calculate:

```text
Revenue Impact
Cost Impact
RASK Impact
CASK Impact
Load Factor Impact
Operating Margin Impact
Cash Impact
EBIT-style impact
Passenger Impact
Capacity Impact
```

Example:

```text
Fuel Price +20%
        ↓
Fuel Cost +20%
        ↓
Operating Cost increases
        ↓
CASM increases
        ↓
Operating Margin decreases
        ↓
Cash / Profitability impact
```

Another example:

```text
Passenger Demand +10%
        ↓
Passengers increase
        ↓
RPM increases
        ↓
Load Factor improves
        ↓
Passenger Revenue increases
        ↓
RASK improves
        ↓
Operating Margin improves
```

Clearly label scenario values as **simulated**.

Never present scenario output as actual company performance.

---

# 15. SCENARIO OUTCOME PAGE

Follow the reference application's concept of:

**Actual vs Simulated Scenario**

Display:

- Actual
- Baseline
- Simulated

Use comparison charts for:

- RASK
- CASK
- Revenue
- Operating Cost
- Margin
- Cash
- Load Factor
- Capacity
- Passenger Volume

Create summary tiles:

```text
Revenue Impact
Cost Impact
Margin Impact
Cash Impact
```

Include:

```text
SCENARIO ASSUMPTIONS
```

and a complete list of changed variables.

---

# 16. VISUALIZATION REQUIREMENTS

Use appropriate visualizations.

### KPI Cards

For executive metrics.

### Line Charts

For:

- trends
- YoY
- monthly performance
- rolling 12 months

### Bar Charts

For:

- domain comparisons
- route rankings
- cost components
- revenue components

### Waterfall

For:

- revenue bridge
- cost bridge
- margin bridge
- headcount vs plan
- scenario impact

### Heatmaps

For:

- operational performance
- MRO reliability
- route performance
- data quality

### Scatter Plots

For:

- route profitability
- utilization vs reliability
- maintenance cost vs aircraft age where data exists

### Pareto

For:

- maintenance issues
- baggage issues
- support tickets
- governance exceptions

### Matrix

For:

- KPI status
- route performance
- domain performance

---

# 17. UX DESIGN

The original HTML reference uses an enterprise Power BI-inspired control-tower layout with:

- left-side report/navigation structure
- page tabs
- KPI cards
- slicers
- category filters
- mini trend charts
- scenario pages
- outcome comparison

Retain these useful interaction concepts, but redesign them for WestJet.

Do NOT reproduce Qatar Airways visual identity.

---

# 18. WESTJET THEME

Use a professional WestJet-inspired aviation design.

Primary visual language:

- WestJet yellow
- Deep navy / dark charcoal
- White
- Light neutral grey
- restrained aviation blue/teal accents

Use yellow strategically for:

- active navigation
- KPI highlights
- key actions
- aviation branding

Avoid excessive yellow.

The application should look like an:

**Enterprise Airline Operations & Data Intelligence Platform**

rather than a consumer travel website.

---

# 19. HEADER

Use:

```text
WESTJET
Enterprise Aviation Control Tower
```

Subheader:

```text
Operations · Commercial · MRO · Finance · Data · AI
```

Display:

```text
Data Period
Last Refresh
Data Quality
Platform Status
```

---

# 20. DATA STATUS

Always show:

```text
DATA STATUS
● Healthy
```

or:

```text
DATA STATUS
● Warning
```

or:

```text
DATA STATUS
● Critical
```

based on validation results.

Display:

- Last successful refresh
- Records loaded
- Date range
- Data-quality score
- Validation errors
- Validation warnings

---

# 21. DATA VALIDATION

Validate:

- Required sheets
- Required columns
- Data types
- Null values
- Duplicate dates
- Duplicate route records
- Negative values where invalid
- Percentages between 0 and 1
- ASM >= RPM
- Departures <= Scheduled Flights
- Cancelled Bookings <= Bookings
- Classified Assets <= Registered Assets
- Active Products <= Registered Products

Create a validation report.

Never silently ignore bad data.

---

# 22. ERROR HANDLING

If the Excel file is missing:

Show:

```text
Input workbook not found.
Please upload:
WestJet_Enterprise_Control_Tower_Input_Template.xlsx
```

If a required sheet is missing:

Show the exact missing sheet.

If a required column is missing:

Show:

```text
Sheet: Flight_Operations
Missing column: ASM
```

Do not crash with an obscure Python/JavaScript error.

---

# 23. SYNTHETIC DATA

The supplied workbook contains synthetic development data.

Treat it explicitly as:

```text
DEMO / SYNTHETIC DATA
```

Add a visible badge:

**SYNTHETIC DATA**

Do not imply that synthetic values are actual WestJet performance.

The application architecture must allow replacement with actual enterprise data without redesigning the dashboard.

---

# 24. STREAMLIT IMPLEMENTATION

Use Python.

Recommended architecture:

```text
streamlit_app/
│
├── app.py
├── config.py
│
├── data/
│   ├── loader.py
│   ├── validator.py
│   ├── transformer.py
│   └── cache.py
│
├── models/
│   ├── aviation_model.py
│   ├── kpi_model.py
│   └── scenario_model.py
│
├── services/
│   ├── kpi_engine.py
│   ├── scenario_engine.py
│   ├── comparison_engine.py
│   └── data_quality.py
│
├── dashboards/
│   ├── executive.py
│   ├── flight_ops.py
│   ├── mro.py
│   ├── passenger.py
│   ├── revenue.py
│   ├── network.py
│   ├── people.py
│   ├── baggage.py
│   ├── cargo.py
│   ├── ground.py
│   ├── fuel.py
│   ├── finance.py
│   ├── ancillary.py
│   ├── data_platform.py
│   ├── ai_products.py
│   ├── governance.py
│   ├── simulator.py
│   └── outcome.py
│
├── components/
│   ├── kpi_card.py
│   ├── charts.py
│   ├── filters.py
│   ├── status.py
│   └── tables.py
│
├── tests/
│
├── requirements.txt
├── README.md
└── run.bat
```

---

# 25. HTML / JAVASCRIPT IMPLEMENTATION

Create a standalone browser application.

Recommended:

```text
web_app/
│
├── index.html
├── css/
│   ├── westjet-theme.css
│   ├── dashboard.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── data-loader.js
│   ├── data-validator.js
│   ├── kpi-engine.js
│   ├── comparison-engine.js
│   ├── scenario-engine.js
│   ├── charts.js
│   ├── filters.js
│   └── dashboards/
│
├── data/
│   └── sample-data.json
│
├── assets/
│
├── tests/
│
└── README.md
```

Use browser-compatible libraries where appropriate.

The application should be capable of loading converted JSON/CSV data generated from the Excel workbook.

---

# 26. RESPONSIVE DESIGN

Support:

- Desktop
- Laptop
- Tablet

Prioritize desktop executive use.

Use responsive grid layouts.

Avoid horizontal scrolling wherever practical.

---

# 27. INTERACTION REQUIREMENTS

Every filter should update relevant visuals.

Every KPI card should support:

- hover
- trend
- comparison
- status
- drill-down where applicable

Allow:

```text
KPI → Domain Dashboard
```

and:

```text
Domain Dashboard → Detailed Data
```

Provide:

```text
Reset Filters
```

button.

---

# 28. EXPORTS

Provide:

- CSV export
- filtered table export
- scenario results export
- KPI summary export

For Streamlit additionally support downloadable datasets.

---

# 29. DOCUMENTATION

Generate:

```text
README.md
ARCHITECTURE.md
DATA_MODEL.md
KPI_DICTIONARY.md
SCENARIO_ENGINE.md
DEPLOYMENT.md
USER_GUIDE.md
```

Document:

- setup
- dependencies
- workbook structure
- data mapping
- KPI formulas
- scenario formulas
- application architecture
- deployment
- troubleshooting

---

# 30. TESTING

Create automated tests for:

### Data

- workbook loading
- schema validation
- missing columns
- invalid values

### KPI

- Load Factor
- RASK
- CASM
- Yield
- D0
- D15
- Operating Margin
- MRO metrics
- Data Platform metrics

### Scenario

- Fuel +20%
- Demand +10%
- Demand -10%
- Maintenance Cost +12%
- Labour Cost +7%
- Yield +5%

### UI

Validate that:

- filters work
- pages load
- charts render
- scenario results update
- reset works
- missing-data errors are understandable

---

# 31. PERFORMANCE

Optimize for:

- 5 years monthly data
- route-level records
- repeated filtering
- scenario recalculation

Cache static data where appropriate.

Do not recalculate the entire dataset unnecessarily after every UI interaction.

---

# 32. SECURITY

Do not hard-code:

- credentials
- API keys
- passwords
- connection strings

Use environment variables for future enterprise integrations.

The current application is file-based and synthetic-data driven.

---

# 33. FUTURE DATA SOURCE ARCHITECTURE

Design so Excel can eventually be replaced by:

```text
TRAX / eMRO
AMOS
Flight Operations
Crew Systems
Revenue Management
Passenger Systems
Baggage Systems
Cargo Systems
Airport Systems
Finance
Data Platform
External APIs
```

Future architecture:

```text
Source Systems
      ↓
Data Ingestion
      ↓
Enterprise Data Platform
      ↓
Canonical Aviation Model
      ↓
KPI / Semantic Layer
      ↓
Control Tower
```

Do not implement enterprise source integrations now unless explicitly requested.

---

# 34. EXECUTIVE STORYTELLING

Every dashboard should answer:

### What happened?

Current performance.

### Why did it happen?

Drivers.

### Is it good or bad?

Target / benchmark comparison.

### What happens next?

Trend / forecast.

### What can we do?

Scenario / action.

Example:

```text
Dispatch Reliability
        ↓
98.1%
        ↓
▼ 0.7pp YoY
        ↓
Primary driver:
AOG +12%
        ↓
Scenario:
Reduce AOG by 10%
        ↓
Potential operational improvement
```

---

# 35. EXECUTIVE SUMMARY INSIGHTS

Automatically generate concise insights.

Examples:

```text
Revenue is 4.2% above prior year, primarily driven by passenger growth.

MRO cost increased 6.1%, while maintenance hours increased only 2.3%.

Dispatch reliability declined 0.8pp, with AOG events contributing to the deterioration.

Data Platform self-service adoption increased 14% while support-ticket volume declined 9%.

Data Product adoption is currently below target by 6 percentage points.
```

Clearly distinguish calculated insights from raw data.

---

# 36. DO NOT DO

Do NOT:

- copy Qatar Airways branding
- hard-code KPI values
- hard-code dates
- hard-code 2025/2026
- hard-code synthetic results into UI
- duplicate KPI formulas across pages
- mix actual and simulated data without labels
- imply synthetic data is real WestJet data
- create fake enterprise system integrations
- use fake WestJet operational statistics
- silently ignore validation errors

---

# 37. ACCEPTANCE CRITERIA

The project is complete only when:

### Data

- Excel loads successfully
- all domains load
- five years are available
- date filters work
- validation works

### KPI

- KPI calculations are dynamic
- formulas are documented
- comparison calculations work
- targets work

### Dashboard

- all 18 pages exist
- navigation works
- filters work
- visuals update
- executive overview works

### MRO

- full MRO dashboard exists
- operational maintenance KPIs work

### Data Platform

- self-service
- knowledge base
- ticket deflection
- users
- security groups
- quality
- availability
- freshness

are all represented.

### Scenario

- simulator works
- assumptions are visible
- outputs are calculated dynamically
- outcome page compares baseline vs scenario

### Applications

Both:

```text
Python + Streamlit
HTML + JavaScript
```

must work.

---

# 38. FINAL DELIVERABLES

Generate two complete packages:

```text
01_WestJet_Control_Tower_Streamlit/
```

and

```text
02_WestJet_Control_Tower_HTML_JS/
```

Each must contain:

- application source
- configuration
- documentation
- sample data
- tests
- startup instructions

Also generate:

```text
03_Shared/
    KPI_Dictionary
    Data_Model
    Scenario_Definitions
    Data_Quality_Rules
```

---

# 39. FINAL DESIGN PRINCIPLE

This is NOT simply a dashboard recreation.

Build it as a reusable **enterprise aviation intelligence product**.

The target architecture is:

```text
DATA
  ↓
TRUST
  ↓
KPI
  ↓
INSIGHT
  ↓
SCENARIO
  ↓
DECISION
```

The final experience should allow a senior executive or aviation data leader to move from:

**Enterprise performance → domain → KPI → driver → scenario → decision**

within a few interactions.

Use the supplied original HTML as the interaction/wireframe reference, but make the resulting product substantially more scalable, data-driven, modular, reusable, and WestJet-specific.

Build the solution incrementally:

1. Data layer
2. Validation
3. KPI engine
4. Executive dashboard
5. Domain dashboards
6. Scenario engine
7. Scenario outcome
8. Testing
9. Documentation
10. Final packaging

Do not stop after creating mockups. Deliver working applications.
