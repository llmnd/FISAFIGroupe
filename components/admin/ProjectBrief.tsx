import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  DEFAULT_PROJECT_BRIEF,
  isProjectBriefRecord,
  type ProjectBriefDraft,
  type ProjectBriefModuleStatus,
  type ProjectBriefRecord,
  type ProjectBriefStatus,
} from "@/lib/projectBrief";

interface PreviewProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
}

const INITIAL_PREVIEW_PRODUCTS: PreviewProduct[] = [
  { id: "PR-001", name: "Audit réseau & diagnostic", category: "Service", price: 118000, stock: 8 },
  { id: "PR-002", name: "Routeur professionnel", category: "Équipement", price: 175000, stock: 4 },
  { id: "PR-003", name: "Câble réseau Cat 6 · 10 m", category: "Accessoire", price: 12500, stock: 24 },
  { id: "PR-004", name: "Switch réseau 8 ports", category: "Équipement", price: 65000, stock: 7 },
];

const ACCOUNTING_PREVIEW_ROWS = [
  { date: "02/10/2026", ref: "VT-001", label: "Vente comptoir · exemple", account: "571", accountName: "Caisse", debit: "118 000", credit: "—" },
  { date: "02/10/2026", ref: "VT-001", label: "Vente de marchandises", account: "701", accountName: "Ventes de marchandises", debit: "—", credit: "100 000" },
  { date: "02/10/2026", ref: "VT-001", label: "TVA collectée · à valider", account: "4432", accountName: "État, TVA facturée", debit: "—", credit: "18 000" },
  { date: "04/10/2026", ref: "AC-014", label: "Achat de fournitures · exemple", account: "605", accountName: "Autres achats", debit: "75 000", credit: "—" },
  { date: "04/10/2026", ref: "AC-014", label: "Règlement fournisseur", account: "521", accountName: "Banques locales", debit: "—", credit: "75 000" },
  { date: "07/10/2026", ref: "CL-008", label: "Facture client · à encaisser", account: "411", accountName: "Clients", debit: "236 000", credit: "—" },
  { date: "07/10/2026", ref: "CL-008", label: "Prestation de service", account: "706", accountName: "Services vendus", debit: "—", credit: "200 000" },
  { date: "07/10/2026", ref: "CL-008", label: "TVA collectée · exemple", account: "4432", accountName: "État, TVA facturée", debit: "—", credit: "36 000" },
];

const STATUS_LABELS: Record<ProjectBriefStatus, string> = {
  draft: "À cadrer",
  discussion: "En discussion",
  approved: "Validé pour chiffrage",
};

const CURRENCY_FORMAT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

function formatPreviewCurrency(amount: number): string {
  return `${CURRENCY_FORMAT.format(amount)} FCFA`;
}

