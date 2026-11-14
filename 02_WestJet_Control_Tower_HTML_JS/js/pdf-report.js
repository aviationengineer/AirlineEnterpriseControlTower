/* pdf-report.js — "PDF Report" snapshot: a print-only report covering
 * every dashboard section, produced with the browser's own print flow
 * (window.print + css/print.css) — no external libraries.
 *
 * The button in the app header builds a hidden #pdf-report element:
 * a cover block (active airline theme, app title, generation time,
 * data period, Data Quality / Platform Status as shown in the header,
 * and the SYNTHETIC DATA marker), one section per dashboard page in
 * app order — the Theme & Branding page excluded, so 18 sections —
 * each with a table of that section's KPIs (name, latest-month value,
 * target where defined, change vs previous month), and a Scenario
 * Summary listing the nine preset scenarios. The browser's
 * Save-as-PDF filename comes from document.title, which is set to
 * control-tower-snapshot-YYYYMMDD-HHMM for the print and restored
 * afterwards (afterprint).
 *
 * KPI rows mirror the dashboard modules: frame KPIs go through
 * WJ.comparison.compareMonth and WJ.ui formatting exactly as
 * WJ.ui.cardFor does (including the fmtMoney override the Executive,
 * Finance and Revenue pages use for Total Revenue / Operating Cost);
 * domain level measures mirror WJ.ui.levelCard, including each page's
 * valueText formatter. No KPI math is re-implemented here. The
 * network, simulator and outcome sections mirror those pages' own
 * summary tables (route aggregates / simulated KPIs / outcome
 * metrics). The per-page card lists below are cross-checked against
 * the pages' rendered KPI cards by tests/smoke.js.
 *
 * Works in the browser (window.WJ); the pure builders also run in
 * Node (module.exports) for tests.
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};

  /* Percentage KPIs whose month change is shown in percentage points —
   * the same list WJ.ui.cardFor uses for its YoY display. */
  var PCT_KPIS = ['Load Factor', 'D0', 'D15', 'Dispatch Reliability', 'Baggage Mishandling Rate', 'Operating Margin', 'Ticket Deflection Rate', 'Data Quality', 'Platform Availability', 'Data Product Adoption'];

  /* Card catalogue, mirroring js/dashboards/*.js in app page order.
   * K(kpi, fmt): a WJ.ui.cardFor KPI; fmt 'money' mirrors the pages
   * that override valueText with fmtMoney. L(dom, col, label, fmt):
   * a WJ.ui.levelCard measure; fmt mirrors the page's valueText
   * formatter ('money' is the levelCard default). */
  function K(kpi, fmt) { return { kind: 'kpi', kpi: kpi, fmt: fmt || null }; }
  function L(dom, col, label, fmt) { return { kind: 'level', dom: dom, col: col, label: label, fmt: fmt || 'money' }; }
  var SECTIONS = [
    { id: 'executive', title: 'Executive Overview', subtitle: 'Enterprise Performance · Operations · Commercial · MRO · Data & AI', cards: [
      K('Total Revenue', 'money'), K('Operating Cost', 'money'), K('Operating Margin'), K('RASK'), K('CASM'),
      K('Load Factor'), K('D0'), K('Dispatch Reliability'), K('Aircraft Utilization'),
      L('passenger', 'Passengers', 'Passenger Volume', 'num'), L('finance', 'Cash Position', 'Cash Position'),
      K('Data Quality'), K('Platform Availability'), K('Data Product Adoption')
    ] },
    { id: 'flight_ops', title: 'Flight Operations', subtitle: 'Scheduled flights, departures, punctuality, capacity and utilisation', cards: [
      K('Load Factor'), K('D0'), K('D15'), K('Aircraft Utilization'),
      L('flight_operations', 'Departures', 'Departures', 'num'), L('flight_operations', 'Cancellations', 'Cancellations', 'num')
    ] },
    { id: 'mro', title: 'MRO / Tech Ops', subtitle: 'Maintenance, reliability, AOG, MEL and deferred defects', cards: [
      K('Dispatch Reliability'), K('AOG Rate'), K('Maintenance Cost / Flight Hour'),
      L('mro', 'MEL Items', 'MEL Items', 'num'), L('mro', 'Deferred Defects', 'Deferred Defects', 'num'),
      L('mro', 'Maintenance Hours', 'Maintenance Hours', 'num'), L('mro', 'Maintenance Cost', 'Maintenance Cost'),
      L('mro', 'Parts Availability', 'Parts Availability', 'pct'), L('mro', 'AOG Events', 'AOG Events', 'num'),
      L('mro', 'Aircraft Downtime Hours', 'Aircraft Downtime Hours', 'num'), L('mro', 'Maintenance Events', 'Maintenance Events', 'num')
    ] },
    { id: 'passenger', title: 'Passenger / Commercial', subtitle: 'Bookings, passengers, cancellation behaviour, retention and NPS', cards: [
      L('passenger', 'Passengers', 'Passengers', 'num'), L('passenger', 'Bookings', 'Bookings', 'num'),
      L('passenger', 'Cancelled Bookings', 'Cancelled Bookings', 'num'), L('passenger', 'Corporate Retention', 'Corporate Retention', 'pct'),
      L('passenger', 'Direct Channel Share', 'Direct Channel Share', 'pct'), L('passenger', 'Advance Purchase Ratio', 'Advance Purchase Ratio', 'pct'),
      L('passenger', 'NPS', 'NPS', 'num1')
    ] },
    { id: 'revenue', title: 'Revenue Management', subtitle: 'Passenger, cargo, ancillary and other revenue; RASK and yield', cards: [
      K('Total Revenue', 'money'), K('RASK'), K('Yield'),
      L('revenue', 'Passenger Revenue', 'Passenger Revenue'), L('revenue', 'Cargo Revenue', 'Cargo Revenue (Revenue_Management)'),
      L('revenue', 'Ancillary Revenue', 'Ancillary Revenue (Revenue_Management)'), L('revenue', 'Other Revenue', 'Other Revenue')
    ] },
    { id: 'network', title: 'Network / Route Profitability', subtitle: 'Route ranking, profitability and contribution', custom: 'network',
      note: 'Period aggregates for the selected filter period (the Network page has no monthly KPI cards). Route Load Factor is not computable — Network_Routes carries no ASM/RPM columns.' },
    { id: 'people', title: 'Crew / People', subtitle: 'Headcount, training, vacancies, leave and sentiment', cards: [
      L('people', 'Headcount', 'Headcount', 'num'), L('people', 'Training Compliant', 'Training Compliant (count)', 'num'),
      L('people', 'Open Critical Vacancies', 'Open Critical Vacancies', 'num'), L('people', 'Voluntary Leave Rate', 'Voluntary Leave Rate', 'pct'),
      L('people', 'Sentiment Index', 'Sentiment Index', 'num1')
    ] },
    { id: 'baggage', title: 'Baggage', subtitle: 'Bags handled, mishandling and successful delivery', cards: [
      K('Baggage Mishandling Rate'),
      L('baggage', 'Bags Handled', 'Bags Handled', 'num'), L('baggage', 'Mishandled Bags', 'Mishandled Bags', 'num'),
      L('baggage', 'Bags Delivered Successfully', 'Bags Delivered Successfully', 'num')
    ] },
    { id: 'cargo', title: 'Cargo', subtitle: 'Tonnes, shipments, revenue and yield', cards: [
      K('Cargo Yield'),
      L('cargo', 'Cargo Tonnes', 'Cargo Tonnes', 'num'), L('cargo', 'Cargo Shipments', 'Cargo Shipments', 'num'),
      L('cargo', 'Cargo Revenue', 'Cargo Revenue (Cargo sheet)')
    ] },
    { id: 'ground', title: 'Airport / Ground', subtitle: 'Turns, turnaround time, ground OTP and incidents', cards: [
      L('ground', 'Aircraft Turns', 'Aircraft Turns', 'num'), L('ground', 'Average Turnaround Minutes', 'Average Turnaround Minutes', 'min1'),
      L('ground', 'Ground OTP', 'Ground OTP', 'pct'), L('ground', 'Ground Incidents', 'Ground Incidents', 'num')
    ] },
    { id: 'fuel', title: 'Fuel', subtitle: 'Fuel price, volume, hedging and scenario impact', cards: [
      L('fuel', 'Fuel Price per Litre', 'Fuel Price per Litre', 'fuelprice'), L('fuel', 'Fuel Volume Litres', 'Fuel Volume (litres)', 'num'),
      L('fuel', 'Hedged %', 'Hedged %', 'pct'), L('finance', 'Fuel Cost', 'Fuel Cost (Finance, supplied)')
    ] },
    { id: 'finance', title: 'Finance', subtitle: 'Revenue, operating cost, cash and margin', cards: [
      K('Total Revenue', 'money'), K('Operating Cost', 'money'), K('Operating Margin'), K('CASM'),
      L('finance', 'Labour Cost', 'Labour Cost'), L('finance', 'Fuel Cost', 'Fuel Cost'),
      L('finance', 'Other Operating Cost', 'Other Operating Cost'), L('finance', 'Cash Position', 'Cash Position')
    ] },
    { id: 'ancillary', title: 'Ancillary Revenue', subtitle: 'Ancillary revenue, revenue per passenger and attach rate', cards: [
      K('Ancillary Revenue / Passenger'),
      L('ancillary', 'Ancillary Revenue', 'Ancillary Revenue (Ancillary_Revenue sheet)'),
      L('ancillary', 'Ancillary Attach Rate', 'Ancillary Attach Rate', 'pct'),
      L('ancillary', 'Passengers', 'Passengers (Ancillary_Revenue sheet)', 'num')
    ] },
    { id: 'data_platform', title: 'Data Platform', subtitle: 'Adoption, support, quality, availability and freshness', cards: [
      K('Ticket Deflection Rate'), K('Data Quality'), K('Platform Availability'),
      L('data_platform', 'Active Self-Service Users', 'Active Self-Service Users', 'num'),
      L('data_platform', 'Registered Users', 'Registered Users', 'num'),
      L('data_platform', 'Platform Tickets', 'Platform Tickets', 'num'),
      L('data_platform', 'Knowledge Base Uses', 'Knowledge Base Uses', 'num'),
      L('data_platform', 'Security Groups', 'Security Groups', 'num'),
      L('data_platform', 'Average Freshness Minutes', 'Average Freshness (minutes)', 'min1')
    ] },
    { id: 'ai_products', title: 'AI / Data Products', subtitle: 'Registered and active data products, adoption and business value', cards: [
      K('Data Product Adoption'),
      L('ai_products', 'Registered Data Products', 'Registered Data Products', 'num'),
      L('ai_products', 'Active Data Products', 'Active Data Products', 'num'),
      L('ai_products', 'Estimated Business Value', 'Estimated Business Value'),
      L('ai_products', 'Critical Incidents', 'Critical Incidents', 'num')
    ] },
    { id: 'governance', title: 'Data Governance', subtitle: 'Assets, classification, ownership and exceptions', cards: [
      L('governance', 'Registered Data Assets', 'Registered Data Assets', 'num'),
      L('governance', 'Classified Assets', 'Classified Assets', 'num'),
      L('governance', 'Assets with Owner', 'Assets with Owner', 'num'),
      L('governance', 'Governance Quality %', 'Governance Quality %', 'pct'),
      L('governance', 'Open Governance Exceptions', 'Open Governance Exceptions', 'num')
    ] },
    { id: 'simulator', title: 'Scenario Simulator', subtitle: 'Adjust parameters & visualise impact — all outputs are SIMULATED', custom: 'simulator',
      note: 'Period aggregates for the baseline period shown. With a scenario applied, Value is the SIMULATED value and Change is the simulated impact vs baseline (as on the Simulator page); otherwise Value is the baseline and Change is n/a.' },
    { id: 'outcome', title: 'Scenario Outcome', subtitle: 'Actual vs Baseline vs Simulated — all simulated values are SIMULATED', custom: 'outcome',
      note: 'Period aggregates for the selected filter period. Change is the SIMULATED change vs baseline (= Actual) when a scenario is applied, otherwise n/a.' }
  ];

  function fmtValue(fmt, name, v) {
    var U = WJ.ui;
    if (fmt === 'money') return U.fmtMoney(v);
    if (fmt === 'num') return U.fmtNum(v);
    if (fmt === 'num1') return U.fmtNum(v, 1);
    if (fmt === 'pct') return U.fmtPct(v);
    if (fmt === 'fuelprice') return '$' + U.fmtNum(v, 3);
    if (fmt === 'min1') return U.fmtNum(v, 1) + ' min';
    return U.fmtKpiValue(name, v);
  }
  function kpiRow(ctx, e) {
    var comp = WJ.comparison.compareMonth(ctx.kpiFrame || [], e.kpi, ctx.latestMonth);
    var change = 'n/a';
    if (comp.current !== null && comp.current !== undefined && comp.prior_month !== null && comp.prior_month !== undefined) {
      change = PCT_KPIS.indexOf(e.kpi) >= 0
        ? WJ.ui.fmtPP(comp.current - comp.prior_month, 1)
        : WJ.ui.fmtSignedPct(WJ.comparison.pctChange(comp.current, comp.prior_month), 1);
    }
    return {
      name: e.kpi, value: fmtValue(e.fmt, e.kpi, comp.current),
      target: WJ.ui.fmtTarget(e.kpi, (ctx.targets || {})[e.kpi]), change: change
    };
  }
  function levelRow(ctx, e) {
    var cur = ctx.domainValue(e.dom, e.col, ctx.latestMonth);
    var prev = ctx.domainValue(e.dom, e.col, WJ.comparison.shiftMonth(ctx.latestMonth, -1));
    var pc = WJ.comparison.pctChange(cur, prev);
    return {
      name: e.label, value: fmtValue(e.fmt, e.label, cur), target: 'n/a',
      change: pc === null ? 'n/a' : WJ.ui.fmtSignedPct(pc, 1)
    };
  }
  function networkRows(ctx) {
    var routes = ctx.routeAggregates || [];
    var totalProfit = routes.reduce(function (s, r) { return s + r.Route_Profit; }, 0);
    var totalRev = routes.reduce(function (s, r) { return s + r.Route_Revenue; }, 0);
    var top = routes[0];
    return [
      { name: 'Top route by profit', value: top ? String(top.Route) : 'n/a', target: 'n/a', change: 'n/a' },
      { name: 'Total route profit (period)', value: WJ.ui.fmtMoney(totalProfit), target: 'n/a', change: 'n/a' },
      { name: 'Total route revenue (period)', value: WJ.ui.fmtMoney(totalRev), target: 'n/a', change: 'n/a' },
      { name: 'Routes', value: String(routes.length), target: 'n/a', change: 'n/a' }
    ];
  }
  /* The Simulator page's "Simulated KPIs" table, in its own formats. */
  function simulatorRows(ctx) {
    var U = WJ.ui, agg = ctx.agg || {}, res = ctx.scenarioResult;
    function pctImpact(sim, base) { return (sim !== null && sim !== undefined && base) ? ((sim - base) / base * 100).toFixed(2) + '%' : 'n/a'; }
    function ppImpact(sim, base) { return (sim !== null && sim !== undefined && base !== null && base !== undefined) ? ((sim - base) * 100).toFixed(2) + 'pp' : 'n/a'; }
    /* [name, formatter, scenario-result key, baseline aggregate key, impact] */
    var defs = [
      ['RASK', function (v) { return U.fmtKpiValue('RASK', v); }, 'rask', 'RASK', function () { return pctImpact(res.rask, agg.RASK); }],
      ['CASM', function (v) { return U.fmtKpiValue('CASM', v); }, 'cask', 'CASM', function () { return pctImpact(res.cask, agg.CASM); }],
      ['Load Factor', function (v) { return U.fmtPct(v); }, 'load_factor', 'Load Factor', function () { return ppImpact(res.load_factor, agg['Load Factor']); }],
      ['Operating Margin', function (v) { return U.fmtPct(v); }, 'operating_margin', 'Operating Margin', function () { return res.margin_impact_pp === null || res.margin_impact_pp === undefined ? 'n/a' : res.margin_impact_pp.toFixed(2) + 'pp'; }],
      ['Total Revenue', function (v) { return U.fmtMoneyFull(v); }, 'total_revenue', 'Total Revenue', function () { return U.fmtMoneyFull(res.revenue_impact); }],
      ['Operating Cost', function (v) { return U.fmtMoneyFull(v); }, 'operating_cost', 'Operating Cost', function () { return U.fmtMoneyFull(res.cost_impact); }],
      ['Cash Position', function (v) { return U.fmtMoneyFull(v); }, 'cash_position', 'Cash Position', function () { return U.fmtMoneyFull(res.cash_impact); }],
      ['Passengers', function (v) { return U.fmtNum(v); }, 'passengers', 'Passengers', function () { return U.fmtNum(res.passengers - agg.Passengers); }],
      ['ASM (Capacity)', function (v) { return U.fmtNum(v); }, 'asm', 'ASM', function () { return U.fmtNum(res.asm - agg.ASM); }]
    ];
    return defs.map(function (d) {
      if (!res) return { name: d[0], value: d[1](agg[d[3]]), target: 'n/a', change: 'n/a' };
      return { name: d[0], value: d[1](res[d[2]]), target: 'n/a', change: d[4]() };
    });
  }
  /* The Outcome page's metric comparison, in its own formats. */
  function outcomeRows(ctx) {
    var U = WJ.ui, res = ctx.scenarioResult;
    var rows = res ? WJ.comparison.compareScenarios(ctx.agg, res, ctx.agg)
      : WJ.comparison.OUTCOME_METRICS.map(function (m) {
          return { metric: m, actual: (ctx.agg || {})[WJ.comparison.METRIC_KEYS[m]], simulated_vs_baseline_pct: null };
        });
    function fmtMetric(metric, v) {
      if (v === null || v === undefined) return 'n/a';
      if (metric === 'RASK' || metric === 'CASK') return U.fmtKpiValue(metric === 'CASK' ? 'CASM' : 'RASK', v);
      if (metric === 'Load Factor' || metric === 'Margin') return U.fmtPct(v);
      if (metric === 'Revenue' || metric === 'Operating Cost' || metric === 'Cash') return U.fmtMoneyFull(v);
      return U.fmtNum(v);
    }
    return rows.map(function (r) {
      return {
        name: r.metric, value: fmtMetric(r.metric, r.actual), target: 'n/a',
        change: (r.simulated_vs_baseline_pct === null || r.simulated_vs_baseline_pct === undefined)
          ? 'n/a' : (r.simulated_vs_baseline_pct * 100).toFixed(2) + '%'
      };
    });
  }
  function sectionRows(ctx, sectionId) {
    var sec = null;
    SECTIONS.forEach(function (s) { if (s.id === sectionId) sec = s; });
    if (!sec) return [];
    if (sec.custom === 'network') return networkRows(ctx);
    if (sec.custom === 'simulator') return simulatorRows(ctx);
    if (sec.custom === 'outcome') return outcomeRows(ctx);
    return sec.cards.map(function (e) { return e.kind === 'kpi' ? kpiRow(ctx, e) : levelRow(ctx, e); });
  }
  function pad(n) { var s = String(n); return s.length < 2 ? '0' + s : s; }
  function snapshotName(d) {
    return 'control-tower-snapshot-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
      '-' + pad(d.getHours()) + pad(d.getMinutes());
  }
  function fmtTimestamp(d) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ', ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function buildReportHtml(ctx, opts) {
    opts = opts || {};
    var U = WJ.ui;
    var theme = opts.theme || (WJ.theme && WJ.theme.currentTheme ? WJ.theme.currentTheme() : null) ||
      { airline: 'WestJet', iata: 'WS' };
    var meta = (ctx.data && ctx.data.metadata) || {};
    var v = ctx.validation || null;
    var generatedAt = opts.generatedAt || new Date();
    var res = ctx.scenarioResult;
    var coverMeta = [
      ['Generated', fmtTimestamp(generatedAt)],
      ['Data Period', meta.data_period ? meta.data_period.start + ' to ' + meta.data_period.end : 'n/a'],
      ['Last Refresh', meta.last_refresh || 'n/a'],
      ['Data Quality', v ? String(v.data_quality_score) + '%' : 'n/a'],
      ['Platform Status', v ? v.data_status : 'Unknown'],
      ['Snapshot period', ctx.filters.from + ' to ' + ctx.filters.to + ' · Latest month: ' + ctx.latestMonth],
      ['Scenario', res ? res.label + ' (SIMULATED)' : 'None applied']
    ];
    var html = '<div class="pdf-cover">' +
      '<p class="pdf-cover-brand">' + U.esc(theme.airline) + (theme.iata ? ' (' + U.esc(theme.iata) + ')' : '') + '</p>' +
      '<h1 class="pdf-cover-title">Enterprise Aviation Control Tower</h1>' +
      '<p class="pdf-cover-sub">PDF Snapshot Report</p>' +
      '<p class="pdf-synthetic">SYNTHETIC DATA</p>' +
      '<table class="pdf-cover-meta"><tbody>' +
      coverMeta.map(function (r) { return '<tr><th>' + U.esc(r[0]) + '</th><td>' + U.esc(r[1]) + '</td></tr>'; }).join('') +
      '</tbody></table>' +
      '<p class="pdf-cover-note">KPI values are for the latest month (' + U.esc(ctx.latestMonth) + ') unless a section note says otherwise. ' +
      'Change vs previous month is in percentage points for rate KPIs and % otherwise. Scenario values are SIMULATED.</p>' +
      '</div>';
    SECTIONS.forEach(function (sec, i) {
      var rows = sectionRows(ctx, sec.id);
      html += '<section class="pdf-section" data-page="' + U.esc(sec.id) + '">' +
        '<h2 class="pdf-section-title">' + (i + 1) + '. ' + U.esc(sec.title) + '</h2>' +
        '<p class="pdf-section-sub">' + U.esc(sec.subtitle) + '</p>' +
        (sec.note ? '<p class="pdf-section-note">' + U.esc(sec.note) + '</p>' : '') +
        '<table class="pdf-table"><thead><tr><th>KPI</th><th>Value</th><th>Target</th><th>Change vs previous month</th></tr></thead><tbody>' +
        rows.map(function (r) {
          return '<tr><td>' + U.esc(r.name) + '</td><td>' + U.esc(r.value) + '</td><td>' + U.esc(r.target) + '</td><td>' + U.esc(r.change) + '</td></tr>';
        }).join('') +
        '</tbody></table></section>';
    });
    var scenarios = ctx.scenarios || [];
    html += '<section class="pdf-section pdf-scenarios">' +
      '<h2 class="pdf-section-title">Scenario Summary</h2>' +
      '<p class="pdf-section-sub">The nine preset scenarios (definitions from the loaded workbook data). Scenario outputs are SIMULATED.</p>' +
      '<table class="pdf-table"><thead><tr><th>Scenario</th><th>Name</th><th>Variable</th><th>Change</th><th>Description</th><th>Primary KPI Impact</th></tr></thead><tbody>' +
      scenarios.map(function (s) {
        var chg = Number(s['Change %']);
        return '<tr><td>' + U.esc(s['Scenario ID']) + '</td><td>' + U.esc(s['Scenario Name']) + '</td><td>' + U.esc(s.Variable) + '</td>' +
          '<td>' + (isFinite(chg) ? (chg >= 0 ? '+' : '') + chg + '%' : 'n/a') + '</td>' +
          '<td>' + U.esc(s.Description) + '</td><td>' + U.esc(s['Primary KPI Impact']) + '</td></tr>';
      }).join('') +
      '</tbody></table></section>';
    html += '<div class="pdf-footer">SYNTHETIC DATA — all values are synthetic/demo data from the input workbook and must not be interpreted as actual airline performance. Scenario outputs are SIMULATED.</div>';
    return html;
  }
  function ensureHost() {
    if (typeof document === 'undefined' || !document.getElementById) return null;
    var host = document.getElementById('pdf-report');
    if (!host) {
      host = document.createElement('div');
      host.id = 'pdf-report';
      host.className = 'pdf-report';
      if (document.body && document.body.appendChild) document.body.appendChild(host);
    }
    return host;
  }
  function mountReport(ctx, opts) {
    var host = ensureHost();
    if (!host) return null;
    host.innerHTML = buildReportHtml(ctx, opts);
    return host;
  }
  /* Build/refresh the report with the app's current context (filters,
   * scenario, active theme), point the print filename at the snapshot
   * name via document.title, print, and restore the title afterwards. */
  function printReport() {
    if (typeof window === 'undefined' || !WJ.app || !WJ.app.state || !WJ.app.state.data) return;
    var ctx = WJ.app.buildCtx();
    if (!mountReport(ctx)) return;
    var prevTitle = document.title;
    document.title = snapshotName(new Date());
    var restored = false;
    function restore() {
      if (restored) return;
      restored = true;
      document.title = prevTitle;
      if (window.removeEventListener) window.removeEventListener('afterprint', restore);
    }
    if (window.addEventListener) window.addEventListener('afterprint', restore);
    if (typeof setTimeout !== 'undefined') setTimeout(restore, 60000); // safety net if afterprint never fires
    window.print();
  }
  function init() {
    if (typeof document === 'undefined' || !document.getElementById) return;
    var btn = document.getElementById('pdf-report-btn');
    if (btn && btn.addEventListener) btn.addEventListener('click', printReport);
  }
  var P = {
    SECTIONS: SECTIONS, PCT_KPIS: PCT_KPIS,
    sectionRows: sectionRows, buildReportHtml: buildReportHtml,
    mountReport: mountReport, printReport: printReport,
    snapshotName: snapshotName, fmtTimestamp: fmtTimestamp
  };
  WJ.pdfReport = P;
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
