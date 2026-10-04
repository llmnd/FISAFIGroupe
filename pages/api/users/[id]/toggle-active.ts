import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/backend/lib/db";
import { EmployeeAuthError, authenticateEmployee, requireAdmin } from "@/lib/employeeAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const account = await authenticateEmployee(req);
    requireAdmin(account);
    if (req.method === "PATCH") {
      // Récupérer l'utilisateur actuel
      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { active: true },
      });

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Inverser le statut actif
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { active: !currentUser.active },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          employeeRole: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json(updatedUser);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error toggling user active status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
