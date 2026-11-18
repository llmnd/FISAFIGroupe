export type UnknownReason =
  | "not_fetched"
  | "not_recorded"
  | "not_authorized"
  | "unidentified"
  | "incomplete";

export type Observed<T> = {
  status: "observed";
  value: T;
  source: string;
  observedAt: string;
};

export type Estimated<T> = {
  status: "estimated";
  value: T;
  basis: string;
};

export type Unknown = {
  status: "unknown";
  reason: UnknownReason;
};

export type DataValue<T> = Observed<T> | Estimated<T> | Unknown;

export type OrderSource = "sale_order" | "pos_order";

export type HistoryPoint = {
  periodStart: string;
  confirmedOrders: number;
  confirmedRevenue: number;
  confirmedRevenueUntaxed: number | null;
};

export type ProductSnapshot = {
  productId: number;
  templateId: number | null;
  name: string;
  unitName: string | null;
  soldOrders: number;
  soldQuantity: number;
  soldRevenueTotal: number;
  soldRevenueUntaxed: number;
  currentSalePrice: DataValue<number>;
  currentUnitCost: DataValue<number>;
  currentAvailableStock: DataValue<number>;
};

export type SimulationSnapshot = {
  companyId: number;
  companyName: string;
  generatedAt: string;
  timezone: "UTC";
  currencyName: string | null;
  monthStart: string;
  actuals: {
    confirmedRevenue: number;
    confirmedRevenueUntaxed: number | null;
    confirmedOrders: number;
    identifiedCustomers: number;
    ordersWithoutCustomer: number;
    elapsedDays: number;
    remainingDays: number;
  };
  history: {
    monthly: HistoryPoint[];
    complete: boolean;
    from: string;
    toExclusive: string;
  };
  products: ProductSnapshot[];
  quality: {
    ordersComplete: boolean;
    currentMonthComplete: boolean;
    orderLinesComplete: boolean;
    productsComplete: boolean;
    customerCoverage: number;
    notes: string[];
  };
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isMetricValue(value: unknown): value is DataValue<number> {
  if (!value || typeof value !== "object" || !("status" in value)) return false;
  const metric = value as Partial<DataValue<number>>;
  if (metric.status === "unknown") {
    return metric.reason === "not_fetched" ||
      metric.reason === "not_recorded" ||
      metric.reason === "not_authorized" ||
      metric.reason === "unidentified" ||
      metric.reason === "incomplete";
  }
  if (metric.status === "estimated") {
    return isFiniteNumber(metric.value) && typeof metric.basis === "string";
  }
  return metric.status === "observed" &&
    isFiniteNumber(metric.value) &&
    typeof metric.source === "string" &&
    typeof metric.observedAt === "string";
}

export function isSimulationSnapshot(value: unknown): value is SimulationSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Partial<SimulationSnapshot>;
  const actuals = snapshot.actuals;
  const history = snapshot.history;
  const quality = snapshot.quality;
  if (
    !Number.isSafeInteger(snapshot.companyId) ||
    typeof snapshot.companyName !== "string" ||
    typeof snapshot.generatedAt !== "string" ||
    snapshot.timezone !== "UTC" ||
    (typeof snapshot.currencyName !== "string" && snapshot.currencyName !== null) ||
    typeof snapshot.monthStart !== "string" ||
    !actuals ||
    !isFiniteNumber(actuals.confirmedRevenue) ||
    (actuals.confirmedRevenueUntaxed !== null && !isFiniteNumber(actuals.confirmedRevenueUntaxed)) ||
    !isFiniteNumber(actuals.confirmedOrders) ||
    !isFiniteNumber(actuals.identifiedCustomers) ||
    !isFiniteNumber(actuals.ordersWithoutCustomer) ||
    !isFiniteNumber(actuals.elapsedDays) ||
    !isFiniteNumber(actuals.remainingDays) ||
    !history ||
    !Array.isArray(history.monthly) ||
    !history.monthly.every((point) =>
      typeof point.periodStart === "string" &&
      isFiniteNumber(point.confirmedOrders) &&
      isFiniteNumber(point.confirmedRevenue) &&
      (point.confirmedRevenueUntaxed === null || isFiniteNumber(point.confirmedRevenueUntaxed)),
    ) ||
    typeof history.complete !== "boolean" ||
    typeof history.from !== "string" ||
    typeof history.toExclusive !== "string" ||
    !Array.isArray(snapshot.products) ||
    !snapshot.products.every((product) =>
      Number.isSafeInteger(product.productId) &&
      (Number.isSafeInteger(product.templateId) || product.templateId === null) &&
      typeof product.name === "string" &&
      (typeof product.unitName === "string" || product.unitName === null) &&
      isFiniteNumber(product.soldOrders) &&
      isFiniteNumber(product.soldQuantity) &&
      isFiniteNumber(product.soldRevenueTotal) &&
      isFiniteNumber(product.soldRevenueUntaxed) &&
      isMetricValue(product.currentSalePrice) &&
      isMetricValue(product.currentUnitCost) &&
      isMetricValue(product.currentAvailableStock),
    ) ||
    !quality ||
    typeof quality.ordersComplete !== "boolean" ||
    typeof quality.currentMonthComplete !== "boolean" ||
    typeof quality.orderLinesComplete !== "boolean" ||
    typeof quality.productsComplete !== "boolean" ||
    !isFiniteNumber(quality.customerCoverage) ||
    !Array.isArray(quality.notes) ||
    !quality.notes.every((note) => typeof note === "string")
  ) {
    return false;
  }
  return true;
}

