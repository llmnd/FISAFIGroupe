import type { NextApiRequest, NextApiResponse } from "next";
import {
  authenticateEmployee,
  EmployeeAuthError,
  requireAdmin,
} from "@/lib/employeeAuth";

export async function authorizeAdminRequest(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<boolean> {
  try {
    requireAdmin(await authenticateEmployee(req));
    return true;
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      res.status(error.statusCode).json({ success: false, error: error.message });
      return false;
    }
    console.error("[API/Auth] Could not verify admin access:", error);
    res.status(502).json({ success: false, error: "Impossible de vérifier vos droits d’accès." });
    return false;
  }
}
