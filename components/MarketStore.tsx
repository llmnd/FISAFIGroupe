import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

const LINES = [
  "Salam ! Bienvenue chez FiSAFi.",
  "Les boissons bien fraîches, c’est en face.",
  "Chips et bonbons à votre droite, servez-vous.",
  "Touchez un rayon pour découvrir ses produits, puis écrivez-nous pour commander.",
];

type FridgeProduct = {
  c: string;
  kind: "bottle" | "can" | "jug";
  name: string;
  image: string;
};

const FRIDGE_PRODUCTS: FridgeProduct[] = [
  { c: "#8a1737", kind: "bottle", name: "Bissap", image: "bissap.jpg" },
  { c: "#2f6fd1", kind: "bottle", name: "Eau", image: "eau.jpg" },
  { c: "#742d65", kind: "bottle", name: "Vimto", image: "vimto.jpg" },
  { c: "#317c54", kind: "bottle", name: "Ira", image: "ira.jpg" },
  { c: "#f47b20", kind: "can", name: "Fanta", image: "fanta.png" },
  { c: "#1456a0", kind: "can", name: "Pepsi", image: "pepsi.jpg" },
  { c: "#f2ca65", kind: "bottle", name: "Lait", image: "lait.jpg" },
  { c: "#2374bb", kind: "jug", name: "Fromage", image: "fromage.jpg" },
];

const SNACKS = ["#e8453c", "#f5a623", "#250bb8", "#3c985f", "#ff7417", "#d6458f"];
const CANDY = ["#ff5d8f", "#ffb703", "#8ecae6", "#7bd389"];
const BACKGROUND_PRODUCTS = [
  ["cafe.jpg", "savon.jpg", "pain.jpg", "bissap.jpg"],
  ["eau.jpg", "pringles.jpg", "fromage.jpg", "fanta.jpg"],
  ["lait.jpg", "vimto.jpg", "cafe.jpg", "savon.jpg"],
];
type StoreAisle = {
  number: string;
  label: string;
  name: string;
  href: string;
  kind: string;
  colors: readonly string[];
  candy: readonly string[];
  images?: readonly string[];
};

const STORE_AISLES: StoreAisle[] = [
  {
    number: "01",
    label: "Fruits & légumes",
    name: "Fruits & légumes",
    href: "#fruits-legumes-produits",
    kind: "produce",
    colors: ["#e8453c", "#f5a623", "#3c985f", "#f47b20", "#d6458f", "#f2ca65"],
    candy: ["#e8453c", "#f5a623", "#3c985f", "#d6458f"],
  },
  {
    number: "02",
    label: "Épicerie",
    name: "Épicerie & gourmandises",
    href: "#epicerie-produits",
    kind: "pantry",
    images: ["pringles.jpg", "cafe.jpg"],
    colors: SNACKS,
    candy: CANDY,
  },
  {
    number: "03",
    label: "Boulangerie",
    name: "Boulangerie",
    href: "#boulangerie-produits",
    kind: "bakery",
    images: ["pain.jpg"],
    colors: ["#c78342", "#a9622d", "#e2ad67", "#8a4f2d", "#d7954c", "#b8793e"],
    candy: ["#d7954c", "#e2ad67", "#c78342", "#a9622d"],
  },
  {
    number: "04",
    label: "Produits frais",
    name: "Produits frais",
    href: "#frais-produits",
    kind: "fresh",
    images: ["lait.jpg", "fromage.jpg"],
    colors: ["#f2ca65", "#8ecae6", "#fffdf6", "#7bd389", "#d6458f", "#8ecae6"],
    candy: ["#fffdf6", "#8ecae6", "#7bd389", "#f2ca65"],
  },
  {
    number: "05",
    label: "Maison",
    name: "Maison & entretien",
    href: "#maison-produits",
    kind: "home",
    images: ["savon.jpg"],
    colors: ["#2f6fd1", "#8ecae6", "#7bd389", "#742d65", "#317c54", "#2f6fd1"],
    candy: ["#8ecae6", "#2f6fd1", "#7bd389", "#742d65"],
  },
];

const cv = (v: string) => ({ "--c": v }) as CSSProperties;

