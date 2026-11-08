/* dashboards/executive.js — Executive Overview (brief §8): the 14 KPI cards
 * (current, previous, YoY %, target, variance to target, mini trend, status),
 * revenue/cost waterfall, RASK vs CASM, Load Factor and margin trends,
 * and auto-generated insights (distinguished from raw data). */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  function insight(ctx) {
    var L = ctx.latest, P = ctx.priorYear, out = [];
    if (L && P) {
      var revYoY = (L['Total Revenue'] - P['Total Revenue']) / P['Total Revenue'];
      out.push('Total Revenue is ' + (revYoY * 100).toFixed(1) + '% ' + (revYoY >= 0 ? 'above' : 'below') + ' the same month last year (' + U.fmtMoney(L['Total Revenue']) + ' vs ' + U.fmtMoney(P['Total Revenue']) + '), primarily driven by passenger revenue.');
      var lf = (L['Load Factor'] - P['Load Factor']) * 100;
      out.push('Load Factor is ' + Math.abs(lf).toFixed(1) + 'pp ' + (lf >= 0 ? 'higher' : 'lower') + ' year on year at ' + U.fmtPct(L['Load Factor']) + ' against a target of ' + U.fmtPct(ctx.targets['Load Factor']) + '.');
      out.push('Dispatch Reliability is ' + U.fmtPct(L['Dispatch Reliability']) + ', ' + ((L['Dispatch Reliability'] - P['Dispatch Reliability']) * 100).toFixed(1) + 'pp vs the same month last year; AOG rate ' + U.fmtKpiValue('AOG Rate', L['AOG Rate']) + ' vs target ' + U.fmtKpiValue('AOG Rate', ctx.targets['AOG Rate']) + '.');
    }
    out.push('Aircraft Utilisation target (10.5 hrs) appears to be a daily figure — status withheld pending confirmation; the workbook value is about 248 hrs/aircraft/month.');
    return out;
  }
  WJ.pages.executive = {
    title: 'Executive Overview',
    subtitle: 'Enterprise Performance · Operations · Commercial · MRO · Data & AI',
    render: function (ctx) {
      var cards = [
        U.cardFor(ctx, 'Total Revenue', { drill: 'revenue', valueText: U.fmtMoney(ctx.latest ? ctx.latest['Total Revenue'] : null), prevText: U.fmtMoney(ctx.prior ? ctx.prior['Total Revenue'] : null) }),
        U.cardFor(ctx, 'Operating Cost', { drill: 'finance', direction: 'Lower is better', valueText: U.fmtMoney(ctx.latest ? ctx.latest['Operating Cost'] : null), prevText: U.fmtMoney(ctx.prior ? ctx.prior['Operating Cost'] : null) }),
        U.cardFor(ctx, 'Operating Margin', { drill: 'finance' }),
        U.cardFor(ctx, 'RASK', { drill: 'revenue' }),
        U.cardFor(ctx, 'CASM', { drill: 'finance' }),
        U.cardFor(ctx, 'Load Factor', { drill: 'flight_ops' }),
        U.cardFor(ctx, 'D0', { drill: 'flight_ops' }),
        U.cardFor(ctx, 'Dispatch Reliability', { drill: 'mro' }),
        U.cardFor(ctx, 'Aircraft Utilization', { drill: 'flight_ops', note: 'Target appears to be a daily figure — status withheld pending confirmation.' }),
        U.levelCard(ctx, 'passenger', 'Passengers', 'Passenger Volume', { drill: 'passenger', valueText: U.fmtNum(ctx.domainValue('passenger', 'Passengers', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('passenger', 'Passengers', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'finance', 'Cash Position', 'Cash Position', { drill: 'finance' }),
        U.cardFor(ctx, 'Data Quality', { drill: 'data_platform' }),
        U.cardFor(ctx, 'Platform Availability', { drill: 'data_platform' }),
        U.cardFor(ctx, 'Data Product Adoption', { drill: 'ai_products' })
      ].join('');
      var rows = ctx.rangeRows;
      var labels = rows.map(function (r) { return r.Month; });
      var insights = insight(ctx).map(function (s) { return '<li>' + U.esc(s) + '</li>'; }).join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        U.section('Insights — what happened, and why', '<ul class="insights">' + insights + '</ul>', 'Auto-generated insights, clearly distinguished from raw data.') +
        U.section('Revenue bridge — ' + U.esc(ctx.filters.from) + ' to ' + U.esc(ctx.filters.to), '<div class="chart-box"><canvas id="exec-waterfall"></canvas></div><p class="panel-note">Waterfall: passenger, cargo, ancillary and other revenue sum to Total Revenue; Operating Cost is shown for comparison. Values are period totals.</p>') +
        '<div class="chart-grid">' +
        U.section('RASK vs CASM ($/ASM)', '<div class="chart-box"><canvas id="exec-rask-casm"></canvas></div>') +
        U.section('Load Factor & Operating Margin', '<div class="chart-box"><canvas id="exec-lf-margin"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Total Revenue', 'Operating Cost', 'Load Factor', 'RASK', 'CASM', 'Operating Margin', 'D0', 'Dispatch Reliability'],
          rows.map(function (r) { return [r.Month, U.fmtMoneyFull(r['Total Revenue']), U.fmtMoneyFull(r['Operating Cost']), U.fmtPct(r['Load Factor']), U.fmtKpiValue('RASK', r.RASK), U.fmtKpiValue('CASM', r.CASM), U.fmtPct(r['Operating Margin']), U.fmtPct(r.D0), U.fmtPct(r['Dispatch Reliability'])]; }))) +
        '<p class="page-foot">Period: ' + U.esc(ctx.filters.from) + ' to ' + U.esc(ctx.filters.to) + ' · Latest month: ' + U.esc(ctx.latestMonth) + ' · SYNTHETIC DATA</p>';
    },
    mount: function (ctx) {
      var rows = ctx.rangeRows, labels = rows.map(function (r) { return r.Month; });
      var agg = ctx.agg;
      var rev = ctx.domains.revenue || [];
      function sumIn(col) { return rev.filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; }).reduce(function (s, r) { return s + Number(r[col] || 0); }, 0); }
      var total = sumIn('Passenger Revenue') + sumIn('Cargo Revenue') + sumIn('Ancillary Revenue') + sumIn('Other Revenue');
      U.waterfallChart('exec-waterfall', ['Passenger Revenue', 'Cargo Revenue', 'Ancillary Revenue', 'Other Revenue', 'Total Revenue'],
        [sumIn('Passenger Revenue'), sumIn('Cargo Revenue'), sumIn('Ancillary Revenue'), sumIn('Other Revenue'), total], {});
      U.lineChart('exec-rask-casm', labels, [
        { label: 'RASK', data: rows.map(function (r) { return r.RASK; }), color: U.PALETTE.navy },
        { label: 'CASM', data: rows.map(function (r) { return r.CASM; }), color: U.PALETTE.yellow },
        { label: 'RASK target', data: rows.map(function () { return ctx.targets.RASK; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
      U.lineChart('exec-lf-margin', labels, [
        { label: 'Load Factor', data: rows.map(function (r) { return r['Load Factor']; }), color: U.PALETTE.blue },
        { label: 'Operating Margin', data: rows.map(function (r) { return r['Operating Margin']; }), color: U.PALETTE.teal },
        { label: 'Load Factor target', data: rows.map(function () { return ctx.targets['Load Factor']; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Total Revenue', 'Operating Cost', 'Load Factor', 'RASK', 'CASM', 'Operating Margin', 'D0', 'Dispatch Reliability']].concat(
        ctx.rangeRows.map(function (r) { return [r.Month, r['Total Revenue'], r['Operating Cost'], r['Load Factor'], r.RASK, r.CASM, r['Operating Margin'], r.D0, r['Dispatch Reliability']]; }));
    }
  };
})();
