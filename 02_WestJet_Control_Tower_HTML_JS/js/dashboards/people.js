/* dashboards/people.js — Crew / People (Domain 3). Training Compliant is
 * a COUNT in the workbook (not a proportion), so it is shown as a count
 * with a derived compliance share (Training Compliant / Headcount) labelled
 * as derived. Crew Recency, SIM/CBT, Communications Reach, Training
 * Pipeline and Productivity have no workbook column and are not shown. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.people = {
    title: 'Crew / People',
    subtitle: 'Headcount, training, vacancies, leave and sentiment',
    render: function (ctx) {
      var rows = (ctx.domains.people || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var hc = ctx.domainValue('people', 'Headcount', ctx.latestMonth);
      var tc = ctx.domainValue('people', 'Training Compliant', ctx.latestMonth);
      var derived = (hc && tc !== null) ? tc / hc : null;
      var cards = [
        U.levelCard(ctx, 'people', 'Headcount', 'Headcount', { category: 'People', valueText: U.fmtNum(hc), prevText: U.fmtNum(ctx.domainValue('people', 'Headcount', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'people', 'Training Compliant', 'Training Compliant (count)', { category: 'People', valueText: U.fmtNum(tc), prevText: U.fmtNum(ctx.domainValue('people', 'Training Compliant', WJ.comparison.shiftMonth(ctx.latestMonth, -1))), note: 'Workbook value is a count, not a proportion. Derived compliance (Training Compliant / Headcount): ' + U.fmtPct(derived) + '.' }),
        U.levelCard(ctx, 'people', 'Open Critical Vacancies', 'Open Critical Vacancies', { category: 'People', direction: 'Lower is better', valueText: U.fmtNum(ctx.domainValue('people', 'Open Critical Vacancies', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('people', 'Open Critical Vacancies', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'people', 'Voluntary Leave Rate', 'Voluntary Leave Rate', { category: 'People', direction: 'Lower is better', valueText: U.fmtPct(ctx.domainValue('people', 'Voluntary Leave Rate', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('people', 'Voluntary Leave Rate', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'people', 'Sentiment Index', 'Sentiment Index', { category: 'People', valueText: U.fmtNum(ctx.domainValue('people', 'Sentiment Index', ctx.latestMonth), 1), prevText: U.fmtNum(ctx.domainValue('people', 'Sentiment Index', WJ.comparison.shiftMonth(ctx.latestMonth, -1)), 1) })
      ].join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">Headcount vs Plan is not computable — no planned headcount column exists. Crew Recency Compliance, SIM/CBT Completion, Communications Reach, Training Pipeline and Productivity have no workbook column and are not shown.</p>' +
        '<div class="chart-grid">' +
        U.section('Headcount trend', '<div class="chart-box"><canvas id="people-hc"></canvas></div>') +
        U.section('Voluntary Leave Rate & Sentiment Index', '<div class="chart-box"><canvas id="people-leave"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Headcount', 'Training Compliant', 'Derived compliance', 'Open Critical Vacancies', 'Voluntary Leave Rate', 'Sentiment Index'],
          rows.map(function (r) { return [r.Month, U.fmtNum(r.Headcount), U.fmtNum(r['Training Compliant']), U.fmtPct(r.Headcount ? r['Training Compliant'] / r.Headcount : null), U.fmtNum(r['Open Critical Vacancies']), U.fmtPct(r['Voluntary Leave Rate']), U.fmtNum(r['Sentiment Index'], 1)]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.people || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.barChart('people-hc', labels, [{ label: 'Headcount', data: rows.map(function (r) { return r.Headcount; }), color: U.PALETTE.navy }]);
      U.lineChart('people-leave', labels, [
        { label: 'Voluntary Leave Rate', data: rows.map(function (r) { return r['Voluntary Leave Rate']; }), color: U.PALETTE.red },
        { label: 'Sentiment Index (÷100)', data: rows.map(function (r) { return r['Sentiment Index'] / 100; }), color: U.PALETTE.teal }
      ]);
    },
    exportRows: function (ctx) {
      return [['Month', 'Headcount', 'Training Compliant', 'Open Critical Vacancies', 'Voluntary Leave Rate', 'Sentiment Index']].concat(
        (ctx.domains.people || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r.Headcount, r['Training Compliant'], r['Open Critical Vacancies'], r['Voluntary Leave Rate'], r['Sentiment Index']]; }));
    }
  };
})();