export default function MarketStore({ isMarketOpen }: { isMarketOpen: boolean }) {
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState(0);
  const [customerPass, setCustomerPass] = useState(0);
  const [aisleIndex, setAisleIndex] = useState(0);
  const activeAisle = STORE_AISLES[aisleIndex];
  const room = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOpen(true);
      return;
    }

    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => setCustomerPass((pass) => pass + 1), 20_000);
    return () => clearInterval(interval);
  }, []);

  const move = (e: PointerEvent) => {
    const el = room.current;
    if (!el || e.pointerType === "touch" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
  };

  const resetPerspective = () => {
    room.current?.style.setProperty("--px", "0");
    room.current?.style.setProperty("--py", "0");
  };

  return (
    <>
    <section
      className={`store${open ? " has-opened" : ""}`}
      onPointerMove={move}
      onPointerLeave={resetPerspective}
      aria-label="Boutique interactive FiSAFi Market"
    >
      <div className="store-room" ref={room}>
        <div className="store-wall" />
        <div className="store-floor" />
        <div className="store-backdrop" aria-hidden="true">
          <div className="back-rack back-rack--left">
            <span className="back-rack-sign">ÉPICERIE</span>
            {BACKGROUND_PRODUCTS.map((row, rowIndex) => (
              <div className="back-rack-row" key={rowIndex}>
                {row.map((image, productIndex) => (
                  <span className="back-rack-product" key={`${image}-${productIndex}`}>
                    <img src={`/produits/${image}`} alt="" loading="lazy" decoding="async" />
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="back-rack back-rack--right">
            <span className="back-rack-sign">MAISON &amp; FRAIS</span>
            {BACKGROUND_PRODUCTS.map((row, rowIndex) => (
              <div className="back-rack-row" key={rowIndex}>
                {[...row].reverse().map((image, productIndex) => (
                  <span className="back-rack-product" key={`${image}-${productIndex}`}>
                    <img src={`/produits/${image}`} alt="" loading="lazy" decoding="async" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        {customerPass > 0 && (
          <div className="store-customer-pass is-crossing" key={customerPass} aria-hidden="true">
            <svg viewBox="0 0 100 180">
              <circle cx="50" cy="24" r="17" fill="#343044" />
              <path d="M31 47c4-8 34-8 38 0l9 49H22l9-49Z" fill="#343044" />
              <path d="m32 96-6 62m42-62 7 62" stroke="#343044" strokeWidth="13" strokeLinecap="round" />
              <path d="m29 54-17 48m59-48 15 39" stroke="#343044" strokeWidth="9" strokeLinecap="round" />
              <path d="M74 91h21l-3 25H77Z" fill="#ff7417" />
            </svg>
          </div>
        )}
        <div className="store-ceiling">
          <i /><i /><i /><i />
        </div>

        <div className="store-plant" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
          <span />
        </div>

        {/* ── Frigo boissons ── */}
        <a className="fridge" href="#boissons-produits" aria-label="Découvrir les boissons fraîches">
          <span className="fridge-sign">
            BOISSONS <strong>FRAÎCHES</strong>
          </span>

          <div className="fridge-inner">
            <span className="fridge-led" />
            {[0, 1, 2].map((r) => (
              <div className="fridge-row" key={r}>
                {FRIDGE_PRODUCTS.map((_, i) => {
                  const product = FRIDGE_PRODUCTS[(i + r * 3) % FRIDGE_PRODUCTS.length];
                  return (
                    <span
                      key={product.name}
                      className={`bottle bottle--${product.kind} bottle--image${product.name === "Fromage" ? " bottle--cheese" : ""}`}
                      style={cv(product.c)}
                    >
                      <img src={`/produits/${product.image}`} alt="" loading="lazy" decoding="async" />
                    </span>
                  );
                })}
              </div>
            ))}
            <span className="fridge-glass" />
          </div>

          <span className="fridge-price" aria-hidden="true">
            500 <small>FCFA</small>
          </span>

          <span className="fridge-door fridge-door--l" />
          <span className="fridge-door fridge-door--r" />
          <span className="fridge-mist" />
        </a>

        {/* ── Abdel + caisse ── */}
        <div className="desk">
          <button
            className="bubble"
            onClick={() => setLine((current) => (current + 1) % LINES.length)}
            type="button"
            aria-label="Afficher le conseil suivant d’Abdel"
          >
            <span aria-live="polite" aria-atomic="true">{LINES[line]}</span>
            <span className="bubble-hint" aria-hidden="true">Le mot d’Abdel · découvrir le conseil suivant</span>
          </button>

          <img
            className="abdel"
            src="/abdel2.png"
            alt="Abdel, vendeur chez FiSAFi"
            loading="eager"
            decoding="async"
          />

          <div className="counter">
            <span className="counter-top" />

            <span className="register">
              <i>
                <em>CAISSE</em>
                <span className="register-led" />
              </i>
              <b />
            </span>

            <span className="checkout-belt" aria-hidden="true" />
            <span className="checkout-scanner" aria-hidden="true" />
            <span className="checkout-terminal" aria-hidden="true">
              <i />
              <b />
              <em />
            </span>
            <span className="checkout-goods" aria-hidden="true">
              <img src="/produits/cafe.jpg" alt="" loading="lazy" decoding="async" />
              <img src="/produits/savon.jpg" alt="" loading="lazy" decoding="async" />
            </span>
            <span className="counter-wordmark" aria-hidden="true">Bon shopping !</span>
            <span className="counter-bag" aria-hidden="true" />
            <span className="counter-fruit" aria-hidden="true" />
            <span className="counter-fruit counter-fruit--2" aria-hidden="true" />
          </div>
        </div>

        {/* ── Rayon modulable ── */}
        <div className="aisle" role="group" aria-label={`Rayon ${activeAisle.number} : ${activeAisle.name}`}>
          <div className="aisle-toolbar" role="group" aria-label="Navigation entre les rayons">
            <button
              className="aisle-switcher"
              type="button"
              onClick={() => setAisleIndex((index) => (index + STORE_AISLES.length - 1) % STORE_AISLES.length)}
              aria-label="Afficher le rayon précédent"
            >
              <span aria-hidden="true">←</span>
            </button>
            <span className="aisle-toolbar-status" aria-live="polite" aria-atomic="true">
              <small>PARCOURIR LES RAYONS</small>
              <strong>{activeAisle.number} <i>/</i> {String(STORE_AISLES.length).padStart(2, "0")}</strong>
            </span>
            <button
              className="aisle-switcher"
              type="button"
              onClick={() => setAisleIndex((index) => (index + 1) % STORE_AISLES.length)}
              aria-label="Afficher le rayon suivant"
            >
              <span aria-hidden="true">→</span>
            </button>
          </div>
          {[0, 1].map((r) => (
            <div className="aisle-row" key={r}>
              {activeAisle.colors.map((color, i) => {
                const images = activeAisle.images;
                const image = images ? images[(i + r * 2) % images.length] : undefined;
                const isPringles = activeAisle.kind === "pantry" && r === 0 && i === 0;
                return (
                  <span
                    key={i}
                    className={`bag bag--${activeAisle.kind}${image ? " bag--with-image" : ""}${isPringles ? " bag--pringles" : ""}`}
                    style={cv(activeAisle.colors[(i + r * 2) % activeAisle.colors.length] ?? color)}
                  >
                    {image ? (
                      <img className="aisle-product-image" src={`/produits/${image}`} alt="" />
                    ) : (
                      <i className="bag-brand" />
                    )}
                  </span>
                );
              })}
            </div>
          ))}

          <div className="aisle-row aisle-row--candy">
            {activeAisle.candy.map((col, i) => (
              <span key={i} className="jar" style={cv(col)} />
            ))}
          </div>

          <span className="aisle-tag" aria-hidden="true">
            {activeAisle.number}
          </span>
        </div>

        <a className="store-tag store-tag--welcome" href="#infos-market" style={{ left: "17%" }}>
          Infos pratiques <span aria-hidden="true">↗</span>
        </a>
        <a className="store-tag" href="#boissons-produits" style={{ left: "50%" }}>
          Boissons fraîches <span aria-hidden="true">↗</span>
        </a>
        <a className="store-tag" href={activeAisle.href} style={{ left: "83%" }}>
          {activeAisle.name} <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="store-doors" aria-hidden="true">
        <span className="store-door store-door--l">
          <em>{isMarketOpen ? "Ouvert" : "Fermé"}</em>
          <i />
        </span>
        <span className="store-door store-door--r">
          <em>{isMarketOpen ? "Bienvenue" : "À bientôt"}</em>
          <i />
        </span>
      </div>

    </section>
    </>
  );
}
