/* tests/test.js — Node verification for the HTML/JS package.
 * Loads data/sample-data.json, runs the JS KPI/scenario engines and
 * asserts the results match the Python-generated ground truth in the
 * JSON (kpi_calculated monthly rows and preset_results for the full
 * 60-month baseline). Run: node tests/test.js
 * Also run: for f in js/*.js js/dashboards/*.js; do node --check "$f"; done
 */
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'sample-data.json'), 'utf8'));
const kpi = require(path.join(root, 'js', 'kpi-engine.js'));
const scenario = require(path.join(root, 'js', 'scenario-engine.js'));
const comparison = require(path.join(root, 'js', 'comparison-engine.js'));
const validator = require(path.join(root, 'js', 'data-validator.js'));

function close(actual, expected, label, tol) {
  tol = tol || 1e-6;
  assert.ok(actual !== null && actual !== undefined, label + ': got null/undefined, expected ' + expected);
  const diff = Math.abs(actual - expected);
  const allowed = tol * Math.max(1, Math.abs(expected));
  assert.ok(diff <= allowed, label + ': got ' + actual + ', expected ' + expected + ' (diff ' + diff + ')');
}

let passed = 0;
function check(name, fn) { fn(); passed++; console.log('ok - ' + name); }

// 1. Monthly KPI frame matches kpi_calculated for all 60 months, all 18 KPIs.
const frame = kpi.computeKpiFrame(data.domains);
assert.strictEqual(frame.length, 60, 'frame has 60 months');
const kpiNames = Object.keys(data.kpi_calculated[0]).filter((k) => k !== 'Month' && k !== 'Total Revenue' && k !== 'ASM' && k !== 'RPM' && k !== 'Operating Cost');
check('monthly KPI frame matches kpi_calculated (60 months x 18 KPIs + aggregates)', () => {
  data.kpi_calculated.forEach((expected, i) => {
    const got = frame[i];
    assert.strictEqual(got.Month, expected.Month);
    Object.keys(expected).forEach((key) => {
      if (key === 'Month') return;
      close(got[key], expected[key], expected.Month + ' ' + key, 1e-9);
    });
  });
});

// 2. Dec 2026 spot values (task-specified).
const dec26 = frame.find((r) => r.Month === '2026-12');
check('Dec 2026 spot values', () => {
  close(dec26['Load Factor'], 0.798508, 'Dec 2026 Load Factor', 1e-6);
  close(dec26.RASK, 0.128060, 'Dec 2026 RASK', 1e-6);
  close(dec26['Total Revenue'], 467101901, 'Dec 2026 Total Revenue', 1e-9);
  close(dec26['Aircraft Utilization'], 248.182320442, 'Dec 2026 Aircraft Utilization', 1e-6);
  close(dec26['Operating Margin'], 0.1929377419, 'Dec 2026 Operating Margin', 1e-6);
});

// 3. Period aggregates: full-range totals match the preset baseline.
check('full-range aggregates match preset baseline totals', () => {
  const agg = kpi.aggregateKpis(data.domains, '2022-01', '2026-12');
  close(agg['Total Revenue'], 26599193742, 'Total Revenue 60m', 1e-9);
  close(agg['Operating Cost'], 21379796552, 'Operating Cost 60m', 1e-9);
  close(agg.ASM, 168961250000, 'ASM 60m', 1e-9);
});

// 4. All nine presets over the full 60-month baseline match preset_results.
const FIELDS = ['total_revenue', 'operating_cost', 'operating_margin', 'rask', 'cask', 'load_factor', 'cash_position', 'ebit_style', 'passengers', 'asm', 'revenue_impact', 'cost_impact', 'margin_impact_pp', 'cash_impact'];
data.scenarios.forEach((def) => {
  check('preset ' + def['Scenario ID'] + ' ' + def['Scenario Name'] + ' matches Python preset_results', () => {
    const got = scenario.runPreset(data.domains, def, '2022-01', '2026-12');
    const expected = data.preset_results[def['Scenario ID']];
    assert.strictEqual(got.label, expected.label);
    assert.strictEqual(got.is_simulated, true);
    FIELDS.forEach((f) => close(got[f], expected[f], def['Scenario ID'] + ' ' + f, 1e-6));
    assert.deepStrictEqual(got.assumptions, expected.assumptions, def['Scenario ID'] + ' assumptions');
  });
});

// 5. Fuel +20% (S001) and Demand +10% (S002) — the two required spot checks.
check('Fuel +20% (S001) spot values', () => {
  const r = data.preset_results.S001;
  close(r.cost_impact, 1116244264.8, 'S001 cost impact', 1e-6);
  close(r.margin_impact_pp, -4.196534209371375, 'S001 margin impact pp', 1e-6);
  close(r.cash_impact, -1116244264.8, 'S001 cash impact', 1e-6);
});
check('Demand +10% (S002) spot values', () => {
  const r = data.preset_results.S002;
  close(r.revenue_impact, 2433905159.8, 'S002 revenue impact', 1e-6);
  close(r.load_factor, 0.878889426764421, 'S002 load factor', 1e-6);
  close(r.margin_impact_pp, 6.738222589011988, 'S002 margin impact pp', 1e-6);
});

// 6. Comparison helpers: Dec 2026 vs prior month / prior year.
check('comparison: Dec 2026 YoY', () => {
  const c = comparison.compareMonth(frame, 'Load Factor', '2026-12');
  close(c.current, 0.7985081808, 'LF current', 1e-6);
  close(c.prior_year, 0.7764857375, 'LF prior year (Dec 2025)', 1e-6);
  close(c.yoy_pct, (0.7985081808 - 0.7764857375) / 0.7764857375, 'LF YoY %', 1e-6);
});

