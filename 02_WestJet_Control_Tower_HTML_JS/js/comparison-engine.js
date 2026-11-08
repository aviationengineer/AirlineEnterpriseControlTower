/* comparison-engine.js — JS mirror of Python services/comparison_engine.py.
 * Actual vs Baseline vs Simulated comparison, plus generic time comparisons
 * (prior month / prior year / YoY / variance to target) used by KPI cards.
 * Baseline = Actual in this build: the workbook has no Plan/Forecast or
 * separate baseline series, so the Outcome page labels the middle series
 * "Baseline (= Actual)". Plan/Forecast are never fabricated.
 * Works in the browser (window.WJ) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  var OUTCOME_METRICS = ['RASK', 'CASK', 'Revenue', 'Operating Cost', 'Margin', 'Cash', 'Load Factor', 'Capacity', 'Passenger Volume'];
  var METRIC_KEYS = { RASK: 'RASK', CASK: 'CASM', Revenue: 'Total Revenue', 'Operating Cost': 'Operating Cost', Margin: 'Operating Margin', Cash: 'Cash Position', 'Load Factor': 'Load Factor', Capacity: 'ASM', 'Passenger Volume': 'Passengers' };
  var SIMULATED_KEYS = { RASK: 'rask', CASK: 'cask', Revenue: 'total_revenue', 'Operating Cost': 'operating_cost', Margin: 'operating_margin', Cash: 'cash_position', 'Load Factor': 'load_factor', Capacity: 'asm', 'Passenger Volume': 'passengers' };
  function pctChange(next, old) {
    if (next === null || next === undefined || old === null || old === undefined || Number(old) === 0) return null;
    return (Number(next) - Number(old)) / Math.abs(Number(old));
  }
  function shiftMonth(ym, delta) {
    var y = Number(ym.slice(0, 4)), m = Number(ym.slice(5, 7)) - 1 + delta;
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    return String(y).padStart(4, '0') + '-' + String(m + 1).padStart(2, '0');
  }
  /* Current month vs prior month and vs the same month a year earlier,
   * from the monthly KPI frame. Returns nulls ("n/a") where the
   * comparison month is outside the loaded range. */
  function compareMonth(kpiFrame, kpi, month) {
    var byMonth = {};
    kpiFrame.forEach(function (r) { byMonth[r.Month] = r; });
    var current = byMonth[month] || null;
    var prev = byMonth[shiftMonth(month, -1)] || null;
    var prevYear = byMonth[shiftMonth(month, -12)] || null;
    var cur = current ? current[kpi] : null, pv = prev ? prev[kpi] : null, py = prevYear ? prevYear[kpi] : null;
    return {
      kpi: kpi, current: cur, prior_month: pv, prior_year: py,
      yoy_abs: (cur !== null && cur !== undefined && py !== null && py !== undefined) ? cur - py : null,
      yoy_pct: pctChange(cur, py),
      prior_change_pct: pctChange(cur, pv)
    };
  }
  function varianceToTarget(value, target) {
    if (value === null || value === undefined || target === null || target === undefined || Number(target) === 0) return null;
    return (Number(value) - Number(target)) / Math.abs(Number(target));
  }
  function compareScenarios(baseline, simulated, actual) {
    return OUTCOME_METRICS.map(function (metric) {
      var base = baseline ? baseline[METRIC_KEYS[metric]] : null;
      var sim = simulated ? simulated[SIMULATED_KEYS[metric]] : null;
      var act = actual ? actual[METRIC_KEYS[metric]] : null;
      return {
        metric: metric, actual: act, baseline: base, simulated: sim, is_simulated: true,
        simulated_vs_baseline_abs: (sim !== null && sim !== undefined && base !== null && base !== undefined) ? sim - base : null,
        simulated_vs_baseline_pct: pctChange(sim, base),
        actual_vs_baseline_pct: pctChange(act, base)
      };
    });
  }
  function summaryTiles(baseline, simulated) {
    return {
      revenue_impact: simulated ? simulated.revenue_impact : null,
      cost_impact: simulated ? simulated.cost_impact : null,
      margin_impact_pp: simulated ? simulated.margin_impact_pp : null,
      cash_impact: simulated ? simulated.cash_impact : null,
      is_simulated: true
    };
  }
  /* Rolling 12-month sum of a monthly flow column (array of {Month, value}). */
  function rolling12(rows) {
    var out = [], window = [];
    rows.forEach(function (r) {
      window.push(r.value === null || r.value === undefined ? 0 : Number(r.value));
      if (window.length > 12) window.shift();
      out.push({ Month: r.Month, value: window.reduce(function (a, b) { return a + b; }, 0) });
    });
    return out;
  }
  var C = {
    OUTCOME_METRICS: OUTCOME_METRICS, METRIC_KEYS: METRIC_KEYS, SIMULATED_KEYS: SIMULATED_KEYS,
    pctChange: pctChange, shiftMonth: shiftMonth, compareMonth: compareMonth,
    varianceToTarget: varianceToTarget, compareScenarios: compareScenarios,
    summaryTiles: summaryTiles, rolling12: rolling12
  };
  WJ.comparison = C;
  if (typeof module !== 'undefined' && module.exports) module.exports = C;
})(typeof window !== 'undefined' ? window : globalThis);
