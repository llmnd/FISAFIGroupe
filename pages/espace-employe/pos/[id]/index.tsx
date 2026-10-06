import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";
import { useRouter } from "next/router";
import type {
  PointOfSale,
  POSPaymentMethod,
  POSProduct,
  POSSaleQuote,
  POSSaleResult,
} from "@/lib/erp/contracts";

type Employee = {
  role: string;
  employeeRole: string | null;
};

type ProductPage = {
  products: POSProduct[];
  hasMore: boolean;
};

type CartLine = {
  product: POSProduct;
  quantity: number;
};

function errorMessage(payload: unknown, fallback: string): string {
  return payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : fallback;
}

function money(amount: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(amount)} FCFA`;
}

export default function EmployeePOSPage() {
  const router = useRouter();
  const posId = typeof router.query.id === "string" ? Number(router.query.id) : NaN;
  const [point, setPoint] = useState<PointOfSale | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<POSPaymentMethod[]>([]);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [quote, setQuote] = useState<POSSaleQuote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [submittingSale, setSubmittingSale] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [saleResult, setSaleResult] = useState<POSSaleResult | null>(null);
  const saleOperationId = useRef<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const canSell = employee?.role === "admin" ||
    ["manager", "seller", "cashier"].includes(employee?.employeeRole || "");
  const sessionOpen = point?.session?.status === "opened";

  const handleExpiredSession = useCallback(async () => {
    localStorage.removeItem("user");
    await fetch("/api/auth/logout", { method: "POST" });
    await router.replace("/login?session=expired");
  }, [router]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadPage = useCallback(async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError("");
    }
    try {
      const query = new URLSearchParams({ offset: String(offset), configId: String(posId) });
      if (debouncedSearch) query.set("q", debouncedSearch);
      const response = await fetch(`/api/employee/pos/products?${query}`);
      const payload: unknown = await response.json();
      if (response.status === 401) {
        await handleExpiredSession();
        return;
      }
      if (!response.ok) throw new Error(errorMessage(payload, "Impossible de charger le catalogue."));
      if (
        !payload ||
        typeof payload !== "object" ||
        !("products" in payload) ||
        !Array.isArray(payload.products) ||
        !("hasMore" in payload) ||
        typeof payload.hasMore !== "boolean"
      ) {
        throw new Error("Le catalogue a renvoyé des données invalides.");
      }
      const page = payload as ProductPage;
      setProducts((current) => append ? [...current, ...page.products] : page.products);
      setHasMore(page.hasMore);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Erreur de chargement du catalogue.");
      if (!append) setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, handleExpiredSession, posId, router]);

  useEffect(() => {
    if (!router.isReady || !Number.isSafeInteger(posId) || posId < 1) return;

    let cancelled = false;
    setLoading(true);
    void Promise.all([
      fetch("/api/employee/pos"),
      fetch("/api/employee/me"),
    ]).then(async ([posResponse, employeeResponse]) => {
      const [posPayload, employeePayload]: [unknown, unknown] = await Promise.all([
        posResponse.json(),
        employeeResponse.json(),
      ]);
      if (posResponse.status === 401 || employeeResponse.status === 401) {
        await handleExpiredSession();
        return;
      }
      if (!posResponse.ok || !employeeResponse.ok) {
        throw new Error(errorMessage(posPayload, errorMessage(employeePayload, "Impossible de vérifier les accès à la caisse.")));
      }
      if (
        !posPayload || typeof posPayload !== "object" || !("pointsOfSale" in posPayload) ||
        !Array.isArray(posPayload.pointsOfSale) ||
        !employeePayload || typeof employeePayload !== "object" || !("employee" in employeePayload)
      ) {
        throw new Error("Les données de la caisse sont invalides.");
      }
      if (cancelled) return;
      const selected = (posPayload.pointsOfSale as PointOfSale[]).find((candidate) => candidate.id === posId);
      if (!selected) throw new Error("Ce point de vente n’existe pas ou n’est pas accessible.");
      const profile = employeePayload.employee as Employee;
      setPoint(selected);
      setEmployee(profile);
      if (profile.role !== "admin" && !["manager", "seller", "cashier", "stock"].includes(profile.employeeRole || "")) {
        throw new Error("Votre rôle ne permet pas d’accéder à cette caisse.");
      }
    }).catch((requestError: unknown) => {
      if (!cancelled) setError(requestError instanceof Error ? requestError.message : "Impossible de charger la caisse.");
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [handleExpiredSession, posId, router, router.isReady]);

  useEffect(() => {
    if (!loading && point) void loadPage(0, false);
  }, [debouncedSearch, loadPage, point]);

  useEffect(() => {
    if (!point?.session || point.session.status !== "opened" || !canSell) {
      setPaymentMethods([]);
      setPaymentMethodId("");
      return;
    }
    let cancelled = false;
    void fetch(`/api/employee/pos/${point.id}/payment-methods?sessionId=${point.session.id}`).then(async (response) => {
      const payload: unknown = await response.json();
      if (response.status === 401) {
        await handleExpiredSession();
        return;
      }
      if (!response.ok) throw new Error(errorMessage(payload, "Impossible de charger les moyens de paiement."));
      const methodsPayload: unknown =
        payload && typeof payload === "object" && "methods" in payload
          ? payload.methods
          : null;
      if (
        !Array.isArray(methodsPayload) ||
        !methodsPayload.every((method: unknown) =>
          !!method &&
          typeof method === "object" &&
          "id" in method && Number.isSafeInteger(method.id) &&
          "name" in method && typeof method.name === "string" &&
          "type" in method && (method.type === "cash" || method.type === "bank")
        )
      ) {
        throw new Error("Les moyens de paiement reçus sont invalides.");
      }
      if (cancelled) return;
      const methods = methodsPayload as POSPaymentMethod[];
      setPaymentMethods(methods);
      setPaymentMethodId((current) =>
        methods.some((method) => method.id === Number(current))
          ? current
          : String(methods[0]?.id ?? "")
      );
      setCheckoutError("");
    }).catch((requestError: unknown) => {
      if (!cancelled) {
        setPaymentMethods([]);
        setCheckoutError(requestError instanceof Error
          ? requestError.message
          : "Impossible de charger les moyens de paiement.");
      }
    });
    return () => { cancelled = true; };
  }, [canSell, handleExpiredSession, point]);

  useEffect(() => {
    if (!point?.session || !sessionOpen || !canSell || cart.length === 0) {
      setQuote(null);
      setQuoteError("");
      setQuoting(false);
      return;
    }
    setQuote(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setQuote(null);
      setQuoteError("");
      setQuoting(true);
      void fetch(`/api/employee/pos/${point.id}/quote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: point.session!.id,
          lines: cart.map(({ product, quantity }) => ({
            variantId: Number(product.variantRef),
            quantity,
          })),
        }),
        signal: controller.signal,
      }).then(async (response) => {
        const payload: unknown = await response.json();
        if (response.status === 401) {
          await handleExpiredSession();
          return;
        }
        if (!response.ok) throw new Error(errorMessage(payload, "Le total n’a pas pu être confirmé."));
        if (
          !payload ||
          typeof payload !== "object" ||
          !("quote" in payload) ||
          !payload.quote ||
          typeof payload.quote !== "object" ||
          !("amountTotal" in payload.quote) ||
          typeof payload.quote.amountTotal !== "number" ||
          !Number.isFinite(payload.quote.amountTotal) ||
          !("amountTax" in payload.quote) ||
          typeof payload.quote.amountTax !== "number" ||
          !Number.isFinite(payload.quote.amountTax)
        ) {
          throw new Error("Le total reçu est invalide.");
        }
        if (controller.signal.aborted) return;
        setQuote(payload.quote as POSSaleQuote);
        setAmountReceived(String(payload.quote.amountTotal));
        setQuoteError("");
      }).catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setQuote(null);
          setQuoteError(requestError instanceof Error
            ? requestError.message
            : "Le total n’a pas pu être confirmé.");
        }
      }).finally(() => {
        if (!controller.signal.aborted) setQuoting(false);
      });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [canSell, cart, handleExpiredSession, point, sessionOpen]);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.product.unitPrice * line.quantity, 0),
    [cart],
  );

  const addProduct = (product: POSProduct) => {
    if (!canSell || !sessionOpen || !product.variantRef || product.availableQuantity < 1) return;
    setCart((current) => {
      const line = current.find((item) => item.product.id === product.id);
      if (!line) return [...current, { product, quantity: 1 }];
      if (line.quantity >= product.availableQuantity) return current;
      return current.map((item) => item.product.id === product.id
        ? { ...item, quantity: item.quantity + 1 }
        : item);
    });
  };

  const updateQuantity = (productId: number, nextQuantity: number) => {
    setCart((current) => current.flatMap((line) => {
      if (line.product.id !== productId) return [line];
      if (!Number.isInteger(nextQuantity) || nextQuantity <= 0) return [];
      if (line.product.availableQuantity < 1) return [];
      if (nextQuantity > line.product.availableQuantity) {
        return [{ ...line, quantity: line.product.availableQuantity }];
      }
      return [{ ...line, quantity: nextQuantity }];
    }));
  };

  const submitSale = async () => {
    if (!point?.session || !quote || !paymentMethodId || submittingSale || cart.length === 0) return;
    const received = Number(amountReceived);
    if (!Number.isSafeInteger(received) || received < quote.amountTotal) {
      setCheckoutError("Le montant reçu doit couvrir le total confirmé.");
      return;
    }
    const selectedMethod = paymentMethods.find((method) => method.id === Number(paymentMethodId));
    if (!selectedMethod) {
      setCheckoutError("Sélectionnez un moyen de paiement valide.");
      return;
    }
    if (selectedMethod.type !== "cash" && received !== quote.amountTotal) {
      setCheckoutError("Pour ce moyen de paiement, le montant doit être égal au total.");
      return;
    }
    saleOperationId.current ||= crypto.randomUUID();
    setSubmittingSale(true);
    setCheckoutError("");
    try {
      const response = await fetch(`/api/employee/pos/${point.id}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operationId: saleOperationId.current,
          sessionId: point.session.id,
          paymentMethodId: selectedMethod.id,
          amountReceived: received,
          lines: cart.map(({ product, quantity }) => ({
            variantId: Number(product.variantRef),
            quantity,
          })),
        }),
      });
      const payload: unknown = await response.json();
      if (response.status === 401) {
        await handleExpiredSession();
        return;
      }
      if (!response.ok) throw new Error(errorMessage(payload, "La vente n’a pas été confirmée."));
      if (
        !payload ||
        typeof payload !== "object" ||
        !("sale" in payload) ||
        !payload.sale ||
        typeof payload.sale !== "object" ||
        !("reference" in payload.sale) ||
        typeof payload.sale.reference !== "string" ||
        !("orderId" in payload.sale) ||
        typeof payload.sale.orderId !== "number" ||
        !("amountTotal" in payload.sale) ||
        typeof payload.sale.amountTotal !== "number" ||
        !("change" in payload.sale) ||
        typeof payload.sale.change !== "number"
      ) {
        throw new Error("La confirmation de vente reçue est invalide.");
      }
      setSaleResult(payload.sale as POSSaleResult);
      setCart([]);
      setQuote(null);
      setAmountReceived("");
      saleOperationId.current = null;
    } catch (requestError) {
      setCheckoutError(requestError instanceof Error
        ? requestError.message
        : "La vente n’a pas pu être confirmée. Réessayez avec la même clé de vente.");
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <>
      <Head>
        <title>FiSAFi POS — {point?.name || "Caisse"}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="employee-portal-page employee-pos">
        <EmployeePortalHeader
          pageClassName="employee-pos-header"
          title="FiSAFi POS"
          backHref="/espace-employe/points-de-vente"
          backLabel="Points de vente"
          context={
            <div className="employee-pos-headerPoint">
              <span className="employee-pos-headerLabel">Point de vente</span>
              <strong>{point?.name || "Chargement…"}</strong>
            </div>
          }
        />
        <div className="employee-pos-workspace">
          {error && <p role="alert" className="employee-pos-error">{error}</p>}
          {loading ? (
            <p className="employee-pos-notice">Vérification des droits et de la session de caisse…</p>
          ) : point && (
            <>
              {!sessionOpen && (
                <div role="status" className="employee-pos-warning">
                  <strong>Aucune session de caisse ouverte.</strong>
                  <span>Les articles restent consultables, mais le panier et l’encaissement sont désactivés.</span>
                  {point.session ? (
                    <span>Session actuelle : {point.session.name} — {point.session.status}. Faites vérifier son état avant toute ouverture.</span>
                  ) : (
                    <Link href={`/espace-employe/pos/${point.id}/ouvrir`} className="employee-pos-warningLink">Voir l’état d’ouverture de caisse →</Link>
                  )}
                </div>
              )}
              <div className="pos-layout employee-pos-layout">
                <section className="employee-pos-catalog">
                  <div className="employee-pos-sectionHeader">
                    <div>
                      <p className="employee-pos-eyebrow">Catalogue</p>
                      <h2 className="employee-pos-sectionTitle">Produits</h2>
                    </div>
                    <span className="employee-pos-count">{products.length} affiché(s)</span>
                  </div>
                  <label className="employee-pos-searchLabel" htmlFor="pos-search">Recherche par nom ou référence</label>
                  <input
                    id="pos-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Ex. riz, REF-001…"
                    className="employee-pos-search"
                  />
                  {loading ? (
                    <p className="employee-pos-notice">Chargement du catalogue…</p>
                  ) : products.length === 0 ? (
                    <p className="employee-pos-empty">{error ? "Le catalogue n’a pas pu être chargé." : "Aucun produit trouvé."}</p>
                  ) : (
                    <div className="pos-product-grid employee-pos-productGrid">
                      {products.map((product) => {
                        const canAdd = !!canSell && !!sessionOpen && !!product.variantRef && product.availableQuantity > 0;
                        return (
                          <article key={product.id} className="employee-pos-productCard">
                            <div className="employee-pos-imageFrame">
                              {product.imageUrl
                                ? <img src={product.imageUrl} alt="" className="employee-pos-productImage" loading="lazy" />
                                : <span className="employee-pos-imagePlaceholder">FiSAFi</span>}
                            </div>
                            <div className="employee-pos-productInfo">
                              <h3 className="employee-pos-productName">{product.name}</h3>
                              {product.reference && <span className="employee-pos-reference">Réf. {product.reference}</span>}
                              <strong className="employee-pos-price">{money(product.unitPrice)}</strong>
                              <span className="employee-pos-stock">
                                {product.variantChoiceRequired
                                  ? "Choix de variante requis"
                                  : `${product.availableQuantity} ${product.unitName} disponible(s)`}
                              </span>
                              <button
                                type="button"
                                className={`employee-pos-add-button ${canAdd ? "" : "is-disabled"}`}
                                disabled={!canAdd}
                                onClick={() => addProduct(product)}
                              >
                                Ajouter au panier
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                  {hasMore && !loading && (
                    <button
                      type="button"
                      className="employee-pos-loadMore"
                      disabled={loadingMore}
                      onClick={() => void loadPage(products.length, true)}
                    >
                      {loadingMore ? "Chargement…" : "Charger plus"}
                    </button>
                  )}
                </section>

                <aside className="pos-cart-panel employee-pos-cartPanel">
                  <div className="employee-pos-sectionHeader">
                    <div>
                      <p className="employee-pos-eyebrow">Vente anonyme</p>
                      <h2 className="employee-pos-sectionTitle">Panier</h2>
                    </div>
                    <span className="employee-pos-count">{cart.reduce((count, line) => count + line.quantity, 0)} article(s)</span>
                  </div>
                  {cart.length === 0 ? (
                    <p className="employee-pos-emptyCart">Ajoutez des produits pour préparer un panier.</p>
                  ) : (
                    <div className="employee-pos-cartLines">
                      {cart.map(({ product, quantity }) => (
                        <div key={product.id} className="employee-pos-cartLine">
                          <div className="employee-pos-cartProduct">
                            <strong>{product.name}</strong>
                            <span>{money(product.unitPrice)} / {product.unitName}</span>
                          </div>
                          <div className="employee-pos-quantityControls">
                            <button type="button" aria-label={`Diminuer ${product.name}`} onClick={() => updateQuantity(product.id, quantity - 1)} className="employee-pos-quantityButton">−</button>
                            <span>{quantity}</span>
                            <button type="button" aria-label={`Augmenter ${product.name}`} onClick={() => updateQuantity(product.id, quantity + 1)} className="employee-pos-quantityButton" disabled={quantity >= product.availableQuantity}>+</button>
                          </div>
                          <strong className="employee-pos-lineTotal">{money(product.unitPrice * quantity)}</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="employee-pos-totalRow">
                    <span>{quote ? "Total confirmé par FiSAFi" : "Total indicatif"}</span>
                    <strong>{money(quote?.amountTotal ?? total)}</strong>
                  </div>
                  {quote && quote.amountTax > 0 && (
                    <p className="employee-pos-taxRow">Taxes incluses : {money(quote.amountTax)}</p>
                  )}
                  {cart.length > 0 && (
                    <>
                      <label htmlFor="pos-payment-method" className="employee-pos-searchLabel">Moyen de paiement</label>
                      <select
                        id="pos-payment-method"
                        value={paymentMethodId}
                        onChange={(event) => setPaymentMethodId(event.target.value)}
                        className="employee-pos-search"
                        disabled={submittingSale || paymentMethods.length === 0}
                      >
                        <option value="">Sélectionner un moyen de paiement</option>
                        {paymentMethods.map((method) => (
                          <option key={method.id} value={method.id}>{method.name}</option>
                        ))}
                      </select>
                      <label htmlFor="pos-amount-received" className="employee-pos-searchLabel">Montant reçu (FCFA)</label>
                      <input
                        id="pos-amount-received"
                        type="number"
                        min={quote?.amountTotal ?? 0}
                        step="1"
                        inputMode="numeric"
                        value={amountReceived}
                        onChange={(event) => setAmountReceived(event.target.value)}
                        className="employee-pos-search"
                        disabled={submittingSale || !quote}
                      />
                      {quote && paymentMethods.find((method) => method.id === Number(paymentMethodId))?.type === "cash" && Number(amountReceived) >= quote.amountTotal && (
                        <p className="employee-pos-taxRow">Monnaie à rendre : {money(Number(amountReceived) - quote.amountTotal)}</p>
                      )}
                    </>
                  )}
                  {quoting && <p role="status" className="employee-pos-notice">Vérification du prix et des taxes…</p>}
                  {quoteError && <p role="alert" className="employee-pos-error">{quoteError}</p>}
                  {checkoutError && <p role="alert" className="employee-pos-error">{checkoutError}</p>}
                  {saleResult && (
                    <p role="status" className="employee-pos-success">
                      Vente confirmée par FiSAFi : {saleResult.reference}. Total {money(saleResult.amountTotal)}.
                      {saleResult.change > 0 ? ` Monnaie rendue : ${money(saleResult.change)}.` : ""}
                    </p>
                  )}
                  <button
                    type="button"
                    className={`employee-pos-checkout ${(!quote || !paymentMethodId || submittingSale || !!quoteError || cart.length === 0) ? "is-disabled" : ""}`}
                    disabled={!quote || !paymentMethodId || submittingSale || !!quoteError || cart.length === 0}
                    onClick={() => void submitSale()}
                  >
                    {submittingSale ? "Confirmation en cours…" : "Encaisser et enregistrer la vente"}
                  </button>
                </aside>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
