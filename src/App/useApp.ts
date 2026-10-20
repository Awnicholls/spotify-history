import type { ThemeConfig } from 'antd';
import { theme } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSystemDark } from '../hooks/useSystemDark';
import { HEADER_HEIGHT } from '../lib/layout';
import * as storage from '../lib/storage';
import type { AppConfig, ThemeSettings } from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';
import type { StoredHistory } from '../types/history';
import type { AppViewProps, Page } from './App.view';

/** Where to land: set up a client ID first, then import history, then the tables. */
const homePage = (config: AppConfig, history: StoredHistory | null): Page =>
  !config.clientId ? 'setup' : !history ? 'import' : 'stats';

export const useApp = (): AppViewProps => {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [history, setHistory] = useState<StoredHistory | null>(null);
  const [page, setPage] = useState<Page>('setup');
  const systemDark = useSystemDark();

  // Load saved config + history once on startup.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cfg, hist] = await Promise.all([storage.loadConfig(), storage.loadHistory()]);
        if (cancelled) return;
        setConfig(cfg);
        setHistory(hist);
        setPage(homePage(cfg, hist));
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Config writes are debounced: sliders and the colour picker fire on every move.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConfig = useRef<AppConfig | null>(null);
  const persistConfig = useCallback((next: AppConfig) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    pendingConfig.current = next;
    saveTimer.current = setTimeout(() => {
      pendingConfig.current = null;
      void storage.saveConfig(next).catch((err) => console.error('Failed to save config', err));
    }, 300);
  }, []);

  // Closing the window inside the debounce window would drop the last change - write it now.
  useEffect(() => {
    const flush = () => {
      if (!pendingConfig.current) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
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

  const { mode, primaryColor, compact, borderRadius, fontSize } = config.theme;
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
      token: { colorPrimary: primaryColor, borderRadius, fontSize },
      components: {
        Layout: {
          headerBg: isDark ? '#141414' : '#ffffff',
          headerPadding: '0 24px',
          headerHeight: HEADER_HEIGHT,
        },
      },
    }),
    [isDark, compact, primaryColor, borderRadius, fontSize],
  );

  return {
    loading,
    loadError,
    isDark,
    themeConfig,
    config,
    history,
    page,
    navigate: setPage,
    saveClientId,
    updateTheme,
    resetTheme,
    replaceHistory,
    clearHistory,
  };
};
