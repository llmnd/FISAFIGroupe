"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import CommercialSimulationPanel from "./CommercialSimulationPanel";
import {
  calculateBreakEven,
  getEstimatedExpensesAtRevenue,
  getEstimatedBalanceAfterExpenses,
  normalizeMonthlyExpenseList,
  summarizeMonthlyExpenses,
} from "@/lib/marketSimulation/expenses";
import type {
  ExpenseNature,
  ExpenseTiming,
  MonthlyExpense,
} from "@/lib/marketSimulation/expenses";
import styles from "./MarketScenarioSimulator.module.css";

/* ───────────────────────── Types ───────────────────────── */

type PresetId =
  | "current"
  | "volume"
  | "basket"
  | "promotion"
  | "flash"
  | "finish"
  | "hard"
  | "custom";

type Lever = "volume" | "basket" | "discount" | "start" | "margin" | "elasticity";

type Params = {
  volume: number; // % de ventes en plus / en moins
  basket: number; // % de panier moyen
  discount: number; // % de remise moyenne
  start: number; // dans N jours
  elasticity: number; // points de ventes gagnés par point de remise
  margin: number; // % de marge brute estimée
};

type ScenarioPreset = {
  id: Exclude<PresetId, "custom">;
  label: string;
  hint: string;
  volume: number;
  basket: number;
  discount: number;
  startRatio: number; // part des jours restants à attendre avant de lancer l’action
  elasticity: number;
};

type Pin = { id: number; label: string; revenue: number; profit: number };

type Context = {
  currentRevenue: number;
  currentOrders: number;
  elapsedDays: number;
  remainingDays: number;
  revenueGoal: number | null;
};

interface MarketScenarioSimulatorProps {
  companyId?: number;
  companyName: string;
  currentRevenue: number;
  currentOrders: number;
  elapsedDays: number;
  remainingDays: number;
  revenueGoal: number | null;
  currentMonthKey?: string;
}

/* ───────────────────────── Constantes ───────────────────────── */

const PRESETS: ScenarioPreset[] = [
  { id: "current", label: "Rythme actuel", hint: "Aucun changement", volume: 0, basket: 0, discount: 0, startRatio: 0, elasticity: 0 },
  { id: "volume", label: "Plus de ventes", hint: "15 % de ventes en plus, dès aujourd’hui", volume: 15, basket: 0, discount: 0, startRatio: 0, elasticity: 0 },
  { id: "basket", label: "Panier moyen", hint: "Ventes additionnelles : +10 % de panier", volume: 0, basket: 10, discount: 0, startRatio: 0, elasticity: 0 },
  { id: "promotion", label: "Test promotion", hint: "20 % de ventes en plus pour 5 % de remise", volume: 20, basket: 0, discount: 5, startRatio: 0, elasticity: 0 },
  { id: "flash", label: "Promo flash", hint: "10 % de remise qui attire des clients", volume: 0, basket: 0, discount: 10, startRatio: 0, elasticity: 1.5 },
  { id: "finish", label: "Sprint de fin de mois", hint: "Action lancée à mi-parcours, forte et courte", volume: 25, basket: 5, discount: 0, startRatio: 0.5, elasticity: 0 },
  { id: "hard", label: "Mois difficile", hint: "Test de résistance : ventes et panier en baisse", volume: -25, basket: -10, discount: 0, startRatio: 0, elasticity: 0 },
];

const DEFAULT_PARAMS: Params = {
  volume: 15,
  basket: 0,
  discount: 0,
  start: 0,
  elasticity: 0,
  margin: 25,
};

const MAX_PINS = 3;
const DEFAULT_MONTHLY_EXPENSES: MonthlyExpense[] = [
  { id: "rent", label: "Loyer", amount: "", nature: "fixed", timing: "forecast" },
  { id: "salaries", label: "Salaires", amount: "", nature: "fixed", timing: "forecast" },
  { id: "electricity", label: "Électricité", amount: "", nature: "variable", timing: "forecast" },
  { id: "internet", label: "Internet / Wi-Fi", amount: "", nature: "fixed", timing: "forecast" },
  { id: "other", label: "Autres charges", amount: "", nature: "fixed", timing: "forecast" },
];

// géométrie du graphique
const W = 640;
const H = 290;
const PL = 46;
const PR = 16;
const PT = 14;
const PB = 28;
const INNER_W = W - PL - PR;
const INNER_H = H - PT - PB;

/* ───────────────────────── Utilitaires ───────────────────────── */

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const numberFormat = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const compactFormat = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

function formatCurrency(value: number): string {
  return `${numberFormat.format(Math.round(value))} FCFA`;
}

function formatSignedCurrency(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${numberFormat.format(Math.abs(rounded))} FCFA`;
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${numberFormat.format(value)} %`;
}

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many;
}

