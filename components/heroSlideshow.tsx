"use client";

import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import "@/styles/heroSlideshow.css";

/* ─────────────────────────────────────────────
   Types & constantes
   ───────────────────────────────────────────── */
type SlidePalette = {
  accent: string;
  accentRgb: string;
  cardBg: string;
  ghostBg1: string;
  ghostBg2: string;
  inkLight: string;
  inkDark: string;
  lineColor: string;
};

const PALETTES: SlidePalette[] = [
  {
    accent: "#7C6AF5", accentRgb: "124,106,245",
    cardBg: "#F7F5FF",
    ghostBg1: "#EAE6FA", ghostBg2: "#D9D3F0",
    inkLight: "#A49DE4", inkDark: "#2A2060",
    lineColor: "rgba(124,106,245,0.13)",
  },
  {
    accent: "#3B82F6", accentRgb: "59,130,246",
    cardBg: "#F0F6FF",
    ghostBg1: "#DBEAFE", ghostBg2: "#BFDBFE",
    inkLight: "#93B5F5", inkDark: "#1E3A6E",
    lineColor: "rgba(59,130,246,0.12)",
  },
  {
    accent: "#D97706", accentRgb: "217,119,6",
    cardBg: "#FFFCF3",
    ghostBg1: "#FEF3C7", ghostBg2: "#FDE68A",
    inkLight: "#E0B96A", inkDark: "#451A03",
    lineColor: "rgba(217,119,6,0.12)",
  },
  {
    accent: "#059669", accentRgb: "5,150,105",
    cardBg: "#F0FDF9",
    ghostBg1: "#D1FAE5", ghostBg2: "#A7F3D0",
    inkLight: "#6ECFAA", inkDark: "#064E3B",
    lineColor: "rgba(5,150,105,0.12)",
  },
  {
    accent: "#F05A1A", accentRgb: "240,90,26",
    cardBg: "#FFF8F5",
    ghostBg1: "#FFE8DC", ghostBg2: "#FFD5C2",
    inkLight: "#F0A07A", inkDark: "#4A1800",
    lineColor: "rgba(240,90,26,0.12)",
  },
  {
    accent: "#C026B0", accentRgb: "192,38,176",
    cardBg: "#FDF4FE",
    ghostBg1: "#F5D0FE", ghostBg2: "#EAADF4",
    inkLight: "#D88AE8", inkDark: "#4A0063",
    lineColor: "rgba(192,38,176,0.12)",
  },
];

interface Slide {
  src?: string;
  alt: string;
  eyebrow: string;
  desc: string;
  visual?: CodeVisual;
}

type CodeVisual =
  | "cyber"
  | "fiber"
  | "network"
  | "consulting"
  | "transformation"
  | "support"
  | "installation"
  | "cloud"
  | "classroom"
  | "elearning"
  | "hybrid"
  | "certification";

const DEFAULT_SLIDES: Slide[] = [
  {
    visual: "cyber",
    alt: "FiSAFi – cybersécurité",
    eyebrow: "Sécurité des systèmes",
    desc: "Audit et mesures de protection pour les systèmes et les données.",
  },
  {
    visual: "network",
    alt: "FiSAFi – infrastructure",
    eyebrow: "Infrastructures réseau",
    desc: "Conception et déploiement d’architectures réseau selon les contraintes du site.",
  },
  {
    visual: "consulting",
    alt: "FiSAFi – conseil",
    eyebrow: "Études & conseil",
    desc: "Cadrage technique et accompagnement de projets numériques.",
  },
  {
    visual: "transformation",
    alt: "FiSAFi – transformation",
    eyebrow: "Évolution des systèmes",
    desc: "Faire évoluer les outils et les infrastructures déjà en place.",
  },
  {
    visual: "support",
    alt: "FiSAFi – services managés",
    eyebrow: "Maintenance & support",
    desc: "Maintenance des équipements et accompagnement des équipes.",
  },
  {
    visual: "installation",
    alt: "FiSAFi – installation réseau",
    eyebrow: "Installation réseau",
    desc: "Des choix techniques liés au site, au matériel et aux usages.",
  },
  {
    visual: "fiber",
    alt: "FiSAFi – fibre",
    eyebrow: "Fibre optique",
    desc: "Études, déploiement aérien ou souterrain et suivi des travaux.",
  },
];

const SERVICES_SLIDES: Slide[] = [
  {
    visual: "network",
    alt: "Services – réseaux",
    eyebrow: "Réseaux & Télécommunications",
    desc: "Architecture, déploiement et supervision de vos infrastructures réseau.",
  },
  {
    visual: "cloud",
    alt: "Services – infrastructure",
    eyebrow: "Infrastructure IT & Virtualisation",
    desc: "Optimisez vos ressources grâce à la virtualisation et aux solutions cloud hybrides.",
  },
  {
    visual: "cyber",
    alt: "Services – cybersécurité",
    eyebrow: "Cybersécurité & Protection",
    desc: "Audits, SOC managé et solutions de protection pour sécuriser vos actifs numériques.",
  },
  {
    visual: "consulting",
    alt: "Services – conseil",
    eyebrow: "Conseil & Accompagnement",
    desc: "Nos experts vous guident à chaque étape de votre stratégie IT.",
  },
];

