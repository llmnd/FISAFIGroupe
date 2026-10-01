import { useEffect, useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";

const LINES = [
  "Salam ! Bienvenue chez FiSAFi.",
  "Les boissons bien fraîches, c’est en face.",
  "Chips et bonbons à votre droite, servez-vous.",
  "Prenez votre temps, je suis à la caisse.",
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

const cv = (v: string) => ({ "--c": v }) as CSSProperties;

export default function MarketStore() {
  const [open, setOpen] = useState(false);
  const [line, setLine] = useState(0);
  const [customerPass, setCustomerPass] = useState(0);
  const room = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 700);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCustomerPass((pass) => pass + 1), 20_000);
    return () => clearInterval(interval);
  }, []);

  const move = (e: PointerEvent) => {
    const el = room.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", String((e.clientX - r.left) / r.width - 0.5));
    el.style.setProperty("--py", String((e.clientY - r.top) / r.height - 0.5));
  };

  return (
    <section
      className={`store${open ? " is-open" : ""}`}
      onPointerMove={move}
      aria-label="L’entrée de FiSAFi Market"
    >
      <div className="store-room" ref={room}>
        <div className="store-wall" />
        <div className="store-floor" />
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
        <a className="fridge" href="#rayons" aria-label="Voir les boissons fraîches">
          <span className="fridge-sign">
            <small>RAYON 01</small>
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
                      <img src={`/produits/${product.image}`} alt={product.name} />
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
            key={line}
            onClick={() => setLine((l) => (l + 1) % LINES.length)}
            aria-live="polite"
          >
            {LINES[line]}
          </button>

          <svg
            className="abdel"
            viewBox="85 50 190 300"
            role="img"
            aria-label="Abdel, vendeur chez FiSAFi"
          >
            <defs>
              <clipPath id="abdel-person">
                <path d="M177 60c25-5 49 6 53 35l-1 45c-2 18 10 27 19 42 10 16 13 36 19 60l2 28c-3 21-16 32-33 33l3 47H129l3-43c-16-4-24-18-28-37l-5-39c-3-23 6-43 20-52 12-8 22-11 29-19 3-15-2-41-3-58-2-24 11-38 32-42Z" />
              </clipPath>
            </defs>
            <image
              href="/abdel.jpeg"
              x="0"
              y="0"
              width="580"
              height="430"
              clipPath="url(#abdel-person)"
              preserveAspectRatio="none"
            />
          </svg>

          <div className="counter">
            <span className="counter-top" />

            <span className="register">
              <i><em>CAISSE</em></i>
              <b />
            </span>

            <span className="counter-bag" aria-hidden="true" />
            <span className="counter-fruit" aria-hidden="true" />
            <span className="counter-fruit counter-fruit--2" aria-hidden="true" />
          </div>
        </div>

        {/* ── Rayon épicerie ── */}
        <a className="aisle" href="#rayons" aria-label="Voir l’épicerie et les gourmandises">
          <span className="aisle-sign">
            <small>RAYON 03</small>
            Épicerie &amp; gourmandises
          </span>

          {[0, 1].map((r) => (
            <div className="aisle-row" key={r}>
              {SNACKS.map((_, i) => (
                <span
                  key={i}
                  className={`bag${r === 0 && i === 0 ? " bag--pringles" : ""}`}
                  style={cv(SNACKS[(i + r * 2) % SNACKS.length])}
                >
                  {r === 0 && i === 0 ? (
                    <img src="/produits/pringles.jpg" alt="Pringles Original" />
                  ) : (
                    <i className="bag-brand" />
                  )}
                </span>
              ))}
            </div>
          ))}

          <div className="aisle-row aisle-row--candy">
            {CANDY.map((col, i) => (
              <span key={i} className="jar" style={cv(col)} />
            ))}
          </div>

          <span className="aisle-tag" aria-hidden="true">
            150 <small>FCFA</small>
          </span>
        </a>

        <span className="store-tag" style={{ left: "17%" }}>
          Abdel vous accueille
        </span>
        <span className="store-tag" style={{ left: "50%" }}>
          Boissons fraîches
        </span>
        <span className="store-tag" style={{ left: "83%" }}>
          Chips &amp; bonbons
        </span>
      </div>

      <div className="store-doors" aria-hidden="true">
        <span className="store-door store-door--l">
          <em>Ouvert</em>
          <i />
        </span>
        <span className="store-door store-door--r">
          <em>Bienvenue</em>
          <i />
        </span>
      </div>
    </section>
  );
}