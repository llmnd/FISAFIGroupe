"use client";

import { useMemo, useState } from "react";
import styles from "./MarketScenarioSimulator.module.css";

type PresetId = "current" | "volume" | "basket" | "promotion" | "custom";
type ScenarioPreset = {
  id: Exclude<PresetId, "custom">;
  label: string;
  volume: number;
  basket: number;
  discount: number;
};

const PRESETS: ScenarioPreset[] = [
  { id: "current", label: "Rythme actuel", volume: 0, basket: 0, discount: 0 },
  { id: "volume", label: "Plus de ventes", volume: 15, basket: 0, discount: 0 },
  { id: "basket", label: "Panier moyen", volume: 0, basket: 10, discount: 0 },
  { id: "promotion", label: "Test promotion", volume: 20, basket: 0, discount: 5 },
];

interface MarketScenarioSimulatorProps {
  companyName: string;
  currentRevenue: number;
  currentOrders: number;
  elapsedDays: number;
  remainingDays: number;
  revenueGoal: number | null;
}

function formatCurrency(value: number): string {
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Math.round(value))} FCFA`;
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)} %`;
}

export default function MarketScenarioSimulator({
  companyName,
  currentRevenue,
  currentOrders,
  elapsedDays,
  remainingDays,
  revenueGoal,
}: MarketScenarioSimulatorProps) {
  const [volumeChange, setVolumeChange] = useState(15);
  const [basketChange, setBasketChange] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [selectedPreset, setSelectedPreset] = useState<PresetId>("volume");

  const simulation = useMemo(() => {
    const safeElapsedDays = Math.max(elapsedDays, 1);
    const safeRemainingDays = Math.max(remainingDays, 0);
    const baselineRemainingRevenue = (currentRevenue / safeElapsedDays) * safeRemainingDays;
    const baselineProjectedRevenue = currentRevenue + baselineRemainingRevenue;
    const baselineRemainingOrders = (currentOrders / safeElapsedDays) * safeRemainingDays;
    const volumeMultiplier = 1 + volumeChange / 100;
    const basketMultiplier = 1 + basketChange / 100;
    const netBasketMultiplier = basketMultiplier * (1 - discount / 100);
    const scenarioRemainingRevenue =
      baselineRemainingRevenue * volumeMultiplier * netBasketMultiplier;
    const scenarioProjectedRevenue = currentRevenue + scenarioRemainingRevenue;
    const scenarioProjectedOrders = currentOrders + baselineRemainingOrders * volumeMultiplier;
    const difference = scenarioProjectedRevenue - baselineProjectedRevenue;
    const differencePercent = baselineProjectedRevenue > 0
      ? (difference / baselineProjectedRevenue) * 100
      : 0;
    const averageBasket = currentOrders > 0 ? currentRevenue / currentOrders : 0;
    const scenarioBasket = averageBasket * netBasketMultiplier;
    const additionalOrdersToGoal =
      revenueGoal !== null && revenueGoal > currentRevenue && scenarioBasket > 0
        ? Math.ceil((revenueGoal - currentRevenue) / scenarioBasket)
        : null;
    const additionalOrdersToOffsetDiscount =
      discount > 0 && averageBasket > 0 && safeRemainingDays > 0
        ? Math.max(
            0,
            Math.ceil(
              baselineRemainingRevenue / scenarioBasket -
              baselineRemainingOrders * volumeMultiplier,
            ),
          )
        : null;

    return {
      baselineProjectedRevenue,
      baselineRemainingOrders,
      scenarioProjectedRevenue,
      scenarioProjectedOrders,
      difference,
      differencePercent,
      additionalOrdersToGoal,
      additionalOrdersToOffsetDiscount,
    };
  }, [
    basketChange,
    currentOrders,
    currentRevenue,
    discount,
    elapsedDays,
    remainingDays,
    revenueGoal,
    volumeChange,
  ]);

  const hasReference = currentRevenue > 0 && currentOrders > 0;
  const canAdjustScenario = remainingDays > 0;
  const goalScale = Math.max(
    simulation.baselineProjectedRevenue,
    simulation.scenarioProjectedRevenue,
    revenueGoal ?? 0,
    1,
  ) * 1.12;
  const goalProgress = revenueGoal && revenueGoal > 0
    ? Math.min((simulation.scenarioProjectedRevenue / revenueGoal) * 100, 100)
    : null;

  const applyPreset = (preset: ScenarioPreset) => {
    setVolumeChange(preset.volume);
    setBasketChange(preset.basket);
    setDiscount(preset.discount);
    setSelectedPreset(preset.id);
  };

  const updateValue = (key: "volume" | "basket" | "discount", value: number) => {
    if (key === "volume") setVolumeChange(value);
    if (key === "basket") setBasketChange(value);
    if (key === "discount") setDiscount(value);
    setSelectedPreset("custom");
  };

  const renderControl = ({
    id,
    label,
    value,
    min,
    max,
    key,
    suffix,
  }: {
    id: string;
    label: string;
    value: number;
    min: number;
    max: number;
    key: "volume" | "basket" | "discount";
    suffix: string;
  }) => {
    const formatControlValue = (amount: number) =>
      key === "discount" ? `${amount} %` : formatSignedPercent(amount);

    return (
      <label className={styles.control} htmlFor={id}>
        <span className={styles.controlHeading}>
          <span>{label}</span>
          <strong>{formatControlValue(value)}{suffix}</strong>
        </span>
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step="1"
          value={value}
          disabled={!canAdjustScenario}
          onChange={(event) => updateValue(key, Number(event.target.value))}
        />
        <span className={styles.rangeLabels}>
          <span>{formatControlValue(min)}{suffix}</span>
          <span>{formatControlValue(max)}{suffix}</span>
        </span>
      </label>
    );
  };

  const renderProjectionBar = (
    label: string,
    amount: number,
    variant: "baseline" | "scenario",
  ) => (
    <div className={styles.projectionRow}>
      <div className={styles.projectionLabel}>
        <span>{label}</span>
        <strong>{formatCurrency(amount)}</strong>
      </div>
      <div
        className={styles.barTrack}
        role="img"
        aria-label={`${label} : ${formatCurrency(amount)}${revenueGoal ? `, objectif ${formatCurrency(revenueGoal)}` : ""}`}
      >
        <span
          className={`${styles.bar} ${variant === "scenario" ? styles.scenarioBar : styles.baselineBar}`}
          style={{ width: `${Math.min((amount / goalScale) * 100, 100)}%` }}
        />
        {revenueGoal !== null && revenueGoal > 0 && (
          <span
            className={styles.goalMarker}
            style={{ left: `${Math.min((revenueGoal / goalScale) * 100, 100)}%` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );

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
          <p>Testez plusieurs hypothèses et mesurez leur effet estimé sur le chiffre d’affaires de fin de mois.</p>
        </div>
        <span className={styles.simulationBadge}>
          <i aria-hidden="true" />
          Simulation uniquement
        </span>
      </header>

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
              <small>{currentOrders} vente{currentOrders === 1 ? "" : "s"} confirmée{currentOrders === 1 ? "" : "s"}</small>
            </article>
            <article className={styles.metricCard}>
              <span>Projection au rythme actuel</span>
              <strong>{formatCurrency(simulation.baselineProjectedRevenue)}</strong>
              <small>Sans changement des habitudes observées</small>
            </article>
            <article className={`${styles.metricCard} ${styles.highlightMetric}`}>
              <span>Avec vos hypothèses</span>
              <strong>{formatCurrency(simulation.scenarioProjectedRevenue)}</strong>
              <small className={simulation.difference >= 0 ? styles.positive : styles.negative}>
                {formatCurrency(Math.abs(simulation.difference))} {simulation.difference >= 0 ? "au-dessus" : "en-dessous"} · {formatSignedPercent(simulation.differencePercent)}
              </small>
            </article>
          </div>

          <div className={styles.workspace}>
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
                    className={selectedPreset === preset.id ? styles.presetActive : ""}
                    aria-pressed={selectedPreset === preset.id}
                    disabled={!canAdjustScenario}
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className={styles.controls}>
                {renderControl({
                  id: "scenario-volume",
                  label: "Volume de ventes confirmées",
                  value: volumeChange,
                  min: -50,
                  max: 100,
                  key: "volume",
                  suffix: "",
                })}
                {renderControl({
                  id: "scenario-basket",
                  label: "Panier moyen",
                  value: basketChange,
                  min: -30,
                  max: 50,
                  key: "basket",
                  suffix: "",
                })}
                {renderControl({
                  id: "scenario-discount",
                  label: "Remise moyenne",
                  value: discount,
                  min: 0,
                  max: 30,
                  key: "discount",
                  suffix: "",
                })}
              </div>

              <button
                type="button"
                className={styles.resetButton}
                onClick={() => applyPreset(PRESETS[0])}
                disabled={!canAdjustScenario}
              >
                Repartir du rythme actuel
              </button>
            </section>

            <section className={styles.resultsCard} aria-labelledby="market-scenario-results-title">
              <div className={styles.sectionHeading}>
                <span className={`${styles.stepNumber} ${styles.resultStep}`}>02</span>
                <div>
                  <h3 id="market-scenario-results-title">Comparez les résultats</h3>
                  <p>
                    {remainingDays > 0
                      ? `${remainingDays} jour${remainingDays === 1 ? "" : "s"} restant${remainingDays === 1 ? "" : "s"} dans le mois · ${elapsedDays} jours observés`
                      : "Le mois est terminé ; les scénarios ne changent plus la projection."}
                  </p>
                </div>
              </div>

              <div className={styles.chart} aria-label="Comparaison des projections de chiffre d’affaires">
                {renderProjectionBar("Rythme actuel", simulation.baselineProjectedRevenue, "baseline")}
                {renderProjectionBar("Votre scénario", simulation.scenarioProjectedRevenue, "scenario")}
                {revenueGoal !== null && revenueGoal > 0 && (
                  <div className={styles.chartLegend}>
                    <span><i className={styles.goalLegend} />Objectif mensuel · {formatCurrency(revenueGoal)}</span>
                  </div>
                )}
              </div>

              {revenueGoal !== null && revenueGoal > 0 && (
                <div className={styles.goalCard}>
                  <div className={styles.goalCopy}>
                    <strong>
                      {simulation.scenarioProjectedRevenue >= revenueGoal
                        ? "Objectif atteint dans ce scénario"
                        : "Écart restant jusqu’à l’objectif"}
                    </strong>
                    <span>
                      {simulation.scenarioProjectedRevenue >= revenueGoal
                        ? `${Math.round((simulation.scenarioProjectedRevenue / revenueGoal) * 100)} % de l’objectif projeté`
                        : `${formatCurrency(revenueGoal - simulation.scenarioProjectedRevenue)} à couvrir`}
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
                  {simulation.additionalOrdersToGoal !== null && (
                    <small>
                      Il faudrait environ {simulation.additionalOrdersToGoal} vente{simulation.additionalOrdersToGoal === 1 ? "" : "s"} restante{simulation.additionalOrdersToGoal === 1 ? "" : "s"} au panier simulé pour couvrir l’objectif.
                    </small>
                  )}
                </div>
              )}

              <div className={styles.readout}>
                <span className={styles.readoutIcon} aria-hidden="true">i</span>
                <div>
                  <strong>Comment lire cette simulation</strong>
                  <p>
                    Le réalisé est conservé. Volume, panier et remise modifient seulement l’estimation des ventes à venir.
                    {discount > 0
                      ? " La remise réduit le CA simulé ; elle ne garantit pas un volume de ventes supplémentaire."
                      : " Les coûts, marges, stocks et réactions des clients ne sont pas inclus."}
                  </p>
                </div>
              </div>

              {simulation.additionalOrdersToOffsetDiscount !== null && (
                <p className={styles.breakEven}>
                  Avec cette remise, il faudrait environ {simulation.additionalOrdersToOffsetDiscount} vente{simulation.additionalOrdersToOffsetDiscount === 1 ? "" : "s"} supplémentaire{simulation.additionalOrdersToOffsetDiscount === 1 ? "" : "s"} par rapport au rythme actuel pour compenser son effet sur le CA restant.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
