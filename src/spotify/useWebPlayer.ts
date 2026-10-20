import { useEffect, useRef, useState } from 'react';

import type { WebPlayerErrorKind } from './webPlayer';

import { pollUntil } from '../lib/async';
import { createWebPlayer, hasWidevine } from './webPlayer';

export type WebPlayerStatus = 'failed' | 'loading' | 'off' | 'ready';

export interface WebPlayerState {
  deviceId: null | string;
  error: { kind: WebPlayerErrorKind; message: string } | null;
  player: null | Spotify.Player;
  /** Last state the SDK reported; null when this app isn't the active device. */
  state: null | Spotify.PlaybackState;
  /** When `state` arrived (local clock), for ticking progress between events. */
  stateAt: number;
  status: WebPlayerStatus;
}

const INITIAL: WebPlayerState = {
  deviceId: null,
  error: null,
  player: null,
  state: null,
  stateAt: 0,
  status: 'off',
};

/** Errors that mean the in-app player can't work at all (fall back to remote control). */
const FATAL = new Set<WebPlayerErrorKind>([
  'account_error',
  'connect',
  'initialization_error',
  'load',
  'unsupported',
]);

/**
 * The in-app Spotify device. Driven entirely by SDK events - no network polling.
 * `enabled` is true once signed in.
 */
export const useWebPlayer = (
  enabled: boolean,
  getToken: () => Promise<null | string>,
  onError: (kind: WebPlayerErrorKind, message: string) => void,
): WebPlayerState => {
  const [s, setS] = useState<WebPlayerState>(INITIAL);
  const getTokenRef = useRef(getToken);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    getTokenRef.current = getToken;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!enabled) {return undefined;}
    let cancelled = false;
    let player: null | Spotify.Player = null;

    const fail = (kind: WebPlayerErrorKind, message: string): void => {
      if (cancelled) {return;}
      const fatal = FATAL.has(kind);
      setS((prev) => ({ ...prev, error: { kind, message }, status: fatal ? 'failed' : prev.status }));
      onErrorRef.current(kind, message);
    };

    void (async () => {
      setS({ ...INITIAL, status: 'loading' });

      // castLabs Electron installs Widevine in the background on launch (a download on first
      // run) - wait for it rather than checking too early.
      const bridge = window.spotifyUtils;
      const widevine = bridge ? await bridge.waitForWidevine() : { detail: '', ready: true };
      if (cancelled) {return;}
      if (!widevine.ready) {
        fail('unsupported', `Widevine isn't available: ${widevine.detail}`);
        return;
      }

      // The CDM can take a moment to show up to the page after installing; give it a few tries,
      // then reload once (a fresh page always sees it), then give up with diagnostics.
      const supported = await pollUntil(
        async () => {
          if (cancelled) {return false;}
          return (await hasWidevine()) ? true : undefined;
        },
        4500,
        1500,
      );
      if (cancelled) {return;}
      if (!supported) {
        if (bridge && (await bridge.reloadForWidevine())) {return;}
        fail('unsupported', `Widevine is installed but this window can't use it. Status: ${widevine.detail}`);
        return;
      }
      try {
        player = await createWebPlayer(() => getTokenRef.current(), {
          onError: fail,
          onNotReady: () => !cancelled && setS((prev) => ({ ...prev, deviceId: null, status: 'loading' })),
          onReady: (deviceId) => !cancelled && setS((prev) => ({ ...prev, deviceId, error: null, status: 'ready' })),
          onState: (state) => !cancelled && setS((prev) => ({ ...prev, state, stateAt: Date.now() })),
        });
        if (cancelled) {player.disconnect();}
        else {setS((prev) => ({ ...prev, player }));}
      } catch (err) {
        fail('load', err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
      player?.disconnect();
      setS(INITIAL);
    };
  }, [enabled]);

  return s;
};
