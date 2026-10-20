/**
 * Electron main process: owns the window and a tiny JSON file store in the user-data folder
 * (`config.json` for settings, `history.json` for the imported streaming history).
 *
 * Runs on castLabs' Electron build (Electron + Widevine) so the renderer can host the Spotify
 * Web Playback SDK and play audio itself, the same way Spotify Knockout does inside WebView2.
 *
 * Compiled to CommonJS (`.cts` -> `dist-electron/main.cjs`) because the package is
 * `"type": "module"` and the sandboxed preload has to be CommonJS anyway.
 */
import * as electron from 'electron';
import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { ThemeSource } from '../shared/bridge';
import { startAppServer } from './appServer.cjs';
import * as spotifyAuth from './spotifyAuth.cjs';

const devServerUrl = process.env.VITE_DEV_SERVER_URL;

// Playback is started from the Web API, not a click inside the page, so let audio start
// without a user gesture (Knockout passes the same flag to WebView2).
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

// In development, keep Chromium (cookies, the Spotify SDK's storage) off the macOS Keychain.
// The dev Electron binary is unsigned and re-signed by `vmp:sign-dev`, so the Keychain treats
// it as a new app each time and prompts for your login password. Packaged builds use the real
// Keychain.
if (!app.isPackaged) app.commandLine.appendSwitch('use-mock-keychain');

/** castLabs-only API: Widevine is installed/updated as a component at startup. */
interface WidevineComponents {
  whenReady: () => Promise<unknown>;
  status: () => unknown;
}
const components = (electron as unknown as { components?: WidevineComponents }).components;

/** Wait (bounded) for Widevine so the player can initialise on first load. */
const widevineReady = async () => {
  if (!components) {
    console.warn('Not running castLabs Electron - Widevine unavailable, in-app playback will not work.');
    return;
  }
  try {
    await Promise.race([components.whenReady(), new Promise((r) => setTimeout(r, 20_000))]);
    console.log('Widevine components:', components.status());
  } catch (err) {
    console.error('Widevine component update failed:', err);
  }
};

let appUrl: string | null = null;

const dataDir = () => app.getPath('userData');
const configPath = () => path.join(dataDir(), 'config.json');
const historyPath = () => path.join(dataDir(), 'history.json');

const readText = async (file: string): Promise<string | null> => {
  try {
    return await fs.readFile(file, 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
};

/** Write via a temp file + rename so a crash mid-write never leaves a half-written file. */
const writeText = async (file: string, text: string) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, text, 'utf8');
  await fs.rename(tmp, file);
};

const isThemeSource = (value: unknown): value is ThemeSource =>
  value === 'light' || value === 'dark' || value === 'system';

const registerIpc = () => {
  ipcMain.handle('config:load', () => readText(configPath()));
  ipcMain.handle('config:save', (_e, json: unknown) => {
    if (typeof json !== 'string') throw new Error('config must be a JSON string');
    return writeText(configPath(), json);
  });
  ipcMain.handle('history:load', () => readText(historyPath()));
  ipcMain.handle('history:save', (_e, json: unknown) => {
    if (typeof json !== 'string') throw new Error('history must be a JSON string');
    return writeText(historyPath(), json);
  });
  ipcMain.handle('history:clear', () => fs.rm(historyPath(), { force: true }));
  ipcMain.handle('theme:set', (_e, source: unknown) => {
    if (isThemeSource(source)) nativeTheme.themeSource = source;
  });
  // Synchronous save for the renderer's beforeunload flush, so nothing is lost on close.
  ipcMain.on('config:save-sync', (e, json: unknown) => {
    try {
      if (typeof json === 'string') {
        fsSync.mkdirSync(dataDir(), { recursive: true });
        fsSync.writeFileSync(configPath(), json, 'utf8');
      }
    } finally {
      e.returnValue = null;
    }
  });

  ipcMain.handle('spotify:login', (_e, clientId: unknown) => {
    if (typeof clientId !== 'string' || !clientId) throw new Error('Missing client ID');
    return spotifyAuth.login(clientId);
  });
  ipcMain.handle('spotify:cancel-login', () => spotifyAuth.cancelLogin());
  ipcMain.handle('spotify:logout', () => spotifyAuth.logout());
  ipcMain.handle('spotify:token', (_e, clientId: unknown, force: unknown) =>
    typeof clientId === 'string' ? spotifyAuth.getAccessToken(clientId, force === true) : null,
  );
};

const createWindow = async () => {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 600,
    title: 'Spotify Utils',
    show: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#141414' : '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());

  // Links (Spotify dashboard, open.spotify.com, ...) open in the user's browser, never in-app.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) void shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (event, url) => {
    const current = win.webContents.getURL();
    if (url !== current) {
      event.preventDefault();
      if (url.startsWith('https://')) void shell.openExternal(url);
    }
  });

  if (devServerUrl) {
    await win.loadURL(devServerUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    appUrl ??= await startAppServer(path.join(__dirname, '..', 'dist'));
    await win.loadURL(appUrl);
  }
};

app.whenReady().then(async () => {
  registerIpc();
  await widevineReady();
  void createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
