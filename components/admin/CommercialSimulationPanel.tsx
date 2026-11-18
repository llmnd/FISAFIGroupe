"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  isSimulationSnapshot,
  type CommercialInputs,
  type CommercialScenarioResult,
  type Metric,
  type SimulationSnapshot,
} from "@/lib/marketSimulation/contracts";
import { simulateCommercial } from "@/lib/marketSimulation/engine";
import styles from "./MarketScenarioSimulator.module.css";

/* ───────────────────────── Types & données ───────────────────────── */

type ActionId = keyof Omit<CommercialInputs, "scenarioRangePercent">;
type FieldKind = "slider" | "count" | "money" | "product";

type FieldDef = {
  key: string;
  short: string; // nom court pour la liste « à compléter »
  label: string;
  hint?: string;
  kind: FieldKind;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  actual?: "customers" | "orders"; // valeur observable dans Odoo
};

type LeverDef = {
  id: ActionId;
  label: string;
  tagline: string;
  explain: string;
  audienceIdeas: string[];
  fields: FieldDef[];
};

const ACTION_IDS: ActionId[] = ["acquisition", "marketing", "retention", "promotion", "upsell"];

const INITIAL_INPUTS: CommercialInputs = {
  acquisition: {
    enabled: false,
    audience: "",
    disjointConfirmed: false,
    prospects: null,
    conversionPercent: null,
    ordersPerCustomer: null,
    actionCost: null,
  },
  marketing: {
    enabled: false,
    audience: "",
    disjointConfirmed: false,
    budget: null,
    costPerLead: null,
    conversionPercent: null,
    ordersPerCustomer: null,
  },
  retention: {
    enabled: false,
    audience: "",
    disjointConfirmed: false,
    eligibleCustomers: null,
    returnRateLiftPercent: null,
    ordersPerReturningCustomer: null,
    actionCost: null,
  },
  promotion: {
    enabled: false,
    audience: "",
    disjointConfirmed: false,
    eligibleOrders: null,
    incrementalOrders: null,
    discountPercent: null,
    actionCost: null,
  },
  upsell: {
    enabled: false,
    audience: "",
    disjointConfirmed: false,
    eligibleOrders: null,
    uptakePercent: null,
    unitsPerAcceptedOrder: null,
    productId: null,
    actionCost: null,
  },
  scenarioRangePercent: 20,
};

const COST_HINT = "Laissez vide si vous ne le connaissez pas : le gain restera « inconnu ».";

const LEVERS: LeverDef[] = [
  {
    id: "acquisition",
    label: "Prospection",
    tagline: "Aller chercher de nouveaux clients",
    explain: "Vous contactez des personnes qui n’ont jamais acheté chez vous (porte-à-porte, appels, partenariats).",
    audienceIdeas: ["Nouveaux clients du quartier", "Entreprises voisines"],
    fields: [
      { key: "prospects", short: "prospects", label: "Personnes réellement contactables", kind: "count", step: 10 },
      { key: "conversionPercent", short: "conversion", label: "Part qui devient cliente", hint: "Hypothèse à ajuster", kind: "slider", min: 0, max: 30, step: 0.5, unit: " %" },
      { key: "ordersPerCustomer", short: "commandes/client", label: "Commandes par nouveau client", hint: "Hypothèse à ajuster", kind: "slider", min: 0.5, max: 6, step: 0.1 },
      { key: "actionCost", short: "coût", label: "Coût direct de la prospection", hint: COST_HINT, kind: "money", step: 1000, unit: "FCFA" },
    ],
  },
  {
    id: "marketing",
    label: "Publicité",
    tagline: "Payer pour être vu",
    explain: "Vous dépensez un budget (réseaux sociaux, affiches, radio) pour faire venir de nouveaux clients.",
    audienceIdeas: ["Abonnés réseaux sociaux", "Habitants du quartier"],
    fields: [
      { key: "budget", short: "budget", label: "Budget publicitaire", kind: "money", step: 5000, unit: "FCFA" },
      { key: "costPerLead", short: "coût/prospect", label: "Coût estimé par prospect", kind: "money", step: 100, unit: "FCFA" },
      { key: "conversionPercent", short: "conversion", label: "Part des prospects qui achètent", hint: "Hypothèse à ajuster", kind: "slider", min: 0, max: 30, step: 0.5, unit: " %" },
      { key: "ordersPerCustomer", short: "commandes/client", label: "Commandes par nouveau client", hint: "Hypothèse à ajuster", kind: "slider", min: 0.5, max: 6, step: 0.1 },
    ],
  },
  {
    id: "retention",
    label: "Fidélisation",
    tagline: "Faire revenir vos clients",
    explain: "Vous incitez vos clients existants à racheter (carte de fidélité, message, petit cadeau).",
    audienceIdeas: ["Clients des 3 derniers mois", "Clients fidèles"],
    fields: [
      { key: "eligibleCustomers", short: "clients visés", label: "Clients concernés", kind: "count", step: 5, actual: "customers" },
      { key: "returnRateLiftPercent", short: "hausse du retour", label: "Clients en plus qui reviennent", hint: "Hypothèse à ajuster", kind: "slider", min: 0, max: 50, step: 1, unit: " %" },
      { key: "ordersPerReturningCustomer", short: "commandes/client", label: "Commandes par client revenu", hint: "Hypothèse à ajuster", kind: "slider", min: 0.5, max: 6, step: 0.1 },
      { key: "actionCost", short: "coût", label: "Coût direct de la fidélisation", hint: COST_HINT, kind: "money", step: 1000, unit: "FCFA" },
    ],
  },
  {
    id: "promotion",
    label: "Promotion",
    tagline: "Une remise pour déclencher l’achat",
    explain: "Vous baissez un prix pour attirer des commandes en plus. Chaque commande remisée rapporte moins.",
    audienceIdeas: ["Tous les clients", "Clients du week-end"],
    fields: [
      { key: "eligibleOrders", short: "commandes visées", label: "Commandes concernées par la remise", kind: "count", step: 5, actual: "orders" },
      { key: "incrementalOrders", short: "commandes en plus", label: "Commandes en plus attendues", hint: "Hypothèse à ajuster", kind: "slider", min: 0, step: 1 },
      { key: "discountPercent", short: "remise", label: "Remise accordée", kind: "slider", min: 0, max: 60, step: 1, unit: " %" },
      { key: "actionCost", short: "coût", label: "Coût direct de la promotion", hint: COST_HINT, kind: "money", step: 1000, unit: "FCFA" },
    ],
  },
  {
    id: "upsell",
    label: "Vente en plus",
    tagline: "Proposer un produit de plus au panier",
    explain: "À chaque commande, vous proposez un produit complémentaire (« Et avec ça ? »).",
    audienceIdeas: ["Toutes les commandes", "Commandes de livraison"],
    fields: [
      { key: "productId", short: "produit", label: "Produit à proposer", hint: "Produits réellement vendus ces 12 derniers mois", kind: "product" },
      { key: "eligibleOrders", short: "commandes visées", label: "Commandes concernées", kind: "count", step: 5, actual: "orders" },
      { key: "uptakePercent", short: "taux d’ajout", label: "Part des clients qui acceptent", hint: "Hypothèse à ajuster", kind: "slider", min: 0, max: 60, step: 1, unit: " %" },
      { key: "unitsPerAcceptedOrder", short: "unités", label: "Unités ajoutées par commande", hint: "Hypothèse à ajuster", kind: "slider", min: 0.5, max: 5, step: 0.1 },
      { key: "actionCost", short: "coût", label: "Coût direct de l’action", hint: COST_HINT, kind: "money", step: 1000, unit: "FCFA" },
    ],
  },
];

