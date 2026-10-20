import { App } from 'antd';
import { useState } from 'react';
import { useSpotifyControls } from '../../spotify/SpotifyContext';
import type { AppConfig, ThemeSettings } from '../../types/config';
import { PRIMARY_COLOR_PRESETS, SPOTIFY_REDIRECT_URI } from '../../types/config';
import type { StoredHistory } from '../../types/history';
import type { SettingsViewProps } from './Settings.view';

interface UseSettingsArgs {
  config: AppConfig;
  history: StoredHistory | null;
  updateTheme: (patch: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
  onChangeClientId: () => void;
  onImport: () => void;
  onClearHistory: () => Promise<void>;
}

export const useSettings = ({
  config,
  history,
  updateTheme,
  resetTheme,
  onChangeClientId,
  onImport,
  onClearHistory,
}: UseSettingsArgs): SettingsViewProps => {
  const { message } = App.useApp();
  const spotify = useSpotifyControls();
  const [clearing, setClearing] = useState(false);

  const clearHistory = async () => {
    setClearing(true);
    try {
      await onClearHistory();
      message.success('Streaming history removed.');
    } catch (err) {
      message.error(`Couldn't remove history: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setClearing(false);
    }
  };

  return {
    theme: config.theme,
    colorPresets: PRIMARY_COLOR_PRESETS,
    clientId: config.clientId,
    redirectUri: SPOTIFY_REDIRECT_URI,
    historyInfo: history
      ? {
          streams: history.plays.length,
          firstTs: history.plays[0]?.ts ?? 0,
          lastTs: history.plays[history.plays.length - 1]?.ts ?? 0,
          importedAt: history.importedAt,
          files: history.files,
        }
      : null,
    clearing,
    spotifyStatus: spotify.status,
    spotifyUser: spotify.user?.display_name ?? spotify.user?.id ?? null,
    onSpotifyConnect: spotify.connect,
    onSpotifyDisconnect: spotify.disconnect,
    onThemeChange: updateTheme,
    onResetTheme: resetTheme,
    onChangeClientId,
    onImport,
    onClearHistory: clearHistory,
  };
};
