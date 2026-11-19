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
const {
  calculateBreakEven,
  getEstimatedExpensesAtRevenue,
  getEstimatedBalanceAfterExpenses,
  normalizeMonthlyExpenseList,
  summarizeMonthlyExpenses,
} = require("../lib/marketSimulation/expenses.ts");
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

test("monthly shop expenses stay incomplete until every amount is explicitly entered", () => {
  const partial = summarizeMonthlyExpenses([
    { id: "rent", label: "Loyer", amount: "250000", nature: "fixed", timing: "forecast" },
    { id: "wifi", label: "Internet", amount: "", nature: "fixed", timing: "forecast" },
  ]);
  assert.equal(partial.complete, false);
  assert.equal(partial.total, null);
  assert.equal(partial.enteredTotal, 250000);
  assert.equal(getEstimatedBalanceAfterExpenses(1000000, partial, 1000000, 1000000), null);

  const complete = summarizeMonthlyExpenses([
    { id: "rent", label: "Loyer", amount: "250000", nature: "fixed", timing: "forecast" },
    { id: "wifi", label: "Internet", amount: "0", nature: "fixed", timing: "forecast" },
    { id: "salary", label: "Salaires", amount: "400000", nature: "fixed", timing: "forecast" },
  ]);
  assert.equal(complete.complete, true);
  assert.equal(complete.total, 650000);
  assert.equal(getEstimatedBalanceAfterExpenses(1000000, complete, 1000000, 1000000), 350000);
});

test("monthly shop expenses reject negative, non-finite, and malformed saved values", () => {
  const negative = summarizeMonthlyExpenses([
    { id: "rent", label: "Loyer", amount: "-1", nature: "fixed", timing: "forecast" },
  ]);
  assert.equal(negative.complete, false);
  assert.equal(negative.invalid, true);
  assert.equal(negative.total, null);

  const legacy = normalizeMonthlyExpenseList([{ id: "rent", label: "Loyer", amount: 1000 }]);
  assert.deepEqual(legacy, [{
    id: "rent",
    label: "Loyer",
    amount: "1000",
    nature: "fixed",
    timing: "forecast",
  }]);
  assert.equal(normalizeMonthlyExpenseList([{ id: "rent", label: "Loyer", amount: {} }]), null);
  assert.equal(normalizeMonthlyExpenseList([
    { id: "rent", label: "Loyer", amount: "1000" },
    { id: "rent", label: "Autre", amount: "200" },
  ]), null);
});

test("planned variable expenses scale with revenue and break-even uses the margin after variable costs", () => {
  const expenses = summarizeMonthlyExpenses([
    { id: "already-paid", label: "Facture payée", amount: "1000", nature: "variable", timing: "incurred" },
    { id: "rent", label: "Loyer", amount: "500", nature: "fixed", timing: "forecast" },
    { id: "fees", label: "Commissions prévues", amount: "300", nature: "variable", timing: "forecast" },
  ]);

  assert.equal(expenses.complete, true);
  assert.equal(getEstimatedExpensesAtRevenue(expenses, 10000, 10000), 1800);
  assert.equal(getEstimatedExpensesAtRevenue(expenses, 12000, 10000), 1860);
  assert.equal(getEstimatedBalanceAfterExpenses(3000, expenses, 12000, 10000), 1140);

  const breakEven = calculateBreakEven(expenses, 25, 10000, 2000);
  assert.equal(breakEven.status, "available");
  if (breakEven.status === "available") {
    assert.equal(breakEven.orders, 4);
    assert.equal(Math.round(breakEven.revenue), 6818);
  }
  assert.deepEqual(calculateBreakEven(expenses, 2, 10000, 2000), {
    status: "impossible",
    variableCostRate: 0.03,
  });
  assert.deepEqual(calculateBreakEven(expenses, 25, 0, 2000), { status: "unknown" });
});

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

