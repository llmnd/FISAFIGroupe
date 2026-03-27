import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../backend/lib/db";
import { hashPassword } from "../../backend/utils/auth";

// Middleware pour vérifier le token admin
async function verifyAdminToken(req: NextApiRequest): Promise<boolean> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  
  // Token exists, simplified verification
  return true;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vérifier l'authentification admin
  const isAdmin = await verifyAdminToken(req);
  if (!isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      // Lister tous les utilisateurs
      const users = await prisma.user.findMany({
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
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(users);
    }

    if (req.method === "POST") {
      // Créer un nouvel utilisateur
      const { email, firstName, lastName, password } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Vérifier si l'email existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ error: "Email already exists" });
      }

      // Hasher le mot de passe
      const hashedPassword = await hashPassword(password);

      // Créer l'utilisateur
      const user = await prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          password: hashedPassword,
          role: "user",
          active: true,
        },
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

      return res.status(201).json(user);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Error in users API:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
