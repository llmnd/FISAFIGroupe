"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ─────────────────────────────────────────────────────────
   Animated counter — eases to target on mount / change
   ───────────────────────────────────────────────────────── */
export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

/* ─────────────────────────────────────────────────────────
   Resize observer — gives the exact pixel width of a box
   ───────────────────────────────────────────────────────── */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([entry]) => {
      setWidth(Math.round(entry.contentRect.width));
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

/* ─────────────────────────────────────────────────────────
   Catmull-Rom → cubic bezier (produces smooth curves)
   ───────────────────────────────────────────────────────── */
function smoothPath(points: Array<[number, number]>, tension = 1): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension;
    const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension;
    const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension;
    const c2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/* ─────────────────────────────────────────────────────────
   Sparkline — tiny smooth curve for KPI cards
   ───────────────────────────────────────────────────────── */
export function Sparkline({
  values,
  width = 130,
  height = 34,
  stroke = "var(--orange)",
  fill = true,
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: boolean;
}) {
  const id = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);
  const path = useMemo(() => {
    if (values.length < 2) return "";
    const max = Math.max(...values);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const stepX = width / (values.length - 1);
    const pts = values.map((v, i) => [i * stepX, height - ((v - min) / range) * height] as [number, number]);
    return smoothPath(pts);
  }, [values, width, height]);

  if (!path) return null;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true" className="sparkline">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && (
        <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill={`url(#${id})`} stroke="none" />
      )}
      <path d={path} fill="none" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Donut — state distribution
   ───────────────────────────────────────────────────────── */