function BriefFunctionalPreview() {
  const [activePreview, setActivePreview] = useState<"pos" | "products" | "accounting">("pos");
  const [products, setProducts] = useState(INITIAL_PREVIEW_PRODUCTS);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState("");

  const cartTotal = products.reduce((sum, product) => sum + product.price * (cart[product.id] ?? 0), 0);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);

  const addProductToCart = (product: PreviewProduct) => {
    const currentQuantity = cart[product.id] ?? 0;
    if (currentQuantity >= product.stock) {
      setFeedback("Stock fictif atteint : ajustez la quantité avant de continuer.");
      return;
    }
    setCart((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }));
    setFeedback(`${product.name} ajouté au ticket de démonstration.`);
  };

  const savePreviewProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const id = String(values.get("reference") ?? "").trim().toUpperCase();
    const name = String(values.get("name") ?? "").trim();
    const category = String(values.get("category") ?? "Équipement");
    const price = Number(values.get("price"));
    const stock = Number(values.get("stock"));
    if (!id || !name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setFeedback("Vérifiez la référence, le nom, le prix et le stock du produit.");
      return;
    }
    if (products.some((product) => product.id === id)) {
      setFeedback(`La référence ${id} existe déjà dans ce catalogue fictif.`);
      return;
    }
    setProducts((current) => [...current, { id, name, category, price, stock }]);
    form.reset();
    setFeedback(`${name} a été ajouté au catalogue de démonstration.`);
  };

  const savePreviewSale = () => {
    if (cartCount === 0) return;
    setProducts((current) => current.map((product) => ({
      ...product,
      stock: Math.max(0, product.stock - (cart[product.id] ?? 0)),
    })));
    setCart({});
    setFeedback("Vente fictive enregistrée. Seul le stock de cette maquette a été mis à jour.");
  };

  return (
    <section className="brief-panel brief-preview-panel">
      <div className="brief-panel-heading">
        <div><span className="brief-panel-index">APERÇU · MAQUETTE ODOO-LIKE</span><h3>Explorez les modules proposés</h3><p>Une simulation de présentation pour visualiser les usages avant le développement.</p></div>
        <span className="brief-preview-badge"><i /> DONNÉES FICTIVES</span>
      </div>
      <div className="brief-preview-tabs" role="tablist" aria-label="Aperçu des modules de gestion">
        <button type="button" role="tab" aria-selected={activePreview === "pos"} className={activePreview === "pos" ? "active" : ""} onClick={() => { setActivePreview("pos"); setFeedback(""); }}>Point de vente</button>
        <button type="button" role="tab" aria-selected={activePreview === "products"} className={activePreview === "products" ? "active" : ""} onClick={() => { setActivePreview("products"); setFeedback(""); }}>Produits & stock</button>
        <button type="button" role="tab" aria-selected={activePreview === "accounting"} className={activePreview === "accounting" ? "active" : ""} onClick={() => { setActivePreview("accounting"); setFeedback(""); }}>Comptabilité OHADA</button>
      </div>

      {activePreview === "pos" && (
        <div className="brief-preview-pos" role="tabpanel">
          <div className="brief-preview-products">
            <div className="brief-preview-subheading"><strong>Catalogue de démonstration</strong><span>{products.length} produits</span></div>
            <div className="brief-preview-product-grid">
              {products.slice(0, 8).map((product) => (
                <button type="button" className="brief-preview-product" key={product.id} onClick={() => addProductToCart(product)} disabled={product.stock === 0}>
                  <span className="brief-product-mark">◇</span><small>{product.category}</small><strong>{product.name}</strong><span className="brief-product-price">{formatPreviewCurrency(product.price)}</span><span className="brief-product-stock">{product.stock} en stock</span>
                </button>
              ))}
            </div>
          </div>
          <aside className="brief-preview-cart">
            <span className="brief-panel-index">COMMANDE EN COURS</span><h4>Ticket de caisse</h4>
            {cartCount === 0 ? <p className="brief-cart-empty">Sélectionnez un produit pour commencer.</p> : (
              <div className="brief-cart-items">{products.filter((product) => cart[product.id]).map((product) => (
                <div key={product.id}><span>{product.name} × {cart[product.id]}</span><strong>{formatPreviewCurrency(product.price * cart[product.id])}</strong></div>
              ))}</div>
            )}
            <div className="brief-cart-total"><span>{cartCount} article{cartCount > 1 ? "s" : ""}</span><strong>{formatPreviewCurrency(cartTotal)}</strong></div>
            <button className="brief-preview-action" type="button" onClick={savePreviewSale} disabled={cartCount === 0}>Enregistrer la vente fictive <span>→</span></button>
          </aside>
        </div>
      )}

      {activePreview === "products" && (
        <div className="brief-preview-inventory" role="tabpanel">
          <div className="brief-preview-subheading"><strong>Catalogue produits</strong><span>Ajout local à la maquette · {products.length} articles</span></div>
          <div className="brief-preview-table-wrap"><table className="brief-preview-table"><thead><tr><th>RÉFÉRENCE</th><th>PRODUIT</th><th>CATÉGORIE</th><th>PRIX TTC</th><th>STOCK</th></tr></thead><tbody>
            {products.map((product) => <tr key={product.id}><td><code>{product.id}</code></td><td><strong>{product.name}</strong></td><td>{product.category}</td><td>{formatPreviewCurrency(product.price)}</td><td><span className={`brief-preview-stock${product.stock <= 5 ? " low" : ""}`}>{product.stock} unité{product.stock > 1 ? "s" : ""}</span></td></tr>)}
          </tbody></table></div>
          <form className="brief-preview-product-form" onSubmit={savePreviewProduct}>
            <h4>Ajouter un produit de démonstration</h4>
            <div><label>Nom du produit<input name="name" required maxLength={80} placeholder="Ex. Point d’accès Wi-Fi" /></label><label>Référence<input name="reference" required maxLength={16} placeholder="WIFI-01" /></label><label>Catégorie<select name="category"><option>Équipement</option><option>Accessoire</option><option>Service</option></select></label><label>Prix TTC · FCFA<input name="price" type="number" min="1" step="1" required placeholder="25000" /></label><label>Stock initial<input name="stock" type="number" min="0" step="1" required placeholder="10" /></label><button type="submit">Ajouter au catalogue <span>＋</span></button></div>
            <p>Les produits ajoutés sont fictifs et restent dans cette session de démonstration.</p>
          </form>
        </div>
      )}

      {activePreview === "accounting" && (
        <div className="brief-preview-ledger" role="tabpanel">
          <div className="brief-ledger-summary"><span>EXEMPLE DE JOURNAL SYSCOHADA RÉVISÉ · OCTOBRE 2026</span><strong>Totaux équilibrés <i>429 000 FCFA</i></strong></div>
          <div className="brief-preview-table-wrap"><table className="brief-preview-table"><thead><tr><th>DATE</th><th>PIÈCE</th><th>LIBELLÉ</th><th>COMPTE OHADA</th><th>INTITULÉ</th><th>DÉBIT</th><th>CRÉDIT</th></tr></thead><tbody>
            {ACCOUNTING_PREVIEW_ROWS.map((row) => <tr key={`${row.ref}-${row.account}`}><td>{row.date}</td><td>{row.ref}</td><td>{row.label}</td><td><code>{row.account}</code></td><td>{row.accountName}</td><td>{row.debit}</td><td>{row.credit}</td></tr>)}
          </tbody></table></div>
          <p className="brief-ledger-warning"><strong>À valider avec le comptable :</strong> comptes, TVA, libellés et écritures dépendent du régime fiscal et de l’activité. Exemple pédagogique, pas un conseil comptable.</p>
        </div>
      )}

      <p className="brief-preview-feedback" role="status" aria-live="polite">{feedback || "Cette maquette est indépendante du cahier enregistré et ne crée aucune vraie vente ni écriture comptable."}</p>
    </section>
  );
}

