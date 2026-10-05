import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import Head from "next/head";
import Link from "next/link";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";
import { useRouter } from "next/router";
import type {
  SalesCustomer,
  SalesOrder,
  SalesOrderInput,
  SalesOrderLine,
  SalesOrderState,
  SalesOrderSummary,
  SalesProduct,
} from "@/lib/erp/sales";

type OrderLineInput = {
  productId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  unitName: string;
};

const statusLabels: Record<SalesOrderState, string> = {
  draft: "Brouillon",
  sent: "Devis envoyé",
  sale: "Commande confirmée",
  done: "Terminée",
  cancel: "Annulée",
};

function formatDate(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Date non renseignée" : parsed.toLocaleString("fr-FR");
}

function statusClass(state: SalesOrderState): string {
  if (state === "draft" || state === "sent") return "employee-sales-status-pending";
  if (state === "sale" || state === "done") return "employee-sales-status-complete";
  return "employee-sales-status-cancelled";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function isSalesOrderSummary(value: unknown): value is SalesOrderSummary {
  if (!isRecord(value)) return false;
  return (
    Number.isSafeInteger(value.id) &&
    typeof value.reference === "string" &&
    typeof value.state === "string" &&
    Object.prototype.hasOwnProperty.call(statusLabels, value.state) &&
    Number.isSafeInteger(value.customerId) &&
    typeof value.customerName === "string" &&
    typeof value.clientOrderRef === "string" &&
    typeof value.date === "string" &&
    typeof value.amountUntaxed === "number" &&
    typeof value.amountTax === "number" &&
    typeof value.amountTotal === "number" &&
    typeof value.currencyName === "string"
  );
}

function isSalesOrderLine(value: unknown): value is SalesOrderLine {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.id) &&
    typeof value.name === "string" &&
    (typeof value.productId === "number" || value.productId === null) &&
    (typeof value.displayType === "string" || value.displayType === null) &&
    typeof value.quantity === "number" &&
    typeof value.unitPrice === "number" &&
    typeof value.subtotal === "number" &&
    typeof value.total === "number"
  );
}

function isSalesOrder(value: unknown): value is SalesOrder {
  if (!isRecord(value)) return false;
  const noteValue = value.note;
  const lineValues = value.lines;
  return isSalesOrderSummary(value) &&
    typeof noteValue === "string" &&
    Array.isArray(lineValues) &&
    lineValues.every(isSalesOrderLine);
}

function isSalesCustomer(value: unknown): value is SalesCustomer {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.id) &&
    typeof value.name === "string" &&
    (typeof value.email === "string" || value.email === null) &&
    (typeof value.phone === "string" || value.phone === null)
  );
}

function isSalesProduct(value: unknown): value is SalesProduct {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.id) &&
    typeof value.name === "string" &&
    (typeof value.reference === "string" || value.reference === null) &&
    typeof value.unitName === "string" &&
    typeof value.unitPrice === "number"
  );
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(amount);
}

