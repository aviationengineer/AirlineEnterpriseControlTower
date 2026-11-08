/* dashboards/finance.js — Finance (Domain 6). EBIT-style measures are
 * not in the workbook and are shown as n/a, never invented. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.finance = {
    title: 'Finance',
    subtitle: 'Revenue, operating cost, cash and margin',
    render: function (ctx) {
      var cards = [
        U.cardFor(ctx, 'Total Revenue', { valueText: U.fmtMoney(ctx.latest ? ctx.latest['Total Revenue'] : null), prevText: U.fmtMoney(ctx.prior ? ctx.prior['Total Revenue'] : null) }),
        U.cardFor(ctx, 'Operating Cost', { direction: 'Lower is better', valueText: U.fmtMoney(ctx.latest ? ctx.latest['Operating Cost'] : null), prevText: U.fmtMoney(ctx.prior ? ctx.prior['Operating Cost'] : null) }),
        U.cardFor(ctx, 'Operating Margin'), U.cardFor(ctx, 'CASM'),
        U.levelCard(ctx, 'finance', 'Labour Cost', 'Labour Cost', { category: 'Cost', direction: 'Lower is better' }),
        U.levelCard(ctx, 'finance', 'Fuel Cost', 'Fuel Cost', { category: 'Cost', direction: 'Lower is better' }),
        U.levelCard(ctx, 'finance', 'Other Operating Cost', 'Other Operating Cost', { category: 'Cost', direction: 'Lower is better' }),
        U.levelCard(ctx, 'finance', 'Cash Position', 'Cash Position', { category: 'Cost' })
      ].join('');
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">EBIT-style profitability: <strong>n/a — no EBIT measure in the workbook.</strong> Variance to plan/forecast: not computable — no Plan/Forecast columns exist.</p>' +
        '<div class="chart-grid">' +
        U.section('Operating cost bridge (waterfall, period total)', '<div class="chart-box"><canvas id="fin-waterfall"></canvas></div><p class="panel-note">Labour + Fuel + Other Operating Cost = Operating Cost.</p>') +
        U.section('Operating Margin trend', '<div class="chart-box"><canvas id="fin-margin"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Total Revenue', 'Operating Cost', 'Labour Cost', 'Fuel Cost', 'Other Operating Cost', 'Cash Position', 'Operating Margin', 'CASM'],
          rows.map(function (r) { return [r.Month, U.fmtMoneyFull(r['Total Revenue']), U.fmtMoneyFull(r['Operating Cost']), U.fmtMoneyFull(ctx.domainValue('finance', 'Labour Cost', r.Month)), U.fmtMoneyFull(ctx.domainValue('finance', 'Fuel Cost', r.Month)), U.fmtMoneyFull(ctx.domainValue('finance', 'Other Operating Cost', r.Month)), U.fmtMoneyFull(ctx.domainValue('finance', 'Cash Position', r.Month)), U.fmtPct(r['Operating Margin']), U.fmtKpiValue('CASM', r.CASM)]; })));
    },
    mount: function (ctx) {
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      var fin = ctx.domains.finance || [];
      function sumIn(col) { return fin.filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; }).reduce(function (s, r) { return s + Number(r[col] || 0); }, 0); }
      var total = sumIn('Labour Cost') + sumIn('Fuel Cost') + sumIn('Other Operating Cost');
      U.waterfallChart('fin-waterfall', ['Labour Cost', 'Fuel Cost', 'Other Operating Cost', 'Operating Cost'],
        [sumIn('Labour Cost'), sumIn('Fuel Cost'), sumIn('Other Operating Cost'), total], {});
      U.lineChart('fin-margin', labels, [
        { label: 'Operating Margin', data: rows.map(function (r) { return r['Operating Margin']; }), color: U.PALETTE.navy },
        { label: 'Target', data: rows.map(function () { return ctx.targets['Operating Margin']; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Total Revenue', 'Operating Cost', 'Labour Cost', 'Fuel Cost', 'Other Operating Cost', 'Cash Position', 'Operating Margin', 'CASM']].concat(
        ctx.rangeRows.map(function (r) { return [r.Month, r['Total Revenue'], r['Operating Cost'], ctx.domainValue('finance', 'Labour Cost', r.Month), ctx.domainValue('finance', 'Fuel Cost', r.Month), ctx.domainValue('finance', 'Other Operating Cost', r.Month), ctx.domainValue('finance', 'Cash Position', r.Month), r['Operating Margin'], r.CASM]; }));
    }
  };
})();
