import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Head from "next/head";
import Link from "next/link";
import Header from "@/components/Header";
import MarketStore from "@/components/MarketStore";
import Footer from "@/components/Footer";
import useMarketCart from "@/hooks/useMarketCart";
import {
  getMarketDepartmentId,
  getMarketDepartmentName,
  getMarketPriceAmount,
  getMarketProductId,
  MARKET_CART_MAX_QUANTITY,
} from "@/lib/marketCart";
import type { MarketCartItemInput } from "@/lib/marketCart";

/* ═══════════════ TYPES ═══════════════ */

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
  hasImage: boolean;
  imageUrl: string;
  isPromotion: boolean;
  availableQuantity: number;
  variantChoiceRequired: boolean;
};

type MarketProduct = {
  id: number;
  name: string;
  price: string;
  badge?: "PROMO";
  artwork: ProductArtwork;
  hasImage: boolean;
  imageUrl: string;
  categoryPath: string | null;
  departmentId: string;
  departmentName: string;
  availableQuantity: number;
  variantChoiceRequired: boolean;
};

type ProductArtwork = "produce" | "pantry" | "bakery" | "drink" | "fresh" | "home";
type ThemeChoice = "system" | "light" | "dark";
type ProductSort = "name-asc" | "price-asc" | "price-desc";
type MarketSubcategory = { path: string; name: string; productCount: number };

/* ═══════════════ CONSTANTES ═══════════════ */

const DEPARTMENT_COLORS = ["green", "orange", "gold", "blue", "pink", "purple"] as const;
const MARKET_PAGE_SIZE = 24;
const MARKET_CATALOG_CACHE_KEY = "fisafi-market-catalog-v5";
const MARKET_CATALOG_MAX_STALE_MS = 7 * 24 * 60 * 60 * 1000;
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const marketCheckoutUrl = process.env.NEXT_PUBLIC_FISAFI_MARKET_URL
  ? `${process.env.NEXT_PUBLIC_FISAFI_MARKET_URL.replace(/\/$/, "")}/commande`
  : "/market/commande";

const HOURS = [{ day: "Tous les jours", time: "7h – 00h" }];

/* ═══════════════ HELPERS ═══════════════ */

function getDepartmentArtwork(name: string): Department["art"] {
  if (/fruit|l[eé]gume/i.test(name)) return "produce";
  if (/boulangerie|p[aâ]tisserie/i.test(name)) return "bakery";
  if (/boisson|eau|jus/i.test(name)) return "drinks";
  if (/frais|lait|fromage/i.test(name)) return "fresh";
  if (/bonbon|biscuit|chips|cuisine|food|[eé]picerie/i.test(name)) return "pantry";
  return "home";
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
        typeof candidate.hasImage === "boolean" &&
        typeof candidate.imageUrl === "string" &&
        typeof candidate.isPromotion === "boolean" &&
        typeof candidate.availableQuantity === "number" &&
        Number.isFinite(candidate.availableQuantity) &&
        candidate.availableQuantity >= 0 &&
        typeof candidate.variantChoiceRequired === "boolean"
      );
    })
  );
}

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

const fmt = (value: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);

/* Script inline : pose le thème avant le premier paint (zéro FOUC). */
const MARKET_THEME_BOOTSTRAP = `(function(){try{
  var t=localStorage.getItem("fisafi-market-theme");
  var d=window.matchMedia("(prefers-color-scheme: dark)").matches;
  var v=(t==="dark"||t==="light")?t:(d?"dark":"light");
  document.documentElement.setAttribute("data-market-theme",v);
}catch(e){}})();`;

/* ═══════════════ HOOK : statut ouvert/fermé ═══════════════ */