function createExpenseId(): string {
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getPreviousMonthKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const previous = new Date(Date.UTC(year, month - 2, 1));
  return `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey: string): string {
  return new Date(`${monthKey}-01T00:00:00Z`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/* ───────────────────────── Moteur de simulation ───────────────────────── */

function simulate(ctx: Context, p: Params) {
  const elapsed = Math.max(ctx.elapsedDays, 1);
  const remaining = Math.max(ctx.remainingDays, 0);
  const total = elapsed + remaining;
  const dailyRev = ctx.currentRevenue / elapsed;
  const dailyOrders = ctx.currentOrders / elapsed;
  const start = clamp(Math.round(p.start), 0, remaining);
  const active = remaining - start;
  const m = p.margin / 100;
  const d = p.discount / 100;

  // la remise peut attirer des clients (élasticité)
  const volumeBoost = p.volume + p.discount * p.elasticity;
  const volumeMult = Math.max(0, 1 + volumeBoost / 100);
  const basketMult = Math.max(0, 1 + p.basket / 100);
  const net = basketMult * (1 - d);

  const baselineRemaining = dailyRev * remaining;
  const scenarioRemaining = dailyRev * (start + active * volumeMult * net);
  const baselineRevenue = ctx.currentRevenue + baselineRemaining;
  const scenarioRevenue = ctx.currentRevenue + scenarioRemaining;
  const baselineOrders = ctx.currentOrders + dailyOrders * remaining;
  const scenarioOrders = ctx.currentOrders + dailyOrders * (start + active * volumeMult);

  // marge : les coûts suivent les quantités vendues, pas la remise
  const baselineProfit = (ctx.currentRevenue + baselineRemaining) * m;
  const scenarioProfit =
    ctx.currentRevenue * m + dailyRev * (start * m + active * volumeMult * basketMult * (m - d));

  const swing = Math.abs(volumeBoost) + Math.abs(p.basket) + p.discount * 0.5;
  const uncertainty = Math.min(0.06 + (swing / 100) * 0.3, 0.4);

  return {
    elapsed,
    remaining,
    total,
    dailyRev,
    dailyOrders,
    start,
    active,
    volumeBoost,
    volumeMult,
    basketMult,
    net,
    baselineRemaining,
    scenarioRemaining,
    baselineRevenue,
    scenarioRevenue,
    baselineOrders,
    scenarioOrders,
    baselineProfit,
    scenarioProfit,
    difference: scenarioRevenue - baselineRevenue,
    differencePercent: baselineRevenue > 0 ? ((scenarioRevenue - baselineRevenue) / baselineRevenue) * 100 : 0,
    profitDiff: scenarioProfit - baselineProfit,
    uncertainty,
    low: ctx.currentRevenue + scenarioRemaining * (1 - uncertainty),
    high: ctx.currentRevenue + scenarioRemaining * (1 + uncertainty),
  };
}

function CalculationGuide({
  currentRevenue,
  currentOrders,
  params,
  sim,
  hidden,
}: {
  currentRevenue: number;
  currentOrders: number;
  params: Params;
  sim: ReturnType<typeof simulate>;
  hidden: boolean;
}) {
  return (
    <section
      className={styles.calculationGuide}
      id="market-simulator-calculation"
      hidden={hidden}
    >
      <div className={styles.calculationHeading}>
        <div>
          <h3>Comment lire et comprendre les calculs</h3>
          <p>Les montants affichés sont des estimations pour vous aider à comparer des hypothèses, pas des garanties de vente.</p>
        </div>
      </div>

      <div className={styles.calculationGrid}>
        <article>
          <h4>1. Ce qui vient réellement d’Odoo</h4>
          <p>
            Le chiffre d’affaires et les commandes confirmées viennent de la société sélectionnée.
            Les commandes de vente et les ventes POS sont comptées séparément puis regroupées; les ventes annulées
            ou non confirmées ne sont pas incluses. Les dates sont regroupées en UTC.
          </p>
          <p>
            Les produits, quantités et prix réellement vendus servent à calculer les moyennes historiques.
            Les prospects, conversions, budgets et réactions à une promotion ne sont pas enregistrés par ce flux Odoo :
            vous les saisissez comme hypothèses.
          </p>
        </article>

        <article>
          <h4>2. Projection au rythme actuel</h4>
          <p>
            Le simulateur prolonge la moyenne quotidienne du mois en cours. Ici, le rythme est de{" "}
            <strong>{formatCurrency(sim.dailyRev)} par jour</strong> et d’environ{" "}
            <strong>{sim.dailyOrders.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} commande(s) par jour</strong>.
          </p>
          <code>
            CA par jour = {formatCurrency(currentRevenue)} ÷ {sim.elapsed} jour(s) observé(s)
            <br />
            Projection de base = CA réalisé + CA par jour × jours restants
            <br />
            = {formatCurrency(currentRevenue)} + {formatCurrency(sim.dailyRev)} × {sim.remaining}
            {" "}= {formatCurrency(sim.baselineRevenue)}
          </code>
          <p>
            Le nombre de commandes projeté utilise la même méthode, avec {currentOrders} commande(s)
            confirmée(s) à ce jour.
            Cette projection prolonge le rythme observé : elle ne prédit pas une saisonnalité ni un événement futur.
            L’objectif sert de comparaison et ne modifie pas le calcul du chiffre d’affaires prévu.
          </p>
        </article>

        <article>
          <h4>3. Effet des curseurs de l’ancien scénario</h4>
          <p>
            Les changements ne s’appliquent qu’aux jours restant après la date de lancement.
            La remise peut aussi augmenter le volume si vous avez réglé une élasticité.
          </p>
          <code>
            Volume ajusté (%) = volume saisi (%) + remise (%) × élasticité
            <br />
            Coefficient volume = max(0, 1 + volume ajusté (%) ÷ 100)
            <br />
            Coefficient panier = max(0, 1 + variation du panier (%) ÷ 100)
            <br />
            CA fin de mois = CA réalisé + CA par jour × [jours d’attente + jours d’action ×
            coefficient volume × coefficient panier × (1 − remise (%) ÷ 100)]
            <br />
            Commandes fin de mois = commandes réalisées + commandes par jour ×
            [jours d’attente + jours d’action × coefficient volume]
          </code>
          <p>
            Vos paramètres actuels donnent un volume ajusté de {formatSignedPercent(sim.volumeBoost)},
            un panier multiplié par {sim.basketMult.toLocaleString("fr-FR", { maximumFractionDigits: 2 })},
            et une remise de {params.discount} %.
          </p>
          <p>
            Votre projection avec ces curseurs est de {formatCurrency(sim.scenarioRevenue)} de chiffre d’affaires
            et {sim.scenarioOrders.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} commande(s) estimée(s).
          </p>
          <p>
            La marge de cet ancien scénario utilise le taux que vous choisissez dans « Réglages avancés ».
            La formule applique ce taux au CA réalisé, puis l’ajuste selon le volume, le panier et la remise.
            Ce taux est une hypothèse : ce n’est pas le coût réel calculé produit par produit.
          </p>
          <p>
            La fourchette de ce mode est une marge de prudence mécanique : elle augmente avec l’ampleur des
            curseurs, est plafonnée à 40 % et n’est pas calculée à partir d’erreurs historiques mesurées.
          </p>
          <code>
            Amplitude = |volume ajusté| + |panier| + 0,5 × remise
            <br />
            Incertitude = min(6 % + 0,3 × amplitude %, 40 %)
            <br />
            Fourchette = CA réalisé + CA futur estimé × (1 ± incertitude)
          </code>
        </article>

        <article>
          <h4>4. Comment sont estimés les cinq leviers commerciaux</h4>
          <ul>
            <li><strong>Prospection :</strong> prospects saisis × conversion attendue = nouveaux clients estimés; ceux-ci sont multipliés par les commandes prévues par client.</li>
            <li><strong>Marketing :</strong> budget ÷ coût par prospect = prospects estimés, puis conversion et fréquence de commande saisies.</li>
            <li><strong>Fidélisation :</strong> clients ciblés × hausse attendue du taux de retour = clients qui reviendraient en plus.</li>
            <li><strong>Promotion :</strong> les ventes prévues sont diminuées de la remise; la remise s’applique aussi aux commandes éligibles qui auraient pu avoir lieu sans promotion.</li>
            <li><strong>Vente additionnelle :</strong> commandes éligibles × taux d’ajout × unités par ajout = unités demandées.</li>
          </ul>
          <p>
            <code>Panier moyen = chiffre d’affaires confirmé ÷ commandes confirmées</code>
            <br />
            Le moteur utilise le mois en cours s’il est complet, sinon l’historique disponible. Les ventes et
            quantités des douze derniers mois fournissent aussi le mix de produits estimé.
          </p>
          <p>
            Pour la promotion, il compare le revenu réduit des commandes éligibles et supplémentaires au revenu
            normal des commandes éligibles. Pour l’upsell, il estime le CA avec le prix réellement vendu du produit
            choisi sur l’historique disponible.
          </p>
          <code>
            Variation promotion = (commandes éligibles + commandes supplémentaires) × panier ×
            (1 − remise (%) ÷ 100)
            <br />
            − commandes éligibles × panier
          </code>
        </article>

        <article>
          <h4>5. Stock, marge et coût de l’action</h4>
          <p>
            Les ventes additionnelles estimées sont réparties selon le mix de produits observé. Le stock Odoo
            disponible aujourd’hui limite les unités pouvant être servies. Quand plusieurs actions sont combinées,
            le stock commun est réparti une seule fois.
          </p>
          <code>
            Marge brute estimée = unités servies × (prix HT historique − coût unitaire actuel)
            <br />
            Contribution = marge brute estimée − coûts directs saisis
            <br />
            ROI = contribution ÷ coûts directs × 100
          </code>
          <p>
            Pour la marge combinée, le calcul utilise les unités servies × (prix HT moyen historique − coût unitaire
            actuel). Pour la prospection, le marketing et la fidélisation, la marge par commande applique le coût
            actuel au mix historique et n’est pas plafonnée au stock. Le coût produit et le stock Odoo sont des
            valeurs actuelles, pas des valeurs historiques.
          </p>
          <p>
            Le « CA potentiel » est calculé avant la contrainte de stock; le « CA compatible avec le stock » et la
            marge combinée tiennent compte du stock disponible aujourd’hui. La remise réduit déjà le CA et la marge :
            elle n’est pas ajoutée une seconde fois aux coûts de l’action.
          </p>
          <p>
            Le ROI n’est affiché que si la contribution et un coût direct positif sont calculables.
            Si le coût est inconnu ou nul, le ROI n’a pas de sens exploitable et reste indisponible.
          </p>
        </article>

        <article>
          <h4>6. Charges de la boutique</h4>
          <p>
            Les charges ne viennent pas d’Odoo. Vous séparez les montants déjà payés ou engagés des prévisions,
            et les charges fixes des variables. Les charges variables prévisionnelles évoluent au même rythme que le CA.
          </p>
          <code>
            Coût estimé = charges engagées + charges fixes prévues + charges variables prévues × (CA scénario ÷ CA de référence)
            <br />
            Reste estimé = marge brute estimée − coût estimé
            <br />
            Seuil de CA = (charges engagées + charges fixes prévues) ÷ (taux de marge − taux variable prévu)
          </code>
          <p>
            Ce reste est indicatif : il dépend du taux de marge choisi et des seules charges renseignées.
            Les variables prévues sont rapportées à la projection au rythme actuel. Ce n’est pas un bénéfice net comptable.
          </p>
        </article>

        <article>
          <h4>7. Combinaisons, scénarios et données manquantes</h4>
          <p>
            Si deux actions risquent de viser les mêmes personnes, le total combiné est bloqué tant que vous
            n’avez pas nommé et confirmé des audiences distinctes. Cela évite de compter deux fois les mêmes clients.
          </p>
          <p>
            Les scénarios prudent et optimiste appliquent la variation que vous saisissez autour de la marge brute
            combinée, puis retirent les mêmes coûts directs. C’est une fourchette de travail, pas une probabilité
            statistique.
          </p>
          <p>
            Si le coût, le stock ou l’historique manque, le résultat concerné est indiqué comme indisponible;
            il n’est pas remplacé par zéro. Une marge ou un ROI absent n’empêche pas d’afficher un chiffre d’affaires
            estimable.
          </p>
        </article>
      </div>
    </section>
  );
}

/* ───────────────────────── Nombre animé ───────────────────────── */

function useCountUp(target: number, duration = 450): number {
  const [value, setValue] = useState(target);
  const current = useRef(target);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      current.current = target;
      setValue(target);
      return;
    }
    const from = current.current;
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = from + (target - from) * eased;
      current.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

function AnimatedCurrency({ value }: { value: number }) {
  const animated = useCountUp(value);
  return <>{formatCurrency(animated)}</>;
}

/* ───────────────────────── Composant ───────────────────────── */

export default function MarketScenarioSimulator({
  companyId,
  companyName,
  currentRevenue,
  currentOrders,
  elapsedDays,
  remainingDays,
  revenueGoal,
  currentMonthKey,
}: MarketScenarioSimulatorProps) {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("volume");
  const [scrub, setScrub] = useState<number | null>(null);
  const [pins, setPins] = useState<Pin[]>([]);
  const [showCalculationGuide, setShowCalculationGuide] = useState(false);
  const [showMonthlyExpenses, setShowMonthlyExpenses] = useState(false);
  const [monthlyExpenses, setMonthlyExpenses] = useState<MonthlyExpense[]>(DEFAULT_MONTHLY_EXPENSES);
  const [loadedExpenseKey, setLoadedExpenseKey] = useState<string | null>(null);
  const [expenseStorageWritable, setExpenseStorageWritable] = useState(false);
  const [expenseStorageError, setExpenseStorageError] = useState("");
  const [legacyExpenseKeyToRemove, setLegacyExpenseKeyToRemove] = useState<string | null>(null);
  const [expenseActionMessage, setExpenseActionMessage] = useState("");
  const monthKey = currentMonthKey && /^\d{4}-(0[1-9]|1[0-2])$/.test(currentMonthKey)
    ? currentMonthKey
    : new Date().toISOString().slice(0, 7);
  const expenseStorageScope = companyId ?? "unselected";
  const expenseStorageKey = `market-simulator-expenses:v2:${expenseStorageScope}:${monthKey}`;
  const legacyExpenseStorageKey = `market-simulator-expenses:v1:${expenseStorageScope}`;
  const previousMonthKey = getPreviousMonthKey(monthKey);
  const previousMonthStorageKey = `market-simulator-expenses:v2:${expenseStorageScope}:${previousMonthKey}`;

  useEffect(() => {
    setLoadedExpenseKey(null);
    setExpenseStorageWritable(false);
    setLegacyExpenseKeyToRemove(null);
    try {
      let migratedLegacyExpenses = false;
      const saved = window.localStorage.getItem(expenseStorageKey);
      if (saved === null) {
        const legacySaved = window.localStorage.getItem(legacyExpenseStorageKey);
        if (legacySaved === null) {
          setMonthlyExpenses(DEFAULT_MONTHLY_EXPENSES);
        } else {
          const parsed: unknown = JSON.parse(legacySaved);
          const normalized = normalizeMonthlyExpenseList(parsed);
          if (!normalized) throw new Error("Le format des anciennes charges mémorisées est invalide.");
          setMonthlyExpenses(normalized);
          setLegacyExpenseKeyToRemove(legacyExpenseStorageKey);
          migratedLegacyExpenses = true;
        }
      } else {
        const parsed: unknown = JSON.parse(saved);
        const normalized = normalizeMonthlyExpenseList(parsed);
        if (!normalized) {
          throw new Error("Le format des charges mémorisées est invalide.");
        }
        setMonthlyExpenses(normalized);
      }
      setExpenseStorageError("");
      setExpenseActionMessage(
        migratedLegacyExpenses
          ? "Anciennes charges reprises comme fixes et prévues; vérifiez leur nature et leur statut."
          : "",
      );
      setLoadedExpenseKey(expenseStorageKey);
      setExpenseStorageWritable(true);
    } catch (error) {
      console.error("[MarketSimulator] Could not load saved shop expenses:", error);
      setMonthlyExpenses(DEFAULT_MONTHLY_EXPENSES);
      setExpenseStorageError("Les charges ne peuvent pas être lues sur cet appareil.");
      setLoadedExpenseKey(expenseStorageKey);
    }
  }, [expenseStorageKey, legacyExpenseStorageKey]);

  useEffect(() => {
    if (loadedExpenseKey !== expenseStorageKey || !expenseStorageWritable) return;
    try {
      window.localStorage.setItem(expenseStorageKey, JSON.stringify(monthlyExpenses));
      if (legacyExpenseKeyToRemove) {
        window.localStorage.removeItem(legacyExpenseKeyToRemove);
        setLegacyExpenseKeyToRemove(null);
      }
      setExpenseStorageError("");
    } catch (error) {
      console.error("[MarketSimulator] Could not save shop expenses:", error);
      setExpenseStorageError("Enregistrement local impossible. Vos saisies resteront visibles jusqu’à la fermeture de cette page.");
      setExpenseStorageWritable(false);
    }
  }, [expenseStorageKey, expenseStorageWritable, legacyExpenseKeyToRemove, loadedExpenseKey, monthlyExpenses]);

  const ctx = useMemo<Context>(
    () => ({ currentRevenue, currentOrders, elapsedDays, remainingDays, revenueGoal }),
    [currentRevenue, currentOrders, elapsedDays, remainingDays, revenueGoal],
  );

  const sim = useMemo(() => simulate(ctx, params), [ctx, params]);
  const expenseSummary = useMemo(
    () => summarizeMonthlyExpenses(monthlyExpenses),
    [monthlyExpenses],
  );
  const baselineExpenses = getEstimatedExpensesAtRevenue(
    expenseSummary,
    sim.baselineRevenue,
    sim.baselineRevenue,
  );
  const scenarioExpenses = getEstimatedExpensesAtRevenue(
    expenseSummary,
    sim.scenarioRevenue,
    sim.baselineRevenue,
  );
  const baselineAfterExpenses = getEstimatedBalanceAfterExpenses(
    sim.baselineProfit,
    expenseSummary,
    sim.baselineRevenue,
    sim.baselineRevenue,
  );
  const scenarioAfterExpenses = getEstimatedBalanceAfterExpenses(
    sim.scenarioProfit,
    expenseSummary,
    sim.scenarioRevenue,
    sim.baselineRevenue,
  );
  const averageOrderValue = sim.baselineOrders > 0
    ? sim.baselineRevenue / sim.baselineOrders
    : 0;
  const breakEven = calculateBreakEven(
    expenseSummary,
    params.margin,
    sim.baselineRevenue,
    averageOrderValue,
  );
  const reliability = elapsedDays >= 14
    ? "Plus étayée"
    : elapsedDays >= 7
      ? "Intermédiaire"
      : "Limitée";

  const hasReference = currentRevenue > 0 && currentOrders > 0;
  const canAdjust = remainingDays > 0;
  const hasGoal = revenueGoal !== null && revenueGoal > 0;
  const goal = hasGoal ? (revenueGoal as number) : 0;

  /* ── Valeurs cumulées par jour ── */
  const valueAt = (day: number, kind: "baseline" | "scenario"): number => {
    if (day <= sim.elapsed) return currentRevenue * (day / sim.elapsed);
    const x = day - sim.elapsed;
    if (kind === "baseline") return currentRevenue + sim.dailyRev * x;
    const before = Math.min(x, sim.start);
    const after = Math.max(0, x - sim.start);
    return currentRevenue + sim.dailyRev * (before + after * sim.volumeMult * sim.net);
  };

  const goalDay = (kind: "baseline" | "scenario"): number | null => {
    if (!hasGoal) return null;
    if (currentRevenue >= goal) return 0;
    if (sim.dailyRev <= 0) return null;
    const need = goal - currentRevenue;
    let day: number;
    if (kind === "baseline") {
      day = sim.elapsed + need / sim.dailyRev;
    } else {
      const pre = sim.dailyRev * sim.start;
      if (need <= pre) {
        day = sim.elapsed + need / sim.dailyRev;
      } else {
        const rate = sim.dailyRev * sim.volumeMult * sim.net;
        if (rate <= 0) return null;
        day = sim.elapsed + sim.start + (need - pre) / rate;
      }
    }
    return day <= sim.total + 1e-9 ? Math.max(1, Math.ceil(day - 1e-9)) : null;
  };

  const scenarioGoalDay = goalDay("scenario");
  const baselineGoalDay = goalDay("baseline");

  /* ── Géométrie du graphique ── */
  const yMax = Math.max(sim.baselineRevenue, sim.high, goal, currentRevenue, 1) * 1.1;
  const x = (day: number) => PL + (day / sim.total) * INNER_W;
  const y = (value: number) => PT + INNER_H - (value / yMax) * INNER_H;

  const pRealized = `${x(0)},${y(0)} ${x(sim.elapsed)},${y(currentRevenue)}`;
  const pBaseline = `${x(sim.elapsed)},${y(currentRevenue)} ${x(sim.total)},${y(sim.baselineRevenue)}`;
  const scenarioPoints = [
    { day: sim.elapsed, value: currentRevenue, band: 0 },
    { day: sim.elapsed + sim.start, value: currentRevenue + sim.dailyRev * sim.start, band: sim.uncertainty * sim.dailyRev * sim.start },
    { day: sim.total, value: sim.scenarioRevenue, band: sim.uncertainty * sim.scenarioRemaining },
  ];
  const pScenario = scenarioPoints.map((pt) => `${x(pt.day)},${y(pt.value)}`).join(" ");
  const pBand = [
    ...scenarioPoints.map((pt) => `${x(pt.day)},${y(pt.value + pt.band)}`),
    ...[...scenarioPoints].reverse().map((pt) => `${x(pt.day)},${y(Math.max(pt.value - pt.band, 0))}`),
  ].join(" ");

  const gridTicks = [0, 1, 2, 3, 4].map((i) => (yMax * i) / 4);

  const focusDay = clamp(scrub ?? sim.total, 1, sim.total);
  const focusBaseline = valueAt(focusDay, "baseline");
  const focusScenario = valueAt(focusDay, "scenario");

  const handleChartPointer = (event: ReactPointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const px = ((event.clientX - rect.left) / rect.width) * W;
    const day = Math.round(((px - PL) / INNER_W) * sim.total);
    setScrub(clamp(day, 1, sim.total));
  };

  const dayState = (day: number): "past" | "wait" | "live" =>
    day <= sim.elapsed ? "past" : day - sim.elapsed <= sim.start ? "wait" : "live";

  /* ── Lecture intelligente du scénario ── */
  const hasChange = Math.abs(sim.difference) > 0.5 || Math.abs(sim.profitDiff) > 0.5;
  const verdict = (() => {
    if (!hasChange) {
      return {
        tone: "neutral",
        title: "Vous êtes au rythme actuel",
        text: "Déplacez un curseur ou choisissez un scénario pour voir l’effet sur la fin de mois.",
      };
    }
    if (sim.difference >= 0 && sim.profitDiff >= 0) {
      return {
        tone: "good",
        title: "Scénario gagnant",
        text: `Vous gagnez ${formatCurrency(sim.difference)} de chiffre d’affaires et ${formatCurrency(sim.profitDiff)} de marge brute estimée.`,
      };
    }
    if (sim.difference >= 0) {
      return {
        tone: "warn",
        title: "Attention à la marge",
        text: `Le chiffre d’affaires monte de ${formatCurrency(sim.difference)}, mais la marge brute estimée baisse de ${formatCurrency(Math.abs(sim.profitDiff))}. Vous vendez plus pour gagner moins.`,
      };
    }
    if (sim.profitDiff >= 0) {
      return {
        tone: "good",
        title: "Moins de chiffre d’affaires, plus de marge",
        text: `Le chiffre d’affaires recule de ${formatCurrency(Math.abs(sim.difference))}, mais la marge brute estimée progresse de ${formatCurrency(sim.profitDiff)}.`,
      };
    }
    return {
      tone: "bad",
      title: "Scénario défensif",
      text: `Le chiffre d’affaires recule de ${formatCurrency(Math.abs(sim.difference))} et la marge de ${formatCurrency(Math.abs(sim.profitDiff))}. Utile pour mesurer le risque.`,
    };
  })();

  const ambitionScore =
    Math.abs(sim.volumeBoost) + Math.abs(params.basket) + params.discount + (sim.start > 0 ? 3 : 0);
  const ambitionLevel = !hasChange ? 0 : ambitionScore < 12 ? 1 : ambitionScore < 30 ? 2 : ambitionScore < 55 ? 3 : 4;
  const ambitionLabel = ["Rythme actuel", "Prudent", "Équilibré", "Ambitieux", "Audacieux"][ambitionLevel];

  /* ── Que faut-il pour atteindre l’objectif ? ── */
  const goalPlan = useMemo(() => {
    if (!hasGoal || sim.scenarioRevenue >= goal || sim.dailyRev <= 0 || sim.active <= 0) return null;
    const needDays = (goal - currentRevenue) / sim.dailyRev - sim.start;
    const volume =
      sim.net > 0
        ? Math.ceil((needDays / (sim.active * sim.net) - 1) * 100 - params.discount * params.elasticity)
        : null;
    const keepDiscount = 1 - params.discount / 100;
    const basket =
      sim.volumeMult > 0 && keepDiscount > 0
        ? Math.ceil((needDays / (sim.active * sim.volumeMult * keepDiscount) - 1) * 100)
        : null;
    return { volume, basket };
  }, [hasGoal, goal, currentRevenue, sim, params.discount, params.elasticity]);

  /* ── Sensibilité : quel levier pèse le plus ? ── */
  const sensitivity = useMemo(() => {
    const base = simulate(ctx, params);
    const variants: { label: string; p: Params }[] = [
      { label: "+10 pts de volume", p: { ...params, volume: params.volume + 10 } },
      { label: "+10 pts de panier moyen", p: { ...params, basket: params.basket + 10 } },
      { label: "+5 pts de remise", p: { ...params, discount: params.discount + 5 } },
      params.start > 0
        ? { label: `Lancer ${Math.min(3, params.start)} j plus tôt`, p: { ...params, start: Math.max(0, params.start - 3) } }
        : { label: "Lancer 3 j plus tard", p: { ...params, start: Math.min(ctx.remainingDays, 3) } },
    ];
    const rows = variants.map((variant) => {
      const result = simulate(ctx, variant.p);
      return {
        label: variant.label,
        revenue: result.scenarioRevenue - base.scenarioRevenue,
        profit: result.scenarioProfit - base.scenarioProfit,
      };
    });
    const maxAbs = Math.max(...rows.map((row) => Math.abs(row.revenue)), 1);
    return { rows, maxAbs };
  }, [ctx, params]);

  /* ── Marge : combien de ventes pour compenser ? ── */
  const m = params.margin / 100;
  const d = params.discount / 100;
  const marginRecovery = (() => {
    if (sim.profitDiff >= 0 || sim.active <= 0) return null;
    if (m <= d) return { impossible: true as const, needed: 0 };
    const needed = (m / (sim.basketMult * (m - d)) - 1) * 100;
    return { impossible: false as const, needed: Math.ceil(needed) };
  })();

  /* ── Actions ── */
  const applyPreset = (preset: ScenarioPreset) => {
    setParams((prev) => ({
      ...prev,
      volume: preset.volume,
      basket: preset.basket,
      discount: preset.discount,
      elasticity: preset.elasticity,
      start: Math.round(preset.startRatio * remainingDays),
    }));
    setSelectedPreset(preset.id);
  };

  const updateValue = (lever: Lever, value: number) => {
    setParams((prev) => ({ ...prev, [lever]: value }));
    if (lever !== "margin") setSelectedPreset("custom");
  };

  const updateExpense = (id: string, patch: Partial<MonthlyExpense>) => {
    setMonthlyExpenses((expenses) =>
      expenses.map((expense) => expense.id === id ? { ...expense, ...patch } : expense),
    );
  };

  const addExpense = () => {
    setMonthlyExpenses((expenses) =>
      expenses.length >= 50
        ? expenses
        : [...expenses, {
            id: createExpenseId(),
            label: "",
            amount: "",
            nature: "fixed",
            timing: "forecast",
          }],
    );
  };

  const removeExpense = (id: string) => {
    setMonthlyExpenses((expenses) => expenses.filter((expense) => expense.id !== id));
  };

  const copyPreviousMonthExpenses = () => {
    setExpenseActionMessage("");
    setExpenseStorageError("");
    try {
      const saved = window.localStorage.getItem(previousMonthStorageKey);
      if (saved === null) {
        setExpenseActionMessage(`Aucune charge mémorisée pour ${getMonthLabel(previousMonthKey)}.`);
        return;
      }
      const parsed: unknown = JSON.parse(saved);
      const previousExpenses = normalizeMonthlyExpenseList(parsed);
      const reusableExpenses = previousExpenses?.filter((expense) => {
        const amount = Number(expense.amount);
        return expense.label.trim() !== "" &&
          expense.amount.trim() !== "" &&
          Number.isFinite(amount) &&
          amount >= 0 &&
          amount <= 1_000_000_000_000;
      });
      if (!reusableExpenses || reusableExpenses.length === 0) {
        setExpenseActionMessage(`Aucune charge réutilisable pour ${getMonthLabel(previousMonthKey)}.`);
        return;
      }
      setMonthlyExpenses(
        reusableExpenses.map((expense) => ({
          ...expense,
          id: createExpenseId(),
          timing: "forecast",
        })),
      );
      setExpenseActionMessage(
        `Charges de ${getMonthLabel(previousMonthKey)} reprises comme prévisions; vérifiez les montants et leur statut.`,
      );
    } catch (error) {
      console.error("[MarketSimulator] Could not copy previous month's expenses:", error);
      setExpenseStorageError("Impossible de reprendre les charges du mois précédent.");
    }
  };

  const surprise = () => {
    const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min));
    const discount = Math.random() < 0.5 ? 0 : rand(3, 15);
    setParams((prev) => ({
      ...prev,
      volume: rand(-20, 50),
      basket: rand(-10, 25),
      discount,
      elasticity: discount > 0 ? rand(0, 6) / 2 : 0,
      start: rand(0, Math.floor(remainingDays / 2)),
    }));
    setSelectedPreset("custom");
  };

  const pinScenario = () => {
    if (pins.length >= MAX_PINS) return;
    const preset = PRESETS.find((item) => item.id === selectedPreset);
    setPins((prev) => [
      ...prev,
      {
        id: Date.now() + prev.length,
        label: preset ? preset.label : `Perso ${prev.length + 1}`,
        revenue: sim.scenarioRevenue,
        profit: sim.scenarioProfit,
      },
    ]);
  };

  const removePin = (id: number) => setPins((prev) => prev.filter((pin) => pin.id !== id));

  /* ── Rendus ── */
  const renderControl = (config: {
    id: string;
    label: string;
    lever: Lever;
    min: number;
    max: number;
    step?: number;
    format: (value: number) => string;
  }) => {
    const value = config.lever === "start" ? sim.start : params[config.lever];
    return (
      <label className={styles.control} htmlFor={config.id}>
        <span className={styles.controlHeading}>
          <span>{config.label}</span>
          <strong>{config.format(value)}</strong>
        </span>
        <input
          id={config.id}
          type="range"
          min={config.min}
          max={config.max}
          step={config.step ?? 1}
          value={value}
          disabled={!canAdjust}
          aria-valuetext={config.format(value)}
          onChange={(event) => updateValue(config.lever, Number(event.target.value))}
        />
        <span className={styles.rangeLabels}>
          <span>{config.format(config.min)}</span>
          <span>{config.format(config.max)}</span>
        </span>
      </label>
    );
  };

  const compareMax = Math.max(sim.baselineRevenue, sim.scenarioRevenue, ...pins.map((pin) => pin.revenue), 1);
  const compareRows: {
    key: string;
    label: string;
    revenue: number;
    profit: number;
    afterExpenses: number | null;
    variant: "baseline" | "scenario" | "pin";
    pinId?: number;
  }[] = [
    {
      key: "base",
      label: "Rythme actuel",
      revenue: sim.baselineRevenue,
      profit: sim.baselineProfit,
      afterExpenses: baselineAfterExpenses,
      variant: "baseline",
    },
    ...pins.map((pin) => ({
      key: String(pin.id),
      label: pin.label,
      revenue: pin.revenue,
      profit: pin.profit,
      afterExpenses: getEstimatedBalanceAfterExpenses(
        pin.profit,
        expenseSummary,
        pin.revenue,
        sim.baselineRevenue,
      ),
      variant: "pin" as const,
      pinId: pin.id,
    })),
    {
      key: "now",
      label: "Scénario en cours",
      revenue: sim.scenarioRevenue,
      profit: sim.scenarioProfit,
      afterExpenses: scenarioAfterExpenses,
      variant: "scenario",
    },
  ];

  const goalRemaining = hasGoal ? goal - sim.scenarioRevenue : 0;
  const goalProgress = hasGoal ? Math.min((sim.scenarioRevenue / goal) * 100, 100) : null;

  return (
    <section className={styles.simulator} aria-labelledby="market-simulator-title">
      <header className={styles.hero}>
        <div className={styles.heroIcon} aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M8 37h32M12 32l8-9 7 5 11-15" />
            <circle cx="12" cy="32" r="2" />
            <circle cx="20" cy="23" r="2" />
            <circle cx="27" cy="28" r="2" />
            <circle cx="38" cy="13" r="2" />
            <path d="M31 13h7v7" />
          </svg>
        </div>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Laboratoire de scénarios · {companyName}</span>
          <h2 id="market-simulator-title">Et si vos ventes évoluaient ?</h2>
          <p>
            Composez une hypothèse, voyez la courbe du mois se redessiner et mesurez l’effet sur votre chiffre
            d’affaires, votre marge et votre objectif.
          </p>
          <button
            type="button"
            className={styles.calculationToggle}
            aria-expanded={showCalculationGuide}
            aria-controls="market-simulator-calculation"
            onClick={() => setShowCalculationGuide((visible) => !visible)}
          >
            {showCalculationGuide ? "Masquer les explications" : "Comment c’est calculé ?"}
          </button>
        </div>
        <span className={styles.simulationBadge}>
          <i aria-hidden="true" />
          Simulation uniquement
        </span>
      </header>

      <CalculationGuide
        currentRevenue={currentRevenue}
        currentOrders={currentOrders}
        params={params}
        sim={sim}
        hidden={!showCalculationGuide}
      />

      {!hasReference ? (
        <div className={styles.emptyState} role="status">
          <strong>Pas encore de référence de vente ce mois-ci</strong>
          <p>
            Dès qu’une vente est confirmée, le simulateur pourra comparer vos hypothèses au rythme réel.
            Aucune donnée ni commande Odoo ne sera modifiée.
          </p>
        </div>
      ) : (
        <>
          <div className={styles.metrics}>
            <article className={styles.metricCard}>
              <span>Déjà réalisé ce mois</span>
              <strong>{formatCurrency(currentRevenue)}</strong>
              <small>
                {currentOrders} vente{plural(currentOrders, "", "s")} confirmée{plural(currentOrders, "", "s")}
              </small>
            </article>
            <article className={styles.metricCard}>
              <span>Projection au rythme actuel</span>
              <strong>{formatCurrency(sim.baselineRevenue)}</strong>
              <small>Sans changement des habitudes observées</small>
            </article>
            <article className={`${styles.metricCard} ${styles.highlightMetric}`}>
              <span>Avec vos hypothèses</span>
              <strong>
                <AnimatedCurrency value={sim.scenarioRevenue} />
              </strong>
              <small className={sim.difference >= 0 ? styles.positive : styles.negative}>
                {formatCurrency(Math.abs(sim.difference))} {sim.difference >= 0 ? "au-dessus" : "en-dessous"} · {formatSignedPercent(sim.differencePercent)}
              </small>
            </article>
            <article className={styles.metricCard}>
              <span>Marge brute estimée</span>
              <strong>
                <AnimatedCurrency value={sim.scenarioProfit} />
              </strong>
              <small className={sim.profitDiff >= 0 ? styles.positive : styles.negative}>
                {formatSignedCurrency(sim.profitDiff)} vs rythme actuel · marge {params.margin} %
              </small>
            </article>
          </div>

          <section className={styles.expensesCard} aria-labelledby="market-shop-expenses-title">
            <div className={styles.expenseHeading}>
              <span className={styles.expenseIcon} aria-hidden="true">{showMonthlyExpenses ? "−" : "+"}</span>
              <div>
                <span className={styles.expenseEyebrow}>
                  Charges mensuelles · {companyName} · {getMonthLabel(monthKey)}
                </span>
                <h3 id="market-shop-expenses-title">Qu’est-ce qu’il reste après les charges ?</h3>
                <p>
                  Séparez les montants déjà payés ou engagés de ceux prévus. Les exemples sont vides : aucune charge n’est inventée.
                  Pour une charge variable prévue, saisissez son montant au rythme actuel des ventes.
                </p>
              </div>
              <button
                type="button"
                className={styles.expenseToggle}
                aria-expanded={showMonthlyExpenses}
                aria-controls="market-shop-expenses-panel"
                onClick={() => setShowMonthlyExpenses((open) => !open)}
              >
                {showMonthlyExpenses ? "Masquer" : "Renseigner les charges"}
              </button>
            </div>

            {showMonthlyExpenses && (
              <div id="market-shop-expenses-panel">
            {loadedExpenseKey === expenseStorageKey ? (
              <div className={styles.expenseLayout}>
              <div className={styles.expenseForm}>
                {monthlyExpenses.map((expense, index) => (
                  <div className={styles.expenseRow} key={expense.id}>
                    <label>
                      <span>Charge {index + 1}</span>
                      <input
                        type="text"
                        value={expense.label}
                        maxLength={100}
                        placeholder="Ex. Loyer"
                        aria-label={`Nom de la charge ${index + 1}`}
                        aria-invalid={!expense.label.trim() && expense.amount.trim() !== ""}
                        onChange={(event) => updateExpense(expense.id, { label: event.target.value })}
                      />
                    </label>
                    <label>
                      <span>Nature</span>
                      <select
                        value={expense.nature}
                        aria-label={`Nature de la charge ${expense.label || index + 1}`}
                        onChange={(event) =>
                          updateExpense(expense.id, { nature: event.target.value as ExpenseNature })
                        }
                      >
                        <option value="fixed">Fixe</option>
                        <option value="variable">Variable</option>
                      </select>
                    </label>
                    <label>
                      <span>État</span>
                      <select
                        value={expense.timing}
                        aria-label={`État de la charge ${expense.label || index + 1}`}
                        onChange={(event) =>
                          updateExpense(expense.id, { timing: event.target.value as ExpenseTiming })
                        }
                      >
                        <option value="incurred">Payée / engagée</option>
                        <option value="forecast">Prévue</option>
                      </select>
                    </label>
                    <label>
                      <span>
                        {expense.timing === "incurred"
                          ? "Déjà payé · FCFA"
                          : expense.nature === "variable"
                            ? "Prévu au rythme actuel · FCFA"
                            : "Prévu · FCFA"}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="1000000000000"
                        step="1"
                        value={expense.amount}
                        placeholder="À renseigner"
                        aria-label={`Montant mensuel pour ${expense.label || `la charge ${index + 1}`}`}
                        aria-invalid={expense.amount.trim() !== "" && (
                          !Number.isFinite(Number(expense.amount)) ||
                          Number(expense.amount) < 0 ||
                          Number(expense.amount) > 1_000_000_000_000
                        )}
                        onChange={(event) => updateExpense(expense.id, { amount: event.target.value })}
                      />
                    </label>
                    <button
                      type="button"
                      className={styles.removeExpense}
                      onClick={() => removeExpense(expense.id)}
                      aria-label={`Supprimer la charge ${expense.label || index + 1}`}
                    >
                      Retirer
                    </button>
                  </div>
                ))}
                <div className={styles.expenseActionRow}>
                  <button
                    type="button"
                    className={styles.addExpense}
                    onClick={addExpense}
                    disabled={monthlyExpenses.length >= 50}
                  >
                    <span aria-hidden="true">+</span> Ajouter une charge
                  </button>
                  <button
                    type="button"
                    className={styles.copyExpenses}
                    onClick={copyPreviousMonthExpenses}
                  >
                    Reprendre les charges de {getMonthLabel(previousMonthKey)}
                  </button>
                </div>
                {expenseActionMessage && (
                  <p className={styles.expenseActionMessage} role="status">{expenseActionMessage}</p>
                )}
              </div>

              <aside className={styles.expenseSummary} aria-live="polite">
                <div className={styles.expenseTotal}>
                  <span>
                    {expenseSummary.complete && baselineExpenses !== null
                      ? "Total de charges au rythme actuel"
                      : "Total des montants valides saisis"}
                  </span>
                  <strong>
                    {formatCurrency(
                      expenseSummary.complete && baselineExpenses !== null
                        ? baselineExpenses
                        : expenseSummary.enteredTotal,
                    )}
                  </strong>
                </div>
                <div className={styles.expenseBreakdown}>
                  <div>
                    <span>Payées / engagées{expenseSummary.complete ? "" : " saisies"}</span>
                    <strong>{formatCurrency(expenseSummary.incurredTotal)}</strong>
                  </div>
                  <div>
                    <span>Fixes prévues{expenseSummary.complete ? "" : " saisies"}</span>
                    <strong>{formatCurrency(expenseSummary.forecastFixedTotal)}</strong>
                  </div>
                  <div>
                    <span>Variables prévues{expenseSummary.complete ? "" : " saisies"} au rythme actuel</span>
                    <strong>{formatCurrency(expenseSummary.forecastVariableTotal)}</strong>
                  </div>
                  {scenarioExpenses !== null && expenseSummary.complete && (
                    <div className={styles.expenseScenarioCosts}>
                      <span>Charges estimées avec le scénario</span>
                      <strong>{formatCurrency(scenarioExpenses)}</strong>
                    </div>
                  )}
                  <small>
                    Seules les charges variables prévues sont ajustées selon le CA; les charges déjà engagées restent fixes.
                  </small>
                </div>
                {expenseSummary.complete && baselineAfterExpenses !== null && scenarioAfterExpenses !== null ? (
                  <div className={styles.expenseBalances}>
                    <div>
                      <span>Reste au rythme actuel</span>
                      <strong className={baselineAfterExpenses >= 0 ? styles.positive : styles.negative}>
                        {formatCurrency(baselineAfterExpenses)}
                      </strong>
                    </div>
                    <div className={styles.expenseScenarioBalance}>
                      <span>Reste avec votre scénario</span>
                      <strong className={scenarioAfterExpenses >= 0 ? styles.positive : styles.negative}>
                        {formatCurrency(scenarioAfterExpenses)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <p className={styles.expenseIncomplete} role={expenseSummary.invalid ? "alert" : "status"}>
                    {expenseSummary.invalid
                      ? "Vérifiez les montants : ils doivent être des nombres positifs ou égaux à zéro."
                      : expenseSummary.complete
                        ? "Le reste après charges n’est pas calculable sans chiffre d’affaires de référence pour ajuster les charges variables."
                        : "Nommez chaque charge et renseignez son montant, ou retirez les lignes qui ne s’appliquent pas, pour calculer le reste estimé."}
                  </p>
                )}
                <div className={styles.breakEvenBox}>
                  <span className={styles.breakEvenEyebrow}>Seuil de rentabilité · estimation</span>
                  {breakEven.status === "available" ? (
                    <>
                      <strong>{formatCurrency(breakEven.revenue)} de CA</strong>
                      {breakEven.orders !== null && (
                        <span>Environ {breakEven.orders} commande{breakEven.orders === 1 ? "" : "s"} au panier moyen projeté</span>
                      )}
                      <small>
                        {sim.scenarioRevenue >= breakEven.revenue
                          ? "Le scénario couvre ce seuil estimé."
                          : "Le scénario reste sous ce seuil estimé."}
                        {" "}Charges variables prévues : {(breakEven.variableCostRate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % du CA de référence.
                      </small>
                    </>
                  ) : breakEven.status === "impossible" ? (
                    <p className={styles.expenseIncomplete}>
                      Avec le taux de marge saisi, les charges variables prévues absorbent la marge : aucun seuil de CA positif n’est calculable.
                    </p>
                  ) : (
                    <p className={styles.expenseIncomplete}>
                      Complétez les charges et la projection de référence pour calculer le seuil.
                    </p>
                  )}
                </div>
                <div className={styles.reliabilityBox}>
                  <div>
                    <span>Fiabilité de la projection</span>
                    <strong>{reliability}</strong>
                  </div>
                  <small>
                    {elapsedDays} jour{plural(elapsedDays, "", "s")} réel{plural(elapsedDays, "", "s")} observé{plural(elapsedDays, "", "s")} dans Odoo; rythme quotidien prolongé. Le taux de marge ({params.margin} %) est une hypothèse saisie, pas une marge calculée à partir des coûts réels.
                  </small>
                  <small>
                    {expenseSummary.complete
                      ? "Toutes les charges listées ont un montant renseigné."
                      : "Les charges sont incomplètes; le reste après charges n’est pas calculé."}
                  </small>
                  <small>
                    Repère limité avant 7 jours observés, intermédiaire de 7 à 13 jours, plus étayé à partir de 14 jours. Ce n’est pas une précision statistique.
                  </small>
                </div>
                <p className={styles.expenseDisclaimer}>
                  Le reste est basé sur la marge brute estimée et les charges renseignées. Il ne comprend pas les charges omises, impôts ou autres coûts inconnus; ce n’est pas un bénéfice net comptable.
                </p>
                {expenseStorageError ? (
                  <p className={styles.expenseStorageError} role="status">{expenseStorageError}</p>
                ) : expenseStorageWritable ? (
                  <p className={styles.expenseSaved}>Charges mémorisées sur cet appareil pour cette société et ce mois.</p>
                ) : null}
                {!expenseStorageError && !expenseStorageWritable && (
                  <p className={styles.expenseStorageError} role="status">
                    Les montants ne sont pas mémorisés; ils resteront visibles jusqu’à la fermeture de cette page.
                  </p>
                )}
                {monthlyExpenses.length > 0 && (
                  <p className={styles.expenseDataNote}>
                    Historique enregistré séparément pour {getMonthLabel(monthKey)}. Les charges reprises du mois précédent sont copiées comme prévisions.
                  </p>
                )}
              </aside>
            </div>
            ) : (
              <p className={styles.expenseIncomplete} role="status">Chargement des charges de cette société…</p>
            )}
            </div>
            )}
          </section>

          <div className={styles.workspace}>
            {/* ───── 01 · Hypothèses ───── */}
            <section className={styles.controlsCard} aria-labelledby="market-scenario-controls-title">
              <div className={styles.sectionHeading}>
                <span className={styles.stepNumber}>01</span>
                <div>
                  <h3 id="market-scenario-controls-title">Composez une hypothèse</h3>
                  <p>Les curseurs agissent seulement sur les jours restants.</p>
                </div>
              </div>

              <div className={styles.presets} aria-label="Scénarios de départ">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    title={preset.hint}
                    className={selectedPreset === preset.id ? styles.presetActive : ""}
                    aria-pressed={selectedPreset === preset.id}
                    disabled={!canAdjust}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.surpriseButton}
                  disabled={!canAdjust}
                  onClick={surprise}
                  title="Tirer un scénario au hasard"
                >
                  ✦ Surprise
                </button>
              </div>

              <div className={styles.controls}>
                {renderControl({
                  id: "scenario-volume",
                  label: "Volume de ventes confirmées",
                  lever: "volume",
                  min: -50,
                  max: 100,
                  format: formatSignedPercent,
                })}
                {renderControl({
                  id: "scenario-basket",
                  label: "Panier moyen",
                  lever: "basket",
                  min: -30,
                  max: 50,
                  format: formatSignedPercent,
                })}
                {renderControl({
                  id: "scenario-discount",
                  label: "Remise moyenne",
                  lever: "discount",
                  min: 0,
                  max: 30,
                  format: (value) => `${value} %`,
                })}
                {renderControl({
                  id: "scenario-start",
                  label: "Début de l’action",
                  lever: "start",
                  min: 0,
                  max: Math.max(remainingDays - 1, 0),
                  format: (value) => (value === 0 ? "Aujourd’hui" : `Dans ${value} j`),
                })}
              </div>

              <details className={styles.advanced}>
                <summary>Réglages avancés</summary>
                <div className={styles.controls}>
                  {renderControl({
                    id: "scenario-elasticity",
                    label: "Ventes attirées par point de remise",
                    lever: "elasticity",
                    min: 0,
                    max: 3,
                    step: 0.5,
                    format: (value) => `+${value.toFixed(1).replace(".", ",")} pt`,
                  })}
                  {renderControl({
                    id: "scenario-margin",
                    label: "Marge brute estimée",
                    lever: "margin",
                    min: 5,
                    max: 60,
                    format: (value) => `${value} %`,
                  })}
                </div>
                <p className={styles.advancedNote}>
                  Avec une sensibilité de +1,5 pt, une remise de 10 % ajoute environ 15 % de ventes. La marge sert au
                  calcul du gain réel : une remise rogne la marge sur chaque vente.
                </p>
              </details>

              <div className={styles.actionsRow}>
                <button
                  type="button"
                  className={styles.resetButton}
                  onClick={() => applyPreset(PRESETS[0])}
                  disabled={!canAdjust}
                >
                  Repartir du rythme actuel
                </button>
                <button
                  type="button"
                  className={styles.pinButton}
                  onClick={pinScenario}
                  disabled={!canAdjust || pins.length >= MAX_PINS}
                  title="Garder ce scénario pour le comparer aux autres"
                >
                  Épingler ce scénario ({pins.length}/{MAX_PINS})
                </button>
              </div>
            </section>

            {/* ───── 02 · Résultats ───── */}
            <section className={styles.resultsCard} aria-labelledby="market-scenario-results-title">
              <div className={styles.sectionHeading}>
                <span className={`${styles.stepNumber} ${styles.resultStep}`}>02</span>
                <div>
                  <h3 id="market-scenario-results-title">Comparez les résultats</h3>
                  <p>
                    {remainingDays > 0
                      ? `${remainingDays} jour${plural(remainingDays, "", "s")} restant${plural(remainingDays, "", "s")} dans le mois · ${elapsedDays} jours observés`
                      : "Le mois est terminé ; les scénarios ne changent plus la projection."}
                  </p>
                </div>
              </div>

              <div className={`${styles.verdict} ${styles[`verdict_${verdict.tone}`]}`} role="status">
                <div className={styles.ambition} aria-label={`Ambition du scénario : ${ambitionLabel}`}>
                  <span className={styles.ambitionBars} aria-hidden="true">
                    {[1, 2, 3, 4].map((level) => (
                      <i key={level} className={level <= ambitionLevel ? styles.ambitionOn : ""} />
                    ))}
                  </span>
                  <small>{ambitionLabel}</small>
                </div>
                <div>
                  <strong>{verdict.title}</strong>
                  <p>{verdict.text}</p>
                </div>
              </div>

              <div className={styles.chart} aria-label="Courbe du chiffre d’affaires cumulé sur le mois">
                <div className={styles.chartLegend}>
                  <span><i className={styles.legendRealized} />Réalisé</span>
                  <span><i className={styles.legendBaseline} />Rythme actuel</span>
                  <span><i className={styles.legendScenario} />Votre scénario</span>
                  <span><i className={styles.legendBand} />Fourchette probable</span>
                  {hasGoal && (
                    <span><i className={styles.goalLegend} />Objectif · {formatCurrency(goal)}</span>
                  )}
                </div>

                <svg
                  className={styles.curve}
                  viewBox={`0 0 ${W} ${H}`}
                  role="img"
                  aria-label={`Au jour ${focusDay} : rythme actuel ${formatCurrency(focusBaseline)}, scénario ${formatCurrency(focusScenario)}`}
                  onPointerMove={handleChartPointer}
                  onPointerDown={handleChartPointer}
                >
                  {gridTicks.map((tick) => (
                    <g key={tick}>
                      <line className={styles.gridLine} x1={PL} x2={W - PR} y1={y(tick)} y2={y(tick)} />
                      <text className={styles.axisText} x={PL - 8} y={y(tick) + 3} textAnchor="end">
                        {compactFormat.format(tick)}
                      </text>
                    </g>
                  ))}

                  <line className={styles.todayLine} x1={x(sim.elapsed)} x2={x(sim.elapsed)} y1={PT} y2={PT + INNER_H} />
                  <text className={styles.axisText} x={x(sim.elapsed)} y={H - 8} textAnchor="middle">Aujourd’hui</text>
                  <text className={styles.axisText} x={PL} y={H - 8} textAnchor="start">Début</text>
                  <text className={styles.axisText} x={W - PR} y={H - 8} textAnchor="end">Fin de mois</text>

                  {hasGoal && (
                    <line className={styles.goalLine} x1={PL} x2={W - PR} y1={y(goal)} y2={y(goal)} />
                  )}

                  {remainingDays > 0 && <polygon className={styles.bandArea} points={pBand} />}
                  <polyline className={styles.baselineLine} points={pBaseline} />
                  <polyline className={styles.scenarioLine} points={pScenario} />
                  <polyline className={styles.realizedLine} points={pRealized} />

                  {sim.start > 0 && (
                    <circle className={styles.startDot} cx={x(sim.elapsed + sim.start)} cy={y(scenarioPoints[1].value)} r="4" />
                  )}

                  {scenarioGoalDay !== null && scenarioGoalDay > 0 && hasGoal && (
                    <g>
                      <circle className={styles.goalDot} cx={x(scenarioGoalDay)} cy={y(goal)} r="5" />
                      <text className={styles.goalText} x={x(scenarioGoalDay)} y={y(goal) - 10} textAnchor="middle">
                        J{scenarioGoalDay}
                      </text>
                    </g>
                  )}

                  <line className={styles.focusLine} x1={x(focusDay)} x2={x(focusDay)} y1={PT} y2={PT + INNER_H} />
                  <circle className={styles.focusBaseline} cx={x(focusDay)} cy={y(focusBaseline)} r="4" />
                  <circle className={styles.focusScenario} cx={x(focusDay)} cy={y(focusScenario)} r="5" />
                </svg>

                <label className={styles.scrubber} htmlFor="scenario-scrub">
                  <span>Explorer le mois</span>
                  <input
                    id="scenario-scrub"
                    type="range"
                    min={1}
                    max={sim.total}
                    step={1}
                    value={focusDay}
                    aria-valuetext={`Jour ${focusDay}`}
                    onChange={(event) => setScrub(Number(event.target.value))}
                  />
                </label>

                <div className={styles.scrubReadout} aria-live="polite">
                  <span className={styles.scrubDay}>Jour {focusDay}</span>
                  <span>Rythme actuel <strong>{formatCurrency(focusBaseline)}</strong></span>
                  <span>Scénario <strong>{formatCurrency(focusScenario)}</strong></span>
                  <span className={focusScenario - focusBaseline >= 0 ? styles.positive : styles.negative}>
                    {formatSignedCurrency(focusScenario - focusBaseline)}
                  </span>
                </div>

                <div className={styles.strip} role="group" aria-label="Calendrier du mois">
                  {Array.from({ length: sim.total }, (_, index) => index + 1).map((day) => {
                    const state = dayState(day);
                    const isGoal = scenarioGoalDay === day;
                    const className = [
                      styles.cell,
                      state === "past" ? styles.cellPast : state === "wait" ? styles.cellWait : styles.cellLive,
                      isGoal ? styles.cellGoal : "",
                      day === focusDay ? styles.cellFocus : "",
                    ].join(" ");
                    return (
                      <button
                        key={day}
                        type="button"
                        className={className}
                        aria-label={`Jour ${day} : ${state === "past" ? "déjà passé" : state === "wait" ? "avant le lancement" : "action en cours"}${isGoal ? ", objectif atteint" : ""}`}
                        onClick={() => setScrub(day)}
                      />
                    );
                  })}
                </div>
                <div className={styles.stripLegend}>
                  <span><i className={styles.cellPast} />Passé</span>
                  <span><i className={styles.cellWait} />Avant le lancement</span>
                  <span><i className={styles.cellLive} />Action en cours</span>
                </div>
              </div>

              <p className={styles.rangeLine}>
                Fourchette probable en fin de mois : <strong>{formatCurrency(sim.low)}</strong> à{" "}
                <strong>{formatCurrency(sim.high)}</strong> (± {Math.round(sim.uncertainty * 100)} %). Plus l’hypothèse
                est forte, plus l’incertitude est large.
              </p>

              {hasGoal && (
                <div className={styles.goalCard}>
                  <div className={styles.goalCopy}>
                    <strong>
                      {sim.scenarioRevenue >= goal ? "Objectif atteint dans ce scénario" : "Écart restant jusqu’à l’objectif"}
                    </strong>
                    <span>
                      {sim.scenarioRevenue >= goal
                        ? `${Math.round((sim.scenarioRevenue / goal) * 100)} % de l’objectif projeté`
                        : `${formatCurrency(goalRemaining)} à couvrir`}
                    </span>
                  </div>
                  <div
                    className={styles.goalProgress}
                    role="progressbar"
                    aria-label="Progression de la projection vers l’objectif"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(goalProgress ?? 0)}
                  >
                    <i style={{ width: `${goalProgress ?? 0}%` }} />
                  </div>
                  <small>
                    {scenarioGoalDay === 0
                      ? "L’objectif est déjà atteint ce mois-ci."
                      : scenarioGoalDay !== null
                        ? `Objectif franchi vers le jour ${scenarioGoalDay}${
                            baselineGoalDay === null
                              ? ", alors qu’il resterait hors de portée au rythme actuel."
                              : baselineGoalDay > scenarioGoalDay
                                ? ` (jour ${baselineGoalDay} au rythme actuel).`
                                : "."
                          }`
                        : "Objectif hors de portée ce mois-ci dans ce scénario."}
                  </small>

                  {goalPlan && (
                    <div className={styles.plan}>
                      <span className={styles.planTitle}>Pour atteindre l’objectif, il faudrait…</span>
                      <div className={styles.planOptions}>
                        <button
                          type="button"
                          disabled={!canAdjust || goalPlan.volume === null || goalPlan.volume > 100}
                          onClick={() => goalPlan.volume !== null && updateValue("volume", clamp(goalPlan.volume, -50, 100))}
                        >
                          <small>Via le volume</small>
                          <strong>
                            {goalPlan.volume === null || goalPlan.volume > 100
                              ? "Hors limites"
                              : formatSignedPercent(goalPlan.volume)}
                          </strong>
                          <em>{goalPlan.volume !== null && goalPlan.volume <= 100 ? "Appliquer" : "au-delà de +100 %"}</em>
                        </button>
                        <button
                          type="button"
                          disabled={!canAdjust || goalPlan.basket === null || goalPlan.basket > 50}
                          onClick={() => goalPlan.basket !== null && updateValue("basket", clamp(goalPlan.basket, -30, 50))}
                        >
                          <small>Via le panier moyen</small>
                          <strong>
                            {goalPlan.basket === null || goalPlan.basket > 50
                              ? "Hors limites"
                              : formatSignedPercent(goalPlan.basket)}
                          </strong>
                          <em>{goalPlan.basket !== null && goalPlan.basket <= 50 ? "Appliquer" : "au-delà de +50 %"}</em>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ───── 03 · Aller plus loin ───── */}
          <div className={styles.insights}>
            <section className={styles.resultsCard} aria-labelledby="market-scenario-levers-title">
              <div className={styles.sectionHeading}>
                <span className={`${styles.stepNumber} ${styles.resultStep}`}>03</span>
                <div>
                  <h3 id="market-scenario-levers-title">Quel levier pèse le plus ?</h3>
                  <p>Effet d’un petit coup de pouce supplémentaire sur le chiffre d’affaires de fin de mois.</p>
                </div>
              </div>

              <ul className={styles.levers}>
                {sensitivity.rows.map((row) => {
                  const width = (Math.abs(row.revenue) / sensitivity.maxAbs) * 50;
                  const positive = row.revenue >= 0;
                  return (
                    <li key={row.label}>
                      <div className={styles.leverLabel}>
                        <span>{row.label}</span>
                        <strong className={positive ? styles.positive : styles.negative}>
                          {formatSignedCurrency(row.revenue)}
                        </strong>
                      </div>
                      <div className={styles.leverTrack} aria-hidden="true">
                        <i className={styles.leverAxis} />
                        <span
                          className={positive ? styles.leverPositive : styles.leverNegative}
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <small>Marge : {formatSignedCurrency(row.profit)}</small>
                    </li>
                  );
                })}
              </ul>

              {marginRecovery && (
                <p className={styles.breakEven}>
                  {marginRecovery.impossible
                    ? "La remise dépasse votre marge estimée : chaque vente supplémentaire fait perdre de l’argent."
                    : `Pour retrouver la même marge brute qu’au rythme actuel, il faudrait environ ${formatSignedPercent(marginRecovery.needed)} de ventes (vous êtes à ${formatSignedPercent(Math.round(sim.volumeBoost))}).`}
                </p>
              )}
            </section>

            <section className={styles.resultsCard} aria-labelledby="market-scenario-compare-title">
              <div className={styles.sectionHeading}>
                <span className={`${styles.stepNumber} ${styles.resultStep}`}>04</span>
                <div>
                  <h3 id="market-scenario-compare-title">Comparez vos scénarios</h3>
                  <p>Épinglez jusqu’à {MAX_PINS} hypothèses, puis changez de curseurs pour les mettre côte à côte.</p>
                </div>
              </div>

              <ul className={styles.compare}>
                {compareRows.map((row) => (
                  <li key={row.key}>
                    <div className={styles.projectionLabel}>
                      <span>{row.label}</span>
                      <strong>{formatCurrency(row.revenue)}</strong>
                    </div>
                    <div className={styles.barTrack}>
                      <span
                        className={`${styles.bar} ${row.variant === "baseline" ? styles.baselineBar : styles.scenarioBar}`}
                        style={{
                          width: `${Math.min((row.revenue / compareMax) * 100, 100)}%`,
                          opacity: row.variant === "pin" ? 0.7 : 1,
                        }}
                      />
                    </div>
                    <div className={styles.compareMeta}>
                      <div className={styles.compareFinancials}>
                        <small>Marge brute estimée : {formatCurrency(row.profit)}</small>
                        <small>
                          Reste après charges :{" "}
                          {row.afterExpenses === null
                            ? "non calculable"
                            : formatCurrency(row.afterExpenses)}
                        </small>
                      </div>
                      {row.pinId !== undefined && (
                        <button type="button" onClick={() => removePin(row.pinId as number)} aria-label={`Retirer ${row.label}`}>
                          Retirer
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>

              <div className={styles.readout}>
                <span className={styles.readoutIcon} aria-hidden="true">i</span>
                <div>
                  <strong>Comment lire cette simulation</strong>
                  <p>
                    Le réalisé est conservé. Volume, panier, remise et date de lancement modifient seulement
                    l’estimation des ventes à venir.
                    {params.discount > 0
                      ? " La remise réduit le CA simulé ; elle ne garantit un volume supplémentaire que si vous réglez la sensibilité des clients."
                      : " Les stocks et les réactions des clients ne sont pas inclus."}{" "}
                    La marge repose sur l’estimation que vous réglez.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
      <CommercialSimulationPanel companyId={companyId} />
    </section>
  );
}