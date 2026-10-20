/**
 * Preload: exposes a narrow, typed bridge (`window.spotifyUtils`) to the sandboxed renderer.
 */
import { contextBridge, ipcRenderer } from 'electron';

import type { SpotifyUtilsBridge, ThemeSource } from '../shared/bridge';

const bridge: SpotifyUtilsBridge = {
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  loadConfig: () => ipcRenderer.invoke('config:load'),
  loadHistory: () => ipcRenderer.invoke('history:load'),
  platform: process.platform,
  reloadForWidevine: () => ipcRenderer.invoke('widevine:reload-once'),
  saveConfig: (json: string) => ipcRenderer.invoke('config:save', json),
  saveConfigSync: (json: string) => {
    ipcRenderer.sendSync('config:save-sync', json);
  },
  saveHistory: (json: string) => ipcRenderer.invoke('history:save', json),
  setThemeSource: (source: ThemeSource) => ipcRenderer.invoke('theme:set', source),
  spotifyCancelLogin: () => ipcRenderer.invoke('spotify:cancel-login'),
  spotifyGetToken: (clientId: string, forceRefresh?: boolean) =>
    ipcRenderer.invoke('spotify:token', clientId, Boolean(forceRefresh)),
  spotifyLogin: (clientId: string) => ipcRenderer.invoke('spotify:login', clientId),
  spotifyLogout: () => ipcRenderer.invoke('spotify:logout'),
  waitForWidevine: () => ipcRenderer.invoke('widevine:wait'),
};

contextBridge.exposeInMainWorld('spotifyUtils', bridge);
