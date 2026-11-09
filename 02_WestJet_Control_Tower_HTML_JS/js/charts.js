/* charts.js — reusable chart helpers + shared UI helpers (formatting,
 * KPI cards, tables, heatmaps, matrices). Chart.js 4.4.1 via CDN, as the
 * wireframe used; offline use needs the library vendored (see README).
 * If Chart.js is unavailable, every chart degrades to a data table —
 * never a blank panel. en-GB formatting throughout.
 * Works in the browser (window.WJ); Node only needs node --check.
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  var chartRegistry = {};
  var uidCounter = 0;
  function uid(prefix) { uidCounter++; return (prefix || 'c') + '-' + uidCounter; }
  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtNum(v, dp) {
    if (v === null || v === undefined || !isFinite(Number(v))) return 'n/a';
    return Number(v).toLocaleString('en-GB', { minimumFractionDigits: dp === undefined ? 0 : dp, maximumFractionDigits: dp === undefined ? 0 : dp });
  }
  function fmtMoney(v) {
    if (v === null || v === undefined || !isFinite(Number(v))) return 'n/a';
    var abs = Math.abs(Number(v));
    if (abs >= 1e9) return '$' + (Number(v) / 1e9).toFixed(2) + 'bn';
    if (abs >= 1e6) return '$' + (Number(v) / 1e6).toFixed(1) + 'm';
    return '$' + fmtNum(v);
  }
  function fmtMoneyFull(v) {
    if (v === null || v === undefined || !isFinite(Number(v))) return 'n/a';
    return '$' + fmtNum(v);
  }
  function fmtPct(v, dp) {
    if (v === null || v === undefined || !isFinite(Number(v))) return 'n/a';
    return (Number(v) * 100).toFixed(dp === undefined ? 1 : dp) + '%';
  }
  function fmtPP(v, dp) {
    if (v === null || v === undefined || !isFinite(Number(v))) return 'n/a';
    var sign = Number(v) >= 0 ? '+' : '';
    return sign + (Number(v) * 100).toFixed(dp === undefined ? 1 : dp) + 'pp';
  }
  function fmtSignedPct(v, dp) {
    if (v === null || v === undefined || !isFinite(Number(v))) return 'n/a';
    var sign = Number(v) >= 0 ? '+' : '';
    return sign + (Number(v) * 100).toFixed(dp === undefined ? 1 : dp) + '%';
  }
  function fmtKpiValue(kpi, v) {
    if (v === null || v === undefined) return 'n/a';
    var pctKpis = ['Load Factor', 'D0', 'D15', 'Dispatch Reliability', 'Baggage Mishandling Rate', 'Operating Margin', 'Ticket Deflection Rate', 'Data Quality', 'Platform Availability', 'Data Product Adoption'];
    if (pctKpis.indexOf(kpi) >= 0) return fmtPct(v, 2);
    if (kpi === 'RASK' || kpi === 'CASM' || kpi === 'Yield') return '$' + Number(v).toFixed(4);
    if (kpi === 'Aircraft Utilization') return fmtNum(v, 1) + ' hrs';
    if (kpi === 'Maintenance Cost / Flight Hour') return '$' + fmtNum(v, 2);
    if (kpi === 'AOG Rate') return Number(v).toFixed(3);
    if (kpi === 'Cargo Yield') return '$' + fmtNum(v, 0) + '/t';
    if (kpi === 'Ancillary Revenue / Passenger') return '$' + Number(v).toFixed(2);
    return fmtNum(v);
  }
  function fmtTarget(kpi, v) { return v === null || v === undefined ? 'n/a' : fmtKpiValue(kpi, v); }
  /* Status: target first, else YoY, else prior period. Direction from the
   * KPI dictionary. Aircraft Utilization: status withheld (see footnote). */
  function kpiStatus(kpi, value, target, direction, yoyPct) {
    if (kpi === 'Aircraft Utilization') return { label: 'Status withheld', cls: 'status-neutral', note: 'Target appears to be a daily figure — status withheld pending confirmation.' };
    if (value === null || value === undefined) return { label: 'No data', cls: 'status-neutral', note: '' };
    if (target !== null && target !== undefined) {
      var meets = direction === 'Lower is better' ? Number(value) <= Number(target) : Number(value) >= Number(target);
      return meets ? { label: 'On target', cls: 'status-good', note: '' } : { label: 'Off target', cls: 'status-bad', note: '' };
    }
    if (yoyPct !== null && yoyPct !== undefined) {
      var good = direction === 'Lower is better' ? Number(yoyPct) < 0 : Number(yoyPct) > 0;
      return good ? { label: 'Improving', cls: 'status-good', note: '' } : { label: 'Deteriorating', cls: 'status-bad', note: '' };
    }
    return { label: '—', cls: 'status-neutral', note: '' };
  }
  function kpiCard(spec) {
    var st = kpiStatus(spec.kpi, spec.value, spec.target, spec.direction || 'Higher is better', spec.yoyPct);
    var sparkId = uid('spark');
    var varTxt = '';
    if (spec.target !== null && spec.target !== undefined && spec.value !== null && spec.value !== undefined) {
      var vt = WJ.kpi.varianceToTarget(spec.value, spec.target);
      varTxt = 'Variance to target: ' + fmtSignedPct(vt, 1);
    }
    var yoyTxt = spec.yoyPct === null || spec.yoyPct === undefined ? 'YoY: n/a'
      : (spec.yoyIsPP ? 'YoY: ' + fmtPP(spec.yoyPct, 1) : 'YoY: ' + fmtSignedPct(spec.yoyPct, 1));
    var note = spec.note || st.note;
    return '<article class="kpi-card" data-kpi="' + esc(spec.kpi) + '" data-category="' + esc(spec.category || '') + '"' +
      (spec.drill ? ' data-drill="' + esc(spec.drill) + '" tabindex="0" role="link" title="Open the ' + esc(spec.drill) + ' dashboard"' : '') + '>' +
      '<h3>' + esc(spec.label || spec.kpi) + '</h3>' +
      '<div class="kpi-value">' + esc(spec.valueText !== undefined ? spec.valueText : fmtKpiValue(spec.kpi, spec.value)) + '</div>' +
      '<div class="kpi-meta"><span>Previous: ' + esc(spec.prevText !== undefined ? spec.prevText : fmtKpiValue(spec.kpi, spec.prev)) + '</span>' +
      '<span>' + esc(yoyTxt) + '</span></div>' +
      '<div class="kpi-meta"><span>Target: ' + esc(fmtTarget(spec.kpi, spec.target)) + '</span><span>' + esc(varTxt) + '</span></div>' +
      '<div class="kpi-status ' + st.cls + '">' + esc(st.label) + '</div>' +
      (spec.trend && spec.trend.length ? '<div class="sparkline-wrap"><canvas id="' + sparkId + '" class="sparkline" data-spark="' + esc(JSON.stringify(spec.trend.filter(function (v) { return v !== null && v !== undefined; }))) + '"></canvas></div>' : '') +
      (note ? '<p class="kpi-note">' + esc(note) + '</p>' : '') +
      '</article>';
  }
  /* Card for one KPI from context: current = latest month in range,
   * previous = prior month, YoY = same month prior year (full frame, so
   * YoY works even when the selected range is a single year). */
  var PCT_KPIS = ['Load Factor', 'D0', 'D15', 'Dispatch Reliability', 'Baggage Mishandling Rate', 'Operating Margin', 'Ticket Deflection Rate', 'Data Quality', 'Platform Availability', 'Data Product Adoption'];
  function cardFor(ctx, kpi, opts) {
    opts = opts || {};
    var def = (ctx.definitions || []).find(function (d) { return d.KPI === kpi; }) || {};
    var comp = WJ.comparison.compareMonth(ctx.kpiFrame || [], kpi, ctx.latestMonth);
    var value = opts.value !== undefined ? opts.value : comp.current;
    var prev = opts.prev !== undefined ? opts.prev : comp.prior_month;
    var yoy = opts.yoyPct !== undefined ? opts.yoyPct : comp.yoy_pct;
    return kpiCard({
      kpi: kpi, label: opts.label || kpi, value: value, prev: prev, yoyPct: yoy,
      yoyIsPP: PCT_KPIS.indexOf(kpi) >= 0,
      target: opts.target !== undefined ? opts.target : ctx.targets[kpi],
      direction: opts.direction || def.Direction || 'Higher is better',
      category: opts.category || (WJ.filters && WJ.filters.KPI_CATEGORY[kpi]) || '',
      trend: opts.trend !== undefined ? opts.trend : (ctx.rangeRows || []).map(function (r) { return r[kpi]; }),
      drill: opts.drill, note: opts.note, valueText: opts.valueText, prevText: opts.prevText
    });
  }
  /* Card for a level measure read from a domain (e.g. Passengers, Cash
   * Position) — monthly value, prior month and YoY from the domain rows. */
  function levelCard(ctx, dom, col, label, opts) {
    opts = opts || {};
    function val(m) { return ctx.domainValue(dom, col, m); }
    var cur = val(ctx.latestMonth), prev = val(WJ.comparison.shiftMonth(ctx.latestMonth, -1)),
        py = val(WJ.comparison.shiftMonth(ctx.latestMonth, -12));
    var yoy = (cur !== null && py !== null && py !== 0) ? (cur - py) / Math.abs(py) : null;
    var rows = (ctx.domains[dom] || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
    return kpiCard({
      kpi: label, label: label, value: cur, prev: prev, yoyPct: yoy, yoyIsPP: false,
      target: null, direction: opts.direction || 'Higher is better',
      category: opts.category || '', trend: rows.map(function (r) { return r[col]; }),
      drill: opts.drill, note: opts.note,
      valueText: opts.valueText !== undefined ? opts.valueText : fmtMoney(cur),
      prevText: opts.prevText !== undefined ? opts.prevText : fmtMoney(prev)
    });
  }
  function section(title, inner, note) {
    return '<section class="panel"><h2>' + esc(title) + '</h2>' + (note ? '<p class="panel-note">' + esc(note) + '</p>' : '') + inner + '</section>';
  }
  function tableHTML(headers, rows, opts) {
    opts = opts || {};
    var h = '<table class="data-table' + (opts.className ? ' ' + opts.className : '') + '"><thead><tr>' +
      headers.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rows.forEach(function (r) {
      h += '<tr>' + r.map(function (c) { return '<td>' + (c === null || c === undefined ? 'n/a' : c) + '</td>'; }).join('') + '</tr>';
    });
    return h + '</tbody></table>';
  }
  function destroyAll() {
    Object.keys(chartRegistry).forEach(function (id) {
      try { chartRegistry[id].destroy(); } catch (e) { /* already gone */ }
      delete chartRegistry[id];
    });
  }
  function chartFallback(canvas, labels, datasets) {
    var host = canvas.parentElement;
    if (!host) return;
    var rows = labels.map(function (lab, i) {
      return [esc(lab)].concat(datasets.map(function (ds) { return esc(fmtNum(ds.data[i], 2)); }));
    });
    host.insertAdjacentHTML('beforeend', '<div class="chart-fallback"><p>Chart.js unavailable (offline use needs the library vendored) — data shown as a table.</p>' +
      tableHTML(['Period'].concat(datasets.map(function (ds) { return ds.label; })), rows) + '</div>');
  }
  function createChart(canvasId, config) {
    var canvas = (typeof document !== 'undefined') ? document.getElementById(canvasId) : null;
    if (!canvas) return null;
    if (chartRegistry[canvasId]) { try { chartRegistry[canvasId].destroy(); } catch (e) {} delete chartRegistry[canvasId]; }
    if (typeof Chart === 'undefined') {
      chartFallback(canvas, (config.data && config.data.labels) || [], (config.data && config.data.datasets) || []);
      return null;
    }
    var chart = new Chart(canvas, config);
    chartRegistry[canvasId] = chart;
    return chart;
  }
  var PALETTE = { navy: '#002855', yellow: '#FFC72C', blue: '#2E6EA6', teal: '#0E7C7B', green: '#1B7A3D', red: '#B42318', grey: '#98A2B3', orange: '#E8730C' };
  function baseOptions(extra) {
    var o = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }, tooltip: { enabled: true } }, scales: { x: { ticks: { maxTicksLimit: 12, font: { size: 10 } } }, y: { ticks: { font: { size: 10 } } } } };
    return Object.assign(o, extra || {});
  }
  function lineChart(id, labels, datasets, opts) {
    return createChart(id, { type: 'line', data: { labels: labels, datasets: datasets.map(function (ds, i) { return Object.assign({ borderColor: ds.color || [PALETTE.navy, PALETTE.blue, PALETTE.teal, PALETTE.green][i % 4], backgroundColor: ds.color || PALETTE.navy, tension: 0.3, pointRadius: 1.5, spanGaps: false, fill: false }, ds); }) }, options: baseOptions(opts) });
  }
  function barChart(id, labels, datasets, opts) {
    return createChart(id, { type: 'bar', data: { labels: labels, datasets: datasets.map(function (ds, i) { return Object.assign({ backgroundColor: ds.color || [PALETTE.navy, PALETTE.blue, PALETTE.teal, PALETTE.yellow][i % 4], borderColor: ds.color || PALETTE.navy }, ds); }) }, options: baseOptions(opts) });
  }
  /* Waterfall via floating bars: data = [{label, value}] cumulative from a start. */
  function waterfallChart(id, labels, values, opts) {
    var data = [], colors = [], running = 0;
    values.forEach(function (v, i) {
      if (i === 0 || i === values.length - 1) { data.push([0, v]); colors.push(PALETTE.navy); running = v; }
      else { var from = running; running += v; data.push([Math.min(from, running), Math.max(from, running)]); colors.push(v >= 0 ? PALETTE.green : PALETTE.red); }
    });
    return createChart(id, { type: 'bar', data: { labels: labels, datasets: [{ label: (opts && opts.label) || 'Value', data: data, backgroundColor: colors, borderColor: PALETTE.navy, borderWidth: 1 }] }, options: baseOptions({ plugins: { legend: { display: false } } }) });
  }
  function scatterChart(id, points, opts) {
    return createChart(id, { type: 'scatter', data: { datasets: [{ label: (opts && opts.label) || 'Routes', data: points, backgroundColor: PALETTE.blue }] }, options: baseOptions(opts) });
  }
  function paretoChart(id, labels, values) {
    var total = values.reduce(function (a, b) { return a + b; }, 0), cum = 0;
    var cumPct = values.map(function (v) { cum += v; return total ? cum / total * 100 : 0; });
    return createChart(id, { type: 'bar', data: { labels: labels, datasets: [{ label: 'Count', data: values, backgroundColor: PALETTE.navy, yAxisID: 'y' }, { label: 'Cumulative %', data: cumPct, type: 'line', borderColor: PALETTE.yellow, backgroundColor: PALETTE.yellow, yAxisID: 'y1', tension: 0.3 }] }, options: baseOptions({ scales: { y: { type: 'linear', position: 'left' }, y1: { type: 'linear', position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false } } } }) });
  }
  function drawSparklines(scope) {
    if (typeof document === 'undefined' || typeof Chart === 'undefined') return;
    (scope || document).querySelectorAll('canvas[data-spark]').forEach(function (cv) {
      try {
        var vals = JSON.parse(cv.getAttribute('data-spark') || '[]');
        if (!vals.length) return;
        new Chart(cv, { type: 'line', data: { labels: vals.map(function (_, i) { return i + 1; }), datasets: [{ data: vals, borderColor: PALETTE.blue, backgroundColor: PALETTE.blue, tension: 0.3, pointRadius: 0, fill: false }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } } });
      } catch (e) { /* sparkline is decorative; ignore */ }
    });
  }
  /* Heatmap as an HTML grid (Chart.js has no heatmap type). valueFn(r,c)->number|null, colourFn(v)->css colour. */
  function heatmapHTML(rowLabels, colLabels, matrix, colourFn, formatFn) {
    var h = '<div class="heatmap-wrap"><table class="heatmap"><thead><tr><th></th>' + colLabels.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>';
    rowLabels.forEach(function (rl, i) {
      h += '<tr><th>' + esc(rl) + '</th>';
      colLabels.forEach(function (cl, j) {
        var v = matrix[i][j];
        h += '<td style="background:' + esc(v === null || v === undefined ? '#F2F4F7' : colourFn(v)) + '">' + esc(v === null || v === undefined ? 'n/a' : formatFn(v)) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table></div>';
  }
  function download(filename, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function toCSV(rows) {
    return rows.map(function (r) {
      return r.map(function (c) {
        var s = String(c === null || c === undefined ? '' : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\n');
  }
  var U = {
    esc: esc, fmtNum: fmtNum, fmtMoney: fmtMoney, fmtMoneyFull: fmtMoneyFull, fmtPct: fmtPct, fmtPP: fmtPP,
    fmtSignedPct: fmtSignedPct, fmtKpiValue: fmtKpiValue, fmtTarget: fmtTarget, kpiStatus: kpiStatus,
    kpiCard: kpiCard, cardFor: cardFor, levelCard: levelCard, section: section, tableHTML: tableHTML, uid: uid, PALETTE: PALETTE,
    destroyAll: destroyAll, createChart: createChart, lineChart: lineChart, barChart: barChart,
    waterfallChart: waterfallChart, scatterChart: scatterChart, paretoChart: paretoChart,
    drawSparklines: drawSparklines, heatmapHTML: heatmapHTML, download: download, toCSV: toCSV
  };
  WJ.ui = U; WJ.charts = U;
  if (typeof module !== 'undefined' && module.exports) module.exports = U;
})(typeof window !== 'undefined' ? window : globalThis);
