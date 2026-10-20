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
  history: StoredHistory | null;
  updateTheme: (patch: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
  onChangeClientId: () => void;
  onImport: () => void;
  onClearHistory: () => Promise<void>;
}) => <SettingsView {...useSettings(props)} />;