// 7. Validation surfaces the JSON validation block (5 QUIRK warnings).
check('validation surfaces the JSON validation block', () => {
  const v = validator.validateData(data);
  assert.strictEqual(v.data_status, 'Warning');
  assert.strictEqual(v.n_warnings, 5);
  assert.strictEqual(v.n_errors, 0);
  assert.ok(v.issues.some((i) => i.sheet === 'Data_Governance' && /Assets with Owner/.test(i.message)), 'governance quirk present');
  assert.ok(v.issues.some((i) => /Ancillary_Revenue/.test(i.message)), 'ancillary quirk present');
});

// 8. Scenario input validation clamps out-of-range values.
check('scenario inputs clamp to bounds', () => {
  const inputs = scenario.defaultInputs();
  inputs.fuel_price = 500;
  inputs.cancellation = -500;
  const warnings = scenario.validateInputs(inputs);
  assert.strictEqual(inputs.fuel_price, 100);
  assert.strictEqual(inputs.cancellation, -100);
  assert.strictEqual(warnings.length, 2);
});

// 9. Route aggregates: profit ranking order matches the JSON order.
check('route aggregates rank by profit', () => {
  const routes = data.route_aggregates.slice().sort((a, b) => b.Route_Profit - a.Route_Profit);
  assert.strictEqual(routes[0].Route, 'YYC-CUN');
  assert.strictEqual(routes[0].Route_Profit, 124947823);
});

// 10. Sparkline canvases sit in a fixed-height wrapper (regression:
// 2026-11-08 the bare canvas with maintainAspectRatio:false grew
// without bound, stretching KPI cards and turning tiny trend
// variations into giant spikes).
const ui = require(path.join(root, 'js', 'charts.js'));
check('sparkline canvas is wrapped in a fixed-height container', () => {
  const html = ui.kpiCard({ kpi: 'Load Factor', value: 0.79, target: null, trend: [0.79, 0.80, 0.79, 0.81] });
  assert.ok(html.includes('<div class="sparkline-wrap"><canvas'), 'canvas wrapped in .sparkline-wrap');
  assert.ok(html.includes('class="sparkline"'), 'canvas keeps .sparkline class');
  assert.ok(!html.includes('height="36"'), 'no bare height attribute on the canvas');
  const css = fs.readFileSync(path.join(root, 'css', 'dashboard.css'), 'utf8');
  assert.ok(/\.sparkline-wrap\s*\{[^}]*position:\s*relative/.test(css), 'wrapper is relatively positioned');
  assert.ok(/\.sparkline-wrap\s*\{[^}]*height:\s*36px/.test(css), 'wrapper has an explicit 36px height');
});

// 10. Themes: starter set, validation, applying returns CSS variables.
const theme = require(path.join(root, 'js', 'theme.js'));
const themesData = JSON.parse(fs.readFileSync(path.join(root, 'data', 'themes.json'), 'utf8'));
check('theme file loads 8 starter themes, default WestJet', () => {
  const res = theme.setThemes(themesData);
  assert.strictEqual(res.loaded, 8, 'loaded 8 themes, got ' + res.loaded + ': ' + res.errors.join('; '));
  assert.strictEqual(res.errors.length, 0);
  assert.strictEqual(theme.getTheme('westjet').airline, 'WestJet');
  assert.strictEqual(theme.getTheme('no-such-theme').airline, 'WestJet');
  assert.strictEqual(theme.listThemes().length, 8);
});
check('every starter theme validates and has all fields', () => {
  theme.listThemes().forEach((t) => {
    assert.deepStrictEqual(theme.validateTheme(t), [], t.id);
    theme.THEME_FIELDS.forEach((f) => assert.ok(f in t, t.id + ' missing ' + f));
  });
});
check('applyTheme returns the CSS variables for the theme', () => {
  const vars = theme.applyTheme('emirates');
  assert.strictEqual(vars['--wj-navy'], '#C8102E');
  assert.strictEqual(vars['--wj-yellow'], '#D4A017');
  assert.strictEqual(vars['--wj-blue'], '#A67C37');
  assert.strictEqual(theme.currentThemeId(), 'emirates');
  theme.applyTheme('westjet');
});
check('custom-add validation rejects bad hex / URL / IATA', () => {
  const base = {
    airline: 'Test Airways', iata: 'TA', primary: '#123456',
    secondary: '#654321', accent: '#ABCDEF', background: '#FFFFFF',
    surface: '#F2F4F7', text: '#1F2937', logo_url: '', notes: ''
  };
  assert.strictEqual(theme.addCustomTheme(Object.assign({}, base, { primary: 'navy' })).ok, false);
  assert.strictEqual(theme.addCustomTheme(Object.assign({}, base, { logo_url: 'ftp://x/y.svg' })).ok, false);
  assert.strictEqual(theme.addCustomTheme(Object.assign({}, base, { iata: 'T' })).ok, false);
  const ok = theme.addCustomTheme(base);
  assert.strictEqual(ok.ok, true);
  assert.strictEqual(theme.getTheme(ok.id).airline, 'Test Airways');
  assert.strictEqual(theme.addCustomTheme(base).ok, false); // duplicate name/IATA
  assert.strictEqual(theme.removeCustomTheme(ok.id), true);
});

console.log('\n' + passed + ' checks passed. JS KPI/scenario engines match the Python ground truth.');
