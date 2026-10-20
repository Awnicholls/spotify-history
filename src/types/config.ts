import type { ThemeSource } from '../../shared/bridge';
import type { StatCategory } from '../lib/aggregate';

export type ThemeMode = ThemeSource;

export interface ThemeSettings {
  borderRadius: number;
  compact: boolean;
  fontSize: number;
  mode: ThemeMode;
  /** antd `colorPrimary` - any CSS colour string (hex from the colour picker). */
  primaryColor: string;
}

export interface AppConfig {
  /** Spotify developer-dashboard client ID (no secret - auth will use PKCE). */
  clientId: string;
  /** Stats-table columns the user turned off, per table (column keys). */
  hiddenColumns: Partial<Record<StatCategory, string[]>>;
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
  borderRadius: 8,
  compact: false,
  fontSize: 14,
  mode: 'system',
  primaryColor: SPOTIFY_GREEN,
};

export const DEFAULT_CONFIG: AppConfig = {
  clientId: '',
  hiddenColumns: {},
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
