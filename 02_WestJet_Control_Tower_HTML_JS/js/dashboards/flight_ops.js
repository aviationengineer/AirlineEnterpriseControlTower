/* dashboards/flight_ops.js — Flight Operations (Domain 1). */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.flight_ops = {
    title: 'Flight Operations',
    subtitle: 'Scheduled flights, departures, punctuality, capacity and utilisation',
    render: function (ctx) {
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      var fo = ctx.domains.flight_operations || [];
      function inRange(col) { return fo.filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; }).map(function (r) { return r[col]; }); }
      var cards = [
        U.cardFor(ctx, 'Load Factor'), U.cardFor(ctx, 'D0'), U.cardFor(ctx, 'D15'),
        U.cardFor(ctx, 'Aircraft Utilization', { note: 'Target appears to be a daily figure — status withheld pending confirmation.' }),
        U.levelCard(ctx, 'flight_operations', 'Departures', 'Departures', { category: 'Operations', valueText: U.fmtNum(ctx.domainValue('flight_operations', 'Departures', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('flight_operations', 'Departures', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'flight_operations', 'Cancellations', 'Cancellations', { category: 'Operations', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('flight_operations', 'Cancellations', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('flight_operations', 'Cancellations', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) })
      ].join('');
      // Load Factor heatmap: year x month
      var years = Array.from(new Set(ctx.kpiFrame.map(function (r) { return r.Month.slice(0, 4); }))).sort();
      var months12 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var byMonth = {}; ctx.kpiFrame.forEach(function (r) { byMonth[r.Month] = r['Load Factor']; });
      var matrix = years.map(function (y) { return months12.map(function (_, i) { return byMonth[y + '-' + String(i + 1).padStart(2, '0')] ?? null; }); });
      function heatColour(v) { var t = Math.max(0, Math.min(1, (v - 0.7) / 0.25)); return 'rgba(0,40,85,' + (0.15 + t * 0.75).toFixed(2) + ')'; }
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<div class="chart-grid">' +
        U.section('ASM vs RPM (seat-miles)', '<div class="chart-box"><canvas id="fo-asm-rpm"></canvas></div>') +
        U.section('D0 & D15 trend', '<div class="chart-box"><canvas id="fo-d0"></canvas></div>') +
        '</div>' +
        U.section('Load Factor heatmap — by year and month', U.heatmapHTML(years, months12, matrix, heatColour, function (v) { return U.fmtPct(v); }), 'Darker = higher load factor. Values are monthly Load Factor (RPM / ASM).') +
        U.section('Monthly detail', U.tableHTML(['Month', 'Scheduled Flights', 'Departures', 'Cancellations', 'On-Time Departures', 'ASM', 'RPM', 'Block Hours', 'Active Aircraft', 'Load Factor', 'D0', 'D15', 'Aircraft Utilization'],
          fo.filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; }).map(function (r) {
            var k = ctx.kpiFrame.find(function (x) { return x.Month === r.Month; }) || {};
            return [r.Month, U.fmtNum(r['Scheduled Flights']), U.fmtNum(r.Departures), U.fmtNum(r.Cancellations), U.fmtNum(r['On-Time Departures']), U.fmtNum(r.ASM), U.fmtNum(r.RPM), U.fmtNum(r['Block Hours']), U.fmtNum(r['Active Aircraft']), U.fmtPct(k['Load Factor']), U.fmtPct(k.D0), U.fmtPct(k.D15), U.fmtNum(k['Aircraft Utilization'], 1)]; })));
    },
    mount: function (ctx) {
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      var fo = (ctx.domains.flight_operations || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      U.barChart('fo-asm-rpm', labels, [
        { label: 'ASM', data: fo.map(function (r) { return r.ASM; }), color: U.PALETTE.navy },
        { label: 'RPM', data: fo.map(function (r) { return r.RPM; }), color: U.PALETTE.blue }
      ]);
      U.lineChart('fo-d0', labels, [
        { label: 'D0', data: rows.map(function (r) { return r.D0; }), color: U.PALETTE.navy },
        { label: 'D15', data: rows.map(function (r) { return r.D15; }), color: U.PALETTE.teal },
        { label: 'D0 target', data: rows.map(function () { return ctx.targets.D0; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Scheduled Flights', 'Departures', 'Cancellations', 'ASM', 'RPM', 'Block Hours', 'Active Aircraft']].concat(
        (ctx.domains.flight_operations || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Scheduled Flights'], r.Departures, r.Cancellations, r.ASM, r.RPM, r['Block Hours'], r['Active Aircraft']]; }));
    }
  };
})();
