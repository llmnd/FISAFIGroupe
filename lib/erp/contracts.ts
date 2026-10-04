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

export type ProductAvailability = "in_stock" | "low_stock" | "out_of_stock" | "unavailable";
export type ProductStatus = "active" | "inactive";

export type Product = {
  id: number;
  name: string;
  reference: string | null;
  barcode: string | null;
  categoryId: number | null;
  categoryName: string | null;
  salesPrice: number;
  costPrice: number | null;
  unitName: string | null;
  stock: number;
  availability: ProductAvailability;
  status: ProductStatus;
  imageUrl: string | null;
  updatedAt: string | null;
};

export type ProductListPage = {
  products: Product[];
  hasMore: boolean;
  totalCount: number;
  categories: Array<{ id: number; name: string }>;
};

export type ProductUpdateInput = {
  name?: string;
  reference?: string | null;
  barcode?: string | null;
  categoryId?: number | null;
  salesPrice?: number;
  costPrice?: number | null;
  active?: boolean;
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
  getProducts(options: {
    search: string;
    categoryId?: number | null;
    onlyAvailable?: boolean;
    offset: number;
    limit: number;
  }): Promise<ProductListPage>;
  getProduct(id: number): Promise<Product>;
  updateProduct(id: number, input: ProductUpdateInput): Promise<Product>;
  updateProductImage(id: number, imageBase64: string): Promise<Product>;
  removeProductImage(id: number): Promise<Product>;
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
