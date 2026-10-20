import type { ThemeSource } from '../../shared/bridge';

export type ThemeMode = ThemeSource;

export interface ThemeSettings {
  mode: ThemeMode;
  /** antd `colorPrimary` - any CSS colour string (hex from the colour picker). */
  primaryColor: string;
  compact: boolean;
  borderRadius: number;
  fontSize: number;
}

export interface AppConfig {
  /** Spotify developer-dashboard client ID (no secret - auth will use PKCE). */
  clientId: string;
  theme: ThemeSettings;
}

export const SPOTIFY_GREEN = '#1DB954';

/**
 * Redirect URI the user registers in their Spotify dashboard app. Not used for sign-in yet, but
 * the dashboard needs one to create an app. A different port from Spotify Knockout (4002) so
 * both apps can share one dashboard app and run side by side.
 */
export const SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:4003/auth';

export const DEFAULT_THEME: ThemeSettings = {
  mode: 'system',
  primaryColor: SPOTIFY_GREEN,
  compact: false,
  borderRadius: 8,
  fontSize: 14,
};

export const DEFAULT_CONFIG: AppConfig = {
  clientId: '',
  theme: DEFAULT_THEME,
};

export const PRIMARY_COLOR_PRESETS = [
  SPOTIFY_GREEN,
  '#1677FF',
  '#722ED1',
  '#EB2F96',
  '#F5222D',
  '#FA8C16',
  '#FADB14',
  '#13C2C2',
];
