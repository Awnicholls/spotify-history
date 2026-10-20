import { App } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NowPlaying, SpotifyControls, SpotifyPlayback, SpotifyStatus } from './SpotifyContext';
import type { PlaybackState, SpotifyDevice, SpotifyImage, SpotifyUser } from './spotifyApi';
import { createSpotifyApi, describeSpotifyError, NotSignedInError, SpotifyApiError } from './spotifyApi';
import { useWebPlayer } from './useWebPlayer';
import type { WebPlayerErrorKind } from './webPlayer';
import { PLAYER_NAME } from './webPlayer';

/** Remote-control polling - only used when the in-app player isn't available or another device is chosen. */
const POLL_PLAYING_MS = 3000;
const POLL_IDLE_MS = 10_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pickImage = (images: (SpotifyImage | Spotify.Image)[] | undefined, target: number): string | null => {
  if (!images?.length) return null;
  const sorted = [...images].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  return (sorted.find((i) => (i.width ?? 0) >= target) ?? sorted[sorted.length - 1]).url;
};

const fromWebApi = (state: PlaybackState | null): NowPlaying | null => {
  const item = state?.item;
  if (!item) return null;
  const images = item.album?.images ?? item.images ?? item.show?.images;
  return {
    uri: item.uri,
    title: item.name,
    subtitle: item.artists?.map((a) => a.name).join(', ') ?? item.show?.name ?? '',
    album: item.album?.name ?? item.show?.name ?? '',
    imageUrl: pickImage(images, 64),
    largeImageUrl: pickImage(images, 300),
    durationMs: item.duration_ms,
    url: item.external_urls?.spotify ?? null,
  };
};

const fromSdk = (state: Spotify.PlaybackState | null): NowPlaying | null => {
  const track = state?.track_window.current_track;
  if (!track) return null;
  // A relinked track reports its own uri; prefer the one we asked for (as Knockout does).
  const uri = track.linked_from?.uri || track.uri;
  const id = uri.split(':')[2];
  return {
    uri,
    title: track.name,
    subtitle: track.artists.map((a) => a.name).join(', '),
    album: track.album.name,
    imageUrl: pickImage(track.album.images, 64),
    largeImageUrl: pickImage(track.album.images, 300),
    durationMs: state!.duration || track.duration_ms,
    url: id ? `https://open.spotify.com/${uri.split(':')[1]}/${id}` : null,
  };
};

/** If the in-app player hasn't moved this far between the two checks, the audio is stuck. */
const STALL_CHECK_MS = [5000, 8000] as const;

const LICENCE_FALLBACK_MESSAGE =
  "Spotify didn't unlock audio for the in-app player (its Widevine licence check failed - this " +
  'Electron build needs VMP signing, see README). Playing on your Spotify app instead.';

const WEB_PLAYER_MESSAGES: Partial<Record<WebPlayerErrorKind, string>> = {
  account_error: 'Spotify Premium is required to play music in the app.',
  authentication_error: 'Spotify rejected the in-app player sign-in. Disconnect and connect Spotify again.',
  autoplay_failed: 'Audio was blocked from starting - press play.',
};

/**
 * Spotify connection + playback.
 *
 * Like Spotify Knockout, the app is its own Spotify device: the Web Playback SDK plays the audio
 * and the Web API is told to play on that device (`device_id`). Controls go straight to the SDK
 * and state comes from its events, so nothing polls the network while it's in use.
 *
 * If the in-app player can't start (no Widevine, no Premium) or the user picks another device,
 * it falls back to remote-controlling that device over the Web API, polling gently.
 */
