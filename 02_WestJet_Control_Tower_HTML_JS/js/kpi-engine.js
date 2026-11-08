/* kpi-engine.js — centralised KPI calculation engine (JS mirror of the
 * Python services/kpi_engine.py). All 18 workbook-defined KPI formulas are
 * identical to the Python engine; UI components never calculate KPIs.
 * Primary-source rules (KPI_DICTIONARY.md §2 / DATA_MODEL.md §7):
 *  - Ancillary Revenue / Passenger uses Ancillary_Revenue.Passengers.
 *  - Aircraft Utilization uses Flight_Operations.Active Aircraft;
 *    AOG Rate uses MRO_TechOps.Active Aircraft.
 *  - Dispatch Reliability, Ticket Deflection Rate, Data Quality and
 *    Platform Availability are passthrough input values.
 *  - Ticket Deflection Rate: workbook formula "Deflected Tickets /
 *    Platform Demand" is not executable (neither column exists), so the
 *    Data_Platform input column is used as a passthrough.
 *  - Total Revenue = Passenger + Cargo + Ancillary + Other Revenue, all
 *    from Revenue_Management.
 * Works in the browser (window.WJ) and in Node (module.exports) for tests.
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  function safeDiv(num, den) {
    if (num === null || num === undefined || den === null || den === undefined) return null;
    var d = Number(den);
    if (!isFinite(d) || d === 0) return null;
    return Number(num) / d;
  }
  function num(v) { return (v === null || v === undefined || v === '') ? null : Number(v); }
  var K = {
    safeDiv: safeDiv,
    loadFactor: function (rpm, asm) { return safeDiv(rpm, asm); },
    rask: function (paxRev, asm) { return safeDiv(paxRev, asm); },
    casm: function (opCost, asm) { return safeDiv(opCost, asm); },
    yield: function (paxRev, rpm) { return safeDiv(paxRev, rpm); },
    d0: function (otd, dep) { return safeDiv(otd, dep); },
    d15: function (d15d, dep) { return safeDiv(d15d, dep); },
    aircraftUtilization: function (bh, ac) { return safeDiv(bh, ac); },
    dispatchReliability: function (v) { return num(v); },
    maintenanceCostPerFlightHour: function (mc, bh) { return safeDiv(mc, bh); },
    aogRate: function (aog, ac) { return safeDiv(aog, ac); },
    baggageMishandlingRate: function (mish, handled) { return safeDiv(mish, handled); },
    cargoYield: function (cargoRev, tonnes) { return safeDiv(cargoRev, tonnes); },
    operatingMargin: function (totRev, opCost) {
      if (totRev === null || totRev === undefined || opCost === null || opCost === undefined) return null;
      return safeDiv(Number(totRev) - Number(opCost), totRev);
    },
    ancillaryRevenuePerPassenger: function (ancRev, pax) { return safeDiv(ancRev, pax); },
    ticketDeflectionRate: function (v) { return num(v); },
    dataQuality: function (v) { return num(v); },
    platformAvailability: function (v) { return num(v); },
    dataProductAdoption: function (active, reg) { return safeDiv(active, reg); },
    totalRevenue: function (paxRev, cargoRev, ancRev, otherRev) {
      var parts = [paxRev, cargoRev, ancRev, otherRev];
      for (var i = 0; i < parts.length; i++) if (parts[i] === null || parts[i] === undefined) return null;
      return Number(paxRev) + Number(cargoRev) + Number(ancRev) + Number(otherRev);
    },
    cancellationRate: function (cancelled, bookings) { return safeDiv(cancelled, bookings); },
    bookToCancelRatio: function (bookings, cancelled) { return safeDiv(bookings, cancelled); },
    successfulDeliveryRate: function (delivered, handled) { return safeDiv(delivered, handled); },
    classificationCoverage: function (classified, registered) { return safeDiv(classified, registered); },
    ownershipCoverage: function (withOwner, registered) { return safeDiv(withOwner, registered); },
    routeProfit: function (rev, cost) {
      if (rev === null || rev === undefined || cost === null || cost === undefined) return null;
      return Number(rev) - Number(cost);
    }
  };
  function computeKpisForMonth(row) {
    var totalRevenue = K.totalRevenue(row['Passenger Revenue'], row['Cargo Revenue'], row['Ancillary Revenue'], row['Other Revenue']);
    return {
      'Load Factor': K.loadFactor(row['RPM'], row['ASM']),
      'RASK': K.rask(row['Passenger Revenue'], row['ASM']),
      'CASM': K.casm(row['Operating Cost'], row['ASM']),
      'Yield': K.yield(row['Passenger Revenue'], row['RPM']),
      'D0': K.d0(row['On-Time Departures'], row['Departures']),
      'D15': K.d15(row['D15 Departures'], row['Departures']),
      'Aircraft Utilization': K.aircraftUtilization(row['Block Hours'], row['Active Aircraft']),
      'Dispatch Reliability': K.dispatchReliability(row['Dispatch Reliability']),
      'Maintenance Cost / Flight Hour': K.maintenanceCostPerFlightHour(row['Maintenance Cost'], row['Block Hours']),
      'AOG Rate': K.aogRate(row['AOG Events'], row['Active Aircraft_mro']),
      'Baggage Mishandling Rate': K.baggageMishandlingRate(row['Mishandled Bags'], row['Bags Handled']),
      'Cargo Yield': K.cargoYield(row['Cargo Revenue_cargo'], row['Cargo Tonnes']),
      'Operating Margin': K.operatingMargin(totalRevenue, row['Operating Cost']),
      'Ancillary Revenue / Passenger': K.ancillaryRevenuePerPassenger(row['Ancillary Revenue_anc'], row['Passengers_anc']),
      'Ticket Deflection Rate': K.ticketDeflectionRate(row['Ticket Deflection Rate']),
      'Data Quality': K.dataQuality(row['Data Quality %']),
      'Platform Availability': K.platformAvailability(row['Platform Availability %']),
      'Data Product Adoption': K.dataProductAdoption(row['Active Data Products'], row['Registered Data Products'])
    };
  }
  K.computeKpisForMonth = computeKpisForMonth;
  function byMonth(rows) {
    var m = {};
    (rows || []).forEach(function (r) { if (r && r.Month) m[r.Month] = r; });
    return m;
  }
  function computeKpiFrame(domains) {
    var fo = byMonth(domains.flight_operations), mro = byMonth(domains.mro),
        rev = byMonth(domains.revenue), fin = byMonth(domains.finance),
        bag = byMonth(domains.baggage), car = byMonth(domains.cargo),
        anc = byMonth(domains.ancillary), dp = byMonth(domains.data_platform),
        ai = byMonth(domains.ai_products);
    return Object.keys(fo).sort().map(function (month) {
      var row = Object.assign({}, fo[month]);
      var m = mro[month] || {};
      row['Active Aircraft_mro'] = m['Active Aircraft'];
      row['Dispatch Reliability'] = m['Dispatch Reliability'];
      row['AOG Events'] = m['AOG Events'];
      row['Maintenance Cost'] = m['Maintenance Cost'];
      var r = rev[month] || {};
      row['Passenger Revenue'] = r['Passenger Revenue'];
      row['Cargo Revenue'] = r['Cargo Revenue'];
      row['Ancillary Revenue'] = r['Ancillary Revenue'];
      row['Other Revenue'] = r['Other Revenue'];
      row['Operating Cost'] = (fin[month] || {})['Operating Cost'];
      row['Bags Handled'] = (bag[month] || {})['Bags Handled'];
      row['Mishandled Bags'] = (bag[month] || {})['Mishandled Bags'];
      row['Cargo Tonnes'] = (car[month] || {})['Cargo Tonnes'];
      row['Cargo Revenue_cargo'] = (car[month] || {})['Cargo Revenue'];
      row['Passengers_anc'] = (anc[month] || {})['Passengers'];
      row['Ancillary Revenue_anc'] = (anc[month] || {})['Ancillary Revenue'];
      row['Ticket Deflection Rate'] = (dp[month] || {})['Ticket Deflection Rate'];
      row['Data Quality %'] = (dp[month] || {})['Data Quality %'];
      row['Platform Availability %'] = (dp[month] || {})['Platform Availability %'];
      row['Active Data Products'] = (ai[month] || {})['Active Data Products'];
      row['Registered Data Products'] = (ai[month] || {})['Registered Data Products'];
      var kpis = computeKpisForMonth(row);
      var totalRevenue = K.totalRevenue(row['Passenger Revenue'], row['Cargo Revenue'], row['Ancillary Revenue'], row['Other Revenue']);
      var out = { Month: month, 'Total Revenue': totalRevenue, ASM: row['ASM'], RPM: row['RPM'], 'Operating Cost': row['Operating Cost'] };
      Object.keys(kpis).forEach(function (k) { out[k] = kpis[k]; });
      return out;
    });
  }
  K.computeKpiFrame = computeKpiFrame;
  function inRange(rows, start, end) {
    return (rows || []).filter(function (r) { return r && r.Month >= start && r.Month <= end; });
  }
  function sumCol(rows, col) {
    var s = 0; rows.forEach(function (r) { if (r[col] !== null && r[col] !== undefined) s += Number(r[col]); });
    return s;
  }
  function meanCol(rows, col) {
    if (!rows.length) return null;
    var s = 0, n = 0; rows.forEach(function (r) { if (r[col] !== null && r[col] !== undefined) { s += Number(r[col]); n++; } });
    return n ? s / n : null;
  }
  function lastCol(rows, col) {
    if (!rows.length) return null;
    var v = rows[rows.length - 1][col];
    return (v === null || v === undefined) ? null : Number(v);
  }
  /* Sum/mean raw inputs over [start, end] (Python aggregate_inputs).
   * Flows summed; Cash Position is the last month's value; rates are
   * recomputed from summed inputs, never averaged. NOTE (Python quirk,
   * reproduced exactly): 'Cargo Revenue_cargo' is the Revenue_Management
   * Cargo Revenue sum, not the Cargo sheet sum. */
  function aggregateInputs(domains, start, end) {
    function S(dom, col) { return sumCol(inRange(domains[dom], start, end), col); }
    function M(dom, col) { return meanCol(inRange(domains[dom], start, end), col); }
    function L(dom, col) { return lastCol(inRange(domains[dom], start, end), col); }
    var paxRev = S('revenue', 'Passenger Revenue'), cargoRev = S('revenue', 'Cargo Revenue'),
        ancRev = S('revenue', 'Ancillary Revenue'), otherRev = S('revenue', 'Other Revenue');
    return {
      ASM: S('flight_operations', 'ASM'), RPM: S('flight_operations', 'RPM'),
      'Block Hours': S('flight_operations', 'Block Hours'),
      Departures: S('flight_operations', 'Departures'),
      'On-Time Departures': S('flight_operations', 'On-Time Departures'),
      'D15 Departures': S('flight_operations', 'D15 Departures'),
      'Active Aircraft': M('flight_operations', 'Active Aircraft'),
      'Passenger Revenue': paxRev, 'Cargo Revenue': cargoRev, 'Ancillary Revenue': ancRev, 'Other Revenue': otherRev,
      'Total Revenue': paxRev + cargoRev + ancRev + otherRev,
      'Operating Cost': S('finance', 'Operating Cost'),
      'Labour Cost': S('finance', 'Labour Cost'), 'Fuel Cost': S('finance', 'Fuel Cost'),
      'Other Operating Cost': S('finance', 'Other Operating Cost'),
      'Cash Position': L('finance', 'Cash Position'),
      'Maintenance Cost': S('mro', 'Maintenance Cost'),
      'AOG Events': S('mro', 'AOG Events'),
      'Active Aircraft_mro': M('mro', 'Active Aircraft'),
      'Dispatch Reliability': M('mro', 'Dispatch Reliability'),
      'Bags Handled': S('baggage', 'Bags Handled'), 'Mishandled Bags': S('baggage', 'Mishandled Bags'),
      'Cargo Tonnes': S('cargo', 'Cargo Tonnes'),
      'Cargo Revenue_cargo': cargoRev,
      Passengers: S('passenger', 'Passengers'),
      'Passengers_anc': S('ancillary', 'Passengers'),
      'Ancillary Revenue_anc': ancRev,
      'Ticket Deflection Rate': M('data_platform', 'Ticket Deflection Rate'),
      'Data Quality %': M('data_platform', 'Data Quality %'),
      'Platform Availability %': M('data_platform', 'Platform Availability %'),
      'Active Data Products': S('ai_products', 'Active Data Products'),
      'Registered Data Products': S('ai_products', 'Registered Data Products'),
      n_months: inRange(domains.flight_operations, start, end).length
    };
  }
  K.aggregateInputs = aggregateInputs;
  function aggregateKpis(domains, start, end) {
    var inputs = aggregateInputs(domains, start, end);
    var kpis = computeKpisForMonth(inputs);
    kpis['Total Revenue'] = inputs['Total Revenue'];
    kpis['Operating Cost'] = inputs['Operating Cost'];
    kpis['Cash Position'] = inputs['Cash Position'];
    kpis['Passengers'] = inputs['Passengers'];
    kpis['ASM'] = inputs['ASM'];
    return kpis;
  }
  K.aggregateKpis = aggregateKpis;
  function varianceToTarget(value, target) {
    if (value === null || value === undefined || target === null || target === undefined || Number(target) === 0) return null;
    return (Number(value) - Number(target)) / Math.abs(Number(target));
  }
  K.varianceToTarget = varianceToTarget;
  WJ.kpi = K;
  if (typeof module !== 'undefined' && module.exports) module.exports = K;
})(typeof window !== 'undefined' ? window : globalThis);
