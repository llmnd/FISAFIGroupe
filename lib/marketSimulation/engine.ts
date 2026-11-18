import type {
  CommercialActionResult,
  CommercialInputs,
  CommercialScenarioResult,
  DataValue,
  LegacySimulatorContext,
  LegacySimulatorParams,
  Metric,
  SimulationSnapshot,
} from "./contracts";

const unknown = (reason: "not_fetched" | "not_recorded" | "not_authorized" | "unidentified" | "incomplete"): Metric => ({
  status: "unknown",
  reason,
});

const estimate = (value: number, basis: string): Metric => ({
  status: "estimated",
  value,
  basis,
});

function isPresent(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

function getValue(value: DataValue<number>): number | null {
  return value.status === "unknown" ? null : value.value;
}

function addMetrics(values: Metric[], basis: string): Metric {
  if (values.some((value) => value.status === "unknown")) {
    return unknown("incomplete");
  }
  return estimate(
    values.reduce((sum, value) => sum + (value.status === "unknown" ? 0 : value.value), 0),
    basis,
  );
}

type AverageValue = { value: number; basis: string };

function getAverageOrderValue(snapshot: SimulationSnapshot): AverageValue | null {
  const { confirmedRevenue, confirmedOrders } = snapshot.actuals;
  if (snapshot.quality.currentMonthComplete && confirmedOrders > 0) {
    return {
      value: confirmedRevenue / confirmedOrders,
      basis: "Panier moyen observé sur les commandes confirmées du mois en cours",
    };
  }
  const historicalOrders = snapshot.history.monthly.reduce(
    (sum, point) => sum + point.confirmedOrders,
    0,
  );
  const historicalRevenue = snapshot.history.monthly.reduce(
    (sum, point) => sum + point.confirmedRevenue,
    0,
  );
  return historicalOrders > 0
    ? {
        value: historicalRevenue / historicalOrders,
        basis: `Panier moyen historique sur ${snapshot.history.complete ? "12 mois complets" : "un historique partiel"}`,
      }
    : null;
}

function getAverageUntaxedOrderValue(snapshot: SimulationSnapshot): AverageValue | null {
  const { confirmedRevenueUntaxed, confirmedOrders } = snapshot.actuals;
  if (snapshot.quality.currentMonthComplete && confirmedOrders > 0 && confirmedRevenueUntaxed !== null) {
    return {
      value: confirmedRevenueUntaxed / confirmedOrders,
      basis: "Panier HT observé sur les commandes confirmées du mois en cours",
    };
  }
  const history = snapshot.history.monthly.filter(
    (point) => point.confirmedRevenueUntaxed !== null,
  );
  const historicalOrders = history.reduce((sum, point) => sum + point.confirmedOrders, 0);
  const historicalRevenue = history.reduce(
    (sum, point) => sum + (point.confirmedRevenueUntaxed ?? 0),
    0,
  );
  return historicalOrders > 0
    ? {
        value: historicalRevenue / historicalOrders,
        basis: `Panier HT historique sur ${snapshot.history.complete ? "12 mois complets" : "un historique partiel"}`,
      }
    : null;
}

function getEstimatedGrossMarginPerOrder(snapshot: SimulationSnapshot): number | null {
  const historicalOrders = snapshot.history.monthly.reduce(
    (sum, point) => sum + point.confirmedOrders,
    0,
  );
  if (!snapshot.quality.orderLinesComplete || !snapshot.quality.productsComplete || historicalOrders <= 0) {
    return null;
  }

  let margin = 0;
  let hasSales = false;
  for (const product of snapshot.products) {
    if (product.soldQuantity <= 0) continue;
    const cost = getValue(product.currentUnitCost);
    if (cost === null) return null;
    hasSales = true;
    margin += product.soldRevenueUntaxed - product.soldQuantity * cost;
  }
  return hasSales ? margin / historicalOrders : null;
}

function getEstimatedUnits(snapshot: SimulationSnapshot, additionalOrders: number): Metric {
  if (additionalOrders === 0) {
    return estimate(0, "Aucune commande supplémentaire estimée");
  }
  const historicalOrders = snapshot.history.monthly.reduce(
    (sum, point) => sum + point.confirmedOrders,
    0,
  );
  if (
    !snapshot.quality.orderLinesComplete ||
    !snapshot.quality.productsComplete ||
    historicalOrders <= 0 ||
    snapshot.products.some((product) => product.soldQuantity < 0)
  ) {
    return unknown("incomplete");
  }
  const historicalUnits = snapshot.products.reduce(
    (sum, product) => sum + product.soldQuantity,
    0,
  );
  return estimate(
    additionalOrders * historicalUnits / historicalOrders,
    "Commandes supplémentaires × unités moyennes par commande sur le mix historique",
  );
}

function getStockConstrainedRevenue(
  snapshot: SimulationSnapshot,
  additionalOrders: number,
): Metric {
  if (additionalOrders === 0) {
    return estimate(0, "Aucune commande supplémentaire : aucun stock à mobiliser");
  }
  const historicalOrders = snapshot.history.monthly.reduce(
    (sum, point) => sum + point.confirmedOrders,
    0,
  );
  if (
    !snapshot.quality.orderLinesComplete ||
    !snapshot.quality.productsComplete ||
    historicalOrders <= 0
  ) {
    return unknown("incomplete");
  }

  let revenue = 0;
  let hasDemand = false;
  for (const product of snapshot.products) {
    if (product.soldQuantity <= 0) continue;
    const stock = getValue(product.currentAvailableStock);
    if (stock === null) return unknown("not_recorded");
    hasDemand = true;
    const unitsPerOrder = product.soldQuantity / historicalOrders;
    const expectedUnits = additionalOrders * unitsPerOrder;
    const fulfilledUnits = Math.min(expectedUnits, Math.max(stock, 0));
    const revenuePerUnit = product.soldRevenueTotal / product.soldQuantity;
    revenue += fulfilledUnits * revenuePerUnit;
  }
  return hasDemand
    ? estimate(revenue, "Mix historique de produits limité au stock disponible actuel")
    : unknown("incomplete");
}

function getCombinedStockResult(
  snapshot: SimulationSnapshot,
  inputs: CommercialInputs,
  actions: CommercialActionResult[],
): { revenue: Metric; grossMargin: Metric } {
  const orderActions = actions.filter((action) => action.id !== "upsell");
  if (orderActions.some((action) => action.estimatedOrders.status === "unknown")) {
    return { revenue: unknown("incomplete"), grossMargin: unknown("incomplete") };
  }
  const additionalOrders = orderActions.reduce(
    (sum, action) => sum + (action.estimatedOrders.status === "unknown" ? 0 : action.estimatedOrders.value),
    0,
  );
  const promotionOrders = inputs.promotion.enabled
    ? inputs.promotion.incrementalOrders ?? 0
    : 0;
  const regularOrders = Math.max(additionalOrders - promotionOrders, 0);
  const discount = inputs.promotion.enabled
    ? (inputs.promotion.discountPercent ?? 0) / 100
    : 0;
  const promotionEligibleOrders = inputs.promotion.enabled
    ? inputs.promotion.eligibleOrders
    : 0;
  const averageOrderValue = getAverageOrderValue(snapshot);
  const averageUntaxedOrderValue = getAverageUntaxedOrderValue(snapshot);
  if (
    inputs.promotion.enabled &&
    (promotionEligibleOrders === null || averageOrderValue === null || averageUntaxedOrderValue === null)
  ) {
    return { revenue: unknown("incomplete"), grossMargin: unknown("incomplete") };
  }

  const upsell = inputs.upsell;
  let upsellUnits = 0;
  let upsellProductId: number | null = null;
  if (upsell.enabled) {
    if (
      !isPresent(upsell.eligibleOrders) ||
      !isPresent(upsell.uptakePercent) ||
      !isPresent(upsell.unitsPerAcceptedOrder) ||
      upsell.productId === null
    ) {
      return { revenue: unknown("incomplete"), grossMargin: unknown("incomplete") };
    }
    upsellProductId = upsell.productId;
    upsellUnits = upsell.eligibleOrders * upsell.uptakePercent / 100 * upsell.unitsPerAcceptedOrder;
  }

  const historicalOrders = snapshot.history.monthly.reduce(
    (sum, point) => sum + point.confirmedOrders,
    0,
  );
  if (additionalOrders > 0 && (
    !snapshot.quality.orderLinesComplete ||
    !snapshot.quality.productsComplete ||
    historicalOrders <= 0
  )) {
    return { revenue: unknown("incomplete"), grossMargin: unknown("incomplete") };
  }

  let constrainedRevenue = 0;
  let grossMargin = 0;
  let hasDemand = false;
  let grossMarginComplete = true;
  const upsellProduct = upsellProductId === null
    ? null
    : snapshot.products.find((product) => product.productId === upsellProductId) ?? null;
  if (upsell.enabled && !upsellProduct) {
    return { revenue: unknown("not_fetched"), grossMargin: unknown("not_fetched") };
  }

  for (const product of snapshot.products) {
    const unitsPerOrder = historicalOrders > 0 && product.soldQuantity > 0
      ? product.soldQuantity / historicalOrders
      : 0;
    const regularUnits = regularOrders * unitsPerOrder;
    const discountedUnits = promotionOrders * unitsPerOrder;
    const actionUnits = product.productId === upsellProductId ? upsellUnits : 0;
    const demand = regularUnits + discountedUnits + actionUnits;
    if (demand <= 0) continue;

    const stock = getValue(product.currentAvailableStock);
    const cost = getValue(product.currentUnitCost);
    if (stock === null || product.soldQuantity <= 0) {
      return {
        revenue: unknown(stock === null ? "not_recorded" : "incomplete"),
        grossMargin: unknown(stock === null ? "not_recorded" : "incomplete"),
      };
    }
    if (cost === null) grossMarginComplete = false;
    const revenuePerHistoricalUnit = product.soldRevenueTotal / product.soldQuantity;
    const untaxedRevenuePerHistoricalUnit = product.soldRevenueUntaxed / product.soldQuantity;
    const fulfillmentRatio = Math.min(1, Math.max(stock, 0) / demand);
    constrainedRevenue += fulfillmentRatio * (
      regularUnits * revenuePerHistoricalUnit +
      discountedUnits * revenuePerHistoricalUnit * (1 - discount) +
      actionUnits * revenuePerHistoricalUnit
    );
    if (cost !== null) {
      grossMargin += fulfillmentRatio * (
        regularUnits * (untaxedRevenuePerHistoricalUnit - cost) +
        discountedUnits * (untaxedRevenuePerHistoricalUnit * (1 - discount) - cost) +
        actionUnits * (untaxedRevenuePerHistoricalUnit - cost)
      );
    }
    hasDemand = true;
  }

  if (additionalOrders > 0 && !hasDemand) {
    return { revenue: unknown("incomplete"), grossMargin: unknown("incomplete") };
  }
  if (inputs.promotion.enabled && promotionEligibleOrders !== null && averageOrderValue && averageUntaxedOrderValue) {
    constrainedRevenue -= promotionEligibleOrders * averageOrderValue.value * discount;
    grossMargin -= promotionEligibleOrders * averageUntaxedOrderValue.value * discount;
  }
  const basis = "Répartition produit historique, stock partagé plafonné une seule fois ; coût courant pour la marge";
  return {
    revenue: estimate(constrainedRevenue, basis),
    grossMargin: grossMarginComplete
      ? estimate(grossMargin, basis)
      : unknown("not_recorded"),
  };
}

function zeroAction(
  id: CommercialActionResult["id"],
  label: string,
): CommercialActionResult {
  const zero = estimate(0, "Action désactivée");
  return {
    id,
    label,
    estimatedCustomers: zero,
    estimatedOrders: zero,
    estimatedUnits: zero,
    potentialRevenue: zero,
    stockConstrainedRevenue: zero,
    grossMargin: zero,
    actionCost: zero,
    contribution: zero,
    explanation: ["Action désactivée."],
  };
}

function buildActionResult(
  id: CommercialActionResult["id"],
  label: string,
  customers: Metric,
  orders: Metric,
  units: Metric,
  revenue: Metric,
  stockRevenue: Metric,
  grossMargin: Metric,
  cost: Metric,
  explanation: string[],
): CommercialActionResult {
  const contribution =
    grossMargin.status === "unknown" || cost.status === "unknown"
      ? unknown("incomplete")
      : estimate(grossMargin.value - cost.value, "Marge brute estimée moins coût direct renseigné");
  return {
    id,
    label,
    estimatedCustomers: customers,
    estimatedOrders: orders,
    estimatedUnits: units,
    potentialRevenue: revenue,
    stockConstrainedRevenue: stockRevenue,
    grossMargin,
    actionCost: cost,
    contribution,
    explanation,
  };
}

function actionUnknown(
  id: CommercialActionResult["id"],
  label: string,
  reason: "not_fetched" | "not_recorded" | "not_authorized" | "unidentified" | "incomplete",
  explanation: string,
): CommercialActionResult {
  const missing = unknown(reason);
  return buildActionResult(
    id,
    label,
    missing,
    missing,
    missing,
    missing,
    missing,
    missing,
    missing,
    [explanation],
  );
}

export function simulateCommercial(
  snapshot: SimulationSnapshot,
  inputs: CommercialInputs,
): CommercialScenarioResult {
  const averageOrderValue = getAverageOrderValue(snapshot);
  const averageUntaxedOrderValue = getAverageUntaxedOrderValue(snapshot);
  const grossMarginPerOrder = getEstimatedGrossMarginPerOrder(snapshot);
  const marginMissing = grossMarginPerOrder === null
    ? unknown(snapshot.quality.orderLinesComplete ? "not_recorded" : "incomplete")
    : null;

  const acquisition = (() => {
    const input = inputs.acquisition;
    if (!input.enabled) return zeroAction("acquisition", "Prospection");
    if (
      !isPresent(input.prospects) ||
      input.prospects < 0 ||
      !isPresent(input.conversionPercent) ||
      input.conversionPercent < 0 ||
      input.conversionPercent > 100 ||
      !isPresent(input.ordersPerCustomer) ||
      input.ordersPerCustomer < 0 ||
      averageOrderValue === null
    ) {
      return actionUnknown(
        "acquisition",
        "Prospection",
        "incomplete",
        "Renseignez le nombre de prospects, la conversion supplémentaire, les commandes par client et un panier moyen réel.",
      );
    }
    const customers = input.prospects * input.conversionPercent / 100;
    const orders = customers * input.ordersPerCustomer;
    const units = getEstimatedUnits(snapshot, orders);
    const revenue = estimate(orders * averageOrderValue.value, `Prospects × conversion supplémentaire × fréquence × ${averageOrderValue.basis.toLocaleLowerCase("fr")}`);
    const margin = grossMarginPerOrder === null
      ? marginMissing!
      : estimate(orders * grossMarginPerOrder, "Coût catalogue actuel appliqué au mix historique");
    const cost = isPresent(input.actionCost) && input.actionCost >= 0
      ? estimate(input.actionCost, "Coût de prospection saisi")
      : unknown("not_recorded");
    return buildActionResult(
      "acquisition",
      "Prospection",
      estimate(customers, "Prospects × conversion supplémentaire saisie"),
      estimate(orders, "Clients estimés × commandes par client saisies"),
      units,
      revenue,
      getStockConstrainedRevenue(snapshot, orders),
      margin,
      cost,
      [
        "La conversion est une hypothèse supplémentaire saisie, pas un taux prospect observé dans Odoo.",
        input.audience.trim() ? `Audience : ${input.audience.trim()}.` : "Audience non nommée.",
      ],
    );
  })();

  const marketing = (() => {
    const input = inputs.marketing;
    if (!input.enabled) return zeroAction("marketing", "Marketing payant");
    if (
      !isPresent(input.budget) ||
      input.budget < 0 ||
      !isPresent(input.costPerLead) ||
      input.costPerLead <= 0 ||
      !isPresent(input.conversionPercent) ||
      input.conversionPercent < 0 ||
      input.conversionPercent > 100 ||
      !isPresent(input.ordersPerCustomer) ||
      input.ordersPerCustomer < 0 ||
      averageOrderValue === null
    ) {
      return actionUnknown(
        "marketing",
        "Marketing payant",
        "incomplete",
        "Renseignez le budget, le coût par prospect, la conversion supplémentaire et les commandes par client.",
      );
    }
    const leads = input.budget / input.costPerLead;
    const customers = leads * input.conversionPercent / 100;
    const orders = customers * input.ordersPerCustomer;
    const units = getEstimatedUnits(snapshot, orders);
    const revenue = estimate(orders * averageOrderValue.value, `Budget ÷ coût par prospect × conversion supplémentaire × fréquence × ${averageOrderValue.basis.toLocaleLowerCase("fr")}`);
    const margin = grossMarginPerOrder === null
      ? marginMissing!
      : estimate(orders * grossMarginPerOrder, "Coût catalogue actuel appliqué au mix historique");
    return buildActionResult(
      "marketing",
      "Marketing payant",
      estimate(customers, "Budget et coût par prospect saisis × conversion supplémentaire"),
      estimate(orders, "Clients estimés × commandes par client saisies"),
      units,
      revenue,
      getStockConstrainedRevenue(snapshot, orders),
      margin,
      estimate(input.budget, "Budget marketing saisi"),
      [
        `Prospects estimés : ${leads.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}.`,
        "Le budget produit des prospects selon le coût par prospect saisi ; ce coût n’est pas observé dans Odoo.",
        input.audience.trim() ? `Audience : ${input.audience.trim()}.` : "Audience non nommée.",
      ],
    );
  })();

  const retention = (() => {
    const input = inputs.retention;
    if (!input.enabled) return zeroAction("retention", "Fidélisation");
    if (
      !isPresent(input.eligibleCustomers) ||
      input.eligibleCustomers < 0 ||
      !isPresent(input.returnRateLiftPercent) ||
      input.returnRateLiftPercent < 0 ||
      input.returnRateLiftPercent > 100 ||
      !isPresent(input.ordersPerReturningCustomer) ||
      input.ordersPerReturningCustomer < 0 ||
      averageOrderValue === null
    ) {
      return actionUnknown(
        "retention",
        "Fidélisation",
        "incomplete",
        "Renseignez les clients éligibles, la hausse de retour, les commandes par client revenu et un panier moyen réel.",
      );
    }
    const customers = input.eligibleCustomers * input.returnRateLiftPercent / 100;
    const orders = customers * input.ordersPerReturningCustomer;
    const units = getEstimatedUnits(snapshot, orders);
    const revenue = estimate(orders * averageOrderValue.value, `Clients éligibles × hausse de retour saisie × fréquence × ${averageOrderValue.basis.toLocaleLowerCase("fr")}`);
    const margin = grossMarginPerOrder === null
      ? marginMissing!
      : estimate(orders * grossMarginPerOrder, "Coût catalogue actuel appliqué au mix historique");
    const cost = isPresent(input.actionCost) && input.actionCost >= 0
      ? estimate(input.actionCost, "Coût de fidélisation saisi")
      : unknown("not_recorded");
    return buildActionResult(
      "retention",
      "Fidélisation",
      estimate(customers, "Clients éligibles × hausse de retour saisie"),
      estimate(orders, "Clients supplémentaires estimés × fréquence saisie"),
      units,
      revenue,
      getStockConstrainedRevenue(snapshot, orders),
      margin,
      cost,
      [
        "La hausse de retour est une hypothèse ; Odoo ne fournit pas de segment fidélité dans ce flux.",
        input.audience.trim() ? `Audience : ${input.audience.trim()}.` : "Audience non nommée.",
      ],
    );
  })();

  const promotion = (() => {
    const input = inputs.promotion;
    if (!input.enabled) return zeroAction("promotion", "Promotion");
    if (
      !isPresent(input.eligibleOrders) ||
      input.eligibleOrders < 0 ||
      !isPresent(input.incrementalOrders) ||
      input.incrementalOrders < 0 ||
      !isPresent(input.discountPercent) ||
      input.discountPercent < 0 ||
      input.discountPercent >= 100 ||
      averageOrderValue === null
    ) {
      return actionUnknown(
        "promotion",
        "Promotion",
        "incomplete",
        "Renseignez les commandes éligibles, les commandes supplémentaires, la remise et un panier moyen réel.",
      );
    }
    const netMultiplier = 1 - input.discountPercent / 100;
    const revenueDelta =
      (input.eligibleOrders + input.incrementalOrders) * averageOrderValue.value * netMultiplier -
      input.eligibleOrders * averageOrderValue.value;
    const units = getEstimatedUnits(snapshot, input.incrementalOrders);
    const margin = grossMarginPerOrder === null || averageUntaxedOrderValue === null
      ? unknown("incomplete")
      : estimate(
          input.incrementalOrders * grossMarginPerOrder -
            (input.eligibleOrders + input.incrementalOrders) *
              averageUntaxedOrderValue.value *
              (input.discountPercent / 100),
          `Marge estimée des commandes supplémentaires moins remise sur les commandes éligibles · ${averageUntaxedOrderValue.basis.toLocaleLowerCase("fr")}`,
        );
    const cost = isPresent(input.actionCost) && input.actionCost >= 0
      ? estimate(input.actionCost, "Coût de promotion saisi, hors remise déjà intégrée au CA")
      : unknown("not_recorded");
    return buildActionResult(
      "promotion",
      "Promotion",
      unknown("unidentified"),
      estimate(input.incrementalOrders, "Commandes supplémentaires saisies ; clients uniques non déterminés"),
      units,
      estimate(revenueDelta, `Commandes éligibles et supplémentaires × panier moyen · ${averageOrderValue.basis.toLocaleLowerCase("fr")}, remise appliquée une seule fois`),
      unknown("incomplete"),
      margin,
      cost,
      [
        "Le nombre de commandes supplémentaires est une hypothèse saisie ; aucune élasticité promotionnelle n’est observée dans Odoo.",
        "La remise est déjà déduite du chiffre d’affaires et n’est pas soustraite une seconde fois comme coût.",
        input.audience.trim() ? `Audience : ${input.audience.trim()}.` : "Audience non nommée.",
      ],
    );
  })();

  const upsell = (() => {
    const input = inputs.upsell;
    if (!input.enabled) return zeroAction("upsell", "Vente additionnelle");
    if (
      !isPresent(input.eligibleOrders) ||
      input.eligibleOrders < 0 ||
      !isPresent(input.uptakePercent) ||
      input.uptakePercent < 0 ||
      input.uptakePercent > 100 ||
      !isPresent(input.unitsPerAcceptedOrder) ||
      input.unitsPerAcceptedOrder < 0 ||
      input.productId === null
    ) {
      return actionUnknown(
        "upsell",
        "Vente additionnelle",
        "incomplete",
        "Renseignez les commandes éligibles, le taux d’ajout, la quantité et le produit.",
      );
    }
    const product = snapshot.products.find((item) => item.productId === input.productId);
    if (!product) {
      return actionUnknown(
        "upsell",
        "Vente additionnelle",
        "not_fetched",
        "Le produit sélectionné ne figure pas dans le catalogue chargé pour cette société.",
      );
    }
    const demandedUnits =
      input.eligibleOrders * input.uptakePercent / 100 * input.unitsPerAcceptedOrder;
    const stock = getValue(product.currentAvailableStock);
    const unitCost = getValue(product.currentUnitCost);
    const fulfilledUnits = stock === null ? null : Math.min(demandedUnits, Math.max(stock, 0));
    const historicalRevenuePerUnit = product.soldQuantity > 0
      ? product.soldRevenueTotal / product.soldQuantity
      : null;
    const historicalUntaxedRevenuePerUnit = product.soldQuantity > 0
      ? product.soldRevenueUntaxed / product.soldQuantity
      : null;
    const revenue = historicalRevenuePerUnit === null
      ? unknown("incomplete")
      : estimate(demandedUnits * historicalRevenuePerUnit, "Demande × prix unitaire moyen réellement vendu sur les 12 derniers mois");
    const stockRevenue = stock === null || historicalRevenuePerUnit === null
      ? unknown(stock === null ? "not_recorded" : "incomplete")
      : estimate((fulfilledUnits ?? 0) * historicalRevenuePerUnit, "Prix unitaire historique × unités plafonnées au stock actuel");
    const margin = unitCost === null || historicalUntaxedRevenuePerUnit === null || fulfilledUnits === null
      ? unknown(unitCost === null ? "not_recorded" : "incomplete")
      : estimate(fulfilledUnits * (historicalUntaxedRevenuePerUnit - unitCost), "Prix HT historique réellement vendu et coût catalogue actuel");
    const cost = isPresent(input.actionCost) && input.actionCost >= 0
      ? estimate(input.actionCost, "Coût de l’action saisi")
      : unknown("not_recorded");
    return buildActionResult(
      "upsell",
      "Vente additionnelle",
      estimate(0, "Aucun nouveau client : l’action porte sur des commandes existantes"),
      estimate(0, "Aucune nouvelle commande : l’action porte sur des commandes existantes"),
      estimate(demandedUnits, "Taux d’ajout × commandes éligibles × unités par acceptation"),
      revenue,
      stockRevenue,
      margin,
      cost,
      [
        stock === null
          ? "Stock inconnu : le chiffre d’affaires potentiel ne confirme pas que les ventes peuvent être servies."
          : `Stock disponible actuel : ${stock}.`,
        unitCost === null
          ? "Coût produit inconnu ou non autorisé ; marge non calculable."
          : "La marge utilise le prix HT historique vendu et le coût catalogue actuel, pas un coût historique.",
        input.audience.trim() ? `Audience : ${input.audience.trim()}.` : "Audience non nommée.",
      ],
    );
  })();

  const actions = [acquisition, marketing, retention, promotion, upsell];
  const enabled = [
    inputs.acquisition.enabled ? inputs.acquisition : null,
    inputs.marketing.enabled ? inputs.marketing : null,
    inputs.retention.enabled ? inputs.retention : null,
    inputs.promotion.enabled ? inputs.promotion : null,
    inputs.upsell.enabled ? inputs.upsell : null,
  ].filter((value): value is NonNullable<typeof value> => value !== null);
  const audienceNames = enabled.map((action) => action.audience.trim().toLocaleLowerCase("fr"));
  const audienceOverlap = enabled.length > 1 && audienceNames.some((audience, index) =>
    !audience || audienceNames.indexOf(audience) !== index,
  );
  const overlapUnconfirmed = enabled.length > 1 && enabled.some((action) => !action.disjointConfirmed);
  const combinedBlocked = audienceOverlap || overlapUnconfirmed;
  const reason = audienceOverlap
    ? "Les audiences sont absentes ou portent le même nom. Le résultat combiné est bloqué pour éviter un double comptage."
    : overlapUnconfirmed
      ? "Confirmez que les audiences actives sont distinctes avant de combiner leurs résultats."
      : null;

  const customers = addMetrics(actions.map((action) => action.estimatedCustomers), "Somme des actions aux audiences déclarées distinctes");
  const orders = addMetrics(actions.map((action) => action.estimatedOrders), "Somme des commandes supplémentaires estimées");
  const units = addMetrics(actions.map((action) => action.estimatedUnits), "Somme des unités supplémentaires estimées");
  const revenue = addMetrics(actions.map((action) => action.potentialRevenue), "Somme des variations de CA des actions");
  const costs = addMetrics(actions.map((action) => action.actionCost), "Somme des coûts directs renseignés");
  const combinedStock = getCombinedStockResult(snapshot, inputs, actions);
  const contribution =
    combinedStock.grossMargin.status === "unknown" || costs.status === "unknown"
      ? unknown("incomplete")
      : estimate(combinedStock.grossMargin.value - costs.value, "Marge brute limitée au stock partagé moins coûts directs renseignés");
  const roi =
    contribution.status === "unknown" || costs.status === "unknown" || costs.value <= 0
      ? unknown("incomplete")
      : estimate((contribution.value / costs.value) * 100, "Contribution supplémentaire ÷ coûts directs × 100");

  const range = inputs.scenarioRangePercent;
  const rangeGrossMargin = combinedStock.grossMargin.status === "unknown"
    ? null
    : combinedStock.grossMargin.value;
  const rangeCosts = costs.status === "unknown" ? null : costs.value;
  const rangeAvailable =
    contribution.status !== "unknown" &&
    rangeGrossMargin !== null &&
    rangeCosts !== null &&
    isPresent(range) &&
    range >= 0 &&
    range < 100;
  const rangeMetric = (factor: number): Metric => {
    if (!rangeAvailable || rangeGrossMargin === null || rangeCosts === null || !isPresent(range)) {
      return unknown("not_recorded");
    }
    return estimate(
      rangeGrossMargin * factor - rangeCosts,
      "Variation de marge brute saisie par l’utilisateur ; coûts maintenus fixes",
    );
  };
  const central = contribution;

  return {
    baselineRevenue:
      snapshot.actuals.confirmedRevenue +
      snapshot.actuals.confirmedRevenue / Math.max(snapshot.actuals.elapsedDays, 1) *
        snapshot.actuals.remainingDays,
    baselineOrders:
      snapshot.actuals.confirmedOrders +
      snapshot.actuals.confirmedOrders / Math.max(snapshot.actuals.elapsedDays, 1) *
        snapshot.actuals.remainingDays,
    actions,
    combined: {
      status: combinedBlocked ? "blocked" : "available",
      reason,
      incrementalRevenue: combinedBlocked ? unknown("unidentified") : revenue,
      stockConstrainedRevenue: combinedBlocked ? unknown("unidentified") : combinedStock.revenue,
      incrementalOrders: combinedBlocked ? unknown("unidentified") : orders,
      incrementalUnits: combinedBlocked ? unknown("unidentified") : units,
      incrementalCustomers: combinedBlocked ? unknown("unidentified") : customers,
      grossMargin: combinedBlocked ? unknown("unidentified") : combinedStock.grossMargin,
      actionCosts: combinedBlocked ? unknown("unidentified") : costs,
      contribution: combinedBlocked ? unknown("unidentified") : contribution,
      roiPercent: combinedBlocked ? unknown("unidentified") : roi,
    },
    range: {
      prudent: rangeMetric(1 - (isPresent(range) ? range : 0) / 100),
      central,
      optimistic: rangeMetric(1 + (isPresent(range) ? range : 0) / 100),
      note: rangeAvailable
        ? `Plage ±${range}% saisie manuellement ; ce n’est pas un intervalle statistique.`
        : "Scénarios prudent et optimiste non calculés : renseignez une plage explicite et des coûts complets.",
    },
  };
}

export function simulateLegacy(
  ctx: LegacySimulatorContext,
  p: LegacySimulatorParams,
) {
  const elapsed = Math.max(ctx.elapsedDays, 1);
  const remaining = Math.max(ctx.remainingDays, 0);
  const total = elapsed + remaining;
  const dailyRev = ctx.currentRevenue / elapsed;
  const dailyOrders = ctx.currentOrders / elapsed;
  const start = Math.min(Math.max(Math.round(p.start), 0), remaining);
  const active = remaining - start;
  const m = p.margin / 100;
  const d = p.discount / 100;
  const volumeBoost = p.volume + p.discount * p.elasticity;
  const volumeMult = Math.max(0, 1 + volumeBoost / 100);
  const basketMult = Math.max(0, 1 + p.basket / 100);
  const net = basketMult * (1 - d);
  const baselineRemaining = dailyRev * remaining;
  const scenarioRemaining = dailyRev * (start + active * volumeMult * net);
  const baselineRevenue = ctx.currentRevenue + baselineRemaining;
  const scenarioRevenue = ctx.currentRevenue + scenarioRemaining;
  const baselineOrders = ctx.currentOrders + dailyOrders * remaining;
  const scenarioOrders = ctx.currentOrders + dailyOrders * (start + active * volumeMult);
  const baselineProfit = (ctx.currentRevenue + baselineRemaining) * m;
  const scenarioProfit =
    ctx.currentRevenue * m + dailyRev * (start * m + active * volumeMult * basketMult * (m - d));
  const swing = Math.abs(volumeBoost) + Math.abs(p.basket) + p.discount * 0.5;
  const uncertainty = Math.min(0.06 + (swing / 100) * 0.3, 0.4);

  return {
    elapsed,
    remaining,
    total,
    dailyRev,
    dailyOrders,
    start,
    active,
    volumeBoost,
    volumeMult,
    basketMult,
    net,
    baselineRemaining,
    scenarioRemaining,
    baselineRevenue,
    scenarioRevenue,
    baselineOrders,
    scenarioOrders,
    baselineProfit,
    scenarioProfit,
    difference: scenarioRevenue - baselineRevenue,
    differencePercent:
      baselineRevenue > 0 ? ((scenarioRevenue - baselineRevenue) / baselineRevenue) * 100 : 0,
    profitDiff: scenarioProfit - baselineProfit,
    uncertainty,
    low: ctx.currentRevenue + scenarioRemaining * (1 - uncertainty),
    high: ctx.currentRevenue + scenarioRemaining * (1 + uncertainty),
  };
}

export function legacyValueAt(
  day: number,
  kind: "baseline" | "scenario",
  ctx: LegacySimulatorContext,
  params: LegacySimulatorParams,
): number {
  const sim = simulateLegacy(ctx, params);
  if (day <= sim.elapsed) return ctx.currentRevenue * (day / sim.elapsed);
  const x = day - sim.elapsed;
  if (kind === "baseline") return ctx.currentRevenue + sim.dailyRev * x;
  const before = Math.min(x, sim.start);
  const after = Math.max(0, x - sim.start);
  return ctx.currentRevenue + sim.dailyRev * (before + after * sim.volumeMult * sim.net);
}
