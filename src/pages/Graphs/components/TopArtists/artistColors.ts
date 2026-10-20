import { OTHER_ARTISTS } from '../../../../lib/graphs';

export const OTHERS_COLOR = '#8C8C8C';

/**
 * One hue family per slot for the first 10 (one green, one blue, ...), ordered so neighbouring
 * bands in the stack contrast. Slots 11-20 are lighter/darker variants for longer lists.
 */
const PALETTE = [
  '#1DB954', // green
  '#3B82F6', // blue
  '#F97316', // orange
  '#A855F7', // purple
  '#FACC15', // yellow
  '#06B6D4', // cyan
  '#E11D48', // red
  '#8B5E34', // brown
  '#F472B6', // pink
  '#1E3A8A', // navy
  '#A3E635', // lime
  '#FDBA74', // peach
  '#6D28D9', // violet
  '#7F1D1D', // maroon
  '#5EEAD4', // mint
  '#D946EF', // magenta
  '#CA8A04', // mustard
  '#93C5FD', // sky
  '#BE185D', // raspberry
  '#4D7C0F', // olive
];

/** Fixed colour per charted artist (by rank), grey for everyone else, null if not charted. */
export const seriesColor = (series: string[], artist: string): null | string => {
  if (artist === OTHER_ARTISTS) {return OTHERS_COLOR;}
  const i = series.indexOf(artist);
  return i < 0 ? null : PALETTE[i % PALETTE.length];
};
