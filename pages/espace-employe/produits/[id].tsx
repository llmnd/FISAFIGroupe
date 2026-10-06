import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";
import type { Product, ProductUpdateInput } from "@/lib/erp/contracts";

type EmployeeProfile = {
  role: string;
  employeeRole: string | null;
};

type ProductFormValues = {
  name: string;
  reference: string;
  barcode: string;
  salesPrice: string;
  costPrice: string;
  active: boolean;
};

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} FCFA`;
}

function getErrorMessage(payload: unknown, fallback: string): string {
  return payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
    ? payload.error
    : fallback;
}

function isProduct(value: unknown): value is Product {
  return !!value && typeof value === "object" &&
    "id" in value && typeof value.id === "number" &&
    "name" in value && typeof value.name === "string" &&
    "salesPrice" in value && typeof value.salesPrice === "number";
}

function isEmployeeProfile(value: unknown): value is EmployeeProfile {
  return !!value && typeof value === "object" &&
    "role" in value && typeof value.role === "string" &&
    "employeeRole" in value && (typeof value.employeeRole === "string" || value.employeeRole === null);
}

function toFormValues(product: Product): ProductFormValues {
  return {
    name: product.name,
    reference: product.reference ?? "",
    barcode: product.barcode ?? "",
    salesPrice: String(product.salesPrice),
    costPrice: product.costPrice === null ? "" : String(product.costPrice),
    active: product.status === "active",
  };
}

function availabilityLabel(product: Product): string {
  switch (product.availability) {
    case "in_stock": return "En stock";
    case "low_stock": return "Stock faible";
    case "out_of_stock": return "Rupture de stock";
    default: return "Indisponible";
  }
}

export default function EmployeeProductDetailsPage() {
  const router = useRouter();
  const productId = typeof router.query.id === "string" ? Number(router.query.id) : NaN;
  const [product, setProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormValues | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [canEditCost, setCanEditCost] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const expireSession = useCallback(async () => {
    localStorage.removeItem("user");
    await fetch("/api/auth/logout", { method: "POST" });
    await router.replace("/login?session=expired");
  }, [router]);

  const loadProduct = useCallback(async () => {
    if (!router.isReady) return;
    if (!Number.isSafeInteger(productId) || productId < 1) {
      setError("L’identifiant du produit est invalide.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const profileResponse = await fetch("/api/employee/me");
      const profilePayload: unknown = await profileResponse.json();
      if (profileResponse.status === 401) {
        await expireSession();
        return;
      }
      if (!profileResponse.ok) {
        throw new Error(getErrorMessage(profilePayload, "Impossible de vérifier vos droits."));
      }
      const profile = profilePayload && typeof profilePayload === "object" && "employee" in profilePayload
        ? profilePayload.employee
        : null;
      if (!isEmployeeProfile(profile)) {
        throw new Error("Le profil employé a renvoyé une réponse invalide.");
      }
      setCanEdit(profile.role === "admin" || ["manager", "stock", "accountant"].includes(profile.employeeRole || ""));
      setCanEditCost(profile.role === "admin" || ["manager", "accountant"].includes(profile.employeeRole || ""));

      const response = await fetch(`/api/employee/products?id=${productId}`);
      const payload: unknown = await response.json();
      if (response.status === 401) {
        await expireSession();
        return;
      }
      if (!response.ok) {
        throw new Error(getErrorMessage(payload, "Impossible de charger ce produit."));
      }
      const result = payload && typeof payload === "object" && "product" in payload ? payload.product : null;
      if (!isProduct(result)) {
        throw new Error("Le catalogue a renvoyé des données produit invalides.");
      }
      setProduct(result);
      setForm(toFormValues(result));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de charger ce produit.");
    } finally {
      setLoading(false);
    }
  }, [expireSession, productId, router]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  const submitChanges = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product || !form) return;
    const salesPrice = Number(form.salesPrice);
    const costPrice = Number(form.costPrice);
    if (!form.name.trim() || !Number.isFinite(salesPrice) || salesPrice < 0) {
      setError("Le nom et le prix de vente doivent être valides.");
      return;
    }
    if (canEditCost && (!Number.isFinite(costPrice) || costPrice < 0)) {
      setError("Le coût doit être un montant valide.");
      return;
    }

    const input: ProductUpdateInput = {
      name: form.name.trim(),
      reference: form.reference.trim() || null,
      barcode: form.barcode.trim() || null,
      salesPrice,
      active: form.active,
    };
    if (canEditCost) input.costPrice = costPrice;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/employee/products?id=${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload: unknown = await response.json();
      if (response.status === 401) {
        await expireSession();
        return;
      }
      if (!response.ok) throw new Error(getErrorMessage(payload, "Impossible d’enregistrer les modifications."));
      const result = payload && typeof payload === "object" && "product" in payload ? payload.product : null;
      if (!isProduct(result)) throw new Error("Le catalogue a renvoyé des données produit invalides.");
      setProduct(result);
      setForm(toFormValues(result));
      setEditing(false);
      setNotice("Les modifications ont été enregistrées dans le catalogue FiSAFi.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible d’enregistrer les modifications.");
    } finally {
      setSaving(false);
    }
  };

  const updateImage = async (file: File | null) => {
    if (!product || !file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choisissez une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 700_000) {
      setError("L’image doit faire 700 Ko maximum.");
      return;
    }
    setImageBusy(true);
    setError("");
    setNotice("");
    try {
      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Impossible de lire le fichier image."));
        reader.onload = () => {
          if (typeof reader.result !== "string") {
            reject(new Error("Le fichier image est invalide."));
            return;
          }
          resolve(reader.result);
        };
        reader.readAsDataURL(file);
      });
      const response = await fetch(`/api/employee/products?id=${product.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });
      const payload: unknown = await response.json();
      if (response.status === 401) {
        await expireSession();
        return;
      }
      if (!response.ok) throw new Error(getErrorMessage(payload, "Impossible de mettre à jour l’image."));
      const result = payload && typeof payload === "object" && "product" in payload ? payload.product : null;
      if (!isProduct(result)) throw new Error("Le catalogue a renvoyé des données produit invalides.");
      setProduct(result);
      setForm(toFormValues(result));
      setNotice("L’image du produit a été mise à jour dans le catalogue FiSAFi.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de mettre à jour l’image.");
    } finally {
      setImageBusy(false);
    }
  };

  const removeImage = async () => {
    if (!product) return;
    setImageBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/employee/products?id=${product.id}`, {
        method: "DELETE",
      });
      const payload: unknown = await response.json();
      if (response.status === 401) {
        await expireSession();
        return;
      }
      if (!response.ok) throw new Error(getErrorMessage(payload, "Impossible de supprimer l’image."));
      const result = payload && typeof payload === "object" && "product" in payload ? payload.product : null;
      if (!isProduct(result)) throw new Error("Le catalogue a renvoyé des données produit invalides.");
      setProduct(result);
      setForm(toFormValues(result));
      setNotice("L’image du produit a été supprimée du catalogue FiSAFi.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Impossible de supprimer l’image.");
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>{product ? `${product.name} — Produits FiSAFi` : "Détail produit — FiSAFi"}</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="employee-portal-page employee-products">
        <EmployeePortalHeader
          pageClassName="employee-products-header"
          title="Détail produit"
          backHref="/espace-employe/produits"
          backLabel="Catalogue produits"
        />
        <section className="employee-products-content">
          {loading ? (
            <p className="employee-products-empty">Chargement du produit…</p>
          ) : error && !product ? (
            <div className="employee-products-detailState">
              <p role="alert" className="employee-products-error">{error}</p>
              <Link href="/espace-employe/produits" className="employee-products-back">Retour au catalogue</Link>
            </div>
          ) : product ? (
            <>
              <p className="employee-products-eyebrow">Catalogue ERP</p>
              <div className="employee-products-detailHeading">
                <div>
                  <h1 className="employee-products-title">{product.name}</h1>
                  <p className="employee-products-subtitle">Détails du produit synchronisés avec le catalogue FiSAFi.</p>
                </div>
                <div className="employee-products-detailActions">
                  {canEdit && (
                    <button
                      type="button"
                      className="employee-products-filterButton"
                      onClick={() => {
                        setForm(toFormValues(product));
                        setEditing((current) => !current);
                        setError("");
                        setNotice("");
                      }}
                    >
                      {editing ? "Annuler la modification" : "Modifier le produit"}
                    </button>
                  )}
                  <Link href="/espace-employe/produits" className="employee-products-back">← Catalogue</Link>
                </div>
              </div>

              {error && <p role="alert" className="employee-products-error">{error}</p>}
              {notice && <p role="status" className="employee-products-notice">{notice}</p>}

              <div className="employee-products-detailGrid">
                <section className="employee-products-detailCard" aria-label="Image du produit">
                  <div className="employee-products-detailImage">
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.name} className="employee-products-image" />
                      : <div className="employee-products-imagePlaceholder">Aucune image disponible</div>}
                  </div>
                  {canEdit && (
                    <div className="employee-products-imageActions">
                      <label className="employee-products-fileButton">
                        {imageBusy ? "Mise à jour…" : "Choisir une image"}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          disabled={imageBusy}
                          onChange={(event) => {
                            const file = event.currentTarget.files?.[0] ?? null;
                            event.currentTarget.value = "";
                            void updateImage(file);
                          }}
                        />
                      </label>
                      {product.imageUrl && (
                        <button type="button" className="employee-products-secondaryButton" onClick={() => void removeImage()} disabled={imageBusy}>
                          Supprimer l’image
                        </button>
                      )}
                      <small>JPEG, PNG ou WebP — 700 Ko maximum. L’image est enregistrée dans le catalogue FiSAFi.</small>
                    </div>
                  )}
                </section>

                <section className="employee-products-detailCard">
                  {editing && form ? (
                    <form className="employee-products-editForm" onSubmit={(event) => void submitChanges(event)}>
                      <label>Nom du produit
                        <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength={200} />
                      </label>
                      <label>Référence
                        <input value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} maxLength={100} />
                      </label>
                      <label>Code-barres
                        <input value={form.barcode} onChange={(event) => setForm({ ...form, barcode: event.target.value })} maxLength={100} />
                      </label>
                      <label>Prix de vente (FCFA)
                        <input type="number" min="0" step="1" value={form.salesPrice} onChange={(event) => setForm({ ...form, salesPrice: event.target.value })} required />
                      </label>
                      {canEditCost && (
                        <label>Coût (FCFA)
                                          <input type="number" min="0" step="1" value={form.costPrice} onChange={(event) => setForm({ ...form, costPrice: event.target.value })} required />
                        </label>
                      )}
                      <label className="employee-products-activeToggle">
                        <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
                        Produit actif
                      </label>
                      <div className="employee-products-formActions">
                        <button type="submit" className="employee-products-filterButton" disabled={saving}>
                          {saving ? "Enregistrement…" : "Enregistrer"}
                        </button>
                        <button type="button" className="employee-products-secondaryButton" onClick={() => setEditing(false)} disabled={saving}>
                          Annuler
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="employee-products-detailTitleRow">
                        <h2>Informations produit</h2>
                        <span className={`employee-products-status employee-products-status-${product.availability}`}>{availabilityLabel(product)}</span>
                      </div>
                      <dl className="employee-products-detailMeta">
                        <div><dt>Référence</dt><dd>{product.reference || "—"}</dd></div>
                        <div><dt>Code-barres</dt><dd>{product.barcode || "—"}</dd></div>
                        <div><dt>Catégorie</dt><dd>{product.categoryName || "—"}</dd></div>
                        <div><dt>Prix de vente</dt><dd>{formatCurrency(product.salesPrice)}</dd></div>
                        <div><dt>Coût</dt><dd>{formatCurrency(product.costPrice)}</dd></div>
                        <div><dt>Stock disponible</dt><dd>{product.stock} {product.unitName || ""}</dd></div>
                        <div><dt>Statut</dt><dd>{product.status === "active" ? "Actif" : "Inactif"}</dd></div>
                        <div><dt>Dernière mise à jour</dt><dd>{product.updatedAt ? new Date(product.updatedAt).toLocaleString("fr-FR") : "—"}</dd></div>
                      </dl>
                    </>
                  )}
                </section>
              </div>
            </>
          ) : null}
        </section>
      </main>
    </>
  );
}
