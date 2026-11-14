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
const auth = require(path.join(root, 'js', 'auth.js'));
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

// 12. PDF snapshot report (js/pdf-report.js): 18 sections + scenario
// summary, cover carries the active theme, values use the app's own
// formatting, and the print stylesheet isolates #pdf-report.
const pdfReport = require(path.join(root, 'js', 'pdf-report.js'));
function makePdfCtx() {
  return {
    data: data, domains: data.domains, targets: data.targets, definitions: data.kpi_definitions,
    scenarios: data.scenarios, validation: validator.validateData(data),
    filters: { from: '2022-01', to: '2026-12', route: 'All routes', categories: [] },
    kpiFrame: frame, latestMonth: '2026-12',
    latest: frame[frame.length - 1], prior: frame[frame.length - 2],
    domainValue: function (dom, col, month) {
      let found = null;
      (data.domains[dom] || []).forEach((r) => { if (r.Month === month) found = r[col]; });
      return found === null || found === undefined ? null : Number(found);
    },
    routeAggregates: data.route_aggregates.slice().sort((a, b) => b.Route_Profit - a.Route_Profit),
    agg: kpi.aggregateKpis(data.domains, '2022-01', '2026-12'),
    scenario: { presetId: null, inputs: scenario.defaultInputs() },
    scenarioResult: null
  };
}
check('pdf report: 18 sections in app order, Theme & Branding excluded', () => {
  assert.strictEqual(pdfReport.SECTIONS.length, 18);
  assert.ok(!pdfReport.SECTIONS.some((s) => s.id === 'theme'), 'theme page excluded');
  assert.strictEqual(pdfReport.SECTIONS[0].id, 'executive');
  assert.strictEqual(pdfReport.SECTIONS[17].id, 'outcome');
});
check('pdf report: 18 section headings + scenario section, cover names the active airline', () => {
  theme.applyTheme('emirates');
  const html = pdfReport.buildReportHtml(makePdfCtx(), { generatedAt: new Date(2026, 10, 14, 14, 22) });
  assert.strictEqual((html.match(/<section class="pdf-section/g) || []).length, 19, '18 data sections + scenario section');
  assert.strictEqual((html.match(/data-page="/g) || []).length, 18, 'one section per data page');
  assert.strictEqual((html.match(/class="pdf-section-title"/g) || []).length, 19, 'every section has a heading');
  assert.ok(html.includes('Emirates (EK)'), 'cover names the active airline + IATA');
  assert.ok(html.includes('PDF Snapshot Report'), 'cover has the report title');
  assert.ok(html.includes('SYNTHETIC DATA'), 'cover/footer carry the SYNTHETIC DATA marker');
  assert.ok(html.includes('Scenario Summary'), 'scenario summary section present');
  data.scenarios.forEach((s) => assert.ok(html.includes(s['Scenario Name']), 'scenario listed: ' + s['Scenario Name']));
  assert.ok(html.includes('95%'), 'cover shows Data Quality as in the header');
  assert.ok(html.includes('Warning'), 'cover shows Platform Status');
  theme.applyTheme('westjet');
});
check('pdf report: KPI rows use the app formatting (Dec 2026)', () => {
  const ctx = makePdfCtx();
  const byName = {};
  pdfReport.sectionRows(ctx, 'executive').forEach((r) => { byName[r.name] = r; });
  assert.strictEqual(byName['Total Revenue'].value, '$467.1m', 'Total Revenue uses fmtMoney, as the Executive card');
  assert.strictEqual(byName['Load Factor'].value, '79.85%', 'Load Factor uses fmtKpiValue (2dp %)');
  assert.strictEqual(byName['Load Factor'].target, '83.00%', 'target formatted via fmtTarget');
  const nov26 = frame.find((r) => r.Month === '2026-11');
  assert.strictEqual(byName['Load Factor'].change, ui.fmtPP(dec26['Load Factor'] - nov26['Load Factor'], 1), 'rate KPI change is in pp');
  assert.strictEqual(byName['Total Revenue'].change, ui.fmtSignedPct(comparison.pctChange(dec26['Total Revenue'], nov26['Total Revenue']), 1), 'money KPI change is %');
  assert.strictEqual(byName['Passenger Volume'].value, ui.fmtNum(ctx.domainValue('passenger', 'Passengers', '2026-12')), 'level measure mirrors levelCard formatting');
  assert.strictEqual(byName['Passenger Volume'].target, 'n/a', 'level measures have no target');
  assert.strictEqual(pdfReport.sectionRows(ctx, 'outcome').length, 9, 'outcome section has the 9 outcome metrics');
  assert.strictEqual(pdfReport.sectionRows(ctx, 'simulator').length, 9, 'simulator section has the 9 simulated KPIs');
  assert.ok(pdfReport.sectionRows(ctx, 'simulator').every((r) => r.change === 'n/a'), 'no scenario: simulator changes are n/a');
});
check('pdf report: snapshot filename format', () => {
  assert.strictEqual(pdfReport.snapshotName(new Date(2026, 10, 14, 9, 5)), 'control-tower-snapshot-20261114-0905');
  assert.ok(/^control-tower-snapshot-\d{8}-\d{4}$/.test(pdfReport.snapshotName(new Date())));
});
check('print stylesheet hides everything but #pdf-report when printing', () => {
  const css = fs.readFileSync(path.join(root, 'css', 'print.css'), 'utf8');
  assert.ok(css.includes('@media print'), 'has @media print');
  assert.ok(/body > \*:not\(#pdf-report\)\s*\{[^}]*display:\s*none/.test(css), 'non-report content hidden in print');
  assert.ok(/@media screen\s*\{[^}]*#pdf-report\s*\{[^}]*display:\s*none/.test(css), 'report hidden on screen');
  assert.ok(css.includes('@page'), 'page setup present');
  assert.ok(css.includes('var(--wj-navy'), 'table headers use the active theme colour');
  const idx = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.ok(idx.includes('css/print.css'), 'index.html links print.css');
  assert.ok(idx.includes('id="pdf-report-btn"'), 'header has the PDF Report button');
  assert.ok(idx.includes('js/pdf-report.js'), 'index.html loads pdf-report.js');
});

// 11. Authentication gate (js/auth.js): SHA-256, hash handling, session.
check('sha256 matches known vectors', () => {
  assert.strictEqual(auth.sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.strictEqual(auth.sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.strictEqual(auth.sha256Hex('password'), '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8');
  assert.strictEqual(auth.sha256Hex('test-password'), 'c638833f69bbfb3c267afa0a74434812436b8f08a81fd263c6be6871de4f1265');
});
check('timing-safe comparison is exact and length-sensitive', () => {
  const h = 'a'.repeat(64);
  assert.strictEqual(auth.timingSafeEqual(h, h), true);
  assert.strictEqual(auth.timingSafeEqual(h, 'b'.repeat(64)), false);
  assert.strictEqual(auth.timingSafeEqual('abc', 'abcd'), false);
  assert.strictEqual(auth.timingSafeEqual('abc', 123), false);
});
check('isConfigured accepts only a 64-hex hash', () => {
  assert.strictEqual(auth.isConfigured('a'.repeat(64)), true);
  assert.strictEqual(auth.isConfigured('A'.repeat(64)), true); // uppercase accepted, normalised on load
  assert.strictEqual(auth.isConfigured(''), false);
  assert.strictEqual(auth.isConfigured(null), false);
  assert.strictEqual(auth.isConfigured('xyz'), false);
  assert.strictEqual(auth.isConfigured('a'.repeat(63)), false);
});
check('correct password unlocks, wrong password denied', () => {
  const stored = auth.sha256Hex('test-password');
  assert.strictEqual(auth.verifyPassword('test-password', stored), true);
  assert.strictEqual(auth.verifyPassword('wrong-password', stored), false);
  assert.strictEqual(auth.verifyPassword('test-password', ''), false);
  assert.strictEqual(auth.verifyPassword('test-password', 'not-a-hash'), false);
  assert.strictEqual(auth.verifyPassword('', stored), false);
  assert.strictEqual(auth.resolveConfig({ password_sha256: stored }).status, 'configured');
  assert.strictEqual(auth.resolveConfig({ password_sha256: '' }).status, 'not-configured');
  assert.strictEqual(auth.resolveConfig({}).status, 'not-configured');
  assert.strictEqual(auth.resolveConfig(null).status, 'not-configured');
});
function fakeStorage() {
  const s = {};
  return {
    getItem: (k) => (k in s ? s[k] : null),
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: (k) => { delete s[k]; }
  };
}
check('session flag persists across a simulated page load, sign-out clears it', () => {
  const storage = fakeStorage();
  assert.strictEqual(auth.isUnlocked(storage), false);
  assert.strictEqual(auth.attemptLogin('test-password', auth.sha256Hex('test-password'), storage), true);
  assert.strictEqual(auth.isUnlocked(storage), true);
  // Simulated reload in the same tab: same storage object, fresh check.
  assert.strictEqual(auth.isUnlocked(storage), true);
  // A new tab has fresh storage.
  assert.strictEqual(auth.isUnlocked(fakeStorage()), false);
  auth.signOut(storage);
  assert.strictEqual(auth.isUnlocked(storage), false);
  assert.strictEqual(auth.attemptLogin('wrong-password', auth.sha256Hex('test-password'), storage), false);
  assert.strictEqual(auth.isUnlocked(storage), false);
});

/* Minimal DOM stub for the gate flow (requireAuth renders an overlay). */
class StubEl {
  constructor(tag) {
    this.tagName = (tag || 'div').toUpperCase();
    this.children = [];
    this.innerHTML = '';
    this.textContent = '';
    this.hidden = false;
    this.value = '';
    this.style = {};
    this.className = '';
    this.id = '';
    this._classes = new Set();
    this.classList = {
      add: (c) => this._classes.add(c),
      remove: (c) => this._classes.delete(c),
      contains: (c) => this._classes.has(c)
    };
    this._listeners = {};
    this._removed = false;
  }
  addEventListener(type, fn) { (this._listeners[type] = this._listeners[type] || []).push(fn); }
  appendChild(child) { this.children.push(child); return child; }
  remove() { this._removed = true; }
  setAttribute(k, v) { this[k] = v; }
  focus() {}
}
function makeStubDoc() {
  const doc = {
    body: new StubEl('body'),
    _signOut: new StubEl('button'),
    createElement(tag) { return new StubEl(tag); },
    getElementById(id) { return id === 'sign-out-btn' ? doc._signOut : null; }
  };
  return doc;
}
async function checkAsync(name, fn) { await fn(); passed++; console.log('ok - ' + name); }

(async () => {
  await checkAsync('empty hash blocks with the not-configured message', async () => {
    const doc = makeStubDoc();
    let unlocked = false, blocked = null;
    const res = await auth.requireAuth({
      document: doc, storage: fakeStorage(),
      fetchJson: async () => ({ password_sha256: '' }),
      onUnlock: () => { unlocked = true; },
      onBlocked: (s) => { blocked = s; }
    });
    assert.strictEqual(res.status, 'not-configured');
    assert.strictEqual(unlocked, false);
    assert.strictEqual(blocked, 'not-configured');
    assert.ok(res.handle.overlay, 'overlay rendered');
    assert.ok(res.handle.messageEl.textContent.includes('not configured'), 'message shown: ' + res.handle.messageEl.textContent);
    assert.ok(doc.body.classList.contains('auth-locked'), 'app shell hidden while blocked');
  });
  await checkAsync('missing auth.json blocks (fail closed)', async () => {
    const doc = makeStubDoc();
    let unlocked = false;
    const res = await auth.requireAuth({
      document: doc, storage: fakeStorage(),
      fetchJson: async () => { throw new Error('404'); },
      onUnlock: () => { unlocked = true; }
    });
    assert.strictEqual(res.status, 'not-configured');
    assert.strictEqual(unlocked, false);
    assert.ok(res.handle.messageEl.textContent.includes('not configured'));
  });
  await checkAsync('login flow: wrong password denied, correct password unlocks', async () => {
    const doc = makeStubDoc();
    const storage = fakeStorage();
    const stored = auth.sha256Hex('test-password');
    let unlocked = false;
    const res = await auth.requireAuth({
      document: doc, storage,
      fetchJson: async () => ({ password_sha256: stored }),
      onUnlock: () => { unlocked = true; }
    });
    assert.strictEqual(res.status, 'locked');
    assert.strictEqual(unlocked, false);
    assert.ok(res.handle.input, 'password input rendered');
    assert.strictEqual(res.handle.submit('wrong-password'), false);
    assert.strictEqual(unlocked, false);
    assert.strictEqual(auth.isUnlocked(storage), false);
    assert.ok(res.handle.errorEl.textContent.includes('Incorrect password'));
    assert.strictEqual(res.handle.submit('test-password'), true);
    assert.strictEqual(unlocked, true);
    assert.strictEqual(auth.isUnlocked(storage), true);
    assert.strictEqual(res.handle.overlay._removed, true, 'overlay removed after unlock');
    assert.strictEqual(doc._signOut.hidden, false, 'sign-out button shown after unlock');
  });
  await checkAsync('existing session passes through without prompting', async () => {
    const doc = makeStubDoc();
    const storage = fakeStorage();
    auth.markUnlocked(storage);
    let unlocked = false;
    const res = await auth.requireAuth({
      document: doc, storage,
      fetchJson: async () => ({ password_sha256: auth.sha256Hex('test-password') }),
      onUnlock: () => { unlocked = true; }
    });
    assert.strictEqual(res.status, 'unlocked');
    assert.strictEqual(unlocked, true);
    assert.strictEqual(res.handle, null);
    assert.strictEqual(doc._signOut.hidden, false);
  });
  console.log('\n' + passed + ' checks passed. JS KPI/scenario engines match the Python ground truth.');
})();
