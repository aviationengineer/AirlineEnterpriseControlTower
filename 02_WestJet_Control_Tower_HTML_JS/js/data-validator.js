/* data-validator.js — client-side validation summary.
 * The loaded JSON carries the Python validation block (validation.data_status,
 * data_quality_score, n_errors, n_warnings, n_checks, issues). This module
 * surfaces that block and re-runs the cheap structural checks in the browser
 * (required domains/columns, ASM >= RPM, Departures <= Scheduled Flights,
 * Cancelled Bookings <= Bookings, proportions in [0,1], duplicate months)
 * so a hand-edited or re-converted file is still checked. Known workbook
 * quirks (DATA_MODEL.md §7) are reported as observations, never silently
 * reconciled, and are not validation failures. Validation errors are never
 * silently ignored: every issue is listed in the Data Quality area.
 * Works in the browser (window.WJ) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  var REQUIRED_DOMAINS = ['flight_operations', 'mro', 'people', 'passenger', 'revenue', 'finance', 'baggage', 'cargo', 'ground', 'fuel', 'network', 'ancillary', 'data_platform', 'ai_products', 'governance'];
  var REQUIRED_COLUMNS = {
    flight_operations: ['Month', 'Scheduled Flights', 'Departures', 'Cancellations', 'On-Time Departures', 'D15 Departures', 'ASM', 'RPM', 'Block Hours', 'Active Aircraft'],
    mro: ['Month', 'Active Aircraft', 'Maintenance Events', 'Maintenance Hours', 'Available Maintenance Hours', 'Aircraft Downtime Hours', 'Dispatch Reliability', 'AOG Events', 'MEL Items', 'Deferred Defects', 'Parts Availability', 'Maintenance Cost'],
    revenue: ['Month', 'Passenger Revenue', 'Cargo Revenue', 'Ancillary Revenue', 'Other Revenue'],
    finance: ['Month', 'Operating Cost', 'Labour Cost', 'Fuel Cost', 'Other Operating Cost', 'Cash Position'],
    passenger: ['Month', 'Bookings', 'Passengers', 'Cancelled Bookings', 'Corporate Retention', 'Direct Channel Share', 'Advance Purchase Ratio', 'NPS'],
    data_platform: ['Month', 'Active Self-Service Users', 'Registered Users', 'Platform Tickets', 'Ticket Deflection Rate', 'Data Quality %', 'Platform Availability %', 'Average Freshness Minutes', 'Knowledge Base Uses', 'Security Groups'],
    ai_products: ['Month', 'Registered Data Products', 'Active Data Products', 'Adoption Rate', 'Estimated Business Value', 'Critical Incidents'],
    governance: ['Month', 'Registered Data Assets', 'Classified Assets', 'Assets with Owner', 'Governance Quality %', 'Open Governance Exceptions']
  };
  function validateData(data) {
    var issues = [];
    var checks = 0;
    if (!data || !data.domains) {
      return { data_status: 'Critical', data_quality_score: 0, n_errors: 1, n_warnings: 0, n_checks: 0,
        issues: [{ rule_id: 'BR-06', severity: 'Critical', sheet: '(workbook)', column: '', message: 'Input workbook not found. Please upload: WestJet_Enterprise_Control_Tower_Input_Template.xlsx', n_rows: 0 }] };
    }
    // Required domains (BR-06: missing sheet)
    REQUIRED_DOMAINS.forEach(function (dom) {
      checks++;
      if (!data.domains[dom]) issues.push({ rule_id: 'BR-06', severity: 'Critical', sheet: dom, column: '', message: 'Input workbook is missing sheet: ' + dom, n_rows: 0 });
    });
    // Required columns (BR-06: missing column, brief §20 format)
    Object.keys(REQUIRED_COLUMNS).forEach(function (dom) {
      var rows = data.domains[dom] || [];
      (REQUIRED_COLUMNS[dom] || []).forEach(function (col) {
        checks++;
        if (rows.length && !(col in rows[0])) issues.push({ rule_id: 'BR-06', severity: 'Critical', sheet: dom, column: col, message: 'Sheet: ' + dom + ' / Missing column: ' + col, n_rows: 0 });
      });
    });
    // Row-level rules DQ002/DQ003/DQ004 + duplicate months (BR-03)
    var fo = data.domains.flight_operations || [];
    var seen = {};
    fo.forEach(function (r) {
      checks += 3;
      if (r.ASM < r.RPM) issues.push({ rule_id: 'DQ002', severity: 'Critical', sheet: 'Flight_Operations', column: 'ASM', message: 'ASM must be greater than or equal to RPM in Flight_Operations, ' + r.Month + ': ASM ' + r.ASM + ', RPM ' + r.RPM + '.', n_rows: 1 });
      if (r.Departures > r['Scheduled Flights']) issues.push({ rule_id: 'DQ003', severity: 'High', sheet: 'Flight_Operations', column: 'Departures', message: 'Departures must not exceed Scheduled Flights in Flight_Operations, ' + r.Month + ': Departures ' + r.Departures + ', Scheduled Flights ' + r['Scheduled Flights'] + '.', n_rows: 1 });
      if (seen[r.Month]) issues.push({ rule_id: 'BR-03', severity: 'High', sheet: 'Flight_Operations', column: 'Month', message: 'Duplicate month in Flight_Operations: ' + r.Month + ' appears more than once. Only the first occurrence was loaded.', n_rows: 1 });
      seen[r.Month] = true;
    });
    (data.domains.passenger || []).forEach(function (r) {
      checks++;
      if (r['Cancelled Bookings'] > r.Bookings) issues.push({ rule_id: 'DQ004', severity: 'High', sheet: 'Passenger_Commercial', column: 'Cancelled Bookings', message: 'Cancelled Bookings must not exceed Bookings in Passenger_Commercial, ' + r.Month + ': Cancelled Bookings ' + r['Cancelled Bookings'] + ', Bookings ' + r.Bookings + '.', n_rows: 1 });
    });
    // Proportions in [0,1] (DQ005–DQ007, BR-04 spot checks)
    [['mro', 'Dispatch Reliability', 'DQ005'], ['data_platform', 'Data Quality %', 'DQ006'], ['data_platform', 'Platform Availability %', 'DQ007']].forEach(function (spec) {
      (data.domains[spec[0]] || []).forEach(function (r) {
        checks++;
        var v = r[spec[1]];
        if (v !== null && v !== undefined && (v < 0 || v > 1)) issues.push({ rule_id: spec[2], severity: 'High', sheet: spec[0], column: spec[1], message: spec[1] + ' must be between 0 and 1 in ' + spec[0] + ', ' + r.Month + ': value ' + v + '.', n_rows: 1 });
      });
    });
    // Merge the Python validation block (ground truth for the loaded file).
    var base = data.validation || {};
    var merged = (base.issues || []).slice();
    issues.forEach(function (iss) {
      if (!merged.some(function (m) { return m.rule_id === iss.rule_id && m.message === iss.message; })) merged.push(iss);
    });
    var nErrors = merged.filter(function (i) { return i.severity === 'Critical'; }).length;
    var nWarnings = merged.filter(function (i) { return i.severity !== 'Critical'; }).length;
    var status = nErrors ? 'Critical' : (nWarnings ? 'Warning' : 'Healthy');
    var nChecks = base.n_checks || checks;
    var failedWeight = merged.reduce(function (s, i) { return s + (i.severity === 'Critical' ? 1 : 0.5); }, 0);
    var score = base.data_quality_score !== undefined ? base.data_quality_score : Math.max(0, Math.round((1 - failedWeight / Math.max(nChecks, 1)) * 1000) / 10);
    return { data_status: base.data_status || status, data_quality_score: score, n_errors: base.n_errors !== undefined ? base.n_errors : nErrors, n_warnings: base.n_warnings !== undefined ? base.n_warnings : nWarnings, n_checks: nChecks, issues: merged };
  }
  var V = { REQUIRED_DOMAINS: REQUIRED_DOMAINS, REQUIRED_COLUMNS: REQUIRED_COLUMNS, validateData: validateData };
  WJ.validator = V;
  if (typeof module !== 'undefined' && module.exports) module.exports = V;
})(typeof window !== 'undefined' ? window : globalThis);
