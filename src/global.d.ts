import type { SpotifyUtilsBridge } from '../shared/bridge';

declare global {
  interface Window {
    /** Present when running inside Electron; undefined in a plain browser (`npm run dev:web`). */
    spotifyUtils?: SpotifyUtilsBridge;
  }
}

export {};
