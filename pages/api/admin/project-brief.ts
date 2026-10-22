import type { NextApiRequest, NextApiResponse } from "next";
import { Prisma } from "@prisma/client";
import { authenticateEmployee, EmployeeAuthError, requireAdmin } from "@/lib/employeeAuth";
import {
  DEFAULT_PROJECT_BRIEF,
  isProjectBriefDraft,
  PROJECT_BRIEF_ID,
  type ProjectBriefModule,
} from "@/lib/projectBrief";
import { prisma } from "@/backend/lib/db";

function toJsonModules(modules: ProjectBriefModule[]): Prisma.InputJsonArray {
  return modules.map((module): Prisma.InputJsonObject => ({
    id: module.id,
    name: module.name,
    status: module.status,
    features: module.features,
  }));
}

function serializeBrief(brief: {
  id: string;
  budget: number | null;
  targetDate: string | null;
  status: string;
  priorities: string;
  notes: string;
  modules: Prisma.JsonValue;
  version: number;
  updatedAt: Date;
  updatedById: string | null;
  updatedByEmail: string | null;
  updatedByName: string | null;
}) {
  return {
    id: brief.id,
    budget: brief.budget,
    targetDate: brief.targetDate ?? "",
    status: brief.status,
    priorities: brief.priorities,
    notes: brief.notes,
    modules: brief.modules,
    version: brief.version,
    updatedAt: brief.updatedAt.toISOString(),
    updatedById: brief.updatedById,
    updatedByEmail: brief.updatedByEmail,
    updatedByName: brief.updatedByName,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (req.method !== "GET" && req.method !== "PUT") {
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Méthode non autorisée." });
  }

  try {
    const account = await authenticateEmployee(req);
    requireAdmin(account);

    if (req.method === "GET") {
      const brief = await prisma.projectBrief.upsert({
        where: { id: PROJECT_BRIEF_ID },
        create: {
          id: PROJECT_BRIEF_ID,
          modules: toJsonModules(DEFAULT_PROJECT_BRIEF.modules),
        },
        update: {},
      });
      return res.status(200).json(serializeBrief(brief));
    }

    const body = req.body as { draft?: unknown; version?: unknown } | undefined;
    if (!body || !isProjectBriefDraft(body.draft) || !Number.isSafeInteger(body.version) || Number(body.version) < 0) {
      return res.status(400).json({ error: "Le cahier des charges contient des données invalides." });
    }

    const { draft } = body;
    const result = await prisma.projectBrief.updateMany({
      where: { id: PROJECT_BRIEF_ID, version: Number(body.version) },
      data: {
        budget: draft.budget,
        targetDate: draft.targetDate || null,
        status: draft.status,
        priorities: draft.priorities,
        notes: draft.notes,
        modules: toJsonModules(draft.modules),
        version: { increment: 1 },
        updatedById: account.id,
        updatedByEmail: account.email,
        updatedByName: [account.firstName, account.lastName].filter(Boolean).join(" ") || null,
      },
    });

    if (result.count === 0) {
      const current = await prisma.projectBrief.findUnique({ where: { id: PROJECT_BRIEF_ID } });
      return res.status(409).json({
        error: "Une version plus récente existe. Rechargez le cahier des charges avant d’enregistrer vos modifications.",
        current: current ? serializeBrief(current) : null,
      });
    }

    const saved = await prisma.projectBrief.findUnique({ where: { id: PROJECT_BRIEF_ID } });
    if (!saved) {
      console.error("[Admin/ProjectBrief] Saved brief disappeared before it could be returned.");
      return res.status(500).json({ error: "Le cahier a été enregistré, mais son état actuel est indisponible." });
    }
    return res.status(200).json(serializeBrief(saved));
  } catch (error) {
    if (error instanceof EmployeeAuthError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    console.error("[Admin/ProjectBrief] Could not load or save the project brief:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "P2021") {
      return res.status(503).json({ error: "La base de données doit être mise à jour avant d’utiliser le cahier des charges." });
    }
    return res.status(500).json({ error: "Impossible de charger ou d’enregistrer le cahier des charges." });
  }
}
