export default function AdminNavigationSkeleton() {
  return (
    <div className="admin-navigation-skeleton" role="status" aria-label="Ouverture du tableau de bord admin">
      <span className="admin-navigation-skeleton-sr">Chargement du tableau de bord…</span>
      <header className="admin-navigation-skeleton-topbar" aria-hidden="true">
        <span className="admin-navigation-skeleton-logo">FiSAFI</span>
        <span className="admin-navigation-skeleton-pill" />
      </header>
      <div className="admin-navigation-skeleton-layout" aria-hidden="true">
        <aside className="admin-navigation-skeleton-sidebar">
          <span className="admin-navigation-skeleton-block admin-navigation-skeleton-sidebar-brand" />
          <span className="admin-navigation-skeleton-block admin-navigation-skeleton-user" />
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className="admin-navigation-skeleton-block admin-navigation-skeleton-nav" />
          ))}
        </aside>
        <main className="admin-navigation-skeleton-content">
          <span className="admin-navigation-skeleton-block admin-navigation-skeleton-eyebrow" />
          <span className="admin-navigation-skeleton-block admin-navigation-skeleton-title" />
          <span className="admin-navigation-skeleton-block admin-navigation-skeleton-description" />
          <div className="admin-navigation-skeleton-stats">
            {Array.from({ length: 3 }, (_, index) => (
              <span key={index} className="admin-navigation-skeleton-block admin-navigation-skeleton-stat" />
            ))}
          </div>
          <span className="admin-navigation-skeleton-block admin-navigation-skeleton-table" />
        </main>
      </div>
    </div>
  );
}
