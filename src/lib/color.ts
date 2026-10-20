/** '#1DB954' / '#1db' -> [r, g, b]; falls back to Spotify green for anything unparseable. */
export const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) {h = h.split('').map((c) => c + c).join('');}
  const n = parseInt(h.slice(0, 6), 16);
  return Number.isNaN(n) ? [29, 185, 84] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Number of colour steps in the heatmaps (plus the empty colour for zero). */
export const HEAT_STEPS = 7;

/** Opacity of the accent colour for each step 1..HEAT_STEPS. */
const STEP_ALPHA = [0.14, 0.27, 0.41, 0.55, 0.69, 0.84, 1];

/**
 * Quantile breakpoints over the non-zero values: each colour step covers roughly the same
 * number of cells, so busy and quiet periods stay distinguishable even when a few outliers
 * dwarf everything else (a linear or square-root scale squashes most cells into 2-3 shades).
 */
export const heatThresholds = (values: Iterable<number>, steps = HEAT_STEPS): number[] => {
  const sorted = [...values].filter((v) => v > 0).toSorted((a, b) => a - b);
  if (sorted.length === 0) {return [];}
  return Array.from({ length: steps - 1 }, (_, i) => sorted[Math.floor(((i + 1) / steps) * sorted.length)]);
};

/** 0 for no listening, otherwise 1..HEAT_STEPS. */
export const heatLevel = (value: number, thresholds: readonly number[]): number =>
  value <= 0 ? 0 : 1 + thresholds.filter((t) => value >= t).length;

/** Colour for a heat level: the accent at increasing strength, or `empty` for level 0. */
export const heatLevelColor = (level: number, accentHex: string, empty: string): string => {
  if (level <= 0) {return empty;}
  const [r, g, b] = hexToRgb(accentHex);
  const alpha = STEP_ALPHA[Math.min(level, STEP_ALPHA.length) - 1];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Heatmap cell colour for a value, using quantile `thresholds` from heatThresholds. */
export const heatColor = (accentHex: string, value: number, thresholds: readonly number[], empty: string): string =>
  heatLevelColor(heatLevel(value, thresholds), accentHex, empty);
