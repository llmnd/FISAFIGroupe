import { useEffect, useState } from "react";
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

type Featured = {
  id: string;
  name: string;
  price: string;
  unit: string;
  tag: string;
  color: string;
  image: string;
};

type ProductArtwork = "produce" | "pantry" | "bakery" | "drink" | "fresh" | "home";

type MarketProduct = {
  name: string;
  price: string;
  badge: "BIO" | "PROMO";
  artwork: ProductArtwork;
  image?: string;
};

type MarketSearchResult = MarketProduct & {
  departmentId: Department["id"];
  departmentName: string;
};

type ThemeChoice = "system" | "light" | "dark";

/* ═══════════ DATA ═══════════ */

const DEPARTMENTS: Department[] = [
  { id: "fruits-legumes", name: "Fruits & légumes", description: "Les couleurs et les saveurs du marché.", color: "green", art: "produce" },
  { id: "epicerie", name: "Épicerie", description: "Les indispensables pour chaque recette.", color: "orange", art: "pantry" },
  { id: "boulangerie", name: "Boulangerie", description: "Le plaisir des bonnes choses à partager.", color: "gold", art: "bakery" },
  { id: "boissons", name: "Boissons", description: "De quoi accompagner chaque moment.", color: "blue", art: "drinks" },
  { id: "frais", name: "Produits frais", description: "Une sélection pour vos repas du quotidien.", color: "pink", art: "fresh" },
  { id: "maison", name: "Maison & entretien", description: "Les essentiels pratiques de la maison.", color: "purple", art: "home" },
];

const FEATURED: Featured[] = [
  { id: "bissap", name: "Bissap frais", price: "500", unit: "FCFA", tag: "Frais du jour", color: "#c9264a", image: "bissap.jpg" },
  { id: "pringles", name: "Pringles Original", price: "Sur demande", unit: "", tag: "Épicerie", color: "#d71920", image: "pringles.jpg" },
  { id: "pain", name: "Pain chaud", price: "150", unit: "FCFA", tag: "Sortie du four", color: "#d7954c", image: "pain.jpg" },
  { id: "cafe", name: "Café Touba", price: "800", unit: "le sachet", tag: "Nouveauté", color: "#4a2f00", image: "cafe.jpg" },
  { id: "eau", name: "Pack d'eau 6×1,5L", price: "1 800", unit: "FCFA", tag: "Pratique", color: "#2f6fd1", image: "eau.jpg" },
  { id: "savon", name: "Savon de Marseille", price: "600", unit: "FCFA", tag: "Maison", color: "#8ecae6", image: "savon.jpg" },
];

