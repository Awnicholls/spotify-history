import type { ThemeConfig } from 'antd';

import { theme } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { StatCategory } from '../lib/aggregate';
import type { ColumnSettings } from '../settings/ColumnSettingsContext';
import type { AppConfig, ThemeSettings } from '../types/config';
import type { StoredHistory } from '../types/history';
import type { AppViewProps, Page } from './App.view';

import { useSystemDark } from '../hooks/useSystemDark';
import { HEADER_HEIGHT } from '../lib/layout';
import * as storage from '../lib/storage';
import { DEFAULT_CONFIG } from '../types/config';

export interface LoadProgress {
  percent: number;
  text: string;
}

const nextPaint = (): Promise<void> => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

const formatMegabytes = (chars: number): string => `${(chars / 1_048_576).toFixed(1)} MB`;

/** Where to land: set up a client ID first, then import history, then the tables. */
const homePage = (config: AppConfig, history: null | StoredHistory): Page =>
  config.clientId ? history ? 'stats' : 'import' : 'setup';

export const useApp = (): AppViewProps => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<null | string>(null);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<null | StoredHistory>(null);
  const [page, setPage] = useState<Page>('setup');
  const systemDark = useSystemDark();

  const [loadProgress, setLoadProgress] = useState<LoadProgress>({ percent: 5, text: 'Starting up…' });

  // Load saved config + history once on startup, reporting each step to the loading screen.
  useEffect(() => {
    let cancelled = false;
    const step = async (percent: number, text: string): Promise<void> => {
      if (cancelled) {return;}
      setLoadProgress({ percent, text });
      await nextPaint();
    };
    void (async () => {
      try {
        await step(15, 'Loading settings…');
        const cfg = await storage.loadConfig();
        const hist = await storage.loadHistory(async (s) => {
          if (s.stage === 'reading') {await step(35, 'Loading your listening history…');}
          else {await step(70, `Reading ${formatMegabytes(s.bytes)} of listening history…`);}
        });
        await step(90, hist ? `Preparing stats for ${hist.plays.length.toLocaleString()} streams…` : 'Almost ready…');
        if (cancelled) {return;}
        setConfig(cfg);
        setHistory(hist);
        setPage(homePage(cfg, hist));
      } catch (err) {
        if (!cancelled) {setLoadError(err instanceof Error ? err.message : String(err));}
      } finally {
        if (!cancelled) {setLoading(false);}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Config writes are debounced: sliders and the colour picker fire on every move.
  const saveTimer = useRef<null | ReturnType<typeof setTimeout>>(null);
  const pendingConfig = useRef<AppConfig | null>(null);
  const persistConfig = useCallback((next: AppConfig) => {
    if (saveTimer.current) {clearTimeout(saveTimer.current);}
    pendingConfig.current = next;
    saveTimer.current = setTimeout(() => {
      pendingConfig.current = null;
      void storage.saveConfig(next).catch((err) => console.error('Failed to save config', err));
    }, 300);
  }, []);

  // Closing the window inside the debounce window would drop the last change - write it now.
  useEffect(() => {
    const flush = (): void => {
      if (!pendingConfig.current) {return;}
      if (saveTimer.current) {clearTimeout(saveTimer.current);}
      storage.saveConfigNow(pendingConfig.current);
      pendingConfig.current = null;
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  const updateConfig = useCallback(
    (patch: Partial<AppConfig>) => {
      setConfig((prev) => {
        const next = { ...prev, ...patch };
        persistConfig(next);
        return next;
      });
    },
    [persistConfig],
  );

  const updateTheme = useCallback(
    (patch: Partial<ThemeSettings>) => {
      setConfig((prev) => {
        const next = { ...prev, theme: { ...prev.theme, ...patch } };
        persistConfig(next);
        return next;
      });
    },
    [persistConfig],
  );

  const resetTheme = useCallback(() => updateTheme(DEFAULT_CONFIG.theme), [updateTheme]);

  const setHiddenColumns = useCallback(
    (category: StatCategory, keys: string[]) => {
      setConfig((prev) => {
        const next = { ...prev, hiddenColumns: { ...prev.hiddenColumns, [category]: keys } };
        persistConfig(next);
        return next;
      });
    },
    [persistConfig],
  );

  const columnSettings = useMemo<ColumnSettings>(
    () => ({ hidden: config.hiddenColumns, setHidden: setHiddenColumns }),
    [config.hiddenColumns, setHiddenColumns],
  );

  const saveClientId = useCallback(
    (clientId: string) => {
      updateConfig({ clientId });
      setPage(history ? 'stats' : 'import');
    },
    [updateConfig, history],
  );

  const replaceHistory = useCallback(async (next: StoredHistory) => {
    setHistory(next);
    setPage('stats');
    await storage.saveHistory(next);
  }, []);

  const clearHistory = useCallback(async () => {
    await storage.clearHistory();
    setHistory(null);
    setPage('import');
  }, []);

  const { borderRadius, compact, fontSize, mode, primaryColor } = config.theme;
  const isDark = mode === 'dark' || (mode === 'system' && systemDark);

  useEffect(() => {
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    void storage.setNativeTheme(mode);
  }, [isDark, mode]);

  const themeConfig = useMemo<ThemeConfig>(
    () => ({
      algorithm: [
        isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        ...(compact ? [theme.compactAlgorithm] : []),
      ],
      components: {
        Layout: {
          headerBg: isDark ? '#141414' : '#ffffff',
          headerHeight: HEADER_HEIGHT,
          headerPadding: '0 24px',
        },
      },
      token: { borderRadius, colorPrimary: primaryColor, fontSize },
    }),
    [isDark, compact, primaryColor, borderRadius, fontSize],
  );

  return {
    clearHistory,
    columnSettings,
    config,
    history,
    isDark,
    loadError,
    loading,
    loadProgress,
    navigate: setPage,
    page,
    replaceHistory,
    resetTheme,
    saveClientId,
    themeConfig,
    updateTheme,
  };
};
