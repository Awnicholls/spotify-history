import { createContext, useContext } from 'react';

import type { CreatedPlaylist, SpotifyDevice, SpotifyUser } from './spotifyApi';
import type { WebPlayerStatus } from './useWebPlayer';

export type SpotifyStatus = 'checking' | 'connecting' | 'signedIn' | 'signedOut' | 'unavailable';

export interface NowPlaying {
  album: string;
  durationMs: number;
  imageUrl: null | string;
  largeImageUrl: null | string;
  /** Artists, or the show for an episode. */
  subtitle: string;
  title: string;
  uri: string;
  url: null | string;
}

/**
 * What tables and the playlists tab need: rarely changes, so consumers don't re-render on
 * every playback poll.
 */
export interface SpotifyControls {
  cancelConnect: () => void;
  connect: () => void;
  createPlaylist: (name: string, description: string, isPublic: boolean, uris: string[]) => Promise<CreatedPlaylist>;
  currentUri: null | string;
  disconnect: () => void;
  isPlaying: boolean;
  /** Play `uris` from `offset`; picks an available device if none is active. */
  playUris: (uris: string[], offset?: number) => Promise<void>;
  status: SpotifyStatus;
  togglePlay: () => Promise<void>;
  user: null | SpotifyUser;
}

/** Full playback state for the header player; updates every poll. */
export interface SpotifyPlayback {
  /** The in-app device's id once registered. */
  appDeviceId: null | string;
  device: null | SpotifyDevice;
  devices: SpotifyDevice[];
  /** Audio is playing through the app's own Web Playback SDK device. */
  inApp: boolean;
  isPlaying: boolean;
  next: () => Promise<void>;
  nowPlaying: NowPlaying | null;
  playerStatus: WebPlayerStatus;
  previous: () => Promise<void>;
  /** When `progressMs` was read, so the player can tick it forward locally. */
  progressAt: number;
  progressMs: number;
  refreshDevices: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  setVolume: (pct: number) => Promise<void>;
  shuffle: boolean;
  toggleShuffle: () => Promise<void>;
  transfer: (deviceId: string) => Promise<void>;
}

const missing = (): never => {
  throw new Error('SpotifyProvider is missing');
};

export const SpotifyControlsContext = createContext<null | SpotifyControls>(null);
export const SpotifyPlaybackContext = createContext<null | SpotifyPlayback>(null);

export const useSpotifyControls = (): SpotifyControls => useContext(SpotifyControlsContext) ?? missing();
export const useSpotifyPlayback = (): SpotifyPlayback => useContext(SpotifyPlaybackContext) ?? missing();
