import type { ThemeMode, AppConfig } from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';
import type { Play, StoredHistory } from '../types/history';
import { HISTORY_VERSION } from '../types/history';

/**
 * Persistence for config and history. Inside Electron this goes through the preload bridge to
 * JSON files in the app's user-data folder; in a plain browser (`npm run dev:web`) it falls back
 * to localStorage, where a large history may not fit - that is reported, not fatal.
 */
const bridge = () => window.spotifyUtils;

const CONFIG_KEY = 'spotify-utils:config';
const HISTORY_KEY = 'spotify-utils:history';

const parseJson = <T>(text: string | null): T | null => {
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

/** Saved config merged over the defaults, so new settings get sensible values. */
export const loadConfig = async (): Promise<AppConfig> => {
  const b = bridge();
  const text = b ? await b.loadConfig() : localStorage.getItem(CONFIG_KEY);
  const saved = parseJson<Partial<AppConfig>>(text);
  return {
    ...DEFAULT_CONFIG,
    ...saved,
    theme: { ...DEFAULT_CONFIG.theme, ...saved?.theme },
  };
};

export const saveConfig = async (config: AppConfig): Promise<void> => {
  const json = JSON.stringify(config, null, 2);
  const b = bridge();
  if (b) await b.saveConfig(json);
  else localStorage.setItem(CONFIG_KEY, json);
};

/** Same as saveConfig, but blocks until written - used while the window is closing. */
export const saveConfigNow = (config: AppConfig): void => {
  const json = JSON.stringify(config, null, 2);
  const b = bridge();
  if (b) b.saveConfigSync(json);
  else localStorage.setItem(CONFIG_KEY, json);
};

type SavedHistory = Omit<StoredHistory, 'version' | 'plays'> & {
  version: number;
  plays: (Omit<Play, 'device'> & { device?: string })[];
};

/** Upgrade older saves in place. v1 had no `device`; the family stands in until a re-import. */
const migrate = (saved: SavedHistory): StoredHistory | null => {
  if (!Array.isArray(saved.plays)) return null;
  if (saved.version === HISTORY_VERSION) return saved as StoredHistory;
  if (saved.version === 1) {
    return {
      ...saved,
      version: HISTORY_VERSION,
      legacyDevices: true,
      plays: saved.plays.map((p) => ({ ...p, device: p.device ?? p.platform })),
    };
  }
  return null;
};

export const loadHistory = async (): Promise<StoredHistory | null> => {
  const b = bridge();
  const text = b ? await b.loadHistory() : localStorage.getItem(HISTORY_KEY);
  const saved = parseJson<SavedHistory>(text);
  return saved ? migrate(saved) : null;
};

export const saveHistory = async (history: StoredHistory): Promise<void> => {
  const json = JSON.stringify(history);
  const b = bridge();
  if (b) await b.saveHistory(json);
  else localStorage.setItem(HISTORY_KEY, json);
};

export const clearHistory = async (): Promise<void> => {
  const b = bridge();
  if (b) await b.clearHistory();
  else localStorage.removeItem(HISTORY_KEY);
};

export const setNativeTheme = async (mode: ThemeMode): Promise<void> => {
  await bridge()?.setThemeSource(mode);
};
