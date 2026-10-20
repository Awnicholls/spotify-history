/**
 * Minimal typings for the Spotify Web Playback SDK (https://sdk.scdn.co/spotify-player.js).
 * Only what this app uses.
 */
declare namespace Spotify {
  interface Image {
    url: string;
    width?: number | null;
    height?: number | null;
  }

  interface Track {
    uri: string;
    id: string | null;
    name: string;
    duration_ms: number;
    artists: { name: string; uri: string }[];
    album: { name: string; uri: string; images: Image[] };
    linked_from?: { uri: string | null; id: string | null };
  }

  interface PlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    shuffle: boolean;
    timestamp: number;
    track_window: {
      current_track: Track | null;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  interface WebPlaybackError {
    message: string;
  }

  interface PlayerInit {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }

  class Player {
    constructor(options: PlayerInit);
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: 'ready' | 'not_ready', cb: (d: { device_id: string }) => void): boolean;
    addListener(event: 'player_state_changed', cb: (state: PlaybackState | null) => void): boolean;
    addListener(
      event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error' | 'autoplay_failed',
      cb: (e: WebPlaybackError) => void,
    ): boolean;
    getCurrentState(): Promise<PlaybackState | null>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(positionMs: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    activateElement(): Promise<void>;
  }
}

interface Window {
  Spotify?: typeof Spotify;
  onSpotifyWebPlaybackSDKReady?: () => void;
}
