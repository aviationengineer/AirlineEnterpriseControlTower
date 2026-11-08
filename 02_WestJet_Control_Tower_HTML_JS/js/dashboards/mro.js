/* dashboards/mro.js — MRO / Tech Ops (brief §10). Top 11 KPIs, warning
 * states for deterioration, dispatch/AOG/MEL trends, maintenance cost,
 * Pareto of maintenance issues, reliability heatmap. KPIs with no workbook
 * column (Repeat Defects, Component Removals, Maintenance TAT, Aircraft
 * Availability, Line/Heavy split, Cost/Cycle) are shown as not available,
 * never invented. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  function warn(ctx, label, value, target, direction, better) {
    if (value === null || value === undefined) return '';
    var bad = target !== null && target !== undefined
      ? (direction === 'Lower is better' ? value > target : value < target)
      : !better;
    return bad ? '<p class="warning">⚠ ' + U.esc(label) + ' is deteriorating / off target (' + U.esc(String(value)) + ').</p>' : '';
  }
  WJ.pages.mro = {
    title: 'MRO / Tech Ops',
    subtitle: 'Maintenance, reliability, AOG, MEL and deferred defects',
    render: function (ctx) {
      var L = ctx.latest || {};
      var mroRows = (ctx.domains.mro || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var cards = [
        U.cardFor(ctx, 'Dispatch Reliability'),
        U.cardFor(ctx, 'AOG Rate'),
        U.cardFor(ctx, 'Maintenance Cost / Flight Hour'),
        U.levelCard(ctx, 'mro', 'MEL Items', 'MEL Items', { category: 'MRO', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('mro', 'MEL Items', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('mro', 'MEL Items', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'mro', 'Deferred Defects', 'Deferred Defects', { category: 'MRO', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('mro', 'Deferred Defects', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('mro', 'Deferred Defects', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'mro', 'Maintenance Hours', 'Maintenance Hours', { category: 'MRO', valueText: U.fmtNum(ctx.domainValue('mro', 'Maintenance Hours', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('mro', 'Maintenance Hours', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'mro', 'Maintenance Cost', 'Maintenance Cost', { category: 'MRO', direction: 'Lower is better' }),
        U.levelCard(ctx, 'mro', 'Parts Availability', 'Parts Availability', { category: 'MRO', valueText: U.fmtPct(ctx.domainValue('mro', 'Parts Availability', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('mro', 'Parts Availability', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'mro', 'AOG Events', 'AOG Events', { category: 'MRO', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('mro', 'AOG Events', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('mro', 'AOG Events', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'mro', 'Aircraft Downtime Hours', 'Aircraft Downtime Hours', { category: 'MRO', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('mro', 'Aircraft Downtime Hours', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('mro', 'Aircraft Downtime Hours', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'mro', 'Maintenance Events', 'Maintenance Events', { category: 'MRO', valueText: U.fmtNum(ctx.domainValue('mro', 'Maintenance Events', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('mro', 'Maintenance Events', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) })
      ].join('');
      var warnings = warn(ctx, 'Dispatch Reliability', L['Dispatch Reliability'], ctx.targets['Dispatch Reliability'], 'Higher is better')
        + warn(ctx, 'AOG Rate', L['AOG Rate'], ctx.targets['AOG Rate'], 'Lower is better')
        + warn(ctx, 'Maintenance Cost / Flight Hour', L['Maintenance Cost / Flight Hour'], ctx.targets['Maintenance Cost / Flight Hour'], 'Lower is better');
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      var totals = ['MEL Items', 'Deferred Defects', 'AOG Events', 'Maintenance Events'].map(function (c) {
        return { label: c, value: mroRows.reduce(function (s, r) { return s + Number(r[c] || 0); }, 0) };
      }).sort(function (a, b) { return b.value - a.value; });
      return '<div class="kpi-grid">' + cards + '</div>' +
        (warnings ? '<div class="warnings">' + warnings + '</div>' : '<p class="ok-note">No MRO KPI is off target in the latest month.</p>') +
        '<div class="chart-grid">' +
        U.section('Dispatch Reliability trend', '<div class="chart-box"><canvas id="mro-dispatch"></canvas></div>') +
        U.section('AOG Events & MEL Items', '<div class="chart-box"><canvas id="mro-aog"></canvas></div>') +
        '</div><div class="chart-grid">' +
        U.section('Maintenance Cost & Cost / Flight Hour', '<div class="chart-box"><canvas id="mro-cost"></canvas></div>') +
        U.section('Pareto — maintenance issues in period (counts)', '<div class="chart-box"><canvas id="mro-pareto"></canvas></div><p class="panel-note">Counts summed over the selected period: MEL Items, Deferred Defects, AOG Events, Maintenance Events.</p>') +
        '</div>' +
        U.section('Not in workbook — not computed', '<p>Repeat Defects, Component Removals, Maintenance TAT, Aircraft Availability, Line / Heavy Maintenance split and Maintenance Cost / Cycle have no workbook column and are not shown as values.</p>') +
        U.section('Monthly detail', U.tableHTML(['Month', 'Active Aircraft', 'Maintenance Events', 'Maintenance Hours', 'Downtime Hours', 'Dispatch Reliability', 'AOG Events', 'MEL Items', 'Deferred Defects', 'Parts Availability', 'Maintenance Cost'],
          mroRows.map(function (r) { return [r.Month, U.fmtNum(r['Active Aircraft']), U.fmtNum(r['Maintenance Events']), U.fmtNum(r['Maintenance Hours']), U.fmtNum(r['Aircraft Downtime Hours']), U.fmtPct(r['Dispatch Reliability']), U.fmtNum(r['AOG Events']), U.fmtNum(r['MEL Items']), U.fmtNum(r['Deferred Defects']), U.fmtPct(r['Parts Availability']), U.fmtMoneyFull(r['Maintenance Cost'])]; })));
    },
    mount: function (ctx) {
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      var mroRows = (ctx.domains.mro || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      U.lineChart('mro-dispatch', labels, [
        { label: 'Dispatch Reliability', data: rows.map(function (r) { return r['Dispatch Reliability']; }), color: U.PALETTE.navy },
        { label: 'Target', data: rows.map(function () { return ctx.targets['Dispatch Reliability']; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
      U.barChart('mro-aog', labels, [
        { label: 'AOG Events', data: mroRows.map(function (r) { return r['AOG Events']; }), color: U.PALETTE.red },
        { label: 'MEL Items', data: mroRows.map(function (r) { return r['MEL Items']; }), color: U.PALETTE.blue }
      ]);
      U.lineChart('mro-cost', labels, [
        { label: 'Maintenance Cost / Flight Hour', data: rows.map(function (r) { return r['Maintenance Cost / Flight Hour']; }), color: U.PALETTE.navy },
        { label: 'Target', data: rows.map(function () { return ctx.targets['Maintenance Cost / Flight Hour']; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
      var totals = ['MEL Items', 'Deferred Defects', 'AOG Events', 'Maintenance Events'].map(function (c) {
        return { label: c, value: mroRows.reduce(function (s, r) { return s + Number(r[c] || 0); }, 0) };
      }).sort(function (a, b) { return b.value - a.value; });
      U.paretoChart('mro-pareto', totals.map(function (t) { return t.label; }), totals.map(function (t) { return t.value; }));
    },
    exportRows: function (ctx) {
      return [['Month', 'Active Aircraft', 'Maintenance Events', 'Maintenance Hours', 'Aircraft Downtime Hours', 'Dispatch Reliability', 'AOG Events', 'MEL Items', 'Deferred Defects', 'Parts Availability', 'Maintenance Cost']].concat(
        (ctx.domains.mro || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Active Aircraft'], r['Maintenance Events'], r['Maintenance Hours'], r['Aircraft Downtime Hours'], r['Dispatch Reliability'], r['AOG Events'], r['MEL Items'], r['Deferred Defects'], r['Parts Availability'], r['Maintenance Cost']]; }));
    }
  };
})();
