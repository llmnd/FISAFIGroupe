import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import Footer from "@/components/Footer";
import useMarketCart from "@/hooks/useMarketCart";
import { getMarketImageSource } from "@/lib/marketCart";

type Fulfillment = "delivery" | "pickup";

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount);

export default function MarketOrderPage() {
  const { items, ready, storageError, setQuantity, removeItem, clearCart } = useMarketCart();
  const [isDark, setIsDark] = useState(false);
  const [fulfillment, setFulfillment] = useState<Fulfillment>("delivery");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [canConfirm, setCanConfirm] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const savedTheme = window.localStorage.getItem("fisafi-market-theme");
    setIsDark(savedTheme === "dark" || (savedTheme !== "light" && media.matches));
    const updateSystemTheme = (event: MediaQueryListEvent) => {
      if (!savedTheme) setIsDark(event.matches);
    };
    media.addEventListener("change", updateSystemTheme);
    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  const total = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const orderMessage = [
    "Salam FiSAFi Market ! Je souhaite confirmer cette commande :",
    ...items.map((item) =>
      `- ${item.name} x${formatAmount(item.quantity)}${item.priceUnit === "kg" ? " kg" : ""} (${item.priceLabel} FCFA${item.priceUnit === "kg" ? " / kg" : ""})`,
    ),
    `Estimation : ${formatAmount(total)} FCFA, à confirmer.`,
    `Nom : ${customerName}`,
    `Téléphone : ${phone}`,
    `Mode : ${fulfillment === "delivery" ? "Livraison" : "Retrait en magasin"}`,
    ...(fulfillment === "delivery" ? [`Adresse : ${address}`] : []),
    ...(note.trim() ? [`Précision : ${note.trim()}`] : []),
    "Merci de confirmer la disponibilité, le montant final et les modalités.",
  ].join("\n");
  const whatsappUrl = `https://wa.me/221787812297?text=${encodeURIComponent(orderMessage)}`;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) return;
    if (!formRef.current?.reportValidity()) return;
    setCanConfirm(true);
  };

  const updateDetails = (update: () => void) => {
    update();
    setCanConfirm(false);
  };

  return (
    <>
      <Head>
        <title>Mon panier — FiSAFi Market</title>
        <meta
          name="description"
          content="Vérifiez votre panier FiSAFi Market, renseignez vos coordonnées et confirmez votre commande sur WhatsApp."
        />
      </Head>
      <main className="market-page" data-theme={isDark ? "dark" : "light"}>
        <nav className="market-store-nav market-checkout-nav" aria-label="Navigation panier">
          <Link href="/market#rayons" className="market-back">
            <span aria-hidden="true">←</span> Continuer mes achats
          </Link>
          <Link href="/market" className="market-wordmark">
            FiSAFi <strong>Market</strong>
          </Link>
        </nav>

        <section className="market-checkout" aria-labelledby="market-checkout-title">
          <div className="market-checkout-heading">
            <p className="market-kicker">VOTRE SÉLECTION</p>
            <h1 id="market-checkout-title">Le panier, puis on s’occupe de vous.</h1>
            <p>Vérifiez les quantités, indiquez comment vous souhaitez récupérer vos achats, puis confirmez avec notre équipe.</p>
          </div>

          {storageError && <p className="market-checkout-alert" role="alert">{storageError}</p>}

          {!ready ? (
            <p className="market-checkout-loading" role="status">Chargement de votre panier…</p>
          ) : items.length === 0 ? (
            <div className="market-cart-empty">
              <span aria-hidden="true">✳</span>
              <h2>Votre panier attend ses premiers produits.</h2>
              <p>Parcourez les rayons et ajoutez tout ce qui vous fait envie.</p>
              <Link href="/market#rayons">Découvrir les rayons <span aria-hidden="true">↗</span></Link>
            </div>
          ) : (
            <div className="market-checkout-layout">
              <section className="market-cart-panel" aria-labelledby="market-cart-title">
                <div className="market-cart-panel-heading">
                  <h2 id="market-cart-title">Vos produits <span>{items.length}</span></h2>
                  <button type="button" onClick={clearCart}>Vider le panier</button>
                </div>

                <ul className="market-cart-items">
                  {items.map((item) => {
                    const step = item.priceUnit === "kg" ? 0.5 : 1;
                    const imageSource = getMarketImageSource(item.image);
                    return (
                      <li className="market-cart-item" key={item.id}>
                        {imageSource ? (
                          <img src={imageSource} alt="" />
                        ) : (
                          <span className="market-cart-art" aria-hidden="true">F</span>
                        )}
                        <div className="market-cart-item-copy">
                          <span>{item.departmentName}</span>
                          <h3>{item.name}</h3>
                          <p>{item.priceLabel} FCFA{item.priceUnit === "kg" ? " / kg" : ""}</p>
                        </div>
                        <div className="market-cart-quantity" role="group" aria-label={`Quantité de ${item.name}`}>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity - step)}
                            aria-label={`Diminuer ${item.name}`}
                          >
                            −
                          </button>
                          <span aria-live="polite">
                            {formatAmount(item.quantity)}{item.priceUnit === "kg" ? " kg" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuantity(item.id, item.quantity + step)}
                            aria-label={`Augmenter ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                        <strong className="market-cart-line-total">
                          {formatAmount(item.unitPrice * item.quantity)} FCFA
                        </strong>
                        <button
                          className="market-cart-remove"
                          type="button"
                          onClick={() => removeItem(item.id)}
                          aria-label={`Retirer ${item.name} du panier`}
                        >
                          ×
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <p className="market-cart-price-note">
                  Les prix affichés sont indicatifs. Les produits, le stock et le montant final seront confirmés par FiSAFi.
                </p>
              </section>

              <section className="market-order-panel" aria-labelledby="market-order-title">
                <h2 id="market-order-title">Comment vous joindre ?</h2>
                <form ref={formRef} onSubmit={handleSubmit}>
                  <label>
                    Votre nom
                    <input
                      autoComplete="name"
                      name="name"
                      required
                      value={customerName}
                      onChange={(event) => updateDetails(() => setCustomerName(event.target.value))}
                      placeholder="Ex. Aïssatou Diallo"
                    />
                  </label>
                  <label>
                    Téléphone
                    <input
                      autoComplete="tel"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      pattern="[0-9+(). -]{8,20}"
                      title="Saisissez un numéro de téléphone valide."
                      required
                      value={phone}
                      onChange={(event) => updateDetails(() => setPhone(event.target.value))}
                      placeholder="+221 77 000 00 00"
                    />
                  </label>
                  <label>
                    Récupération
                    <select
                      name="fulfillment"
                      value={fulfillment}
                      onChange={(event) => {
                        setFulfillment(event.target.value === "pickup" ? "pickup" : "delivery");
                        setCanConfirm(false);
                      }}
                    >
                      <option value="delivery">Livraison à domicile</option>
                      <option value="pickup">Retrait en magasin</option>
                    </select>
                  </label>
                  {fulfillment === "delivery" && (
                    <label>
                      Adresse de livraison à Dakar
                      <textarea
                        autoComplete="street-address"
                        name="address"
                        required
                        rows={3}
                        value={address}
                        onChange={(event) => updateDetails(() => setAddress(event.target.value))}
                        placeholder="Quartier, rue et indications pour vous trouver"
                      />
                    </label>
                  )}
                  <label>
                    Une précision ? <span>(facultatif)</span>
                    <textarea
                      name="note"
                      rows={2}
                      maxLength={300}
                      value={note}
                      onChange={(event) => updateDetails(() => setNote(event.target.value))}
                      placeholder="Créneau souhaité, détail utile…"
                    />
                  </label>

                  <div className="market-order-total">
                    <span>Estimation du panier</span>
                    <strong>{formatAmount(total)} FCFA</strong>
                  </div>
                  <p className="market-order-disclaimer">Aucun paiement en ligne : la disponibilité et le montant sont confirmés avec vous sur WhatsApp.</p>

                  {canConfirm ? (
                    <a className="market-order-confirm" href={whatsappUrl} target="_blank" rel="noreferrer">
                      Confirmer sur WhatsApp <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <button className="market-order-submit" type="submit">
                      Vérifier mes informations <span aria-hidden="true">→</span>
                    </button>
                  )}
                </form>
              </section>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
