import type { JSX } from 'react';

import type { AppConfig, ThemeSettings } from '../../types/config';
import type { StoredHistory } from '../../types/history';

import { SettingsView } from './Settings.view';
import { useSettings } from './useSettings';

/**
 * App settings: theme (light/dark/system, accent colour, density, radius, font size - all applied
 * live and saved), the Spotify client ID, and the imported history.
 */
export const SettingsContainer = (props: {
  config: AppConfig;
  history: null | StoredHistory;
  onChangeClientId: () => void;
  onClearHistory: () => Promise<void>;
  onImport: () => void;
  resetTheme: () => void;
  updateTheme: (patch: Partial<ThemeSettings>) => void;
}): JSX.Element => <SettingsView {...useSettings(props)} />;
