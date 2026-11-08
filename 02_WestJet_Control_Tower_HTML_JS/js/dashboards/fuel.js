/* dashboards/fuel.js — Fuel (Domain 10), with scenario support.
 * Fuel Cost has no column in the Fuel sheet: the derivable figure is
 * Fuel Price per Litre × Fuel Volume Litres, and Finance.Fuel Cost is
 * the supplied figure — the two are shown side by side, not reconciled.
 * A live Fuel Price +20% (S001) impact is computed from the current
 * baseline by the scenario engine. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.fuel = {
    title: 'Fuel',
    subtitle: 'Fuel price, volume, hedging and scenario impact',
    render: function (ctx) {
      var rows = (ctx.domains.fuel || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var L = rows[rows.length - 1] || {};
      var derivedCost = (L['Fuel Price per Litre'] !== undefined && L['Fuel Volume Litres'] !== undefined) ? L['Fuel Price per Litre'] * L['Fuel Volume Litres'] : null;
      var finCost = ctx.domainValue('finance', 'Fuel Cost', ctx.latestMonth);
      var fuelShock = null;
      try {
        var inputs = WJ.scenario.defaultInputs(); inputs.fuel_price = 20; inputs.label = 'S001 Fuel Shock';
        fuelShock = WJ.scenario.applyScenario(ctx.baseline, inputs);
      } catch (e) { fuelShock = null; }
      var cards = [
        U.levelCard(ctx, 'fuel', 'Fuel Price per Litre', 'Fuel Price per Litre', { category: 'Cost', direction: 'Lower is better', valueText: '$' + U.fmtNum(ctx.domainValue('fuel', 'Fuel Price per Litre', ctx.latestMonth), 3), prevText: '$' + U.fmtNum(ctx.domainValue('fuel', 'Fuel Price per Litre', WJ.comparison.shiftMonth(ctx.latestMonth, -1)), 3) }),
        U.levelCard(ctx, 'fuel', 'Fuel Volume Litres', 'Fuel Volume (litres)', { category: 'Cost', valueText: U.fmtNum(ctx.domainValue('fuel', 'Fuel Volume Litres', ctx.latestMonth)), prevText: U.fmtNum(ctx.domainValue('fuel', 'Fuel Volume Litres', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'fuel', 'Hedged %', 'Hedged %', { category: 'Cost', valueText: U.fmtPct(ctx.domainValue('fuel', 'Hedged %', ctx.latestMonth)), prevText: U.fmtPct(ctx.domainValue('fuel', 'Hedged %', WJ.comparison.shiftMonth(ctx.latestMonth, -1))) }),
        U.levelCard(ctx, 'finance', 'Fuel Cost', 'Fuel Cost (Finance, supplied)', { category: 'Cost', direction: 'Lower is better' })
      ].join('');
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">Derived Fuel Cost (latest month, Price × Volume): <strong>' + U.fmtMoneyFull(derivedCost) + '</strong> vs supplied Finance Fuel Cost: <strong>' + U.fmtMoneyFull(finCost) + '</strong>. The two are not reconciled in this build.</p>' +
        (fuelShock ? U.section('Fuel scenario support — Fuel Price +20% (S001, SIMULATED)', '<p>Applied to the selected period baseline (' + U.esc(ctx.filters.from) + ' to ' + U.esc(ctx.filters.to) + '): Cost Impact <strong>' + U.fmtMoneyFull(fuelShock.cost_impact) + '</strong> · CASM ' + U.fmtKpiValue('CASM', fuelShock.cask) + ' · Operating Margin ' + U.fmtPct(fuelShock.operating_margin) + ' (' + fuelShock.margin_impact_pp.toFixed(2) + 'pp) · Cash Impact (illustrative) ' + U.fmtMoneyFull(fuelShock.cash_impact) + '. All values SIMULATED. <a href="#/simulator" data-goto="simulator">Open the Scenario Simulator →</a></p>', 'Computed live by the scenario engine from the current baseline.') : '') +
        '<div class="chart-grid">' +
        U.section('Fuel Price trend', '<div class="chart-box"><canvas id="fuel-price"></canvas></div>') +
        U.section('Fuel Volume & Hedged %', '<div class="chart-box"><canvas id="fuel-vol"></canvas></div>') +
        '</div>' +
        U.section('Monthly detail', U.tableHTML(['Month', 'Fuel Price per Litre', 'Fuel Volume Litres', 'Hedged %', 'Derived Fuel Cost (Price × Volume)', 'Fuel Cost (Finance)'],
          rows.map(function (r) { return [r.Month, '$' + U.fmtNum(r['Fuel Price per Litre'], 3), U.fmtNum(r['Fuel Volume Litres']), U.fmtPct(r['Hedged %']), U.fmtMoneyFull(r['Fuel Price per Litre'] * r['Fuel Volume Litres']), U.fmtMoneyFull(ctx.domainValue('finance', 'Fuel Cost', r.Month))]; })));
    },
    mount: function (ctx) {
      var rows = (ctx.domains.fuel || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; });
      var labels = rows.map(function (r) { return r.Month; });
      U.lineChart('fuel-price', labels, [{ label: 'Fuel Price per Litre', data: rows.map(function (r) { return r['Fuel Price per Litre']; }), color: U.PALETTE.navy }]);
      U.barChart('fuel-vol', labels, [
        { label: 'Fuel Volume (litres)', data: rows.map(function (r) { return r['Fuel Volume Litres']; }), color: U.PALETTE.blue },
        { label: 'Hedged % (×100m litres, scale only)', data: rows.map(function (r) { return r['Hedged %'] * 100000000; }), color: U.PALETTE.teal }
      ]);
      var link = document.querySelector('[data-goto="simulator"]');
      if (link) link.addEventListener('click', function (e) { e.preventDefault(); WJ.app.goTo('simulator'); });
    },
    exportRows: function (ctx) {
      return [['Month', 'Fuel Price per Litre', 'Fuel Volume Litres', 'Hedged %', 'Fuel Cost (Finance)']].concat(
        (ctx.domains.fuel || []).filter(function (r) { return r.Month >= ctx.filters.from && r.Month <= ctx.filters.to; })
          .map(function (r) { return [r.Month, r['Fuel Price per Litre'], r['Fuel Volume Litres'], r['Hedged %'], ctx.domainValue('finance', 'Fuel Cost', r.Month)]; }));
    }
  };
})();
