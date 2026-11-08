/* filters.js — global filters (brief §6) + KPI-category toggles (§7).
 * Filters: Date From, Date To, Year, Quarter, Month, Route, Actual /
 * Plan / Forecast, KPI category toggles, Reset Filters. Every applicable
 * component responds to them (pages re-render on change). Airport,
 * Aircraft, Fleet and Geography have no workbook dimension and are shown
 * disabled with an explanatory note — never filtered on invented values.
 * Plan / Forecast are disabled: no Plan/Forecast columns exist in the
 * workbook, so no plan/forecast values are fabricated.
 * Works in the browser (window.WJ).
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  var CATEGORIES = ['Revenue', 'Cost', 'Operations', 'People', 'Customer', 'MRO', 'Network', 'Data Platform', 'AI / Data Products', 'Governance'];
  var KPI_CATEGORY = {
    'Total Revenue': 'Revenue', 'Operating Cost': 'Cost', 'Operating Margin': 'Revenue',
    'RASK': 'Revenue', 'CASM': 'Cost', 'Load Factor': 'Operations', 'D0': 'Operations',
    'Dispatch Reliability': 'MRO', 'Aircraft Utilization': 'Operations', 'Passenger Volume': 'Customer',
    'Cash Position': 'Cost', 'Data Quality': 'Data Platform', 'Platform Availability': 'Data Platform',
    'Data Product Adoption': 'AI / Data Products', 'Yield': 'Revenue', 'D15': 'Operations',
    'Maintenance Cost / Flight Hour': 'MRO', 'AOG Rate': 'MRO', 'Baggage Mishandling Rate': 'Operations',
    'Cargo Yield': 'Revenue', 'Ancillary Revenue / Passenger': 'Revenue', 'Ticket Deflection Rate': 'Data Platform'
  };
  function defaultFilters(data) {
    var months = (data.kpi_calculated || []).map(function (r) { return r.Month; }).sort();
    var end = months[months.length - 1];
    var start = WJ.comparison.shiftMonth(end, -11);
    if (months.length && start < months[0]) start = months[0];
    return { from: start, to: end, year: '', quarter: '', month: '', route: 'All routes', view: 'actual', categories: CATEGORIES.slice() };
  }
  function renderFilters(host, ctx, onChange) {
    var f = ctx.filters, data = ctx.data;
    var months = (data.kpi_calculated || []).map(function (r) { return r.Month; }).sort();
    var years = Array.from(new Set(months.map(function (m) { return m.slice(0, 4); }))).sort();
    var routes = ['All routes'].concat((data.route_aggregates || []).map(function (r) { return r.Route; }).sort());
    function opts(list, sel) { return list.map(function (v) { return '<option value="' + v + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + v + '</option>'; }).join(''); }
    host.innerHTML =
      '<div class="filter-group"><label for="f-from">Date From</label><select id="f-from">' + opts(months, f.from) + '</select></div>' +
      '<div class="filter-group"><label for="f-to">Date To</label><select id="f-to">' + opts(months, f.to) + '</select></div>' +
      '<div class="filter-group"><label for="f-year">Year</label><select id="f-year"><option value="">All years</option>' + opts(years, f.year) + '</select></div>' +
      '<div class="filter-group"><label for="f-quarter">Quarter</label><select id="f-quarter"><option value="">All quarters</option>' + opts(['Q1', 'Q2', 'Q3', 'Q4'], f.quarter) + '</select></div>' +
      '<div class="filter-group"><label for="f-month">Month</label><select id="f-month"><option value="">All months</option>' + opts(months, f.month) + '</select></div>' +
      '<div class="filter-group"><label for="f-route">Route</label><select id="f-route">' + opts(routes, f.route) + '</select></div>' +
      '<div class="filter-group"><span class="filter-label">View</span><label class="radio"><input type="radio" name="f-view" value="actual" checked> Actual</label>' +
      '<label class="radio disabled" title="Plan data is not available in the loaded workbook"><input type="radio" name="f-view" value="plan" disabled> Plan (unavailable)</label>' +
      '<label class="radio disabled" title="Forecast data is not available in the loaded workbook"><input type="radio" name="f-view" value="forecast" disabled> Forecast (unavailable)</label>' +
      '<span class="filter-note">Plan / Forecast: not available in the loaded workbook — no Plan or Forecast columns exist, so no values are shown.</span></div>' +
      '<div class="filter-group"><label for="f-airport">Airport</label><select id="f-airport" disabled><option>Not available in the loaded workbook</option></select>' +
      '<label for="f-fleet">Fleet / Aircraft</label><select id="f-fleet" disabled><option>Not available in the loaded workbook</option></select>' +
      '<label for="f-geo">Geography</label><select id="f-geo" disabled><option>Not available in the loaded workbook</option></select></div>' +
      '<div class="filter-group filter-actions"><button id="f-reset" class="btn btn-secondary" type="button">Reset Filters</button>' +
      '<button id="f-export-kpi" class="btn" type="button">Export KPI summary (CSV)</button>' +
      '<button id="f-export-table" class="btn" type="button">Export filtered table (CSV)</button></div>' +
      '<div class="filter-group category-toggles"><span class="filter-label">KPI categories</span><div id="cat-toggles">' +
      CATEGORIES.map(function (c) {
        return '<label class="cat-toggle"><input type="checkbox" data-cat="' + c + '"' + (f.categories.indexOf(c) >= 0 ? ' checked' : '') + '> ' + c + '</label>';
      }).join('') + '</div></div>';
    function bind(id, evt, fn) { var el = document.getElementById(id); if (el) el.addEventListener(evt, fn); }
    bind('f-from', 'change', function (e) { f.from = e.target.value; if (f.from > f.to) f.to = f.from; f.year = ''; f.quarter = ''; f.month = ''; onChange(); });
    bind('f-to', 'change', function (e) { f.to = e.target.value; if (f.to < f.from) f.from = f.to; f.year = ''; f.quarter = ''; f.month = ''; onChange(); });
    bind('f-year', 'change', function (e) {
      f.year = e.target.value; f.quarter = ''; f.month = '';
      if (f.year) { f.from = f.year + '-01'; f.to = f.year + '-12'; if (f.to > months[months.length - 1]) f.to = months[months.length - 1]; if (f.from < months[0]) f.from = months[0]; }
      onChange();
    });
    bind('f-quarter', 'change', function (e) {
      f.quarter = e.target.value;
      if (f.quarter && f.year) {
        var q = Number(f.quarter.slice(1)), startM = (q - 1) * 3 + 1;
        f.from = f.year + '-' + String(startM).padStart(2, '0');
        f.to = f.year + '-' + String(startM + 2).padStart(2, '0');
        if (f.to > months[months.length - 1]) f.to = months[months.length - 1];
      }
      onChange();
    });
    bind('f-month', 'change', function (e) { f.month = e.target.value; if (f.month) { f.from = f.month; f.to = f.month; } onChange(); });
    bind('f-route', 'change', function (e) { f.route = e.target.value; onChange(); });
    bind('f-reset', 'click', function () {
      var d = defaultFilters(data);
      Object.keys(d).forEach(function (k) { f[k] = d[k]; });
      WJ.app.renderFilters(); WJ.app.renderPage();
    });
    bind('f-export-kpi', 'click', function () { WJ.app.exportKpiSummary(); });
    bind('f-export-table', 'click', function () { WJ.app.exportFilteredTable(); });
    host.querySelectorAll('#cat-toggles input[type=checkbox]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var cat = cb.getAttribute('data-cat');
        if (cb.checked) { if (f.categories.indexOf(cat) < 0) f.categories.push(cat); }
        else f.categories = f.categories.filter(function (c) { return c !== cat; });
        onChange();
      });
    });
  }
  function categoryVisible(filters, kpi) {
    var cat = KPI_CATEGORY[kpi];
    if (!cat) return true;
    return filters.categories.indexOf(cat) >= 0;
  }
  var F = { CATEGORIES: CATEGORIES, KPI_CATEGORY: KPI_CATEGORY, defaultFilters: defaultFilters, renderFilters: renderFilters, categoryVisible: categoryVisible };
  WJ.filters = F;
  if (typeof module !== 'undefined' && module.exports) module.exports = F;
})(typeof window !== 'undefined' ? window : globalThis);
