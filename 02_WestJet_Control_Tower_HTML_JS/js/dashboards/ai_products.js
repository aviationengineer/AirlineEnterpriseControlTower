/* dashboards/ai_products.js — AI / Data Products (Domain 14). Data Product
 * Adoption is computed (Active / Registered); the supplied Adoption Rate
 * column has no definition in the workbook and is shown separately, never
 * as Data Product Adoption. No lifecycle-stage column exists. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.ai_products = {
    title: 'AI / Data Products',
    subtitle: 'Registered and active data products, adoption and business value',
    render: function (ctx) {
      var rows = (ctx.domains.ai_products || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var L = rows[rows.length - 1] || {};
      var cards = [
        U.cardFor(ctx, 'Data Product Adoption'),
        U.levelCard(ctx, 'ai_products', 'Registered Data Products', 'Registered Data Products', { category: 'AI / Data Products', valueText: U.fmtNum(ctx.domainValue('ai_products', 'Registered Data Products', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('ai_products', 'Registered Data Products', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'ai_products', 'Active Data Products', 'Active Data Products', { category: 'AI / Data Products', valueText: U.fmtNum(ctx.domainValue('ai_products', 'Active Data Products', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('ai_products', 'Active Data Products', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'ai_products', 'Estimated Business Value', 'Estimated Business Value', { category: 'AI / Data Products' }),
        U.levelCard(ctx, 'ai_products', 'Critical Incidents', 'Critical Incidents', { category: 'AI / Data Products', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('ai_products', 'Critical Incidents', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('ai_products', 'Critical Incidents', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) })
      ].join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">Supplied Adoption Rate (latest month): <strong>' + U.fmtPct(L['Adoption Rate']) + '</strong> — its definition is not given in the workbook, so it is not displayed as Data Product Adoption or Consumer Adoption. Lifecycle stages (Idea → Discovery → Development → Certified → Production → Adopted → Scaled → Retired) have no workbook column and are not shown as data.</p>' +
        '<div class="chart-grid">' +
        U.section('Data Product Adoption trend', '<div class="chart-box"><canvas id="ai-adoption"></canvas></div>') +
        U.section('Estimated Business Value & Critical Incidents', '<div class="chart-box"><canvas id="ai-value"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Registered Data Products', 'Active Data Products', 'Data Product Adoption (computed)', 'Adoption Rate (supplied)', 'Estimated Business Value', 'Critical Incidents'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r['Registered Data Products']), U.fmtNum(r['Active Data Products']), U.fmtPct(WJ.kpi.dataProductAdoption(r['Active Data Products'], r['Registered Data Products'])), U.fmtPct(r['Adoption Rate']), U.fmtMoneyFull(r['Estimated Business Value']), U.fmtNum(r['Critical Incidents'])]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.ai_products || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.lineChart('ai-adoption', labels, [
        { label: 'Data Product Adoption', data: rows.map(function (r) { return WJ.kpi.dataProductAdoption(r['Active Data Products'], r['Registered Data Products']); }), color: U.PALETTE.navy },
        { label: 'Target', data: rows.map(function () { return ctx.targets['Data Product Adoption']; }), color: U.PALETTE.grey, borderDash: [5, 5] }
      ]);
      U.barChart('ai-value', labels, [
        { label: 'Estimated Business Value', data: rows.map(function (r) { return r['Estimated Business Value']; }), color: U.PALETTE.navy },
        { label: 'Critical Incidents', data: rows.map(function (r) { return r['Critical Incidents']; }), color: U.PALETTE.red }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Registered Data Products', 'Active Data Products', 'Adoption Rate', 'Estimated Business Value', 'Critical Incidents']].concat(
        (ctx.domains.ai_products || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Registered Data Products'], r['Active Data Products'], r['Adoption Rate'], r['Estimated Business Value'], r['Critical Incidents']]; }));
    }
  };
})();
