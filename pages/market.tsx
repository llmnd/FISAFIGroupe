import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import MarketStore from "@/components/MarketStore";
import Footer from "@/components/Footer";
import useMarketCart from "@/hooks/useMarketCart";
import { getMarketPriceAmount, getMarketProductId } from "@/lib/marketCart";
import type { MarketCartItemInput } from "@/lib/marketCart";

/* ═══════════ TYPES ═══════════ */

type Department = {
  id: string;
  name: string;
  description: string;
  color: string;
  art: "produce" | "pantry" | "bakery" | "drinks" | "fresh" | "home";
};

type OdooCatalogProduct = {
  id: number;
  name: string;
  price: number;
  categoryName: string | null;
  unitName: string;
  imageUrl: string;
  isPromotion: boolean;
};

type MarketProduct = {
  id: number;
  name: string;
  price: string;
  badge?: "PROMO";
  artwork: ProductArtwork;
  imageUrl: string;
  categoryPath: string | null;
  departmentId: string;
  departmentName: string;
};

type ProductArtwork = "produce" | "pantry" | "bakery" | "drink" | "fresh" | "home";

type ThemeChoice = "system" | "light" | "dark";
type ProductSort = "name-asc" | "price-asc" | "price-desc";
type MarketSubcategory = { path: string; name: string; productCount: number };

const DEPARTMENT_COLORS = ["green", "orange", "gold", "blue", "pink", "purple"] as const;
const MARKET_PAGE_SIZE = 24;

function getDepartmentArtwork(name: string): Department["art"] {
  if (/fruit|l[eé]gume/i.test(name)) return "produce";
  if (/boulangerie|p[aâ]tisserie/i.test(name)) return "bakery";
  if (/boisson|eau|jus/i.test(name)) return "drinks";
  if (/frais|lait|fromage/i.test(name)) return "fresh";
  if (/bonbon|biscuit|chips|cuisine|food|[eé]picerie/i.test(name)) return "pantry";
  return "home";
}

function getDepartmentName(categoryName: string | null) {
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

function getDepartmentId(name: string) {
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

function getProductArtwork(name: string): ProductArtwork {
  const artwork = getDepartmentArtwork(name);
  return artwork === "drinks" ? "drink" : artwork;
}

function isMarketApiResponse(value: unknown): value is { products: OdooCatalogProduct[] } {
  if (!value || typeof value !== "object" || !("products" in value)) return false;
  const products = value.products;
  return (
    Array.isArray(products) &&
    products.every((product: unknown) => {
      if (!product || typeof product !== "object") return false;
      const candidate = product as Partial<OdooCatalogProduct>;
      return (
        typeof candidate.id === "number" &&
        typeof candidate.name === "string" &&
        typeof candidate.price === "number" &&
        (candidate.categoryName === null || typeof candidate.categoryName === "string") &&
        typeof candidate.unitName === "string" &&
        typeof candidate.imageUrl === "string" &&
        typeof candidate.isPromotion === "boolean"
      );
    })
  );
}

const MARKET_CATALOG_CACHE_KEY = "fisafi-market-catalog-v3";
const MARKET_CATALOG_MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000;
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readMarketCatalogCache(): OdooCatalogProduct[] | null {
  try {
    const cached = window.localStorage.getItem(MARKET_CATALOG_CACHE_KEY);
    if (!cached) return null;

    const value: unknown = JSON.parse(cached);
    if (
      !value ||
      typeof value !== "object" ||
      !("cachedAt" in value) ||
      typeof value.cachedAt !== "number" ||
      Date.now() - value.cachedAt > MARKET_CATALOG_MAX_STALE_MS ||
      value.cachedAt > Date.now() ||
      !("products" in value)
    ) {
      return null;
    }
    const catalog: unknown = { products: value.products };
    return isMarketApiResponse(catalog) ? catalog.products : null;
  } catch (error) {
    console.warn("[Market] Cached product catalog could not be read:", error);
    return null;
  }
}

function writeMarketCatalogCache(products: OdooCatalogProduct[]) {
  try {
    window.localStorage.setItem(
      MARKET_CATALOG_CACHE_KEY,
      JSON.stringify({ cachedAt: Date.now(), products }),
    );
  } catch (error) {
    console.warn("[Market] Product catalog could not be saved to cache:", error);
  }
}

const SERVICES = [
  { id: "livraison", title: "Livraison à domicile", desc: "Dans tout Dakar, sous 2 heures.", icon: "🛵" },
  { id: "whatsapp", title: "Commande WhatsApp", desc: "Envoyez votre liste, on prépare.", icon: "💬" },
  { id: "collect", title: "Click & Collect", desc: "Commandez, passez, récupérez.", icon: "🛍️" },
  { id: "paiement", title: "Wave · Orange Money", desc: "Paiement mobile accepté en caisse.", icon: "📱" },
];

const HOURS = [{ day: "Tous les jours", time: "7h – 00h" }];

const TESTIMONIALS = [
  { id: "aissatou", name: "Aïssatou D.", role: "Plateau", text: "Je trouve tout ce qu'il me faut à deux pas de chez moi. Abdel me garde toujours mon bissap préféré !" },
  { id: "moussa", name: "Moussa F.", role: "Client fidèle", text: "Rayon frais impeccable, prix justes. La commande WhatsApp me fait gagner un temps fou." },
  { id: "coumba", name: "Coumba S.", role: "Médina", text: "Un vrai commerce de quartier, avec le sourire et de bons produits. Ça fait plaisir." },
];

/* ═══════════ HOOK : statut ouvert/fermé ═══════════ */

function useOpenStatus() {
  const [status, setStatus] = useState({ open: true, label: "Ouvert", detail: "ferme à minuit" });

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const total = now.getHours() * 60 + now.getMinutes();
      const openFrom = 7 * 60;
      const openTo = 24 * 60;

      if (total >= openFrom && total < openTo) {
        setStatus({ open: true, label: "Ouvert", detail: "ferme à minuit" });
      } else {
        setStatus({ open: false, label: "Fermé", detail: "ouvre à 7h" });
      }
    };
    compute();
    const t = setInterval(compute, 60_000);
    return () => clearInterval(t);
  }, []);

  return status;
}

