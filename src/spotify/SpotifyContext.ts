import { createContext, useContext } from 'react';
import type { CreatedPlaylist, SpotifyDevice, SpotifyUser } from './spotifyApi';
import type { WebPlayerStatus } from './useWebPlayer';

export type SpotifyStatus = 'unavailable' | 'checking' | 'signedOut' | 'connecting' | 'signedIn';

export interface NowPlaying {
  uri: string;
  title: string;
  /** Artists, or the show for an episode. */
  subtitle: string;
  album: string;
  imageUrl: string | null;
  largeImageUrl: string | null;
  durationMs: number;
  url: string | null;
}

/**
 * What tables and the playlists tab need: rarely changes, so consumers don't re-render on
 * every playback poll.
 */
export interface SpotifyControls {
  status: SpotifyStatus;
  user: SpotifyUser | null;
  currentUri: string | null;
  isPlaying: boolean;
  connect: () => void;
  cancelConnect: () => void;
  disconnect: () => void;
  /** Play `uris` from `offset`; picks an available device if none is active. */
  playUris: (uris: string[], offset?: number) => Promise<void>;
  togglePlay: () => Promise<void>;
  createPlaylist: (name: string, description: string, isPublic: boolean, uris: string[]) => Promise<CreatedPlaylist>;
}

/** Full playback state for the header player; updates every poll. */
export interface SpotifyPlayback {
  /** Audio is playing through the app's own Web Playback SDK device. */
  inApp: boolean;
  playerStatus: WebPlayerStatus;
  /** The in-app device's id once registered. */
  appDeviceId: string | null;
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  progressMs: number;
  /** When `progressMs` was read, so the player can tick it forward locally. */
  progressAt: number;
  shuffle: boolean;
  device: SpotifyDevice | null;
  devices: SpotifyDevice[];
  refreshDevices: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  setVolume: (pct: number) => Promise<void>;
  toggleShuffle: () => Promise<void>;
  transfer: (deviceId: string) => Promise<void>;
}

const missing = () => {
  throw new Error('SpotifyProvider is missing');
};

export const SpotifyControlsContext = createContext<SpotifyControls | null>(null);
export const SpotifyPlaybackContext = createContext<SpotifyPlayback | null>(null);

export const useSpotifyControls = (): SpotifyControls => useContext(SpotifyControlsContext) ?? missing();
export const useSpotifyPlayback = (): SpotifyPlayback => useContext(SpotifyPlaybackContext) ?? missing();
