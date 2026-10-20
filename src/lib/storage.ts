import type { SpotifyUtilsBridge } from '../../shared/bridge';
import type { AppConfig, ThemeMode } from '../types/config';
import type { Play, StoredHistory } from '../types/history';

import { DEFAULT_CONFIG } from '../types/config';
import { HISTORY_VERSION } from '../types/history';

/**
 * Persistence for config and history. Inside Electron this goes through the preload bridge to
 * JSON files in the app's user-data folder; in a plain browser (`npm run dev:web`) it falls back
 * to localStorage, where a large history may not fit - that is reported, not fatal.
 */
const bridge = (): SpotifyUtilsBridge | undefined => window.spotifyUtils;

const CONFIG_KEY = 'spotify-utils:config';
const HISTORY_KEY = 'spotify-utils:history';

/** Saved config, or null if missing or unreadable. The file is only ever written by this app. */
const parseConfig = (text: null | string): null | Partial<AppConfig> => {
  if (!text) {return null;}
  try {
    const parsed: Partial<AppConfig> = JSON.parse(text);
    return parsed;
  } catch {
    return null;
  }
};

/** Saved config merged over the defaults, so new settings get sensible values. */
export const loadConfig = async (): Promise<AppConfig> => {
  const b = bridge();
  const text = b ? await b.loadConfig() : localStorage.getItem(CONFIG_KEY);
  const saved = parseConfig(text);
  return {
    ...DEFAULT_CONFIG,
    ...saved,
    theme: { ...DEFAULT_CONFIG.theme, ...saved?.theme },
  };
};

export const saveConfig = async (config: AppConfig): Promise<void> => {
  const json = JSON.stringify(config, null, 2);
  const b = bridge();
  if (b) {await b.saveConfig(json);}
  else {localStorage.setItem(CONFIG_KEY, json);}
};

/** Same as saveConfig, but blocks until written - used while the window is closing. */
export const saveConfigNow = (config: AppConfig): void => {
  const json = JSON.stringify(config, null, 2);
  const b = bridge();
  if (b) {b.saveConfigSync(json);}
  else {localStorage.setItem(CONFIG_KEY, json);}
};

type SavedHistory = Omit<StoredHistory, 'plays' | 'version'> & {
  plays: (Omit<Play, 'device'> & { device?: string })[];
  version: number;
};

/** Saved history in any version, or null if unreadable. Written only by this app. */
const parseSavedHistory = (text: string): null | SavedHistory => {
  try {
    const parsed: SavedHistory = JSON.parse(text);
    return parsed;
  } catch {
    return null;
  }
};

const isCurrentVersion = (saved: SavedHistory): saved is StoredHistory => saved.version === HISTORY_VERSION;

/** Upgrade older saves in place. v1 had no `device`; the family stands in until a re-import. */
const migrate = (saved: SavedHistory): null | StoredHistory => {
  if (!Array.isArray(saved.plays)) {return null;}
  if (isCurrentVersion(saved)) {return saved;}
  if (saved.version === 1) {
    return {
      ...saved,
      legacyDevices: true,
      plays: saved.plays.map((p) => ({ ...p, device: p.device ?? p.platform })),
      version: HISTORY_VERSION,
    };
  }
  return null;
};

/** Loading stages, for the startup progress screen. */
export type HistoryLoadStage = { bytes: number; stage: 'parsing'; } | { stage: 'reading' };

/** Let the UI paint (e.g. a progress update) before the next long synchronous step. */
const nextPaint = (): Promise<void> => new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

export const loadHistory = async (
  onStage?: (stage: HistoryLoadStage) => Promise<void> | void,
): Promise<null | StoredHistory> => {
  const b = bridge();
  await onStage?.({ stage: 'reading' });
  const text = b ? await b.loadHistory() : localStorage.getItem(HISTORY_KEY);
  if (!text) {return null;}
  await onStage?.({ bytes: text.length, stage: 'parsing' });
  await nextPaint();
  const saved = parseSavedHistory(text);
  return saved ? migrate(saved) : null;
};

export const saveHistory = async (history: StoredHistory): Promise<void> => {
  const json = JSON.stringify(history);
  const b = bridge();
  if (b) {await b.saveHistory(json);}
  else {localStorage.setItem(HISTORY_KEY, json);}
};

export const clearHistory = async (): Promise<void> => {
  const b = bridge();
  if (b) {await b.clearHistory();}
  else {localStorage.removeItem(HISTORY_KEY);}
};

export const setNativeTheme = async (mode: ThemeMode): Promise<void> => {
  await bridge()?.setThemeSource(mode);
};
