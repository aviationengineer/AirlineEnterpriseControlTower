/* app.js — application entry point: initialisation, routing, state,
 * header / DATA STATUS banner, exports, drill-down.
 * Pages are registered by js/dashboards/*.js as WJ.pages[id] =
 * {title, subtitle, nav, render(ctx), mount(ctx), exportRows(ctx)}.
 * State: loaded JSON, monthly KPI frame, filters, scenario (preset +
 * interactive inputs, shared by the Simulator and Outcome pages — the
 * wireframe's disconnected Simulator/Outcome pages are NOT reproduced).
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  var PAGES = [
    ['executive', 'Executive Overview'], ['flight_ops', 'Flight Operations'], ['mro', 'MRO / Tech Ops'],
    ['passenger', 'Passenger / Commercial'], ['revenue', 'Revenue Management'], ['network', 'Network / Route Profitability'],
    ['people', 'Crew / People'], ['baggage', 'Baggage'], ['cargo', 'Cargo'], ['ground', 'Airport / Ground'],
    ['fuel', 'Fuel'], ['finance', 'Finance'], ['ancillary', 'Ancillary Revenue'], ['data_platform', 'Data Platform'],
    ['ai_products', 'AI / Data Products'], ['governance', 'Data Governance'],
    ['simulator', 'Scenario Simulator'], ['outcome', 'Scenario Outcome']
  ];
  var state = {
    data: null, kpiFrame: [], validation: null, loadError: null,
    filters: null, page: 'executive',
    scenario: { presetId: null, inputs: null }
  };
  WJ.state = state;
  function monthsInRange() {
    var f = state.filters;
    return state.kpiFrame.filter(function (r) { return r.Month >= f.from && r.Month <= f.to; });
  }
  function rowFor(month) {
    var found = null;
    state.kpiFrame.forEach(function (r) { if (r.Month === month) found = r; });
    return found;
  }
  function buildCtx() {
    var f = state.filters;
    var rangeRows = monthsInRange();
    var latest = rangeRows[rangeRows.length - 1] || null;
    var latestMonth = latest ? latest.Month : f.to;
    return {
      data: state.data, domains: state.data ? state.data.domains : {},
      targets: state.data ? state.data.targets : {}, definitions: state.data ? state.data.kpi_definitions : [],
      scenarios: state.data ? state.data.scenarios : [], presetResults: state.data ? state.data.preset_results : {},
      validation: state.validation, filters: f, page: state.page,
      kpiFrame: state.kpiFrame,
      domainValue: function (dom, col, month) {
        var rows = state.data ? (state.data.domains[dom] || []) : [];
        var found = null;
        rows.forEach(function (r) { if (r.Month === month) found = r[col]; });
        return found === null || found === undefined ? null : Number(found);
      },
      months: state.kpiFrame.map(function (r) { return r.Month; }),
      rangeRows: rangeRows, latestMonth: latestMonth, latest: latest,
      prior: rowFor(WJ.comparison.shiftMonth(latestMonth, -1)),
      priorYear: rowFor(WJ.comparison.shiftMonth(latestMonth, -12)),
      agg: state.data ? WJ.kpi.aggregateKpis(state.data.domains, f.from, f.to) : {},
      baseline: state.data ? WJ.scenario.buildBaseline(state.data.domains, f.from, f.to) : null,
      scenario: state.scenario,
      scenarioResult: currentScenarioResult(),
      routeAggregates: filteredRouteAggregates()
    };
  }
  function filteredRouteAggregates() {
    if (!state.data) return [];
    var f = state.filters;
    var rows = (state.data.domains.network || []).filter(function (r) { return r.Month >= f.from && r.Month <= f.to && (f.route === 'All routes' || r.Route === f.route); });
    var byRoute = {};
    rows.forEach(function (r) {
      var a = byRoute[r.Route] || (byRoute[r.Route] = { Route: r.Route, Flights: 0, Passengers: 0, Route_Revenue: 0, Route_Cost: 0 });
      a.Flights += Number(r.Flights || 0); a.Passengers += Number(r.Passengers || 0);
      a.Route_Revenue += Number(r['Route Revenue'] || 0); a.Route_Cost += Number(r['Route Cost'] || 0);
    });
    return Object.keys(byRoute).map(function (k) {
      var a = byRoute[k];
      a.Route_Profit = a.Route_Revenue - a.Route_Cost;
      a.Revenue_per_Flight = a.Flights ? a.Route_Revenue / a.Flights : null;
      a.Cost_per_Flight = a.Flights ? a.Route_Cost / a.Flights : null;
      a.Margin = a.Route_Revenue ? a.Route_Profit / a.Route_Revenue : null;
      return a;
    }).sort(function (a, b) { return b.Route_Profit - a.Route_Profit; });
  }
  function scenarioInputs() {
    if (!state.scenario.inputs) state.scenario.inputs = WJ.scenario.defaultInputs();
    return state.scenario.inputs;
  }
  function hasScenario() {
    if (state.scenario.presetId) return true;
    var inputs = scenarioInputs();
    return Object.keys(WJ.scenario.changedVariables(inputs)).length > 0;
  }
  function currentScenarioResult() {
    if (!state.data || !hasScenario()) return null;
    var inputs = JSON.parse(JSON.stringify(scenarioInputs()));
    if (state.scenario.presetId) {
      var def = (state.data.scenarios || []).find(function (s) { return s['Scenario ID'] === state.scenario.presetId; });
      if (def) {
        var presetInputs = WJ.scenario.presetToInput(def);
        Object.keys(presetInputs).forEach(function (k) { if (k !== 'label') inputs[k] = Number(inputs[k] || 0) + Number(presetInputs[k] || 0); });
        inputs.label = presetInputs.label + (Object.keys(WJ.scenario.changedVariables(scenarioInputs())).length ? ' + interactive adjustments' : '');
      }
    }
    try { return WJ.scenario.applyScenario(WJ.scenario.buildBaseline(state.data.domains, state.filters.from, state.filters.to), inputs); }
    catch (e) { return null; }
  }
  function renderHeader() {
    var meta = state.data ? state.data.metadata : null;
    var v = state.validation;
    var el = document.getElementById('header-stats');
    if (!el) return;
    if (!meta) { el.innerHTML = '<span class="header-stat">Data not loaded</span>'; return; }
    el.innerHTML =
      '<span class="header-stat">Data Period: <strong>' + WJ.ui.esc(meta.data_period.start) + ' to ' + WJ.ui.esc(meta.data_period.end) + '</strong></span>' +
      '<span class="header-stat">Last Refresh: <strong>' + WJ.ui.esc(meta.last_refresh) + '</strong></span>' +
      '<span class="header-stat">Data Quality: <strong>' + (v ? WJ.ui.esc(String(v.data_quality_score)) + '%' : 'n/a') + '</strong></span>' +
      '<span class="header-stat">Platform Status: <strong class="status-' + (v ? v.data_status.toLowerCase() : 'unknown') + '">' + (v ? WJ.ui.esc(v.data_status) : 'Unknown') + '</strong></span>' +
      '<span class="badge-synthetic">SYNTHETIC DATA</span>';
  }
  function renderDataStatus() {
    var el = document.getElementById('data-status');
    if (!el) return;
    if (state.loadError) {
      el.innerHTML = '<div class="data-status critical"><strong>DATA STATUS: Critical</strong> — ' + WJ.ui.esc(state.loadError.message) +
        ' <label class="upload-label">Upload converted JSON <input type="file" id="upload-json" accept=".json"></label></div>';
      var up = document.getElementById('upload-json');
      if (up) up.addEventListener('change', function (e) { loadFromFile(e.target.files[0]); });
      return;
    }
    var meta = state.data.metadata, v = state.validation;
    var records = Object.keys(state.data.domains).reduce(function (s, k) { return s + (state.data.domains[k] || []).length; }, 0);
    var issues = (v.issues || []).map(function (i) {
      return '<li><strong>' + WJ.ui.esc(i.rule_id) + '</strong> [' + WJ.ui.esc(i.severity) + '] ' + WJ.ui.esc(i.message) + '</li>';
    }).join('');
    el.innerHTML = '<div class="data-status ' + v.data_status.toLowerCase() + '">' +
      '<strong>DATA STATUS: ' + WJ.ui.esc(v.data_status) + '</strong>' +
      '<span>Last successful refresh: ' + WJ.ui.esc(meta.last_refresh) + '</span>' +
      '<span>Records loaded: ' + records.toLocaleString('en-GB') + ' (' + meta.n_months + ' months)</span>' +
      '<span>Date range: ' + WJ.ui.esc(meta.data_period.start) + ' to ' + WJ.ui.esc(meta.data_period.end) + '</span>' +
      '<span>Data-quality score: ' + WJ.ui.esc(String(v.data_quality_score)) + '%</span>' +
      '<span>Validation errors: ' + v.n_errors + ' · warnings: ' + v.n_warnings + ' · checks: ' + v.n_checks + '</span>' +
      '<button id="dq-toggle" class="btn btn-small" type="button">Validation report (' + v.issues.length + ')</button></div>' +
      '<div id="dq-panel" class="dq-panel" hidden><h3>Validation report</h3>' +
      (v.issues.length ? '<ul>' + issues + '</ul>' : '<p>No validation issues found.</p>') +
      '<p class="panel-note">Known workbook quirks (passenger-count, Active Aircraft, Assets with Owner, duplicated Cargo/Ancillary Revenue) are reported as observations above and are not reconciled. Cash impact on multi-month baselines is illustrative.</p></div>';
    var btn = document.getElementById('dq-toggle');
    if (btn) btn.addEventListener('click', function () {
      var p = document.getElementById('dq-panel'); if (p) p.hidden = !p.hidden;
    });
  }
  function renderNav() {
    var nav = document.getElementById('main-nav');
    if (!nav) return;
    nav.innerHTML = PAGES.map(function (p) {
      return '<a href="#/' + p[0] + '" data-page="' + p[0] + '" class="nav-link' + (state.page === p[0] ? ' active' : '') + '">' + WJ.ui.esc(p[1]) + '</a>';
    }).join('');
    nav.querySelectorAll('a[data-page]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); goTo(a.getAttribute('data-page')); });
    });
  }
  function renderFilters() {
    var host = document.getElementById('filters-bar');
    if (!host || !state.data) return;
    WJ.filters.renderFilters(host, buildCtx(), function () { renderPage(); });
  }
  function renderPage() {
    WJ.charts.destroyAll();
    var main = document.getElementById('page');
    if (!main) return;
    renderNav(); renderHeader();
    if (state.loadError || !state.data) {
      main.innerHTML = '<section class="panel"><h2>Data not loaded</h2><p>' + WJ.ui.esc(state.loadError ? state.loadError.message : 'Loading…') + '</p></section>';
      return;
    }
    var page = (WJ.pages || {})[state.page];
    if (!page) { main.innerHTML = '<section class="panel"><h2>Page not found</h2></section>'; return; }
    var ctx = buildCtx();
    // Category filter: hide KPI cards whose category is toggled off.
    main.innerHTML = '<div class="page-head"><h2>' + WJ.ui.esc(page.title) + '</h2><p>' + WJ.ui.esc(page.subtitle || '') + '</p>' +
      '<span class="badge-synthetic">SYNTHETIC DATA</span></div>' + page.render(ctx);
    main.querySelectorAll('.kpi-card[data-category]').forEach(function (card) {
      if (state.filters.categories.indexOf(card.getAttribute('data-category')) < 0) card.style.display = 'none';
    });
    main.querySelectorAll('[data-drill]').forEach(function (el) {
      el.addEventListener('click', function () { goTo(el.getAttribute('data-drill')); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') goTo(el.getAttribute('data-drill')); });
    });
    if (page.mount) page.mount(ctx);
    WJ.charts.drawSparklines(main);
    var exp = document.getElementById('export-scenario');
    if (exp) exp.addEventListener('click', function () { exportScenarioResults(); });
    var expT = document.getElementById('export-table-page');
    if (expT) expT.addEventListener('click', function () { exportFilteredTable(); });
  }
  function goTo(page) {
    if (PAGES.some(function (p) { return p[0] === page; })) state.page = page;
    if (typeof location !== 'undefined') location.hash = '#/' + state.page;
    renderPage();
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  }
  function exportKpiSummary() {
    if (!state.data) return;
    var ctx = buildCtx();
    var rows = [['SYNTHETIC DATA — WestJet Enterprise Aviation Control Tower KPI summary (synthetic data; not actual WestJet performance)'],
      ['Period', ctx.filters.from + ' to ' + ctx.filters.to], ['KPI', 'Current', 'Previous', 'YoY %', 'Target', 'Variance to target']];
    var defs = ctx.definitions;
    defs.forEach(function (d) {
      var kpi = d.KPI;
      var comp = WJ.comparison.compareMonth(state.kpiFrame, kpi, ctx.latestMonth);
      rows.push([kpi, comp.current === null || comp.current === undefined ? 'n/a' : comp.current,
        comp.prior_month === null || comp.prior_month === undefined ? 'n/a' : comp.prior_month,
        comp.yoy_pct === null || comp.yoy_pct === undefined ? 'n/a' : (comp.yoy_pct * 100).toFixed(2) + '%',
        ctx.targets[kpi] === undefined ? 'n/a' : ctx.targets[kpi],
        WJ.kpi.varianceToTarget(comp.current, ctx.targets[kpi]) === null ? 'n/a' : (WJ.kpi.varianceToTarget(comp.current, ctx.targets[kpi]) * 100).toFixed(2) + '%']);
    });
    WJ.ui.download('kpi-summary-' + ctx.filters.from + '-to-' + ctx.filters.to + '.csv', WJ.ui.toCSV(rows));
  }
  function exportFilteredTable() {
    if (!state.data) return;
    var ctx = buildCtx();
    var page = (WJ.pages || {})[state.page];
    var rows = page && page.exportRows ? page.exportRows(ctx) : [['Month', 'Total Revenue', 'Operating Cost', 'Load Factor', 'RASK', 'CASM']].concat(
      ctx.rangeRows.map(function (r) { return [r.Month, r['Total Revenue'], r['Operating Cost'], r['Load Factor'], r['RASK'], r['CASM']]; }));
    rows.unshift(['SYNTHETIC DATA — ' + page.title + ' (synthetic data; not actual WestJet performance)']);
    WJ.ui.download('filtered-table-' + state.page + '-' + ctx.filters.from + '-to-' + ctx.filters.to + '.csv', WJ.ui.toCSV(rows));
  }
  function exportScenarioResults() {
    if (!state.data) return;
    var ctx = buildCtx();
    var res = ctx.scenarioResult;
    var rows = [['SYNTHETIC DATA — scenario results are SIMULATED, not actual performance. Cash impact on multi-month baselines is illustrative.'],
      ['Scenario', res ? res.label : 'No scenario applied'], ['Period', ctx.filters.from + ' to ' + ctx.filters.to],
      ['Metric', 'Baseline', 'Simulated', 'Impact']];
    if (res) {
      WJ.comparison.compareScenarios(ctx.agg, res, ctx.agg).forEach(function (r) {
        rows.push([r.metric, r.baseline, r.simulated, r.simulated_vs_baseline_abs]);
      });
      rows.push(['Revenue Impact', '', '', res.revenue_impact], ['Cost Impact', '', '', res.cost_impact],
        ['Margin Impact (pp)', '', '', res.margin_impact_pp], ['Cash Impact (illustrative)', '', '', res.cash_impact]);
      rows.push(['SCENARIO ASSUMPTIONS']);
      res.assumptions.forEach(function (a) { rows.push([a]); });
      var changed = WJ.scenario.changedVariables(scenarioInputs());
      rows.push(['Changed variables']);
      Object.keys(changed).forEach(function (k) { rows.push([WJ.scenario.INPUT_LABELS[k] || k, changed[k] + '%']); });
      if (state.scenario.presetId) rows.push(['Preset', state.scenario.presetId]);
    }
    WJ.ui.download('scenario-results-' + ctx.filters.from + '-to-' + ctx.filters.to + '.csv', WJ.ui.toCSV(rows));
  }
  function loadFromFile(file) {
    WJ.loader.loadDataFromFile(file).then(function (data) { onDataLoaded(data); })
      .catch(function (err) { state.loadError = err; renderDataStatus(); renderPage(); });
  }
  function onDataLoaded(data) {
    state.data = data;
    state.loadError = null;
    state.kpiFrame = WJ.kpi.computeKpiFrame(data.domains);
    state.validation = WJ.validator.validateData(data);
    state.filters = WJ.filters.defaultFilters(data);
    state.scenario.inputs = WJ.scenario.defaultInputs();
    renderDataStatus(); renderFilters(); renderPage();
  }
  function init() {
    var hash = (typeof location !== 'undefined' && location.hash || '').replace('#/', '');
    if (PAGES.some(function (p) { return p[0] === hash; })) state.page = hash;
    if (typeof window !== 'undefined') window.addEventListener('hashchange', function () {
      var h = location.hash.replace('#/', '');
      if (PAGES.some(function (p) { return p[0] === h; }) && h !== state.page) { state.page = h; renderPage(); }
    });
    WJ.loader.loadData().then(onDataLoaded).catch(function (err) {
      state.loadError = err; renderDataStatus(); renderPage();
    });
  }
  var A = {
    PAGES: PAGES, state: state, init: init, goTo: goTo, renderPage: renderPage, renderFilters: renderFilters,
    buildCtx: buildCtx, hasScenario: hasScenario, scenarioInputs: scenarioInputs,
    exportKpiSummary: exportKpiSummary, exportFilteredTable: exportFilteredTable, exportScenarioResults: exportScenarioResults
  };
  WJ.app = A;
  if (typeof module !== 'undefined' && module.exports) module.exports = A;
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
