/**
 * One row of Spotify's *extended* streaming history export
 * (`Streaming_History_Audio_*.json`, `Streaming_History_Video_*.json`, older `endsong_*.json`).
 * Every field can be null depending on the content type and the age of the export.
 */
export interface RawStreamRecord {
  ts: string;
  platform?: string | null;
  ms_played: number;
  conn_country?: string | null;
  ip_addr?: string | null;
  master_metadata_track_name?: string | null;
  master_metadata_album_artist_name?: string | null;
  master_metadata_album_album_name?: string | null;
  spotify_track_uri?: string | null;
  episode_name?: string | null;
  episode_show_name?: string | null;
  spotify_episode_uri?: string | null;
  audiobook_title?: string | null;
  audiobook_uri?: string | null;
  audiobook_chapter_uri?: string | null;
  audiobook_chapter_title?: string | null;
  reason_start?: string | null;
  reason_end?: string | null;
  shuffle?: boolean | null;
  skipped?: boolean | null;
  offline?: boolean | null;
  offline_timestamp?: number | null;
  incognito_mode?: boolean | null;
}

export type PlayKind = 'track' | 'episode' | 'audiobook';

/**
 * A normalised stream. Field meaning depends on `kind`:
 *
 * | kind      | title           | artist          | album          |
 * |-----------|-----------------|-----------------|----------------|
 * | track     | track name      | album artist    | album name     |
 * | episode   | episode name    | show name       | ''             |
 * | audiobook | chapter title   | audiobook title | ''             |
 */
export interface Play {
  /** Stream end time, epoch ms (Spotify's `ts` is when the stream stopped). */
  ts: number;
  ms: number;
  kind: PlayKind;
  title: string;
  artist: string;
  album: string;
  /** spotify:track:..., spotify:episode:... or spotify:chapter:... ('' if unknown) */
  uri: string;
  /** Device family, e.g. "Android", "Windows", "Xbox", "Web player". */
  platform: string;
  /** Specific device within the family, e.g. "Samsung SM-J321AZ", "Xbox One X", "Chrome on Windows 10". */
  device: string;
  country: string;
  reasonStart: string;
  reasonEnd: string;
  shuffle: boolean;
  skipped: boolean;
  offline: boolean;
  incognito: boolean;
}

/** Bump when `Play` changes shape; `lib/storage.ts` migrates older saves. */
export const HISTORY_VERSION = 2;

export interface StoredHistory {
  version: typeof HISTORY_VERSION;
  importedAt: number;
  /** Names of the history files that were read, for display. */
  files: string[];
  plays: Play[];
  /** Migrated from a save that predates per-device names - re-importing fills them in. */
  legacyDevices?: boolean;
}
