/**
 * Thin Spotify Web API client for the renderer. Tokens come from the main process (which owns
 * the refresh token); every call retries once with a forced refresh on 401.
 *
 * Endpoints follow the February 2026 Web API changes (`POST /me/playlists`,
 * `POST /playlists/{id}/items`).
 */

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

export type TokenSource = (forceRefresh?: boolean) => Promise<string | null>;

export interface SpotifyImage {
  url: string;
  width: number | null;
  height: number | null;
}

export interface SpotifyDevice {
  id: string | null;
  name: string;
  type: string;
  is_active: boolean;
  is_restricted: boolean;
  volume_percent: number | null;
  supports_volume?: boolean;
}

interface PlayableItem {
  uri: string;
  name: string;
  duration_ms: number;
  external_urls?: { spotify?: string };
  // track
  artists?: { name: string }[];
  album?: { name: string; images: SpotifyImage[]; uri: string };
  // episode
  show?: { name: string; images: SpotifyImage[] };
  images?: SpotifyImage[];
}

export interface PlaybackState {
  device: SpotifyDevice | null;
  is_playing: boolean;
  progress_ms: number | null;
  shuffle_state: boolean;
  repeat_state: 'off' | 'track' | 'context';
  item: PlayableItem | null;
}

export interface SpotifyUser {
  id: string;
  display_name: string | null;
  images?: SpotifyImage[];
}

export interface CreatedPlaylist {
  id: string;
  uri: string;
  name: string;
  external_urls: { spotify: string };
}

export const createSpotifyApi = (getToken: TokenSource) => {
  const call = async <T>(path: string, init: RequestInit = {}, retried = false, attempt = 0): Promise<T | null> => {
    const token = await getToken(retried);
    if (!token) throw new NotSignedInError();
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    if (res.status === 401 && !retried) return call<T>(path, init, true, attempt);
    // Rate limited: wait as long as Spotify asks (like Knockout's SendRawAsync) and retry.
    if (res.status === 429 && attempt < 4) {
      const wait = Math.min(30, Number(res.headers.get('Retry-After')) || 2 ** (attempt + 1));
      await new Promise((r) => setTimeout(r, wait * 1000));
      return call<T>(path, init, retried, attempt + 1);
    }
    if (res.status === 204 || res.status === 202) return null;
    // Player commands document 204 but sometimes answer 200 with a non-JSON body (an id or
    // plain text), so only treat the body as data when it actually parses.
    const text = await res.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }
    if (!res.ok) {
      const err = (body as { error?: { message?: string; reason?: string } } | null)?.error;
      throw new SpotifyApiError(
        res.status,
        err?.message ?? (text && text.length < 200 ? text : `Spotify returned ${res.status}`),
        err?.reason,
      );
    }
    return (typeof body === 'object' ? body : null) as T | null;
  };

  const json = (method: string, body?: unknown): RequestInit => ({
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const deviceQuery = (deviceId?: string | null) => (deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : '');

  return {
    me: () => call<SpotifyUser>('/me'),
    playbackState: () => call<PlaybackState>('/me/player?additional_types=track,episode'),
    devices: async () => (await call<{ devices: SpotifyDevice[] }>('/me/player/devices'))?.devices ?? [],
    /** Same body shape as Knockout's PlayTrackAsync: `{ uris, position_ms }` (+ offset if not 0). */
    play: (opts: { uris?: string[]; offset?: number; deviceId?: string | null } = {}) =>
      call<void>(
        `/me/player/play${deviceQuery(opts.deviceId)}`,
        json(
          'PUT',
          opts.uris
            ? { uris: opts.uris, position_ms: 0, ...(opts.offset ? { offset: { position: opts.offset } } : {}) }
            : undefined,
        ),
      ),
    pause: (deviceId?: string | null) => call<void>(`/me/player/pause${deviceQuery(deviceId)}`, json('PUT')),
    next: () => call<void>('/me/player/next', json('POST')),
    previous: () => call<void>('/me/player/previous', json('POST')),
    seek: (ms: number) => call<void>(`/me/player/seek?position_ms=${Math.round(ms)}`, json('PUT')),
    volume: (pct: number) => call<void>(`/me/player/volume?volume_percent=${Math.round(pct)}`, json('PUT')),
    shuffle: (on: boolean, deviceId?: string | null) =>
      call<void>(`/me/player/shuffle?state=${on}${deviceId ? `&device_id=${encodeURIComponent(deviceId)}` : ''}`, json('PUT')),
    transfer: (deviceId: string, play: boolean) =>
      call<void>('/me/player', json('PUT', { device_ids: [deviceId], play })),

    createPlaylist: async (name: string, description: string, isPublic: boolean, uris: string[]) => {
      const playlist = await call<CreatedPlaylist>(
        '/me/playlists',
        json('POST', { name, description, public: isPublic }),
      );
      if (!playlist) throw new Error('Spotify did not return the new playlist.');
      // Max 100 items per request.
      for (let i = 0; i < uris.length; i += 100) {
        await call(`/playlists/${playlist.id}/items`, json('POST', { uris: uris.slice(i, i + 100) }));
      }
      return playlist;
    },
  };
};

export type SpotifyApi = ReturnType<typeof createSpotifyApi>;

/** Human-readable message for an API failure. */
export const describeSpotifyError = (err: unknown): string => {
  if (err instanceof NotSignedInError) return err.message;
  if (err instanceof SpotifyApiError) {
    if (err.status === 404 && (err.reason === 'NO_ACTIVE_DEVICE' || /device/i.test(err.message)))
      return 'No active Spotify device. Open Spotify on your computer or phone, or pick a device.';
    if (err.status === 403 && err.reason === 'PREMIUM_REQUIRED')
      return 'Spotify Premium is required to control playback.';
    if (err.status === 403)
      return `Spotify refused the request (403): ${err.message}. Check the account is listed under User Management in your developer dashboard app.`;
    if (err.status === 429) return 'Spotify is rate limiting requests - try again in a moment.';
    return err.message;
  }
  return err instanceof Error ? err.message : String(err);
};
