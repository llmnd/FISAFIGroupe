import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/backend/lib/db";
import { hashPassword } from "@/backend/utils/auth";

// Middleware pour vérifier le token admin (simplifié)
async function verifyAdminToken(req: NextApiRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  return typeof authHeader === 'string' && authHeader.startsWith("Bearer ");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  // Vérifier l'authentification admin
  const isAdmin = await verifyAdminToken(req);
  if (!isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
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
      const { firstName, lastName, password, role, active } = req.body;

      const updateData: Partial<{
        firstName?: string;
        lastName?: string;
        password?: string;
        role?: string;
        active?: boolean;
      }> = {};
      
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (password) updateData.password = await hashPassword(password);
      if (role) updateData.role = role;
      if (active !== undefined) updateData.active = active;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
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
    console.error("Error in user API:", error);
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
