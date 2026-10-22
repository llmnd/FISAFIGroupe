import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  DEFAULT_PROJECT_BRIEF,
  isProjectBriefRecord,
  type ProjectBriefDraft,
  type ProjectBriefModuleStatus,
  type ProjectBriefRecord,
  type ProjectBriefStatus,
} from "@/lib/projectBrief";

const STATUS_LABELS: Record<ProjectBriefStatus, string> = {
  draft: "À cadrer",
  discussion: "En discussion",
  approved: "Validé pour chiffrage",
};

const BRIEF_STEPS = [
  { title: "Votre vision", detail: "Vos priorités" },
  { title: "Les modules", detail: "À la carte" },
  { title: "Budget & délais", detail: "Vos conditions" },
  { title: "Récapitulatif", detail: "Relire et partager" },
] as const;

const CURRENCY_FORMAT = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

function getErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return fallback;
}

export default function ProjectBrief() {
  const [record, setRecord] = useState<ProjectBriefRecord | null>(null);
  const [draft, setDraft] = useState<ProjectBriefDraft>(DEFAULT_PROJECT_BRIEF);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [conflictRecord, setConflictRecord] = useState<ProjectBriefRecord | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [newModuleName, setNewModuleName] = useState("");
  const draftRef = useRef(draft);
  const dirtyRef = useRef(dirty);
  const recordRef = useRef(record);

  useEffect(() => { draftRef.current = draft; }, [draft]);
  useEffect(() => { dirtyRef.current = dirty; }, [dirty]);
  useEffect(() => { recordRef.current = record; }, [record]);

  const applyRecord = useCallback((nextRecord: ProjectBriefRecord) => {
    setRecord(nextRecord);
    setActiveModuleIndex(0);
    setDraft({
      budget: nextRecord.budget,
      targetDate: nextRecord.targetDate,
      status: nextRecord.status,
      priorities: nextRecord.priorities,
      notes: nextRecord.notes,
      modules: nextRecord.modules,
    });
    setDirty(false);
    setConflictRecord(null);
  }, []);

  const loadBrief = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError("");
    }
    try {
      const response = await fetch("/api/admin/project-brief", { cache: "no-store" });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(getErrorMessage(payload, `Chargement impossible (HTTP ${response.status}).`));
      if (!isProjectBriefRecord(payload)) throw new Error("Le serveur a renvoyé un cahier des charges invalide.");
      const current = recordRef.current;
      if (!dirtyRef.current && (!current || current.version !== payload.version)) applyRecord(payload);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Impossible de charger le cahier des charges.";
      if (!silent) setError(message);
      else console.error("[Admin/ProjectBrief] Could not refresh the shared brief:", loadError);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [applyRecord]);

  useEffect(() => {
    void loadBrief();
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState === "visible" && !dirtyRef.current) void loadBrief(true);
    }, 8_000);
    return () => window.clearInterval(refreshTimer);
  }, [loadBrief]);

  const updateDraft = (update: Partial<ProjectBriefDraft>) => {
    setDraft((current) => ({ ...current, ...update }));
    setDirty(true);
    setError("");
    setNotice("");
    setConflictRecord(null);
  };

  const updateModule = (
    moduleId: string,
    update: Partial<Pick<ProjectBriefDraft["modules"][number], "name" | "status" | "features">>,
  ) => {
    setDraft((current) => ({
      ...current,
      modules: current.modules.map((module) => module.id === moduleId ? { ...module, ...update } : module),
    }));
    setDirty(true);
    setError("");
    setNotice("");
    setConflictRecord(null);
  };

  const addModule = () => {
    const name = newModuleName.trim();
    if (!name || draft.modules.length >= 20) return;
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70).replace(/-$/g, "") || "module";
    const id = `custom-${slug}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    updateDraft({ modules: [...draft.modules, { id, name, status: "optional", features: [] }] });
    setActiveModuleIndex(draft.modules.length);
    setNewModuleName("");
  };

  const removeModule = (moduleId: string) => {
    const modules = draft.modules.filter((module) => module.id !== moduleId);
    updateDraft({ modules });
    setActiveModuleIndex((current) => Math.min(current, Math.max(0, modules.length - 1)));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!record || saving) return;
    if (draft.modules.some((module) => !module.name.trim())) {
      setError("Chaque module doit avoir un nom. Vous pouvez le modifier ou le retirer à l’étape des modules.");
      setActiveStep(1);
      setActiveModuleIndex(draft.modules.findIndex((module) => !module.name.trim()));
      return;
    }
    const moduleWithLongFeature = draft.modules.find((module) => module.features.some((feature) => feature.length > 240));
    if (moduleWithLongFeature) {
      setError("Chaque fonctionnalité doit contenir au maximum 240 caractères. Vérifiez les lignes à l’étape des modules.");
      setActiveStep(1);
      setActiveModuleIndex(draft.modules.findIndex((module) => module.id === moduleWithLongFeature.id));
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/project-brief", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, version: record.version }),
      });
      const payload: unknown = await response.json();
      if (response.status === 409) {
        const current = payload && typeof payload === "object" && "current" in payload ? payload.current : null;
        if (isProjectBriefRecord(current)) setConflictRecord(current);
        throw new Error(getErrorMessage(payload, "Une autre personne a enregistré une version plus récente."));
      }
      if (!response.ok) throw new Error(getErrorMessage(payload, `Enregistrement impossible (HTTP ${response.status}).`));
      if (!isProjectBriefRecord(payload)) throw new Error("Le serveur a renvoyé un cahier des charges invalide.");
      applyRecord(payload);
      setNotice("Modifications enregistrées. Elles sont maintenant visibles dans l’espace administrateur.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d’enregistrer le cahier des charges.");
    } finally {
      setSaving(false);
    }
  };

  const handleReloadLatest = () => {
    if (conflictRecord) {
      applyRecord(conflictRecord);
      setError("");
      setNotice("La dernière version enregistrée a été rechargée.");
    } else {
      void loadBrief();
    }
  };

  const selectedCount = draft.modules.filter((module) => module.status === "included").length;
  const activeModule = draft.modules[activeModuleIndex];
  const budgetDisplay = draft.budget === null ? "À définir" : `${CURRENCY_FORMAT.format(draft.budget)} FCFA`;
  const goToStep = (step: number) => setActiveStep(Math.max(0, Math.min(BRIEF_STEPS.length - 1, step)));
  const updateModuleFeatures = (moduleId: string, event: ChangeEvent<HTMLTextAreaElement>) => {
    updateModule(moduleId, { features: event.target.value.split("\n").slice(0, 20) });
  };

  return (
    <section className="project-brief">
      <header className="brief-hero">
        <div className="brief-hero-copy">
          <div className="brief-eyebrow"><span /> PROJET DE TRANSFORMATION · FISAFI GROUPE</div>
          <h1>Le cahier des charges<br /><span>de votre futur outil.</span></h1>
          <p>Définissez votre futur outil pas à pas, à votre rythme. Vous pouvez personnaliser chaque choix et enregistrer vos réponses à tout moment.</p>
          <div className="brief-hero-meta">
            <span className={`brief-status-pill status-${draft.status}`}>{STATUS_LABELS[draft.status]}</span>
            <span className="brief-access-note">Accès limité aux administrateurs</span>
          </div>
        </div>
        <div className="brief-hero-art" aria-hidden="true">
          <div className="brief-art-orbit orbit-a" /><div className="brief-art-orbit orbit-b" />
          <div className="brief-art-card">
            <div className="brief-art-top"><span>PROJET FiSAFi</span><span>↗</span></div>
            <strong>{String(selectedCount).padStart(2, "0")}<small> / {String(draft.modules.length).padStart(2, "0")}</small></strong>
            <span>modules à inclure</span>
            <div className="brief-art-bars"><i /><i /><i /><i /><i /><i /></div>
            <div className="brief-art-foot"><span><i /> Cadrage en cours</span><span>FCFA</span></div>
          </div>
          <span className="brief-art-badge">✳ À VOUS DE DÉCIDER</span>
        </div>
        <div className="brief-hero-bottom"><span>VOTRE PROJET · VOTRE PÉRIMÈTRE</span><span>UN PARCOURS À VOTRE RYTHME</span></div>
      </header>

      <div className="brief-workspace">
        <div className="brief-page-heading">
          <div><span className="brief-section-label">ESPACE PROJET · VERSION {record ? `V${Math.max(1, record.version)}` : "…"}</span><h2>Construisons votre projet, étape par étape.</h2><p>Avancez à votre rythme : vous pouvez passer d’une étape à l’autre et revenir modifier vos choix à tout moment.</p></div>
          <div className={`brief-save-indicator${dirty ? " is-dirty" : ""}`} aria-live="polite"><i />{saving ? "Enregistrement…" : dirty ? "Modifications non enregistrées" : "Données synchronisées"}</div>
        </div>

        {error && <div className="brief-alert brief-alert-error" role="alert"><span>!</span><p>{error}{conflictRecord ? <> <button type="button" onClick={handleReloadLatest}>Recharger la dernière version</button></> : <> <button type="button" onClick={() => void loadBrief()}>Réessayer</button></>}</p></div>}
        {notice && <div className="brief-alert brief-alert-success" role="status"><span>✓</span><p>{notice}</p></div>}

        {loading ? (
          <div className="brief-loading" role="status"><span className="spinner" /> Chargement du cahier des charges…</div>
        ) : (
          <form className="brief-form" onSubmit={handleSave}>
            <nav className="brief-stepper" aria-label="Étapes du cahier des charges" role="tablist">
              {BRIEF_STEPS.map((step, index) => (
                <button
                  key={step.title}
                  type="button"
                  role="tab"
                  aria-selected={activeStep === index}
                  aria-controls="brief-step-panel"
                  className={`brief-step-tab${activeStep === index ? " active" : ""}${activeStep > index ? " complete" : ""}`}
                  onClick={() => goToStep(index)}
                >
                  <span className="brief-step-number">{activeStep > index ? "✓" : `0${index + 1}`}</span>
                  <span className="brief-step-copy"><strong>{step.title}</strong><small>{step.detail}</small></span>
                </button>
              ))}
            </nav>

            <section className="brief-step-panel" id="brief-step-panel" role="tabpanel" aria-label={BRIEF_STEPS[activeStep].title}>
              {activeStep === 0 && (
                <div className="brief-panel brief-step-card">
                  <div className="brief-panel-heading"><div><span className="brief-panel-index">ÉTAPE 01 · LE POINT DE DÉPART</span><h3>Qu’aimeriez-vous améliorer ?</h3><p>Parlez-nous de vos besoins avec vos mots. Rien n’est définitif à cette étape.</p></div><span className="brief-panel-symbol">✳</span></div>
                  <label className="brief-field brief-field-full"><span>Vos priorités <small>facultatif</small></span><textarea rows={6} maxLength={3000} placeholder={"Ex. Mieux suivre les ventes et les encaissements.\nRéduire les erreurs de stock.\nAvoir une vue claire sur la comptabilité."} value={draft.priorities} onChange={(event) => updateDraft({ priorities: event.target.value })} /><small>{draft.priorities.length} / 3 000 caractères · Une idée par ligne, ou écrivez librement.</small></label>
                  <div className="brief-step-hint"><span>◇</span><p><strong>Pas besoin de tout savoir aujourd’hui.</strong> Vous pourrez ajuster les modules, le budget et les détails aux étapes suivantes.</p></div>
                </div>
              )}

              {activeStep === 1 && (
                <div className="brief-panel brief-step-card">
                  <div className="brief-panel-heading"><div><span className="brief-panel-index">ÉTAPE 02 · À LA CARTE</span><h3>Composez votre outil de gestion.</h3><p>Incluez, discutez ou écartez les modules. Renommez-les, adaptez les fonctionnalités ou créez vos propres modules.</p></div><span className="brief-modules-count">{selectedCount} inclus</span></div>
                  <div className="brief-module-picker" role="tablist" aria-label="Choisir un module à personnaliser">
                    {draft.modules.map((module, index) => (
                      <button type="button" role="tab" aria-selected={activeModuleIndex === index} className={`brief-module-pick module-pick-${module.status}${activeModuleIndex === index ? " active" : ""}`} key={module.id} onClick={() => setActiveModuleIndex(index)}>
                        <span className="brief-module-pick-dot" /><span>{module.name || "Module sans nom"}</span>
                      </button>
                    ))}
                    {draft.modules.length === 0 && <p className="brief-module-empty">Aucun module pour le moment. Ajoutez-en un juste en dessous.</p>}
                  </div>
                  {activeModule && (
                    <article className={`brief-module-card brief-module-editor module-${activeModule.status}`}>
                      <div className="brief-module-top">
                        <span className="brief-module-icon">{String(activeModuleIndex + 1).padStart(2, "0")}</span>
                        <label className="brief-module-name brief-module-name-input"><span className="visually-hidden">Nom du module</span><input aria-label="Nom du module" maxLength={120} value={activeModule.name} onChange={(event) => updateModule(activeModule.id, { name: event.target.value })} /></label>
                        <label className="brief-module-status"><span className="visually-hidden">Décision — {activeModule.name}</span><select value={activeModule.status} onChange={(event) => updateModule(activeModule.id, { status: event.target.value as ProjectBriefModuleStatus })}><option value="included">À inclure</option><option value="optional">À discuter</option><option value="excluded">Pas nécessaire</option></select></label>
                        <button className="brief-module-remove" type="button" onClick={() => removeModule(activeModule.id)} aria-label={`Retirer le module ${activeModule.name}`}>Retirer</button>
                      </div>
                      <label className="brief-module-features brief-module-editor-features"><span>Fonctionnalités souhaitées <small>une par ligne · jusqu’à 20</small></span><textarea aria-label={`Fonctionnalités souhaitées — ${activeModule.name}`} rows={Math.min(8, Math.max(4, activeModule.features.length + 1))} maxLength={4800} placeholder={"Ex. Suivi des ventes par caisse\nExport des rapports en Excel\nGestion des droits par utilisateur"} value={activeModule.features.join("\n")} onChange={(event) => updateModuleFeatures(activeModule.id, event)} /><small>{activeModule.features.length} fonctionnalité{activeModule.features.length > 1 ? "s" : ""} · Modifiez ou supprimez les lignes selon vos besoins.</small></label>
                    </article>
                  )}
                  <div className="brief-add-module">
                    <label htmlFor="brief-new-module">Créer un module personnalisé</label>
                    <div><input id="brief-new-module" maxLength={120} placeholder="Ex. Gestion des contrats" value={newModuleName} onChange={(event) => setNewModuleName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addModule(); } }} /><button type="button" onClick={addModule} disabled={!newModuleName.trim() || draft.modules.length >= 20}>＋ Ajouter un module</button></div>
                    <small>{draft.modules.length} / 20 modules maximum</small>
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="brief-panel brief-step-card">
                  <div className="brief-panel-heading"><div><span className="brief-panel-index">ÉTAPE 03 · VOS CONDITIONS</span><h3>Quel cadre imaginez-vous ?</h3><p>Ces indications sont facultatives et servent à préparer la discussion, pas à fixer un devis.</p></div><span className="brief-panel-symbol">◷</span></div>
                  <div className="brief-fields-grid">
                    <label className="brief-field"><span>Budget envisagé <small>facultatif</small></span><div className="brief-budget-input"><input aria-label="Budget envisagé en FCFA" type="number" min="0" max="1000000000000" step="10000" placeholder="Ex. 2 500 000" value={draft.budget ?? ""} onChange={(event) => updateDraft({ budget: event.target.value === "" ? null : Number(event.target.value) })} /><b>FCFA</b></div><small>Vous pouvez ignorer cette question ou indiquer une fourchette dans les précisions.</small></label>
                    <label className="brief-field"><span>Date cible souhaitée <small>facultatif</small></span><input aria-label="Date cible souhaitée" type="date" value={draft.targetDate} onChange={(event) => updateDraft({ targetDate: event.target.value })} /><small>Nous confirmerons ensemble si ce calendrier est réaliste.</small></label>
                    <label className="brief-field brief-field-full"><span>État de la réflexion</span><select value={draft.status} onChange={(event) => updateDraft({ status: event.target.value as ProjectBriefStatus })}><option value="draft">Je réfléchis encore</option><option value="discussion">Je souhaite en discuter</option><option value="approved">Prêt pour un chiffrage</option></select><small>« Prêt pour un chiffrage » ne constitue pas un engagement de lancement.</small></label>
                    <label className="brief-field brief-field-full"><span>Contexte, contraintes ou questions <small>facultatif</small></span><textarea rows={6} maxLength={8000} placeholder="Ex. Nombre de points de vente, collaborateurs concernés, outils à connecter, fonctionnement actuel, questions à clarifier…" value={draft.notes} onChange={(event) => updateDraft({ notes: event.target.value })} /><small>{draft.notes.length} / 8 000 caractères</small></label>
                  </div>
                  <div className="brief-step-hint"><span>◇</span><p><strong>Vous pouvez laisser le budget vide.</strong> Le budget final et les éventuels frais d’hébergement ou de maintenance seront détaillés après le cadrage.</p></div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="brief-panel brief-step-card brief-review-card">
                  <div className="brief-panel-heading"><div><span className="brief-panel-index">ÉTAPE 04 · VOTRE RÉCAPITULATIF</span><h3>Votre projet prend forme.</h3><p>Relisez vos choix. Utilisez « Modifier » pour revenir à une étape, ou enregistrez quand vous le souhaitez.</p></div><span className="brief-panel-symbol">✓</span></div>
                  <section className="brief-review-section">
                    <div className="brief-review-heading"><div><span>01</span><h4>Votre vision</h4></div><button type="button" onClick={() => goToStep(0)}>Modifier <span>→</span></button></div>
                    <p className="brief-review-text">{draft.priorities.trim() || "Aucune priorité précisée pour le moment."}</p>
                  </section>
                  <section className="brief-review-section">
                    <div className="brief-review-heading"><div><span>02</span><h4>Modules choisis</h4></div><button type="button" onClick={() => goToStep(1)}>Modifier <span>→</span></button></div>
                    {draft.modules.length === 0 ? <p className="brief-review-text">Aucun module sélectionné. Vous pourrez en ajouter à l’étape précédente.</p> : (
                      <div className="brief-review-modules">{draft.modules.map((module) => (
                        <div key={module.id}><span className={`brief-review-status review-${module.status}`} /><strong>{module.name || "Module sans nom"}</strong><span>{module.status === "included" ? "À inclure" : module.status === "optional" ? "À discuter" : "Pas nécessaire"}</span><small>{module.features.length} fonctionnalité{module.features.length > 1 ? "s" : ""}</small></div>
                      ))}</div>
                    )}
                  </section>
                  <section className="brief-review-section">
                    <div className="brief-review-heading"><div><span>03</span><h4>Budget, calendrier & contexte</h4></div><button type="button" onClick={() => goToStep(2)}>Modifier <span>→</span></button></div>
                    <div className="brief-review-facts"><div><small>Budget envisagé</small><strong>{budgetDisplay}</strong></div><div><small>Date cible</small><strong>{draft.targetDate || "À définir"}</strong></div><div><small>État de réflexion</small><strong>{STATUS_LABELS[draft.status]}</strong></div></div>
                    {draft.notes.trim() && <p className="brief-review-text">{draft.notes}</p>}
                  </section>
                  <div className="brief-review-privacy"><span>🔒</span><p>Ce cahier reste privé et visible uniquement par les comptes administrateurs. Vos réponses sont partagées avec l’équipe projet après enregistrement.</p></div>
                </div>
              )}
            </section>

            <div className="brief-submit-bar">
              <button type="button" className="brief-step-previous" onClick={() => goToStep(activeStep - 1)} disabled={activeStep === 0}>← <span>Précédent</span></button>
              <span className="brief-step-counter">ÉTAPE {String(activeStep + 1).padStart(2, "0")} / {String(BRIEF_STEPS.length).padStart(2, "0")}</span>
              {activeStep < BRIEF_STEPS.length - 1 && <button type="button" className="brief-step-next" onClick={() => goToStep(activeStep + 1)}>Continuer <span>→</span></button>}
              {activeStep === BRIEF_STEPS.length - 1 && <button type="submit" className="brief-save-button" disabled={!dirty || saving || !record}>{saving ? "Enregistrement…" : dirty ? "Enregistrer mes choix" : "Tout est à jour"} <span>✓</span></button>}
              {activeStep !== BRIEF_STEPS.length - 1 && <button type="submit" className="brief-step-save" disabled={!dirty || saving || !record}>{saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré"}</button>}
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
