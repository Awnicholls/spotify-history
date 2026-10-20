import type { Play, PlayKind } from '../types/history';

/**
 * Turns a list of plays into ranked per-song / per-artist / ... rows.
 *
 * Terminology used across the UI:
 * - **stream**: any row in the export, however short.
 * - **play**: a stream that lasted at least `minPlayMs` (Spotify itself counts 30s as a play).
 * - **skip**: Spotify's `skipped` flag (or "next" pressed, for old exports without it).
 */

export type StatCategory = 'albums' | 'artists' | 'audiobooks' | 'episodes' | 'platforms' | 'shows' | 'songs';

export interface StatRow {
  album: string;
  artist: string;
  avgMs: number;
  /** Devices tab: the specific devices within a family. */
  children?: StatRow[];
  firstTs: number;
  key: string;
  lastTs: number;
  ms: number;
  name: string;
  plays: number;
  /** Position when ranked by plays, then time listened. 0 for nested (child) rows. */
  rank: number;
  skipRate: number;
  skips: number;
  streams: number;
  /** Distinct songs/episodes/chapters within the row (artists, albums, shows, ...). */
  uniqueItems: number;
  /** The row's own Spotify URI (most-played one, for songs that exist on several releases). */
  uri: string;
  /** Up to 50 track/episode URIs in the row, most played first - what "play" queues up. */
  uris: string[];
}

interface CategoryDef {
  album?: (p: Play) => string;
  artist?: (p: Play) => string;
  key: (p: Play) => string;
  kinds: null | PlayKind[];
  name: (p: Play) => string;
  /** Rows that are a single track/episode get `uri`; the rest only queue `uris`. */
  singleItem?: boolean;
  unique?: (p: Play) => string;
}

const SEP = '\u0000';
const MAX_QUEUE = 50;
const songKey = (p: Play): string => `${p.title}${SEP}${p.artist}`;

export const CATEGORY_DEFS: Record<StatCategory, CategoryDef> = {
  albums: {
    artist: (p) => p.artist,
    key: (p) => `${p.album}${SEP}${p.artist}`,
    kinds: ['track'],
    name: (p) => p.album,
    unique: (p) => p.title,
  },
  artists: {
    key: (p) => p.artist,
    kinds: ['track'],
    name: (p) => p.artist,
    unique: songKey,
  },
  audiobooks: {
    key: (p) => p.artist,
    kinds: ['audiobook'],
    name: (p) => p.artist,
    unique: (p) => p.uri || p.title,
  },
  episodes: {
    artist: (p) => p.artist,
    key: (p) => p.uri || `${p.title}${SEP}${p.artist}`,
    kinds: ['episode'],
    name: (p) => p.title,
    singleItem: true,
  },
  platforms: {
    key: (p) => p.platform,
    kinds: null,
    name: (p) => p.platform,
    unique: (p) => `${p.kind}${SEP}${p.title}${SEP}${p.artist}`,
  },
  shows: {
    key: (p) => p.artist,
    kinds: ['episode'],
    name: (p) => p.artist,
    unique: (p) => p.uri || p.title,
  },
  // Songs group by title + artist, so the same song on a single and an album counts once.
  songs: {
    album: (p) => p.album,
    artist: (p) => p.artist,
    key: songKey,
    kinds: ['track'],
    name: (p) => p.title,
    singleItem: true,
  },
};

/** Devices tab, second level: one row per specific device inside a family. */
const DEVICE_DEF: CategoryDef = {
  ...CATEGORY_DEFS.platforms,
  key: (p) => `${p.platform}${SEP}${p.device}`,
  name: (p) => p.device,
};

interface Acc {
  row: StatRow;
  uniques: null | Set<string>;
  uriCounts: Map<string, number> | null;
}

const group = (plays: Play[], def: CategoryDef, minPlayMs: number, collectUris: boolean): StatRow[] => {
  const groups = new Map<string, Acc>();

  for (const p of plays) {
    if (def.kinds && !def.kinds.includes(p.kind)) {continue;}
    const key = def.key(p);
    let acc = groups.get(key);
    if (!acc) {
      acc = {
        row: {
          album: def.album?.(p) ?? '',
          artist: def.artist?.(p) ?? '',
          avgMs: 0,
          firstTs: p.ts,
          key,
          lastTs: p.ts,
          ms: 0,
          name: def.name(p),
          plays: 0,
          rank: 0,
          skipRate: 0,
          skips: 0,
          streams: 0,
          uniqueItems: 0,
          uri: '',
          uris: [],
        },
        uniques: def.unique ? new Set() : null,
        uriCounts: collectUris ? new Map() : null,
      };
      groups.set(key, acc);
    }
    const r = acc.row;
    r.streams++;
    r.ms += p.ms;
    if (p.ms >= minPlayMs) {r.plays++;}
    if (p.skipped) {r.skips++;}
    if (p.ts < r.firstTs) {r.firstTs = p.ts;}
    if (p.ts > r.lastTs) {r.lastTs = p.ts;}
    if (acc.uniques && def.unique) {acc.uniques.add(def.unique(p));}
    if (acc.uriCounts && p.uri) {acc.uriCounts.set(p.uri, (acc.uriCounts.get(p.uri) ?? 0) + 1);}
  }

  return [...groups.values()].map(({ row, uniques, uriCounts }) => {
    row.avgMs = row.streams ? row.ms / row.streams : 0;
    row.skipRate = row.streams ? row.skips / row.streams : 0;
    row.uniqueItems = uniques?.size ?? 0;
    if (uriCounts) {
      row.uris = [...uriCounts.entries()]
        .toSorted((a, b) => b[1] - a[1])
        .slice(0, MAX_QUEUE)
        .map(([uri]) => uri);
      if (def.singleItem) {row.uri = row.uris[0] ?? '';}
    }
    return row;
  });
};