const QUICK_STARTS: { label: string; ids: ActionId[] }[] = [
  { label: "Faire revenir mes clients", ids: ["retention"] },
  { label: "Lancer une promo", ids: ["promotion"] },
  { label: "Vendre un produit en plus", ids: ["upsell"] },
  { label: "Attirer de nouveaux clients", ids: ["acquisition", "marketing"] },
  { label: "Tout combiner", ids: ACTION_IDS },
];

// Hypothèses de départ : posées seulement sur les champs encore vides, toujours modifiables.
const DEFAULTS: Record<ActionId, (snap: SimulationSnapshot | null) => Record<string, number | null>> = {
  acquisition: () => ({ conversionPercent: 5, ordersPerCustomer: 1 }),
  marketing: () => ({ conversionPercent: 3, ordersPerCustomer: 1 }),
  retention: (snap) => ({
    returnRateLiftPercent: 10,
    ordersPerReturningCustomer: 1,
    eligibleCustomers: snap && snap.actuals.identifiedCustomers > 0 ? snap.actuals.identifiedCustomers : null,
  }),
  promotion: (snap) => {
    const orders = snap && snap.actuals.confirmedOrders > 0 ? snap.actuals.confirmedOrders : null;
    return {
      discountPercent: 10,
      eligibleOrders: orders,
      incrementalOrders: orders ? Math.max(1, Math.round(orders * 0.1)) : null,
    };
  },
  upsell: (snap) => ({
    uptakePercent: 15,
    unitsPerAcceptedOrder: 1,
    eligibleOrders: snap && snap.actuals.confirmedOrders > 0 ? snap.actuals.confirmedOrders : null,
  }),
};

/* ───────────────────────── Utilitaires ───────────────────────── */

const nf0 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });
const compact = new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 });

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

function formatCurrency(value: number): string {
  return `${nf0.format(Math.round(value))} FCFA`;
}

