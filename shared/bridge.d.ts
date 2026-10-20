/**
 * The API the Electron preload script exposes to the renderer as `window.spotifyUtils`.
 *
 * Payloads are plain JSON strings so the main process stays a dumb file store: the renderer
 * owns the shapes (see `src/types`) and their defaults.
 */
export type ThemeSource = 'dark' | 'light' | 'system';

export interface WidevineResult {
  /** castLabs component status (or the failure reason), for diagnostics. */
  detail: string;
  /** The Widevine CDM component is installed and registered. */
  ready: boolean;
}

export interface SpotifyUtilsBridge {
  clearHistory: () => Promise<void>;
  /** Raw contents of `config.json` in the app's user-data folder, or null if none saved yet. */
  loadConfig: () => Promise<null | string>;
  /** Raw contents of `history.json` (the parsed, normalised streaming history), or null. */
  loadHistory: () => Promise<null | string>;
  platform: string;
  /** Reload the page once (per window) so it picks up a just-installed Widevine. */
  reloadForWidevine: () => Promise<boolean>;
  saveConfig: (json: string) => Promise<void>;
  /** Blocking save, for flushing pending changes while the window closes. */
  saveConfigSync: (json: string) => void;

  saveHistory: (json: string) => Promise<void>;
  /** Keeps native chrome (title bar, scrollbars, context menus) in step with the app theme. */
  setThemeSource: (source: ThemeSource) => Promise<void>;

  spotifyCancelLogin: () => Promise<void>;
  /** A fresh access token, or null when not signed in with this client ID. */
  spotifyGetToken: (clientId: string, forceRefresh?: boolean) => Promise<null | string>;
  /** Opens the browser for Spotify sign-in (PKCE, loopback redirect); resolves once connected. */
  spotifyLogin: (clientId: string) => Promise<void>;
  spotifyLogout: () => Promise<void>;

  /** Resolves once castLabs Electron has installed Widevine (or failed to). */
  waitForWidevine: () => Promise<WidevineResult>;
}
