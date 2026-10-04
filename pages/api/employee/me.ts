import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateEmployee, EmployeeAuthError, requireEmployee } from "@/lib/employeeAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }
  try {
    const employee = await authenticateEmployee(req);
    requireEmployee(employee);
    return res.status(200).json({
      employee: {
        id: employee.id,
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        role: employee.role,
        employeeRole: employee.employeeRole,
      },
    });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Employee/Auth] Could not load employee profile:", error);
    return res.status(502).json({ error: "Impossible de charger votre espace employé." });
  }
}
