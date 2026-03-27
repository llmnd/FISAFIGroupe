import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../../backend/lib/db";

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
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json(updatedUser);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error toggling user active status:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