const RAYON_PRODUCTS: Record<Department["id"], MarketProduct[]> = {
  "fruits-legumes": [
    { name: "Mangues Kent", price: "1 200 / kg", badge: "BIO", artwork: "produce" },
    { name: "Bananes", price: "800 / kg", badge: "PROMO", artwork: "produce" },
    { name: "Oranges", price: "900 / kg", badge: "BIO", artwork: "produce" },
    { name: "Tomates fraîches", price: "750 / kg", badge: "PROMO", artwork: "produce" },
    { name: "Oignons", price: "600 / kg", badge: "BIO", artwork: "produce" },
    { name: "Pommes de terre", price: "700 / kg", badge: "PROMO", artwork: "produce" },
  ],
  epicerie: [
    { name: "Pringles Original", price: "1 500", badge: "PROMO", artwork: "pantry", image: "pringles.jpg" },
    { name: "Café Touba", price: "800", badge: "BIO", artwork: "pantry", image: "cafe.jpg" },
    { name: "Riz brisé", price: "750 / kg", badge: "PROMO", artwork: "pantry" },
    { name: "Huile végétale", price: "1 200", badge: "BIO", artwork: "pantry" },
    { name: "Sucre en poudre", price: "650", badge: "PROMO", artwork: "pantry" },
    { name: "Pâtes alimentaires", price: "500", badge: "BIO", artwork: "pantry" },
  ],
  boulangerie: [
    { name: "Baguette tradition", price: "150", badge: "PROMO", artwork: "bakery", image: "pain.jpg" },
    { name: "Pain complet", price: "400", badge: "BIO", artwork: "bakery" },
    { name: "Croissant pur beurre", price: "300", badge: "PROMO", artwork: "bakery" },
    { name: "Pain au chocolat", price: "350", badge: "BIO", artwork: "bakery" },
    { name: "Brioche nature", price: "500", badge: "PROMO", artwork: "bakery" },
    { name: "Pain de mie", price: "900", badge: "BIO", artwork: "bakery" },
  ],
  boissons: [
    { name: "Bissap frais", price: "500", badge: "BIO", artwork: "drink", image: "bissap.jpg" },
    { name: "Eau minérale 1,5 L", price: "500", badge: "PROMO", artwork: "drink", image: "eau.jpg" },
    { name: "Jus de gingembre", price: "600", badge: "BIO", artwork: "drink" },
    { name: "Jus de bouye", price: "600", badge: "PROMO", artwork: "drink" },
    { name: "Soda 33 cl", price: "500", badge: "BIO", artwork: "drink" },
    { name: "Lait frais", price: "1 000", badge: "PROMO", artwork: "drink" },
  ],
  frais: [
    { name: "Lait caillé", price: "700", badge: "BIO", artwork: "fresh" },
    { name: "Yaourt nature", price: "400", badge: "PROMO", artwork: "fresh" },
    { name: "Beurre doux", price: "1 200", badge: "BIO", artwork: "fresh" },
    { name: "Œufs frais (6)", price: "1 000", badge: "PROMO", artwork: "fresh" },
    { name: "Fromage portion", price: "900", badge: "BIO", artwork: "fresh" },
    { name: "Crème fraîche", price: "1 100", badge: "PROMO", artwork: "fresh" },
  ],
  maison: [
    { name: "Savon de Marseille", price: "600", badge: "BIO", artwork: "home", image: "savon.jpg" },
    { name: "Liquide vaisselle", price: "1 200", badge: "PROMO", artwork: "home" },
    { name: "Eau de Javel", price: "900", badge: "BIO", artwork: "home" },
    { name: "Lessive en poudre", price: "1 500", badge: "PROMO", artwork: "home" },
    { name: "Éponge multi-usage", price: "350", badge: "BIO", artwork: "home" },
    { name: "Papier hygiénique", price: "1 000", badge: "PROMO", artwork: "home" },
  ],
};

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