/* ═══════════ ILLUSTRATIONS ═══════════ */

function DepartmentIllustration({ art }: { art: "produce" | "pantry" | "bakery" | "drinks" | "fresh" | "home" }) {
  return (
    <svg
      className={`market-department-art market-department-art--${art}`}
      viewBox="0 0 240 180"
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx="120" cy="153" rx="73" ry="10" fill="currentColor" opacity=".1" />
      {art === "produce" && (
        <>
          <path d="M70 94c-2-25 18-42 40-32 13 6 13 26 5 44-11 24-43 21-45-12Z" fill="#F5A43B" />
          <path d="M98 67c-2-13 5-24 18-26-1 11-6 19-18 26Z" fill="#3C985F" />
          <path d="M121 103c-5-26 13-47 37-38 19 7 18 27 8 45-14 25-41 20-45-7Z" fill="#E95D58" />
          <path d="M139 66c4-12 15-18 27-15-5 11-13 16-27 15Z" fill="#4D9A5B" />
          <path d="M92 126c3-24 22-35 39-28 15 6 15 21 4 34-12 15-45 15-43-6Z" fill="#E8C84F" />
          <path d="M109 96c-3-10 0-16 8-21" stroke="#477D42" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
      {art === "pantry" && (
        <>
          <path d="M74 64h38l6 12v66H68V76l6-12Z" fill="#F2E4C6" />
          <path d="M74 64h38v15H74z" fill="#D88B43" />
          <path d="M75 94h36v28H75z" fill="#78A66A" />
          <path d="M134 57h33l7 13v72h-47V70l7-13Z" fill="#F7F0E2" />
          <path d="M134 57h33v15h-33z" fill="#D9B96E" />
          <path d="M133 94h39v28h-39z" fill="#E7A559" />
          <path d="M82 106h22m-22 7h15m24-12h26m-26 8h20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
        </>
      )}
      {art === "bakery" && (
        <>
          <path d="M59 116c0-21 13-38 33-46 5-18 23-28 43-22 11 3 19 12 21 23 15 9 25 26 25 45v14H59v-14Z" fill="#D7954C" />
          <path d="M97 73c-2 12 3 23 11 30m18-56c-4 12-2 23 5 33m20-9c-4 12-1 23 6 33" stroke="#F7D49B" strokeWidth="6" strokeLinecap="round" />
          <path d="M56 132h132" stroke="#A76735" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {art === "drinks" && (
        <>
          <path d="M79 60h27v12l8 9v64H71V81l8-9V60Z" fill="#79A9D3" />
          <path d="M79 60h27v12H79z" fill="#F6F0DD" />
          <path d="M72 103h42v25H72z" fill="#E7F5F8" opacity=".88" />
          <path d="M139 52h26v14l7 9v70h-40V75l7-9V52Z" fill="#D7954C" />
          <path d="M139 52h26v14h-26z" fill="#F6F0DD" />
          <path d="M132 101h40v27h-40z" fill="#F9E5AF" opacity=".9" />
          <path d="M84 113c8-9 18-9 27 0m28 0c8-9 18-9 27 0" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {art === "fresh" && (
        <>
          <path d="M71 81h98l-9 70H80l-9-70Z" fill="#F5F1E7" />
          <path d="M78 91h84l-6 47H84l-6-47Z" fill="#E9C8A4" />
          <path d="M92 80c-5-18 7-31 23-28 11 2 15 15 9 28m12 0c-2-18 10-28 25-23 10 4 11 16 3 24" stroke="#5B9A64" strokeWidth="8" strokeLinecap="round" />
          <path d="M97 109c8-9 16-9 24 0m12 0c8-9 16-9 24 0" stroke="#FFF9EC" strokeWidth="5" strokeLinecap="round" />
          <path d="M74 83h92" stroke="#D6B990" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {art === "home" && (
        <>
          <path d="M75 90h90l-8 60H83l-8-60Z" fill="#A8C9DE" />
          <path d="M88 76h64v18H88z" fill="#F6F2E9" />
          <path d="M96 75c0-15 9-25 24-25s24 10 24 25" stroke="#F6F2E9" strokeWidth="8" />
          <path d="M97 110h46m-42 12h38" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".85" />
          <path d="M176 110c0-13 10-23 22-23s22 10 22 23v35h-44v-35Z" fill="#D8B69A" />
          <path d="M183 111c0-9 6-15 15-15s15 6 15 15" stroke="#F8EBD9" strokeWidth="5" />
        </>
      )}
    </svg>
  );
}

function ProductIllustration({ artwork }: { artwork: ProductArtwork }) {
  return (
    <svg className="market-product-art" viewBox="0 0 240 180" fill="none" aria-hidden="true">
      <ellipse cx="120" cy="153" rx="65" ry="9" fill="currentColor" opacity=".12" />
      {artwork === "produce" && (
        <>
          <path d="M63 101c-2-26 19-43 41-32 14 7 13 27 5 45-11 24-44 20-46-13Z" fill="#f5a43b" />
          <path d="M102 72c-2-13 5-24 18-26-1 11-6 19-18 26Z" fill="#3c985f" />
          <path d="M126 106c-5-25 13-44 36-36 18 7 18 26 8 44-14 24-40 19-44-8Z" fill="#e95d58" />
          <path d="M144 72c4-12 15-18 27-15-5 11-13 16-27 15Z" fill="#4d9a5b" />
        </>
      )}
      {artwork === "pantry" && (
        <>
          <path d="M69 55h39v15l8 12v61H61V82l8-12V55Z" fill="#f2e4c6" />
          <path d="M69 55h39v15H69z" fill="#d88b43" />
          <path d="M62 97h54v29H62z" fill="#78a66a" />
          <path d="M135 63h38v14l7 11v55h-52V88l7-11V63Z" fill="#f7f0e2" />
          <path d="M135 63h38v14h-38z" fill="#d9b96e" />
          <path d="M128 100h52v27h-52z" fill="#e7a559" />
        </>
      )}
      {artwork === "bakery" && (
        <>
          <path d="M54 114c0-23 17-41 39-48 7-19 25-27 45-20 11 4 18 12 19 22 17 9 28 26 28 46v16H54Z" fill="#d7954c" />
          <path d="M96 72c-2 12 3 22 11 30m19-55c-4 12-2 23 5 33m20-9c-4 12-1 23 6 33" stroke="#f7d49b" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {artwork === "drink" && (
        <>
          <path d="M79 48h28v13l8 10v70H71V71l8-10V48Z" fill="#79a9d3" />
          <path d="M79 48h28v13H79z" fill="#f6f0dd" />
          <path d="M72 96h43v27H72z" fill="#e7f5f8" />
          <path d="M143 59h26v13l7 9v60h-40V81l7-9V59Z" fill="#d7954c" />
          <path d="M136 100h40v26h-40z" fill="#f9e5af" />
        </>
      )}
      {artwork === "fresh" && (
        <>
          <path d="M63 72h114l-10 77H73L63 72Z" fill="#f5f1e7" />
          <path d="M74 86h92l-7 52H81l-7-52Z" fill="#e9c8a4" />
          <path d="M87 76c-5-18 7-31 23-28 11 2 15 15 9 28m12 0c-2-18 10-28 25-23 10 4 11 16 3 24" stroke="#5b9a64" strokeWidth="8" strokeLinecap="round" />
        </>
      )}
      {artwork === "home" && (
        <>
          <path d="M66 74h108l-9 76H75l-9-76Z" fill="#a8c9de" />
          <path d="M82 58h76v20H82z" fill="#f6f2e9" />
          <path d="M91 57c0-17 11-27 29-27s29 10 29 27" stroke="#f6f2e9" strokeWidth="8" />
          <path d="M91 101h58m-53 14h47" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".85" />
        </>
      )}
    </svg>
  );
}

function ProductArtworkView({ product }: { product: MarketProduct }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (imageFailed) return <ProductIllustration artwork={product.artwork} />;

  return (
    <img
      className="market-product-image"
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      decoding="async"
      onError={() => setImageFailed(true)}
    />
  );
}

function MarketMenuImage({ src, artwork }: { src: string; artwork: ProductArtwork }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  if (failedSource === src) return <ProductIllustration artwork={artwork} />;

  return (
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedSource(src)}
    />
  );
}

function MarketProductCard({
  product,
  departmentName,
  cartQuantity,
  onAddToCart,
  onSetQuantity,
}: {
  product: MarketProduct;
  departmentName: string;
  cartQuantity: number;
  onAddToCart: () => void;
  onSetQuantity: (quantity: number) => void;
}) {
  const unitPrice = getMarketPriceAmount(product.price);
  const priceUnit = /\/\s*kg\b/i.test(product.price) ? "kg" : "unité";

  return (
    <article className="market-product-card">
      <div className="market-product-visual">
        {product.badge && (
          <span className={`market-product-badge market-product-badge--${product.badge.toLowerCase()}`}>
            {product.badge}
          </span>
        )}
        <ProductArtworkView product={product} />
      </div>
      <div className="market-product-info">
        <span className="market-product-department">{departmentName}</span>
        <h4>{product.name}</h4>
        <div className="market-product-meta">
          <p className="market-product-price">
            <strong>
              {priceUnit === "kg" ? product.price.replace(/\s*\/\s*kg\b/i, "") : product.price}
            </strong>
            <span>
              FCFA{priceUnit === "kg" && <small> / kg</small>}
            </span>
          </p>
          <div className="market-product-purchase">
            {cartQuantity > 0 ? (
              <div className="market-product-cart-controls" role="group" aria-label={`Quantité de ${product.name} dans le panier`}>
                <button
                  type="button"
                  onClick={() => onSetQuantity(cartQuantity - (priceUnit === "kg" ? 0.5 : 1))}
                  aria-label={`Retirer ${priceUnit === "kg" ? "0,5 kg" : "un"} de ${product.name}`}
                >
                  −
                </button>
                <span aria-live="polite">
                  {new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(cartQuantity)}
                  {priceUnit === "kg" ? " kg" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onSetQuantity(cartQuantity + (priceUnit === "kg" ? 0.5 : 1))}
                  aria-label={`Ajouter ${priceUnit === "kg" ? "0,5 kg" : "un"} de ${product.name}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                className="market-product-add"
                type="button"
                onClick={onAddToCart}
                disabled={unitPrice === null}
                aria-label={`Ajouter ${product.name} au panier`}
              >
                Ajouter <span aria-hidden="true">+</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function Stars() {
  return (
    <span className="market-testimonial-stars" aria-label="5 étoiles sur 5">
      ★★★★★
    </span>
  );
}

/* ═══════════ PAGE ═══════════ */

export default function MarketPage() {
  const status = useOpenStatus();
  const { items: cartItems, ready: cartReady, storageError, addItem, setQuantity } = useMarketCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [productSort, setProductSort] = useState<ProductSort>("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [catalog, setCatalog] = useState<OdooCatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [departmentsMenuOpen, setDepartmentsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [marketHeaderHeight, setMarketHeaderHeight] = useState(72);
  const [activeMenuDepartment, setActiveMenuDepartment] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [catalogToolsOpen, setCatalogToolsOpen] = useState(false);
  const marketNavRef = useRef<HTMLElement>(null);
  const catalogSearchInputRef = useRef<HTMLInputElement>(null);
  const departmentsDialogRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const departmentsMenuButtonRef = useRef<HTMLButtonElement>(null);
  const departmentsMenuCloseRef = useRef<HTMLButtonElement>(null);
  const isDark = themeChoice === "dark" || (themeChoice === "system" && systemPrefersDark);
  const normalizedQuery = searchQuery
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
  const marketProducts: MarketProduct[] = catalog.map((product) => {
    const departmentName = getDepartmentName(product.categoryName);
    const price = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(product.price);
    const pricePerKilogram = /kg|kilogram/i.test(product.unitName);
    return {
      id: product.id,
      name: product.name,
      price: pricePerKilogram ? `${price} / kg` : price,
      badge: product.isPromotion ? "PROMO" : undefined,
      artwork: getProductArtwork(departmentName),
      imageUrl: product.imageUrl,
      categoryPath: product.categoryName,
      departmentId: getDepartmentId(departmentName),
      departmentName,
    };
  });
  const productsByDepartment = new Map<string, MarketProduct[]>();
  for (const product of marketProducts) {
    const products = productsByDepartment.get(product.departmentId) || [];
    products.push(product);
    productsByDepartment.set(product.departmentId, products);
  }
  const departments = [...productsByDepartment.entries()]
    .map(([id, products]) => ({
      id,
      name: products[0].departmentName,
      description: `${products.length} produit${products.length > 1 ? "s" : ""} disponible${products.length > 1 ? "s" : ""}.`,
      color: "green",
      art: getDepartmentArtwork(products[0].departmentName),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "fr"))
    .map((department, index) => ({
      ...department,
      color: DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length],
    }));
  const filteredProducts = marketProducts.filter((product) => {
    if (selectedDepartment && product.departmentId !== selectedDepartment) return false;
    if (selectedSubcategory && !product.categoryPath?.startsWith(`${selectedSubcategory} /`) && product.categoryPath !== selectedSubcategory) {
      return false;
    }
    if (!normalizedQuery) return true;
    const searchableText = `${product.name} ${product.departmentName}`
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr");
    return searchableText.includes(normalizedQuery);
  });
  const sortedProducts = [...filteredProducts].sort((left, right) => {
    if (productSort === "price-asc" || productSort === "price-desc") {
      const priceDifference =
        (getMarketPriceAmount(left.price) ?? 0) - (getMarketPriceAmount(right.price) ?? 0);
      if (priceDifference !== 0) return productSort === "price-asc" ? priceDifference : -priceDifference;
    }
    return left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
  });
  const totalPages = Math.ceil(sortedProducts.length / MARKET_PAGE_SIZE);
  const page = Math.min(currentPage, Math.max(totalPages, 1));
  const pageProducts = sortedProducts.slice((page - 1) * MARKET_PAGE_SIZE, page * MARKET_PAGE_SIZE);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => Math.max(1, Math.min(totalPages - 4, page - 2)) + index,
  );
  const firstProductNumber = sortedProducts.length ? (page - 1) * MARKET_PAGE_SIZE + 1 : 0;
  const lastProductNumber = Math.min(page * MARKET_PAGE_SIZE, sortedProducts.length);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasActiveCatalogFilters = Boolean(searchQuery.trim() || selectedDepartment || selectedSubcategory);

  const getDepartmentSubcategories = (departmentId: string): MarketSubcategory[] => {
    const products = productsByDepartment.get(departmentId) || [];
    const subcategories = new Map<string, MarketSubcategory>();
    for (const product of products) {
      const path = product.categoryPath?.split("/").map((part) => part.trim()).filter(Boolean) ?? [];
      if (path.length < 2) continue;
      const categoryPath = path.slice(0, 2).join(" / ");
      const existing = subcategories.get(categoryPath);
      if (existing) {
        existing.productCount += 1;
      } else {
        subcategories.set(categoryPath, { path: categoryPath, name: path[1], productCount: 1 });
      }
    }
    return [...subcategories.values()].sort((left, right) => left.name.localeCompare(right.name, "fr"));
  };

  const activeMenuDepartmentData = departments.find((department) => department.id === activeMenuDepartment);
  const activeMenuSubcategories = activeMenuDepartmentData
    ? getDepartmentSubcategories(activeMenuDepartmentData.id)
    : [];

  const openDepartmentsMenu = () => {
    setMobileMenuOpen(false);
    setActiveMenuDepartment("");
    setDepartmentsMenuOpen(true);
  };

  const closeDepartmentsMenu = () => {
    setDepartmentsMenuOpen(false);
    if (window.matchMedia("(max-width: 760px)").matches) {
      mobileMenuButtonRef.current?.focus();
    } else {
      departmentsMenuButtonRef.current?.focus();
    }
  };

  const selectDepartment = (departmentId: string) => {
    setDepartmentsMenuOpen(false);
    setMobileMenuOpen(false);
    setSelectedDepartment(departmentId);
    setSelectedSubcategory("");
    setCurrentPage(1);
    window.requestAnimationFrame(() => {
      document.getElementById("market-products")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  const selectSubcategory = (departmentId: string, categoryPath: string) => {
    setDepartmentsMenuOpen(false);
    setMobileMenuOpen(false);
    setSelectedDepartment(departmentId);
    setSelectedSubcategory(categoryPath);
    setCurrentPage(1);
    window.requestAnimationFrame(() => {
      document.getElementById("market-products")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  };

  useEffect(() => {
    if (!departmentsMenuOpen) return;

    const scrollY = window.scrollY;
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyStyles = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    root.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    departmentsMenuCloseRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDepartmentsMenu();
      if (event.key !== "Tab") return;

      const focusableElements = departmentsDialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.left = previousBodyStyles.left;
      body.style.right = previousBodyStyles.right;
      body.style.width = previousBodyStyles.width;
      body.style.overflow = previousBodyStyles.overflow;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [departmentsMenuOpen]);

  useEffect(() => {
    const nav = marketNavRef.current;
    if (!nav) return;

    const updateHeaderHeight = () => setMarketHeaderHeight(nav.getBoundingClientRect().height);
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  const clearCatalogFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("");
    setSelectedSubcategory("");
    setCurrentPage(1);
  };

  const goToPage = (nextPage: number) => {
    setCurrentPage(nextPage);
    document.getElementById("market-products")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  };

  const getCartQuantity = (departmentId: string, productName: string) =>
    cartItems.find((item) => item.id === getMarketProductId(departmentId, productName))?.quantity ?? 0;

  const addProduct = (departmentId: string, departmentName: string, product: MarketProduct) => {
    const unitPrice = getMarketPriceAmount(product.price);
    if (unitPrice === null) return;
    const item: MarketCartItemInput = {
      departmentId,
      departmentName,
      name: product.name,
      image: product.imageUrl,
      priceLabel: product.price.replace(/\s*\/\s*kg\b/i, ""),
      unitPrice,
      priceUnit: /\/\s*kg\b/i.test(product.price) ? "kg" : "unité",
    };
    addItem(item);
  };

  useEffect(() => {
    const controller = new AbortController();
    const cachedProducts = readMarketCatalogCache();
    if (cachedProducts) {
      setCatalog(cachedProducts);
      setCatalogLoading(false);
    } else {
      setCatalogLoading(true);
    }
    setCatalogError(null);

    fetch("/api/market/products", { signal: controller.signal })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Impossible de charger les produits.";
          throw new Error(message);
        }
        if (!isMarketApiResponse(payload)) {
          throw new Error("La réponse du catalogue est invalide.");
        }
        setCatalog(payload.products);
        writeMarketCatalogCache(payload.products);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.error("[Market] Product catalog could not be loaded:", error);
        setCatalogError(error instanceof Error ? error.message : "Impossible de charger les produits.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });

    return () => controller.abort();
  }, [catalogRetry]);

  useIsomorphicLayoutEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let savedTheme: string | null = null;
    try {
      savedTheme = window.localStorage.getItem("fisafi-market-theme");
    } catch (error) {
      console.warn("[Market] Theme preference could not be read:", error);
    }
    const initialChoice =
      savedTheme === "dark" || savedTheme === "light" ? savedTheme : "system";
    setThemeChoice(initialChoice);
    setSystemPrefersDark(media.matches);
    document.documentElement.setAttribute(
      "data-market-theme",
      initialChoice === "dark" || (initialChoice === "system" && media.matches) ? "dark" : "light",
    );

    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
      if (initialChoice === "system") {
        document.documentElement.setAttribute("data-market-theme", event.matches ? "dark" : "light");
      }
    };
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", updateSystemTheme);
      return () => media.removeEventListener("change", updateSystemTheme);
    }
    media.addListener(updateSystemTheme);
    return () => media.removeListener(updateSystemTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    window.localStorage.setItem("fisafi-market-theme", nextTheme);
    document.documentElement.setAttribute("data-market-theme", nextTheme);
    setThemeChoice(nextTheme);
  };

  const departmentsMenu = departmentsMenuOpen ? (
    <div
      className={`market-departments-modal${isDark ? " is-dark" : ""}${activeMenuDepartmentData ? "" : " is-submenu-empty"}`}
      style={{
        "--market-departments-modal-top": `${marketHeaderHeight}px`,
        "--market-orange": "#ff7417",
      } as React.CSSProperties}
      role="dialog"
      aria-modal="true"
      aria-labelledby="market-departments-drawer-title"
      ref={departmentsDialogRef}
    >
      <button
        className="market-departments-backdrop"
        type="button"
        onClick={closeDepartmentsMenu}
        aria-label="Fermer le menu des rayons"
        tabIndex={-1}
      />
      <div
        className="market-departments-content"
        onMouseLeave={() => setActiveMenuDepartment("")}
      >
        <section className="market-departments-drawer">
          <div className="market-departments-drawer-heading">
            <h2 id="market-departments-drawer-title">Tous les rayons</h2>
          </div>
          <nav className="market-departments-drawer-list" aria-label="Choisir un rayon">
            <button
              className={`market-departments-drawer-item${selectedDepartment ? "" : " is-selected"}`}
              type="button"
              aria-pressed={!selectedDepartment}
              onMouseEnter={() => setActiveMenuDepartment("")}
              onClick={() => selectDepartment("")}
            >
              <span className="market-departments-drawer-icon market-departments-drawer-icon--all" aria-hidden="true">
                <svg viewBox="0 0 48 48" fill="none">
                  <path d="M8 20h32l-3 20H11L8 20Z" />
                  <path d="m13 20 5-11h12l5 11M18 9l6 11 6-11M17 27v7m7-7v7m7-7v7" />
                </svg>
              </span>
              <span className="market-departments-drawer-copy">
                <strong>Tous les produits</strong>
                <small>{marketProducts.length} produits</small>
              </span>
              <span className="market-departments-drawer-arrow" aria-hidden="true">›</span>
            </button>
            {departments.map((department) => {
              const departmentProducts = productsByDepartment.get(department.id) || [];
              const representativeProduct = departmentProducts.find((product) => product.imageUrl);
              return (
                <button
                  className={`market-departments-drawer-item${selectedDepartment === department.id ? " is-selected" : ""}${activeMenuDepartment === department.id ? " is-active" : ""}`}
                  type="button"
                  key={department.id}
                  aria-pressed={selectedDepartment === department.id}
                  aria-current={activeMenuDepartment === department.id ? "true" : undefined}
                  onMouseEnter={() => setActiveMenuDepartment(department.id)}
                  onFocus={() => setActiveMenuDepartment(department.id)}
                  onClick={() => {
                    if (window.matchMedia("(max-width: 760px)").matches) {
                      setActiveMenuDepartment(department.id);
                    } else {
                      selectDepartment(department.id);
                    }
                  }}
                >
                  <span className={`market-departments-drawer-icon market-departments-drawer-icon--${department.color}`} aria-hidden="true">
                    {representativeProduct ? (
                      <MarketMenuImage
                        src={representativeProduct.imageUrl}
                        artwork={representativeProduct.artwork}
                      />
                    ) : (
                      <ProductIllustration artwork={getProductArtwork(department.name)} />
                    )}
                  </span>
                  <span className="market-departments-drawer-copy">
                    <strong>{department.name}</strong>
                    <small>{departmentProducts.length} produits</small>
                  </span>
                  <span className="market-departments-drawer-arrow" aria-hidden="true">›</span>
                </button>
              );
            })}
          </nav>
        </section>
        <aside
          className="market-departments-submenu"
          aria-label={activeMenuDepartmentData ? `Contenu du rayon ${activeMenuDepartmentData.name}` : "Contenu du rayon"}
        >
          {activeMenuDepartmentData && (
            <>
              <header className="market-departments-submenu-heading">
                <button
                  className="market-departments-submenu-back"
                  type="button"
                  onClick={() => setActiveMenuDepartment("")}
                  aria-label="Retour à la liste des rayons"
                >
                  ←
                </button>
                <span className="market-departments-submenu-icon" aria-hidden="true">
                  {(() => {
                    const representativeProduct = productsByDepartment.get(activeMenuDepartmentData.id)?.find((product) => product.imageUrl);
                    return representativeProduct ? (
                      <MarketMenuImage
                        src={representativeProduct.imageUrl}
                        artwork={representativeProduct.artwork}
                      />
                    ) : (
                      <ProductIllustration artwork={getProductArtwork(activeMenuDepartmentData.name)} />
                    );
                  })()}
                </span>
                <span>
                  <strong>{activeMenuDepartmentData.name}</strong>
                  <button
                    type="button"
                    className="market-departments-submenu-all"
                    onClick={() => selectDepartment(activeMenuDepartmentData.id)}
                  >
                    Voir tous les produits
                  </button>
                </span>
              </header>
              {activeMenuSubcategories.length > 0 ? (
                <nav className="market-departments-submenu-list" aria-label={`Sous-rayons de ${activeMenuDepartmentData.name}`}>
                  {activeMenuSubcategories.map((subcategory) => (
                    <button
                      className={`market-departments-submenu-item${selectedSubcategory === subcategory.path ? " is-selected" : ""}`}
                      key={subcategory.path}
                      type="button"
                      onClick={() => selectSubcategory(activeMenuDepartmentData.id, subcategory.path)}
                    >
                      <span>{subcategory.name}</span>
                      <small>{subcategory.productCount}</small>
                    </button>
                  ))}
                </nav>
              ) : (
                <div className="market-departments-submenu-products">
                  <p>Produits du rayon</p>
                  {(productsByDepartment.get(activeMenuDepartmentData.id) || []).slice(0, 6).map((product) => (
                    <button
                      className="market-departments-submenu-product"
                      type="button"
                      key={product.id}
                      onClick={() => selectDepartment(activeMenuDepartmentData.id)}
                    >
                      <MarketMenuImage src={product.imageUrl} artwork={product.artwork} />
                      <span>{product.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  ) : null;

  return (
    <>
      <Head>
        <title>FiSAFi Market — Le marché du quotidien</title>
        <meta
          name="description"
          content="Explorez les rayons FiSAFi Market : produits frais, épicerie, boulangerie, boissons et essentiels de la maison."
        />
      </Head>

      <nav
        className={`market-store-nav${isDark ? " is-dark" : ""}`}
        suppressHydrationWarning
        aria-label="Navigation Market"
        ref={marketNavRef}
        style={{ "--market-header-height": `${marketHeaderHeight}px` } as React.CSSProperties}
      >
          <Link href="/" className="market-wordmark" aria-label="FiSAFi Market, accueil">
            <svg className="market-wordmark-icon" viewBox="0 0 40 40" aria-hidden="true">
              <defs>
                <linearGradient id="mk-bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#4a1ee8" />
                  <stop offset="1" stopColor="#250bb8" />
                </linearGradient>
              </defs>
              <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#mk-bg)" />
              <rect x="1" y="1" width="38" height="38" rx="11" fill="none" stroke="rgba(255,255,255,.16)" />
              <text x="20" y="28" textAnchor="middle" fontFamily="Cormorant Garamond, Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="22" fill="#fffdf6">F</text>
              <circle cx="30" cy="30" r="2.2" fill="#ff7417" />
            </svg>
            <span>
              FiSAFi <strong>Market</strong>
            </span>
          </Link>

          <button
            className="market-mobile-menu-toggle"
            type="button"
            onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
            aria-controls="market-mobile-actions"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fermer le menu principal" : "Ouvrir le menu principal"}
            ref={mobileMenuButtonRef}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {mobileMenuOpen ? (
                <path d="m6 6 12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>

          <div
            className={`market-header-actions${mobileMenuOpen ? " is-open" : ""}`}
            id="market-header-actions"
          >
            <button
              className={`market-rayons-link${departmentsMenuOpen ? " is-open" : ""}`}
              type="button"
              onClick={() => (departmentsMenuOpen ? closeDepartmentsMenu() : openDepartmentsMenu())}
              aria-haspopup="dialog"
              aria-expanded={departmentsMenuOpen}
              aria-label={departmentsMenuOpen ? "Quitter le menu des rayons" : "Afficher les rayons"}
              ref={departmentsMenuButtonRef}
            >
              Rayons
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {departmentsMenuOpen ? (
                  <path d="m6 6 12 12M18 6 6 18" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" />
                )}
              </svg>
            </button>

            <div className="market-nav-right">
              <span
                className={`market-status${status.open ? " is-open" : " is-closed"}`}
                aria-live="polite"
              >
                <i aria-hidden="true" />
                <b>{status.label}</b>
                <em>· {status.detail}</em>
              </span>

              <button
                className="market-theme-toggle"
                type="button"
                onClick={toggleTheme}
                aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
                aria-pressed={isDark}
                title={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
              >
                <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
                <span className="market-theme-toggle-label">{isDark ? "Clair" : "Sombre"}</span>
              </button>

              <Link
                className="market-cart-link"
                href="/market/commande"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={`Ouvrir le panier, ${cartItems.length} références et une quantité totale de ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(cartCount)}`}
              >
                <span className="market-cart-icon" aria-hidden="true">▱</span>
                <span className="market-cart-label">Panier</span>
                <b>{cartReady ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(cartCount) : "…"}</b>
              </Link>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="market-mobile-menu-panel" id="market-mobile-actions">
              <nav className="market-mobile-menu-list" aria-label="Rayons du marché">
                <button
                  className={`market-mobile-menu-item${selectedDepartment ? "" : " is-selected"}`}
                  type="button"
                  onClick={() => selectDepartment("")}
                >
                  <span className="market-departments-drawer-icon market-departments-drawer-icon--all" aria-hidden="true">
                    <svg viewBox="0 0 48 48" fill="none">
                      <path d="M8 20h32l-3 20H11L8 20Z" />
                      <path d="m13 20 5-11h12l5 11M18 9l6 11 6-11M17 27v7m7-7v7m7-7v7" />
                    </svg>
                  </span>
                  <span className="market-mobile-menu-copy">
                    <strong>Tous les produits</strong>
                    <small>{marketProducts.length} produits</small>
                  </span>
                  <span className="market-mobile-menu-arrow" aria-hidden="true">›</span>
                </button>
                {departments.map((department) => {
                  const departmentProducts = productsByDepartment.get(department.id) || [];
                  const representativeProduct = departmentProducts.find((product) => product.imageUrl);
                  const subcategories = getDepartmentSubcategories(department.id);
                  const isExpanded = activeMenuDepartment === department.id;
                  return (
                    <div className="market-mobile-menu-group" key={department.id}>
                      <button
                        className={`market-mobile-menu-item${selectedDepartment === department.id ? " is-selected" : ""}${isExpanded ? " is-expanded" : ""}`}
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setActiveMenuDepartment(isExpanded ? "" : department.id)}
                      >
                        <span className={`market-departments-drawer-icon market-departments-drawer-icon--${department.color}`} aria-hidden="true">
                          {representativeProduct ? (
                            <MarketMenuImage
                              src={representativeProduct.imageUrl}
                              artwork={representativeProduct.artwork}
                            />
                          ) : (
                            <ProductIllustration artwork={getProductArtwork(department.name)} />
                          )}
                        </span>
                        <span className="market-mobile-menu-copy">
                          <strong>{department.name}</strong>
                          <small>{departmentProducts.length} produits</small>
                        </span>
                        <svg className="market-mobile-menu-arrow" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>
                      {isExpanded && (
                        <div className="market-mobile-submenu">
                          <button
                            className="market-mobile-submenu-all"
                            type="button"
                            onClick={() => selectDepartment(department.id)}
                          >
                            Voir tous les produits
                          </button>
                          {subcategories.map((subcategory) => (
                            <button
                              className={`market-mobile-submenu-item${selectedSubcategory === subcategory.path ? " is-selected" : ""}`}
                              type="button"
                              key={subcategory.path}
                              onClick={() => selectSubcategory(department.id, subcategory.path)}
                            >
                              <span>{subcategory.name}</span>
                              <small>{subcategory.productCount}</small>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>
            </div>
          )}
      </nav>
      <main
        className="market-page"
        data-theme={isDark ? "dark" : "light"}
        suppressHydrationWarning
        style={{ paddingTop: `${marketHeaderHeight}px` }}
      >
        {storageError && <p className="market-cart-storage-error" role="alert">{storageError}</p>}

        <MarketStore isMarketOpen={status.open} />

        {/* ═══ RAYONS ═══ */}
        <section className="market-departments" id="rayons" aria-labelledby="market-departments-title">
          <div className="market-section-heading">
            <div>
              <p className="market-kicker">LE MARCHÉ DU QUOTIDIEN</p>
              <h2 id="market-departments-title">Choisissez vos envies.</h2>
            </div>
          </div>



          <div className="market-catalog-tools">
            <button
              className={`market-catalog-search-toggle${searchQuery ? " has-query" : ""}`}
              type="button"
              aria-controls={catalogToolsOpen ? "market-catalog-tool-panel" : undefined}
              aria-expanded={catalogToolsOpen}
              aria-label={catalogToolsOpen ? "Masquer la recherche et les filtres" : "Afficher la recherche et les filtres"}
              onClick={() => {
                const willOpen = !catalogToolsOpen;
                setCatalogToolsOpen(willOpen);
                if (willOpen) {
                  window.requestAnimationFrame(() => catalogSearchInputRef.current?.focus());
                }
              }}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
              <span>Rechercher</span>
            </button>
            {catalogToolsOpen && (
              <div className="market-catalog-tool-panel" id="market-catalog-tool-panel">
                <label className="market-search-field">
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="10.8" cy="10.8" r="6.8" />
                    <path d="m16 16 5 5" />
                  </svg>
                  <input
                    ref={catalogSearchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(event) => {
                      setSearchQuery(event.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Rechercher un produit ou un rayon…"
                    aria-label="Rechercher un produit ou un rayon"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setCurrentPage(1);
                      }}
                    >
                      Effacer
                    </button>
                  )}
                </label>
                <div className="market-catalog-options">
                  <label className="market-catalog-control">
                    <span>Trier par</span>
                    <select
                      value={productSort}
                      onChange={(event) => {
                        setProductSort(event.target.value as ProductSort);
                        setCurrentPage(1);
                      }}
                      aria-label="Trier les produits"
                    >
                      <option value="name-asc">Nom (A à Z)</option>
                      <option value="price-asc">Prix croissant</option>
                      <option value="price-desc">Prix décroissant</option>
                    </select>
                  </label>
                </div>
              </div>
            )}
          </div>

          {catalogError && (
            <div className="market-search-results" role="alert">
              <p>{catalog.length ? "Le catalogue affiché est en cache. " : ""}{catalogError}</p>
              <button type="button" onClick={() => setCatalogRetry((retry) => retry + 1)}>
                Réessayer
              </button>
            </div>
          )}

          {catalogLoading ? (
            <p className="market-search-count" role="status">Chargement du catalogue du magasin…</p>
          ) : (!catalogError || catalog.length > 0) && (
            <div className="market-search-results" aria-live="polite">
              <div className="market-results-toolbar">
                <div className="market-results-title">
                  <h3>
                    {selectedSubcategory.split("/").pop()?.trim() ||
                      departments.find((department) => department.id === selectedDepartment)?.name ||
                      "Tous les produits"}
                  </h3>
                  <p className="market-search-count">
                    {sortedProducts.length
                      ? `${firstProductNumber}–${lastProductNumber} sur ${sortedProducts.length} produits`
                      : normalizedQuery ? "Aucun produit trouvé." : "Aucun produit dans ce rayon."}
                  </p>
                </div>
                {hasActiveCatalogFilters && (
                  <button className="market-clear-filters" type="button" onClick={clearCatalogFilters}>
                    Effacer les filtres
                  </button>
                )}
              </div>
              {pageProducts.length > 0 && (
                <div className="market-product-grid" id="market-products">
                  {pageProducts.map((product) => (
                    <MarketProductCard
                      key={product.id}
                      product={product}
                      departmentName={product.departmentName}
                      cartQuantity={getCartQuantity(product.departmentId, product.name)}
                      onAddToCart={() => addProduct(product.departmentId, product.departmentName, product)}
                      onSetQuantity={(quantity) => setQuantity(
                        getMarketProductId(product.departmentId, product.name),
                        quantity,
                      )}
                    />
                  ))}
                </div>
              )}
              {!pageProducts.length && hasActiveCatalogFilters && (
                <div className="market-empty-state">
                  <span aria-hidden="true">⌕</span>
                  <h3>Aucun produit ne correspond</h3>
                  <p>Essayez un autre terme ou réinitialisez vos filtres.</p>
                  <button type="button" onClick={clearCatalogFilters}>Voir tout le catalogue</button>
                </div>
              )}
              {totalPages > 1 && (
                <nav className="market-pagination" aria-label="Pages du catalogue">
                  <button
                    type="button"
                    className="market-pagination-step"
                    onClick={() => goToPage(page - 1)}
                    disabled={page === 1}
                    aria-label="Page précédente"
                  >
                    ← Précédent
                  </button>
                  <div className="market-pagination-numbers">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        className={pageNumber === page ? "is-current" : ""}
                        aria-current={pageNumber === page ? "page" : undefined}
                        onClick={() => goToPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="market-pagination-step"
                    onClick={() => goToPage(page + 1)}
                    disabled={page === totalPages}
                    aria-label="Page suivante"
                  >
                    Suivant →
                  </button>
                </nav>
              )}
            </div>
          )}
        </section>

        {/* ═══ HORAIRES + ADRESSE ═══ */}
        <section className="market-infos" id="infos-market" aria-label="Horaires et adresse">
          <div className="market-info-card">
            <p className="market-kicker">HORAIRES</p>
            <h2>Quand nous trouver.</h2>
            <ul className="market-hours">
              {HOURS.map((h) => (
                <li key={h.day}>
                  <span>{h.day}</span>
                  <b>{h.time}</b>
                </li>
              ))}
            </ul>
          </div>

          <div className="market-info-card market-info-card--address">
            <div className="market-address-content">
              <p className="market-kicker">ADRESSE</p>
              <h2>Nous rendre visite.</h2>
              <address>
                <strong>FiSAFi Market</strong><br />
                Liberté 6 Extension<br />
                Dakar · Sénégal
              </address>
              <div className="market-info-actions">
                <a
                  className="market-info-btn"
                  href="https://www.google.com/maps/search/?api=1&query=FiSAFi%20Market%2C%20Libert%C3%A9%206%20Extension%2C%20Dakar%2C%20S%C3%A9n%C3%A9gal"
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir la carte <span aria-hidden="true">↗</span>
                </a>
                <a
                  className="market-info-btn market-info-btn--ghost"
                  href="https://wa.me/221787812297?text=Salam%20FiSAFi%20Market%20!"
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </div>
            </div>
            <div className="market-location-map">
              <iframe
                title="Carte de FiSAFi Market à Liberté 6 Extension, Dakar"
                src="https://maps.google.com/maps?q=FiSAFi%20Market%2C%20Libert%C3%A9%206%20Extension%2C%20Dakar%2C%20S%C3%A9n%C3%A9gal&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </section>

        {/* ═══ APPEL ═══ */}

      </main>
      {departmentsMenu}
      <Footer />
    </>
  );
}