export default function ProjectBrief() {
  const [record, setRecord] = useState<ProjectBriefRecord | null>(null);
  const [draft, setDraft] = useState<ProjectBriefDraft>(DEFAULT_PROJECT_BRIEF);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflictRecord, setConflictRecord] = useState<ProjectBriefRecord | null>(null);
  const draftRef = useRef(draft);
  const dirtyRef = useRef(dirty);
  const recordRef = useRef(record);

  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => { recordRef.current = record; }, [record]);

  const applyRecord = useCallback((nextRecord: ProjectBriefRecord) => {
    setRecord(nextRecord);
    setDraft({
      budget: nextRecord.budget,
      targetDate: nextRecord.targetDate,
      status: nextRecord.status,
      priorities: nextRecord.priorities,
      notes: nextRecord.notes,
      modules: nextRecord.modules,
    });
    setDirty(false);
    setConflictRecord(null);
  }, []);

  const loadBrief = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const response = await fetch("/api/admin/project-brief", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload, `Chargement impossible (HTTP ${response.status}).`));
      if (!isProjectBriefRecord(payload)) throw new Error("Le serveur a renvoyé un cahier des charges invalide.");
      const current = recordRef.current;
      if (!dirtyRef.current && (!current || current.version !== payload.version)) applyRecord(payload);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Impossible de charger le cahier des charges.";
      if (!silent) setError(message);
      else console.error("[Admin/ProjectBrief] Could not refresh the shared brief:", loadError);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyRecord]);

  useEffect(() => {
    void loadBrief();
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !dirtyRef.current) void loadBrief(true);
    }, 8_000);
    return () => window.clearInterval(refreshTimer);
  }, [loadBrief]);

  const updateDraft = (update: Partial<ProjectBriefDraft>) => {
    setDraft((current) => ({ ...current, ...update }));
    setDirty(true);
    setNotice("");
    setConflictRecord(null);
  };

  const updateModule = (
    moduleId: string,
    update: Partial<Pick<ProjectBriefDraft["modules"][number], "status" | "features">>,
  ) => {
    setDraft((current) => ({
      ...current,
      modules: current.modules.map((module) => module.id === moduleId ? { ...module, ...update } : module),
    }));
    setDirty(true);
    setNotice("");
    setConflictRecord(null);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!record || saving) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/project-brief", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, version: record.version }),
      });
      const payload: unknown = await response.json();
      if (response.status === 409) {
        const current = payload && typeof payload === "object" && "current" in payload ? payload.current : null;
        if (isProjectBriefRecord(current)) setConflictRecord(current);
        throw new Error(getErrorMessage(payload, "Une autre personne a enregistré une version plus récente."));
      }
      if (!response.ok) throw new Error(getErrorMessage(payload, `Enregistrement impossible (HTTP ${response.status}).`));
      if (!isProjectBriefRecord(payload)) throw new Error("Le serveur a renvoyé un cahier des charges invalide.");
      applyRecord(payload);
      setNotice("Modifications enregistrées. Elles sont maintenant visibles dans l’espace administrateur.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d’enregistrer le cahier des charges.");
    } finally {
      setSaving(false);
    }
  };

  const handleReloadLatest = () => {
    if (conflictRecord) {
      applyRecord(conflictRecord);
      setError("");
      setNotice("La dernière version enregistrée a été rechargée.");
    } else {
      void loadBrief();
    }
  };

  const selectedCount = draft.modules.filter((module) => module.status === "included").length;
  const budgetDisplay = draft.budget === null ? "À définir" : `${CURRENCY_FORMAT.format(draft.budget)} FCFA`;
  const updateModuleFeatures = (moduleId: string, event: ChangeEvent<HTMLTextAreaElement>) => {
    updateModule(moduleId, { features: event.target.value.split("\n").slice(0, 20) });
  };

  return (
    <section className="project-brief">
      <header className="brief-hero">
        <div className="brief-hero-copy">
          <div className="brief-eyebrow"><span /> PROJET DE TRANSFORMATION · FISAFI GROUPE</div>
          <h1>Le cahier des charges<br /><span>de votre futur outil.</span></h1>
          <p>Précisez vos priorités, ajustez les modules et indiquez le budget envisagé. Vos changements seront partagés avec l’équipe projet après enregistrement.</p>
          <div className="brief-hero-meta">
            <span className={`brief-status-pill status-${draft.status}`}>{STATUS_LABELS[draft.status]}</span>
            <span className="brief-access-note">Accès limité aux administrateurs</span>
          </div>
        </div>
        <div className="brief-hero-art" aria-hidden="true">
          <div className="brief-art-orbit orbit-a" /><div className="brief-art-orbit orbit-b" />
          <div className="brief-art-card">
            <div className="brief-art-top"><span>PROJET FiSAFi</span><span>↗</span></div>
            <strong>{String(selectedCount).padStart(2, "0")}<small> / {String(draft.modules.length).padStart(2, "0")}</small></strong>
            <span>modules à inclure</span>
            <div className="brief-art-bars"><i /><i /><i /><i /><i /><i /></div>
            <div className="brief-art-foot"><span><i /> Cadrage en cours</span><span>FCFA</span></div>
          </div>
          <span className="brief-art-badge">✳ À VOUS DE DÉCIDER</span>
        </div>
        <div className="brief-hero-bottom"><span>01 / EXPRESSION DES BESOINS</span><span>VOTRE PROJET · VOTRE PÉRIMÈTRE</span></div>
      </header>

      <div className="brief-workspace">
        <div className="brief-page-heading">
          <div><span className="brief-section-label">ESPACE PROJET · VERSION {record ? `V${Math.max(1, record.version)}` : "…"}</span><h2>Définissons le périmètre.</h2><p>Modifiez les sections ci-dessous, puis enregistrez vos choix pour les partager.</p></div>
          <div className={`brief-save-indicator${dirty ? " is-dirty" : ""}`} aria-live="polite"><i />{saving ? "Enregistrement…" : dirty ? "Modifications non enregistrées" : "Données synchronisées"}</div>
        </div>

        {error && <div className="brief-alert brief-alert-error" role="alert"><span>!</span><p>{error}{conflictRecord ? <> <button type="button" onClick={handleReloadLatest}>Recharger la dernière version</button></> : <> <button type="button" onClick={() => void loadBrief()}>Réessayer</button></>}</p></div>}
        {notice && <div className="brief-alert brief-alert-success" role="status"><span>✓</span><p>{notice}</p></div>}

        {loading ? (
          <div className="brief-loading" role="status"><span className="spinner" /> Chargement du cahier des charges…</div>
        ) : (
          <form className="brief-form" onSubmit={handleSave}>
            <div className="brief-layout">
              <div className="brief-main-column">
                <section className="brief-panel brief-overview-panel">
                  <div className="brief-panel-heading"><div><span className="brief-panel-index">01 / CADRAGE</span><h3>Votre vision du projet</h3><p>Ces informations nous aident à préparer le bon périmètre et le bon devis.</p></div><span className="brief-panel-symbol">✳</span></div>
                  <div className="brief-fields-grid">
                    <label className="brief-field"><span>Budget envisagé <small>facultatif</small></span><div className="brief-budget-input"><input aria-label="Budget envisagé en FCFA" type="number" min="0" max="1000000000000" step="10000" placeholder="Ex. 2 500 000" value={draft.budget ?? ""} onChange={(event) => updateDraft({ budget: event.target.value === "" ? null : Number(event.target.value) })} /><b>FCFA</b></div><small>Indiquez une enveloppe approximative ou laissez vide.</small></label>
                    <label className="brief-field"><span>Date cible souhaitée <small>facultatif</small></span><input aria-label="Date cible souhaitée" type="date" value={draft.targetDate} onChange={(event) => updateDraft({ targetDate: event.target.value })} /><small>La faisabilité sera confirmée au cadrage.</small></label>
                    <label className="brief-field brief-field-full"><span>Statut du cadrage</span><select value={draft.status} onChange={(event) => updateDraft({ status: event.target.value as ProjectBriefStatus })}><option value="draft">À cadrer</option><option value="discussion">En discussion</option><option value="approved">Validé pour chiffrage</option></select><small>Le statut « validé » confirme le périmètre, pas le lancement des travaux.</small></label>
                    <label className="brief-field brief-field-full"><span>Vos trois priorités</span><textarea rows={3} maxLength={3000} placeholder="Ex. 1. Suivre les ventes&#10;2. Gérer le stock&#10;3. Maîtriser la comptabilité" value={draft.priorities} onChange={(event) => updateDraft({ priorities: event.target.value })} /><small>Quels problèmes souhaitez-vous résoudre en premier ?</small></label>
                  </div>
                </section>

                <section className="brief-panel brief-modules-panel">
                  <div className="brief-panel-heading"><div><span className="brief-panel-index">02 / FONCTIONNALITÉS</span><h3>Les modules à votre mesure</h3><p>Choisissez le niveau de priorité et ajustez les fonctionnalités proposées.</p></div><span className="brief-modules-count">{selectedCount} inclus</span></div>
                  <div className="brief-module-list">
                    {draft.modules.map((module, index) => (
                      <article className={`brief-module-card module-${module.status}`} key={module.id}>
                        <div className="brief-module-top">
                          <span className="brief-module-icon">{String(index + 1).padStart(2, "0")}</span>
                          <div className="brief-module-name"><h4>{module.name}</h4><span>{module.features.length} fonctionnalités proposées</span></div>
                          <label className="brief-module-status"><span className="visually-hidden">Priorité — {module.name}</span><select value={module.status} onChange={(event) => updateModule(module.id, { status: event.target.value as ProjectBriefModuleStatus })}><option value="included">À inclure</option><option value="optional">À discuter</option><option value="excluded">Non prévu</option></select></label>
                        </div>
                        <label className="brief-module-features"><span>Fonctionnalités souhaitées <small>une par ligne</small></span><textarea aria-label={`Fonctionnalités souhaitées — ${module.name}`} rows={Math.min(4, Math.max(2, module.features.length))} maxLength={4800} value={module.features.join("\n")} onChange={(event) => updateModuleFeatures(module.id, event)} /></label>
                      </article>
                    ))}
                  </div>
                </section>

                <BriefFunctionalPreview />

                <section className="brief-panel brief-notes-panel">
                  <div className="brief-panel-heading"><div><span className="brief-panel-index">03 / CONTEXTE</span><h3>Informations complémentaires</h3><p>Ajoutez les particularités de FiSAFi, contraintes ou questions à examiner.</p></div></div>
                  <label className="brief-field brief-field-full"><span>Vos précisions</span><textarea rows={5} maxLength={8000} placeholder="Ex. Plusieurs points de vente, nombre d’utilisateurs, modes de règlement, logiciels à connecter…" value={draft.notes} onChange={(event) => updateDraft({ notes: event.target.value })} /><small>{draft.notes.length} / 8 000 caractères</small></label>
                </section>
              </div>

              <aside className="brief-summary-column">
                <div className="brief-summary-card">
                  <div className="brief-summary-heading"><span>VOTRE PROJET</span><span>F.</span></div>
                  <h3>Un outil de gestion<br />construit pour FiSAFi.</h3>
                  <div className="brief-summary-stat"><span>Budget envisagé</span><strong>{budgetDisplay}</strong></div>
                  <div className="brief-summary-stat"><span>Modules à inclure</span><strong>{selectedCount} <small>/ {draft.modules.length}</small></strong></div>
                  <div className="brief-summary-stat"><span>Statut</span><strong className={`summary-status-text status-text-${draft.status}`}>{STATUS_LABELS[draft.status]}</strong></div>
                  <div className="brief-summary-divider" />
                  <p>Le budget n’est pas un devis. L’hébergement, la maintenance et les modalités de livraison seront chiffrés séparément après validation du périmètre.</p>
                </div>

                <div className="brief-timeline-card">
                  <span className="brief-panel-index">APRÈS VOTRE RETOUR</span>
                  <h3>La suite du projet</h3>
                  <ol><li><i>01</i><span><strong>Revue des besoins</strong><small>Nous analysons vos retours.</small></span></li><li><i>02</i><span><strong>Atelier de cadrage</strong><small>Nous validons les choix ensemble.</small></span></li><li><i>03</i><span><strong>Devis détaillé</strong><small>Budget, étapes et délais.</small></span></li></ol>
                </div>

                {record && <div className="brief-last-updated"><span className="brief-sync-dot" /><p>{record.updatedByName ? `Dernière modification par ${record.updatedByName}` : "Cahier des charges initial"}<small>{new Date(record.updatedAt).toLocaleString("fr-FR")}</small></p></div>}
              </aside>
            </div>

            <div className="brief-submit-bar">
              <p><span>🔒</span> Cahier privé · visible uniquement par les comptes administrateurs autorisés</p>
              <button type="submit" className="brief-save-button" disabled={!dirty || saving || !record}>{saving ? "Enregistrement…" : "Enregistrer mes modifications"} <span>→</span></button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