function DepartmentIllustration({ art }: { art: Department["art"] }) {
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
  if (product.image) {
    return (
      <img
        className="market-product-image"
        src={`/produits/${product.image}`}
        alt={product.name}
        loading="lazy"
      />
    );
  }
  return <ProductIllustration artwork={product.artwork} />;
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
      <span className={`market-product-badge market-product-badge--${product.badge.toLowerCase()}`}>
        {product.badge}
      </span>
      <div className="market-product-visual">
        <ProductArtworkView product={product} />
      </div>
      <span className="market-product-department">{departmentName}</span>
      <h4>{product.name}</h4>
      <p>
        {priceUnit === "kg" ? product.price.replace(/\s*\/\s*kg\b/i, "") : product.price}
        <span>{priceUnit === "kg" ? "FCFA / kg" : "FCFA"}</span>
      </p>
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
  const [themeChoice, setThemeChoice] = useState<ThemeChoice>("system");
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const isDark = themeChoice === "dark" || (themeChoice === "system" && systemPrefersDark);
  const normalizedQuery = searchQuery
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr");
  const searchResults: MarketSearchResult[] = DEPARTMENTS.flatMap((department) =>
    RAYON_PRODUCTS[department.id]
      .filter((product) => {
        const searchableText = `${product.name} ${department.name} ${department.description}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLocaleLowerCase("fr");
        return searchableText.includes(normalizedQuery);
      })
      .map((product) => ({
        ...product,
        departmentId: department.id,
        departmentName: department.name,
      })),
  );
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const getCartQuantity = (departmentId: string, productName: string) =>
    cartItems.find((item) => item.id === getMarketProductId(departmentId, productName))?.quantity ?? 0;

  const addProduct = (departmentId: string, departmentName: string, product: MarketProduct) => {
    const unitPrice = getMarketPriceAmount(product.price);
    if (unitPrice === null) return;
    const item: MarketCartItemInput = {
      departmentId,
      departmentName,
      name: product.name,
      image: product.image,
      priceLabel: product.price.replace(/\s*\/\s*kg\b/i, ""),
      unitPrice,
      priceUnit: /\/\s*kg\b/i.test(product.price) ? "kg" : "unité",
    };
    addItem(item);
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const savedTheme = window.localStorage.getItem("fisafi-market-theme");
    if (savedTheme === "dark" || savedTheme === "light") setThemeChoice(savedTheme);
    setSystemPrefersDark(media.matches);

    const updateSystemTheme = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = isDark ? "light" : "dark";
    window.localStorage.setItem("fisafi-market-theme", nextTheme);
    setThemeChoice(nextTheme);
  };

  return (
    <>
      <Head>
        <title>FiSAFi Market — Le marché du quotidien</title>
        <meta
          name="description"
          content="Explorez les rayons FiSAFi Market : produits frais, épicerie, boulangerie, boissons et essentiels de la maison."
        />
      </Head>

      <main className="market-page" data-theme={isDark ? "dark" : "light"}>
        <nav className="market-store-nav" aria-label="Navigation Market">
          <Link href="/business" className="market-back">
            <span aria-hidden="true">←</span> Retour
          </Link>

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

            <a className="market-nav-contact" href="mailto:contact@fisafigroupe.com">
              Nous contacter <span aria-hidden="true">↗</span>
            </a>
            <Link
              className="market-cart-link"
              href="/market/commande"
              aria-label={`Ouvrir le panier, ${cartItems.length} références et une quantité totale de ${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(cartCount)}`}
            >
              <span aria-hidden="true">▱</span>
              Panier
              <b>{cartReady ? new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(cartCount) : "…"}</b>
            </Link>
          </div>
        </nav>
        {storageError && <p className="market-cart-storage-error" role="alert">{storageError}</p>}

        <MarketStore isMarketOpen={status.open} />

        {/* ═══ PRODUITS EN VEDETTE ═══ */}
        <section className="market-featured" aria-labelledby="market-featured-title">
          <div className="market-section-heading">
            <div>
              <p className="market-kicker">CETTE SEMAINE</p>
              <h2 id="market-featured-title">En vedette.</h2>
            </div>
          </div>

          <div className="market-featured-grid">
            {FEATURED.map((product) => (
              <a
                className="market-featured-card"
                key={product.id}
                href={`mailto:contact@fisafigroupe.com?subject=Demande%20-%20${encodeURIComponent(product.name)}`}
              >
                <span className="market-featured-tag" style={{ background: product.color }}>
                  {product.tag}
                </span>
                <span className="market-featured-visual" style={{ ["--accent" as string]: product.color }}>
                  <img
                    className="market-featured-image"
                    src={`/produits/${product.image}`}
                    alt=""
                    loading="lazy"
                  />
                </span>
                <span className="market-featured-copy">
                  <strong>{product.name}</strong>
                  <span className="market-featured-price">
                    {product.price} <small>{product.unit}</small>
                  </span>
                </span>
                <span className="market-featured-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </section>

        {/* ═══ RAYONS ═══ */}
        <section className="market-departments" id="rayons" aria-labelledby="market-departments-title">
          <div className="market-section-heading">
            <div>
              <p className="market-kicker">À CHACUN SON RAYON</p>
              <h2 id="market-departments-title">Faites votre marché.</h2>
            </div>
            <p>De quoi remplir le panier et régaler toute la maison.</p>
          </div>

          <div className="market-search">
            <label className="market-search-field">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 5 5" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Rechercher un produit ou un rayon…"
                aria-label="Rechercher un produit ou un rayon"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery("")}>
                  Effacer
                </button>
              )}
            </label>
          </div>

          {!normalizedQuery && <div className="market-department-grid">
            {DEPARTMENTS.map((department, index) => (
              <a
                className={`market-department-card market-department-card--${department.color}`}
                href={`#${department.id}-produits`}
                key={department.id}
              >
                <span className="market-department-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <DepartmentIllustration art={department.art} />
                <span className="market-department-copy">
                  <strong>{department.name}</strong>
                  <span>{department.description}</span>
                  <span className="market-department-arrow" aria-hidden="true">↗</span>
                </span>
              </a>
            ))}
          </div>}

          {normalizedQuery ? (
            <div className="market-search-results" aria-live="polite">
              <p className="market-search-count">
                {searchResults.length
                  ? `${searchResults.length} produit${searchResults.length > 1 ? "s" : ""} trouvé${searchResults.length > 1 ? "s" : ""}`
                  : "Aucun produit trouvé. Essayez un autre nom ou rayon."}
              </p>
              {searchResults.length > 0 && (
                <div className="market-product-grid">
                  {searchResults.map((result) => (
                    <MarketProductCard
                      key={`${result.departmentName}-${result.name}`}
                      product={result}
                      departmentName={result.departmentName}
                      cartQuantity={getCartQuantity(result.departmentId, result.name)}
                      onAddToCart={() => addProduct(result.departmentId, result.departmentName, result)}
                      onSetQuantity={(quantity) => setQuantity(
                        getMarketProductId(result.departmentId, result.name),
                        quantity,
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="market-rayon-products">
              {DEPARTMENTS.map((department) => (
                <section
                  className={`market-rayon-section market-rayon-section--${department.color}`}
                  id={`${department.id}-produits`}
                  key={department.id}
                  aria-labelledby={`${department.id}-title`}
                >
                  <div className="market-rayon-heading">
                    <div>
                      <p className="market-kicker">RAYON {department.name.toUpperCase()}</p>
                      <h3 id={`${department.id}-title`}>{department.name}</h3>
                    </div>
                    <span>{RAYON_PRODUCTS[department.id].length} produits sélectionnés</span>
                  </div>
                  <div className="market-product-grid">
                    {RAYON_PRODUCTS[department.id].map((product) => (
                      <MarketProductCard
                        product={product}
                        departmentName={department.name}
                        key={product.name}
                        cartQuantity={getCartQuantity(department.id, product.name)}
                        onAddToCart={() => addProduct(department.id, department.name, product)}
                        onSetQuantity={(quantity) => setQuantity(
                          getMarketProductId(department.id, product.name),
                          quantity,
                        )}
                      />
                    ))}
                  </div>
                </section>
              ))}
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
                href="https://www.openstreetmap.org/search?query=Libert%C3%A9%206%20Extension%2C%20Dakar%2C%20S%C3%A9n%C3%A9gal"
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
        </section>

        {/* ═══ APPEL ═══ */}
        <section className="market-pantry-callout">
          <div className="market-pantry-art" aria-hidden="true">
            <svg viewBox="0 0 220 180" fill="none">
              <path d="M41 79h138l-12 82H53L41 79Z" fill="#F4D58B" />
              <path d="M55 91h110l-8 58H63l-8-58Z" fill="#E7B75D" />
              <circle cx="78" cy="74" r="31" fill="#E75A48" />
              <circle cx="112" cy="63" r="35" fill="#F2BB3F" />
              <circle cx="148" cy="75" r="28" fill="#6C9E56" />
              <path d="M76 47c2-13 10-20 22-20m15 2c-3-13 3-22 15-25m22 40c4-12 13-16 23-14" stroke="#47784A" strokeWidth="6" strokeLinecap="round" />
              <path d="M42 80h136" stroke="#A9743F" strokeWidth="7" strokeLinecap="round" />
            </svg>
          </div>

          <div className="market-pantry-copy">
            <p className="market-kicker">LE PANIER VOUS ATTEND</p>
            <h2>Un produit en tête ?</h2>
            <p>
              Notre équipe vous renseigne sur les rayons et les disponibilités. Écrivez-nous, nous
              serons heureux de vous répondre.
            </p>
            <a className="market-contact-link" href="mailto:contact@fisafigroupe.com?subject=Demande%20FiSAFi%20Market">
              Parler à l’équipe <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}