import { strFromU8, unzipSync } from 'fflate';

import type { Play, PlayKind, RawStreamRecord } from '../types/history';

/**
 * Reads Spotify "Extended streaming history" exports.
 *
 * Accepts the `my_spotify_data.zip` Spotify emails you (any folder layout inside), or the
 * extracted `Streaming_History_*.json` files dropped directly. Only the extended format is
 * supported - the basic "Account data" export (`StreamingHistory_music_0.json`) lacks the
 * fields the tables need, so it gets a helpful error instead.
 */

export interface ImportResult {
  /** Identical rows seen more than once, e.g. the same file dropped twice. */
  duplicates: number;
  files: string[];
  /** Rows with no track/episode/chapter metadata (local files, corrupt rows, ...). */
  ignored: number;
  plays: Play[];
}

const EXTENDED_FILE = /(^|\/)(Streaming_History_(Audio|Video)_[^/]*|endsong_\d+)\.json$/i;
const BASIC_FILE = /(^|\/)StreamingHistory[^/]*\.json$/i;

const baseName = (path: string): string => path.split('/').pop() ?? path;

/** Collapse Spotify's very specific platform strings into a device family. */
export const normalizePlatform = (raw: null | string | undefined): string => {
  const p = (raw ?? '').trim().toLowerCase();
  if (!p || p === 'unknown') {return 'Unknown';}
  if (p.includes('xbox')) {return 'Xbox';}
  if (p.includes('playstation') || p.includes('ps4') || p.includes('ps5')) {return 'PlayStation';}
  if (p.includes('web_player') || p.includes('webplayer')) {return 'Web player';}
  if (p.includes('android')) {return 'Android';}
  if (p.startsWith('ios') || p.includes('iphone') || p.includes('ipad')) {return 'iOS';}
  if (p.includes('windows')) {return 'Windows';}
  if (p.includes('os x') || p.includes('osx') || p.includes('macos') || p.includes('mac os')) {return 'macOS';}
  if (p.includes('linux')) {return 'Linux';}
  if (p.includes('cast')) {return 'Chromecast';}
  if (p.includes('sonos')) {return 'Sonos';}
  if (p.includes('tv')) {return 'TV';}
  const trimmed = raw?.trim();
  if (!trimmed) {return 'Unknown';}
  return trimmed;
};

const titleCase = (s: string): string => (s ? s[0].toUpperCase() + s.slice(1) : s);

/**
 * The specific device inside a family, from Spotify's raw platform string. Examples:
 * - `Android OS 9 API 28 (motorola, moto g(7) supra)` -> `Motorola moto g(7) supra`
 * - `Partner windows_tv microsoft;xbox_one_x;...` -> `Xbox One X`
 * - `web_player windows 10;chrome 73.0.3683.103;desktop` -> `Chrome on Windows 10`
 * - `Windows 10 (10.0.19043; x64)` -> `Windows 10`
 * Bare strings like `android` or `windows` (what newer exports use) map to "<family> (unspecified)".
 */
export const deviceName = (raw: null | string | undefined, family: string): string => {
  const r = (raw ?? '').trim();
  const p = r.toLowerCase();
  const unspecified = `${family} (unspecified)`;

  switch (family) {
    case 'Xbox': {
      const token = p.match(/xbox[a-z0-9_]*/)?.[0] ?? 'xbox';
      if (token === 'xbox') {return unspecified;}
      return token
        .split('_')
        .map((w) => (w.length <= 1 ? w.toUpperCase() : titleCase(w)))
        .join(' ');
    }
    case 'Android': {
      const m = r.match(/\(([^,()]+),\s*(.+)\)\s*$/);
      if (!m) {return unspecified;}
      const brand = m[1].trim();
      const model = m[2].trim().replace(new RegExp(`^${brand.replace(/[^a-z0-9]/gi, '.')}[-_ ]`, 'i'), '');
      return `${titleCase(brand)} ${model}${p.includes('tablet') ? ' (tablet)' : ''}`;
    }
    case 'iOS': {
      const m = r.match(/\((i(?:phone|pad|pod)[^)]*)\)/i);
      return m ? m[1] : unspecified;
    }
    case 'Web player': {
      const m = p.match(/web_player\s+([^;]+);([a-z ]+?)\s[\d.]+/);
      return m ? `${titleCase(m[2].trim())} on ${titleCase(m[1].trim())}` : 'Web player';
    }
    case 'Windows': {
      const m = r.match(/windows\s+(\d+|xp|vista)/i);
      return m ? `Windows ${m[1]}` : unspecified;
    }
    case 'macOS': {
      const m = r.match(/os x\s+(\d+\.\d+)/i);
      return m ? `macOS ${m[1]}` : unspecified;
    }
    default:
      return r && r.toLowerCase() !== family.toLowerCase() ? r.slice(0, 80) : family;
  }
};

const isRecord = (value: unknown): value is RawStreamRecord =>
  typeof value === 'object' &&
  value !== null &&
  'ts' in value &&
  typeof value.ts === 'string' &&
  'ms_played' in value &&
  typeof value.ms_played === 'number';

