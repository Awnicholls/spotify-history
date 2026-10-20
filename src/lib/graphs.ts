import type { Play } from '../types/history';

/**
 * Data shaping for the Graphs page. Per-year buckets are built once over the whole history so
 * changing the year scope is just summing a few small arrays.
 *
 * All dates use the computer's local time zone (Spotify's `ts` is UTC).
 */

export type YearRange = [number, number];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const inRange = (year: number, [from, to]: YearRange) => year >= from && year <= to;

// ---------------------------------------------------------------------------------------------
// Month / day heatmap

/** Index into a 12 x 31 grid. */
const mdIndex = (month: number, day: number) => month * 31 + (day - 1);

export interface DayBuckets {
  /** year -> ms listened per month/day cell (12 * 31). */
  ms: Map<number, Float64Array>;
  /** year -> streams per cell. */
  streams: Map<number, Uint32Array>;
}

export const buildDayBuckets = (plays: Play[]): DayBuckets => {
  const ms = new Map<number, Float64Array>();
  const streams = new Map<number, Uint32Array>();
  for (const p of plays) {
    const d = new Date(p.ts);
    const year = d.getFullYear();
    let m = ms.get(year);
    let s = streams.get(year);
    if (!m || !s) {
      m = new Float64Array(12 * 31);
      s = new Uint32Array(12 * 31);
      ms.set(year, m);
      streams.set(year, s);
    }
    const i = mdIndex(d.getMonth(), d.getDate());
    m[i] += p.ms;
    s[i]++;
  }
  return { ms, streams };
};

export interface DayCell {
  month: number;
  day: number;
  ms: number;
  streams: number;
}

export interface MonthGrid {
  month: number;
  /** Days 1..N (N = longest month length across the selected years). */
  days: DayCell[];
  ms: number;
  streams: number;
  /** Weekday (0 = Monday) of the 1st - only meaningful when a single year is selected. */
  firstWeekday: number;
}

const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

/** Sum the selected years into 12 month grids. */
export const monthGrids = (buckets: DayBuckets, range: YearRange): { months: MonthGrid[]; maxMs: number; maxStreams: number } => {
  const ms = new Float64Array(12 * 31);
  const streams = new Uint32Array(12 * 31);
  for (const [year, arr] of buckets.ms) {
    if (!inRange(year, range)) continue;
    const s = buckets.streams.get(year)!;
    for (let i = 0; i < arr.length; i++) {
      ms[i] += arr[i];
      streams[i] += s[i];
    }
  }

  const single = range[0] === range[1];
  let maxMs = 0;
  let maxStreams = 0;
  const months: MonthGrid[] = Array.from({ length: 12 }, (_, month) => {
    // Feb shows the 29th only if a selected year is a leap year.
    let length = 28;
    for (let y = range[0]; y <= range[1]; y++) length = Math.max(length, daysIn(y, month));
    const days: DayCell[] = [];
    let monthMs = 0;
    let monthStreams = 0;
    for (let day = 1; day <= length; day++) {
      const i = mdIndex(month, day);
      days.push({ month, day, ms: ms[i], streams: streams[i] });
      monthMs += ms[i];
      monthStreams += streams[i];
      if (ms[i] > maxMs) maxMs = ms[i];
      if (streams[i] > maxStreams) maxStreams = streams[i];
    }
    const firstWeekday = single ? (new Date(range[0], month, 1).getDay() + 6) % 7 : 0;
    return { month, days, ms: monthMs, streams: monthStreams, firstWeekday };
  });
  return { months, maxMs, maxStreams };
};

/** Plays on a month/day (or a whole month when `day` is null) in the selected years. */
export const playsOnDate = (plays: Play[], month: number, day: number | null, range: YearRange): Play[] =>
  plays.filter((p) => {
    const d = new Date(p.ts);
    return d.getMonth() === month && (day === null || d.getDate() === day) && inRange(d.getFullYear(), range);
  });

// ---------------------------------------------------------------------------------------------
// Time of day

/** year -> ms per weekday (0 = Monday) x hour (7 * 24). */
export type HourBuckets = Map<number, Float64Array>;

export const buildHourBuckets = (plays: Play[]): HourBuckets => {
  const out: HourBuckets = new Map();
  for (const p of plays) {
    const d = new Date(p.ts);
    const year = d.getFullYear();
    let arr = out.get(year);
    if (!arr) out.set(year, (arr = new Float64Array(7 * 24)));
    arr[((d.getDay() + 6) % 7) * 24 + d.getHours()] += p.ms;
  }
  return out;
};

