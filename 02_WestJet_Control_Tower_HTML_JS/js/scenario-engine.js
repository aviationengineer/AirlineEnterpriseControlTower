/* scenario-engine.js — JS mirror of Python services/scenario_engine.py
 * (models/scenario_model.py for bounds and preset mapping).
 * Applies preset scenarios S001–S009 (read from the loaded JSON, never
 * hard-coded) and interactive simulator inputs to a baseline period.
 * Modelling assumptions are the Python engine's, stated in the code:
 * demand scales Passengers/RPM/Passenger Revenue/Ancillary Revenue;
 * yield scales Passenger Revenue only; capacity scales ASM, Block Hours,
 * Fuel Cost and Other Operating Cost; maintenance/labour deltas add to
 * Operating Cost once (rebuilt from components, never double-counted);
 * cancellations reduce Departures one-for-one and scale volume/revenue
 * with the Departures ratio; FX scales Total Revenue and Operating Cost
 * by the same % (see SCENARIO_DEFINITIONS.md §3.9); headcount and
 * D0/D15 are recorded with no direct financial impact; Load Factor is
 * capped at 100% for reporting; cash impact = change in operating
 * profit applied to baseline Cash Position (first-order, illustrative
 * on multi-month baselines). Every output is labelled SIMULATED.
 * Works in the browser (window.WJ) and in Node (module.exports).
 */
