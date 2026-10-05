import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";
import type { Product } from "@/lib/erp/contracts";

type ProductCategory = { id: number; name: string };

type ProductPage = {
  products: Product[];
  hasMore: boolean;
  totalCount: number;
  categories: ProductCategory[];
};

const PAGE_SIZE = 24;

function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
  }).format(value) + " FCFA";
}

function availabilityLabel(availability: Product["availability"]): string {
  switch (availability) {
    case "in_stock":
      return "En stock";
    case "low_stock":
      return "Stock faible";
    case "out_of_stock":
      return "Rupture";
    default:
      return "Indisponible";
  }
}

function isProductPage(value: unknown): value is ProductPage {
  if (!value || typeof value !== "object") return false;
  const page = value as Partial<ProductPage>;
  return Array.isArray(page.products) &&
    Array.isArray(page.categories) &&
    typeof page.hasMore === "boolean" &&
    typeof page.totalCount === "number" &&
    Number.isSafeInteger(page.totalCount) &&
    page.totalCount >= 0;
}

export default function EmployeeProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestSequence = useRef(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const filtersPanelRef = useRef<HTMLElement>(null);
  const filtersToggleRef = useRef<HTMLButtonElement>(null);
  const filtersCloseRef = useRef<HTMLButtonElement>(null);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + index,
  );
  const firstProductNumber = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const lastProductNumber = Math.min(currentPage * PAGE_SIZE, totalCount);

  const requestPage = useCallback(async (pageNumber: number) => {
    const requestId = ++requestSequence.current;
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        offset: String((pageNumber - 1) * PAGE_SIZE),
        limit: String(PAGE_SIZE),
      });
      if (search.trim()) params.set("search", search.trim());
      if (categoryId !== null) params.set("categoryId", String(categoryId));
      if (onlyAvailable) params.set("onlyAvailable", "true");

      const response = await fetch(`/api/employee/products?${params.toString()}`);
      const payload: unknown = await response.json();
      if (requestId !== requestSequence.current) return;
      if (response.status === 401) {
        localStorage.removeItem("user");
        void fetch("/api/auth/logout", { method: "POST" });
        await router.replace("/login?session=expired");
        return;
      }
      if (!response.ok) {
        throw new Error(
          payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
            ? payload.error
            : "Impossible de charger le catalogue produits.",
        );
      }
      if (!isProductPage(payload)) {
        throw new Error("Le catalogue produit a renvoyé une réponse invalide.");
      }

      setProducts(payload.products);
      setCategories(payload.categories);
      setTotalCount(payload.totalCount);
      const lastPage = Math.max(1, Math.ceil(payload.totalCount / PAGE_SIZE));
      if (pageNumber > lastPage) setCurrentPage(lastPage);
    } catch (requestError) {
      if (requestId === requestSequence.current) {
        setError(requestError instanceof Error && requestError.message ? requestError.message : "Impossible de charger le catalogue produits.");
      }
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [categoryId, onlyAvailable, router, search]);

  useEffect(() => {
    if (router.isReady) {
      void requestPage(currentPage);
    }
  }, [currentPage, router.isReady, requestPage]);

  useEffect(() => {
    if (!filtersOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchInputRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setFiltersOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = filtersPanelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      filtersToggleRef.current?.focus();
    };
  }, [filtersOpen]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || loading) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applySearch = () => {
    const nextSearch = searchInput.trim();
    setSearch(nextSearch);
    setCurrentPage(1);
    if (nextSearch === search && currentPage === 1) void requestPage(1);
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
    setCurrentPage(1);
    if (!search && currentPage === 1) void requestPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategoryId(null);
    setOnlyAvailable(false);
    setCurrentPage(1);
    if (!search && categoryId === null && !onlyAvailable && currentPage === 1) void requestPage(1);
  };

  return (
    <>
      <Head>
        <title>Produits — Espace employé FiSAFi</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="employee-portal-page employee-products">
        <EmployeePortalHeader
          pageClassName="employee-products-header"
          title="Catalogue"
          backHref="/espace-employe"
          backLabel="Espace employé"
        />
        <section className="employee-products-content">
          <h1 className="employee-products-title">Produits</h1>
          <p className="employee-products-subtitle">Consultez les articles Odoo, leur stock et leur disponibilité.</p>

          <div className="employee-products-toolbar">
            <div className="employee-products-toolbarStart">
              <button
                ref={filtersToggleRef}
                type="button"
                className={`employee-products-filterToggle${search || categoryId !== null || onlyAvailable ? " is-active" : ""}`}
                aria-haspopup="dialog"
                aria-expanded={filtersOpen}
                aria-controls="employee-products-filterDrawer"
                onClick={() => setFiltersOpen(true)}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Filtres et recherche</span>
                {(search || categoryId !== null || onlyAvailable) && <span className="employee-products-searchIndicator" aria-hidden="true" />}
              </button>
              {search && <span className="employee-products-activeFilter">Recherche : {search}</span>}
              {categoryId !== null && <span className="employee-products-activeFilter">{categories.find((item) => item.id === categoryId)?.name || "Catégorie"}</span>}
              {onlyAvailable && <span className="employee-products-activeFilter">Disponibles</span>}
            </div>
          </div>

          {filtersOpen && createPortal(
            <div className="employee-products-drawerLayer">
              <button
                type="button"
                className="employee-products-drawerBackdrop"
                onClick={() => setFiltersOpen(false)}
                aria-label="Fermer les filtres"
              />
              <aside
                ref={filtersPanelRef}
                id="employee-products-filterDrawer"
                className="employee-products-filterDrawer"
                role="dialog"
                aria-modal="true"
                aria-labelledby="employee-products-filterTitle"
              >
                <div className="employee-products-drawerHeader">
                  <div>
                    <p className="employee-products-eyebrow">Catalogue ERP</p>
                    <h2 id="employee-products-filterTitle">Recherche et filtres</h2>
                  </div>
                  <button
                    ref={filtersCloseRef}
                    type="button"
                    className="employee-products-drawerClose"
                    onClick={() => setFiltersOpen(false)}
                  >
                    Fermer
                  </button>
                </div>

                <div className="employee-products-drawerContent">
                  <div className="employee-products-searchHeading">
                    <label className="employee-products-drawerLabel" htmlFor="employee-products-searchInput">Rechercher un produit</label>
                    <button
                      type="button"
                      className="employee-products-clearSearchFilter"
                      onClick={clearSearch}
                      disabled={!search && !searchInput}
                    >
                      Effacer la recherche
                    </button>
                  </div>
                  <div className="employee-products-drawerSearch">
                    <input
                      ref={searchInputRef}
                      id="employee-products-searchInput"
                      type="text"
                      value={searchInput}
                      onChange={(event) => setSearchInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") applySearch();
                      }}
                      placeholder="Nom ou référence"
                    />
                  </div>
                  <button type="button" className="employee-products-filterButton employee-products-drawerSearchButton" onClick={applySearch} disabled={loading}>
                    Rechercher
                  </button>

                  <label className="employee-products-drawerLabel" htmlFor="employee-products-category">Catégorie</label>
                  <select
                    id="employee-products-category"
                    className="employee-products-select"
                    value={categoryId ?? "all"}
                    onChange={(event) => {
                      setCategoryId(event.target.value === "all" ? null : Number(event.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">Toutes les catégories</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>

                  <label className="employee-products-drawerAvailability">
                    <input
                      type="checkbox"
                      checked={onlyAvailable}
                      onChange={(event) => {
                        setOnlyAvailable(event.target.checked);
                        setCurrentPage(1);
                      }}
                    />
                    <span>Afficher uniquement les produits disponibles</span>
                  </label>
                  <button
                    type="button"
                    className="employee-products-clearFilters"
                    onClick={clearFilters}
                    disabled={loading}
                  >
                    Effacer les filtres
                  </button>
                </div>

                <div className="employee-products-drawerFooter">
                  <button type="button" className="employee-products-filterButton" onClick={() => setFiltersOpen(false)}>
                    Voir {totalCount} produit{totalCount > 1 ? "s" : ""}
                  </button>
                </div>
              </aside>
            </div>,
            document.body,
          )}

          {error && <p role="alert" className="employee-products-error">{error}</p>}

          {loading ? (
            <p className="employee-products-empty">Chargement du catalogue…</p>
          ) : products.length === 0 ? (
            <p className="employee-products-empty">Aucun produit ne correspond à votre recherche.</p>
          ) : (
            <>
              <div className="employee-products-summary">
                <span>
                  Produits {firstProductNumber}–{lastProductNumber} sur {totalCount}
                </span>
              </div>
              <div className="employee-products-grid">
                {products.map((product) => (
                  <article key={product.id} className="employee-products-card">
                    <div className="employee-products-imageWrap">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="employee-products-image" loading="lazy" />
                      ) : (
                        <div className="employee-products-imagePlaceholder">Produit</div>
                      )}
                    </div>
                    <div className="employee-products-cardBody">
                      <div className="employee-products-cardHeader">
                        <strong>{product.name}</strong>
                        <span className={`employee-products-status employee-products-status-${product.availability}`}>{availabilityLabel(product.availability)}</span>
                      </div>
                      <dl className="employee-products-meta">
                        <div><dt>Stock</dt><dd>{product.stock}</dd></div>
                        <div><dt>Prix</dt><dd>{formatCurrency(product.salesPrice)}</dd></div>
                      </dl>
                      <div className="employee-products-cardFooter">
                        <span>{product.status === "active" ? "Actif" : "Inactif"}</span>
                        <Link href={`/espace-employe/produits/${product.id}`} className="employee-products-link">Détails</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {totalPages > 1 && (
                <nav className="employee-products-pagination" aria-label="Pages du catalogue produits">
                  <button
                    type="button"
                    className="employee-products-paginationStep"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    aria-label="Page précédente"
                  >
                    ← Précédent
                  </button>
                  <div className="employee-products-paginationNumbers">
                    {pageNumbers.map((pageNumber) => (
                      <button
                        type="button"
                        key={pageNumber}
                        className={pageNumber === currentPage ? "is-current" : ""}
                        aria-current={pageNumber === currentPage ? "page" : undefined}
                        onClick={() => goToPage(pageNumber)}
                        disabled={loading}
                      >
                        {pageNumber}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="employee-products-paginationStep"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    aria-label="Page suivante"
                  >
                    Suivant →
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
    </>
  );
}