function formatSigned(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : ""}${nf0.format(Math.abs(rounded))} FCFA`;
}

function known(metric: Metric): number | null {
  return metric.status === "unknown" ? null : metric.value;
}

function describeMetric(
  metric: Metric,
  format: "currency" | "number" | "percent",
): { value: string; basis: string } {
  if (metric.status === "unknown") {
    const reason = metric.reason === "not_authorized"
      ? "Non autorisé"
      : metric.reason === "incomplete"
        ? "Données incomplètes"
        : metric.reason === "unidentified"
          ? "Audience non vérifiée"
          : "Donnée non disponible";
    return { value: reason, basis: "Le simulateur ne remplace pas une donnée inconnue par zéro." };
  }
  const suffix = metric.status === "estimated" ? " · estimé" : " · observé";
  const value = format === "currency"
    ? formatCurrency(metric.value)
    : format === "percent"
      ? `${nf1.format(metric.value)} %`
      : nf1.format(metric.value);
  return {
    value: `${value}${suffix}`,
    basis: metric.status === "estimated" ? metric.basis : `${metric.source} · ${metric.observedAt}`,
  };
}

function getErrorMessage(payload: unknown): string | null {
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return payload.error;
  }
  return null;
}

function withDefaults<T extends object>(id: ActionId, current: T, snap: SimulationSnapshot | null): T {
  const next: Record<string, unknown> = { ...(current as Record<string, unknown>) };
  for (const [key, value] of Object.entries(DEFAULTS[id](snap))) {
    if ((next[key] === null || next[key] === undefined) && value !== null) next[key] = value;
  }
  return next as T;
}

function useCountUp(target: number, duration = 500): number {
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
      const next = from + (target - from) * (1 - Math.pow(1 - progress, 3));
      current.current = next;
      setValue(next);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

function AnimatedSigned({ value }: { value: number }) {
  return <>{formatSigned(useCountUp(value))}</>;
}

/* ───────────────────────── Petits composants ───────────────────────── */

function LeverIcon({ id }: { id: ActionId }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {id === "acquisition" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
        </>
      )}
      {id === "marketing" && (
        <>
          <path d="M4 10v4h3l8 4V6L7 10H4z" />
          <path d="M18 9a4 4 0 010 6" />
        </>
      )}
      {id === "retention" && (
        <>
          <path d="M4 12a8 8 0 0114-5l2 2" />
          <path d="M20 4v5h-5" />
          <path d="M20 12a8 8 0 01-14 5l-2-2" />
          <path d="M4 20v-5h5" />
        </>
      )}
      {id === "promotion" && (
        <>
          <path d="M3 12V4h8l10 10-8 8L3 12z" />
          <circle cx="7.5" cy="8.5" r="1.2" />
        </>
      )}
      {id === "upsell" && (
        <>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M12 7.5v9M7.5 12h9" />
        </>
      )}
    </svg>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg className={styles.cmRing} viewBox="0 0 24 24" aria-hidden="true">
      <circle className={styles.cmRingTrack} cx="12" cy="12" r={radius} />
      <circle
        className={styles.cmRingValue}
        cx="12"
        cy="12"
        r={radius}
        strokeDasharray={`${circumference * clamp(value, 0, 1)} ${circumference}`}
        transform="rotate(-90 12 12)"
      />
    </svg>
  );
}

function FieldControl({
  def,
  value,
  max,
  observed,
  products,
  onChange,
}: {
  def: FieldDef;
  value: number | null;
  max: number;
  observed: number | null;
  products: SimulationSnapshot["products"];
  onChange: (value: number | null) => void;
}) {
  const id = useId();
  const parse = (raw: string) => (raw === "" ? null : Number(raw));

  const observedHint =
    def.actual && observed !== null ? (
      value === observed ? (
        <span className={styles.cmTag}>Valeur Odoo</span>
      ) : (
        <button type="button" className={styles.cmLink} onClick={() => onChange(observed)}>
          Reprendre la valeur Odoo ({nf0.format(observed)})
        </button>
      )
    ) : null;

  if (def.kind === "product") {
    return (
      <div className={styles.cmField}>
        <div className={styles.cmFieldHead}>
          <label htmlFor={id}>{def.label}</label>
        </div>
        <select
          id={id}
          className={styles.cmInput}
          value={value ?? ""}
          onChange={(event) => onChange(event.currentTarget.value ? Number(event.currentTarget.value) : null)}
        >
          <option value="">Choisir un produit</option>
          {products.map((product) => (
            <option key={product.productId} value={product.productId}>
              {product.name} · stock {product.currentAvailableStock.status === "unknown" ? "inconnu" : product.currentAvailableStock.value}
              {" "}· prix {product.currentSalePrice.status === "unknown" ? "inconnu" : formatCurrency(product.currentSalePrice.value)}
            </option>
          ))}
        </select>
        {def.hint && <small className={styles.cmHint}>{def.hint}</small>}
      </div>
    );
  }

  if (def.kind === "slider") {
    const min = def.min ?? 0;
    return (
      <div className={styles.cmField}>
        <div className={styles.cmFieldHead}>
          <label htmlFor={id}>{def.label}</label>
          <span className={styles.cmNumberWrap}>
            <input
              type="number"
              className={styles.cmNumber}
              aria-label={`${def.label}, valeur exacte`}
              min={min}
              step={def.step ?? 1}
              value={value ?? ""}
              placeholder="—"
              onChange={(event) => onChange(parse(event.currentTarget.value))}
            />
            {def.unit && <i>{def.unit.trim()}</i>}
          </span>
        </div>
        <input
          id={id}
          type="range"
          className={styles.cmSlider}
          min={min}
          max={Math.max(max, min + 1)}
          step={def.step ?? 1}
          value={value === null ? min : clamp(value, min, Math.max(max, min + 1))}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
        <div className={styles.cmFieldFoot}>
          {def.hint && <small className={styles.cmHint}>{def.hint}</small>}
          {observedHint}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cmField}>
      <div className={styles.cmFieldHead}>
        <label htmlFor={id}>{def.label}</label>
      </div>
      <span className={styles.cmNumberWrapWide}>
        <input
          id={id}
          type="number"
          className={styles.cmInput}
          min={0}
          step={def.step ?? 1}
          value={value ?? ""}
          placeholder="Non renseigné"
          onChange={(event) => onChange(parse(event.currentTarget.value))}
        />
        {def.unit && <i>{def.unit}</i>}
      </span>
      <div className={styles.cmFieldFoot}>
        {def.hint && <small className={styles.cmHint}>{def.hint}</small>}
        {observedHint}
      </div>
    </div>
  );
}

/* ── Cascade : de la vente au gain ── */

function Waterfall({
  revenue,
  margin,
  costs,
  contribution,
}: {
  revenue: number | null;
  margin: number | null;
  costs: number | null;
  contribution: number | null;
}) {
  const net = contribution ?? (margin !== null && costs !== null ? margin - costs : null);
  const bars: { key: string; label: string; from: number; to: number | null; tone: string; text: string }[] = [
    { key: "rev", label: "Ventes", from: 0, to: revenue, tone: styles.cmBarLilac, text: revenue === null ? "?" : compact.format(revenue) },
    { key: "margin", label: "Marge", from: 0, to: margin, tone: styles.cmBarTeal, text: margin === null ? "?" : compact.format(margin) },
    {
      key: "costs",
      label: "Coûts",
      from: margin ?? 0,
      to: margin !== null && costs !== null ? margin - costs : null,
      tone: styles.cmBarRed,
      text: costs === null ? "?" : `−${compact.format(costs)}`,
    },
    { key: "net", label: "Gain net", from: 0, to: net, tone: net !== null && net < 0 ? styles.cmBarRed : styles.cmBarGreen, text: net === null ? "?" : compact.format(net) },
  ];

  const values = bars.flatMap((bar) => (bar.to === null ? [] : [bar.from, bar.to]));
  const max = Math.max(1, ...values, 0);
  const min = Math.min(0, ...values);
  const top = 22;
  const height = 110;
  const y = (v: number) => top + ((max - v) / (max - min)) * height;
  const colW = 52;
  const gap = (320 - colW * 4) / 5;

  return (
    <svg className={styles.cmChart} viewBox="0 0 320 172" role="img" aria-label="Cascade : ventes, marge, coûts et gain net">
      <line className={styles.cmZero} x1="8" x2="312" y1={y(0)} y2={y(0)} />
      {bars.map((bar, index) => {
        const x = gap + index * (colW + gap);
        if (bar.to === null) {
          return (
            <g key={bar.key}>
              <rect className={styles.cmUnknown} x={x} y={y(0) - 34} width={colW} height={34} rx="5" />
              <text className={styles.cmChartValue} x={x + colW / 2} y={y(0) - 14} textAnchor="middle">?</text>
              <text className={styles.cmChartLabel} x={x + colW / 2} y={166} textAnchor="middle">{bar.label}</text>
            </g>
          );
        }
        const y1 = y(Math.max(bar.from, bar.to));
        const y2 = y(Math.min(bar.from, bar.to));
        return (
          <g key={bar.key}>
            <rect className={bar.tone} x={x} y={y1} width={colW} height={Math.max(y2 - y1, 2)} rx="5" />
            <text className={styles.cmChartValue} x={x + colW / 2} y={y1 - 6} textAnchor="middle">{bar.text}</text>
            <text className={styles.cmChartLabel} x={x + colW / 2} y={166} textAnchor="middle">{bar.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Jauge prudent / central / optimiste ── */

function RangeGauge({ prudent, central, optimistic }: { prudent: number | null; central: number | null; optimistic: number | null }) {
  const points = [
    { key: "prudent", label: "Prudent", value: prudent },
    { key: "central", label: "Central", value: central },
    { key: "optimistic", label: "Optimiste", value: optimistic },
  ];
  const present = points.flatMap((point) => (point.value === null ? [] : [point.value]));
  if (present.length === 0) return null;
  const min = Math.min(0, ...present);
  const max = Math.max(1, ...present);
  const x = (v: number) => 24 + ((v - min) / (max - min)) * 272;
  const low = Math.min(...present);
  const high = Math.max(...present);

  return (
    <svg className={styles.cmChart} viewBox="0 0 320 84" role="img" aria-label="Fourchette de contribution : prudent, central, optimiste">
      <rect className={styles.cmGaugeTrack} x="24" y="36" width="272" height="8" rx="4" />
      <rect className={styles.cmGaugeBand} x={x(low)} y="36" width={Math.max(x(high) - x(low), 2)} height="8" rx="4" />
      {min < 0 && <line className={styles.cmZero} x1={x(0)} x2={x(0)} y1="26" y2="54" />}
      {points.map((point, index) =>
        point.value === null ? null : (
          <g key={point.key}>
            <circle
              className={point.key === "central" ? styles.cmDotCentral : styles.cmDot}
              cx={x(point.value)}
              cy="40"
              r={point.key === "central" ? 7 : 5}
            />
            <text className={styles.cmChartValue} x={x(point.value)} y={index % 2 === 0 ? 22 : 66} textAnchor="middle">
              {compact.format(point.value)}
            </text>
            <text className={styles.cmChartLabel} x={x(point.value)} y={index % 2 === 0 ? 12 : 78} textAnchor="middle">
              {point.label}
            </text>
          </g>
        ),
      )}
    </svg>
  );
}

function MetricLine({ label, metric, format = "currency" }: { label: string; metric: Metric; format?: "currency" | "number" | "percent" }) {
  const formatted = describeMetric(metric, format);
  return (
    <div className={styles.cmMetric}>
      <span>{label}</span>
      <strong>{formatted.value}</strong>
      <small>{formatted.basis}</small>
    </div>
  );
}

function ActionResults({ result }: { result: CommercialScenarioResult["actions"][number] }) {
  return (
    <article className={styles.cmActionResult}>
      <h4>{result.label}</h4>
      <div className={styles.cmMetricGrid}>
        <MetricLine label="CA supplémentaire potentiel" metric={result.potentialRevenue} />
        <MetricLine label="CA compatible avec le stock (action isolée)" metric={result.stockConstrainedRevenue} />
        <MetricLine label="Commandes supplémentaires" metric={result.estimatedOrders} format="number" />
        <MetricLine label="Clients supplémentaires" metric={result.estimatedCustomers} format="number" />
        <MetricLine label="Unités supplémentaires" metric={result.estimatedUnits} format="number" />
        <MetricLine label="Marge brute potentielle" metric={result.grossMargin} />
        <MetricLine label="Coût de l’action" metric={result.actionCost} />
        <MetricLine label="Contribution après coût direct" metric={result.contribution} />
      </div>
      <ul className={styles.cmNotes}>
        {result.explanation.map((note) => <li key={note}>{note}</li>)}
      </ul>
    </article>
  );
}

/* ───────────────────────── Panneau ───────────────────────── */

export default function CommercialSimulationPanel({ companyId }: { companyId?: number }) {
  const [snapshot, setSnapshot] = useState<SimulationSnapshot | null>(null);
  const [inputs, setInputs] = useState<CommercialInputs>(INITIAL_INPUTS);
  const [selected, setSelected] = useState<ActionId>("retention");
  const [loading, setLoading] = useState(Boolean(companyId));
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!companyId) {
      setSnapshot(null);
      setLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    setSnapshot(null);
    setLoading(true);
    setError("");
    void (async () => {
      try {
        const response = await fetch(`/api/admin/market-simulation?companyId=${companyId}`, {
          signal: controller.signal,
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          throw new Error(getErrorMessage(payload) ?? "Impossible de charger les données du simulateur.");
        }
        if (!isSimulationSnapshot(payload)) {
          throw new Error("Le serveur a renvoyé un instantané de simulation invalide.");
        }
        setSnapshot(payload);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setError(requestError instanceof Error ? requestError.message : "Impossible de charger les données du simulateur.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [companyId, reload]);

  const enabledIds = ACTION_IDS.filter((id) => inputs[id].enabled);
  const enabledCount = enabledIds.length;

  // Une action seule n’a aucun autre public avec lequel se chevaucher : la confirmation n’est utile qu’à partir de deux.
  const effectiveInputs = useMemo<CommercialInputs>(() => {
    if (enabledCount > 1) return inputs;
    const next: Record<string, unknown> = { ...inputs };
    for (const id of ACTION_IDS) next[id] = { ...inputs[id], disjointConfirmed: true };
    return next as unknown as CommercialInputs;
  }, [inputs, enabledCount]);

  const result = useMemo(
    () => (snapshot ? simulateCommercial(snapshot, effectiveInputs) : null),
    [snapshot, effectiveInputs],
  );

  /* ── Actions ── */
  const updateField = (id: ActionId, key: string, value: number | string | boolean | null) => {
    setInputs((previous) => ({ ...previous, [id]: { ...previous[id], [key]: value } }) as unknown as CommercialInputs);
  };

  const toggleAction = (id: ActionId, enabled: boolean) => {
    setInputs((previous) => {
      const current = { ...previous[id], enabled };
      return { ...previous, [id]: enabled ? withDefaults(id, current, snapshot) : current } as unknown as CommercialInputs;
    });
    if (enabled) setSelected(id);
  };

  const quickStart = (ids: ActionId[]) => {
    setInputs((previous) => {
      const next: Record<string, unknown> = { ...previous };
      for (const id of ACTION_IDS) {
        next[id] = ids.includes(id)
          ? withDefaults(id, { ...previous[id], enabled: true }, snapshot)
          : { ...previous[id], enabled: false };
      }
      return next as unknown as CommercialInputs;
    });
    setSelected(ids[0]);
  };

  const resetAll = () => setInputs(INITIAL_INPUTS);

  /* ── Lecture des états ── */
  const valueOf = (id: ActionId, key: string): number | null => {
    const raw = (inputs[id] as unknown as Record<string, unknown>)[key];
    return typeof raw === "number" ? raw : null;
  };

  const missingFor = (def: LeverDef): string[] => {
    const missing = def.fields.filter((field) => valueOf(def.id, field.key) === null).map((field) => field.short);
    if (!inputs[def.id].audience.trim()) missing.push("audience");
    if (enabledCount > 1 && !inputs[def.id].disjointConfirmed) missing.push("chevauchement");
    return missing;
  };

  const progressFor = (def: LeverDef): number => {
    const total = def.fields.length + 1 + (enabledCount > 1 ? 1 : 0);
    return 1 - missingFor(def).length / total;
  };

  const maxFor = (def: LeverDef, field: FieldDef): number => {
    if (field.max !== undefined) return field.max;
    if (def.id === "promotion" && field.key === "incrementalOrders") {
      return Math.max(10, valueOf("promotion", "eligibleOrders") ?? snapshot?.actuals.confirmedOrders ?? 10);
    }
    return 100;
  };

  const observedFor = (field: FieldDef): number | null => {
    if (!snapshot || !field.actual) return null;
    const value = field.actual === "customers" ? snapshot.actuals.identifiedCustomers : snapshot.actuals.confirmedOrders;
    return value > 0 ? value : null;
  };

  const actionResult = (id: ActionId) => result?.actions.find((action) => (action.id as string) === id) ?? null;

  const selectedDef = LEVERS.find((lever) => lever.id === selected) ?? LEVERS[0];
  const selectedInputs = inputs[selectedDef.id];

  /* ── Valeurs combinées ── */
  const combined = result?.combined ?? null;
  const revenue = combined ? known(combined.incrementalRevenue) : null;
  const stockRevenue = combined ? known(combined.stockConstrainedRevenue) : null;
  const margin = combined ? known(combined.grossMargin) : null;
  const costs = combined ? known(combined.actionCosts) : null;
  const contribution = combined ? known(combined.contribution) : null;
  const roi = combined ? known(combined.roiPercent) : null;
  const stockShare = revenue !== null && revenue > 0 && stockRevenue !== null ? stockRevenue / revenue : null;

  const missingList = LEVERS.filter((lever) => inputs[lever.id].enabled)
    .map((lever) => ({ lever, missing: missingFor(lever) }))
    .filter((entry) => entry.missing.length > 0);

  const leverBars = LEVERS.filter((lever) => inputs[lever.id].enabled).map((lever) => {
    const action = actionResult(lever.id);
    return {
      lever,
      potential: action ? known(action.potentialRevenue) : null,
      stock: action ? known(action.stockConstrainedRevenue) : null,
    };
  });
  const leverMax = Math.max(1, ...leverBars.map((bar) => bar.potential ?? 0));

  const coverage = snapshot ? Math.round(snapshot.quality.customerCoverage * 100) : 0;

  return (
    <section className={styles.controlsCard} aria-labelledby="market-commercial-simulation-title">
      <div className={styles.sectionHeading}>
        <span className={`${styles.stepNumber} ${styles.resultStep}`}>05</span>
        <div>
          <h3 id="market-commercial-simulation-title">Votre plan d’action, chiffré avec Odoo</h3>
          <p>
            Allumez les leviers que vous voulez tester. Les chiffres réels viennent d’Odoo ; les pourcentages sont des
            hypothèses que vous pouvez changer à tout moment.
          </p>
        </div>
      </div>

      <div className={styles.cmStatus} role="status">
        {loading
          ? "Chargement des agrégats Odoo de la société sélectionnée…"
          : snapshot
            ? `${snapshot.companyName} · instantané du ${new Date(snapshot.generatedAt).toLocaleString("fr-FR")}`
            : companyId
              ? error
              : "Sélectionnez une société FiSAFi pour charger les données du simulateur."}
      </div>

      {error && (
        <div className={styles.cmError} role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setReload((value) => value + 1)}>Réessayer</button>
        </div>
      )}

      {loading && (
        <div className={styles.cmSkeleton} aria-hidden="true">
          <i /><i /><i /><i /><i />
        </div>
      )}

      {!loading && snapshot && (
        <>
          {/* ── Bandeau de contexte ── */}
          <div className={styles.cmTopbar}>
            <div className={styles.cmFacts}>
              <span>CA confirmé{snapshot.quality.currentMonthComplete ? "" : " (mois partiel)"}<strong>{formatCurrency(snapshot.actuals.confirmedRevenue)}</strong></span>
              <span>Commandes<strong>{snapshot.actuals.confirmedOrders}</strong></span>
              <span>Clients identifiés<strong>{snapshot.actuals.identifiedCustomers}</strong></span>
            </div>
            <div className={styles.cmReliability} title="Part des commandes rattachées à un client identifié">
              <svg viewBox="0 0 36 36" aria-hidden="true">
                <circle className={styles.cmRingTrack} cx="18" cy="18" r="14" />
                <circle
                  className={styles.cmRingValue}
                  cx="18"
                  cy="18"
                  r="14"
                  strokeDasharray={`${(coverage / 100) * 2 * Math.PI * 14} ${2 * Math.PI * 14}`}
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <span>
                <strong>{coverage} %</strong>
                <small>Fiabilité des données clients</small>
              </span>
            </div>
          </div>

          {/* ── Départs rapides ── */}
          <div className={styles.cmQuick}>
            <span>Démarrer avec :</span>
            {QUICK_STARTS.map((start) => (
              <button key={start.label} type="button" onClick={() => quickStart(start.ids)}>
                {start.label}
              </button>
            ))}
            {enabledCount > 0 && (
              <button type="button" className={styles.cmQuickReset} onClick={resetAll}>
                Tout éteindre
              </button>
            )}
          </div>

          <div className={styles.cmLayout}>
            {/* ── Colonne gauche : plateau + éditeur ── */}
            <div className={styles.cmLeft}>
              <div className={styles.cmTiles} role="group" aria-label="Leviers commerciaux">
                {LEVERS.map((lever) => {
                  const on = inputs[lever.id].enabled;
                  const action = actionResult(lever.id);
                  const potential = action ? known(action.potentialRevenue) : null;
                  const missing = on ? missingFor(lever) : [];
                  return (
                    <div
                      key={lever.id}
                      className={`${styles.cmTile} ${on ? styles.cmTileOn : ""} ${selected === lever.id ? styles.cmTileSelected : ""}`}
                    >
                      <button
                        type="button"
                        className={styles.cmTileMain}
                        aria-pressed={selected === lever.id}
                        onClick={() => setSelected(lever.id)}
                      >
                        <span className={styles.cmTileIcon}><LeverIcon id={lever.id} /></span>
                        <span className={styles.cmTileText}>
                          <strong>{lever.label}</strong>
                          <small>
                            {!on
                              ? lever.tagline
                              : potential !== null
                                ? `${formatSigned(potential)} de ventes`
                                : `À compléter : ${missing.slice(0, 2).join(", ")}${missing.length > 2 ? "…" : ""}`}
                          </small>
                        </span>
                        {on && <ProgressRing value={progressFor(lever)} />}
                      </button>
                      <label className={styles.cmSwitch}>
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={(event) => toggleAction(lever.id, event.currentTarget.checked)}
                          aria-label={`Activer ${lever.label}`}
                        />
                        <span aria-hidden="true" />
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className={styles.cmEditor}>
                <div className={styles.cmEditorHead}>
                  <span className={styles.cmTileIcon}><LeverIcon id={selectedDef.id} /></span>
                  <div>
                    <h4>{selectedDef.label}</h4>
                    <p>{selectedDef.explain}</p>
                  </div>
                </div>

                {!selectedInputs.enabled ? (
                  <div className={styles.cmEditorOff}>
                    <p>Ce levier est éteint : il ne change pas la simulation.</p>
                    <button type="button" className={styles.cmCta} onClick={() => toggleAction(selectedDef.id, true)}>
                      Activer {selectedDef.label.toLowerCase()}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className={styles.cmAudience}>
                      <label htmlFor={`audience-${selectedDef.id}`}>Qui visez-vous ?</label>
                      <input
                        id={`audience-${selectedDef.id}`}
                        type="text"
                        className={styles.cmInput}
                        value={selectedInputs.audience}
                        onChange={(event) => updateField(selectedDef.id, "audience", event.currentTarget.value)}
                        placeholder="Nommer l’audience"
                      />
                      <div className={styles.cmIdeas}>
                        {selectedDef.audienceIdeas.map((idea) => (
                          <button key={idea} type="button" onClick={() => updateField(selectedDef.id, "audience", idea)}>
                            {idea}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className={styles.cmFields}>
                      {selectedDef.fields.map((field) => (
                        <FieldControl
                          key={`${selectedDef.id}-${field.key}`}
                          def={field}
                          value={valueOf(selectedDef.id, field.key)}
                          max={maxFor(selectedDef, field)}
                          observed={observedFor(field)}
                          products={snapshot.products}
                          onChange={(value) => updateField(selectedDef.id, field.key, value)}
                        />
                      ))}
                    </div>

                    {enabledCount > 1 ? (
                      <label className={styles.cmConfirm}>
                        <input
                          type="checkbox"
                          checked={selectedInputs.disjointConfirmed}
                          onChange={(event) => updateField(selectedDef.id, "disjointConfirmed", event.currentTarget.checked)}
                        />
                        Cette audience ne chevauche pas celles des autres leviers activés.
                      </label>
                    ) : (
                      <p className={styles.cmHint}>Un seul levier actif : aucun chevauchement d’audience à vérifier.</p>
                    )}
                  </>
                )}
              </div>

              <div className={styles.cmRangeBox}>
                <label htmlFor="commercial-range">
                  <span>Écart entre scénarios prudent et optimiste</span>
                  <strong>± {inputs.scenarioRangePercent ?? 0} %</strong>
                </label>
                <input
                  id="commercial-range"
                  type="range"
                  className={styles.cmSlider}
                  min={5}
                  max={60}
                  step={5}
                  value={inputs.scenarioRangePercent ?? 20}
                  onChange={(event) => setInputs((previous) => ({ ...previous, scenarioRangePercent: Number(event.currentTarget.value) }))}
                />
                <small className={styles.cmHint}>
                  Une fourchette que vous choisissez autour de la marge brute, pas un intervalle statistique.
                </small>
              </div>
            </div>

            {/* ── Colonne droite : résultat en direct ── */}
            <aside className={styles.cmRight} aria-label="Résultat en direct" aria-live="polite">
              {enabledCount === 0 ? (
                <div className={styles.cmEmpty}>
                  <svg viewBox="0 0 160 80" aria-hidden="true">
                    <rect x="16" y="40" width="22" height="30" rx="4" />
                    <rect x="48" y="26" width="22" height="44" rx="4" />
                    <rect x="80" y="14" width="22" height="56" rx="4" />
                    <rect x="112" y="30" width="22" height="40" rx="4" />
                  </svg>
                  <strong>Rien à projeter pour l’instant</strong>
                  <p>Allumez un levier ou choisissez un départ rapide : la cascade du gain se dessinera ici.</p>
                </div>
              ) : (
                <>
                  <div
                    className={`${styles.cmHero} ${
                      contribution === null ? "" : contribution > 0 ? styles.cmHeroGood : styles.cmHeroBad
                    }`}
                  >
                    <span>Gain net estimé</span>
                    <strong>
                      {contribution === null ? "À compléter" : <AnimatedSigned value={contribution} />}
                    </strong>
                    <div className={styles.cmBadges}>
                      {contribution !== null && (
                        <em className={contribution > 0 ? styles.cmBadgeGood : styles.cmBadgeBad}>
                          {contribution > 0 ? "Rentable" : "À perte"}
                        </em>
                      )}
                      {roi !== null && <em className={styles.cmBadgeNeutral}>ROI {nf1.format(roi)} %</em>}
                      <em className={styles.cmBadgeNeutral}>
                        {enabledCount} levier{enabledCount > 1 ? "s" : ""}
                      </em>
                    </div>
                  </div>

                  {combined?.status === "blocked" && (
                    <p className={styles.cmWarning} role="alert">{combined.reason}</p>
                  )}

                  {missingList.length > 0 && (
                    <div className={styles.cmMissing}>
                      <span>Pour affiner, complétez :</span>
                      {missingList.map(({ lever, missing }) => (
                        <button key={lever.id} type="button" onClick={() => setSelected(lever.id)}>
                          {lever.label} · {missing.length}
                        </button>
                      ))}
                    </div>
                  )}

                  <h4 className={styles.cmChartTitle}>De la vente au gain</h4>
                  <Waterfall revenue={revenue} margin={margin} costs={costs} contribution={contribution} />

                  {leverBars.length > 0 && (
                    <>
                      <h4 className={styles.cmChartTitle}>Qui fait vendre ?</h4>
                      <ul className={styles.cmLeverBars}>
                        {leverBars.map(({ lever, potential, stock }) => (
                          <li key={lever.id}>
                            <div>
                              <span>{lever.label}</span>
                              <strong>{potential === null ? "inconnu" : formatSigned(potential)}</strong>
                            </div>
                            <div className={styles.cmTrack}>
                              {potential !== null && (
                                <>
                                  <i className={styles.cmTrackPotential} style={{ width: `${(potential / leverMax) * 100}%` }} />
                                  {stock !== null && (
                                    <i className={styles.cmTrackStock} style={{ width: `${(Math.min(stock, potential) / leverMax) * 100}%` }} />
                                  )}
                                </>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                      <p className={styles.cmLegend}>
                        <i className={styles.cmTrackPotential} /> Ventes potentielles
                        <i className={styles.cmTrackStock} /> Tenables avec le stock
                      </p>
                    </>
                  )}

                  {stockShare !== null && stockShare < 0.999 && (
                    <div className={styles.cmStockBanner}>
                      <strong>Le stock freine l’élan</strong>
                      <p>
                        Seulement {Math.round(stockShare * 100)} % des ventes potentielles sont couvertes par le stock
                        disponible ({formatCurrency(stockRevenue ?? 0)} sur {formatCurrency(revenue ?? 0)}).
                      </p>
                    </div>
                  )}

                  {result && (
                    <>
                      <h4 className={styles.cmChartTitle}>Fourchette de gain</h4>
                      <RangeGauge
                        prudent={known(result.range.prudent)}
                        central={known(result.range.central)}
                        optimistic={known(result.range.optimistic)}
                      />
                    </>
                  )}
                </>
              )}
            </aside>
          </div>

          {/* ── Détail complet du calcul ── */}
          {result && enabledCount > 0 && (
            <details className={styles.cmDetails}>
              <summary>Voir le détail du calcul, ligne par ligne</summary>

              <h4>Impact combiné</h4>
              <div className={styles.cmMetricGrid}>
                <MetricLine label="CA supplémentaire potentiel" metric={result.combined.incrementalRevenue} />
                <MetricLine label="CA combiné après stock partagé" metric={result.combined.stockConstrainedRevenue} />
                <MetricLine label="Commandes supplémentaires" metric={result.combined.incrementalOrders} format="number" />
                <MetricLine label="Clients supplémentaires" metric={result.combined.incrementalCustomers} format="number" />
                <MetricLine label="Unités supplémentaires" metric={result.combined.incrementalUnits} format="number" />
                <MetricLine label="Marge brute supplémentaire" metric={result.combined.grossMargin} />
                <MetricLine label="Coûts directs des actions" metric={result.combined.actionCosts} />
                <MetricLine label="Contribution supplémentaire" metric={result.combined.contribution} />
                <MetricLine label="ROI" metric={result.combined.roiPercent} format="percent" />
              </div>

              <h4>Résultats par action</h4>
              <div className={styles.cmResults}>
                {result.actions.map((action) => <ActionResults key={action.id} result={action} />)}
              </div>

              <h4>Scénarios de contribution</h4>
              <div className={styles.cmMetricGrid}>
                <MetricLine label="Prudent" metric={result.range.prudent} />
                <MetricLine label="Central" metric={result.range.central} />
                <MetricLine label="Optimiste" metric={result.range.optimistic} />
              </div>
              <p className={styles.cmFine}>{result.range.note}</p>
            </details>
          )}

          <p className={styles.cmFine}>
            Une valeur de coût ou de stock inconnue reste inconnue. Les coûts catalogue et stocks affichés par Odoo sont
            actuels, jamais présentés comme historiques. Pour la vente en plus, le CA utilise le prix moyen réellement
            vendu sur 12 mois ; le prix catalogue courant est affiché séparément.
          </p>

          <ul className={styles.cmNotes}>
            {snapshot.quality.notes.map((note) => <li key={note}>{note}</li>)}
            <li>
              Historique : {snapshot.history.monthly.length} mois demandés ;{" "}
              {snapshot.history.complete ? "lecture complète" : "lecture plafonnée, donc partielle"}.
            </li>
          </ul>
        </>
      )}
    </section>
  );
}