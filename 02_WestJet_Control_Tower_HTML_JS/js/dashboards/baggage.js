/* dashboards/baggage.js — Baggage (Domain 7). */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.baggage = {
    title: 'Baggage',
    subtitle: 'Bags handled, mishandling and successful delivery',
    render: function (ctx) {
      var rows = (ctx.domains.baggage || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var cards = [
        U.cardFor(ctx, 'Baggage Mishandling Rate'),
        U.levelCard(ctx, 'baggage', 'Bags Handled', 'Bags Handled', { category: 'Operations', valueText: U.fmtNum(ctx.domainValue('baggage', 'Bags Handled', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('baggage', 'Bags Handled', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'baggage', 'Mishandled Bags', 'Mishandled Bags', { category: 'Operations', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('baggage', 'Mishandled Bags', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('baggage', 'Mishandled Bags', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'baggage', 'Bags Delivered Successfully', 'Bags Delivered Successfully', { category: 'Operations', valueText: U.fmtNum(ctx.domainValue('baggage', 'Bags Delivered Successfully', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('baggage', 'Bags Delivered Successfully', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) })
      ].join('');
      var L = rows[rows.length - 1] || {};
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">Successful Delivery Rate (latest month): <strong>' + U.fmtPct(WJ.kpi.successfulDeliveryRate(L['Bags Delivered Successfully'], L['Bags Handled'])) + '</strong> — Bags Delivered Successfully / Bags Handled.</p>' +
        '<div class="chart-grid">' +
        U.section('Mishandling Rate trend', '<div class="chart-box"><canvas id="bag-rate"></canvas></div>') +
        U.section('Bags handled vs mishandled', '<div class="chart-box"><canvas id="bag-vol"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Bags Handled', 'Mishandled Bags', 'Bags Delivered Successfully', 'Mishandling Rate', 'Successful Delivery Rate'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r['Bags Handled']), U.fmtNum(r['Mishandled Bags']), U.fmtNum(r['Bags Delivered Successfully']), U.fmtPct(WJ.kpi.baggageMishandlingRate(r['Mishandled Bags'], r['Bags Handled'])), U.fmtPct(WJ.kpi.successfulDeliveryRate(r['Bags Delivered Successfully'], r['Bags Handled']))]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.baggage || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.lineChart('bag-rate', labels, [
        { label: 'Mishandling Rate', data: rows.map(function (r) { return WJ.kpi.baggageMishandlingRate(r['Mishandled Bags'], r['Bags Handled']); }), color: U.PALETTE.red },
        { label: 'Target', data: rows.map(function () { return ctx.targets['Baggage Mishandling Rate']; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
      U.barChart('bag-vol', labels, [
        { label: 'Bags Handled', data: rows.map(function (r) { return r['Bags Handled']; }), color: U.PALETTE.navy },
        { label: 'Mishandled Bags', data: rows.map(function (r) { return r['Mishandled Bags']; }), color: U.PALETTE.red }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Bags Handled', 'Mishandled Bags', 'Bags Delivered Successfully']].concat(
        (ctx.domains.baggage || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Bags Handled'], r['Mishandled Bags'], r['Bags Delivered Successfully']]; }));
    }
  };
})();
