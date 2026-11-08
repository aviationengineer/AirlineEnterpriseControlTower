/* dashboards/revenue.js — Revenue Management (Domain 5). */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.revenue = {
    title: 'Revenue Management',
    subtitle: 'Passenger, cargo, ancillary and other revenue; RASK and yield',
    render: function (ctx) {
      var cards = [
        U.cardFor(ctx, 'Total Revenue', { valueText: U.fmtMoney(ctx.latest ? ctx.latest['Total Revenue'] : null), prevText: U.fmtMoney(ctx.prior ? ctx.prior['Total Revenue'] : null) }),
        U.cardFor(ctx, 'RASK'), U.cardFor(ctx, 'Yield'),
        U.levelCard(ctx, 'revenue', 'Passenger Revenue', 'Passenger Revenue', { category: 'Revenue' }),
        U.levelCard(ctx, 'revenue', 'Cargo Revenue', 'Cargo Revenue (Revenue_Management)', { category: 'Revenue', note: 'Total Revenue uses this sheet’s Cargo Revenue; the Cargo sheet carries a slightly different figure (see Data Quality).' }),
        U.levelCard(ctx, 'revenue', 'Ancillary Revenue', 'Ancillary Revenue (Revenue_Management)', { category: 'Revenue', note: 'Total Revenue uses this sheet’s Ancillary Revenue; the Ancillary_Revenue sheet carries a slightly different figure.' }),
        U.levelCard(ctx, 'revenue', 'Other Revenue', 'Other Revenue', { category: 'Revenue' })
      ].join('');
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<div class="chart-grid">' +
        U.section('Revenue components (waterfall, period total)', '<div class="chart-box"><canvas id="rev-waterfall"></canvas></div><p class="panel-note">Total Revenue = Passenger + Cargo + Ancillary + Other Revenue (Revenue_Management).</p>') +
        U.section('RASK vs Yield trend', '<div class="chart-box"><canvas id="rev-rask"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Passenger Revenue', 'Cargo Revenue', 'Ancillary Revenue', 'Other Revenue', 'Total Revenue', 'RASK', 'Yield'],
          rows.map(function (r) { return [r.Month, U.fmtMoneyFull(ctx.domainValue('revenue', 'Passenger Revenue', r.Month)), U.fmtMoneyFull(ctx.domainValue('revenue', 'Cargo Revenue', r.Month)), U.fmtMoneyFull(ctx.domainValue('revenue', 'Ancillary Revenue', r.Month)), U.fmtMoneyFull(ctx.domainValue('revenue', 'Other Revenue', r.Month)), U.fmtMoneyFull(r['Total Revenue']), U.fmtKpiValue('RASK', r.RASK), U.fmtKpiValue('Yield', r.Yield)]; })));
    },
    mount: function (ctx) {
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      var rev = ctx.domains.revenue || [];
      function sumIn(col) { return rev.filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; }).reduce(function (s, r) { return s + Number(r[col] || 0); }, 0); }
      var total = sumIn('Passenger Revenue') + sumIn('Cargo Revenue') + sumIn('Ancillary Revenue') + sumIn('Other Revenue');
      U.waterfallChart('rev-waterfall', ['Passenger Revenue', 'Cargo Revenue', 'Ancillary Revenue', 'Other Revenue', 'Total Revenue'],
        [sumIn('Passenger Revenue'), sumIn('Cargo Revenue'), sumIn('Ancillary Revenue'), sumIn('Other Revenue'), total], {});
      U.lineChart('rev-rask', labels, [
        { label: 'RASK', data: rows.map(function (r) { return r.RASK; }), color: U.PALETTE.navy },
        { label: 'Yield', data: rows.map(function (r) { return r.Yield; }), color: U.PALETTE.teal },
        { label: 'RASK target', data: rows.map(function () { return ctx.targets.RASK; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Passenger Revenue', 'Cargo Revenue', 'Ancillary Revenue', 'Other Revenue', 'Total Revenue', 'RASK', 'Yield']].concat(
        ctx.rangeRows.map(function (r) { return [r.Month, ctx.domainValue('revenue', 'Passenger Revenue', r.Month), ctx.domainValue('revenue', 'Cargo Revenue', r.Month), ctx.domainValue('revenue', 'Ancillary Revenue', r.Month), ctx.domainValue('revenue', 'Other Revenue', r.Month), r['Total Revenue'], r.RASK, r.Yield]; }));
    }
  };
})();
