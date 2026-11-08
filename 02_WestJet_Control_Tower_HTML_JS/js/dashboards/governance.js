/* dashboards/governance.js — Data Governance (Domain 15). Ownership
 * Coverage is low in the workbook (Assets with Owner averages 23.8% of
 * Registered Data Assets) — reported as-is, not reconciled. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.governance = {
    title: 'Data Governance',
    subtitle: 'Assets, classification, ownership and exceptions',
    render: function (ctx) {
      var rows = (ctx.domains.governance || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var L = rows[rows.length - 1] || {};
      var classCov = WJ.kpi.classificationCoverage(L['Classified Assets'], L['Registered Data Assets']);
      var ownCov = WJ.kpi.ownershipCoverage(L['Assets with Owner'], L['Registered Data Assets']);
      var cards = [
        U.levelCard(ctx, 'governance', 'Registered Data Assets', 'Registered Data Assets', { category: 'Governance', valueText: U.fmtNum(ctx.domainValue('governance', 'Registered Data Assets', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('governance', 'Registered Data Assets', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'governance', 'Classified Assets', 'Classified Assets', { category: 'Governance', valueText: U.fmtNum(ctx.domainValue('governance', 'Classified Assets', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('governance', 'Classified Assets', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'governance', 'Assets with Owner', 'Assets with Owner', { category: 'Governance', valueText: U.fmtNum(ctx.domainValue('governance', 'Assets with Owner', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('governance', 'Assets with Owner', WJ.comparison.shiftMonth(ctx.latestMonth, -1))), note: 'Ownership Coverage is low — see below. Reported as-is, not reconciled.' }),
        U.levelCard(ctx, 'governance', 'Governance Quality %', 'Governance Quality %', { category: 'Governance', valueText: U.fmtPct(ctx.domainValue('governance', 'Governance Quality %', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('governance', 'Governance Quality %', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'governance', 'Open Governance Exceptions', 'Open Governance Exceptions', { category: 'Governance', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('governance', 'Open Governance Exceptions', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('governance', 'Open Governance Exceptions', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) })
      ].join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">Classification Coverage (latest month): <strong>' + U.fmtPct(classCov) + '</strong> · Ownership Coverage (latest month): <strong>' + U.fmtPct(ownCov) + '</strong>. Assets with Owner averages only 23.8% of Registered Data Assets across the loaded period — a data observation, not a validation failure; neither figure has been adjusted.</p>' +
        '<div class="chart-grid">' +
        U.section('Classification & Ownership Coverage', '<div class="chart-box"><canvas id="gov-cov"></canvas></div>') +
        U.section('Open Governance Exceptions', '<div class="chart-box"><canvas id="gov-exc"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Registered Data Assets', 'Classified Assets', 'Assets with Owner', 'Classification Coverage', 'Ownership Coverage', 'Governance Quality %', 'Open Governance Exceptions'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r['Registered Data Assets']), U.fmtNum(r['Classified Assets']), U.fmtNum(r['Assets with Owner']), U.fmtPct(WJ.kpi.classificationCoverage(r['Classified Assets'], r['Registered Data Assets'])), U.fmtPct(WJ.kpi.ownershipCoverage(r['Assets with Owner'], r['Registered Data Assets'])), U.fmtPct(r['Governance Quality %']), U.fmtNum(r['Open Governance Exceptions'])]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.governance || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.lineChart('gov-cov', labels, [
        { label: 'Classification Coverage', data: rows.map(function (r) { return WJ.kpi.classificationCoverage(r['Classified Assets'], r['Registered Data Assets']); }), color: U.PALETTE.navy },
        { label: 'Ownership Coverage', data: rows.map(function (r) { return WJ.kpi.ownershipCoverage(r['Assets with Owner'], r['Registered Data Assets']); }), color: U.PALETTE.yellow }
      ]);
      U.barChart('gov-exc', labels, [{ label: 'Open Governance Exceptions', data: rows.map(function (r) { return r['Open Governance Exceptions']; }), color: U.PALETTE.red }]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Registered Data Assets', 'Classified Assets', 'Assets with Owner', 'Governance Quality %', 'Open Governance Exceptions']].concat(
        (ctx.domains.governance || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Registered Data Assets'], r['Classified Assets'], r['Assets with Owner'], r['Governance Quality %'], r['Open Governance Exceptions']]; }));
    }
  };
})();
