import dayjs from 'dayjs';

export interface TidePoint {
  time: string;
  height: number;
}

interface Props {
  points: TidePoint[];
}

interface Extremum {
  index: number;
  kind: 'peak' | 'trough';
}

const WIDTH_PER_POINT = 5;
const HEIGHT = 82;
const TOP_MARGIN = 18;
const BOTTOM_MARGIN = 18;
const AMPLITUDE = 0.55; // aplati : la vague ne remplit pas toute la hauteur disponible
const LINE_COLOR = '#111827';
const NOW_COLOR = '#94a3b8';
const HIGH_FILL = '#10b981';
const LOW_FILL = '#f43f5e';

export interface NowStatus {
  height: number;
  rising: boolean;
}

/** Hauteur d'eau interpolée à l'instant présent + tendance (monte/descend) */
export function getNowStatus(points: TidePoint[]): NowStatus | null {
  const now = Date.now();
  const idx = points.findIndex(p => new Date(p.time).getTime() > now);
  if (idx < 1) return null;
  const a = points[idx - 1];
  const b = points[idx];
  const ta = new Date(a.time).getTime();
  const tb = new Date(b.time).getTime();
  const ratio = tb > ta ? (now - ta) / (tb - ta) : 0;
  return {
    height: a.height + (b.height - a.height) * ratio,
    rising: b.height >= a.height,
  };
}

/**
 * Détecte un changement de tendance plutôt qu'un simple "plus grand que ses voisins" :
 * au sommet d'une marée, deux points consécutifs partagent souvent la même hauteur
 * (plateau d'arrondi), ce qui ferait échouer une comparaison stricte cur > next.
 */
function findExtrema(points: TidePoint[]): Extremum[] {
  const extrema: Extremum[] = [];
  let trend = 0; // -1 descend, 1 monte, 0 indéterminé (plateau initial)
  for (let i = 1; i < points.length; i++) {
    const diff = points[i].height - points[i - 1].height;
    if (diff === 0) continue; // plateau : on garde la tendance en cours
    const dir = diff > 0 ? 1 : -1;
    if (trend !== 0 && dir !== trend) {
      extrema.push({ index: i - 1, kind: trend === 1 ? 'peak' : 'trough' });
    }
    trend = dir;
  }
  return extrema;
}

/** Évite qu'un texte centré déborde du cadre SVG près des bords */
function edgeAnchor(cx: number, width: number): 'start' | 'middle' | 'end' {
  if (cx < 18) return 'start';
  if (cx > width - 18) return 'end';
  return 'middle';
}

/** Courbe lissée (Catmull-Rom → Bézier cubique) pour un rendu organique */
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 3) return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

interface Coord { x: number; y: number }

/**
 * Découpe la courbe en tronçons au-dessus (ou en dessous) de la médiane,
 * avec interpolation aux points de croisement pour un bord propre.
 */
function buildThresholdFillPaths(
  coords: Coord[], heights: number[], midHeight: number, midY: number, above: boolean,
): string[] {
  const paths: string[] = [];
  let run: Coord[] = [];
  const isIn = (h: number) => (above ? h >= midHeight : h <= midHeight);

  const crossing = (i: number, j: number): Coord => {
    const ratio = (midHeight - heights[i]) / (heights[j] - heights[i]);
    return { x: coords[i].x + (coords[j].x - coords[i].x) * ratio, y: midY };
  };

  for (let i = 0; i < coords.length; i++) {
    if (isIn(heights[i])) {
      if (run.length === 0 && i > 0 && !isIn(heights[i - 1])) run.push(crossing(i - 1, i));
      run.push(coords[i]);
    } else if (run.length > 0) {
      run.push(crossing(i, i - 1));
      paths.push(closeRunPath(run, midY));
      run = [];
    }
  }
  if (run.length > 0) paths.push(closeRunPath(run, midY));

  return paths;
}

function closeRunPath(run: Coord[], midY: number): string {
  const line = smoothPath(run);
  return `${line} L ${run[run.length - 1].x},${midY} L ${run[0].x},${midY} Z`;
}

export function TideChart({ points }: Props) {
  if (points.length < 3) return null;

  const heights = points.map(p => p.height);
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  const mid = (min + max) / 2;
  const halfRange = (max - min) / 2 || 1;

  const width = points.length * WIDTH_PER_POINT;
  const plotHeight = HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
  const centerY = TOP_MARGIN + plotHeight / 2;
  const baseline = TOP_MARGIN + plotHeight;

  const x = (i: number) => (i / (points.length - 1)) * width;
  const y = (h: number) => centerY - ((h - mid) / halfRange) * (plotHeight / 2) * AMPLITUDE;

  const coords = points.map((p, i) => ({ x: x(i), y: y(p.height) }));
  const linePath = smoothPath(coords);
  const midY = y(mid);
  const highFillPaths = buildThresholdFillPaths(coords, heights, mid, midY, true);
  const lowFillPaths  = buildThresholdFillPaths(coords, heights, mid, midY, false);

  const extrema = findExtrema(points);

  const now = Date.now();
  let nowIdx = points.findIndex(p => new Date(p.time).getTime() > now);
  if (nowIdx <= 0) nowIdx = points.length > 1 ? 1 : -1;
  const nowX = nowIdx >= 1
    ? (() => {
        const a = new Date(points[nowIdx - 1].time).getTime();
        const b = new Date(points[nowIdx].time).getTime();
        const ratio = b > a ? (now - a) / (b - a) : 0;
        return x(nowIdx - 1) + (x(nowIdx) - x(nowIdx - 1)) * ratio;
      })()
    : null;

  return (
    <div className="overflow-x-auto hide-scroll">
      <svg viewBox={`0 0 ${width} ${HEIGHT}`} width={width} height={HEIGHT} preserveAspectRatio="none" className="block">
        {highFillPaths.map((d, i) => (
          <path key={`h${i}`} d={d} fill={HIGH_FILL} fillOpacity="0.38" />
        ))}
        {lowFillPaths.map((d, i) => (
          <path key={`l${i}`} d={d} fill={LOW_FILL} fillOpacity="0.38" />
        ))}
        <path d={linePath} fill="none" stroke={LINE_COLOR} strokeWidth="1.75" strokeLinecap="round" />

        {extrema.map(e => {
          const point = points[e.index];
          const label = dayjs(point.time).format('HH:mm');
          const cx = x(e.index);
          const cy = y(point.height);
          return (
            <text
              key={e.index}
              x={cx}
              y={e.kind === 'peak' ? cy - 7 : cy + 16}
              textAnchor={edgeAnchor(cx, width)}
              fontSize="10"
              fontWeight="600"
              fill={LINE_COLOR}
            >
              {label}
            </text>
          );
        })}

        {nowX !== null && (
          <g>
            <line
              x1={nowX} x2={nowX}
              y1={TOP_MARGIN} y2={baseline}
              stroke={NOW_COLOR} strokeWidth="1" strokeDasharray="2 3"
            />
            <text x={nowX} y={TOP_MARGIN - 6} textAnchor={edgeAnchor(nowX, width)} fontSize="10" fontWeight="700" fill={NOW_COLOR}>
              {dayjs().format('HH:mm')}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