export type LegacySimulatorContext = {
  currentRevenue: number;
  currentOrders: number;
  elapsedDays: number;
  remainingDays: number;
  revenueGoal: number | null;
};

export type LegacySimulatorParams = {
  volume: number;
  basket: number;
  discount: number;
  start: number;
  elasticity: number;
  margin: number;
};

export type AudienceAction = {
  enabled: boolean;
  audience: string;
  disjointConfirmed: boolean;
};

export type CommercialInputs = {
  acquisition: AudienceAction & {
    prospects: number | null;
    conversionPercent: number | null;
    ordersPerCustomer: number | null;
    actionCost: number | null;
  };
  marketing: AudienceAction & {
    budget: number | null;
    costPerLead: number | null;
    conversionPercent: number | null;
    ordersPerCustomer: number | null;
  };
  retention: AudienceAction & {
    eligibleCustomers: number | null;
    returnRateLiftPercent: number | null;
    ordersPerReturningCustomer: number | null;
    actionCost: number | null;
  };
  promotion: AudienceAction & {
    eligibleOrders: number | null;
    incrementalOrders: number | null;
    discountPercent: number | null;
    actionCost: number | null;
  };
  upsell: AudienceAction & {
    eligibleOrders: number | null;
    uptakePercent: number | null;
    unitsPerAcceptedOrder: number | null;
    productId: number | null;
    actionCost: number | null;
  };
  scenarioRangePercent: number | null;
};

export type Metric = DataValue<number>;

export type CommercialActionResult = {
  id: keyof Omit<CommercialInputs, "scenarioRangePercent">;
  label: string;
  estimatedCustomers: Metric;
  estimatedOrders: Metric;
  estimatedUnits: Metric;
  potentialRevenue: Metric;
  stockConstrainedRevenue: Metric;
  grossMargin: Metric;
  actionCost: Metric;
  contribution: Metric;
  explanation: string[];
};

export type CommercialScenarioResult = {
  baselineRevenue: number;
  baselineOrders: number;
  actions: CommercialActionResult[];
  combined: {
    status: "available" | "blocked";
    reason: string | null;
    incrementalRevenue: Metric;
    stockConstrainedRevenue: Metric;
    incrementalOrders: Metric;
    incrementalUnits: Metric;
    incrementalCustomers: Metric;
    grossMargin: Metric;
    actionCosts: Metric;
    contribution: Metric;
    roiPercent: Metric;
  };
  range: {
    prudent: Metric;
    central: Metric;
    optimistic: Metric;
    note: string;
  };
};
