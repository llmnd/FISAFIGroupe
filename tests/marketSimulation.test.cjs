const assert = require("node:assert/strict");
const { test } = require("node:test");
const Module = require("node:module");

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "CommonJS",
    moduleResolution: "Node",
  },
});

const { simulateCommercial, simulateLegacy } = require("../lib/marketSimulation/engine.ts");
let requestAccount = { role: "seller", employeeRole: "seller" };
let returnedSnapshot = { companyId: 42, companyName: "FiSAFi Market" };
let requestedCompanyId = null;
let marketStatsOdooCalls = [];
let marketStatsOdooRequests = [];
let marketStatsCallOdoo = async () => [];
const originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "@/lib/authCookie") {
    return { getRequestAuthorization: () => null };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const employeeAuth = require("../lib/employeeAuth.ts");
Module._load = function (request, parent, isMain) {
  if (request === "@/lib/employeeAuth") {
    return {
      ...employeeAuth,
      authenticateEmployee: async () => requestAccount,
    };
  }
  if (request === "@/lib/odooCompanies") {
    return { listFiSafiCompanies: async () => [{ id: 42, name: "FiSAFi Market", type: "market" }] };
  }
  if (request === "@/lib/marketOdoo") {
    return {
      callOdoo: (...args) => marketStatsCallOdoo(...args),
      OdooApiError: class OdooApiError extends Error {
        constructor(message, statusCode = 502) {
          super(message);
          this.statusCode = statusCode;
        }
      },
    };
  }
  if (request === "@/lib/marketSimulation/odooSnapshot") {
    return {
      getMarketSimulationSnapshot: async (companyId) => {
        requestedCompanyId = companyId;
        return returnedSnapshot;
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};
const marketSimulationHandler = require("../pages/api/admin/market-simulation.ts").default;
const marketStatsHandler = require("../pages/api/admin/market-stats.ts").default;

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function observed(value, source) {
  return { status: "observed", value, source, observedAt: "2025-01-01T00:00:00.000Z" };
}

function createSnapshot() {
  const monthly = Array.from({ length: 12 }, (_, index) => ({
    periodStart: `2024-${String(index + 1).padStart(2, "0")}-01`,
    confirmedOrders: index === 11 ? 1 : 0,
    confirmedRevenue: index === 11 ? 10000 : 0,
    confirmedRevenueUntaxed: index === 11 ? 10000 : 0,
  }));
  return {
    companyId: 1,
    companyName: "FiSAFi Market",
    generatedAt: "2025-01-01T00:00:00.000Z",
    timezone: "UTC",
    currencyName: "FCFA",
    monthStart: "2025-01-01",
    actuals: {
      confirmedRevenue: 10000,
      confirmedRevenueUntaxed: 10000,
      confirmedOrders: 1,
      identifiedCustomers: 1,
      ordersWithoutCustomer: 0,
      elapsedDays: 1,
      remainingDays: 30,
    },
    history: {
      monthly,
      complete: true,
      from: "2024-02-01",
      toExclusive: "2025-02-01",
    },
    products: [{
      productId: 12,
      templateId: 4,
      name: "Produit vendu",
      unitName: "Unité",
      soldOrders: 1,
      soldQuantity: 2,
      soldRevenueTotal: 10000,
      soldRevenueUntaxed: 10000,
      currentSalePrice: observed(5000, "Prix courant"),
      currentUnitCost: observed(30, "Coût courant"),
      currentAvailableStock: observed(1, "Stock courant"),
    }],
    quality: {
      ordersComplete: true,
      currentMonthComplete: true,
      orderLinesComplete: true,
      productsComplete: true,
      customerCoverage: 1,
      notes: [],
    },
  };
}

function emptyInputs() {
  const audience = () => ({ enabled: false, audience: "", disjointConfirmed: false });
  return {
    acquisition: { ...audience(), prospects: null, conversionPercent: null, ordersPerCustomer: null, actionCost: null },
    marketing: { ...audience(), budget: null, costPerLead: null, conversionPercent: null, ordersPerCustomer: null },
    retention: { ...audience(), eligibleCustomers: null, returnRateLiftPercent: null, ordersPerReturningCustomer: null, actionCost: null },
    promotion: { ...audience(), eligibleOrders: null, incrementalOrders: null, discountPercent: null, actionCost: null },
    upsell: { ...audience(), eligibleOrders: null, uptakePercent: null, unitsPerAcceptedOrder: null, productId: null, actionCost: null },
    scenarioRangePercent: null,
  };
}

test("legacy projection preserves the existing formulas", () => {
  const result = simulateLegacy(
    { currentRevenue: 5000, currentOrders: 5, elapsedDays: 5, remainingDays: 5, revenueGoal: null },
    { volume: 10, basket: 10, discount: 5, start: 1, elasticity: 1, margin: 25 },
  );
  assert.equal(result.baselineRevenue, 10000);
  assert.equal(result.scenarioRevenue, 10807);
  assert.equal(result.baselineOrders, 10);
  assert.equal(result.scenarioOrders, 10.6);
  assert.equal(result.baselineProfit, 2500);
  assert.equal(result.scenarioProfit, 2512);
  assert.ok(Math.abs(result.low - 9979.5025) < 1e-9);
  assert.ok(Math.abs(result.high - 11634.4975) < 1e-9);
});

test("marketing forecasts expected orders and limits the individual result to real stock", () => {
  const inputs = emptyInputs();
  inputs.marketing = {
    ...inputs.marketing,
    enabled: true,
    audience: "Nouveaux prospects",
    budget: 1000,
    costPerLead: 100,
    conversionPercent: 20,
    ordersPerCustomer: 1.5,
  };

  const result = simulateCommercial(createSnapshot(), inputs);
  const marketing = result.actions.find((action) => action.id === "marketing");
  assert.equal(marketing.estimatedCustomers.value, 2);
  assert.equal(marketing.estimatedOrders.value, 3);
  assert.equal(marketing.estimatedUnits.value, 6);
  assert.equal(marketing.potentialRevenue.value, 30000);
  assert.equal(marketing.stockConstrainedRevenue.value, 5000);
  assert.equal(marketing.grossMargin.value, 29820);
  assert.equal(marketing.contribution.value, 28820);
  assert.equal(result.combined.incrementalRevenue.value, 30000);
  assert.equal(result.combined.stockConstrainedRevenue.value, 5000);
  assert.equal(result.combined.grossMargin.value, 4970);
  assert.equal(result.combined.contribution.value, 3970);
});

test("unknown cost keeps margin and contribution unknown rather than zero", () => {
  const snapshot = createSnapshot();
  snapshot.products[0].currentUnitCost = { status: "unknown", reason: "not_recorded" };
  const inputs = emptyInputs();
  inputs.acquisition = {
    ...inputs.acquisition,
    enabled: true,
    prospects: 10,
    conversionPercent: 20,
    ordersPerCustomer: 1,
    actionCost: 0,
  };

  const result = simulateCommercial(snapshot, inputs);
  const acquisition = result.actions.find((action) => action.id === "acquisition");
  assert.equal(acquisition.potentialRevenue.value, 20000);
  assert.equal(acquisition.grossMargin.status, "unknown");
  assert.equal(acquisition.contribution.status, "unknown");
  assert.equal(result.combined.stockConstrainedRevenue.value, 5000);
  assert.equal(result.combined.grossMargin.status, "unknown");
});

test("unknown stock preserves potential revenue but withholds stock-limited margin", () => {
  const snapshot = createSnapshot();
  snapshot.products[0].currentAvailableStock = { status: "unknown", reason: "not_recorded" };
  const inputs = emptyInputs();
  inputs.acquisition = {
    ...inputs.acquisition,
    enabled: true,
    prospects: 1,
    conversionPercent: 100,
    ordersPerCustomer: 1,
    actionCost: 0,
  };

  const result = simulateCommercial(snapshot, inputs);
  assert.equal(result.combined.incrementalRevenue.value, 10000);
  assert.equal(result.combined.stockConstrainedRevenue.status, "unknown");
  assert.equal(result.combined.grossMargin.status, "unknown");
});

test("historical basket is used instead of an incomplete current month", () => {
  const snapshot = createSnapshot();
  snapshot.actuals.confirmedRevenue = 20000;
  snapshot.actuals.confirmedRevenueUntaxed = 20000;
  snapshot.quality.currentMonthComplete = false;
  snapshot.history.complete = false;
  const inputs = emptyInputs();
  inputs.marketing = {
    ...inputs.marketing,
    enabled: true,
    audience: "Nouveaux prospects",
    budget: 1000,
    costPerLead: 100,
    conversionPercent: 20,
    ordersPerCustomer: 1.5,
  };

  const result = simulateCommercial(snapshot, inputs);
  const marketing = result.actions.find((action) => action.id === "marketing");
  assert.equal(marketing.potentialRevenue.value, 30000);
  assert.match(marketing.potentialRevenue.basis, /historique partiel/i);
});

test("combined actions consume shared stock only once", () => {
  const inputs = emptyInputs();
  inputs.acquisition = {
    ...inputs.acquisition,
    enabled: true,
    audience: "Nouveaux clients",
    disjointConfirmed: true,
    prospects: 1,
    conversionPercent: 100,
    ordersPerCustomer: 1,
    actionCost: 0,
  };
  inputs.marketing = {
    ...inputs.marketing,
    enabled: true,
    audience: "Audience publicitaire distincte",
    disjointConfirmed: true,
    budget: 100,
    costPerLead: 100,
    conversionPercent: 100,
    ordersPerCustomer: 1,
  };

  const result = simulateCommercial(createSnapshot(), inputs);
  assert.equal(result.combined.status, "available");
  assert.equal(result.combined.incrementalOrders.value, 2);
  assert.equal(result.combined.incrementalRevenue.value, 20000);
  assert.equal(result.combined.stockConstrainedRevenue.value, 5000);
});

test("upsell uses an observed historical selling price and limits units to current stock", () => {
  const snapshot = createSnapshot();
  snapshot.products[0].currentSalePrice = observed(6000, "Prix catalogue courant");
  const inputs = emptyInputs();
  inputs.upsell = {
    ...inputs.upsell,
    enabled: true,
    audience: "Commandes en cours",
    eligibleOrders: 2,
    uptakePercent: 50,
    unitsPerAcceptedOrder: 1,
    productId: 12,
    actionCost: 0,
  };

  const result = simulateCommercial(snapshot, inputs);
  const upsell = result.actions.find((action) => action.id === "upsell");
  assert.equal(upsell.estimatedUnits.value, 1);
  assert.equal(upsell.potentialRevenue.value, 5000);
  assert.equal(upsell.stockConstrainedRevenue.value, 5000);
  assert.match(upsell.potentialRevenue.basis, /réellement vendu/i);
});

test("one action can run without an audience label; overlapping combined audiences are blocked", () => {
  const snapshot = createSnapshot();
  const inputs = emptyInputs();
  inputs.acquisition = {
    ...inputs.acquisition,
    enabled: true,
    prospects: 1,
    conversionPercent: 100,
    ordersPerCustomer: 1,
    actionCost: 0,
  };
  assert.equal(simulateCommercial(snapshot, inputs).combined.status, "available");

  inputs.marketing = {
    ...inputs.marketing,
    enabled: true,
    budget: 1,
    costPerLead: 1,
    conversionPercent: 100,
    ordersPerCustomer: 1,
  };
  inputs.acquisition.audience = "Même audience";
  inputs.marketing.audience = "même audience";
  inputs.acquisition.disjointConfirmed = true;
  inputs.marketing.disjointConfirmed = true;
  const combined = simulateCommercial(snapshot, inputs).combined;
  assert.equal(combined.status, "blocked");
  assert.equal(combined.incrementalRevenue.status, "unknown");

  inputs.marketing.audience = "Autre audience";
  inputs.acquisition.disjointConfirmed = false;
  inputs.marketing.disjointConfirmed = false;
  assert.equal(simulateCommercial(snapshot, inputs).combined.status, "blocked");
});

test("simulation endpoint requires admin permission and an allowed company", async () => {
  requestAccount = { role: "seller", employeeRole: "seller" };
  const forbidden = createResponse();
  await marketSimulationHandler(
    { method: "GET", query: { companyId: "42" } },
    forbidden,
  );
  assert.equal(forbidden.statusCode, 403);

  requestAccount = { role: "admin", employeeRole: null };
  const foreignCompany = createResponse();
  await marketSimulationHandler(
    { method: "GET", query: { companyId: "7" } },
    foreignCompany,
  );
  assert.equal(foreignCompany.statusCode, 403);
  assert.equal(requestedCompanyId, null);

  const allowed = createResponse();
  await marketSimulationHandler(
    { method: "GET", query: { companyId: "42" } },
    allowed,
  );
  assert.equal(allowed.statusCode, 200);
  assert.equal(requestedCompanyId, 42);
  assert.equal(allowed.body, returnedSnapshot);
});

test("market history pagination can load without rebuilding the sales summary", async () => {
  requestAccount = { role: "admin", employeeRole: null };
  marketStatsOdooCalls = [];
  marketStatsCallOdoo = async (model) => {
    marketStatsOdooCalls.push(model);
    if (model === "res.company") return [{ id: 42, name: "FiSAFi Market" }];
    return [];
  };

  const response = createResponse();
  await marketStatsHandler(
    {
      method: "GET",
      query: {
        companyId: "42",
        period: "30d",
        historyOnly: "1",
        saleOffset: "0",
        posOffset: "0",
      },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, {
    transactions: [],
    hasMore: false,
    nextCursor: null,
  });
  assert.deepEqual(marketStatsOdooCalls, ["res.company", "sale.order", "pos.order"]);
});

test("market summary omits history-page queries and avoids loading old order lines", async () => {
  requestAccount = { role: "admin", employeeRole: null };
  marketStatsOdooCalls = [];
  marketStatsOdooRequests = [];
  marketStatsCallOdoo = async (model, method, parameters) => {
    marketStatsOdooCalls.push(model);
    marketStatsOdooRequests.push({ model, method, parameters });
    if (model === "res.company") return [{ id: 42, name: "FiSAFi Market" }];
    return [];
  };

  const response = createResponse();
  await marketStatsHandler(
    {
      method: "GET",
      query: { companyId: "42", period: "30d", summaryOnly: "1" },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(marketStatsOdooCalls, [
    "res.company",
    "sale.order",
    "pos.order",
    "sale.order",
    "pos.order",
  ]);
  assert.equal(response.body.transactions.length, 0);
  const salesHistoryRequest = marketStatsOdooRequests.find(
    (request) => request.model === "sale.order" && !request.parameters.fields.includes("order_line"),
  );
  const salesBreakdownRequest = marketStatsOdooRequests.find(
    (request) => request.model === "sale.order" && request.parameters.fields.includes("order_line"),
  );
  assert.ok(salesHistoryRequest);
  assert.ok(salesBreakdownRequest);
  assert.ok(
    salesBreakdownRequest.parameters.domain.some(
      ([field, operator]) => field === "date_order" && operator === "<",
    ),
  );
});
