/* dashboards/ground.js — Airport / Ground Operations (Domain 9). */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.ground = {
    title: 'Airport / Ground',
    subtitle: 'Turns, turnaround time, ground OTP and incidents',
    render: function (ctx) {
      var rows = (ctx.domains.ground || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var cards = [
        U.levelCard(ctx, 'ground', 'Aircraft Turns', 'Aircraft Turns', { category: 'Operations', valueText: U.fmtNum(ctx.domainValue('ground', 'Aircraft Turns', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('ground', 'Aircraft Turns', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'ground', 'Average Turnaround Minutes', 'Average Turnaround Minutes', { category: 'Operations', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('ground', 'Average Turnaround Minutes', ctx.latestMonth), 1) + ' min', prevText: U.fmtNum(ctx.domainValue('ground', 'Average Turnaround Minutes', WJ.comparison.shiftMonth(ctx.latestMonth, -1)), 1) + ' min' }),
        U.levelCard(ctx, 'ground', 'Ground OTP', 'Ground OTP', { category: 'Operations', valueText: U.fmtPct(ctx.domainValue('ground', 'Ground OTP', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('ground', 'Ground OTP', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'ground', 'Ground Incidents', 'Ground Incidents', { category: 'Operations', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('ground', 'Ground Incidents', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('ground', 'Ground Incidents', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) })
      ].join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<div class="chart-grid">' +
        U.section('Ground OTP & Turnaround Time', '<div class="chart-box"><canvas id="ground-otp"></canvas></div>') +
        U.section('Aircraft Turns & Ground Incidents', '<div class="chart-box"><canvas id="ground-turns"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Aircraft Turns', 'Average Turnaround Minutes', 'Ground OTP', 'Ground Incidents'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r['Aircraft Turns']), U.fmtNum(r['Average Turnaround Minutes'], 1), U.fmtPct(r['Ground OTP']), U.fmtNum(r['Ground Incidents'])]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.ground || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.lineChart('ground-otp', labels, [
        { label: 'Ground OTP', data: rows.map(function (r) { return r['Ground OTP']; }), color: U.PALETTE.navy },
        { label: 'Turnaround (min ÷ 100)', data: rows.map(function (r) { return r['Average Turnaround Minutes'] / 100; }), color: U.PALETTE.teal }
      ]);
      U.barChart('ground-turns', labels, [
        { label: 'Aircraft Turns', data: rows.map(function (r) { return r['Aircraft Turns']; }), color: U.PALETTE.navy },
        { label: 'Ground Incidents', data: rows.map(function (r) { return r['Ground Incidents']; }), color: U.PALETTE.red }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Aircraft Turns', 'Average Turnaround Minutes', 'Ground OTP', 'Ground Incidents']].concat(
        (ctx.domains.ground || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Aircraft Turns'], r['Average Turnaround Minutes'], r['Ground OTP'], r['Ground Incidents']]; }));
    }
  };
})();
