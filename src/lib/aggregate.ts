import type { Play, PlayKind } from '../types/history';

/**
 * Turns a list of plays into ranked per-song / per-artist / ... rows.
 *
 * Terminology used across the UI:
 * - **stream**: any row in the export, however short.
 * - **play**: a stream that lasted at least `minPlayMs` (Spotify itself counts 30s as a play).
 * - **skip**: Spotify's `skipped` flag (or "next" pressed, for old exports without it).
 */

export type StatCategory = 'songs' | 'artists' | 'albums' | 'shows' | 'episodes' | 'audiobooks' | 'platforms';

export interface StatRow {
  key: string;
  /** Position when ranked by plays, then time listened. 0 for nested (child) rows. */
  rank: number;
  name: string;
  artist: string;
  album: string;
  /** The row's own Spotify URI (most-played one, for songs that exist on several releases). */
  uri: string;
  /** Up to 50 track/episode URIs in the row, most played first - what "play" queues up. */
  uris: string[];
  plays: number;
  streams: number;
  ms: number;
  avgMs: number;
  skips: number;
  skipRate: number;
  /** Distinct songs/episodes/chapters within the row (artists, albums, shows, ...). */
  uniqueItems: number;
  firstTs: number;
  lastTs: number;
  /** Devices tab: the specific devices within a family. */
  children?: StatRow[];
}

interface CategoryDef {
  kinds: PlayKind[] | null;
  key: (p: Play) => string;
  name: (p: Play) => string;
  artist?: (p: Play) => string;
  album?: (p: Play) => string;
  /** Rows that are a single track/episode get `uri`; the rest only queue `uris`. */
  singleItem?: boolean;
  unique?: (p: Play) => string;
}

const SEP = '\u0000';
const MAX_QUEUE = 50;
const songKey = (p: Play) => `${p.title}${SEP}${p.artist}`;

export const CATEGORY_DEFS: Record<StatCategory, CategoryDef> = {
  // Songs group by title + artist, so the same song on a single and an album counts once.
  songs: {
    kinds: ['track'],
    key: songKey,
    name: (p) => p.title,
    artist: (p) => p.artist,
    album: (p) => p.album,
    singleItem: true,
  },
  artists: {
    kinds: ['track'],
    key: (p) => p.artist,
    name: (p) => p.artist,
    unique: songKey,
  },
  albums: {
    kinds: ['track'],
    key: (p) => `${p.album}${SEP}${p.artist}`,
    name: (p) => p.album,
    artist: (p) => p.artist,
    unique: (p) => p.title,
  },
  shows: {
    kinds: ['episode'],
    key: (p) => p.artist,
    name: (p) => p.artist,
    unique: (p) => p.uri || p.title,
  },
  episodes: {
    kinds: ['episode'],
    key: (p) => p.uri || `${p.title}${SEP}${p.artist}`,
    name: (p) => p.title,
    artist: (p) => p.artist,
    singleItem: true,
  },
  audiobooks: {
    kinds: ['audiobook'],
    key: (p) => p.artist,
    name: (p) => p.artist,
    unique: (p) => p.uri || p.title,
  },
  platforms: {
    kinds: null,
    key: (p) => p.platform,
    name: (p) => p.platform,
    unique: (p) => `${p.kind}${SEP}${p.title}${SEP}${p.artist}`,
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
  uniques: Set<string> | null;
  uriCounts: Map<string, number> | null;
}

const group = (plays: Play[], def: CategoryDef, minPlayMs: number, collectUris: boolean): StatRow[] => {
  const groups = new Map<string, Acc>();

  for (const p of plays) {
    if (def.kinds && !def.kinds.includes(p.kind)) continue;
    const key = def.key(p);
    let acc = groups.get(key);
    if (!acc) {
      acc = {
        row: {
          key,
          rank: 0,
          name: def.name(p),
          artist: def.artist?.(p) ?? '',
          album: def.album?.(p) ?? '',
          uri: '',
          uris: [],
          plays: 0,
          streams: 0,
          ms: 0,
          avgMs: 0,
          skips: 0,
          skipRate: 0,
          uniqueItems: 0,
          firstTs: p.ts,
          lastTs: p.ts,
        },
        uniques: def.unique ? new Set() : null,
        uriCounts: collectUris ? new Map() : null,
      };
      groups.set(key, acc);
    }
    const r = acc.row;
    r.streams++;
    r.ms += p.ms;
    if (p.ms >= minPlayMs) r.plays++;
    if (p.skipped) r.skips++;
    if (p.ts < r.firstTs) r.firstTs = p.ts;
    if (p.ts > r.lastTs) r.lastTs = p.ts;
    acc.uniques?.add(def.unique!(p));
    if (acc.uriCounts && p.uri) acc.uriCounts.set(p.uri, (acc.uriCounts.get(p.uri) ?? 0) + 1);
  }

  return [...groups.values()].map(({ row, uniques, uriCounts }) => {
    row.avgMs = row.streams ? row.ms / row.streams : 0;
    row.skipRate = row.streams ? row.skips / row.streams : 0;
    row.uniqueItems = uniques?.size ?? 0;
    if (uriCounts) {
      row.uris = [...uriCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_QUEUE)
        .map(([uri]) => uri);
      if (def.singleItem) row.uri = row.uris[0] ?? '';
    }
    return row;
  });
};

const byRank = (a: StatRow, b: StatRow) => b.plays - a.plays || b.ms - a.ms || a.name.localeCompare(b.name);

export const aggregate = (plays: Play[], category: StatCategory, minPlayMs: number): StatRow[] => {
  const def = CATEGORY_DEFS[category];
  const rows = group(plays, def, minPlayMs, category !== 'platforms').sort(byRank);
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
      if (children && children.length > 1) row.children = children.sort(byRank);
    }
  }
  return rows;
};