test("month-to-date compares the same calendar days in the previous month", async () => {
  requestAccount = { role: "admin", employeeRole: null };
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const previousMonthDays = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0)).getUTCDate();
  const currentDays = now.getUTCDate();
  const comparedDays = Math.min(currentDays, previousMonthDays);
  const addDays = (date, days) => new Date(date.getTime() + days * 86_400_000);
  const toOdooDate = (date) => date.toISOString().replace("T", " ").slice(0, 19);
  const orders = [
    {
      id: 501,
      name: "Current period",
      state: "sale",
      amount_total: 100,
      date_order: toOdooDate(currentMonthStart),
      partner_id: false,
      user_id: false,
      invoice_status: "invoiced",
      order_line: [],
    },
    {
      id: 504,
      name: "Last current calendar day",
      state: "sale",
      amount_total: 10,
      date_order: toOdooDate(addDays(currentMonthStart, currentDays - 1)),
      partner_id: false,
      user_id: false,
      invoice_status: "invoiced",
      order_line: [],
    },
    {
      id: 502,
      name: "Previous matching period",
      state: "sale",
      amount_total: 20,
      date_order: toOdooDate(addDays(previousMonthStart, comparedDays - 1)),
      partner_id: false,
      user_id: false,
      invoice_status: "invoiced",
      order_line: [],
    },
    {
      id: 503,
      name: "Outside previous matching period",
      state: "sale",
      amount_total: 999,
      date_order: toOdooDate(addDays(previousMonthStart, comparedDays)),
      partner_id: false,
      user_id: false,
      invoice_status: "invoiced",
      order_line: [],
    },
  ];
  marketStatsCallOdoo = async (model, method, parameters) => {
    if (model === "res.company") return [{ id: 42, name: "FiSAFi Market" }];
    if (model !== "sale.order") return [];
    const start = parameters.domain.find(([field, operator]) => field === "date_order" && operator === ">=");
    const end = parameters.domain.find(([field, operator]) => field === "date_order" && operator === "<");
    return orders.filter((order) => {
      const timestamp = new Date(`${order.date_order.replace(" ", "T")}Z`).getTime();
      return (!start || timestamp >= new Date(`${start[2].replace(" ", "T")}Z`).getTime()) &&
        (!end || timestamp < new Date(`${end[2].replace(" ", "T")}Z`).getTime());
    });
  };

  const response = createResponse();
  await marketStatsHandler(
    {
      method: "GET",
      query: { companyId: "42", period: "month-to-date", summaryOnly: "1" },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.range.key, "month-to-date");
  assert.equal(response.body.range.from, currentMonthStart.toISOString().slice(0, 10));
  assert.equal(response.body.range.to, addDays(currentMonthStart, currentDays - 1).toISOString().slice(0, 10));
  assert.equal(response.body.range.comparisonFrom, previousMonthStart.toISOString().slice(0, 10));
  assert.equal(response.body.range.comparisonTo, addDays(previousMonthStart, comparedDays - 1).toISOString().slice(0, 10));
  assert.equal(response.body.period.confirmedRevenue, 110);
  assert.equal(response.body.period.previousConfirmedRevenue, 20);
  assert.equal(response.body.period.previousConfirmedOrders, 1);
  assert.equal(response.body.daily.length, currentDays);
  assert.equal(response.body.daily[currentDays - 1].comparisonAvailable, currentDays <= previousMonthDays);
});

