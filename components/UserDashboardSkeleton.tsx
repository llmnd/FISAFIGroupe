export default function UserDashboardSkeleton() {
  return (
    <div
      className="dash-layout user-dashboard user-dashboard-skeleton"
      role="status"
      aria-label="Chargement de votre tableau de bord"
    >
      <span className="user-dashboard-skeleton-sr">
        Chargement de votre tableau de bord…
      </span>
      <aside className="user-dashboard-skeleton-sidebar" aria-hidden="true">
        <div className="user-dashboard-skeleton-brand">
          <span className="user-dashboard-skeleton-mark" />
          <span className="user-dashboard-skeleton-line user-dashboard-skeleton-brand-name" />
        </div>
        <div className="user-dashboard-skeleton-profile">
          <span className="user-dashboard-skeleton-avatar" />
          <span className="user-dashboard-skeleton-profile-copy">
            <span className="user-dashboard-skeleton-line user-dashboard-skeleton-name" />
            <span className="user-dashboard-skeleton-line user-dashboard-skeleton-email" />
          </span>
        </div>
        <div className="user-dashboard-skeleton-nav">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`user-dashboard-skeleton-line user-dashboard-skeleton-nav-item${
                index === 0 ? " is-active" : ""
              }`}
            />
          ))}
        </div>
        <span className="user-dashboard-skeleton-line user-dashboard-skeleton-logout" />
      </aside>

      <main className="user-dashboard-skeleton-main" aria-hidden="true">
        <header className="user-dashboard-skeleton-topbar">
          <span className="user-dashboard-skeleton-mark" />
          <span className="user-dashboard-skeleton-line user-dashboard-skeleton-topbar-logo" />
          <span className="user-dashboard-skeleton-line user-dashboard-skeleton-topbar-action" />
        </header>
        <div className="user-dashboard-skeleton-content">
          <span className="user-dashboard-skeleton-line user-dashboard-skeleton-eyebrow" />
          <span className="user-dashboard-skeleton-line user-dashboard-skeleton-title" />
          <span className="user-dashboard-skeleton-line user-dashboard-skeleton-subtitle" />

          <div className="user-dashboard-skeleton-cards">
            {Array.from({ length: 3 }, (_, index) => (
              <div className="user-dashboard-skeleton-card" key={index}>
                <span className="user-dashboard-skeleton-line user-dashboard-skeleton-card-label" />
                <span className="user-dashboard-skeleton-line user-dashboard-skeleton-card-value" />
                <span className="user-dashboard-skeleton-line user-dashboard-skeleton-card-link" />
              </div>
            ))}
          </div>

          <div className="user-dashboard-skeleton-section-heading">
            <span className="user-dashboard-skeleton-line user-dashboard-skeleton-section-kicker" />
            <span className="user-dashboard-skeleton-line user-dashboard-skeleton-section-title" />
          </div>
          <div className="user-dashboard-skeleton-activity">
            {Array.from({ length: 2 }, (_, index) => (
              <div className="user-dashboard-skeleton-activity-card" key={index}>
                <span className="user-dashboard-skeleton-line user-dashboard-skeleton-activity-title" />
                {Array.from({ length: 3 }, (_, rowIndex) => (
                  <span
                    className="user-dashboard-skeleton-line user-dashboard-skeleton-activity-row"
                    key={rowIndex}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}