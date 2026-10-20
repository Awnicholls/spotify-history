/**
 * Thin Spotify Web API client for the renderer. Tokens come from the main process (which owns
 * the refresh token); every call retries once with a forced refresh on 401.
 *
 * Endpoints follow the February 2026 Web API changes (`POST /me/playlists`,
 * `POST /playlists/{id}/items`).
 */

import { runSequentially } from '../lib/async';

const API = 'https://api.spotify.com/v1';

export class SpotifyApiError extends Error {
  status: number;
  reason?: string;
  constructor(status: number, message: string, reason?: string) {
    super(message);
    this.status = status;
    this.reason = reason;
  }
}

export class NotSignedInError extends Error {
  constructor() {
    super('Connect Spotify first.');
  }
}

export type TokenSource = (forceRefresh?: boolean) => Promise<null | string>;

export interface SpotifyImage {
  height: null | number;
  url: string;
  width: null | number;
}

export interface SpotifyDevice {
  id: null | string;
  is_active: boolean;
  is_restricted: boolean;
  name: string;
  supports_volume?: boolean;
  type: string;
  volume_percent: null | number;
}

interface PlayableItem {
  album?: { images: SpotifyImage[]; name: string; uri: string };
  // track
  artists?: { name: string }[];
  duration_ms: number;
  external_urls?: { spotify?: string };
  images?: SpotifyImage[];
  name: string;
  // episode
  show?: { images: SpotifyImage[]; name: string; };
  uri: string;
}

export interface PlaybackState {
  device: null | SpotifyDevice;
  is_playing: boolean;
  item: null | PlayableItem;
  progress_ms: null | number;
  repeat_state: 'context' | 'off' | 'track';
  shuffle_state: boolean;
}

export interface SpotifyUser {
  display_name: null | string;
  id: string;
  images?: SpotifyImage[];
}

export interface CreatedPlaylist {
  external_urls: { spotify: string };
  id: string;
  name: string;
  uri: string;
}

export interface SpotifyApi {
  createPlaylist: (name: string, description: string, isPublic: boolean, uris: string[]) => Promise<CreatedPlaylist>;
  devices: () => Promise<SpotifyDevice[]>;
  me: () => Promise<null | SpotifyUser>;
  next: () => Promise<unknown>;
  pause: (deviceId?: null | string) => Promise<unknown>;
  play: (opts?: { deviceId?: null | string; offset?: number; uris?: string[] }) => Promise<unknown>;
  playbackState: () => Promise<null | PlaybackState>;
  previous: () => Promise<unknown>;
  seek: (ms: number) => Promise<unknown>;
  shuffle: (on: boolean, deviceId?: null | string) => Promise<unknown>;
  transfer: (deviceId: string, play: boolean) => Promise<unknown>;
  volume: (pct: number) => Promise<unknown>;
}

interface ApiErrorBody {
  message?: string;
  reason?: string;
}

/** The `{ error: { message, reason } }` part of a Spotify error response, if present. */
const apiErrorOf = (body: unknown): ApiErrorBody | undefined => {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return undefined;
  }
  const { error } = body;
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }
  return {
    message: 'message' in error && typeof error.message === 'string' ? error.message : undefined,
    reason: 'reason' in error && typeof error.reason === 'string' ? error.reason : undefined,
  };
};

const json = (method: string, body?: unknown): RequestInit => ({
  body: body === undefined ? undefined : JSON.stringify(body),
  method,
});

const deviceQuery = (deviceId?: null | string): string => (deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '');

/** Max items per "add items to playlist" request. */
const PLAYLIST_CHUNK = 100;

