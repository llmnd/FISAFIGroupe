export type ExpenseNature = "fixed" | "variable";
export type ExpenseTiming = "incurred" | "forecast";

export type MonthlyExpense = {
  id: string;
  label: string;
  amount: string;
  nature: ExpenseNature;
  timing: ExpenseTiming;
};

export type MonthlyExpenseSummary = {
  complete: boolean;
  invalid: boolean;
  enteredTotal: number;
  total: number | null;
  incurredTotal: number;
  forecastFixedTotal: number;
  forecastVariableTotal: number;
};

export type BreakEvenResult =
  | { status: "unknown" }
  | { status: "impossible"; variableCostRate: number }
  | {
      status: "available";
      revenue: number;
      orders: number | null;
      variableCostRate: number;
      contributionRate: number;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function normalizeMonthlyExpenseList(value: unknown): MonthlyExpense[] | null {
  if (!Array.isArray(value) || value.length > 50) return null;
  const ids = new Set<string>();
  const expenses: MonthlyExpense[] = [];
  for (const item of value as unknown[]) {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      item.id.length === 0 ||
      ids.has(item.id) ||
      typeof item.label !== "string" ||
      item.label.length > 100 ||
      (typeof item.amount !== "string" && typeof item.amount !== "number") ||
      String(item.amount).length > 20 ||
      (item.nature !== undefined && item.nature !== "fixed" && item.nature !== "variable") ||
      (item.timing !== undefined && item.timing !== "incurred" && item.timing !== "forecast")
    ) {
      return null;
    }
    ids.add(item.id);
    expenses.push({
      id: item.id,
      label: item.label,
      amount: String(item.amount),
      nature: item.nature === "variable" ? "variable" : "fixed",
      timing: item.timing === "incurred" ? "incurred" : "forecast",
    });
  }
  return expenses;
}

export function summarizeMonthlyExpenses(expenses: MonthlyExpense[]): MonthlyExpenseSummary {
  if (expenses.length === 0) {
    return {
      complete: false,
      invalid: false,
      enteredTotal: 0,
      total: null,
      incurredTotal: 0,
      forecastFixedTotal: 0,
      forecastVariableTotal: 0,
    };
  }

  let enteredTotal = 0;
  let incurredTotal = 0;
  let forecastFixedTotal = 0;
  let forecastVariableTotal = 0;
  let complete = true;
  let invalid = false;

  for (const expense of expenses) {
    const rawAmount = expense.amount.trim();
    if (!expense.label.trim() || !rawAmount) {
      complete = false;
      if (!rawAmount) continue;
    }

    const amount = Number(rawAmount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000) {
      complete = false;
      invalid = true;
      continue;
    }

    enteredTotal += amount;
    if (expense.timing === "incurred") incurredTotal += amount;
    else if (expense.nature === "variable") forecastVariableTotal += amount;
    else forecastFixedTotal += amount;
  }

  return {
    complete,
    invalid,
    enteredTotal,
    total: complete ? incurredTotal + forecastFixedTotal + forecastVariableTotal : null,
    incurredTotal,
    forecastFixedTotal,
    forecastVariableTotal,
  };
}

export function getEstimatedExpensesAtRevenue(
  expenses: MonthlyExpenseSummary,
  revenue: number,
  referenceRevenue: number,
): number | null {
  if (!expenses.complete || !Number.isFinite(revenue) || revenue < 0) return null;
  if (expenses.forecastVariableTotal === 0) {
    return expenses.incurredTotal + expenses.forecastFixedTotal;
  }
  if (!Number.isFinite(referenceRevenue) || referenceRevenue <= 0) return null;
  return expenses.incurredTotal +
    expenses.forecastFixedTotal +
    expenses.forecastVariableTotal * (revenue / referenceRevenue);
}

export function getEstimatedBalanceAfterExpenses(
  grossMargin: number,
  expenses: MonthlyExpenseSummary,
  revenue: number,
  referenceRevenue: number,
): number | null {
  const expenseAmount = getEstimatedExpensesAtRevenue(expenses, revenue, referenceRevenue);
  return expenseAmount !== null && Number.isFinite(grossMargin)
    ? grossMargin - expenseAmount
    : null;
}

export function calculateBreakEven(
  expenses: MonthlyExpenseSummary,
  grossMarginPercent: number,
  referenceRevenue: number,
  averageOrderValue: number,
): BreakEvenResult {
  if (!expenses.complete || !Number.isFinite(grossMarginPercent) || grossMarginPercent <= 0) {
    return { status: "unknown" };
  }
  if (expenses.forecastVariableTotal > 0 && (!Number.isFinite(referenceRevenue) || referenceRevenue <= 0)) {
    return { status: "unknown" };
  }

  const variableCostRate = expenses.forecastVariableTotal > 0
    ? expenses.forecastVariableTotal / referenceRevenue
    : 0;
  const contributionRate = grossMarginPercent / 100 - variableCostRate;
  if (contributionRate <= 0) return { status: "impossible", variableCostRate };

  const fixedCosts = expenses.incurredTotal + expenses.forecastFixedTotal;
  const revenue = fixedCosts / contributionRate;
  return {
    status: "available",
    revenue,
    orders: Number.isFinite(averageOrderValue) && averageOrderValue > 0
      ? Math.ceil(revenue / averageOrderValue)
      : null,
    variableCostRate,
    contributionRate,
  };
}
