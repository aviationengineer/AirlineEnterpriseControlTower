/* dashboards/data_platform.js — Data Platform (brief §11). Primary 10 KPIs
 * plus executive summary: Platform Health, Adoption, Reliability, Quality,
 * Support Efficiency. Self-Service Adoption is Active / Registered Users
 * (derived, labelled as such). No log / platform-activity column exists. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.data_platform = {
    title: 'Data Platform',
    subtitle: 'Adoption, support, quality, availability and freshness',
    render: function (ctx) {
      var rows = (ctx.domains.data_platform || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var L = rows[rows.length - 1] || {};
      var adoption = (L['Registered Users'] && L['Active Self-Service Users'] !== undefined) ? L['Active Self-Service Users'] / L['Registered Users'] : null;
      var cards = [
        U.cardFor(ctx, 'Ticket Deflection Rate'),
        U.cardFor(ctx, 'Data Quality'),
        U.cardFor(ctx, 'Platform Availability'),
        U.levelCard(ctx, 'data_platform', 'Active Self-Service Users', 'Active Self-Service Users', { category: 'Data Platform', valueText: U.fmtNum(ctx.domainValue('data_platform', 'Active Self-Service Users', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('data_platform', 'Active Self-Service Users', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'data_platform', 'Registered Users', 'Registered Users', { category: 'Data Platform', valueText: U.fmtNum(ctx.domainValue('data_platform', 'Registered Users', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('data_platform', 'Registered Users', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'data_platform', 'Platform Tickets', 'Platform Tickets', { category: 'Data Platform', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('data_platform', 'Platform Tickets', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('data_platform', 'Platform Tickets', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'data_platform', 'Knowledge Base Uses', 'Knowledge Base Uses', { category: 'Data Platform', valueText: U.fmtNum(ctx.domainValue('data_platform', 'Knowledge Base Uses', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('data_platform', 'Knowledge Base Uses', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'data_platform', 'Security Groups', 'Security Groups', { category: 'Data Platform', valueText: U.fmtNum(ctx.domainValue('data_platform', 'Security Groups', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('data_platform', 'Security Groups', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'data_platform', 'Average Freshness Minutes', 'Average Freshness (minutes)', { category: 'Data Platform', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('data_platform', 'Average Freshness Minutes', ctx.latestMonth), 1) + ' min', prevText: U.fmtNum(ctx.domainValue('data_platform', 'Average Freshness Minutes', WJ.comparison.shiftMonth(ctx.latestMonth, -1)), 1) + ' min' })
      ].join('');
      var summary = '<ul class="insights">' +
        '<li><strong>Platform Health:</strong> Data Quality ' + U.fmtPct(L['Data Quality %']) + ' (target ' + U.fmtPct(ctx.targets['Data Quality']) + '), Platform Availability ' + U.fmtPct(L['Platform Availability %']) + ' (target ' + U.fmtPct(ctx.targets['Platform Availability']) + ').</li>' +
        '<li><strong>Adoption:</strong> Self-Service Adoption (derived: Active / Registered Users) ' + U.fmtPct(adoption) + '; Knowledge Base Uses ' + U.fmtNum(L['Knowledge Base Uses']) + ' in the latest month.</li>' +
        '<li><strong>Reliability:</strong> Average Freshness ' + U.fmtNum(L['Average Freshness Minutes'], 1) + ' minutes; Platform Availability ' + U.fmtPct(L['Platform Availability %']) + '.</li>' +
        '<li><strong>Quality:</strong> Data Quality ' + U.fmtPct(L['Data Quality %']) + ' vs target ' + U.fmtPct(ctx.targets['Data Quality']) + '.</li>' +
        '<li><strong>Support Efficiency:</strong> Ticket Deflection Rate ' + U.fmtPct(L['Ticket Deflection Rate']) + ' (target ' + U.fmtPct(ctx.targets['Ticket Deflection Rate']) + ') with ' + U.fmtNum(L['Platform Tickets']) + ' tickets in the latest month.</li></ul>';
      return '<div class="kpi-grid">' + cards + '</div>' +
        U.section('Executive summary', summary) +
        '<div class="chart-grid">' +
        U.section('Self-Service Adoption trend (derived)', '<div class="chart-box"><canvas id="dp-adoption"></canvas></div><p class="panel-note">Derived: Active Self-Service Users / Registered Users.</p>') +
        U.section('Ticket Deflection Rate & Data Quality', '<div class="chart-box"><canvas id="dp-quality"></canvas></div>') +
        '</div><div class="chart-grid">' +
        U.section('Platform Tickets', '<div class="chart-box"><canvas id="dp-tickets"></canvas></div><p class="panel-note">Ticket categories are not in the workbook, so no Pareto by category is shown.</p>') +
        U.section('Registered vs Active Users', '<div class="chart-box"><canvas id="dp-users"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Active Self-Service Users', 'Registered Users', 'Self-Service Adoption (derived)', 'Platform Tickets', 'Ticket Deflection Rate', 'Data Quality %', 'Platform Availability %', 'Average Freshness Minutes', 'Knowledge Base Uses', 'Security Groups'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r['Active Self-Service Users']), U.fmtNum(r['Registered Users']), U.fmtPct(r['Registered Users'] ? r['Active Self-Service Users'] / r['Registered Users'] : null), U.fmtNum(r['Platform Tickets']), U.fmtPct(r['Ticket Deflection Rate']), U.fmtPct(r['Data Quality %']), U.fmtPct(r['Platform Availability %']), U.fmtNum(r['Average Freshness Minutes'], 1), U.fmtNum(r['Knowledge Base Uses']), U.fmtNum(r['Security Groups'])]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.data_platform || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.lineChart('dp-adoption', labels, [{ label: 'Self-Service Adoption', data: rows.map(function (r) { return r['Registered Users'] ? r['Active Self-Service Users'] / r['Registered Users'] : null; }), color: U.PALETTE.navy }]);
      U.lineChart('dp-quality', labels, [
        { label: 'Ticket Deflection Rate', data: rows.map(function (r) { return r['Ticket Deflection Rate']; }), color: U.PALETTE.navy },
        { label: 'Data Quality %', data: rows.map(function (r) { return r['Data Quality %']; }), color: U.PALETTE.teal }
      ]);
      U.barChart('dp-tickets', labels, [{ label: 'Platform Tickets', data: rows.map(function (r) { return r['Platform Tickets']; }), color: U.PALETTE.blue }]);
      U.barChart('dp-users', labels, [
        { label: 'Registered Users', data: rows.map(function (r) { return r['Registered Users']; }), color: U.PALETTE.navy },
        { label: 'Active Self-Service Users', data: rows.map(function (r) { return r['Active Self-Service Users']; }), color: U.PALETTE.teal }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Active Self-Service Users', 'Registered Users', 'Platform Tickets', 'Ticket Deflection Rate', 'Data Quality %', 'Platform Availability %', 'Average Freshness Minutes', 'Knowledge Base Uses', 'Security Groups']].concat(
        (ctx.domains.data_platform || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Active Self-Service Users'], r['Registered Users'], r['Platform Tickets'], r['Ticket Deflection Rate'], r['Data Quality %'], r['Platform Availability %'], r['Average Freshness Minutes'], r['Knowledge Base Uses'], r['Security Groups']]; }));
    }
  };
})();
