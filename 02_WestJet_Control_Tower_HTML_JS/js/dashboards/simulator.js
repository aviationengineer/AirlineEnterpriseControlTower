/* dashboards/simulator.js — Scenario Simulator (brief §12–13).
 * All 19 interactive inputs, grouped, each with slider + numeric input,
 * default (0%), min/max (proposed ranges: −50%/+50% generally, Fuel Price
 * −30%/+100%, Cancellation −100%/+100%), and a per-input reset, plus a
 * global reset. Presets S001–S009 are read from the loaded JSON, never
 * hard-coded. Live simulated outputs, scenario-impact waterfall and the
 * assumptions list update on every input. State is shared with the
 * Outcome page (unlike the wireframe, where the two pages were
 * disconnected). Every output is labelled SIMULATED. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  var GROUPS = [
    ['Commercial', ['passenger_demand', 'yield_pct', 'load_factor']],
    ['Capacity', ['capacity', 'flights', 'aircraft_utilisation']],
    ['Fuel', ['fuel_price', 'fuel_volume']],
    ['MRO', ['maintenance_cost', 'aircraft_availability']],
    ['Workforce', ['labour_cost', 'headcount']],
    ['Operations', ['cancellation', 'd0', 'd15']],
    ['Cargo', ['cargo_demand', 'cargo_yield']],
    ['Ancillary', ['ancillary_revenue']],
    ['FX', ['fx']]
  ];
  function inputRow(ctx, field) {
    var b = WJ.scenario.INPUT_BOUNDS[field];
    var label = WJ.scenario.INPUT_LABELS[field];
    var val = Number(ctx.scenario.inputs[field] || 0);
    return '<div class="sim-input" data-field="' + field + '">' +
      '<label for="sim-' + field + '">' + U.esc(label) + ' %</label>' +
      '<input type="range" id="sim-' + field + '" min="' + b[0] + '" max="' + b[1] + '" step="0.5" value="' + val + '" aria-label="' + U.esc(label) + ' percent">' +
      '<input type="number" id="sim-num-' + field + '" min="' + b[0] + '" max="' + b[1] + '" step="0.5" value="' + val + '" aria-label="' + U.esc(label) + ' percent (numeric)">' +
      '<span class="sim-range">min ' + b[0] + '% · default 0% · max ' + b[1] + '%</span>' +
      '<span class="sim-value" id="sim-val-' + field + '">' + (val >= 0 ? '+' : '') + val + '%</span>' +
      '<button type="button" class="btn btn-small sim-reset" data-field="' + field + '">Reset</button></div>';
  }
  WJ.pages.simulator = {
    title: 'Scenario Simulator',
    subtitle: 'Adjust parameters & visualise impact — all outputs are SIMULATED',
    render: function (ctx) {
      var inputs = ctx.scenario.inputs;
      var presetOpts = '<option value="">No preset — interactive inputs only</option>' + ctx.scenarios.map(function (s) {
        return '<option value="' + U.esc(s['Scenario ID']) + '"' + (ctx.scenario.presetId === s['Scenario ID'] ? ' selected' : '') + '>' + U.esc(s['Scenario ID'] + ' ' + s['Scenario Name'] + ' — ' + s['Variable'] + ' ' + (Number(s['Change %']) >= 0 ? '+' : '') + s['Change %'] + '%') + '</option>';
      }).join('');
      var groups = GROUPS.map(function (g) {
        return '<fieldset class="sim-group"><legend>' + U.esc(g[0]) + '</legend>' + g[1].map(function (f) { return inputRow(ctx, f); }).join('') + '</fieldset>';
      }).join('');
      var res = ctx.scenarioResult;
      var tiles = res ? [
        ['Revenue Impact (SIMULATED)', U.fmtMoneyFull(res.revenue_impact)],
        ['Cost Impact (SIMULATED)', U.fmtMoneyFull(res.cost_impact)],
        ['Margin Impact (SIMULATED)', res.margin_impact_pp === null ? 'n/a' : res.margin_impact_pp.toFixed(2) + 'pp'],
        ['Cash Impact (SIMULATED, illustrative)', U.fmtMoneyFull(res.cash_impact)]
      ].map(function (t) { return '<article class="kpi-card sim-tile"><h3>' + U.esc(t[0]) + '</h3><div class="kpi-value">' + U.esc(t[1]) + '</div></article>'; }).join('') : '<p>No scenario applied yet — move a slider or choose a preset. Baseline shown is the selected period (' + U.esc(ctx.filters.from) + ' to ' + U.esc(ctx.filters.to) + ').</p>';
      var assumptions = res ? '<ul>' + res.assumptions.map(function (a) { return '<li>' + U.esc(a) + '</li>'; }).join('') + '</ul>' : '<p>No assumptions — no scenario applied.</p>';
      return '<p class="panel-note">Slider ranges are proposed (brief §12), not workbook-derived: default 0% for every input; min −50% / max +50% generally; Fuel Price −30% / +100%; Cancellation −100% / +100%. Load Factor is capped at 100% in simulated results. Cash impact on multi-month baselines is illustrative.</p>' +
        '<div class="sim-preset"><label for="sim-preset">Preset scenario</label><select id="sim-preset">' + presetOpts + '</select> ' +
        '<button type="button" id="sim-reset-all" class="btn btn-secondary">Reset all inputs</button> ' +
        '<button type="button" id="sim-view-outcome" class="btn">View Outcome →</button> ' +
        '<button type="button" id="export-scenario" class="btn">Export scenario results (CSV)</button></div>' +
        '<div class="sim-groups">' + groups + '</div>' +
        '<div class="kpi-grid">' + tiles + '</div>' +
        (res ? '<div class="chart-grid">' + U.section('Scenario impact — Revenue vs Cost (SIMULATED)', '<div class="chart-box"><canvas id="sim-waterfall"></canvas></div><p class="panel-note">Baseline Total Revenue and Operating Cost with simulated impacts. EBIT-style impact (SIMULATED): ' + U.fmtMoneyFull(res.ebit_style) + ' vs baseline ' + U.fmtMoneyFull(ctx.baseline ? ctx.baseline['Total Revenue'] - ctx.baseline['Operating Cost'] : null) + '.</p>') +
        U.section('Simulated KPIs (SIMULATED)', U.tableHTML(['KPI', 'Baseline', 'Simulated', 'Impact'],
          [['RASK', U.fmtKpiValue('RASK', ctx.agg.RASK), U.fmtKpiValue('RASK', res.rask), res.rask !== null && ctx.agg.RASK ? ((res.rask - ctx.agg.RASK) / ctx.agg.RASK * 100).toFixed(2) + '%' : 'n/a'],
           ['CASM', U.fmtKpiValue('CASM', ctx.agg.CASM), U.fmtKpiValue('CASM', res.cask), res.cask !== null && ctx.agg.CASM ? ((res.cask - ctx.agg.CASM) / ctx.agg.CASM * 100).toFixed(2) + '%' : 'n/a'],
           ['Load Factor', U.fmtPct(ctx.agg['Load Factor']), U.fmtPct(res.load_factor), res.load_factor !== null && ctx.agg['Load Factor'] !== null ? ((res.load_factor - ctx.agg['Load Factor']) * 100).toFixed(2) + 'pp' : 'n/a'],
           ['Operating Margin', U.fmtPct(ctx.agg['Operating Margin']), U.fmtPct(res.operating_margin), res.margin_impact_pp === null ? 'n/a' : res.margin_impact_pp.toFixed(2) + 'pp'],
           ['Total Revenue', U.fmtMoneyFull(ctx.agg['Total Revenue']), U.fmtMoneyFull(res.total_revenue), U.fmtMoneyFull(res.revenue_impact)],
           ['Operating Cost', U.fmtMoneyFull(ctx.agg['Operating Cost']), U.fmtMoneyFull(res.operating_cost), U.fmtMoneyFull(res.cost_impact)],
           ['Cash Position', U.fmtMoneyFull(ctx.agg['Cash Position']), U.fmtMoneyFull(res.cash_position), U.fmtMoneyFull(res.cash_impact)],
           ['Passengers', U.fmtNum(ctx.agg.Passengers), U.fmtNum(res.passengers), U.fmtNum(res.passengers - ctx.agg.Passengers)],
           ['ASM (Capacity)', U.fmtNum(ctx.agg.ASM), U.fmtNum(res.asm), U.fmtNum(res.asm - ctx.agg.ASM)]]) ) + '</div>' : '') +
        U.section('Scenario assumptions', assumptions) +
        '<p class="page-foot">Scenario: ' + U.esc(res ? res.label : 'none') + ' · Baseline period: ' + U.esc(ctx.filters.from) + ' to ' + U.esc(ctx.filters.to) + ' · SYNTHETIC DATA · All scenario values SIMULATED.</p>';
    },
    mount: function (ctx) {
      var inputs = ctx.scenario.inputs;
      function refresh() { WJ.app.renderPage(); }
      GROUPS.forEach(function (g) {
        g[1].forEach(function (field) {
          var slider = document.getElementById('sim-' + field);
          var num = document.getElementById('sim-num-' + field);
          if (!slider || !num) return;
          slider.addEventListener('input', function () { inputs[field] = Number(slider.value); num.value = slider.value; document.getElementById('sim-val-' + field).textContent = (Number(slider.value) >= 0 ? '+' : '') + slider.value + '%'; });
          slider.addEventListener('change', refresh);
          num.addEventListener('change', function () { inputs[field] = Number(num.value); refresh(); });
        });
      });
      document.querySelectorAll('.sim-reset').forEach(function (btn) {
        btn.addEventListener('click', function () { inputs[btn.getAttribute('data-field')] = 0; refresh(); });
      });
      var preset = document.getElementById('sim-preset');
      if (preset) preset.addEventListener('change', function () { ctx.scenario.presetId = preset.value || null; refresh(); });
      var resetAll = document.getElementById('sim-reset-all');
      if (resetAll) resetAll.addEventListener('click', function () {
        ctx.scenario.presetId = null;
        Object.keys(WJ.scenario.INPUT_BOUNDS).forEach(function (k) { inputs[k] = 0; });
        refresh();
      });
      var view = document.getElementById('sim-view-outcome');
      if (view) view.addEventListener('click', function () { WJ.app.goTo('outcome'); });
      var res = ctx.scenarioResult;
      if (res) {
        var baseRev = ctx.agg['Total Revenue'], baseCost = ctx.agg['Operating Cost'];
        U.barChart('sim-waterfall', ['Baseline Revenue', 'Simulated Revenue', 'Baseline Cost', 'Simulated Cost'], [
          { label: '$', data: [baseRev, res.total_revenue, baseCost, res.operating_cost], color: U.PALETTE.navy }
        ]);
      }
    },
    exportRows: function (ctx) {
      var res = ctx.scenarioResult;
      var rows = [['Metric', 'Baseline', 'Simulated', 'Impact']];
      if (res) WJ.comparison.compareScenarios(ctx.agg, res, ctx.agg).forEach(function (r) { rows.push([r.metric, r.baseline, r.simulated, r.simulated_vs_baseline_abs]); });
      return rows;
    }
  };
})();