/** Map one raw row to a Play, or null when it has nothing to attribute the stream to. */
export const toPlay = (r: RawStreamRecord): null | Play => {
  let kind: PlayKind;
  let title: string;
  let artist: string;
  let album = '';
  let uri: string;

  if (r.master_metadata_track_name) {
    kind = 'track';
    title = r.master_metadata_track_name;
    artist = r.master_metadata_album_artist_name ?? 'Unknown artist';
    album = r.master_metadata_album_album_name ?? 'Unknown album';
    uri = r.spotify_track_uri ?? '';
  } else if (r.episode_name || r.episode_show_name) {
    kind = 'episode';
    title = r.episode_name ?? 'Unknown episode';
    artist = r.episode_show_name ?? 'Unknown show';
    uri = r.spotify_episode_uri ?? '';
  } else if (r.audiobook_title || r.audiobook_chapter_title) {
    kind = 'audiobook';
    title = r.audiobook_chapter_title ?? 'Unknown chapter';
    artist = r.audiobook_title ?? 'Unknown audiobook';
    uri = r.audiobook_chapter_uri ?? r.audiobook_uri ?? '';
  } else {
    return null;
  }

  const ts = Date.parse(r.ts);
  if (Number.isNaN(ts)) {return null;}

  const reasonEnd = r.reason_end ?? 'unknown';
  const platform = normalizePlatform(r.platform);
  return {
    album,
    artist,
    country: r.conn_country ?? '',
    device: deviceName(r.platform, platform),
    incognito: r.incognito_mode === true,
    kind,
    ms: Math.max(0, r.ms_played),
    offline: r.offline === true,
    platform,
    reasonEnd,
    reasonStart: r.reason_start ?? 'unknown',
    shuffle: r.shuffle === true,
    // Older exports leave `skipped` null; pressing "next" is the best stand-in there.
    skipped: r.skipped ?? reasonEnd === 'fwdbtn',
    title,
    ts,
    uri,
  };
};

interface JsonSource {
  name: string;
  text: string;
}

const readZip = async (file: File): Promise<{ sawBasic: boolean; sources: JsonSource[]; }> => {
  const data = new Uint8Array(await file.arrayBuffer());
  let sawBasic = false;
  const entries = unzipSync(data, {
    filter: ({ name }) => {
      if (name.startsWith('__MACOSX/')) {return false;}
      if (BASIC_FILE.test(name)) {sawBasic = true;}
      return EXTENDED_FILE.test(name);
    },
  });
  const sources = Object.entries(entries).map(([name, bytes]) => ({
    name: baseName(name),
    text: strFromU8(bytes),
  }));
  return { sawBasic, sources };
};

/** Let the UI paint a spinner before a long synchronous chunk of work. */
const nextFrame = (): Promise<void> => new Promise<void>((resolve) => setTimeout(resolve, 0));

export const parseHistoryFiles = async (files: File[]): Promise<ImportResult> => {
  await nextFrame();

  // Read every dropped file (zips and loose JSON) in parallel.
  const read = await Promise.all(
    files.map(async (file): Promise<{ sawBasic: boolean; sources: JsonSource[] }> => {
      const lower = file.name.toLowerCase();
      if (lower.endsWith('.zip')) {return readZip(file);}
      if (lower.endsWith('.json') && EXTENDED_FILE.test(file.name)) {
        return { sawBasic: false, sources: [{ name: file.name, text: await file.text() }] };
      }
      return { sawBasic: lower.endsWith('.json') && BASIC_FILE.test(file.name), sources: [] };
    }),
  );
  const sources = read.flatMap((r) => r.sources);
  const sawBasic = read.some((r) => r.sawBasic);

  if (sources.length === 0) {
    throw new Error(
      sawBasic
        ? 'That looks like the basic "Account data" export. This app needs the "Extended streaming history" export - files named Streaming_History_Audio_*.json.'
        : 'No extended streaming history found. Add the my_spotify_data.zip from Spotify, or the Streaming_History_Audio_*.json files inside it.',
    );
  }

  const seen = new Set<string>();
  const plays: Play[] = [];
  let ignored = 0;
  let duplicates = 0;

  for (const source of sources) {
    let rows: unknown;
    try {
      rows = JSON.parse(source.text);
    } catch {
      throw new Error(`${source.name} is not valid JSON.`);
    }
    if (!Array.isArray(rows)) {throw new Error(`${source.name} is not a streaming history file.`);}

    for (const row of rows) {
      if (!isRecord(row)) {
        ignored++;
        continue;
      }
      const play = toPlay(row);
      if (!play) {
        ignored++;
        continue;
      }
      const key = `${play.ts}|${play.uri || play.title}|${play.ms}`;
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key);
      plays.push(play);
    }
  }

  plays.sort((a, b) => a.ts - b.ts);

  return {
    duplicates,
    files: [...new Set(sources.map((s) => s.name))].toSorted(),
    ignored,
    plays,
  };
};