export const useSpotifyState = (clientId: string) => {
  const { message } = App.useApp();
  const bridge = window.spotifyUtils;
  // Auth status is tracked per client ID; switching IDs reads as 'checking' until re-checked.
  const [auth, setAuth] = useState<{ clientId: string; status: SpotifyStatus } | null>(null);
  const status: SpotifyStatus = !bridge
    ? 'unavailable'
    : !clientId
      ? 'signedOut'
      : auth?.clientId === clientId
        ? auth.status
        : 'checking';
  const setStatus = useCallback((s: SpotifyStatus) => setAuth({ clientId, status: s }), [clientId]);
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [remote, setRemote] = useState<PlaybackState | null>(null);
  const [remoteAt, setRemoteAt] = useState(0);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  /** The user picked a different device from the menu - control that instead of the app. */
  const [remoteSelected, setRemoteSelected] = useState(false);
  const [appVolume, setAppVolume] = useState(60);
  /** Set when the in-app player loaded but couldn't actually play (e.g. licence refused). */
  const [webBroken, setWebBroken] = useState<string | null>(null);
  const lastPlay = useRef<{ uris: string[]; offset: number } | null>(null);
  const fallbackRef = useRef<(reason: string) => void>(() => undefined);

  const getToken = useCallback(
    (force?: boolean) => bridge?.spotifyGetToken(clientId, force) ?? Promise.resolve(null),
    [bridge, clientId],
  );
  const api = useMemo(() => createSpotifyApi(getToken), [getToken]);

  const fail = useCallback(
    (err: unknown) => {
      if (err instanceof NotSignedInError) setStatus('signedOut');
      message.error(describeSpotifyError(err));
    },
    [message, setStatus],
  );

  // ---- in-app player ---------------------------------------------------------------------------

  const onWebPlayerError = useCallback(
    (kind: WebPlayerErrorKind, text: string) => {
      const known = WEB_PLAYER_MESSAGES[kind];
      if (kind === 'playback_error') fallbackRef.current(text);
      else if (known) message.warning(known);
      else message.warning(`In-app playback isn't available (${text}). Songs will play on your Spotify app instead.`);
    },
    [message],
  );

  const web = useWebPlayer(status === 'signedIn', () => getToken(), onWebPlayerError);
  const appReady = web.status === 'ready' && !!web.deviceId && !!web.player;
  const inApp = appReady && !remoteSelected && !webBroken;

  // ---- connection -----------------------------------------------------------------------------

  useEffect(() => {
    if (!bridge || !clientId) return;
    let cancelled = false;
    bridge
      .spotifyGetToken(clientId)
      .then(async (token) => {
        if (cancelled) return;
        if (!token) return setStatus('signedOut');
        setStatus('signedIn');
        setUser(await api.me());
      })
      .catch(() => !cancelled && setStatus('signedOut'));
    return () => {
      cancelled = true;
    };
  }, [bridge, clientId, api, setStatus]);

  const connect = useCallback(async () => {
    if (!bridge || !clientId) return;
    setStatus('connecting');
    try {
      await bridge.spotifyLogin(clientId);
      setStatus('signedIn');
      const me = await api.me();
      setUser(me);
      message.success(`Connected to Spotify${me?.display_name ? ` as ${me.display_name}` : ''}.`);
    } catch (err) {
      setStatus('signedOut');
      const msg = err instanceof Error ? err.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '') : String(err);
      if (!/cancelled|restarted/i.test(msg)) message.error(msg);
    }
  }, [bridge, clientId, api, message, setStatus]);

  const cancelConnect = useCallback(() => void bridge?.spotifyCancelLogin(), [bridge]);

  const disconnect = useCallback(async () => {
    await bridge?.spotifyLogout();
    setStatus('signedOut');
    setUser(null);
    setRemote(null);
    setRemoteSelected(false);
    setWebBroken(null);
  }, [bridge, setStatus]);

  // ---- remote polling (fallback only) ----------------------------------------------------------

  const pollRemote = status === 'signedIn' && (web.status === 'failed' || remoteSelected || !!webBroken);
  const inFlight = useRef(false);
  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      setRemote(await api.playbackState());
      setRemoteAt(Date.now());
    } catch (err) {
      if (err instanceof NotSignedInError) setStatus('signedOut');
    } finally {
      inFlight.current = false;
    }
  }, [api, setStatus]);

  const remotePlaying = !!remote?.is_playing;
  useEffect(() => {
    if (!pollRemote) return;
    const first = setTimeout(() => void refresh(), 0);
    const timer = setInterval(
      () => document.visibilityState === 'visible' && void refresh(),
      remotePlaying ? POLL_PLAYING_MS : POLL_IDLE_MS,
    );
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [pollRemote, remotePlaying, refresh]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action();
        if (!inApp) setTimeout(() => void refresh(), 500);
      } catch (err) {
        fail(err);
      }
    },
    [fail, refresh, inApp],
  );

  // ---- actions --------------------------------------------------------------------------------

  const refreshDevices = useCallback(async () => {
    try {
      setDevices(await api.devices());
    } catch (err) {
      fail(err);
    }
  }, [api, fail]);

  /** Remote mode: the active device, else this computer's Spotify app, else anything. */
  const pickRemoteDevice = useCallback(async (): Promise<SpotifyDevice | null> => {
    const available = (await api.devices()).filter((d) => d.id && !d.is_restricted && d.id !== web.deviceId);
    return (
      available.find((d) => d.is_active) ??
      available.find((d) => d.type.toLowerCase() === 'computer') ??
      available[0] ??
      null
    );
  }, [api, web.deviceId]);

  const playRemote = useCallback(
    async (uris: string[], offset: number) => {
      const device = await pickRemoteDevice();
      if (!device?.id) {
        message.warning('No Spotify devices found. Open Spotify on your computer or phone, then try again.');
        return;
      }
      await api.play({ uris, offset, deviceId: device.id });
      setTimeout(() => void refresh(), 800);
    },
    [api, message, pickRemoteDevice, refresh],
  );

  // In-app audio that loads but never plays (Spotify refusing the Widevine licence shows up as
  // a 500 on /widevine-license and a stalled player): switch to the user's Spotify app.
  useEffect(() => {
    fallbackRef.current = (reason: string) => {
      if (webBroken) return;
      console.warn('In-app playback failed, falling back to remote control:', reason);
      setWebBroken(reason);
      void web.player?.pause().catch(() => undefined);
      message.warning(LICENCE_FALLBACK_MESSAGE, 8);
      const last = lastPlay.current;
      if (last) void playRemote(last.uris, last.offset).catch(fail);
    };
  });

  const watchForStall = useCallback(
    (player: Spotify.Player) => {
      let first: number | null = null;
      setTimeout(async () => {
        first = (await player.getCurrentState().catch(() => null))?.position ?? null;
      }, STALL_CHECK_MS[0]);
      setTimeout(async () => {
        const state = await player.getCurrentState().catch(() => null);
        if (state?.paused) return; // the user paused it - not a failure
        if (!state || first === null || state.position - first < 1000) fallbackRef.current('no audio progress');
      }, STALL_CHECK_MS[1]);
    },
    [],
  );

  // Latest player state for async code that outlives a render (waiting for the SDK to be ready).
  const webRef = useRef(web);
  useEffect(() => {
    webRef.current = web;
  });

  /** If the in-app player is still starting up, wait briefly for it rather than going remote. */
  const waitForAppPlayer = useCallback(async (timeoutMs = 6000) => {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
      const w = webRef.current;
      if (w.status === 'ready' && w.deviceId && w.player) return { deviceId: w.deviceId, player: w.player };
      if (w.status !== 'loading') return null;
      await sleep(150);
    }
    return null;
  }, []);

  const playUris = useCallback(
    async (uris: string[], offset = 0) => {
      if (status !== 'signedIn') {
        message.info('Connect Spotify (top right) to play songs.');
        return;
      }
      if (!uris.length) return;
      lastPlay.current = { uris, offset };
      try {
        const app =
          inApp && web.deviceId && web.player
            ? { deviceId: web.deviceId, player: web.player }
            : !remoteSelected && !webBroken && web.status === 'loading'
              ? await waitForAppPlayer()
              : null;
        if (app) {
          // Knockout's flow: play on the SDK device by id; if Spotify doesn't know the device
          // yet, transfer to it first and try again.
          const { deviceId, player } = app;
          await player.activateElement().catch(() => undefined);
          try {
            await api.play({ uris, offset, deviceId });
          } catch (err) {
            if (!(err instanceof SpotifyApiError) || err.status !== 404) throw err;
            await api.transfer(deviceId, false);
            await sleep(500);
            await api.play({ uris, offset, deviceId });
          }
          watchForStall(player);
          return;
        }
        await playRemote(uris, offset);
      } catch (err) {
        fail(err);
      }
    },
    [
      api,
      status,
      message,
      fail,
      inApp,
      web.deviceId,
      web.player,
      web.status,
      remoteSelected,
      webBroken,
      waitForAppPlayer,
      playRemote,
      watchForStall,
    ],
  );

  const appNow = useMemo(() => fromSdk(web.state), [web.state]);
  const remoteNow = useMemo(() => fromWebApi(remote), [remote]);
  const nowPlaying = inApp ? appNow : remoteNow;
  const isPlaying = inApp ? !!web.state && !web.state.paused : remotePlaying;

  const togglePlay = useCallback(async () => {
    if (inApp) {
      if (!web.state) {
        message.info('Pick a song to play.');
        return;
      }
      await web.player!.togglePlay().catch(fail);
      return;
    }
    const deviceId = remote?.device?.id ?? null;
    setRemote((p) => (p ? { ...p, is_playing: !p.is_playing } : p));
    await run(async () => {
      if (remotePlaying) return api.pause(deviceId);
      return api.play({ deviceId: deviceId ?? (await pickRemoteDevice())?.id ?? null });
    });
  }, [inApp, web.state, web.player, message, fail, remote?.device?.id, run, remotePlaying, api, pickRemoteDevice]);

  const currentUri = nowPlaying?.uri ?? null;

  const createPlaylist = useCallback(
    (name: string, description: string, isPublic: boolean, uris: string[]) =>
      api.createPlaylist(name, description, isPublic, uris),
    [api],
  );

  const controls = useMemo<SpotifyControls>(
    () => ({
      status,
      user,
      currentUri,
      isPlaying,
      connect: () => void connect(),
      cancelConnect,
      disconnect: () => void disconnect(),
      playUris,
      togglePlay,
      createPlaylist,
    }),
    [status, user, currentUri, isPlaying, connect, cancelConnect, disconnect, playUris, togglePlay, createPlaylist],
  );

  const appDevice: SpotifyDevice | null = web.deviceId
    ? {
        id: web.deviceId,
        name: `${PLAYER_NAME} (this app)`,
        type: 'Computer',
        is_active: !!web.state,
        is_restricted: false,
        volume_percent: appVolume,
        supports_volume: true,
      }
    : null;

  const playbackValue: SpotifyPlayback = {
    inApp,
    playerStatus: web.status,
    nowPlaying,
    isPlaying,
    progressMs: inApp ? (web.state?.position ?? 0) : (remote?.progress_ms ?? 0),
    progressAt: inApp ? web.stateAt : remoteAt,
    shuffle: inApp ? !!web.state?.shuffle : !!remote?.shuffle_state,
    device: inApp ? appDevice : (remote?.device ?? null),
    appDeviceId: web.deviceId,
    devices: appDevice && !devices.some((d) => d.id === appDevice.id) ? [appDevice, ...devices] : devices,
    refreshDevices,
    next: () => (inApp ? web.player!.nextTrack().catch(fail) : run(() => api.next())),
    previous: () => (inApp ? web.player!.previousTrack().catch(fail) : run(() => api.previous())),
    seek: (ms) => {
      if (inApp) return web.player!.seek(ms).catch(fail);
      setRemote((p) => (p ? { ...p, progress_ms: ms } : p));
      setRemoteAt(Date.now());
      return run(() => api.seek(ms));
    },
    setVolume: (pct) => {
      if (inApp) {
        setAppVolume(pct);
        return web.player!.setVolume(pct / 100).catch(fail);
      }
      setRemote((p) => (p?.device ? { ...p, device: { ...p.device, volume_percent: pct } } : p));
      return run(() => api.volume(pct));
    },
    toggleShuffle: () =>
      run(() =>
        api.shuffle(
          !(inApp ? web.state?.shuffle : remote?.shuffle_state),
          inApp ? web.deviceId : remote?.device?.id,
        ),
      ),
    transfer: async (deviceId) => {
      const toApp = deviceId === web.deviceId;
      setRemoteSelected(!toApp);
      // Picking the app again retries in-app playback after a fallback.
      if (toApp) setWebBroken(null);
      await run(() => api.transfer(deviceId, true));
    },
  };

  return { controls, playback: playbackValue };
};