export const createSpotifyApi = (getToken: TokenSource): SpotifyApi => {
  const call = async <T>(path: string, init: RequestInit = {}, retried = false, attempt = 0): Promise<null | T> => {
    const token = await getToken(retried);
    if (!token) {throw new NotSignedInError();}
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (res.status === 401 && !retried) {return call<T>(path, init, true, attempt);}
    // Rate limited: wait as long as Spotify asks (like Knockout's SendRawAsync) and retry.
    if (res.status === 429 && attempt < 4) {
      const wait = Math.min(30, Number(res.headers.get('Retry-After')) || 2 ** (attempt + 1));
      await new Promise((r) => setTimeout(r, wait * 1000));
      return call<T>(path, init, retried, attempt + 1);
    }
    if (res.status === 204 || res.status === 202) {return null;}
    // Player commands document 204 but sometimes answer 200 with a non-JSON body (an id or
    // plain text), so only treat the body as data when it actually parses.
    const text = await res.text();
    // Responses are trusted to match the documented shape for `T` (JSON.parse is untyped).
    let body: null | T = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }
    if (!res.ok) {
      const err = apiErrorOf(body);
      throw new SpotifyApiError(
        res.status,
        err?.message ?? (text && text.length < 200 ? text : `Spotify returned ${res.status}`),
        err?.reason,
      );
    }
    return typeof body === 'object' ? body : null;
  };

  return {
    createPlaylist: async (name: string, description: string, isPublic: boolean, uris: string[]) => {
      const playlist = await call<CreatedPlaylist>(
        '/me/playlists',
        json('POST', { description, name, public: isPublic }),
      );
      if (!playlist) {throw new Error('Spotify did not return the new playlist.');}
      // Added in order, one request per chunk.
      const chunks = Array.from({ length: Math.ceil(uris.length / PLAYLIST_CHUNK) }, (_, i) =>
        uris.slice(i * PLAYLIST_CHUNK, (i + 1) * PLAYLIST_CHUNK),
      );
      await runSequentially(chunks, (chunk) => call(`/playlists/${playlist.id}/items`, json('POST', { uris: chunk })));
      return playlist;
    },
    devices: async () => (await call<{ devices: SpotifyDevice[] }>('/me/player/devices'))?.devices ?? [],
    me: () => call<SpotifyUser>('/me'),
    next: () => call<void>('/me/player/next', json('POST')),
    pause: (deviceId?: null | string) => call<void>(`/me/player/pause${deviceQuery(deviceId)}`, json('PUT')),
    /** Same body shape as Knockout's PlayTrackAsync: `{ uris, position_ms }` (+ offset if not 0). */
    play: (opts: { deviceId?: null | string; offset?: number; uris?: string[]; } = {}) =>
      call<void>(
        `/me/player/play${deviceQuery(opts.deviceId)}`,
        json(
          'PUT',
          opts.uris
            ? { position_ms: 0, uris: opts.uris, ...(opts.offset ? { offset: { position: opts.offset } } : {}) }
            : undefined,
        ),
      ),
    playbackState: () => call<PlaybackState>('/me/player?additional_types=track,episode'),
    previous: () => call<void>('/me/player/previous', json('POST')),
    seek: (ms: number) => call<void>(`/me/player/seek?position_ms=${Math.round(ms)}`, json('PUT')),
    shuffle: (on: boolean, deviceId?: null | string) =>
      call<void>(`/me/player/shuffle?state=${on}${deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ''}`, json('PUT')),
    transfer: (deviceId: string, play: boolean) =>
      call<void>('/me/player', json('PUT', { device_ids: [deviceId], play })),

    volume: (pct: number) => call<void>(`/me/player/volume?volume_percent=${Math.round(pct)}`, json('PUT')),
  };
};


/** Human-readable message for an API failure. */
export const describeSpotifyError = (err: unknown): string => {
  if (err instanceof NotSignedInError) {return err.message;}
  if (err instanceof SpotifyApiError) {
    if (err.status === 404 && (err.reason === 'NO_ACTIVE_DEVICE' || /device/i.test(err.message)))
      {return 'No active Spotify device. Open Spotify on your computer or phone, or pick a device.';}
    if (err.status === 403 && err.reason === 'PREMIUM_REQUIRED')
      {return 'Spotify Premium is required to control playback.';}
    if (err.status === 403)
      {return `Spotify refused the request (403): ${err.message}. Check the account is listed under User Management in your developer dashboard app.`;}
    if (err.status === 429) {return 'Spotify is rate limiting requests - try again in a moment.';}
    return err.message;
  }
  return err instanceof Error ? err.message : String(err);
};
