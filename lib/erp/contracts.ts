export type POSSessionStatus = "opened" | "opening_control" | "closing_control" | "closed" | "unknown";

export type PointOfSale = {
  id: number;
  name: string;
  location: string | null;
  active: boolean;
  session: null | {
    id: number;
    name: string;
    status: POSSessionStatus;
    responsible: string | null;
    startedAt: string | null;
  };
};

export type POSProduct = {
  id: number;
  variantRef: string | null;
  name: string;
  reference: string | null;
  unitPrice: number;
  unitName: string;
  availableQuantity: number;
  imageUrl: string;
  variantChoiceRequired: boolean;
};

export type POSProductPage = {
  products: POSProduct[];
  hasMore: boolean;
};

export type POSPaymentMethod = {
  id: number;
  name: string;
  type: "cash" | "bank";
  manual: boolean;
};

export type POSSession = {
  id: number;
  name: string;
  status: POSSessionStatus;
  startedAt: string | null;
};

export type POSSaleLineInput = {
  variantId: number;
  quantity: number;
};

export type POSSaleResult = {
  orderId: number;
  reference: string;
  amountTotal: number;
  amountTax: number;
  amountReceived: number;
  change: number;
};

export type POSSaleQuote = {
  amountTotal: number;
  amountTax: number;
};

export type POSClosingMethod = POSPaymentMethod & {
  expectedAmount: number;
};

export type POSClosingSummary = {
  sessionId: number;
  cashControl: boolean;
  methods: POSClosingMethod[];
};

export interface ERPProvider {
  getPointsOfSale(): Promise<PointOfSale[]>;
  getPOSProducts(options: {
    configId: number;
    search: string;
    offset: number;
    limit: number;
  }): Promise<POSProductPage>;
  openPOSSession(options: {
    configId: number;
    openingAmount: number;
    operationId: string;
    employeeId: string;
  }): Promise<POSSession>;
  getPOSPaymentMethods(options: {
    configId: number;
    sessionId: number;
    employeeId: string;
  }): Promise<POSPaymentMethod[]>;
  quotePOSSale(options: {
    configId: number;
    sessionId: number;
    employeeId: string;
    lines: POSSaleLineInput[];
  }): Promise<POSSaleQuote>;
  createPOSSale(options: {
    configId: number;
    sessionId: number;
    operationId: string;
    employeeId: string;
    lines: POSSaleLineInput[];
    paymentMethodId: number;
    amountReceived: number;
  }): Promise<POSSaleResult>;
  getPOSClosingSummary(options: {
    configId: number;
    sessionId: number;
    employeeId: string;
  }): Promise<POSClosingSummary>;
  closePOSSession(options: {
    configId: number;
    sessionId: number;
    operationId: string;
    employeeId: string;
    countedAmounts: Record<number, number>;
  }): Promise<POSSession>;
}