export default function EmployeeSalesPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<SalesOrderSummary[]>([]);
  const ordersLength = useRef(0);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<SalesOrder | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<SalesOrder | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customers, setCustomers] = useState<SalesCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SalesCustomer | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<SalesProduct[]>([]);
  const [lines, setLines] = useState<OrderLineInput[]>([]);
  const [clientOrderRef, setClientOrderRef] = useState("");
  const [note, setNote] = useState("");
  const initialLoadStarted = useRef(false);

  const request = useCallback(async (path: string, init?: RequestInit): Promise<unknown> => {
    const response = await fetch(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    const payload: unknown = await response.json();
    if (response.status === 401) {
      localStorage.removeItem("user");
      void fetch("/api/auth/logout", { method: "POST" });
      await router.replace("/login?session=expired");
      throw new Error("Votre session a expiré. Reconnectez-vous.");
    }
    if (!response.ok) {
      const message = isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "La demande n’a pas abouti.";
      throw new Error(message);
    }
    return payload;
  }, [router]);

  const loadOrders = useCallback(async (append = false, term = appliedSearch) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError("");
    try {
      const offset = append ? ordersLength.current : 0;
      const params = new URLSearchParams({
        offset: String(offset),
        limit: "25",
        search: term,
      });
      const payload = await request(`/api/employee/sales?${params.toString()}`);
      if (!isRecord(payload) || typeof payload.hasMore !== "boolean") {
        throw new Error("Odoo a renvoyé une liste de ventes invalide.");
      }
      const pageOrders = payload.orders;
      if (!Array.isArray(pageOrders) || !pageOrders.every(isSalesOrderSummary)) {
        throw new Error("Odoo a renvoyé une liste de ventes invalide.");
      }
      setOrders((current) => {
        const next = append ? [...current, ...pageOrders] : pageOrders;
        ordersLength.current = next.length;
        return next;
      });
      setHasMore(payload.hasMore);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de charger les commandes.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [appliedSearch, request]);

  useEffect(() => {
    if (router.isReady && !initialLoadStarted.current) {
      initialLoadStarted.current = true;
      void loadOrders(false, "");
    }
  }, [router.isReady, loadOrders]);

  useEffect(() => {
    if (!showForm || customerSearch.trim().length < 2) {
      setCustomers([]);
      return;
    }
    let current = true;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ resource: "customers", search: customerSearch.trim() });
      void request(`/api/employee/sales?${params.toString()}`)
        .then((payload) => {
          if (!isRecord(payload) || !Array.isArray(payload.customers) ||
              !payload.customers.every(isSalesCustomer)) {
            throw new Error("Odoo a renvoyé une liste de clients invalide.");
          }
          if (current) setCustomers(payload.customers);
        })
        .catch((requestError: unknown) => {
          if (current) setFormError(requestError instanceof Error ? requestError.message : "La recherche de clients a échoué.");
        });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [customerSearch, request, showForm]);

  useEffect(() => {
    if (!showForm || productSearch.trim().length < 2) {
      setProducts([]);
      return;
    }
    let current = true;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ resource: "products", search: productSearch.trim() });
      void request(`/api/employee/sales?${params.toString()}`)
        .then((payload) => {
          if (!isRecord(payload) || !Array.isArray(payload.products) ||
              !payload.products.every(isSalesProduct)) {
            throw new Error("Odoo a renvoyé une liste de produits invalide.");
          }
          if (current) setProducts(payload.products);
        })
        .catch((requestError: unknown) => {
          if (current) setFormError(requestError instanceof Error ? requestError.message : "La recherche de produits a échoué.");
        });
    }, 250);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [productSearch, request, showForm]);

  const openNewForm = () => {
    setEditingId(null);
    setSelectedCustomer(null);
    setCustomerSearch("");
    setProductSearch("");
    setLines([]);
    setClientOrderRef("");
    setNote("");
    setFormError("");
    setShowForm(true);
  };

  const openOrder = async (id: number) => {
    setError("");
    try {
      const payload = await request(`/api/employee/sales/${id}`);
      if (!isRecord(payload) || !isSalesOrder(payload.order)) {
        throw new Error("Odoo a renvoyé une commande invalide.");
      }
      setDetail(payload.order);
      setShowDetail(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de charger le devis.");
    }
  };

  const beginEdit = (order: SalesOrder) => {
    if (order.state !== "draft") return;
    setEditingId(order.id);
    setSelectedCustomer({
      id: order.customerId,
      name: order.customerName,
      email: null,
      phone: null,
    });
    setCustomerSearch("");
    setProductSearch("");
    setLines(order.lines
      .filter((line): line is SalesOrderLine & { productId: number } => line.productId !== null)
      .map((line) => ({
        productId: line.productId,
        name: line.name,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        unitName: "Unité",
      })));
    setClientOrderRef(order.clientOrderRef);
    setNote(order.note);
    setFormError("");
    setShowDetail(false);
    setShowForm(true);
  };

  const addProduct = (product: SalesProduct) => {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) => line.productId === product.id
          ? { ...line, quantity: Math.min(99, line.quantity + 1) }
          : line);
      }
      return [...current, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        unitName: product.unitName,
      }];
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    setLines((current) => current.map((line) => line.productId === productId ? { ...line, quantity } : line));
  };

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!selectedCustomer) {
      setFormError("Sélectionnez un client avant d’enregistrer le devis.");
      return;
    }
    if (lines.length === 0 || lines.some((line) => !Number.isFinite(line.quantity) || line.quantity <= 0 || line.quantity > 99)) {
      setFormError("Ajoutez au moins un produit et vérifiez les quantités.");
      return;
    }
    const input: SalesOrderInput = {
      partnerId: selectedCustomer.id,
      clientOrderRef,
      note,
      lines: lines.map(({ productId, quantity }) => ({ productId, quantity })),
    };
    setSaving(true);
    try {
      const payload = await request(
        editingId ? `/api/employee/sales/${editingId}` : "/api/employee/sales",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify(input),
        },
      );
      if (!isRecord(payload) || !isSalesOrder(payload.order)) {
        throw new Error("Odoo n’a pas confirmé l’enregistrement du devis.");
      }
      setShowForm(false);
      setDetail(payload.order);
      setShowDetail(true);
      await loadOrders(false);
    } catch (requestError) {
      setFormError(requestError instanceof Error ? requestError.message : "L’enregistrement du devis a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const confirmOrder = async () => {
    if (!pendingConfirmation) return;
    setConfirming(true);
    setError("");
    try {
      const payload = await request(`/api/employee/sales/${pendingConfirmation.id}/confirm`, { method: "POST" });
      if (!isRecord(payload) || !isSalesOrder(payload.order)) {
        throw new Error("Odoo n’a pas confirmé la commande.");
      }
      setPendingConfirmation(null);
      setDetail(payload.order);
      setShowDetail(true);
      await loadOrders(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "La confirmation de la commande a échoué.");
    } finally {
      setConfirming(false);
    }
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    setAppliedSearch(term);
    setOrders([]);
    ordersLength.current = 0;
    void loadOrders(false, term);
  };

  return (
    <>
      <Head>
        <title>Ventes Odoo — Espace employé FiSAFi</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="employee-portal-page employee-sales">
        <EmployeePortalHeader
          pageClassName="employee-sales-header"
          title="Ventes, devis et commandes"
          backHref="/espace-employe"
          backLabel="Espace employé"
        />
        <section className="employee-sales-content">
          <p className="employee-sales-eyebrow">Module Odoo</p>
          <h1 className="employee-sales-title">Ventes, devis et commandes</h1>
          <p className="employee-sales-subtitle">
            Consultez les ventes Odoo, préparez des devis et confirmez les commandes. Les prix et totaux sont calculés par Odoo.
          </p>
          <div className="employee-sales-notice">
            La confirmation déclenche le flux commercial Odoo et peut lancer les opérations logistiques. Elle ne crée ni facture ni paiement.
          </div>
          <div className="employee-sales-toolbar">
            <Link href="/admin-dashboard" className="employee-sales-back">← Dashboard admin</Link>
            <button type="button" onClick={openNewForm} className="employee-sales-primaryButton">+ Nouveau devis</button>
          </div>
          <form onSubmit={submitSearch} className="employee-sales-searchForm">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Rechercher une référence ou une référence client"
              placeholder="Rechercher par numéro ou référence client…"
              className="employee-sales-searchInput"
            />
            <button type="submit" className="employee-sales-secondaryButton">Rechercher</button>
            <button type="button" className="employee-sales-secondaryButton" disabled={loading} onClick={() => void loadOrders(false)}>
              Actualiser
            </button>
          </form>
          {error && <p role="alert" className="employee-sales-error">{error}</p>}
          {loading ? (
            <p className="employee-sales-empty">Chargement des ventes depuis Odoo…</p>
          ) : orders.length === 0 ? (
            <p className="employee-sales-empty">Aucun devis ou commande trouvé.</p>
          ) : (
            <div className="employee-sales-orderGrid">
              {orders.map((order) => (
                <article key={order.id} className="employee-sales-orderCard">
                  <div className="employee-sales-orderHeading">
                    <div>
                      <h2 className="employee-sales-orderReference">{order.reference}</h2>
                      <p className="employee-sales-customer">{order.customerName}</p>
                    </div>
                    <span className={`employee-sales-status ${statusClass(order.state)}`}>{statusLabels[order.state]}</span>
                  </div>
                  <div className="employee-sales-meta">
                    <span>{formatDate(order.date)}</span>
                    {order.clientOrderRef && <span>Réf. client : {order.clientOrderRef}</span>}
                  </div>
                  <div className="employee-sales-amountRow">
                    <span>Total TTC selon Odoo</span>
                    <strong>{formatAmount(order.amountTotal)} {order.currencyName}</strong>
                  </div>
                  <div className="employee-sales-actions">
                    <button type="button" className="employee-sales-secondaryButton" onClick={() => void openOrder(order.id)}>Détails</button>
                    {(order.state === "draft" || order.state === "sent") && (
                      <button type="button" className="employee-sales-primaryButton" onClick={() => void openOrder(order.id)}>
                        Ouvrir le devis
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          {hasMore && !loading && (
            <button type="button" className="employee-sales-loadMore" disabled={loadingMore} onClick={() => void loadOrders(true)}>
              {loadingMore ? "Chargement…" : "Charger plus"}
            </button>
          )}
        </section>

        {showDetail && detail && (
          <div className="employee-sales-backdrop" role="presentation" onClick={() => setShowDetail(false)}>
            <section className="employee-sales-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title" onClick={(event) => event.stopPropagation()}>
              <div className="employee-sales-modalHeader">
                <div>
                  <p className="employee-sales-eyebrow">Détail Odoo</p>
                  <h2 id="order-detail-title" className="employee-sales-modalTitle">{detail.reference}</h2>
                </div>
                <button type="button" className="employee-sales-closeButton" aria-label="Fermer" onClick={() => setShowDetail(false)}>×</button>
              </div>
              <p className="employee-sales-customer">{detail.customerName} · {statusLabels[detail.state]}</p>
              {detail.clientOrderRef && <p className="employee-sales-meta">Référence client : {detail.clientOrderRef}</p>}
              <div className="employee-sales-lineList">
                {detail.lines.map((line) => (
                  <div key={line.id} className="employee-sales-detailLine">
                    <span>{line.name}{line.productId !== null ? ` × ${line.quantity}` : ""}</span>
                    {line.productId !== null && <strong>{formatAmount(line.total)}</strong>}
                  </div>
                ))}
              </div>
              <div className="employee-sales-totalBox">
                <div><span>Hors taxes</span><strong>{formatAmount(detail.amountUntaxed)} {detail.currencyName}</strong></div>
                <div><span>Taxes</span><strong>{formatAmount(detail.amountTax)} {detail.currencyName}</strong></div>
                <div><span>Total</span><strong>{formatAmount(detail.amountTotal)} {detail.currencyName}</strong></div>
              </div>
              {detail.note && <p className="employee-sales-note">{detail.note}</p>}
              <div className="employee-sales-actions">
                {detail.state === "draft" && (
                  <button type="button" className="employee-sales-secondaryButton" onClick={() => beginEdit(detail)}>Modifier le devis</button>
                )}
                {(detail.state === "draft" || detail.state === "sent") && (
                  <button type="button" className="employee-sales-primaryButton" onClick={() => { setPendingConfirmation(detail); setShowDetail(false); }}>
                    Confirmer la commande
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

        {showForm && (
          <div className="employee-sales-backdrop" role="presentation" onClick={() => !saving && setShowForm(false)}>
            <section className="employee-sales-modal" role="dialog" aria-modal="true" aria-labelledby="order-form-title" onClick={(event) => event.stopPropagation()}>
              <div className="employee-sales-modalHeader">
                <div>
                  <p className="employee-sales-eyebrow">{editingId ? "Modification" : "Nouvelle vente"}</p>
                  <h2 id="order-form-title" className="employee-sales-modalTitle">{editingId ? "Modifier le devis" : "Créer un devis"}</h2>
                </div>
                <button type="button" className="employee-sales-closeButton" aria-label="Fermer" disabled={saving} onClick={() => setShowForm(false)}>×</button>
              </div>
              {formError && <p role="alert" className="employee-sales-error">{formError}</p>}
              <form onSubmit={submitOrder}>
                <label className="employee-sales-label" htmlFor="customer-search">Client Odoo</label>
                {selectedCustomer ? (
                  <div className="employee-sales-selectedCustomer">
                    <span><strong>{selectedCustomer.name}</strong>{selectedCustomer.email ? ` · ${selectedCustomer.email}` : ""}</span>
                    <button type="button" className="employee-sales-textButton" onClick={() => setSelectedCustomer(null)}>Changer</button>
                  </div>
                ) : (
                  <>
                    <input id="customer-search" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="Rechercher un client (2 caractères minimum)" className="employee-sales-input" />
                    {customers.length > 0 && <div className="employee-sales-results">
                      {customers.map((customer) => (
                        <button type="button" key={customer.id} className="employee-sales-result" onClick={() => { setSelectedCustomer(customer); setCustomers([]); setCustomerSearch(""); }}>
                          <strong>{customer.name}</strong><span>{customer.email || customer.phone || "Client Odoo"}</span>
                        </button>
                      ))}
                    </div>}
                  </>
                )}

                <label className="employee-sales-label" htmlFor="order-reference">Référence client (facultatif)</label>
                <input id="order-reference" maxLength={64} value={clientOrderRef} onChange={(event) => setClientOrderRef(event.target.value)} className="employee-sales-input" />

                <label className="employee-sales-label" htmlFor="product-search">Ajouter des produits Odoo</label>
                <input id="product-search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Rechercher un nom ou une référence produit" className="employee-sales-input" />
                {products.length > 0 && <div className="employee-sales-results">
                  {products.map((product) => (
                    <button type="button" key={product.id} className="employee-sales-result" onClick={() => addProduct(product)}>
                      <strong>{product.name}</strong>
                      <span>{product.reference ? `${product.reference} · ` : ""}{formatAmount(product.unitPrice)} / {product.unitName}</span>
                    </button>
                  ))}
                </div>}

                <div className="employee-sales-lineList">
                  {lines.map((line) => (
                    <div key={line.productId} className="employee-sales-editLine">
                      <div className="employee-sales-result-main">
                        <strong className="employee-sales-productName">{line.name}</strong>
                        <small>{formatAmount(line.unitPrice)} / {line.unitName}</small>
                      </div>
                      <input
                        aria-label={`Quantité de ${line.name}`}
                        type="number"
                        min="0.01"
                        max="99"
                        step="0.01"
                        value={line.quantity}
                        onChange={(event) => updateQuantity(line.productId, Number(event.target.value))}
                        className="employee-sales-quantity"
                      />
                      <button type="button" className="employee-sales-removeButton" aria-label={`Retirer ${line.name}`} onClick={() => setLines((current) => current.filter((item) => item.productId !== line.productId))}>Retirer</button>
                    </div>
                  ))}
                  {lines.length === 0 && <p className="employee-sales-emptyInline">Aucun produit sélectionné.</p>}
                </div>

                <label className="employee-sales-label" htmlFor="order-note">Note interne au devis</label>
                <textarea id="order-note" maxLength={2000} value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="employee-sales-input" />
                <p className="employee-sales-helper">Le total définitif, les taxes et les règles de prix sont calculés dans Odoo.</p>
                <div className="employee-sales-actions">
                  <button type="button" className="employee-sales-secondaryButton" disabled={saving} onClick={() => setShowForm(false)}>Annuler</button>
                  <button type="submit" className="employee-sales-primaryButton" disabled={saving}>
                    {saving ? "Enregistrement…" : editingId ? "Enregistrer les modifications" : "Créer le devis"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

        {pendingConfirmation && (
          <div className="employee-sales-backdrop" role="presentation" onClick={() => !confirming && setPendingConfirmation(null)}>
            <section className="employee-sales-confirmModal" role="dialog" aria-modal="true" aria-labelledby="confirm-title" onClick={(event) => event.stopPropagation()}>
              <h2 id="confirm-title" className="employee-sales-modalTitle">Confirmer {pendingConfirmation.reference} ?</h2>
              <p className="employee-sales-confirmText">Cette action confirme la commande dans Odoo et peut déclencher les opérations logistiques. Elle ne crée ni facture ni paiement.</p>
              {error && <p role="alert" className="employee-sales-error">{error}</p>}
              <div className="employee-sales-actions">
                <button
                  type="button"
                  className="employee-sales-secondaryButton"
                  disabled={confirming}
                  onClick={() => setPendingConfirmation(null)}
                >
                  Annuler
                </button>
                <button
                  type="button"
                  className="employee-sales-primaryButton"
                  disabled={confirming}
                  onClick={() => void confirmOrder()}
                >
                  {confirming ? "Confirmation…" : "Confirmer la commande"}
                </button>
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  );
}
