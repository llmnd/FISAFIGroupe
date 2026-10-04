import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/backend/lib/db";
import { hashPassword } from "@/backend/utils/auth";
import { EmployeeAuthError, EMPLOYEE_ROLES, authenticateEmployee, requireAdmin } from "@/lib/employeeAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const account = await authenticateEmployee(req);
    requireAdmin(account);
    if (req.method === "GET") {
      // Récupérer un utilisateur spécifique
      const user = await prisma.user.findUnique({
        where: { id },
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

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      return res.status(200).json(user);
    }

    if (req.method === "PUT") {
      // Mettre à jour un utilisateur
      const { firstName, lastName, password, role, active, employeeRole } = req.body;
      if (
        employeeRole !== undefined &&
        employeeRole !== null &&
        !EMPLOYEE_ROLES.includes(employeeRole)
      ) {
        return res.status(400).json({ error: "Invalid employee role" });
      }

      const updateData: Partial<{
        firstName?: string;
        lastName?: string;
        password?: string;
        role?: string;
        active?: boolean;
        employeeRole?: string | null;
      }> = {};
      
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (password) updateData.password = await hashPassword(password);
      if (role) updateData.role = role;
      if (active !== undefined) updateData.active = active;
      if (employeeRole !== undefined) updateData.employeeRole = employeeRole;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
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

      return res.status(200).json(user);
    }

    if (req.method === "DELETE") {
      // Supprimer un utilisateur
      await prisma.user.delete({
        where: { id },
      });

      return res.status(204).send("");
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("Error in user API:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