export function Donut({
  segments,
  size = 176,
  thickness = 16,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
  size?: number;
  thickness?: number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const radius = (size - thickness) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="donut" role="img">
        <circle cx={c} cy={c} r={radius} fill="none" stroke="var(--line-soft)" strokeWidth={thickness} />
        {total > 0 &&
          segments.map((seg) => {
            if (!seg.value) return null;
            const len = (seg.value / total) * circumference;
            const el = (
              <circle
                key={seg.label}
                cx={c}
                cy={c}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${c} ${c})`}
                strokeLinecap="butt"
              />
            );
            offset += len;
            return el;
          })}
        <text x={c} y={c - 4} textAnchor="middle" className="donut-total">
          {total}
        </text>
        <text x={c} y={c + 16} textAnchor="middle" className="donut-caption">
          transactions
        </text>
      </svg>
      <ul className="donut-legend">
        {segments.map((seg) => (
          <li key={seg.label}>
            <span className="dot" style={{ background: seg.color }} />
            <span className="label">{seg.label}</span>
            <span className="value">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Conversion bar — orders → confirmed / pending / canceled
   ───────────────────────────────────────────────────────── */
export function ConversionBar({
  segments,
}: {
  segments: Array<{ label: string; value: number; color: string }>;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  return (
    <div className="conversion">
      <div className="conversion-track">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className="conversion-segment"
            style={{ width: `${(seg.value / total) * 100}%`, background: seg.color }}
            title={`${seg.label} · ${seg.value}`}
          >
            {seg.value / total > 0.09 && <span>{(seg.value / total * 100).toFixed(0)}%</span>}
          </div>
        ))}
      </div>
      <ul className="conversion-legend">
        {segments.map((seg) => (
          <li key={seg.label}>
            <span className="dot" style={{ background: seg.color }} />
            <span className="label">{seg.label}</span>
            <span className="value">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   RevenueCurve — smooth area chart with grid, dots, tooltip
   ───────────────────────────────────────────────────────── */
export function RevenueCurve({
  points,
  height = 240,
}: {
  points: Array<{ label: string; year: number; value: number; count: number }>;
  height?: number;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const padL = 44;
  const padR = 16;
  const padT = 22;
  const padB = 36;
  const innerW = Math.max(width - padL - padR, 10);
  const innerH = height - padT - padB;

  const maxVal = Math.max(...points.map((p) => p.value), 1);
  const niceMax = useMemo(() => {
    const mag = Math.pow(10, Math.floor(Math.log10(maxVal)));
    const norm = maxVal / mag;
    const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
    return step * mag;
  }, [maxVal]);

  const coords = useMemo(
    () =>
      points.map((p, i) => {
        const x = padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
        const y = padT + innerH - (p.value / niceMax) * innerH;
        return [x, y] as [number, number];
      }),
    [points, innerW, innerH, niceMax, padL, padT],
  );

  const linePath = useMemo(() => smoothPath(coords), [coords]);
  const areaPath = useMemo(
    () => (linePath ? `${linePath} L ${coords[coords.length - 1][0]} ${padT + innerH} L ${coords[0][0]} ${padT + innerH} Z` : ""),
    [linePath, coords, innerH, padT],
  );

  const peakIdx = useMemo(() => {
    let idx = 0;
    points.forEach((p, i) => {
      if (p.value > points[idx].value) idx = i;
    });
    return idx;
  }, [points]);

  const gridLevels = [0.25, 0.5, 0.75, 1].map((r) => ({
    r,
    y: padT + innerH - r * innerH,
    v: niceMax * r,
  }));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!width) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let nearest = 0;
    let best = Infinity;
    coords.forEach(([cx], i) => {
      const d = Math.abs(cx - x);
      if (d < best) {
        best = d;
        nearest = i;
      }
    });
    setHover(nearest);
  };

  if (!width) return <div ref={ref} style={{ height }} />;

  const fmt = (n: number) =>
    `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n)} FCFA`;

  return (
    <div ref={ref} className="curve-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        className="curve"
      >
        <defs>
          <linearGradient id="curve-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--orange)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--orange)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="curve-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--blue)" />
            <stop offset="100%" stopColor="var(--orange)" />
          </linearGradient>
        </defs>

        {/* Grid */}
        {gridLevels.map((g) => (
          <g key={g.r}>
            <line x1={padL} x2={width - padR} y1={g.y} y2={g.y} className="curve-grid" />
            <text x={padL - 8} y={g.y + 4} textAnchor="end" className="curve-axis">
              {new Intl.NumberFormat("fr-FR", { notation: "compact", maximumFractionDigits: 1 }).format(g.v)}
            </text>
          </g>
        ))}
        <line x1={padL} x2={width - padR} y1={padT + innerH} y2={padT + innerH} className="curve-axis-line" />

        {/* Area + line */}
        {areaPath && <path d={areaPath} fill="url(#curve-fill)" />}
        {linePath && <path d={linePath} fill="none" stroke="url(#curve-line)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Peak dot */}
        {coords[peakIdx] && (
          <circle cx={coords[peakIdx][0]} cy={coords[peakIdx][1]} r="4.5" fill="var(--orange)" className="curve-peak" />
        )}

        {/* X labels */}
        {coords.map(([x], i) => (
          <text key={i} x={x} y={height - 12} textAnchor="middle" className={`curve-xlabel${hover === i ? " active" : ""}`}>
            {points[i].label}
          </text>
        ))}

        {/* Hover guide */}
        {hover !== null && coords[hover] && (
          <>
            <line x1={coords[hover][0]} x2={coords[hover][0]} y1={padT} y2={padT + innerH} className="curve-guide" />
            <circle cx={coords[hover][0]} cy={coords[hover][1]} r="4" fill="var(--ink-strong)" stroke="var(--mist)" strokeWidth="2" />
          </>
        )}
      </svg>

      {/* Tooltip */}
      {hover !== null && points[hover] && (
        <div
          className="curve-tooltip"
          style={{ left: coords[hover][0], top: coords[hover][1] }}
        >
          <strong>{fmt(points[hover].value)}</strong>
          <span>{points[hover].label} {points[hover].year} · {points[hover].count} transaction{points[hover].count === 1 ? "" : "s"}</span>
        </div>
      )}
    </div>
  );
}