const TRAINING_SLIDES: Slide[] = [
  {
    visual: "classroom",
    alt: "Formation – présentielle",
    eyebrow: "Sessions Présentielles",
    desc: "Des formations animées par des experts certifiés pour une montée en compétences rapide.",
  },
  {
    visual: "elearning",
    alt: "Formation – e-learning",
    eyebrow: "Parcours en ligne",
    desc: "Accédez à nos modules e-learning à votre rythme, depuis n'importe où dans le monde.",
  },
  {
    visual: "hybrid",
    alt: "Formation – hybride",
    eyebrow: "Mode Hybride",
    desc: "Combinez présentiel et distanciel pour une flexibilité maximale sans compromis sur la qualité.",
  },
  {
    visual: "certification",
    alt: "Formation – certifications",
    eyebrow: "Préparation aux certifications",
    desc: "Programmes intensifs alignés sur les certifications officielles des grands éditeurs.",
  },
];

function hexRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function isTechnicalVisual(
  visual?: CodeVisual
): visual is Exclude<CodeVisual, "cyber" | "fiber"> {
  return visual !== undefined && visual !== "cyber" && visual !== "fiber";
}

function HighTechArtwork() {
  return (
    <div className="hs-code-art" aria-hidden="true">
      <svg
        className="hs-code-art__graphic"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <linearGradient id="cyber-shield-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#132e49" />
            <stop offset="1" stopColor="#091522" />
          </linearGradient>
          <linearGradient id="cyber-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#37d7ff" stopOpacity="0.08" />
            <stop offset="0.5" stopColor="#37d7ff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#8878ff" stopOpacity="0.12" />
          </linearGradient>
          <linearGradient id="cyber-scan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#37d7ff" stopOpacity="0" />
            <stop offset="0.5" stopColor="#37d7ff" stopOpacity="0.22" />
            <stop offset="1" stopColor="#37d7ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="hs-code-art__radar" fill="none" stroke="#51dfff">
          <circle cx="600" cy="340" r="225" strokeOpacity=".08" />
          <circle cx="600" cy="340" r="190" strokeOpacity=".12" strokeDasharray="2 9" />
          <circle cx="600" cy="340" r="154" strokeOpacity=".12" strokeDasharray="64 18 3 18" />
          <path d="M600 104v34m0 404v34M364 340h34m404 0h34" strokeOpacity=".48" strokeWidth="2" />
          <path d="m433 173 24 24m286 286 24 24m0-334-24 24m-286 286-24 24" strokeOpacity=".28" />
        </g>

        <g className="hs-code-art__circuits" fill="none" stroke="url(#cyber-line)" strokeWidth="2">
          <path d="M0 180h190l58 58h132l60 60h105" />
          <path d="M0 520h208l74-74h90l68-68h92" />
          <path d="M1200 150h-176l-58 58H850l-57 57h-72" />
          <path d="M1200 536h-201l-76-76h-95l-66-66h-47" />
          <path d="M180 0v116l64 64v68" />
          <path d="M1020 0v108l-54 54v69" />
          <path d="M150 700v-90l78-78v-62" />
          <path d="M1050 700v-88l-72-72v-62" />
        </g>

        <g className="hs-code-art__nodes" fill="#62e6ff">
          <circle cx="190" cy="180" r="5" />
          <circle cx="380" cy="296" r="5" />
          <circle cx="208" cy="520" r="5" />
          <circle cx="372" cy="446" r="5" />
          <circle cx="1024" cy="150" r="5" />
          <circle cx="850" cy="265" r="5" />
          <circle cx="999" cy="536" r="5" />
          <circle cx="828" cy="460" r="5" />
          <circle cx="244" cy="180" r="3" />
          <circle cx="966" cy="162" r="3" />
        </g>

        <g className="hs-code-art__telemetry" fill="none" stroke="#64dff9" strokeOpacity=".55">
          <rect x="80" y="268" width="150" height="84" rx="3" />
          <path d="M96 329h14v-17h14v17h14v-32h14v32h14v-23h14v23h14" strokeWidth="2" />
          <path d="M96 285h72m-72 9h42" strokeOpacity=".28" />
          <rect x="970" y="286" width="148" height="92" rx="3" />
          <path d="M988 352h110m-110-12h82m-82-12h94m-94-12h62" strokeWidth="3" strokeLinecap="round" />
          <path d="M988 300h52" strokeOpacity=".3" />
        </g>

        <g className="hs-code-art__shield">
          <path
            d="M600 130 760 190v127c0 111-68 192-160 250-92-58-160-139-160-250V190l160-60Z"
            fill="url(#cyber-shield-fill)"
            stroke="#54dcff"
            strokeOpacity=".72"
            strokeWidth="2"
          />
          <path
            d="M600 158 735 209v108c0 91-55 159-135 211-80-52-135-120-135-211V209l135-51Z"
            fill="none"
            stroke="#54dcff"
            strokeOpacity=".25"
          />
          <path
            d="M548 339v-34a52 52 0 0 1 104 0v34m-118 0h132v98H534z"
            fill="none"
            stroke="#78eaff"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="8"
          />
          <circle cx="600" cy="378" r="8" fill="#78eaff" />
          <path d="M600 386v18" stroke="#78eaff" strokeLinecap="round" strokeWidth="6" />
        </g>

        <rect className="hs-code-art__scan" x="0" y="0" width="1200" height="150" fill="url(#cyber-scan)" />

        <g fill="#8ba9c4" fontFamily="monospace" fontSize="13" letterSpacing="3">
          <text x="82" y="130">NETWORK // SECURE</text>
          <text x="875" y="605">FISAFI · CYBER DEFENSE</text>
          <text x="88" y="590">ENCRYPTION: ACTIVE</text>
          <text x="972" y="267">LIVE MONITORING</text>
        </g>
        <g fill="none" stroke="#526e89" strokeOpacity=".55">
          <rect x="78" y="145" width="130" height="54" rx="3" />
          <rect x="990" y="570" width="142" height="54" rx="3" />
          <path d="M78 215h86m-86 12h52m806 329h86m-86 12h52" />
        </g>
        <circle className="hs-code-art__status" cx="1093" cy="251" r="4" fill="#54f0c2" />
      </svg>
    </div>
  );
}

