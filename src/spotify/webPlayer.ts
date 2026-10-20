/**
 * Loads the Spotify Web Playback SDK and creates the in-app player - the same setup as Spotify
 * Knockout's `player.html`. The app becomes a Spotify Connect device ("Spotify Utils") and the
 * Web API is pointed at it with `device_id` to start playback.
 *
 * Needs Widevine, which stock Electron lacks; the app runs on castLabs' Electron for that.
 */

const SDK_URL = 'https://sdk.scdn.co/spotify-player.js';
const SDK_TIMEOUT_MS = 15_000;
export const PLAYER_NAME = 'Spotify Utils';

let sdkPromise: Promise<typeof Spotify> | null = null;

export const loadSdk = (): Promise<typeof Spotify> =>
  (sdkPromise ??= new Promise<typeof Spotify>((resolve, reject) => {
    if (window.Spotify) {
      resolve(window.Spotify);
      return;
    }
    const timer = setTimeout(() => {
      sdkPromise = null;
      reject(new Error('The Spotify Web Playback SDK did not load. Check your internet connection.'));
    }, SDK_TIMEOUT_MS);
    window.onSpotifyWebPlaybackSDKReady = () => {
      clearTimeout(timer);
      resolve(window.Spotify!);
    };
    const script = document.createElement('script');
    script.src = SDK_URL;
    script.async = true;
    script.onerror = () => {
      clearTimeout(timer);
      sdkPromise = null;
      reject(new Error('Could not load the Spotify Web Playback SDK. Check your internet connection.'));
    };
    document.head.appendChild(script);
  }));

/** Whether this runtime can decrypt Spotify's audio (Widevine via EME). */
export const hasWidevine = async (): Promise<boolean> => {
  if (!navigator.requestMediaKeySystemAccess) return false;
  try {
    await navigator.requestMediaKeySystemAccess('com.widevine.alpha', [
      {
        initDataTypes: ['cenc'],
        audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
      },
    ]);
    return true;
  } catch {
    return false;
  }
};

export type WebPlayerErrorKind =
  | 'unsupported'
  | 'load'
  | 'connect'
  | 'initialization_error'
  | 'authentication_error'
  | 'account_error'
  | 'playback_error'
  | 'autoplay_failed';

export interface WebPlayerEvents {
  onReady: (deviceId: string) => void;
  onNotReady: () => void;
  onState: (state: Spotify.PlaybackState | null) => void;
  onError: (kind: WebPlayerErrorKind, message: string) => void;
}

export const createWebPlayer = async (
  getToken: () => Promise<string | null>,
  events: WebPlayerEvents,
  volume = 0.6,
): Promise<Spotify.Player> => {
  const sdk = await loadSdk();
  const player = new sdk.Player({
    name: PLAYER_NAME,
    getOAuthToken: (cb) => {
      void getToken().then((token) => token && cb(token));
    },
    volume,
  });

  player.addListener('ready', ({ device_id }) => events.onReady(device_id));
  player.addListener('not_ready', () => events.onNotReady());
  player.addListener('player_state_changed', (state) => events.onState(state));
  (['initialization_error', 'authentication_error', 'account_error', 'playback_error', 'autoplay_failed'] as const).forEach(
    (kind) => player.addListener(kind, ({ message }) => events.onError(kind, message)),
  );

  const connected = await player.connect();
  if (!connected) events.onError('connect', 'Could not connect the Spotify player.');
  return player;
};
