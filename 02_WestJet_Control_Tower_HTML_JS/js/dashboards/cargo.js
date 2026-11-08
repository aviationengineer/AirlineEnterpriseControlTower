/* dashboards/cargo.js — Cargo (Domain 8). Cargo Yield uses the Cargo
 * sheet's Cargo Revenue; Total Revenue uses Revenue_Management's — the
 * two differ slightly and are not reconciled (see Data Quality). */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.cargo = {
    title: 'Cargo',
    subtitle: 'Tonnes, shipments, revenue and yield',
    render: function (ctx) {
      var rows = (ctx.domains.cargo || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var cards = [
        U.cardFor(ctx, 'Cargo Yield'),
        U.levelCard(ctx, 'cargo', 'Cargo Tonnes', 'Cargo Tonnes', { category: 'Revenue', valueText: U.fmtNum(ctx.domainValue('cargo', 'Cargo Tonnes', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('cargo', 'Cargo Tonnes', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'cargo', 'Cargo Shipments', 'Cargo Shipments', { category: 'Operations', valueText: U.fmtNum(ctx.domainValue('cargo', 'Cargo Shipments', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('cargo', 'Cargo Shipments', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'cargo', 'Cargo Revenue', 'Cargo Revenue (Cargo sheet)', { category: 'Revenue', note: 'Cargo Yield uses this sheet’s Cargo Revenue; Total Revenue uses Revenue_Management’s figure, which differs slightly.' })
      ].join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<div class="chart-grid">' +
        U.section('Cargo Yield trend', '<div class="chart-box"><canvas id="cargo-yield"></canvas></div>') +
        U.section('Cargo Tonnes & Shipments', '<div class="chart-box"><canvas id="cargo-vol"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Cargo Tonnes', 'Cargo Shipments', 'Cargo Revenue (Cargo sheet)', 'Cargo Revenue (Revenue_Management)', 'Cargo Yield'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r['Cargo Tonnes']), U.fmtNum(r['Cargo Shipments']), U.fmtMoneyFull(r['Cargo Revenue']), U.fmtMoneyFull(ctx.domainValue('revenue', 'Cargo Revenue', r.Month)), U.fmtKpiValue('Cargo Yield', WJ.kpi.cargoYield(r['Cargo Revenue'], r['Cargo Tonnes']))]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.cargo || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.lineChart('cargo-yield', labels, [
        { label: 'Cargo Yield', data: rows.map(function (r) { return WJ.kpi.cargoYield(r['Cargo Revenue'], r['Cargo Tonnes']); }), color: U.PALETTE.navy },
        { label: 'Target', data: rows.map(function () { return ctx.targets['Cargo Yield']; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
      U.barChart('cargo-vol', labels, [
        { label: 'Cargo Tonnes', data: rows.map(function (r) { return r['Cargo Tonnes']; }), color: U.PALETTE.navy },
        { label: 'Cargo Shipments', data: rows.map(function (r) { return r['Cargo Shipments']; }), color: U.PALETTE.blue }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Cargo Tonnes', 'Cargo Shipments', 'Cargo Revenue']].concat(
        (ctx.domains.cargo || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Cargo Tonnes'], r['Cargo Shipments'], r['Cargo Revenue']]; }));
    }
  };
})();
