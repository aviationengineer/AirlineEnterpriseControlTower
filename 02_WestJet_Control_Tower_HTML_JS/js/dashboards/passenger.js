/* dashboards/passenger.js — Passenger / Commercial (Domain 4). */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.passenger = {
    title: 'Passenger / Commercial',
    subtitle: 'Bookings, passengers, cancellation behaviour, retention and NPS',
    render: function (ctx) {
      var rows = (ctx.domains.passenger || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var L = rows[rows.length - 1] || {};
      function derived(col, fn) { return fn(L); }
      var cancelRate = U.fmtPct(WJ.kpi.cancellationRate(L['Cancelled Bookings'], L.Bookings));
      var cards = [
        U.levelCard(ctx, 'passenger', 'Passengers', 'Passengers', { category: 'Customer', drill: 'network', valueText: U.fmtNum(ctx.domainValue('passenger', 'Passengers', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('passenger', 'Passengers', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'passenger', 'Bookings', 'Bookings', { category: 'Customer', valueText: U.fmtNum(ctx.domainValue('passenger', 'Bookings', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('passenger', 'Bookings', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'passenger', 'Cancelled Bookings', 'Cancelled Bookings', { category: 'Customer', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('passenger', 'Cancelled Bookings', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('passenger', 'Cancelled Bookings', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'passenger', 'Corporate Retention', 'Corporate Retention', { category: 'Customer', valueText: U.fmtPct(ctx.domainValue('passenger', 'Corporate Retention', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('passenger', 'Corporate Retention', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'passenger', 'Direct Channel Share', 'Direct Channel Share', { category: 'Customer', valueText: U.fmtPct(ctx.domainValue('passenger', 'Direct Channel Share', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('passenger', 'Direct Channel Share', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'passenger', 'Advance Purchase Ratio', 'Advance Purchase Ratio', { category: 'Customer', valueText: U.fmtPct(ctx.domainValue('passenger', 'Advance Purchase Ratio', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('passenger', 'Advance Purchase Ratio', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'passenger', 'NPS', 'NPS', { category: 'Customer', valueText: U.fmtNum(ctx.domainValue('passenger', 'NPS', ctx.latestMonth), 1), prevText: U.fmtNum(ctx.domainValue('passenger', 'NPS', WJ.comparison.shiftMonth(ctx.latestMonth, -1)), 1) })
      ].join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">Cancellation Rate (latest month): <strong>' + cancelRate + '</strong> — Cancelled Bookings / Bookings. Book-to-Cancel Ratio: <strong>' + U.fmtNum(WJ.kpi.bookToCancelRatio(L.Bookings, L['Cancelled Bookings']), 1) + '</strong>. Forward Load Factor and Booking Intake have no workbook column and are not shown.</p>' +
        '<div class="chart-grid">' +
        U.section('Passengers & Bookings', '<div class="chart-box"><canvas id="pax-vol"></canvas></div>') +
        U.section('Cancellation Rate & NPS', '<div class="chart-box"><canvas id="pax-cancel"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Bookings', 'Passengers', 'Cancelled Bookings', 'Cancellation Rate', 'Corporate Retention', 'Direct Channel Share', 'Advance Purchase Ratio', 'NPS'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r.Bookings), U.fmtNum(r.Passengers), U.fmtNum(r['Cancelled Bookings']), U.fmtPct(WJ.kpi.cancellationRate(r['Cancelled Bookings'], r.Bookings)), U.fmtPct(r['Corporate Retention']), U.fmtPct(r['Direct Channel Share']), U.fmtPct(r['Advance Purchase Ratio']), U.fmtNum(r.NPS, 1)]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.passenger || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.barChart('pax-vol', labels, [
        { label: 'Passengers', data: rows.map(function (r) { return r.Passengers; }), color: U.PALETTE.navy },
        { label: 'Bookings', data: rows.map(function (r) { return r.Bookings; }), color: U.PALETTE.blue }
      ]);
      U.lineChart('pax-cancel', labels, [
        { label: 'Cancellation Rate', data: rows.map(function (r) { return WJ.kpi.cancellationRate(r['Cancelled Bookings'], r.Bookings); }), color: U.PALETTE.red },
        { label: 'NPS (÷100)', data: rows.map(function (r) { return r.NPS / 100; }), color: U.PALETTE.teal }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Bookings', 'Passengers', 'Cancelled Bookings', 'Corporate Retention', 'Direct Channel Share', 'Advance Purchase Ratio', 'NPS']].concat(
        (ctx.domains.passenger || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r.Bookings, r.Passengers, r['Cancelled Bookings'], r['Corporate Retention'], r['Direct Channel Share'], r['Advance Purchase Ratio'], r.NPS]; }));
    }
  };
})();
