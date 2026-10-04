export type MarketCartItem = {
  id: string;
  odooProductId?: number;
  departmentId: string;
  departmentName: string;
  name: string;
  image?: string;
  priceLabel: string;
  unitPrice: number;
  priceUnit: "kg" | "unité";
  quantity: number;
};

export type MarketCartItemInput = Omit<MarketCartItem, "id" | "quantity"> & {
  quantity?: number;
};

export const MARKET_CART_KEY = "fisafi-market-cart";
export const MARKET_CART_CHANGE_EVENT = "fisafi-market-cart-change";
export const MARKET_CART_MAX_QUANTITY = 99;

export function getMarketDepartmentName(categoryName: string | null) {
  const name = categoryName?.split("/")[0].trim();
  if (!name || /^\d+$/.test(name)) return "Autres produits";
  if (/fruit|l[eé]gume|frittes/i.test(name)) return "Fruits & légumes";
  if (/boisson|^eau$/i.test(name)) return "Boissons";
  if (/boulangerie|p[aâ]tisserie/i.test(name)) return "Boulangerie";
  if (/frais|lait|fromage/i.test(name)) return "Produits frais";
  if (/bonbon|biscuit|chips|cuisine|food|[eé]picerie|b[eé]b[eé]|enfants/i.test(name)) return "Épicerie";
  if (/hygien|cosm[eé]tique|electricit[eé]|insecticide|ustensile|librairie|sant[eé]/i.test(name)) {
    return "Maison & entretien";
  }
  return name;
}

export function getMarketDepartmentId(name: string) {
  const departmentIds: Record<string, string> = {
    "Fruits & légumes": "fruits-legumes",
    Épicerie: "epicerie",
    Boulangerie: "boulangerie",
    Boissons: "boissons",
    "Produits frais": "frais",
    "Maison & entretien": "maison",
  };
  if (departmentIds[name]) return departmentIds[name];
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "autres-produits";
}

export function getMarketProductId(departmentId: string, productName: string, odooProductId?: number) {
  if (Number.isSafeInteger(odooProductId) && Number(odooProductId) > 0) {
    return `${departmentId}:odoo-${odooProductId}`;
  }
  return `${departmentId}:${productName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr")}`;
}

export function getMarketPriceAmount(price: string) {
  const amount = price.match(/\d[\d\s]*/)?.[0].replace(/\s/g, "");
  return amount ? Number(amount) : null;
}

export function getMarketImageSource(image?: string) {
  if (!image) return null;
  if (image.startsWith("https://") || (image.startsWith("/") && !image.startsWith("//"))) {
    return image;
  }
  return `/produits/${image}`;
}

function isMarketCartItem(value: unknown): value is MarketCartItem {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<MarketCartItem>;
  return (
    typeof candidate.id === "string" &&
    (candidate.odooProductId === undefined ||
      (Number.isSafeInteger(candidate.odooProductId) && candidate.odooProductId > 0)) &&
    typeof candidate.departmentId === "string" &&
    typeof candidate.departmentName === "string" &&
    typeof candidate.name === "string" &&
    (candidate.image === undefined || typeof candidate.image === "string") &&
    typeof candidate.priceLabel === "string" &&
    typeof candidate.unitPrice === "number" &&
    Number.isFinite(candidate.unitPrice) &&
    (candidate.priceUnit === "kg" || candidate.priceUnit === "unité") &&
    typeof candidate.quantity === "number" &&
    Number.isFinite(candidate.quantity) &&
    candidate.quantity > 0
  );
}

export function readMarketCart(): MarketCartItem[] {
  const saved = window.localStorage.getItem(MARKET_CART_KEY);
  if (!saved) return [];
  const parsed: unknown = JSON.parse(saved);
  if (!Array.isArray(parsed)) throw new TypeError("Le panier enregistré n’est pas une liste.");

  const items: unknown[] = parsed;
  const validItems = items.filter(isMarketCartItem);
  if (validItems.length !== items.length) {
    throw new TypeError("Le panier enregistré contient des articles invalides.");
  }
  return validItems;
}

export function writeMarketCart(items: MarketCartItem[]) {
  window.localStorage.setItem(MARKET_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(MARKET_CART_CHANGE_EVENT));
}