// ---------------------------------------------------------------------------------------------
// Filters

/** Device selection keys used by the filter tree: a whole family, or one device in it. */
export const familyKey = (family: string) => `f:${family}`;
export const deviceKey = (family: string, device: string) => `d:${family}${SEP}${device}`;

export interface PlayFilters {
  /** Inclusive [start, end] epoch ms, or null for all time. */
  range: [number, number] | null;
  /** `familyKey`/`deviceKey` values to keep; empty = all devices. */
  devices: string[];
  /** Streams at least this long count as a play. */
  minPlaySeconds: number;
  includeIncognito: boolean;
}

export const DEFAULT_FILTERS: PlayFilters = {
  range: null,
  devices: [],
  minPlaySeconds: 30,
  includeIncognito: true,
};

export const filterPlays = (plays: Play[], f: PlayFilters): Play[] => {
  const devices = f.devices.length ? new Set(f.devices) : null;
  if (!f.range && !devices && f.includeIncognito) return plays;
  return plays.filter(
    (p) =>
      (!f.range || (p.ts >= f.range[0] && p.ts <= f.range[1])) &&
      (!devices || devices.has(familyKey(p.platform)) || devices.has(deviceKey(p.platform, p.device))) &&
      (f.includeIncognito || !p.incognito),
  );
};

export interface DeviceNode {
  value: string;
  title: string;
  streams: number;
  children?: DeviceNode[];
}

/** Family -> device tree for the device filter, most-used first. */
export const deviceTreeOf = (plays: Play[]): DeviceNode[] => {
  const families = new Map<string, { streams: number; devices: Map<string, number> }>();
  for (const p of plays) {
    let fam = families.get(p.platform);
    if (!fam) {
      fam = { streams: 0, devices: new Map() };
      families.set(p.platform, fam);
    }
    fam.streams++;
    fam.devices.set(p.device, (fam.devices.get(p.device) ?? 0) + 1);
  }
  return [...families.entries()]
    .sort((a, b) => b[1].streams - a[1].streams)
    .map(([family, { streams, devices }]) => ({
      value: familyKey(family),
      title: family,
      streams,
      children:
        devices.size > 1
          ? [...devices.entries()]
              .sort((a, b) => b[1] - a[1])
              .map(([device, n]) => ({ value: deviceKey(family, device), title: device, streams: n }))
          : undefined,
    }));
};

/** Calendar years present in the data, newest first - for the date select. */
export const yearsOf = (plays: Play[]): number[] => {
  const years = new Set<number>();
  for (const p of plays) years.add(new Date(p.ts).getFullYear());
  return [...years].sort((a, b) => b - a);
};

// ---------------------------------------------------------------------------------------------
// Summary

export interface Summary {
  streams: number;
  plays: number;
  ms: number;
  skips: number;
  songs: number;
  artists: number;
  albums: number;
  episodes: number;
  shows: number;
  daysListened: number;
  firstTs: number;
  lastTs: number;
}

export const summarize = (plays: Play[], minPlayMs: number): Summary => {
  const songs = new Set<string>();
  const artists = new Set<string>();
  const albums = new Set<string>();
  const episodes = new Set<string>();
  const shows = new Set<string>();
  const days = new Set<string>();
  const s: Summary = {
    streams: plays.length,
    plays: 0,
    ms: 0,
    skips: 0,
    songs: 0,
    artists: 0,
    albums: 0,
    episodes: 0,
    shows: 0,
    daysListened: 0,
    firstTs: plays[0]?.ts ?? 0,
    lastTs: plays[plays.length - 1]?.ts ?? 0,
  };

  for (const p of plays) {
    s.ms += p.ms;
    if (p.ms >= minPlayMs) s.plays++;
    if (p.skipped) s.skips++;
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
