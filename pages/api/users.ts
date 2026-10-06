import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/backend/lib/db";
import { hashPassword } from "@/backend/utils/auth";
import { EmployeeAuthError, EMPLOYEE_ROLES, authenticateEmployee, requireAdmin } from "@/lib/employeeAuth";

const USER_PROFILES = ["MARKET_CUSTOMER", "TRAINING_PARTICIPANT"] as const;
type UserProfile = (typeof USER_PROFILES)[number];

function isUserProfile(value: unknown): value is UserProfile {
  return USER_PROFILES.some((profile) => profile === value);
}

function isValidUserProfiles(value: unknown): value is UserProfile[] {
  return (
    Array.isArray(value) &&
    value.every(isUserProfile) &&
    new Set(value).size === value.length
  );
}

function getPrismaErrorCode(error: unknown): string | null {
  return (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string" &&
    /^P\d{4}$/.test(error.code)
  )
    ? error.code
    : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  try {
    const account = await authenticateEmployee(req);
    requireAdmin(account);
    if (req.method === "GET") {
      // Lister tous les utilisateurs
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          employeeRole: true,
          profiles: true,
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
      const { email, firstName, lastName, phone, password, employeeRole, profiles } = req.body;

      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      if (employeeRole !== undefined && employeeRole !== null && !EMPLOYEE_ROLES.includes(employeeRole)) {
        return res.status(400).json({ error: "Invalid employee role" });
      }
      if (profiles !== undefined && !isValidUserProfiles(profiles)) {
        return res.status(400).json({ error: "Invalid user profiles" });
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
          phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
          password: hashedPassword,
          role: "user",
          employeeRole: employeeRole || null,
          profiles: profiles ?? [],
          active: true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          employeeRole: true,
          profiles: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(201).json(user);
    }

    if (req.method === "PUT") {
      const { id, firstName, lastName, phone, password, employeeRole, profiles } = req.body;
      if (typeof id !== "string" || !id) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      if (
        employeeRole !== undefined &&
        employeeRole !== null &&
        !EMPLOYEE_ROLES.includes(employeeRole)
      ) {
        return res.status(400).json({ error: "Invalid employee role" });
      }
      if (profiles !== undefined && !isValidUserProfiles(profiles)) {
        return res.status(400).json({ error: "Invalid user profiles" });
      }
      if (firstName !== undefined && typeof firstName !== "string") {
        return res.status(400).json({ error: "Invalid first name" });
      }
      if (lastName !== undefined && typeof lastName !== "string") {
        return res.status(400).json({ error: "Invalid last name" });
      }
      if (phone !== undefined && phone !== null && typeof phone !== "string") {
        return res.status(400).json({ error: "Invalid phone number" });
      }
      if (password !== undefined && typeof password !== "string") {
        return res.status(400).json({ error: "Invalid password" });
      }

      const user = await prisma.user.update({
        where: { id },
        data: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
          ...(phone !== undefined
            ? { phone: typeof phone === "string" && phone.trim() ? phone.trim() : null }
            : {}),
          ...(password ? { password: await hashPassword(password) } : {}),
          ...(employeeRole !== undefined ? { employeeRole: employeeRole || null } : {}),
          ...(profiles !== undefined ? { profiles } : {}),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          employeeRole: true,
          profiles: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json(user);
    }

    if (req.method === "PATCH") {
      const { id } = req.body;
      if (typeof id !== "string" || !id) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const currentUser = await prisma.user.findUnique({
        where: { id },
        select: { active: true },
      });
      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { active: !currentUser.active },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          employeeRole: true,
          profiles: true,
          active: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json(user);
    }

    if (req.method === "DELETE") {
      const { id } = req.body;
      if (typeof id !== "string" || !id) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      await prisma.user.delete({ where: { id } });
      return res.status(204).send("");
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    const prismaErrorCode = getPrismaErrorCode(error);
    if (prismaErrorCode === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("Error in users API:", error);
    if (prismaErrorCode === "P2021" || prismaErrorCode === "P2022") {
      return res.status(503).json({
        error: "Le schéma de la base ne correspond pas encore à l’application. Arrêtez puis redémarrez le serveur après avoir appliqué les migrations Prisma.",
      });
    }
    return res.status(500).json({ error: "Internal server error" });
  }
}
