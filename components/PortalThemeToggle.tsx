import { useTheme } from "@/context/ThemeContext";

export default function PortalThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="portal-theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le thème clair" : "Activer le thème sombre"}
      aria-pressed={isDark}
      title={isDark ? "Passer au thème clair" : "Passer au thème sombre"}
    >
      <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
      <span>{isDark ? "Clair" : "Sombre"}</span>
    </button>
  );
}
