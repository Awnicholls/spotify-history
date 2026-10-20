/**
 * Minimal typings for the Spotify Web Playback SDK (https://sdk.scdn.co/spotify-player.js).
 * Only what this app uses.
 */
declare namespace Spotify {
  interface Image {
    height?: null | number;
    url: string;
    width?: null | number;
  }

  interface Track {
    album: { images: Image[]; name: string; uri: string; };
    artists: { name: string; uri: string }[];
    duration_ms: number;
    id: null | string;
    linked_from?: { id: null | string; uri: null | string; };
    name: string;
    uri: string;
  }

  interface PlaybackState {
    duration: number;
    paused: boolean;
    position: number;
    shuffle: boolean;
    timestamp: number;
    track_window: {
      current_track: null | Track;
      next_tracks: Track[];
      previous_tracks: Track[];
    };
  }

  interface WebPlaybackError {
    message: string;
  }

  interface PlayerInit {
    getOAuthToken: (cb: (token: string) => void) => void;
    name: string;
    volume?: number;
  }

  class Player {
    constructor(options: PlayerInit);
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: 'not_ready' | 'ready', cb: (d: { device_id: string }) => void): boolean;
    addListener(event: 'player_state_changed', cb: (state: null | PlaybackState) => void): boolean;
    addListener(
      event: 'account_error' | 'authentication_error' | 'autoplay_failed' | 'initialization_error' | 'playback_error',
      cb: (e: WebPlaybackError) => void,
    ): boolean;
    getCurrentState(): Promise<null | PlaybackState>;
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
  onSpotifyWebPlaybackSDKReady?: () => void;
  Spotify?: typeof Spotify;
}
