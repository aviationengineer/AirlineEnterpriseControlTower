/* tests/smoke.js — headless smoke test (no browser/jsdom needed).
 * Loads every app script into a minimal DOM stub, lets the app fetch
 * data/sample-data.json, renders all 18 pages, applies a Fuel +20%
 * scenario and renders Simulator + Outcome, and asserts no runtime
 * errors and that key markers (SYNTHETIC DATA, SIMULATED, KPI names,
 * Dec 2026 values) appear. Run: node tests/smoke.js
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'sample-data.json'), 'utf8'));
const themesData = JSON.parse(fs.readFileSync(path.join(root, 'data', 'themes.json'), 'utf8'));

class El {
  constructor() { this.innerHTML = ''; this.hidden = false; this.value = ''; this.style = {}; this.parentElement = null; }
  addEventListener() {}
  querySelectorAll() { return []; }
  querySelector() { return null; }
  getAttribute() { return null; }
  setAttribute() {}
  removeAttribute() {}
  appendChild() {}
  remove() {}
  insertAdjacentHTML() {}
}
const byId = {};
function getEl(id) { if (!byId[id]) byId[id] = new El(); return byId[id]; }

global.window = global;
global.location = { hash: '' };
global.addEventListener = function () {};
global.scrollTo = function () {};
global.Chart = undefined; // CDN unavailable in the stub: charts degrade to tables
global.fetch = async function (url) {
  if (String(url).includes('themes.json')) return { ok: true, json: async () => JSON.parse(JSON.stringify(themesData)) };
  return { ok: true, json: async () => JSON.parse(JSON.stringify(data)) };
};
global.document = {
  readyState: 'complete',
  getElementById: (id) => getEl(id),
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => new El(),
  addEventListener: () => {},
  body: new El(),
  documentElement: { style: { _vars: {}, setProperty(k, v) { this._vars[k] = v; } } },
};

const files = ['js/data-loader.js', 'js/data-validator.js', 'js/kpi-engine.js', 'js/comparison-engine.js',
  'js/scenario-engine.js', 'js/charts.js', 'js/filters.js',
  ...fs.readdirSync(path.join(root, 'js', 'dashboards')).sort().map((f) => 'js/dashboards/' + f),
  'js/theme.js', 'js/app.js'];
for (const f of files) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

const assert = require('assert');
setTimeout(() => {
  try {
    const WJ = global.WJ;
    assert.ok(WJ.state.data, 'data loaded');
    assert.strictEqual(WJ.state.kpiFrame.length, 60, '60 monthly KPI rows');
    const pageEl = getEl('page');
    const pages = WJ.app.PAGES.map((p) => p[0]);
    assert.strictEqual(pages.length, 19, '19 pages registered');
    for (const p of pages) {
      WJ.app.goTo(p);
      const html = pageEl.innerHTML;
      assert.ok(html.length > 500, p + ': page rendered (' + html.length + ' chars)');
      assert.ok(html.includes('SYNTHETIC DATA'), p + ': SYNTHETIC DATA badge');
      assert.ok(!html.includes('Skeleton only'), p + ': no skeleton text');
    }
    // Theme & Branding page renders and the theme engine applies a theme.
    WJ.app.goTo('theme');
    assert.ok(pageEl.innerHTML.includes('Theme &amp; Branding'), 'theme page has title');
    assert.ok(pageEl.innerHTML.includes('Emirates'), 'theme page lists Emirates');
    assert.ok(pageEl.innerHTML.includes('Add a custom airline'), 'theme page has the add-custom form');
    assert.strictEqual(WJ.theme.listThemes().length, 8, '8 starter themes loaded');
    assert.strictEqual(WJ.theme.currentTheme().airline, 'WestJet', 'default theme is WestJet');
    assert.strictEqual(getEl('brand-name').textContent, 'WESTJET', 'header brand is WestJet by default');
    const vars = WJ.theme.applyTheme('emirates');
    assert.strictEqual(vars['--wj-navy'], '#C8102E', 'Emirates primary applied');
    assert.strictEqual(global.document.documentElement.style._vars['--wj-navy'], '#C8102E', 'CSS variable set on :root');
    assert.strictEqual(getEl('brand-name').textContent, 'EMIRATES', 'header brand follows the theme');
    WJ.theme.applyTheme('westjet');
    assert.strictEqual(getEl('brand-name').textContent, 'WESTJET', 'header brand returns to WestJet');
    const execHtml = (() => { WJ.app.goTo('executive'); return pageEl.innerHTML; })();
    assert.ok(execHtml.includes('Load Factor'), 'executive has Load Factor card');
    assert.ok(execHtml.includes('467.1'), 'executive shows Dec 2026 Total Revenue ($467.1m)');
    assert.ok(execHtml.includes('Status withheld'), 'executive shows Aircraft Utilisation status withheld');
    // Scenario: Fuel +20% via simulator state, then Outcome.
    WJ.state.scenario.inputs.fuel_price = 20;
    WJ.state.scenario.inputs.label = 'Interactive scenario';
    WJ.app.goTo('simulator');
    assert.ok(pageEl.innerHTML.includes('SIMULATED'), 'simulator labels outputs SIMULATED');
    assert.ok(pageEl.innerHTML.includes('Fuel Price'), 'simulator has Fuel Price input');
    WJ.app.goTo('outcome');
    const out = pageEl.innerHTML;
    assert.ok(out.includes('SCENARIO ASSUMPTIONS'), 'outcome has assumptions');
    assert.ok(out.includes('Changed variables'), 'outcome has changed-variables list');
    assert.ok(out.includes('Baseline (= Actual)'), 'outcome labels baseline');
    // No-scenario outcome state.
    WJ.state.scenario.inputs.fuel_price = 0;
    WJ.app.goTo('outcome');
    assert.ok(pageEl.innerHTML.includes('No scenario applied'), 'outcome handles no-scenario state');
    // Header + data status rendered.
    assert.ok(getEl('header-stats').innerHTML.includes('SYNTHETIC DATA'), 'header has SYNTHETIC DATA badge');
    assert.ok(getEl('data-status').innerHTML.includes('Warning'), 'data status shows Warning');
    assert.ok(getEl('data-status').innerHTML.includes('Assets with Owner'), 'data status surfaces governance quirk');
    console.log('smoke test passed: 19 pages render, simulator/outcome share state, theme applies, no runtime errors.');
  } catch (e) {
    console.error('SMOKE TEST FAILED:', e);
    process.exit(1);
  }
}, 500);