const byRank = (a: StatRow, b: StatRow): number => b.plays - a.plays || b.ms - a.ms || a.name.localeCompare(b.name);

export const aggregate = (plays: Play[], category: StatCategory, minPlayMs: number): StatRow[] => {
  const def = CATEGORY_DEFS[category];
  const rows = group(plays, def, minPlayMs, category !== 'platforms').toSorted(byRank);
  rows.forEach((row, i) => {
    row.rank = i + 1;
  });

  if (category === 'platforms') {
    // Nest specific devices under their family when a family has more than one.
    const devices = new Map<string, StatRow[]>();
    for (const d of group(plays, DEVICE_DEF, minPlayMs, false)) {
      const family = d.key.split(SEP)[0];
      devices.set(family, [...(devices.get(family) ?? []), d]);
    }
    for (const row of rows) {
      const children = devices.get(row.key);
      if (children && children.length > 1) {row.children = children.toSorted(byRank);}
    }
  }
  return rows;
};

// ---------------------------------------------------------------------------------------------
// Filters

/** Device selection keys used by the filter tree: a whole family, or one device in it. */
export const familyKey = (family: string): string => `f:${family}`;
export const deviceKey = (family: string, device: string): string => `d:${family}${SEP}${device}`;

export interface PlayFilters {
  /** `familyKey`/`deviceKey` values to keep; empty = all devices. */
  devices: string[];
  includeIncognito: boolean;
  /** Streams at least this long count as a play. */
  minPlaySeconds: number;
  /** Inclusive [start, end] epoch ms, or null for all time. */
  range: [number, number] | null;
}

export const DEFAULT_FILTERS: PlayFilters = {
  devices: [],
  includeIncognito: true,
  minPlaySeconds: 30,
  range: null,
};

export const filterPlays = (plays: Play[], f: PlayFilters): Play[] => {
  const devices = f.devices.length ? new Set(f.devices) : null;
  if (!f.range && !devices && f.includeIncognito) {return plays;}
  return plays.filter(
    (p) =>
      (!f.range || (p.ts >= f.range[0] && p.ts <= f.range[1])) &&
      (!devices || devices.has(familyKey(p.platform)) || devices.has(deviceKey(p.platform, p.device))) &&
      (f.includeIncognito || !p.incognito),
  );
};

export interface DeviceNode {
  children?: DeviceNode[];
  streams: number;
  title: string;
  value: string;
}

/** Family -> device tree for the device filter, most-used first. */
export const deviceTreeOf = (plays: Play[]): DeviceNode[] => {
  const families = new Map<string, { devices: Map<string, number>; streams: number; }>();
  for (const p of plays) {
    let fam = families.get(p.platform);
    if (!fam) {
      fam = { devices: new Map(), streams: 0 };
      families.set(p.platform, fam);
    }
    fam.streams++;
    fam.devices.set(p.device, (fam.devices.get(p.device) ?? 0) + 1);
  }
  return [...families.entries()]
    .toSorted((a, b) => b[1].streams - a[1].streams)
    .map(([family, { devices, streams }]) => ({
      children:
        devices.size > 1
          ? [...devices.entries()]
              .toSorted((a, b) => b[1] - a[1])
              .map(([device, n]) => ({ streams: n, title: device, value: deviceKey(family, device) }))
          : undefined,
      streams,
      title: family,
      value: familyKey(family),
    }));
};

/** Calendar years present in the data, newest first - for the date select. */
export const yearsOf = (plays: Play[]): number[] => {
  const years = new Set<number>();
  for (const p of plays) {years.add(new Date(p.ts).getFullYear());}
  return [...years].toSorted((a, b) => b - a);
};

// ---------------------------------------------------------------------------------------------
// Summary

export interface Summary {
  albums: number;
  artists: number;
  daysListened: number;
  episodes: number;
  firstTs: number;
  lastTs: number;
  ms: number;
  plays: number;
  shows: number;
  skips: number;
  songs: number;
  streams: number;
}

export const summarize = (plays: Play[], minPlayMs: number): Summary => {
  const songs = new Set<string>();
  const artists = new Set<string>();
  const albums = new Set<string>();
  const episodes = new Set<string>();
  const shows = new Set<string>();
  const days = new Set<string>();
  const s: Summary = {
    albums: 0,
    artists: 0,
    daysListened: 0,
    episodes: 0,
    firstTs: plays[0]?.ts ?? 0,
    lastTs: plays[plays.length - 1]?.ts ?? 0,
    ms: 0,
    plays: 0,
    shows: 0,
    skips: 0,
    songs: 0,
    streams: plays.length,
  };

  for (const p of plays) {
    s.ms += p.ms;
    if (p.ms >= minPlayMs) {s.plays++;}
    if (p.skipped) {s.skips++;}
    const d = new Date(p.ts);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    if (p.kind === 'track') {
      songs.add(songKey(p));
      artists.add(p.artist);
      albums.add(`${p.album}${SEP}${p.artist}`);
    } else if (p.kind === 'episode') {
      episodes.add(p.uri || p.title);
      shows.add(p.artist);
    }
  }

  s.songs = songs.size;
  s.artists = artists.size;
  s.albums = albums.size;
  s.episodes = episodes.size;
  s.shows = shows.size;
  s.daysListened = days.size;
  return s;
};
