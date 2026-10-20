import { OTHER_ARTISTS } from '../../../../lib/graphs';

const PALETTE = [
  '#1DB954',
  '#1677FF',
  '#EB2F96',
  '#FA8C16',
  '#722ED1',
  '#13C2C2',
  '#FADB14',
  '#F5222D',
  '#2F54EB',
  '#A0D911',
  '#FA541C',
  '#9254DE',
  '#08979C',
  '#D4380D',
  '#7CB305',
  '#C41D7F',
  '#36CFC9',
  '#FFC53D',
  '#597EF7',
  '#FF85C0',
];

/** Fixed colour per charted artist (by rank), grey for everyone else, null if not charted. */
export const seriesColor = (series: string[], artist: string): string | null => {
  if (artist === OTHER_ARTISTS) return '#8C8C8C';
  const i = series.indexOf(artist);
  return i < 0 ? null : PALETTE[i % PALETTE.length];
};
