import { App } from 'antd';
import { useState } from 'react';

import type { AppConfig, ThemeSettings } from '../../types/config';
import type { StoredHistory } from '../../types/history';
import type { SettingsViewProps } from './Settings.view';

import { useSpotifyControls } from '../../spotify/SpotifyContext';
import { PRIMARY_COLOR_PRESETS, SPOTIFY_REDIRECT_URI } from '../../types/config';

interface UseSettingsArgs {
  config: AppConfig;
  history: null | StoredHistory;
  onChangeClientId: () => void;
  onClearHistory: () => Promise<void>;
  onImport: () => void;
  resetTheme: () => void;
  updateTheme: (patch: Partial<ThemeSettings>) => void;
}

export const useSettings = ({
  config,
  history,
  onChangeClientId,
  onClearHistory,
  onImport,
  resetTheme,
  updateTheme,
}: UseSettingsArgs): SettingsViewProps => {
  const { message } = App.useApp();
  const spotify = useSpotifyControls();
  const [clearing, setClearing] = useState(false);

  const clearHistory = async (): Promise<void> => {
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
    clearing,
    clientId: config.clientId,
    colorPresets: PRIMARY_COLOR_PRESETS,
    historyInfo: history
      ? {
          files: history.files,
          firstTs: history.plays[0]?.ts ?? 0,
          importedAt: history.importedAt,
          lastTs: history.plays[history.plays.length - 1]?.ts ?? 0,
          streams: history.plays.length,
        }
      : null,
    onChangeClientId,
    onClearHistory: clearHistory,
    onImport,
    onResetTheme: resetTheme,
    onSpotifyConnect: spotify.connect,
    onSpotifyDisconnect: spotify.disconnect,
    onThemeChange: updateTheme,
    redirectUri: SPOTIFY_REDIRECT_URI,
    spotifyStatus: spotify.status,
    spotifyUser: spotify.user?.display_name ?? spotify.user?.id ?? null,
    theme: config.theme,
  };
};
