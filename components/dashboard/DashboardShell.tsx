import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import PortalThemeToggle from "@/components/PortalThemeToggle";

export interface DashboardNavigationItem<TabId extends string> {
  id: TabId;
  label: string;
  icon: string;
}

interface DashboardShellProps<TabId extends string> {
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
    role: "user" | "admin" | "moderator";
  };
  tabs: DashboardNavigationItem<TabId>[];
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onLogout: () => void;
  onGoBack: () => void;
  children: ReactNode;
}

export default function DashboardShell<TabId extends string>({
  user,
  tabs,
  activeTab,
  onSelectTab,
  onLogout,
  onGoBack,
  children,
}: DashboardShellProps<TabId>) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstInitial = user.firstName?.[0] ?? "";
  const lastInitial = user.lastName?.[0] ?? "";
  const initials = (firstInitial + lastInitial).toUpperCase() || user.email[0]?.toUpperCase() || "U";

  useEffect(() => {
    if (!sidebarOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const closeOnDesktopResize = () => {
      if (window.matchMedia("(min-width: 900px)").matches) setSidebarOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktopResize, { passive: true });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktopResize);
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const closeSidebar = () => setSidebarOpen(false);
    router.events.on("routeChangeStart", closeSidebar);
    window.addEventListener("pageshow", closeSidebar);
    return () => {
      router.events.off("routeChangeStart", closeSidebar);
      window.removeEventListener("pageshow", closeSidebar);
    };
  }, [router.events]);

  const renderTab = (tab: DashboardNavigationItem<TabId>) => (
    <button
      key={tab.id}
      type="button"
      className={`sidebar-tab${activeTab === tab.id ? " active" : ""}`}
      aria-current={activeTab === tab.id ? "page" : undefined}
      onClick={() => {
        onSelectTab(tab.id);
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
      }}
    >
      <span className="sidebar-tab-icon" aria-hidden="true">{tab.icon}</span>
      {tab.label}
    </button>
  );

  return (
    <div className="dash-layout user-dashboard employee-portal-page">
      <button
        type="button"
        className={`dash-overlay${sidebarOpen ? " open" : ""}`}
        aria-label="Fermer le menu"
        aria-hidden={!sidebarOpen}
        tabIndex={sidebarOpen ? 0 : -1}
        onClick={() => {
          setSidebarOpen(false);
          menuButtonRef.current?.focus();
        }}
      />

      <aside
        id="dashboard-sidebar"
        className={`dash-sidebar${sidebarOpen ? " open" : ""}`}
        aria-label="Navigation du compte"
      >
        <div className="sidebar-head">
          <div className="sidebar-logo">Fi<span>SAFI</span> Groupe</div>
          <div className="sidebar-role">
            {user.role === "admin" ? "Administrateur" : "Utilisateur"}
          </div>
        </div>

        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-copy">
            <div className="sidebar-uname">
              {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
            </div>
            <div className="sidebar-uemail">{user.email}</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Espaces">
          {tabs.map(renderTab)}
        </nav>

        <div className="sidebar-foot">
          <PortalThemeToggle />
          <button type="button" className="sidebar-logout" onClick={onLogout}>
            <span aria-hidden="true">⊗</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-brand" aria-label="FiSAFi Groupe">
            <div className="dash-mobile-logo" aria-hidden="true">
              <Image
                src="/favicon/web-app-manifest-192x192.png"
                alt=""
                width={72}
                height={72}
                priority
              />
            </div>
            <div className="topbar-logo">Fi<span>SAFI</span></div>
          </div>

          <button type="button" className="topbar-back-link" onClick={onGoBack}>
            <span aria-hidden="true">←</span>
            <span>Retour</span>
          </button>
          <button
            ref={menuButtonRef}
            type="button"
            className={`topbar-hamburger${sidebarOpen ? " open" : ""}`}
            aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={sidebarOpen}
            aria-controls="dashboard-sidebar"
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </header>
        <div className="dash-content">{children}</div>
      </div>
    </div>
  );
}
