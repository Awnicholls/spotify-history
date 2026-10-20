/**
 * One row of Spotify's *extended* streaming history export
 * (`Streaming_History_Audio_*.json`, `Streaming_History_Video_*.json`, older `endsong_*.json`).
 * Every field can be null depending on the content type and the age of the export.
 */
export interface RawStreamRecord {
  audiobook_chapter_title?: null | string;
  audiobook_chapter_uri?: null | string;
  audiobook_title?: null | string;
  audiobook_uri?: null | string;
  conn_country?: null | string;
  episode_name?: null | string;
  episode_show_name?: null | string;
  incognito_mode?: boolean | null;
  ip_addr?: null | string;
  master_metadata_album_album_name?: null | string;
  master_metadata_album_artist_name?: null | string;
  master_metadata_track_name?: null | string;
  ms_played: number;
  offline?: boolean | null;
  offline_timestamp?: null | number;
  platform?: null | string;
  reason_end?: null | string;
  reason_start?: null | string;
  shuffle?: boolean | null;
  skipped?: boolean | null;
  spotify_episode_uri?: null | string;
  spotify_track_uri?: null | string;
  ts: string;
}

export type PlayKind = 'audiobook' | 'episode' | 'track';

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
  album: string;
  artist: string;
  country: string;
  /** Specific device within the family, e.g. "Samsung SM-J321AZ", "Xbox One X", "Chrome on Windows 10". */
  device: string;
  incognito: boolean;
  kind: PlayKind;
  ms: number;
  offline: boolean;
  /** Device family, e.g. "Android", "Windows", "Xbox", "Web player". */
  platform: string;
  reasonEnd: string;
  reasonStart: string;
  shuffle: boolean;
  skipped: boolean;
  title: string;
  /** Stream end time, epoch ms (Spotify's `ts` is when the stream stopped). */
  ts: number;
  /** spotify:track:..., spotify:episode:... or spotify:chapter:... ('' if unknown) */
  uri: string;
}

/** Bump when `Play` changes shape; `lib/storage.ts` migrates older saves. */
export const HISTORY_VERSION = 2;

export interface StoredHistory {
  /** Names of the history files that were read, for display. */
  files: string[];
  importedAt: number;
  /** Migrated from a save that predates per-device names - re-importing fills them in. */
  legacyDevices?: boolean;
  plays: Play[];
  version: typeof HISTORY_VERSION;
}
