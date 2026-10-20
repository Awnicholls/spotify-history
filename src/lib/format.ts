import dayjs from 'dayjs';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const formatNumber = (n: number): string => n.toLocaleString();

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Exact hours and minutes, however large: "1,563h 58m". Used as the hover detail for days. */
export const formatHours = (ms: number): string => {
  const h = Math.floor(ms / HOUR);
  const m = Math.floor((ms % HOUR) / MINUTE);
  return `${h.toLocaleString()}h ${pad2(m)}m`;
};

/** Scales the unit to the size: 42s · 3m 20s · 12h 05m · 65d 03h · 1,204d 07h */
export const formatDuration = (ms: number): string => {
  if (ms < MINUTE) {return `${Math.round(ms / 1000)}s`;}
  if (ms < HOUR) {return `${Math.floor(ms / MINUTE)}m ${pad2(Math.round((ms % MINUTE) / 1000))}s`;}
  if (ms < DAY) {return formatHours(ms);}
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  return `${d.toLocaleString()}d ${pad2(h)}h`;
};

/** Hover text for a duration: exact hours once the display has switched to days. */
export const durationDetail = (ms: number): string | undefined =>
  ms >= DAY ? formatHours(ms) : undefined;

/** Track position, e.g. 3:07 or 1:02:45. */
export const formatClock = (ms: number): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
};

export const formatDate = (ts: number): string => (ts ? dayjs(ts).format('D MMM YYYY') : '');

export const formatDateTime = (ts: number): string => (ts ? dayjs(ts).format('D MMM YYYY HH:mm') : '');

export const formatPercent = (ratio: number): string => `${(ratio * 100).toFixed(1)}%`;

/** spotify:track:abc -> https://open.spotify.com/track/abc */
export const spotifyUrl = (uri: string): null | string => {
  const [scheme, type, id] = uri.split(':');
  return scheme === 'spotify' && type && id ? `https://open.spotify.com/${type}/${id}` : null;
};