test("custom dates compare matching dates and distinguish transactions from confirmed sales", async () => {
  requestAccount = { role: "admin", employeeRole: null };
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const selectedFrom = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    Math.max(1, today.getUTCDate() - 10),
  ));
  const previousMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const previousMonthDays = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0)).getUTCDate();
  const previousFrom = new Date(Date.UTC(
    previousMonthStart.getUTCFullYear(),
    previousMonthStart.getUTCMonth(),
    Math.min(selectedFrom.getUTCDate(), previousMonthDays),
  ));
  const previousTo = new Date(Date.UTC(
    previousMonthStart.getUTCFullYear(),
    previousMonthStart.getUTCMonth(),
    Math.min(today.getUTCDate(), previousMonthDays),
  ));
  const previousEndExclusive = new Date(previousTo.getTime() + 86_400_000);
  const toOdooDate = (date) => date.toISOString().replace("T", " ").slice(0, 19);
  const orders = [
    {
      id: 601,
      name: "Custom current range",
      state: "sale",
      amount_total: 100,
      date_order: toOdooDate(selectedFrom),
      partner_id: false,
      user_id: false,
      invoice_status: "invoiced",
      order_line: [],
    },
    {
      id: 602,
      name: "Matching prior-month range",
      state: "sale",
      amount_total: 20,
      date_order: toOdooDate(previousFrom),
      partner_id: false,
      user_id: false,
      invoice_status: "invoiced",
      order_line: [],
    },
    {
      id: 604,
      name: "Current draft",
      state: "draft",
      amount_total: 5,
      date_order: toOdooDate(selectedFrom),
      partner_id: false,
      user_id: false,
      invoice_status: "no",
      order_line: [],
    },
    {
      id: 605,
      name: "Current sent quotation",
      state: "sent",
      amount_total: 6,
      date_order: toOdooDate(selectedFrom),
      partner_id: false,
      user_id: false,
      invoice_status: "no",
      order_line: [],
    },
    {
      id: 606,
      name: "Second prior confirmed sale",
      state: "sale",
      amount_total: 30,
      date_order: toOdooDate(previousFrom),
      partner_id: false,
      user_id: false,
      invoice_status: "invoiced",
      order_line: [],
    },
    {
      id: 603,
      name: "Outside matching prior-month range",
      state: "sale",
      amount_total: 999,
      date_order: toOdooDate(previousEndExclusive),
      partner_id: false,
      user_id: false,
      invoice_status: "invoiced",
      order_line: [],
    },
  ];
  marketStatsCallOdoo = async (model, method, parameters) => {
    if (model === "res.company") return [{ id: 42, name: "FiSAFi Market" }];
    if (model !== "sale.order") return [];
    const start = parameters.domain.find(([field, operator]) => field === "date_order" && operator === ">=");
    const end = parameters.domain.find(([field, operator]) => field === "date_order" && operator === "<");
    return orders.filter((order) => {
      const timestamp = new Date(`${order.date_order.replace(" ", "T")}Z`).getTime();
      return (!start || timestamp >= new Date(`${start[2].replace(" ", "T")}Z`).getTime()) &&
        (!end || timestamp < new Date(`${end[2].replace(" ", "T")}Z`).getTime());
    });
  };

  const response = createResponse();
  await marketStatsHandler(
    {
      method: "GET",
      query: {
        companyId: "42",
        period: "custom",
        from: selectedFrom.toISOString().slice(0, 10),
        to: today.toISOString().slice(0, 10),
        summaryOnly: "1",
      },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.range.from, selectedFrom.toISOString().slice(0, 10));
  assert.equal(response.body.range.to, today.toISOString().slice(0, 10));
  assert.equal(response.body.range.comparisonFrom, previousFrom.toISOString().slice(0, 10));
  assert.equal(response.body.range.comparisonTo, previousTo.toISOString().slice(0, 10));
  assert.equal(response.body.period.orders, 3);
  assert.equal(response.body.period.previousOrders, 2);
  assert.equal(response.body.period.confirmedOrders, 1);
  assert.equal(response.body.period.previousConfirmedOrders, 2);
  assert.equal(response.body.period.confirmedRevenue, 100);
  assert.equal(response.body.period.previousConfirmedRevenue, 50);
  assert.equal(response.body.period.averageConfirmedOrder, 100);
  assert.equal(response.body.period.previousAverageConfirmedOrder, 25);
});
