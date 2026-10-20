import { useEffect, useRef, useState } from 'react';
import type { WebPlayerErrorKind } from './webPlayer';
import { createWebPlayer, hasWidevine } from './webPlayer';

export type WebPlayerStatus = 'off' | 'loading' | 'ready' | 'failed';

export interface WebPlayerState {
  status: WebPlayerStatus;
  deviceId: string | null;
  /** Last state the SDK reported; null when this app isn't the active device. */
  state: Spotify.PlaybackState | null;
  /** When `state` arrived (local clock), for ticking progress between events. */
  stateAt: number;
  error: { kind: WebPlayerErrorKind; message: string } | null;
  player: Spotify.Player | null;
}

const INITIAL: WebPlayerState = {
  status: 'off',
  deviceId: null,
  state: null,
  stateAt: 0,
  error: null,
  player: null,
};

/** Errors that mean the in-app player can't work at all (fall back to remote control). */
const FATAL: WebPlayerErrorKind[] = ['unsupported', 'load', 'connect', 'initialization_error', 'account_error'];

/**
 * The in-app Spotify device. Driven entirely by SDK events - no network polling.
 * `enabled` is true once signed in.
 */
export const useWebPlayer = (
  enabled: boolean,
  getToken: () => Promise<string | null>,
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
    if (!enabled) return;
    let cancelled = false;
    let player: Spotify.Player | null = null;

    const fail = (kind: WebPlayerErrorKind, message: string) => {
      if (cancelled) return;
      const fatal = FATAL.includes(kind);
      setS((prev) => ({ ...prev, error: { kind, message }, status: fatal ? 'failed' : prev.status }));
      onErrorRef.current(kind, message);
    };

    (async () => {
      setS({ ...INITIAL, status: 'loading' });
      if (!(await hasWidevine())) {
        fail('unsupported', 'This build cannot play protected audio (Widevine is missing).');
        return;
      }
      try {
        player = await createWebPlayer(() => getTokenRef.current(), {
          onReady: (deviceId) => !cancelled && setS((prev) => ({ ...prev, status: 'ready', deviceId, error: null })),
          onNotReady: () => !cancelled && setS((prev) => ({ ...prev, status: 'loading', deviceId: null })),
          onState: (state) => !cancelled && setS((prev) => ({ ...prev, state, stateAt: Date.now() })),
          onError: fail,
        });
        if (cancelled) player.disconnect();
        else setS((prev) => ({ ...prev, player }));
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
