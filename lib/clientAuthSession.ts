let legacySessionMigration: Promise<boolean> | null = null;

export function ensureAuthSession(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(true);

  let token: string | null;
  try {
    token = window.localStorage.getItem("token");
  } catch (error) {
    return Promise.reject(error);
  }
  if (!token) return Promise.resolve(true);
  if (legacySessionMigration) return legacySessionMigration;

  const migration = (async () => {
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok || response.status === 409) {
      window.localStorage.removeItem("token");
      return true;
    }
    if ([401, 403, 404].includes(response.status)) {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      return false;
    }
    throw new Error(`Legacy session migration returned HTTP ${response.status}.`);
  })();

  legacySessionMigration = migration;
  void migration.finally(() => {
    if (legacySessionMigration === migration) legacySessionMigration = null;
  }).catch(() => undefined);
  return migration;
}