function FiberOpticArtwork() {
  return (
    <div className="hs-fiber-art" aria-hidden="true">
      <svg
        className="hs-fiber-art__graphic"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <linearGradient id="fiber-strand-cyan" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#167aa4" stopOpacity=".12" />
            <stop offset=".52" stopColor="#58e6ff" />
            <stop offset="1" stopColor="#b7fbff" stopOpacity=".9" />
          </linearGradient>
          <linearGradient id="fiber-strand-violet" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#654ab4" stopOpacity=".08" />
            <stop offset=".62" stopColor="#a78bfa" stopOpacity=".9" />
            <stop offset="1" stopColor="#d9c8ff" />
          </linearGradient>
          <radialGradient id="fiber-core-glow">
            <stop stopColor="#b8f8ff" stopOpacity=".85" />
            <stop offset="1" stopColor="#36cfff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fiber-scan-band" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#5ce8ff" stopOpacity="0" />
            <stop offset=".5" stopColor="#5ce8ff" stopOpacity=".16" />
            <stop offset="1" stopColor="#5ce8ff" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="hs-fiber-art__guide" fill="none" stroke="#4fa6c6">
          <path d="M0 140h210l92 92h72m826 240h-214l-88-88h-84" strokeOpacity=".36" />
          <path d="M0 564h180l74-74h108m838-344h-196l-72 72h-82" strokeOpacity=".24" />
          <path d="M200 0v86l58 58m688 412 58 58v86" strokeOpacity=".2" />
          <circle cx="300" cy="232" r="4" fill="#54dcff" />
          <circle cx="254" cy="490" r="4" fill="#a78bfa" />
          <circle cx="928" cy="216" r="4" fill="#54dcff" />
          <circle cx="910" cy="472" r="4" fill="#a78bfa" />
        </g>

        <g className="hs-fiber-art__strands" fill="none" strokeLinecap="round">
          <path d="M126 285C330 285 360 350 520 350s212-136 420-136" stroke="url(#fiber-strand-cyan)" strokeWidth="5" />
          <path d="M126 314C328 314 376 365 530 365s222-110 410-110" stroke="url(#fiber-strand-violet)" strokeWidth="3" />
          <path d="M126 342C322 342 382 380 540 380s224-80 400-80" stroke="url(#fiber-strand-cyan)" strokeWidth="2" />
          <path d="M126 370C324 370 380 395 540 395s210-48 400-48" stroke="url(#fiber-strand-violet)" strokeWidth="3" />
          <path d="M126 398C326 398 370 410 530 410s224-18 410-18" stroke="url(#fiber-strand-cyan)" strokeWidth="2" />
        </g>

        <g className="hs-fiber-art__light-pulses" fill="#d3fbff">
          <circle r="7">
            <animateMotion dur="4.4s" repeatCount="indefinite" path="M126 285C330 285 360 350 520 350s212-136 420-136" />
          </circle>
          <circle r="5">
            <animateMotion dur="5.2s" begin="1.1s" repeatCount="indefinite" path="M126 370C324 370 380 395 540 395s210-48 400-48" />
          </circle>
          <circle r="4">
            <animateMotion dur="5.8s" begin="2.2s" repeatCount="indefinite" path="M126 342C322 342 382 380 540 380s224-80 400-80" />
          </circle>
        </g>

        <g className="hs-fiber-art__connector">
          <circle cx="124" cy="342" r="90" fill="#0b1b2b" stroke="#3e8cac" strokeOpacity=".55" strokeWidth="2" />
          <circle cx="124" cy="342" r="70" fill="#0a1420" stroke="#58dff7" strokeOpacity=".6" strokeWidth="2" />
          <circle cx="124" cy="342" r="51" fill="url(#fiber-core-glow)" />
          <circle cx="124" cy="342" r="26" fill="#0b2434" stroke="#b5f5ff" strokeOpacity=".85" strokeWidth="3" />
          <circle cx="124" cy="342" r="10" fill="#aaf6ff" />
        </g>

        <g className="hs-fiber-art__hub">
          <circle cx="956" cy="342" r="104" fill="#0a1725" fillOpacity=".9" stroke="#5adcf4" strokeOpacity=".5" strokeWidth="2" />
          <circle cx="956" cy="342" r="76" fill="none" stroke="#67ddf4" strokeOpacity=".25" strokeDasharray="2 8" />
          <circle cx="956" cy="342" r="38" fill="#102a3d" stroke="#77e9ff" strokeOpacity=".78" strokeWidth="2" />
          <path d="M938 342h36m-18-18v36" stroke="#a9f5ff" strokeLinecap="round" strokeWidth="5" />
          <circle cx="956" cy="342" r="130" fill="none" stroke="#3c86a5" strokeOpacity=".16" />
        </g>

        <g fill="#91b5ca" fontFamily="monospace" fontSize="13" letterSpacing="3">
          <text x="74" y="180">FIBER OPTIC // 01</text>
          <text x="842" y="510">SIGNAL: OPTIMAL</text>
          <text x="778" y="178">HIGH-SPEED DATA LINK</text>
        </g>
        <g fill="none" stroke="#496e86" strokeOpacity=".55">
          <path d="M74 195h166m602-1h260M842 526h210" />
          <rect x="842" y="530" width="230" height="46" rx="3" />
          <path d="M860 554h85m12 0h12m12 0h62" stroke="#61e7ff" strokeOpacity=".7" strokeWidth="3" />
        </g>
        <rect className="hs-fiber-art__scan" x="0" y="0" width="1200" height="150" fill="url(#fiber-scan-band)" />
      </svg>
    </div>
  );
}

