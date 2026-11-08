/* dashboards/network.js — Network / Route Profitability (Domain 11).
 * Route ranking by Route Profitability, then Route Revenue; scatter of
 * revenue vs cost; contribution. Route Load Factor is not computable
 * (no ASM/RPM on Network_Routes) and is not shown. */
(function () {
  'use strict';
  var WJ = window.WJ; WJ.pages = WJ.pages || {};
  var U = WJ.ui;
  WJ.pages.network = {
    title: 'Network / Route Profitability',
    subtitle: 'Route ranking, profitability and contribution',
    render: function (ctx) {
      var routes = ctx.routeAggregates;
      var totalProfit = routes.reduce(function (s, r) { return s + r.Route_Profit; }, 0);
      var totalRev = routes.reduce(function (s, r) { return s + r.Route_Revenue; }, 0);
      var top = routes[0];
      var cards = '<article class="kpi-card" data-category="Network"><h3>Top route by profit</h3><div class="kpi-value">' + U.esc(top ? top.Route : 'n/a') + '</div><div class="kpi-meta"><span>Profit: ' + U.fmtMoney(top ? top.Route_Profit : null) + '</span></div></article>' +
        '<article class="kpi-card" data-category="Network"><h3>Total route profit (period)</h3><div class="kpi-value">' + U.fmtMoney(totalProfit) + '</div><div class="kpi-meta"><span>Routes: ' + routes.length + '</span><span>Total route revenue: ' + U.fmtMoney(totalRev) + '</span></div></article>';
      return '<div class="kpi-grid">' + cards + '</div>' +
        '<p class="panel-note">Ranking: Route Profitability (Route Revenue − Route Cost), then Route Revenue. Route filter: <strong>' + U.esc(ctx.filters.route) + '</strong>. Route Load Factor is not computable — Network_Routes carries no ASM/RPM columns.</p>' +
        '<div class="chart-grid">' +
        U.section('Route profit ranking', '<div class="chart-box"><canvas id="net-profit"></canvas></div>') +
        U.section('Route profitability — revenue vs cost (scatter)', '<div class="chart-box"><canvas id="net-scatter"></canvas></div><p class="panel-note">Each point is a route; the diagonal is break-even (revenue = cost).</p>') +
        '</div>' +
        U.section('Route ranking', U.tableHTML(['Rank', 'Route', 'Flights', 'Passengers', 'Route Revenue', 'Route Cost', 'Route Profit', 'Margin', 'Revenue / Flight', 'Cost / Flight', 'Contribution to profit'],
          routes.map(function (r, i) { return [i + 1, U.esc(r.Route), U.fmtNum(r.Flights), U.fmtNum(r.Passengers), U.fmtMoneyFull(r.Route_Revenue), U.fmtMoneyFull(r.Route_Cost), U.fmtMoneyFull(r.Route_Profit), U.fmtPct(r.Margin), U.fmtMoneyFull(r.Revenue_per_Flight), U.fmtMoneyFull(r.Cost_per_Flight), U.fmtPct(totalProfit ? r.Route_Profit / totalProfit : null)]; })));
    },
    mount: function (ctx) {
      var routes = ctx.routeAggregates;
      U.barChart('net-profit', routes.map(function (r) { return r.Route; }), [
        { label: 'Route Profit', data: routes.map(function (r) { return r.Route_Profit; }), color: U.PALETTE.navy }
      ]);
      U.scatterChart('net-scatter', routes.map(function (r) { return { x: r.Route_Cost, y: r.Route_Revenue }; }), { label: 'Routes' });
    },
    exportRows: function (ctx) {
      return [['Route', 'Flights', 'Passengers', 'Route Revenue', 'Route Cost', 'Route Profit', 'Revenue per Flight', 'Cost per Flight']].concat(
        ctx.routeAggregates.map(function (r) { return [r.Route, r.Flights, r.Passengers, r.Route_Revenue, r.Route_Cost, r.Route_Profit, r.Revenue_per_Flight, r.Cost_per_Flight]; }));
    }
  };
})();
