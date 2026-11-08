/* dashboards/ancillary.js — Ancillary Revenue (Domain 12). The KPI uses
 * the Ancillary_Revenue sheet's Passengers and Ancillary Revenue; the
 * supplied Ancillary Revenue per Passenger column is a cross-check only. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.ancillary = {
    title: 'Ancillary Revenue',
    subtitle: 'Ancillary revenue, revenue per passenger and attach rate',
    render: function (ctx) {
      var rows = (ctx.domains.ancillary || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var L = rows[rows.length - 1] || {};
      var contribution = (ctx.latest && ctx.latest['Total Revenue']) ? Number(L['Ancillary Revenue'] || 0) / ctx.latest['Total Revenue'] : null;
      var cards = [
        U.cardFor(ctx, 'Ancillary Revenue / Passenger'),
        U.levelCard(ctx, 'ancillary', 'Ancillary Revenue', 'Ancillary Revenue (Ancillary_Revenue sheet)', { category: 'Revenue', note: 'Total Revenue uses Revenue_Management’s Ancillary Revenue, which differs slightly (see Data Quality).' }),
        U.levelCard(ctx, 'ancillary', 'Ancillary Attach Rate', 'Ancillary Attach Rate', { category: 'Revenue', valueText: U.fmtPct(ctx.domainValue('ancillary', 'Ancillary Attach Rate', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('ancillary', 'Ancillary Attach Rate', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'ancillary', 'Passengers', 'Passengers (Ancillary_Revenue sheet)', { category: 'Revenue', valueText: U.fmtNum(ctx.domainValue('ancillary', 'Passengers', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('ancillary', 'Passengers', WJ.comparison.shiftMonth(ctx.latestMonth, -1))), note: 'Differs slightly from Passenger_Commercial Passengers; the Ancillary_Revenue figure is used for Ancillary Revenue / Passenger.' })
      ].join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">Revenue contribution (latest month, Ancillary Revenue / Total Revenue): <strong>' + U.fmtPct(contribution) + '</strong>. Supplied Ancillary Revenue per Passenger column (latest month): <strong>$' + U.fmtNum(L['Ancillary Revenue per Passenger'], 2) + '</strong> — cross-check only; the computed KPI governs.</p>' +
        '<div class="chart-grid">' +
        U.section('Ancillary Revenue / Passenger trend', '<div class="chart-box"><canvas id="anc-perpax"></canvas></div>') +
        U.section('Ancillary Revenue & Attach Rate', '<div class="chart-box"><canvas id="anc-rev"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Passengers', 'Ancillary Revenue', 'Ancillary Revenue / Passenger (computed)', 'Ancillary Revenue per Passenger (supplied)', 'Ancillary Attach Rate'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r.Passengers), U.fmtMoneyFull(r['Ancillary Revenue']), U.fmtKpiValue('Ancillary Revenue / Passenger', WJ.kpi.ancillaryRevenuePerPassenger(r['Ancillary Revenue'], r.Passengers)), '$' + U.fmtNum(r['Ancillary Revenue per Passenger'], 2), U.fmtPct(r['Ancillary Attach Rate'])]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.ancillary || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.lineChart('anc-perpax', labels, [
        { label: 'Ancillary Revenue / Passenger', data: rows.map(function (r) { return WJ.kpi.ancillaryRevenuePerPassenger(r['Ancillary Revenue'], r.Passengers); }), color: U.PALETTE.navy },
        { label: 'Target', data: rows.map(function () { return ctx.targets['Ancillary Revenue / Passenger']; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
      U.barChart('anc-rev', labels, [
        { label: 'Ancillary Revenue', data: rows.map(function (r) { return r['Ancillary Revenue']; }), color: U.PALETTE.navy },
        { label: 'Attach Rate (×100m, scale only)', data: rows.map(function (r) { return r['Ancillary Attach Rate'] * 100000000; }), color: U.PALETTE.teal }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Passengers', 'Ancillary Revenue', 'Ancillary Attach Rate', 'Ancillary Revenue per Passenger (supplied)']].concat(
        (ctx.domains.ancillary || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r.Passengers, r['Ancillary Revenue'], r['Ancillary Attach Rate'], r['Ancillary Revenue per Passenger']]; }));
    }
  };
})();