function TechnicalArtwork({ visual }: { visual: Exclude<CodeVisual, "cyber" | "fiber"> }) {
  const details: Record<typeof visual, { label: string; status: string }> = {
    network: { label: "NETWORK ARCHITECTURE", status: "NODES: CONNECTED" },
    consulting: { label: "TECHNICAL STRATEGY", status: "ANALYSIS: COMPLETE" },
    transformation: { label: "SYSTEMS EVOLUTION", status: "MIGRATION: READY" },
    support: { label: "MANAGED SERVICES", status: "SUPPORT: ONLINE" },
    installation: { label: "SITE DEPLOYMENT", status: "LINK: ESTABLISHED" },
    cloud: { label: "HYBRID CLOUD", status: "PLATFORM: ACTIVE" },
    classroom: { label: "EXPERT-LED TRAINING", status: "SESSION: LIVE" },
    elearning: { label: "DIGITAL LEARNING", status: "COURSE: AVAILABLE" },
    hybrid: { label: "HYBRID LEARNING", status: "LEARN: EVERYWHERE" },
    certification: { label: "CERTIFICATION PATH", status: "SKILLS: VERIFIED" },
  };
  const title = details[visual];
  const gradientId = `tech-art-glow-${visual}`;

  return (
    <div className="hs-tech-art" data-visual={visual} aria-hidden="true">
      <svg
        className="hs-tech-art__graphic"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--tech-accent-light)" />
            <stop offset="1" stopColor="var(--tech-accent)" />
          </linearGradient>
          <radialGradient id={`tech-art-halo-${visual}`}>
            <stop stopColor="var(--tech-accent)" stopOpacity=".28" />
            <stop offset="1" stopColor="var(--tech-accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g className="hs-tech-art__orbit" fill="none" stroke="var(--tech-accent)">
          <circle cx="600" cy="350" r="244" strokeOpacity=".11" />
          <circle cx="600" cy="350" r="202" strokeOpacity=".1" strokeDasharray="2 11" />
          <path d="M600 68v32m0 500v32M318 350h32m500 0h32" strokeOpacity=".32" strokeWidth="2" />
          <path d="M401 151 424 174m352 352 23 23m0-398-23 23m-352 352-23 23" strokeOpacity=".2" />
        </g>

        <ellipse cx="600" cy="350" rx="230" ry="190" fill={`url(#${`tech-art-halo-${visual}`})`} />

        {visual === "network" && (
          <g className="hs-tech-art__diagram">
            <path d="M342 252 485 320m373-68-143 68M350 454l135-72m365 72-135-72" />
            <circle cx="340" cy="250" r="32" /><circle cx="860" cy="250" r="32" />
            <circle cx="350" cy="458" r="32" /><circle cx="850" cy="458" r="32" />
            <rect className="hs-tech-art__panel" x="492" y="194" width="216" height="312" rx="8" />
            <path d="M522 236h156v56H522zm0 80h156v56H522zm0 80h156v56H522z" />
            <path d="M540 264h68m-68 80h94m-94 80h82" strokeWidth="5" strokeLinecap="round" />
            <circle cx="652" cy="264" r="5" className="hs-tech-art__led" />
            <circle cx="652" cy="344" r="5" className="hs-tech-art__led" />
            <circle cx="652" cy="424" r="5" className="hs-tech-art__led" />
          </g>
        )}

        {visual === "consulting" && (
          <g className="hs-tech-art__diagram">
            <rect className="hs-tech-art__panel" x="326" y="168" width="548" height="364" rx="8" />
            <path d="M364 220h210m-210 17h126" opacity=".45" />
            <path d="M378 456V355h58v101m28 0V311h58v145m28 0V270h58v186m28 0V334h58v122" className="hs-tech-art__bars" />
            <path d="m384 331 99-44 94 28 91-82 90 24" className="hs-tech-art__trend" />
            <circle cx="483" cy="287" r="6" className="hs-tech-art__led" />
            <circle cx="577" cy="315" r="6" className="hs-tech-art__led" />
            <circle cx="668" cy="233" r="6" className="hs-tech-art__led" />
            <circle cx="758" cy="257" r="6" className="hs-tech-art__led" />
            <path d="M362 478h476" opacity=".3" />
          </g>
        )}

        {visual === "transformation" && (
          <g className="hs-tech-art__diagram">
            <path d="M384 350h130m172 0h130M514 350c0-102 172-102 172 0s-172 102-172 0Z" />
            <path d="m495 332 20 18-20 18m210-36-20 18 20 18" />
            <rect className="hs-tech-art__panel" x="330" y="280" width="94" height="140" rx="8" />
            <rect className="hs-tech-art__panel" x="776" y="280" width="94" height="140" rx="8" />
            <path d="M350 310h54m-54 28h54m-54 28h54m-54 28h54m-54 28h54" />
            <path d="M796 310h54m-54 28h54m-54 28h54m-54 28h54m-54 28h54" />
            <circle cx="600" cy="350" r="46" className="hs-tech-art__panel" />
            <path d="m582 350 13 13 25-28" className="hs-tech-art__check" />
          </g>
        )}

        {visual === "support" && (
          <g className="hs-tech-art__diagram">
            <circle cx="600" cy="328" r="166" className="hs-tech-art__panel" />
            <path d="M500 340v-34a100 100 0 0 1 200 0v34m-200-4h-24v90h64v-90h-40m200 0h24v90h-64v-90h40m-160 99c18 34 54 50 100 50h32" />
            <rect className="hs-tech-art__panel" x="643" y="469" width="64" height="42" rx="20" />
            <circle cx="600" cy="350" r="9" className="hs-tech-art__led" />
            <path d="M600 367v32m-19-16h38" />
            <circle cx="356" cy="330" r="5" className="hs-tech-art__led" />
            <circle cx="844" cy="330" r="5" className="hs-tech-art__led" />
          </g>
        )}

        {visual === "installation" && (
          <g className="hs-tech-art__diagram">
            <path d="M364 218h472v300H364z" className="hs-tech-art__panel" />
            <path d="M482 218v300m118-300v300m118-300v300M364 318h472M364 418h472" opacity=".48" />
            <path d="M410 270h26m-13-13v26m300 72h26m-13-13v26m-240 87h26m-13-13v26" />
            <path d="M600 312c-38 0-68 29-68 66 0 49 68 112 68 112s68-63 68-112c0-37-30-66-68-66Z" className="hs-tech-art__pin" />
            <circle cx="600" cy="378" r="19" className="hs-tech-art__led" />
            <path d="M600 490v28m-22-14h44" />
          </g>
        )}

        {visual === "cloud" && (
          <g className="hs-tech-art__diagram">
            <path d="M458 382h284a78 78 0 0 0 0-156 116 116 0 0 0-220-17 90 90 0 0 0-64 173Z" className="hs-tech-art__panel" />
            <path d="M600 360v102m-76-28 76 28 76-28" />
            <rect className="hs-tech-art__panel" x="506" y="464" width="72" height="50" rx="6" />
            <rect className="hs-tech-art__panel" x="614" y="464" width="72" height="50" rx="6" />
            <path d="M522 480h40m-40 15h26m70-15h40m-40 15h26" />
            <circle cx="556" cy="309" r="8" className="hs-tech-art__led" />
            <circle cx="600" cy="309" r="8" className="hs-tech-art__led" />
            <circle cx="644" cy="309" r="8" className="hs-tech-art__led" />
          </g>
        )}

        {visual === "classroom" && (
          <g className="hs-tech-art__diagram">
            <rect className="hs-tech-art__panel" x="376" y="174" width="448" height="244" rx="8" />
            <path d="M414 218h188m-188 18h124" opacity=".45" />
            <path d="m442 366 71-79 64 50 82-95 75 67" className="hs-tech-art__trend" />
            <circle cx="513" cy="287" r="6" className="hs-tech-art__led" />
            <circle cx="659" cy="242" r="6" className="hs-tech-art__led" />
            <path d="M600 418v48m-82 0h164" />
            <circle cx="414" cy="506" r="24" className="hs-tech-art__avatar" />
            <circle cx="600" cy="506" r="24" className="hs-tech-art__avatar" />
            <circle cx="786" cy="506" r="24" className="hs-tech-art__avatar" />
            <path d="M376 570c0-38 17-54 38-54s38 16 38 54m110 0c0-38 17-54 38-54s38 16 38 54m110 0c0-38 17-54 38-54s38 16 38 54" />
          </g>
        )}

        {visual === "elearning" && (
          <g className="hs-tech-art__diagram">
            <rect className="hs-tech-art__panel" x="324" y="170" width="552" height="350" rx="12" />
            <path d="M350 200h500v276H350z" />
            <path d="M540 520v24m120-24v24m-156 0h192" />
            <rect className="hs-tech-art__panel" x="384" y="236" width="162" height="190" rx="5" />
            <circle cx="465" cy="292" r="34" fill="url(#tech-art-glow-elearning)" />
            <path d="m450 274 32 18-32 18z" className="hs-tech-art__play" />
            <path d="M405 350h120m-120 18h92m-92 18h106" />
            <rect className="hs-tech-art__panel" x="578" y="236" width="234" height="42" rx="4" />
            <rect className="hs-tech-art__panel" x="578" y="294" width="234" height="42" rx="4" />
            <rect className="hs-tech-art__panel" x="578" y="352" width="234" height="42" rx="4" />
            <circle cx="600" cy="257" r="6" className="hs-tech-art__led" />
            <circle cx="600" cy="315" r="6" className="hs-tech-art__led" />
            <circle cx="600" cy="373" r="6" className="hs-tech-art__led" />
            <path d="M620 257h160m-160 58h130m-130 58h148" />
          </g>
        )}

        {visual === "hybrid" && (
          <g className="hs-tech-art__diagram">
            <rect className="hs-tech-art__panel" x="330" y="188" width="356" height="266" rx="9" />
            <path d="M354 216h308v208H354z" />
            <circle cx="508" cy="292" r="36" className="hs-tech-art__avatar" />
            <path d="M444 394c4-48 28-73 64-73s60 25 64 73" />
            <path d="M470 454v38m-78 0h234" />
            <rect className="hs-tech-art__panel" x="756" y="246" width="112" height="224" rx="16" />
            <rect x="770" y="270" width="84" height="148" rx="4" />
            <circle cx="812" cy="440" r="7" className="hs-tech-art__led" />
            <path d="M686 320h64m-20-20 20 20-20 20" className="hs-tech-art__check" />
            <circle cx="508" cy="292" r="70" fill="none" stroke="var(--tech-accent)" strokeOpacity=".24" />
          </g>
        )}

        {visual === "certification" && (
          <g className="hs-tech-art__diagram">
            <path d="M600 156 646 181l52-1 25 46 46 26-1 52 25 46-25 46 1 52-46 26-25 46-52-1-46 25-46-25-52 1-26-46-46-26 1-52-25-46 25-46-1-52 46-26 26-46 52 1z" className="hs-tech-art__panel" />
            <circle cx="600" cy="350" r="138" fill="none" stroke="var(--tech-accent)" strokeOpacity=".42" strokeWidth="2" />
            <path d="m544 349 39 39 76-82" className="hs-tech-art__check" />
            <path d="m528 470-22 106 94-44m72-62 22 106-94-44" />
            <circle cx="600" cy="350" r="178" fill="none" stroke="var(--tech-accent)" strokeOpacity=".18" strokeDasharray="3 10" />
          </g>
        )}

        <g className="hs-tech-art__caption" fill="var(--tech-copy)" fontFamily="monospace" fontSize="13" letterSpacing="3">
          <text x="78" y="118">{title.label}</text>
          <text x="842" y="595">{title.status}</text>
        </g>
        <g className="hs-tech-art__status" fill="var(--tech-accent-light)">
          <circle cx="820" cy="590" r="4" />
        </g>
        <path className="hs-tech-art__scan" d="M80 142h1040" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Composant principal
   ───────────────────────────────────────────── */
export default function HeroSlideshow({
  variant = "home",
  hideCTA = false,
  ctaText = "Nos services",
  ctaHref = "/services",
}: {
  variant?: "home" | "services" | "training";
  hideCTA?: boolean;
  ctaText?: string;
  ctaHref?: string;
}) {
  const slides = useMemo(
    () =>
      variant === "services"
        ? SERVICES_SLIDES
        : variant === "training"
        ? TRAINING_SLIDES
        : DEFAULT_SLIDES,
    [variant]
  );

  const [current, setCurrent]         = useState(0);
  const [prevIdx, setPrevIdx]         = useState<number | null>(null);
  const [imgKey, setImgKey]           = useState(0);
  const [autoEnabled, setAutoEnabled] = useState(true);

  const cardsTrackRef        = useRef<HTMLDivElement>(null);
  const currentRef           = useRef(0);
  const isProgrammaticScroll = useRef(false);
  const autoTimer            = useRef<ReturnType<typeof setInterval>>();
  const inactivityTimer      = useRef<ReturnType<typeof setTimeout>>();

  const palette = PALETTES[current % PALETTES.length];
  const total   = String(slides.length).padStart(2, "0");

  const updateCurrent = useCallback((idx: number) => {
    if (idx === currentRef.current) return;
    try {
      setPrevIdx(currentRef.current);
      setImgKey((k) => k + 1);
      currentRef.current = idx;
      setCurrent(idx);
    } catch (e) {
      console.error("Update current error:", e);
    }
  }, []);

  const pauseAuto = useCallback(() => {
    setAutoEnabled(false);
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => setAutoEnabled(true), 8000);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      try {
        const track = cardsTrackRef.current;
        if (!track || !track.parentElement) return;
        const targetX = track.clientWidth * idx;
        if (targetX < 0 || !isFinite(targetX)) return;
        isProgrammaticScroll.current = true;
        updateCurrent(idx);
        track.scrollLeft = targetX;
        setTimeout(() => {
          if (cardsTrackRef.current) isProgrammaticScroll.current = false;
        }, 100);
      } catch (e) {
        console.error("GoTo error:", e);
        isProgrammaticScroll.current = false;
      }
    },
    [updateCurrent]
  );

  useEffect(() => {
    if (!autoEnabled) return;
    autoTimer.current = setInterval(() => {
      goTo((currentRef.current + 1) % slides.length);
    }, 8000);
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  }, [autoEnabled, slides.length, goTo]);

  useEffect(() => {
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  useEffect(() => {
    const track = cardsTrackRef.current;
    if (!track) return;
    let scrollTimer: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;
      pauseAuto();
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        try {
          const idx     = Math.round(track.scrollLeft / track.clientWidth);
          const safeIdx = Math.max(0, Math.min(idx, slides.length - 1));
          updateCurrent(safeIdx);
        } catch (e) {
          console.error("Scroll error:", e);
        }
        scrollTimer = null;
      }, 80);
    };
    track.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
    };
  }, [pauseAuto, updateCurrent, slides.length]);

  const attachDrag = useCallback(
    (el: HTMLDivElement) => {
      let dragging = false, startX = 0, startLeft = 0;
      const onDown = (e: MouseEvent) => {
        dragging   = true;
        startX     = e.pageX;
        startLeft  = el.scrollLeft;
        el.style.cursor     = "grabbing";
        el.style.userSelect = "none";
        pauseAuto();
      };
      const onMove = (e: MouseEvent) => {
        if (!dragging) return;
        el.scrollLeft = startLeft - (e.pageX - startX);
      };
      const onUp = () => {
        dragging = false;
        el.style.cursor = "grab";
        el.style.removeProperty("user-select");
      };
      el.addEventListener("mousedown", onDown);
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      return () => {
        el.removeEventListener("mousedown", onDown);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
    },
    [pauseAuto]
  );

  useEffect(() => {
    const el = cardsTrackRef.current;
    if (!el) return;
    return attachDrag(el);
  }, [attachDrag]);

  return (
    <section
      className={`hs-root hs-root--${variant}`}
      aria-roledescription="carrousel"
      aria-label="Présentation FiSAFi"
      style={
        {
          "--hs-accent":      palette.accent,
          "--hs-accent-rgb":  palette.accentRgb,
          "--hs-accent-glow": `rgba(${palette.accentRgb}, 0.08)`,
        } as React.CSSProperties
      }
    >
      {/* ── Image zone ──────────────────────── */}
      <div className="hs-image-container">
        {prevIdx !== null && (
          <div
            key={`prev-${imgKey}`}
            className="hs-img-layer hs-img-layer--prev"
            aria-hidden="true"
          >
            {slides[prevIdx].visual === "cyber" ? (
              <HighTechArtwork />
            ) : slides[prevIdx].visual === "fiber" ? (
              <FiberOpticArtwork />
            ) : isTechnicalVisual(slides[prevIdx].visual) ? (
              <TechnicalArtwork visual={slides[prevIdx].visual} />
            ) : slides[prevIdx].src ? (
              <Image
                src={slides[prevIdx].src}
                alt=""
                fill
                sizes="(min-width: 980px) 55vw, 100vw"
                style={{ objectFit: "cover", objectPosition: "center top" }}
                draggable={false}
              />
            ) : null}
          </div>
        )}
        <div key={`curr-${imgKey}`} className="hs-img-layer hs-img-layer--curr">
          {slides[current].visual === "cyber" ? (
            <HighTechArtwork />
          ) : slides[current].visual === "fiber" ? (
            <FiberOpticArtwork />
          ) : isTechnicalVisual(slides[current].visual) ? (
            <TechnicalArtwork visual={slides[current].visual} />
          ) : slides[current].src ? (
            <Image
              src={slides[current].src}
              alt={slides[current].alt}
              fill
              priority={current === 0}
              sizes="(min-width: 980px) 55vw, 100vw"
              style={{ objectFit: "cover", objectPosition: "center top" }}
              draggable={false}
            />
          ) : null}
        </div>

        {/* Barre accent animée */}
        <div
          className="hs-image-bar"
          aria-hidden="true"
          style={{
            width: `${((current + 1) / slides.length) * 100}%`,
            background: `linear-gradient(to right, transparent, ${palette.accent}, transparent)`,
          }}
        />

        <div className="hs-slide-num" aria-hidden="true">
          {String(current + 1).padStart(2, "0")} / {total}
        </div>
      </div>

      {/* ── Text & cards panel ──────────────── */}
      <div className="hs-text-panel">
        {/* Barre de progression verticale */}
        <div className="hs-vbar" aria-hidden="true">
          <div
            className="hs-vbar-fill"
            style={{
              height: `${((current + 1) / slides.length) * 100}%`,
              background: palette.accent,
            }}
          />
        </div>

        {/* Track scrollable des cartes */}
        <div className="hs-cards-track" ref={cardsTrackRef}>
          {slides.map((slide, idx) => {
            const p   = PALETTES[idx % PALETTES.length];
            const num = String(idx + 1).padStart(2, "0");

            // Lignes horizontales du cahier
            const notebookLines = `repeating-linear-gradient(
              transparent 0px,
              transparent 27px,
              ${p.lineColor} 27px,
              ${p.lineColor} 28px
            )`;

            const isActive = idx === current;

            return (
              <div
                key={idx}
                className="hs-card-slide"
                role="group"
                aria-roledescription="diapositive"
                aria-label={`${idx + 1} sur ${slides.length} — ${slide.eyebrow}`}
                aria-hidden={!isActive}
              >
                <div className="hs-card-scene">
                  {/* Washi-tape pin */}
                  <div
                    className="hs-pin"
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(135deg,
                        ${hexRgba(p.accent, 0.55)},
                        ${hexRgba(p.accent, 0.82)}
                      )`,
                    }}
                  />

                  {/* Stack de feuilles */}
                  <div className="hs-stack">
                    {/* Feuille du fond — la plus éloignée */}
                    <div
                      className="hs-ghost hs-ghost--far"
                      aria-hidden="true"
                      style={{ background: p.ghostBg2 }}
                    />
                    {/* Feuille intermédiaire */}
                    <div
                      className="hs-ghost hs-ghost--near"
                      aria-hidden="true"
                      style={{ background: p.ghostBg1 }}
                    />

                    {/* Carte principale */}
                    <div
                      className="hs-card"
                      style={{ backgroundColor: p.cardBg }}
                    >
                      {/* Wrapper interne pour cliper les lignes + contenu */}
                      <div
                        className="hs-card-inner"
                        style={{
                          backgroundImage: notebookLines,
                          backgroundPositionY: "52px",
                        }}
                      >
                        {/* Ligne de marge verticale */}
                        <div
                          className="hs-card-margin"
                          aria-hidden="true"
                          style={{ background: hexRgba(p.accent, 0.18) }}
                        />

                        <div className="hs-card-body">
                          {/* Numéro */}
                          <span
                            className="hs-card-num"
                            style={{ color: p.accent }}
                          >
                            {num}
                          </span>

                          {/* Séparateur */}
                          <div
                            className="hs-card-rule"
                            aria-hidden="true"
                            style={{ background: hexRgba(p.accent, 0.32) }}
                          />

                          {/* Titre */}
                          <h2
                            className="hs-card-title"
                            style={{ color: p.inkDark }}
                          >
                            {slide.eyebrow}
                          </h2>

                          {/* Description */}
                          <p className="hs-card-desc">{slide.desc}</p>

                          {/* Petit tag accent */}
                          <div
                            className="hs-card-tag"
                            style={{
                              background: hexRgba(p.accent, 0.05),
                              color: p.accent,
                              borderColor: hexRgba(p.accent, 0),
                            }}
                          >
                            FISAFI Groupe
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom controls */}
        <div className="hs-bottom">
          {!hideCTA && (
            <div className="hs-actions">
              <Link href={ctaHref} className="hs-btn-primary">
                <span>{ctaText}</span>
                <span className="hs-btn-arrow" aria-hidden />
              </Link>
              <Link href="/#contact" className="hs-btn-ghost">
                <span>Nous contacter</span>
                <span className="hs-btn-arrow" aria-hidden />
              </Link>
            </div>
          )}

          <nav className="hs-dots" aria-label="Navigation du carrousel">
            {slides.map((slide, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { goTo(i); pauseAuto(); }}
                aria-label={`${slide.eyebrow} — diapositive ${i + 1} sur ${slides.length}`}
                aria-current={i === current}
                className={`hs-dot${i === current ? " hs-dot--active" : ""}`}
                style={
                  i === current
                    ? { background: PALETTES[i % PALETTES.length].accent }
                    : undefined
                }
              />
            ))}
          </nav>
        </div>
      </div>
    </section>
  );
}