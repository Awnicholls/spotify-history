/** '#1DB954' / '#1db' -> [r, g, b]; falls back to Spotify green for anything unparseable. */
export const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return Number.isNaN(n) ? [29, 185, 84] : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/**
 * Heatmap cell colour: the accent colour at an opacity for `value / max`. Square-root scaled so
 * a few huge days don't wash everything else out; zero gets the empty colour.
 */
export const heatColor = (accentHex: string, value: number, max: number, empty: string): string => {
  if (value <= 0 || max <= 0) return empty;
  const [r, g, b] = hexToRgb(accentHex);
  const alpha = 0.15 + 0.85 * Math.sqrt(Math.min(1, value / max));
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
};
