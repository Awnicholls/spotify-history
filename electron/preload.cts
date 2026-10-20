/**
 * Preload: exposes a narrow, typed bridge (`window.spotifyUtils`) to the sandboxed renderer.
 */
import { contextBridge, ipcRenderer } from 'electron';
import type { SpotifyUtilsBridge, ThemeSource } from '../shared/bridge';

const bridge: SpotifyUtilsBridge = {
  loadConfig: () => ipcRenderer.invoke('config:load'),
  saveConfig: (json: string) => ipcRenderer.invoke('config:save', json),
  saveConfigSync: (json: string) => {
    ipcRenderer.sendSync('config:save-sync', json);
  },
  loadHistory: () => ipcRenderer.invoke('history:load'),
  saveHistory: (json: string) => ipcRenderer.invoke('history:save', json),
  clearHistory: () => ipcRenderer.invoke('history:clear'),
  setThemeSource: (source: ThemeSource) => ipcRenderer.invoke('theme:set', source),
  spotifyLogin: (clientId: string) => ipcRenderer.invoke('spotify:login', clientId),
  spotifyCancelLogin: () => ipcRenderer.invoke('spotify:cancel-login'),
  spotifyLogout: () => ipcRenderer.invoke('spotify:logout'),
  spotifyGetToken: (clientId: string, forceRefresh?: boolean) =>
    ipcRenderer.invoke('spotify:token', clientId, !!forceRefresh),
  platform: process.platform,
};

contextBridge.exposeInMainWorld('spotifyUtils', bridge);