function useOpenStatus() {
  const [status, setStatus] = useState({ open: true, label: "Ouvert", detail: "ferme à minuit" });

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const total = now.getHours() * 60 + now.getMinutes();
      if (total >= 7 * 60 && total < 24 * 60) {
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

/* ═══════════════ ILLUSTRATIONS SVG ═══════════════ */

function DepartmentIllustration({
  art,
}: {
  art: "produce" | "pantry" | "bakery" | "drinks" | "fresh" | "home";
}) {
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
          <path
            d="M82 106h22m-22 7h15m24-12h26m-26 8h20"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
            opacity=".8"
          />
        </>
      )}
      {art === "bakery" && (
        <>
          <path
            d="M59 116c0-21 13-38 33-46 5-18 23-28 43-22 11 3 19 12 21 23 15 9 25 26 25 45v14H59v-14Z"
            fill="#D7954C"
          />
          <path
            d="M97 73c-2 12 3 23 11 30m18-56c-4 12-2 23 5 33m20-9c-4 12-1 23 6 33"
            stroke="#F7D49B"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path d="M56 132h132" stroke="#A76735" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {art === "drinks" && (
        <>
          <path d="M79 60h27v12l8 9v64H71V81l8-9V60Z" fill="#B894FF" />
          <path d="M79 60h27v12H79z" fill="#F6F0DD" />
          <path d="M72 103h42v25H72z" fill="#F1E9FF" opacity=".94" />
          <path d="M139 52h26v14l7 9v70h-40V75l7-9V52Z" fill="#D7954C" />
          <path d="M139 52h26v14h-26z" fill="#F6F0DD" />
          <path d="M132 101h40v27h-40z" fill="#F9E5AF" opacity=".9" />
          <path
            d="M84 113c8-9 18-9 27 0m28 0c8-9 18-9 27 0"
            stroke="#fff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      )}
      {art === "fresh" && (
        <>
          <path d="M71 81h98l-9 70H80l-9-70Z" fill="#F5F1E7" />
          <path d="M78 91h84l-6 47H84l-6-47Z" fill="#E9C8A4" />
          <path
            d="M92 80c-5-18 7-31 23-28 11 2 15 15 9 28m12 0c-2-18 10-28 25-23 10 4 11 16 3 24"
            stroke="#5B9A64"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M97 109c8-9 16-9 24 0m12 0c8-9 16-9 24 0"
            stroke="#FFF9EC"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path d="M74 83h92" stroke="#D6B990" strokeWidth="5" strokeLinecap="round" />
        </>
      )}
      {art === "home" && (
        <>
          <path d="M75 90h90l-8 60H83l-8-60Z" fill="#B894FF" />
          <path d="M88 76h64v18H88z" fill="#F6F2E9" />
          <path d="M96 75c0-15 9-25 24-25s24 10 24 25" stroke="#F6F2E9" strokeWidth="8" />
          <path
            d="M97 110h46m-42 12h38"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".85"
          />
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
          <path
            d="M54 114c0-23 17-41 39-48 7-19 25-27 45-20 11 4 18 12 19 22 17 9 28 26 28 46v16H54Z"
            fill="#d7954c"
          />
          <path
            d="M96 72c-2 12 3 22 11 30m19-55c-4 12-2 23 5 33m20-9c-4 12-1 23 6 33"
            stroke="#f7d49b"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </>
      )}
      {artwork === "drink" && (
        <>
          <path d="M79 48h28v13l8 10v70H71V71l8-10V48Z" fill="#B894FF" />
          <path d="M79 48h28v13H79z" fill="#f6f0dd" />
          <path d="M72 96h43v27H72z" fill="#f1e9ff" />
          <path d="M143 59h26v13l7 9v60h-40V81l7-9V59Z" fill="#d7954c" />
          <path d="M136 100h40v26h-40z" fill="#f9e5af" />
        </>
      )}
      {artwork === "fresh" && (
        <>
          <path d="M63 72h114l-10 77H73L63 72Z" fill="#f5f1e7" />
          <path d="M74 86h92l-7 52H81l-7-52Z" fill="#e9c8a4" />
          <path
            d="M87 76c-5-18 7-31 23-28 11 2 15 15 9 28m12 0c-2-18 10-28 25-23 10 4 11 16 3 24"
            stroke="#5b9a64"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </>
      )}
      {artwork === "home" && (
        <>
          <path d="M66 74h108l-9 76H75l-9-76Z" fill="#B894FF" />
          <path d="M82 58h76v20H82z" fill="#f6f2e9" />
          <path d="M91 57c0-17 11-27 29-27s29 10 29 27" stroke="#f6f2e9" strokeWidth="8" />
          <path
            d="M91 101h58m-53 14h47"
            stroke="#fff"
            strokeWidth="4"
            strokeLinecap="round"
            opacity=".85"
          />
        </>
      )}
    </svg>
  );
}

function ProductArtworkView({ product }: { product: MarketProduct }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [imageObjectPosition, setImageObjectPosition] = useState("center");
  if (imageFailed) return <ProductIllustration artwork={product.artwork} />;

  return (
    <img
      className="market-product-image"
      src={product.imageUrl}
      alt={product.name}
      loading="lazy"
      decoding="async"
      style={{ objectPosition: imageObjectPosition }}
      onLoad={(event) => {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        if (!naturalWidth || !naturalHeight) return;
        const aspectRatio = naturalWidth / naturalHeight;
        setImageObjectPosition(
          aspectRatio < 0.78 ? "center 18%" : aspectRatio < 1 ? "center 34%" : "center",
        );
      }}
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

/* ═══════════════ CARTE PRODUIT ═══════════════ */

function MarketProductCard({
  product,
  departmentName,
  cartQuantity,
  onShowDetails,
  onAddToCart,
  onSetQuantity,
}: {
  product: MarketProduct;
  departmentName: string;
  cartQuantity: number;
  onShowDetails: () => void;
  onAddToCart: (quantity: number) => void;
  onSetQuantity: (quantity: number) => void;
}) {
  const unitPrice = getMarketPriceAmount(product.price);
  const priceUnit = /\/\s*kg\b/i.test(product.price) ? "kg" : "unité";
  const step = priceUnit === "kg" ? 0.5 : 1;
  const firstQuantity =
    priceUnit === "kg"
      ? Math.min(1, Math.floor(product.availableQuantity / step) * step)
      : 1;
  const canAdd = product.availableQuantity >= firstQuantity && firstQuantity > 0;

  const stockLabel = product.variantChoiceRequired
    ? "Variante requise"
    : product.availableQuantity > 0
      ? `Dispo. ${fmt(product.availableQuantity)}${priceUnit === "kg" ? " kg" : ""}`
      : "Indisponible";

  return (
    <article className="market-product-card">
      <button
        className="market-product-visual market-product-details-trigger"
        type="button"
        onClick={onShowDetails}
        aria-label={`Voir le détail de ${product.name}`}
      >
        {product.badge && (
          <span
            className={`market-product-badge market-product-badge--${product.badge.toLowerCase()}`}
          >
            {product.badge}
          </span>
        )}
        <ProductArtworkView product={product} />
      </button>

      <div className="market-product-info">
        <span className="market-product-department">{departmentName}</span>
        <h4>
          <button
            className="market-product-name-trigger"
            type="button"
            onClick={onShowDetails}
            aria-label={`Voir le détail de ${product.name}`}
          >
            {product.name}
          </button>
        </h4>
        <p
          className={`market-product-stock${
            product.availableQuantity <= 0 || product.variantChoiceRequired
              ? " is-unavailable"
              : ""
          }`}
        >
          {stockLabel}
        </p>

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
              <div
                className="market-product-cart-controls"
                role="group"
                aria-label={`Quantité de ${product.name} dans le panier`}
              >
                <button
                  type="button"
                  onClick={() => onSetQuantity(cartQuantity - (priceUnit === "kg" ? 0.5 : 1))}
                  aria-label={`Retirer ${priceUnit === "kg" ? "0,5 kg" : "un"} de ${product.name}`}
                >
                  −
                </button>
                <span aria-live="polite">
                  {fmt(cartQuantity)}
                  {priceUnit === "kg" ? " kg" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => onSetQuantity(cartQuantity + (priceUnit === "kg" ? 0.5 : 1))}
                  disabled={
                    product.variantChoiceRequired ||
                    cartQuantity + (priceUnit === "kg" ? 0.5 : 1) >
                      Math.min(product.availableQuantity, MARKET_CART_MAX_QUANTITY)
                  }
                  aria-label={`Ajouter ${priceUnit === "kg" ? "0,5 kg" : "un"} de ${product.name}`}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                className="market-product-add"
                type="button"
                onClick={() => onAddToCart(firstQuantity)}
                disabled={unitPrice === null || !canAdd || product.variantChoiceRequired}
                aria-label={`Ajouter ${product.name} au panier`}
              >
                {product.variantChoiceRequired ? (
                  "Contacter FiSAFi"
                ) : canAdd ? (
                  <>
                    Ajouter <span aria-hidden="true">+</span>
                  </>
                ) : (
                  "Indisponible"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ═══════════════ PAGE ═══════════════ */

export default function MarketPage() {
  const status = useOpenStatus();
  const {
    items: cartItems,
    ready: cartReady,
    storageError,
    addItem,
    setQuantity,
  } = useMarketCart();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [productSort, setProductSort] = useState<ProductSort>("name-asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [catalog, setCatalog] = useState<OdooCatalogProduct[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogRetry, setCatalogRetry] = useState(0);
  const [departmentsMenuOpen, setDepartmentsMenuOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketProduct | null>(null);
  const [marketHeaderHeight, setMarketHeaderHeight] = useState(120);
  const [activeMenuDepartment, setActiveMenuDepartment] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const [catalogToolsOpen, setCatalogToolsOpen] = useState(false);

  const catalogSearchInputRef = useRef<HTMLInputElement>(null);
  const departmentsDialogRef = useRef<HTMLDivElement>(null);
  const productDialogRef = useRef<HTMLDivElement>(null);
  const departmentsMenuButtonRef = useRef<HTMLButtonElement>(null);
  const departmentsMenuCloseRef = useRef<HTMLButtonElement>(null);
  const productDialogCloseRef = useRef<HTMLButtonElement>(null);

  const isDark = themeChoice === "dark" || (themeChoice === "system" && systemPrefersDark);

  const normalizedQuery = searchQuery
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");

  const marketProducts: MarketProduct[] = catalog.map((product) => {
    const departmentName = getMarketDepartmentName(product.categoryName);
    const price = fmt(product.price);
    const pricePerKilogram = /kg|kilogram/i.test(product.unitName);
    return {
      id: product.id,
      name: product.name,
      price: pricePerKilogram ? `${price} / kg` : price,
      badge: product.isPromotion ? "PROMO" : undefined,
      artwork: getProductArtwork(departmentName),
      hasImage: product.hasImage,
      imageUrl: product.imageUrl,
      categoryPath: product.categoryName,
      departmentId: getMarketDepartmentId(departmentName),
      departmentName,
      availableQuantity: product.availableQuantity,
      variantChoiceRequired: product.variantChoiceRequired,
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
      description: `${products.length} produit${products.length > 1 ? "s" : ""} disponible${
        products.length > 1 ? "s" : ""
      }.`,
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
    if (
      selectedSubcategory &&
      !product.categoryPath?.startsWith(`${selectedSubcategory} /`) &&
      product.categoryPath !== selectedSubcategory
    ) {
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
    if (left.hasImage !== right.hasImage) return left.hasImage ? -1 : 1;
    if (productSort === "price-asc" || productSort === "price-desc") {
      const priceDifference =
        (getMarketPriceAmount(left.price) ?? 0) - (getMarketPriceAmount(right.price) ?? 0);
      if (priceDifference !== 0)
        return productSort === "price-asc" ? priceDifference : -priceDifference;
    }
    return left.name.localeCompare(right.name, "fr", { sensitivity: "base" });
  });

  const totalPages = Math.ceil(sortedProducts.length / MARKET_PAGE_SIZE);
  const page = Math.min(currentPage, Math.max(totalPages, 1));
  const pageProducts = sortedProducts.slice(
    (page - 1) * MARKET_PAGE_SIZE,
    page * MARKET_PAGE_SIZE,
  );
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => Math.max(1, Math.min(totalPages - 4, page - 2)) + index,
  );
  const firstProductNumber = sortedProducts.length ? (page - 1) * MARKET_PAGE_SIZE + 1 : 0;
  const lastProductNumber = Math.min(page * MARKET_PAGE_SIZE, sortedProducts.length);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const hasActiveCatalogFilters = Boolean(
    searchQuery.trim() || selectedDepartment || selectedSubcategory,
  );

  const getDepartmentSubcategories = (departmentId: string): MarketSubcategory[] => {
    const products = productsByDepartment.get(departmentId) || [];
    const subcategories = new Map<string, MarketSubcategory>();
    for (const product of products) {
      const path =
        product.categoryPath?.split("/").map((part) => part.trim()).filter(Boolean) ?? [];
      if (path.length < 2) continue;
      const categoryPath = path.slice(0, 2).join(" / ");
      const existing = subcategories.get(categoryPath);
      if (existing) existing.productCount += 1;
      else subcategories.set(categoryPath, { path: categoryPath, name: path[1], productCount: 1 });
    }
    return [...subcategories.values()].sort((left, right) =>
      left.name.localeCompare(right.name, "fr"),
    );
  };

  const activeMenuDepartmentData = departments.find(
    (department) => department.id === activeMenuDepartment,
  );
  const activeMenuSubcategories = activeMenuDepartmentData
    ? getDepartmentSubcategories(activeMenuDepartmentData.id)
    : [];

  const openDepartmentsMenu = () => {
    setActiveMenuDepartment("");
    setDepartmentsMenuOpen(true);
  };

  const closeDepartmentsMenu = () => {
    setDepartmentsMenuOpen(false);
    departmentsMenuButtonRef.current?.focus();
  };

  const scrollToProducts = () => {
    window.requestAnimationFrame(() => {
      document.getElementById("market-products")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  };

  const selectDepartment = (departmentId: string) => {
    setDepartmentsMenuOpen(false);
    setSelectedDepartment(departmentId);
    setSelectedSubcategory("");
    setCurrentPage(1);
    scrollToProducts();
  };

  const selectSubcategory = (departmentId: string, categoryPath: string) => {
    setDepartmentsMenuOpen(false);
    setSelectedDepartment(departmentId);
    setSelectedSubcategory(categoryPath);
    setCurrentPage(1);
    scrollToProducts();
  };

  /* Verrouillage du scroll + focus trap */
  useEffect(() => {
    if (!departmentsMenuOpen && !selectedProduct) return;

    const scrollY = window.scrollY;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
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

    const activeDialogRef = selectedProduct ? productDialogRef : departmentsDialogRef;
    if (selectedProduct) productDialogCloseRef.current?.focus();
    else departmentsMenuCloseRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selectedProduct) setSelectedProduct(null);
        else closeDepartmentsMenu();
      }
      if (event.key !== "Tab") return;

      const focusableElements = activeDialogRef.current?.querySelectorAll<HTMLElement>(
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
      previouslyFocused?.focus();
    };
  }, [departmentsMenuOpen, selectedProduct]);

  /* Hauteur header pour la modale rayons */
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".header");
    const socialBar = document.querySelector<HTMLElement>(".header-social-flags-bar");
    if (!header || !socialBar) return;

    const updateHeaderHeight = () =>
      setMarketHeaderHeight(
        header.getBoundingClientRect().bottom + socialBar.getBoundingClientRect().height,
      );
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    observer.observe(socialBar);
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
    scrollToProducts();
  };

  const getCartQuantity = (
    departmentId: string,
    productName: string,
    odooProductId: number,
  ) =>
    cartItems.find(
      (item) => item.id === getMarketProductId(departmentId, productName, odooProductId),
    )?.quantity ?? 0;

  const addProduct = (
    departmentId: string,
    departmentName: string,
    product: MarketProduct,
    quantity = 1,
  ) => {
    const unitPrice = getMarketPriceAmount(product.price);
    if (unitPrice === null) return;
    const item: MarketCartItemInput = {
      odooProductId: product.id,
      departmentId,
      departmentName,
      name: product.name,
      image: product.imageUrl,
      priceLabel: product.price.replace(/\s*\/\s*kg\b/i, ""),
      unitPrice,
      priceUnit: /\/\s*kg\b/i.test(product.price) ? "kg" : "unité",
      quantity,
    };
    addItem(item);
  };

  /* Chargement du catalogue */
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
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
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
        setCatalogError(
          error instanceof Error ? error.message : "Impossible de charger les produits.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogLoading(false);
      });

    return () => controller.abort();
  }, [catalogRetry]);

  /* Thème : synchronisation React ↔ <html>. Le 1er paint est géré
     par MARKET_THEME_BOOTSTRAP (script bloquant dans <Head>), donc
     ici on ne fait que refléter l'état et écouter le système. */
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

    // Synchronisation défensive : si le script bloquant n'a pas tourné
    // (ex. rendu client pur après hydratation), on rattrape le coup.
    const current = document.documentElement.getAttribute("data-market-theme");
    const expected =
      initialChoice === "dark" || (initialChoice === "system" && media.matches)
        ? "dark"
        : "light";
    if (current !== expected) {
      document.documentElement.setAttribute("data-market-theme", expected);
    }

    const updateSystemTheme = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
      if (initialChoice === "system") {
        document.documentElement.setAttribute(
          "data-market-theme",
          event.matches ? "dark" : "light",
        );
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
    const root = document.documentElement;
    // Transition douce uniquement lors d'un toggle utilisateur.
    root.classList.add("theme-transitioning");
    try {
      window.localStorage.setItem("fisafi-market-theme", nextTheme);
    } catch (error) {
      console.warn("[Market] Theme preference could not be saved:", error);
    }
    root.setAttribute("data-market-theme", nextTheme);
    setThemeChoice(nextTheme);
    window.setTimeout(() => root.classList.remove("theme-transitioning"), 320);
  };

  /* Ouvrir automatiquement les outils si une recherche est en cours */
  useEffect(() => {
    if (searchQuery && !catalogToolsOpen) setCatalogToolsOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const showCatalogResults = !catalogLoading && (!catalogError || catalog.length > 0);

  /* ─────── Rendu : modal rayons ─────── */
  const departmentsMenu = departmentsMenuOpen ? (
    <div
      className={`market-departments-modal${isDark ? " is-dark" : ""}${
        activeMenuDepartmentData ? "" : " is-submenu-empty"
      }`}
      style={
        {
          "--market-departments-modal-top": `${marketHeaderHeight}px`,
          "--market-orange": "#ff7417",
        } as CSSProperties
      }
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
            <button
              className="market-departments-drawer-close"
              type="button"
              onClick={closeDepartmentsMenu}
              aria-label="Fermer"
              ref={departmentsMenuCloseRef}
            >
              ×
            </button>
          </div>
          <nav className="market-departments-drawer-list" aria-label="Choisir un rayon">
            <button
              className={`market-departments-drawer-item${
                selectedDepartment ? "" : " is-selected"
              }`}
              type="button"
              aria-pressed={!selectedDepartment}
              onMouseEnter={() => setActiveMenuDepartment("")}
              onClick={() => selectDepartment("")}
            >
              <span
                className="market-departments-drawer-icon market-departments-drawer-icon--all"
                aria-hidden="true"
              >
                <svg viewBox="0 0 48 48" fill="none">
                  <path d="M8 20h32l-3 20H11L8 20Z" />
                  <path d="m13 20 5-11h12l5 11M18 9l6 11 6-11M17 27v7m7-7v7m7-7v7" />
                </svg>
              </span>
              <span className="market-departments-drawer-copy">
                <strong>Tous les produits</strong>
                <small>{marketProducts.length} produits</small>
              </span>
              <span className="market-departments-drawer-arrow" aria-hidden="true">
                ›
              </span>
            </button>
            {departments.map((department) => {
              const departmentProducts = productsByDepartment.get(department.id) || [];
              const representativeProduct = departmentProducts.find(
                (product) => product.imageUrl,
              );
              return (
                <button
                  className={`market-departments-drawer-item${
                    selectedDepartment === department.id ? " is-selected" : ""
                  }${activeMenuDepartment === department.id ? " is-active" : ""}`}
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
                  <span
                    className={`market-departments-drawer-icon market-departments-drawer-icon--${department.color}`}
                    aria-hidden="true"
                  >
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
                  <span className="market-departments-drawer-arrow" aria-hidden="true">
                    ›
                  </span>
                </button>
              );
            })}
          </nav>
        </section>

        <aside
          className="market-departments-submenu"
          aria-label={
            activeMenuDepartmentData
              ? `Contenu du rayon ${activeMenuDepartmentData.name}`
              : "Contenu du rayon"
          }
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
                    const representativeProduct = productsByDepartment
                      .get(activeMenuDepartmentData.id)
                      ?.find((product) => product.imageUrl);
                    return representativeProduct ? (
                      <MarketMenuImage
                        src={representativeProduct.imageUrl}
                        artwork={representativeProduct.artwork}
                      />
                    ) : (
                      <ProductIllustration
                        artwork={getProductArtwork(activeMenuDepartmentData.name)}
                      />
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
                <nav
                  className="market-departments-submenu-list"
                  aria-label={`Sous-rayons de ${activeMenuDepartmentData.name}`}
                >
                  {activeMenuSubcategories.map((subcategory) => (
                    <button
                      className={`market-departments-submenu-item${
                        selectedSubcategory === subcategory.path ? " is-selected" : ""
                      }`}
                      key={subcategory.path}
                      type="button"
                      onClick={() =>
                        selectSubcategory(activeMenuDepartmentData.id, subcategory.path)
                      }
                    >
                      <span>{subcategory.name}</span>
                      <small>{subcategory.productCount}</small>
                    </button>
                  ))}
                </nav>
              ) : (
                <div className="market-departments-submenu-products">
                  <p>Produits du rayon</p>
                  {(productsByDepartment.get(activeMenuDepartmentData.id) || [])
                    .slice(0, 6)
                    .map((product) => (
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

  /* ─────── Rendu principal ─────── */
  return (
    <>
      <Head>
        <title>FiSAFi Market — Le marché du quotidien</title>
        <meta
          name="description"
          content="Explorez les rayons FiSAFi Market : produits frais, épicerie, boulangerie, boissons et essentiels de la maison."
        />
        <script dangerouslySetInnerHTML={{ __html: MARKET_THEME_BOOTSTRAP }} />
      </Head>

      <Header
        marketCartAction={
          <Link
            className="market-header-cart"
            href={marketCheckoutUrl}
            aria-label={`Ouvrir le panier, ${cartItems.length} références et une quantité totale de ${fmt(
              cartCount,
            )}`}
            title="Panier"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2.75 4.25h2.1l2.05 10.1a1.8 1.8 0 0 0 1.76 1.45h8.8a1.8 1.8 0 0 0 1.74-1.35L21.25 8H6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="9.5" cy="19.1" r="1.35" fill="currentColor" />
              <circle cx="18.1" cy="19.1" r="1.35" fill="currentColor" />
            </svg>
            <span>{cartReady ? fmt(cartCount) : "…"}</span>
          </Link>
        }
        marketActions={
          <>
            <button
              className={`market-rayons-link${departmentsMenuOpen ? " is-open" : ""}`}
              type="button"
              onClick={() =>
                departmentsMenuOpen ? closeDepartmentsMenu() : openDepartmentsMenu()
              }
              aria-haspopup="dialog"
              aria-expanded={departmentsMenuOpen}
              aria-label={
                departmentsMenuOpen ? "Quitter le menu des rayons" : "Afficher les rayons"
              }
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
              <span className="market-theme-toggle-label">
                {isDark ? "Clair" : "Sombre"}
              </span>
            </button>
          </>
        }
      />

      <main className="market-page" suppressHydrationWarning>
        {storageError && (
          <p className="market-cart-storage-error" role="alert">
            {storageError}
          </p>
        )}

        <MarketStore isMarketOpen={status.open} />

        {/* ═══ RAYONS & CATALOGUE ═══ */}
        <section
          className="market-departments"
          id="rayons"
          aria-labelledby="market-departments-title"
        >
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
              aria-label={
                catalogToolsOpen
                  ? "Masquer la recherche et les filtres"
                  : "Afficher la recherche et les filtres"
              }
              onClick={() => {
                const willOpen = !catalogToolsOpen;
                setCatalogToolsOpen(willOpen);
                if (willOpen) {
                  window.requestAnimationFrame(() =>
                    catalogSearchInputRef.current?.focus(),
                  );
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
              <p>
                {catalog.length ? "Le catalogue affiché est en cache. " : ""}
                {catalogError}
              </p>
              <button
                type="button"
                onClick={() => setCatalogRetry((retry) => retry + 1)}
              >
                Réessayer
              </button>
            </div>
          )}

          {catalogLoading && (
            <p className="market-search-count" role="status">
              Chargement du catalogue du magasin…
            </p>
          )}

          {showCatalogResults && (
            <div className="market-search-results" aria-live="polite">
              <div className="market-results-toolbar">
                <div className="market-results-title">
                  <h3>
                    {selectedSubcategory.split("/").pop()?.trim() ||
                      departments.find(
                        (department) => department.id === selectedDepartment,
                      )?.name ||
                      "Tous les produits"}
                  </h3>
                  <p className="market-search-count">
                    {sortedProducts.length
                      ? `${firstProductNumber}–${lastProductNumber} sur ${sortedProducts.length} produits`
                      : normalizedQuery
                        ? "Aucun produit trouvé."
                        : "Aucun produit dans ce rayon."}
                  </p>
                </div>
                {hasActiveCatalogFilters && (
                  <button
                    className="market-clear-filters"
                    type="button"
                    onClick={clearCatalogFilters}
                  >
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
                      cartQuantity={getCartQuantity(
                        product.departmentId,
                        product.name,
                        product.id,
                      )}
                      onShowDetails={() => setSelectedProduct(product)}
                      onAddToCart={(quantity) =>
                        addProduct(
                          product.departmentId,
                          product.departmentName,
                          product,
                          quantity,
                        )
                      }
                      onSetQuantity={(quantity) =>
                        setQuantity(
                          getMarketProductId(
                            product.departmentId,
                            product.name,
                            product.id,
                          ),
                          quantity,
                        )
                      }
                    />
                  ))}
                </div>
              )}

              {!pageProducts.length && hasActiveCatalogFilters && (
                <div className="market-empty-state">
                  <span aria-hidden="true">⌕</span>
                  <h3>Aucun produit ne correspond</h3>
                  <p>Essayez un autre terme ou réinitialisez vos filtres.</p>
                  <button type="button" onClick={clearCatalogFilters}>
                    Voir tout le catalogue
                  </button>
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
        <section
          className="market-infos"
          id="infos-market"
          aria-label="Horaires et adresse"
        >
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
                <strong>FiSAFi Market</strong>
                <br />
                Liberté 6 Extension
                <br />
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
      </main>

      {departmentsMenu}

      {selectedProduct && (
        <div
          className={`market-product-dialog-backdrop${isDark ? " is-dark" : ""}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedProduct(null);
          }}
        >
          <section
            className="market-product-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-product-dialog-title"
            ref={productDialogRef}
          >
            <button
              className="market-product-dialog-close"
              type="button"
              onClick={() => setSelectedProduct(null)}
              aria-label="Fermer le détail du produit"
              ref={productDialogCloseRef}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
            <div className="market-product-dialog-visual">
              {selectedProduct.badge && (
                <span className="market-product-dialog-badge">PROMO</span>
              )}
              <ProductArtworkView product={selectedProduct} />
            </div>
            <div className="market-product-dialog-content">
              <span className="market-product-dialog-department">
                {selectedProduct.departmentName}
              </span>
              <h2 id="market-product-dialog-title">{selectedProduct.name}</h2>
              {selectedProduct.categoryPath && (
                <p className="market-product-dialog-category">
                  {selectedProduct.categoryPath}
                </p>
              )}
              <p className="market-product-dialog-price">
                <strong>
                  {selectedProduct.price.replace(/\s*\/\s*kg\b/i, "")}
                </strong>
                <span>
                  FCFA{/\/\s*kg\b/i.test(selectedProduct.price) && " / kg"}
                </span>
              </p>
              <p className="market-product-dialog-note">
                {selectedProduct.variantChoiceRequired
                  ? "Contactez FiSAFi pour préciser la variante souhaitée."
                  : `Stock indicatif : ${fmt(selectedProduct.availableQuantity)}${
                      /\/\s*kg\b/i.test(selectedProduct.price) ? " kg" : ""
                    }. Revérifié à la commande.`}
              </p>

              {(() => {
                const quantity = getCartQuantity(
                  selectedProduct.departmentId,
                  selectedProduct.name,
                  selectedProduct.id,
                );
                const isKg = /\/\s*kg\b/i.test(selectedProduct.price);
                const quantityStep = isKg ? 0.5 : 1;
                const firstQuantity = isKg
                  ? Math.min(
                      1,
                      Math.floor(selectedProduct.availableQuantity / quantityStep) *
                        quantityStep,
                    )
                  : 1;

                return quantity > 0 ? (
                  <div
                    className="market-product-dialog-quantity"
                    role="group"
                    aria-label={`Quantité de ${selectedProduct.name} dans le panier`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          getMarketProductId(
                            selectedProduct.departmentId,
                            selectedProduct.name,
                            selectedProduct.id,
                          ),
                          quantity - quantityStep,
                        )
                      }
                      aria-label={`Retirer ${
                        isKg ? "0,5 kg" : "un"
                      } de ${selectedProduct.name}`}
                    >
                      −
                    </button>
                    <span aria-live="polite">
                      {fmt(quantity)}
                      {isKg ? " kg" : " dans le panier"}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        addProduct(
                          selectedProduct.departmentId,
                          selectedProduct.departmentName,
                          selectedProduct,
                          quantityStep,
                        )
                      }
                      disabled={
                        selectedProduct.variantChoiceRequired ||
                        quantity + quantityStep >
                          Math.min(
                            selectedProduct.availableQuantity,
                            MARKET_CART_MAX_QUANTITY,
                          )
                      }
                      aria-label={`Ajouter ${
                        isKg ? "0,5 kg" : "un"
                      } de ${selectedProduct.name}`}
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    className="market-product-dialog-add"
                    type="button"
                    onClick={() =>
                      addProduct(
                        selectedProduct.departmentId,
                        selectedProduct.departmentName,
                        selectedProduct,
                        firstQuantity,
                      )
                    }
                    disabled={
                      getMarketPriceAmount(selectedProduct.price) === null ||
                      firstQuantity <= 0 ||
                      selectedProduct.variantChoiceRequired
                    }
                  >
                    {selectedProduct.variantChoiceRequired || firstQuantity <= 0
                      ? "Indisponible"
                      : "Ajouter au panier"}
                    <span aria-hidden="true">+</span>
                  </button>
                );
              })()}
            </div>
          </section>
        </div>
      )}

      <Footer />
    </>
  );
}