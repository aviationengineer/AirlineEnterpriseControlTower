/* dashboards/outcome.js — Scenario Outcome (brief §14). Actual vs
 * Baseline vs Simulated for the nine comparison metrics, summary tiles
 * (Revenue / Cost / Margin / Cash impact), SCENARIO ASSUMPTIONS and the
 * complete list of changed variables. Baseline = Actual in this build
 * (no separate baseline/forecast series in the workbook) and is labelled
 * "Baseline (= Actual)". With no scenario applied, the page shows the
 * baseline and states "No scenario applied". Every simulated value is
 * labelled SIMULATED. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.outcome = {
    title: 'Scenario Outcome',
    subtitle: 'Actual vs Baseline vs Simulated — all simulated values are SIMULATED',
    render: function (ctx) {
      var res = ctx.scenarioResult;
      var has = !!res;
      var tiles = has ? [
        ['Revenue Impact (SIMULATED)', U.fmtMoneyFull(res.revenue_impact)],
        ['Cost Impact (SIMULATED)', U.fmtMoneyFull(res.cost_impact)],
        ['Margin Impact (SIMULATED)', res.margin_impact_pp === null ? 'n/a' : res.margin_impact_pp.toFixed(2) + 'pp'],
        ['Cash Impact (SIMULATED, illustrative)', U.fmtMoneyFull(res.cash_impact)]
      ].map(function (t) { return '<article class="kpi-card sim-tile"><h3>' + U.esc(t[0]) + '</h3><div class="kpi-value">' + U.esc(t[1]) + '</div></article>'; }).join('') : '';
      var rows = has ? WJ.comparison.compareScenarios(ctx.agg, res, ctx.agg) : WJ.comparison.OUTCOME_METRICS.map(function (m) { return { metric: m, actual: ctx.agg[WJ.comparison.METRIC_KEYS[m]], baseline: ctx.agg[WJ.comparison.METRIC_KEYS[m]], simulated: null, simulated_vs_baseline_abs: null, simulated_vs_baseline_pct: null }; });
      function fmtMetric(metric, v) {
        if (v === null || v === undefined) return 'n/a';
        if (metric === 'RASK' || metric === 'CASK') return U.fmtKpiValue(metric === 'CASK' ? 'CASM' : 'RASK', v);
        if (metric === 'Load Factor' || metric === 'Margin') return U.fmtPct(v);
        if (metric === 'Revenue' || metric === 'Operating Cost' || metric === 'Cash') return U.fmtMoneyFull(v);
        return U.fmtNum(v);
      }
      var charts = rows.map(function (r, i) {
        return U.section(r.metric + ' — Actual vs Baseline (= Actual) vs Simulated', '<div class="chart-box"><canvas id="out-' + i + '"></canvas></div>' +
          '<p class="panel-note">Actual: ' + fmtMetric(r.metric, r.actual) + ' · Baseline (= Actual): ' + fmtMetric(r.metric, r.baseline) + ' · Simulated: ' + fmtMetric(r.metric, r.simulated) + (r.simulated !== null && r.simulated !== undefined ? ' (SIMULATED)' : ' — no scenario applied') + (r.simulated_vs_baseline_pct !== null && r.simulated_vs_baseline_pct !== undefined ? ' · Change vs baseline: ' + (r.simulated_vs_baseline_pct * 100).toFixed(2) + '%' : '') + '</p>');
      }).join('');
      var changed = WJ.scenario.changedVariables(ctx.scenario.inputs);
      var changedList = Object.keys(changed).map(function (k) { return '<li>' + U.esc(WJ.scenario.INPUT_LABELS[k] || k) + ': ' + (changed[k] >= 0 ? '+' : '') + changed[k] + '%</li>'; }).join('');
      var assumptions = has ? '<ul>' + res.assumptions.map(function (a) { return '<li>' + U.esc(a) + '</li>'; }).join('') + '</ul>' : '<p>No scenario applied.</p>';
      return (has ? '' : '<div class="notice"><strong>No scenario applied.</strong> The charts below show the baseline only. Choose a preset or adjust inputs on the <a href="#/simulator">Scenario Simulator</a>.</div>') +
        (has ? '<div class="kpi-grid">' + tiles + '</div>' : '') +
        '<div class="chart-grid">' + charts + '</div>' +
        U.section('SCENARIO ASSUMPTIONS', assumptions + '<p class="panel-note">Scenario: ' + U.esc(has ? res.label : 'none') + ' · Baseline period: ' + U.esc(ctx.filters.from) + ' to ' + U.esc(ctx.filters.to) + ' · Cash impact on multi-month baselines is illustrative — cash is a period-end stock while revenue/cost impacts are period flows.</p>') +
        U.section('Changed variables (complete list)', (ctx.scenario.presetId ? '<p>Preset: <strong>' + U.esc(ctx.scenario.presetId) + '</strong> — ' + U.esc((ctx.scenarios.find(function (s) { return s['Scenario ID'] === ctx.scenario.presetId; }) || {}).Description || '') + '</p>' : '') +
          (changedList ? '<ul>' + changedList + '</ul>' : '<p>No interactive inputs changed from their 0% defaults.</p>') +
          (has && res.assumptions.some(function (a) { return a.indexOf('FX') >= 0; }) ? '' : '') +
          '<p class="panel-note">FX: the scenario engine scales Total Revenue and Operating Cost by the FX % (see SCENARIO_DEFINITIONS.md §3.9).</p>') +
        U.section('Actual vs Baseline vs Simulated (table)', U.tableHTML(['Metric', 'Actual', 'Baseline (= Actual)', 'Simulated', 'Simulated vs Baseline'],
          rows.map(function (r) { return [r.metric, fmtMetric(r.metric, r.actual), fmtMetric(r.metric, r.baseline), fmtMetric(r.metric, r.simulated) + (r.simulated !== null && r.simulated !== undefined ? ' (SIMULATED)' : ''), r.simulated_vs_baseline_abs === null || r.simulated_vs_baseline_abs === undefined ? 'n/a' : U.fmtMoneyFull(r.simulated_vs_baseline_abs)]; }))) +
        '<p><button type="button" id="export-scenario" class="btn">Export scenario results (CSV)</button> <button type="button" id="export-table-page" class="btn">Export filtered table (CSV)</button></p>' +
        '<p class="page-foot">SYNTHETIC DATA · All scenario values SIMULATED, never actual performance.</p>';
    },
    mount: function (ctx) {
      var res = ctx.scenarioResult;
      var rows = res ? WJ.comparison.compareScenarios(ctx.agg, res, ctx.agg)
        : WJ.comparison.OUTCOME_METRICS.map(function (m) { return { metric: m, actual: ctx.agg[WJ.comparison.METRIC_KEYS[m]], baseline: ctx.agg[WJ.comparison.METRIC_KEYS[m]], simulated: null }; });
      rows.forEach(function (r, i) {
        U.barChart('out-' + i, ['Actual', 'Baseline (= Actual)', 'Simulated'], [
          { label: r.metric, data: [r.actual, r.baseline, r.simulated], color: U.PALETTE.navy }
        ]);
      });
    },
    exportRows: function (ctx) {
      var res = ctx.scenarioResult;
      var rows = [['Metric', 'Actual', 'Baseline', 'Simulated', 'Simulated vs Baseline']];
      var list = res ? WJ.comparison.compareScenarios(ctx.agg, res, ctx.agg)
        : WJ.comparison.OUTCOME_METRICS.map(function (m) { return { metric: m, actual: ctx.agg[WJ.comparison.METRIC_KEYS[m]], baseline: ctx.agg[WJ.comparison.METRIC_KEYS[m]], simulated: null, simulated_vs_baseline_abs: null }; });
      list.forEach(function (r) { rows.push([r.metric, r.actual, r.baseline, r.simulated, r.simulated_vs_baseline_abs]); });
      return rows;
    }
  };
})();