(function (root) {
  'use strict';
  var WJ = root.WJ = root.WJ || {};
  var INPUT_BOUNDS = {
    passenger_demand: [-50, 50], yield_pct: [-50, 50], load_factor: [-50, 50],
    capacity: [-50, 50], flights: [-50, 50], aircraft_utilisation: [-50, 50],
    fuel_price: [-30, 100], fuel_volume: [-50, 50], maintenance_cost: [-50, 50],
    aircraft_availability: [-50, 50], labour_cost: [-50, 50], headcount: [-50, 50],
    cancellation: [-100, 100], d0: [-50, 50], d15: [-50, 50],
    cargo_demand: [-50, 50], cargo_yield: [-50, 50], ancillary_revenue: [-50, 50],
    fx: [-50, 50]
  };
  var PRESET_VARIABLE_MAP = {
    'Fuel Price': 'fuel_price', 'Passenger Demand': 'passenger_demand',
    'Capacity': 'capacity', 'Maintenance Cost': 'maintenance_cost',
    'Labour Cost': 'labour_cost', 'Yield': 'yield_pct',
    'Ancillary Revenue': 'ancillary_revenue', 'Flight Cancellations': 'cancellation'
  };
  var INPUT_LABELS = {
    passenger_demand: 'Passenger Demand', yield_pct: 'Yield', load_factor: 'Load Factor',
    capacity: 'Capacity', flights: 'Flights', aircraft_utilisation: 'Aircraft Utilisation',
    fuel_price: 'Fuel Price', fuel_volume: 'Fuel Volume', maintenance_cost: 'Maintenance Cost',
    aircraft_availability: 'Aircraft Availability', labour_cost: 'Labour Cost', headcount: 'Headcount',
    cancellation: 'Cancellations', d0: 'D0', d15: 'D15',
    cargo_demand: 'Cargo Demand', cargo_yield: 'Cargo Yield', ancillary_revenue: 'Ancillary Revenue', fx: 'FX'
  };
  function pct(v) { return 1 + Number(v) / 100; }
  function fmtSigned(v) { return (Number(v) >= 0 ? '+' : '') + Number(v).toFixed(0); }
  function defaultInputs() {
    var o = { label: 'Interactive scenario' };
    Object.keys(INPUT_BOUNDS).forEach(function (k) { o[k] = 0; });
    return o;
  }
  function validateInputs(inputs) {
    var warnings = [];
    Object.keys(INPUT_BOUNDS).forEach(function (f) {
      var lo = INPUT_BOUNDS[f][0], hi = INPUT_BOUNDS[f][1], v = Number(inputs[f] || 0);
      if (v < lo) { warnings.push(f + ' clamped from ' + v + '% to ' + lo + '%'); inputs[f] = lo; }
      else if (v > hi) { warnings.push(f + ' clamped from ' + v + '% to ' + hi + '%'); inputs[f] = hi; }
    });
    return warnings;
  }
  function changedVariables(inputs) {
    var o = {};
    Object.keys(INPUT_BOUNDS).forEach(function (f) { if (Number(inputs[f] || 0) !== 0) o[f] = Number(inputs[f]); });
    return o;
  }
  function presetToInput(def) {
    var field = PRESET_VARIABLE_MAP[def['Variable']];
    if (!field) throw new Error("Scenario " + def['Scenario ID'] + ": unknown variable '" + def['Variable'] + "' — cannot map to a simulator input.");
    var inputs = defaultInputs();
    inputs.label = def['Scenario ID'] + ' ' + def['Scenario Name'];
    inputs[field] = Number(def['Change %']);
    return inputs;
  }
  function buildBaseline(domains, start, end) {
    var inputs = WJ.kpi.aggregateInputs(domains, start, end);
    inputs.start = start; inputs.end = end;
    var fo = (domains.flight_operations || []).filter(function (r) { return r.Month >= start && r.Month <= end; });
    inputs.Cancellations = fo.reduce(function (s, r) { return s + Number(r.Cancellations || 0); }, 0);
    return inputs;
  }
  function applyScenario(baseline, inputs) {
    var warnings = validateInputs(inputs);
    var assumptions = warnings.slice();
    var b = baseline;
    var asm = b.ASM, rpm = b.RPM, passengers = b.Passengers,
        passengerRevenue = b['Passenger Revenue'], cargoRevenue = b['Cargo Revenue'],
        ancillaryRevenue = b['Ancillary Revenue'], otherRevenue = b['Other Revenue'],
        operatingCost = b['Operating Cost'], labourCost = b['Labour Cost'],
        fuelCost = b['Fuel Cost'], otherOpCost = b['Other Operating Cost'],
        maintenanceCost = b['Maintenance Cost'], cargoTonnes = b['Cargo Tonnes'],
        blockHours = b['Block Hours'], departures = b['Departures'],
        cancellations = b.Cancellations || 0, cash = b['Cash Position'];
    var maintDelta = 0, labourDelta = 0, f, ratio;
    if (inputs.capacity) {
      f = pct(inputs.capacity); asm *= f; blockHours *= f; fuelCost *= f; otherOpCost *= f;
      assumptions.push('Capacity ' + fmtSigned(inputs.capacity) + '%: ASM, Block Hours, Fuel Cost and Other Operating Cost scaled by ' + f.toFixed(2) + '.');
    }
    if (inputs.flights) {
      f = pct(inputs.flights); departures *= f;
      assumptions.push('Flights ' + fmtSigned(inputs.flights) + '%: Departures scaled by ' + f.toFixed(2) + '.');
    }
    if (inputs.aircraft_availability) {
      assumptions.push('Aircraft Availability ' + fmtSigned(inputs.aircraft_availability) + '%: recorded; no direct financial impact in this model.');
    }
    if (inputs.aircraft_utilisation) {
      f = pct(inputs.aircraft_utilisation); blockHours *= f;
      assumptions.push('Aircraft Utilisation ' + fmtSigned(inputs.aircraft_utilisation) + '%: Block Hours scaled by ' + f.toFixed(2) + '.');
    }
    if (inputs.passenger_demand) {
      f = pct(inputs.passenger_demand); passengers *= f; rpm *= f; passengerRevenue *= f; ancillaryRevenue *= f;
      assumptions.push('Passenger Demand ' + fmtSigned(inputs.passenger_demand) + '%: Passengers, RPM, Passenger Revenue and Ancillary Revenue scaled by ' + f.toFixed(2) + ' (yield held constant).');
    }
    if (inputs.load_factor) {
      f = pct(inputs.load_factor); rpm *= f;
      assumptions.push('Load Factor ' + fmtSigned(inputs.load_factor) + '%: RPM scaled by ' + f.toFixed(2) + ' (ASM unchanged).');
    }
    if (inputs.yield_pct) {
      f = pct(inputs.yield_pct); passengerRevenue *= f;
      assumptions.push('Yield ' + fmtSigned(inputs.yield_pct) + '%: Passenger Revenue scaled by ' + f.toFixed(2) + ' (RPM unchanged).');
    }
    if (inputs.cancellation) {
      var extra = cancellations * inputs.cancellation / 100;
      var newDepartures = Math.max(departures - extra, 0);
      ratio = departures ? newDepartures / departures : 1;
      departures = newDepartures; passengers *= ratio; rpm *= ratio; passengerRevenue *= ratio;
      assumptions.push('Cancellations ' + fmtSigned(inputs.cancellation) + '%: Departures fall to ' + departures.toLocaleString('en-GB', { maximumFractionDigits: 0 }) + '; Passengers, RPM and Passenger Revenue scaled by ' + ratio.toFixed(3) + '.');
    }
    if (inputs.cargo_demand) {
      f = pct(inputs.cargo_demand); cargoTonnes *= f; cargoRevenue *= f;
      assumptions.push('Cargo Demand ' + fmtSigned(inputs.cargo_demand) + '%: Cargo Tonnes and Cargo Revenue scaled by ' + f.toFixed(2) + '.');
    }
    if (inputs.cargo_yield) {
      f = pct(inputs.cargo_yield); cargoRevenue *= f;
      assumptions.push('Cargo Yield ' + fmtSigned(inputs.cargo_yield) + '%: Cargo Revenue scaled by ' + f.toFixed(2) + '.');
    }
    if (inputs.ancillary_revenue) {
      f = pct(inputs.ancillary_revenue); ancillaryRevenue *= f;
      assumptions.push('Ancillary Revenue ' + fmtSigned(inputs.ancillary_revenue) + '%: Ancillary Revenue scaled by ' + f.toFixed(2) + '.');
    }
    if (inputs.fuel_price) {
      f = pct(inputs.fuel_price); fuelCost *= f;
      assumptions.push('Fuel Price ' + fmtSigned(inputs.fuel_price) + '%: Fuel Cost scaled by ' + f.toFixed(2) + ' -> Operating Cost up -> CASM up -> Margin down.');
    }
    if (inputs.fuel_volume) {
      f = pct(inputs.fuel_volume); fuelCost *= f;
      assumptions.push('Fuel Volume ' + fmtSigned(inputs.fuel_volume) + '%: Fuel Cost scaled by ' + f.toFixed(2) + '.');
    }
    if (inputs.maintenance_cost) {
      maintDelta = maintenanceCost * inputs.maintenance_cost / 100;
      maintenanceCost += maintDelta;
      assumptions.push('Maintenance Cost ' + fmtSigned(inputs.maintenance_cost) + '%: Operating Cost up by $' + maintDelta.toLocaleString('en-GB', { maximumFractionDigits: 0 }) + ' (maintenance treated as part of Operating Cost).');
    }
    if (inputs.labour_cost) {
      labourDelta = labourCost * inputs.labour_cost / 100;
      labourCost += labourDelta;
      assumptions.push('Labour Cost ' + fmtSigned(inputs.labour_cost) + '%: Operating Cost up by $' + labourDelta.toLocaleString('en-GB', { maximumFractionDigits: 0 }) + '.');
    }
    if (inputs.headcount) {
      assumptions.push('Headcount ' + fmtSigned(inputs.headcount) + '%: recorded; no direct financial impact in this model (no headcount cost column).');
    }
    if (inputs.d0 || inputs.d15) {
      assumptions.push('D0 ' + fmtSigned(inputs.d0 || 0) + '% / D15 ' + fmtSigned(inputs.d15 || 0) + '%: recorded; no direct financial impact in this model.');
    }
    operatingCost = labourCost + fuelCost + otherOpCost + maintDelta;
    if (inputs.fx) {
      f = pct(inputs.fx);
      passengerRevenue *= f; cargoRevenue *= f; ancillaryRevenue *= f; otherRevenue *= f; operatingCost *= f;
      assumptions.push('FX ' + fmtSigned(inputs.fx) + '%: Total Revenue and Operating Cost both scaled by ' + f.toFixed(2) + '.');
    }
    var totalRevenue = passengerRevenue + cargoRevenue + ancillaryRevenue + otherRevenue;
    var baseTotal = b['Total Revenue'], baseCost = b['Operating Cost'];
    var ebit = totalRevenue - operatingCost, baseEbit = baseTotal - baseCost;
    var margin = totalRevenue ? (totalRevenue - operatingCost) / totalRevenue : null;
    var baseMargin = baseTotal ? (baseTotal - baseCost) / baseTotal : null;
    var rask = asm ? passengerRevenue / asm : null;
    var cask = asm ? operatingCost / asm : null;
    var loadFactor = asm ? rpm / asm : null;
    if (loadFactor !== null && loadFactor > 1) {
      assumptions.push('Simulated Load Factor ' + (loadFactor * 100).toFixed(1) + '% exceeds 100% and is capped at 100% for reporting.');
      loadFactor = 1;
    }
    var cashSim = (cash !== null && cash !== undefined) ? cash + (ebit - baseEbit) : null;
    return {
      label: inputs.label || 'Interactive scenario', is_simulated: true,
      total_revenue: totalRevenue, operating_cost: operatingCost, operating_margin: margin,
      rask: rask, cask: cask, load_factor: loadFactor, cash_position: cashSim,
      ebit_style: ebit, passengers: passengers, asm: asm,
      revenue_impact: totalRevenue - baseTotal, cost_impact: operatingCost - baseCost,
      margin_impact_pp: (margin !== null && baseMargin !== null) ? (margin - baseMargin) * 100 : null,
      cash_impact: (cashSim !== null && cash !== null && cash !== undefined) ? cashSim - cash : null,
      assumptions: assumptions
    };
  }
  function runPreset(domains, def, start, end) {
    return applyScenario(buildBaseline(domains, start, end), presetToInput(def));
  }
  var S = {
    INPUT_BOUNDS: INPUT_BOUNDS, PRESET_VARIABLE_MAP: PRESET_VARIABLE_MAP, INPUT_LABELS: INPUT_LABELS,
    defaultInputs: defaultInputs, validateInputs: validateInputs, changedVariables: changedVariables,
    presetToInput: presetToInput, buildBaseline: buildBaseline, applyScenario: applyScenario, runPreset: runPreset
  };
  WJ.scenario = S;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
