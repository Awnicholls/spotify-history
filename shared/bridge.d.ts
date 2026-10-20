/**
 * The API the Electron preload script exposes to the renderer as `window.spotifyUtils`.
 *
 * Payloads are plain JSON strings so the main process stays a dumb file store: the renderer
 * owns the shapes (see `src/types`) and their defaults.
 */
export type ThemeSource = 'light' | 'dark' | 'system';

export interface SpotifyUtilsBridge {
  /** Raw contents of `config.json` in the app's user-data folder, or null if none saved yet. */
  loadConfig: () => Promise<string | null>;
  saveConfig: (json: string) => Promise<void>;
  /** Blocking save, for flushing pending changes while the window closes. */
  saveConfigSync: (json: string) => void;
  /** Raw contents of `history.json` (the parsed, normalised streaming history), or null. */
  loadHistory: () => Promise<string | null>;
  saveHistory: (json: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  /** Keeps native chrome (title bar, scrollbars, context menus) in step with the app theme. */
  setThemeSource: (source: ThemeSource) => Promise<void>;

  /** Opens the browser for Spotify sign-in (PKCE, loopback redirect); resolves once connected. */
  spotifyLogin: (clientId: string) => Promise<void>;
  spotifyCancelLogin: () => Promise<void>;
  spotifyLogout: () => Promise<void>;
  /** A fresh access token, or null when not signed in with this client ID. */
  spotifyGetToken: (clientId: string, forceRefresh?: boolean) => Promise<string | null>;

  platform: string;
}