export const hourGrid = (buckets: HourBuckets, range: YearRange): { cells: number[][]; max: number } => {
  const sum = new Float64Array(7 * 24);
  for (const [year, arr] of buckets) {
    if (!inRange(year, range)) continue;
    for (let i = 0; i < arr.length; i++) sum[i] += arr[i];
  }
  const cells = Array.from({ length: 7 }, (_, wd) => Array.from(sum.subarray(wd * 24, wd * 24 + 24)));
  return { cells, max: Math.max(0, ...sum) };
};

// ---------------------------------------------------------------------------------------------
// Top bands per month

export const OTHER_ARTISTS = 'Everyone else';
export const MONTHLY_TOP = 10;

export interface MonthTopArtist {
  artist: string;
  hours: number;
  streams: number;
  /** Their most-streamed tracks that month, for "play". */
  uris: string[];
}

export interface MonthTop {
  /** 'YYYY-MM' */
  month: string;
  hours: number;
  /** That month's own top 10 artists by time listened. */
  top: MonthTopArtist[];
}

export interface ArtistTrend {
  /** Chart series: the most-listened artists over the period (plus Everyone else if asked). */
  series: string[];
  /** One row per month: { month: 'YYYY-MM', [artist]: hours }. */
  rows: Record<string, number | string>[];
  /** Every month's own top 10, oldest first. */
  months: MonthTop[];
}

const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/**
 * Month-by-month listening per artist (tracks only). The chart plots the `seriesCount` biggest
 * artists of the whole period; each month also keeps its own top 10.
 */
export const artistTrend = (plays: Play[], seriesCount: number, includeOthers: boolean): ArtistTrend => {
  interface Acc {
    ms: number;
    streams: number;
    uris: Map<string, number>;
  }
  const perMonth = new Map<string, Map<string, Acc>>();
  const totals = new Map<string, number>();
  let first: Date | null = null;
  let last: Date | null = null;

  for (const p of plays) {
    if (p.kind !== 'track' || p.ms <= 0) continue;
    const d = new Date(p.ts);
    if (!first || d < first) first = d;
    if (!last || d > last) last = d;
    const key = monthKey(d);
    let month = perMonth.get(key);
    if (!month) perMonth.set(key, (month = new Map()));
    let acc = month.get(p.artist);
    if (!acc) month.set(p.artist, (acc = { ms: 0, streams: 0, uris: new Map() }));
    acc.ms += p.ms;
    acc.streams++;
    if (p.uri) acc.uris.set(p.uri, (acc.uris.get(p.uri) ?? 0) + 1);
    totals.set(p.artist, (totals.get(p.artist) ?? 0) + p.ms);
  }

  const top = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, seriesCount)
    .map(([a]) => a);
  const topSet = new Set(top);
  const series = includeOthers && totals.size > top.length ? [...top, OTHER_ARTISTS] : top;

  const rows: Record<string, number | string>[] = [];
  const months: MonthTop[] = [];
  if (first && last) {
    // Every month in between, so quiet months show as dips rather than being skipped.
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    const end = new Date(last.getFullYear(), last.getMonth(), 1);
    while (cursor <= end) {
      const key = monthKey(cursor);
      const artists = perMonth.get(key) ?? new Map<string, Acc>();
      const row: Record<string, number | string> = { month: key };
      for (const s of series) row[s] = 0;
      let monthMs = 0;
      for (const [artist, acc] of artists) {
        monthMs += acc.ms;
        if (topSet.has(artist)) row[artist] = acc.ms / 3_600_000;
        else if (includeOthers) row[OTHER_ARTISTS] = (row[OTHER_ARTISTS] as number) + acc.ms / 3_600_000;
      }
      rows.push(row);
      months.push({
        month: key,
        hours: monthMs / 3_600_000,
        top: [...artists.entries()]
          .sort((a, b) => b[1].ms - a[1].ms)
          .slice(0, MONTHLY_TOP)
          .map(([artist, acc]) => ({
            artist,
            hours: acc.ms / 3_600_000,
            streams: acc.streams,
            uris: [...acc.uris.entries()]
              .sort((a, b) => b[1] - a[1])
              .slice(0, 50)
              .map(([u]) => u),
          })),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return { series, rows, months };
};
