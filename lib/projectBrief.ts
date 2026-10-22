export type ProjectBriefStatus = "draft" | "discussion" | "approved";
export type ProjectBriefModuleStatus = "included" | "optional" | "excluded";

export interface ProjectBriefModule {
  id: string;
  name: string;
  status: ProjectBriefModuleStatus;
  features: string[];
}

export interface ProjectBriefDraft {
  budget: number | null;
  targetDate: string;
  status: ProjectBriefStatus;
  priorities: string;
  notes: string;
  modules: ProjectBriefModule[];
}

export interface ProjectBriefRecord extends ProjectBriefDraft {
  id: string;
  version: number;
  updatedAt: string;
  updatedById: string | null;
  updatedByEmail: string | null;
  updatedByName: string | null;
}

export const PROJECT_BRIEF_ID = "fisafi-gestion-odoo-transition";

export const DEFAULT_PROJECT_BRIEF: ProjectBriefDraft = {
  budget: null,
  targetDate: "",
  status: "draft",
  priorities: "",
  notes: "",
  modules: [
    {
      id: "point-de-vente",
      name: "Point de vente",
      status: "included",
      features: ["Enregistrement des ventes et tickets", "Plusieurs caisses et moyens de paiement", "Suivi des ventes par utilisateur"],
    },
    {
      id: "produits-stock",
      name: "Produits, stock & achats",
      status: "included",
      features: ["Catalogue de produits et tarifs", "Quantités disponibles et alertes de stock", "Réceptions et suivi des fournisseurs"],
    },
    {
      id: "comptabilite",
      name: "Comptabilité SYSCOHADA",
      status: "included",
      features: ["Plan comptable SYSCOHADA à valider", "Journal des recettes et dépenses", "Exports à définir avec le comptable"],
    },
    {
      id: "facturation",
      name: "Devis, factures & paiements",
      status: "included",
      features: ["Création et suivi des devis", "Factures et échéances", "Historique des règlements"],
    },
    {
      id: "clients-crm",
      name: "Clients & CRM",
      status: "optional",
      features: ["Fichier clients et contacts", "Suivi des prospects", "Rappels et historique commercial"],
    },
    {
      id: "pilotage",
      name: "Tableau de bord & rapports",
      status: "included",
      features: ["Indicateurs clés de l’activité", "Synthèse ventes et stock", "Exports de rapports"],
    },
    {
      id: "projets",
      name: "Projets & activités",
      status: "optional",
      features: ["Projets et tâches par équipe", "Responsables et échéances", "Vue d’avancement"],
    },
    {
      id: "equipe",
      name: "Équipe & accès",
      status: "optional",
      features: ["Comptes collaborateurs", "Rôles et droits d’accès", "Journal des actions à cadrer"],
    },
  ],
};

const MODULE_STATUSES: readonly ProjectBriefModuleStatus[] = ["included", "optional", "excluded"];
const BRIEF_STATUSES: readonly ProjectBriefStatus[] = ["draft", "discussion", "approved"];

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isProjectBriefDraft(value: unknown): value is ProjectBriefDraft {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const draft = value as Partial<ProjectBriefDraft>;
  if (
    !(draft.budget === null || (typeof draft.budget === "number" && Number.isFinite(draft.budget) && draft.budget >= 0 && draft.budget <= 1_000_000_000_000)) ||
    typeof draft.targetDate !== "string" ||
    (draft.targetDate !== "" && !isValidDate(draft.targetDate)) ||
    typeof draft.status !== "string" ||
    !BRIEF_STATUSES.includes(draft.status as ProjectBriefStatus) ||
    typeof draft.priorities !== "string" ||
    draft.priorities.length > 3000 ||
    typeof draft.notes !== "string" ||
    draft.notes.length > 8000 ||
    !Array.isArray(draft.modules) ||
    draft.modules.length > 20
  ) {
    return false;
  }

  const seenIds = new Set<string>();
  return draft.modules.every((module) => {
    if (!module || typeof module !== "object") return false;
    const item = module as Partial<ProjectBriefModule>;
    if (
      typeof item.id !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id) ||
      item.id.length > 100 ||
      seenIds.has(item.id) ||
      typeof item.name !== "string" ||
      item.name.trim().length === 0 ||
      item.name.length > 120 ||
      typeof item.status !== "string" ||
      !MODULE_STATUSES.includes(item.status as ProjectBriefModuleStatus) ||
      !Array.isArray(item.features) ||
      item.features.length > 20 ||
      !item.features.every((feature) => typeof feature === "string" && feature.length <= 240)
    ) {
      return false;
    }
    seenIds.add(item.id);
    return true;
  });
}

export function isProjectBriefRecord(value: unknown): value is ProjectBriefRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Partial<ProjectBriefRecord>;
  return (
    typeof record.id === "string" &&
    Number.isSafeInteger(record.version) &&
    (record.version ?? -1) >= 0 &&
    typeof record.updatedAt === "string" &&
    (record.updatedById === null || typeof record.updatedById === "string") &&
    (record.updatedByEmail === null || typeof record.updatedByEmail === "string") &&
    (record.updatedByName === null || typeof record.updatedByName === "string") &&
    isProjectBriefDraft(record)
  );
}
