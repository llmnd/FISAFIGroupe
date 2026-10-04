import type { NextApiRequest } from "next";

export const EMPLOYEE_ROLES = [
  "manager",
  "seller",
  "cashier",
  "stock",
  "accountant",
] as const;

export type EmployeeRole = (typeof EMPLOYEE_ROLES)[number];

export type EmployeeAccount = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  employeeRole: EmployeeRole | null;
};

type AuthenticatedPayload = {
  data: {
    id: string;
    email: string;
    role: string;
    employeeRole: string | null;
    firstName?: unknown;
    lastName?: unknown;
  };
};

function isAuthenticatedPayload(payload: unknown): payload is AuthenticatedPayload {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return false;
  const data = payload.data;
  return (
    !!data &&
    typeof data === "object" &&
    "id" in data &&
    typeof data.id === "string" &&
    "email" in data &&
    typeof data.email === "string" &&
    "role" in data &&
    typeof data.role === "string" &&
    "employeeRole" in data &&
    (typeof data.employeeRole === "string" || data.employeeRole === null)
  );
}

export class EmployeeAuthError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "EmployeeAuthError";
  }
}

export async function authenticateEmployee(req: NextApiRequest): Promise<EmployeeAccount> {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new EmployeeAuthError("Connectez-vous à votre compte FiSAFi.", 401);
  }

  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new EmployeeAuthError("Le service de connexion n’est pas configuré.", 503);
  }

  let response: Response;
  try {
    response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/auth/me`, {
      headers: { Authorization: authorization },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("[Employee/Auth] Could not verify account:", error);
    throw new EmployeeAuthError("Impossible de vérifier votre session.", 503);
  }

  if (response.status === 401 || response.status === 403 || response.status === 404) {
    throw new EmployeeAuthError("Votre session a expiré. Reconnectez-vous.", 401);
  }
  if (!response.ok) {
    console.error(`[Employee/Auth] Account verification failed with HTTP ${response.status}.`);
    throw new EmployeeAuthError("Impossible de vérifier votre compte.", 502);
  }

  const payload: unknown = await response.json();
  if (!isAuthenticatedPayload(payload)) {
    console.error("[Employee/Auth] Account service returned an invalid response.");
    throw new EmployeeAuthError("Le service de connexion a renvoyé une réponse invalide.", 502);
  }

  const { data } = payload;
  const employeeRole = EMPLOYEE_ROLES.find((role) => role === data.employeeRole) ?? null;
  return {
    id: data.id,
    email: data.email,
    firstName: typeof data.firstName === "string" ? data.firstName : null,
    lastName: typeof data.lastName === "string" ? data.lastName : null,
    role: data.role,
    employeeRole,
  };
}

export function requireEmployee(account: EmployeeAccount): void {
  if (account.role !== "admin" && !account.employeeRole) {
    throw new EmployeeAuthError("Votre compte n’a pas accès à l’espace employé.", 403);
  }
}

export function requireAdmin(account: EmployeeAccount): void {
  if (account.role !== "admin") {
    throw new EmployeeAuthError("Cette action est réservée aux administrateurs.", 403);
  }
}

export function requirePOSRead(account: EmployeeAccount): void {
  if (
    account.role !== "admin" &&
    account.employeeRole !== "manager" &&
    account.employeeRole !== "seller" &&
    account.employeeRole !== "cashier" &&
    account.employeeRole !== "stock"
  ) {
    throw new EmployeeAuthError("Votre rôle ne permet pas de consulter le catalogue des caisses.", 403);
  }
}

export function requirePOSOpen(account: EmployeeAccount): void {
  if (
    account.role !== "admin" &&
    account.employeeRole !== "manager" &&
    account.employeeRole !== "cashier"
  ) {
    throw new EmployeeAuthError("Votre rôle ne permet pas d’ouvrir une caisse.", 403);
  }
}

export function requirePOSSale(account: EmployeeAccount): void {
  if (
    account.role !== "admin" &&
    account.employeeRole !== "manager" &&
    account.employeeRole !== "seller" &&
    account.employeeRole !== "cashier"
  ) {
    throw new EmployeeAuthError("Votre rôle ne permet pas d’enregistrer une vente.", 403);
  }
}

export function requirePOSClose(account: EmployeeAccount): void {
  if (
    account.role !== "admin" &&
    account.employeeRole !== "manager" &&
    account.employeeRole !== "cashier"
  ) {
    throw new EmployeeAuthError("Votre rôle ne permet pas de clôturer une caisse.", 403);
  }
}
