/**
 * Spotify sign-in for the main process: Authorization Code + PKCE with a loopback redirect
 * (no client secret), the same approach as Spotify Knockout's PkceAuth.cs.
 *
 * The refresh token lives only in the main process, in `auth.json` under user data, encrypted
 * with the OS keychain via `safeStorage` when available. The renderer only ever receives
 * short-lived access tokens.
 */
import { app, safeStorage, shell } from 'electron';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

export const AUTH_PORT = 4003;
export const REDIRECT_URI = `http://127.0.0.1:${AUTH_PORT}/auth`;
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const LOGIN_TIMEOUT_MS = 5 * 60_000;

/** `streaming` + `user-read-email` are what the Web Playback SDK needs to act as a device. */
const REQUIRED_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-modify-private',
  'playlist-modify-public',
];
const SCOPES = REQUIRED_SCOPES.join(' ');

/** Tokens granted before a scope was added can't do everything - sign in again for those. */
const hasRequiredScopes = (granted: string | undefined): boolean => {
  const set = new Set((granted ?? '').split(' '));
  return REQUIRED_SCOPES.every((s) => set.has(s));
};

interface StoredAuth {
  clientId: string;
  encrypted: boolean;
  /** base64; safeStorage-encrypted when `encrypted` is true. */
  refreshToken: string;
  scope?: string;
}

interface Session {
  accessToken: null | string;
  clientId: string;
  expiresAt: number;
  refreshToken: string;
  scope: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

const authPath = (): string => path.join(app.getPath('userData'), 'auth.json');

let session: null | Session = null;
let loaded = false;
let refreshing: null | Promise<null | string> = null;
let pendingLogin: { cancel: (reason: Error) => void } | null = null;

const base64url = (buf: Buffer): string => buf.toString('base64url');

const persist = async (s: null | Session): Promise<void> => {
  if (!s) {
    await fs.rm(authPath(), { force: true });
    return;
  }
  // Keychain encryption only in the packaged app. The dev Electron binary is unsigned and gets
  // re-signed by `vmp:sign-dev`, so macOS would ask for your login password on every launch.
  const encrypted = app.isPackaged && safeStorage.isEncryptionAvailable();
  const stored: StoredAuth = {
    clientId: s.clientId,
    encrypted,
    refreshToken: encrypted
      ? safeStorage.encryptString(s.refreshToken).toString('base64')
      : Buffer.from(s.refreshToken, 'utf8').toString('base64'),
    scope: s.scope,
  };
  await fs.mkdir(path.dirname(authPath()), { recursive: true });
  await fs.writeFile(authPath(), JSON.stringify(stored), 'utf8');
};

const load = async (): Promise<void> => {
  if (loaded) {return;}
  loaded = true;
  try {
    // Written only by this module (see persist).
    const stored: StoredAuth = JSON.parse(await fs.readFile(authPath(), 'utf8'));
    const raw = Buffer.from(stored.refreshToken, 'base64');
    session = {
      accessToken: null,
      clientId: stored.clientId,
      expiresAt: 0,
      refreshToken: stored.encrypted ? safeStorage.decryptString(raw) : raw.toString('utf8'),
      scope: stored.scope ?? '',
    };
  } catch {
    session = null; // missing or unreadable - treat as signed out
  }
};

/** A failed token request, with Spotify's OAuth error code (e.g. `invalid_grant`). */
class TokenError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

const requestToken = async (params: Record<string, string>): Promise<TokenResponse> => {
  const res = await fetch(TOKEN_URL, {
    body: new URLSearchParams(params),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  let body: Partial<TokenResponse> & { error?: string; error_description?: string } = {};
  try {
    body = JSON.parse(await res.text());
  } catch {
    // Not JSON - handled below as a failed request.
  }
  if (!res.ok || !body.access_token || !body.expires_in) {
    throw new TokenError(
      body.error_description ?? body.error ?? `Token request failed (${res.status})`,
      body.error,
    );
  }
  return {
    access_token: body.access_token,
    expires_in: body.expires_in,
    refresh_token: body.refresh_token,
    scope: body.scope,
  };
};

const page = (title: string, text: string): string =>
  `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
  `<body style="font-family:system-ui;background:#121212;color:#fff;display:grid;place-items:center;height:100vh;margin:0">` +
  `<div style="text-align:center"><h2>${title}</h2><p style="color:#b3b3b3">${text}</p></div></body>`;

/** Start a one-shot loopback server and resolve with the `code` Spotify redirects back with. */
const waitForCode = (state: string, authorizeUrl: string): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', REDIRECT_URI);
      if (url.pathname.replace(/\/$/, '') !== '/auth') {
        res.writeHead(404).end();
        return;
      }
      const error = url.searchParams.get('error');
      const code = url.searchParams.get('code');
      const ok = !error && code && url.searchParams.get('state') === state;
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(
        ok
          ? page('Connected to Spotify', 'You can close this tab and go back to Spotify Utils.')
          : page('Spotify sign-in failed', error ?? 'Unexpected response. Please try again.'),
      );
      finish(ok ? null : new Error(error === 'access_denied' ? 'Spotify access was denied.' : `Spotify sign-in failed: ${error ?? 'state mismatch'}`), code);
    });

    const timer = setTimeout(() => finish(new Error('Timed out waiting for Spotify sign-in.')), LOGIN_TIMEOUT_MS);

    let done = false;
    function finish(err: Error | null, code?: null | string): void {
      if (done) {return;}
      done = true;
      clearTimeout(timer);
      pendingLogin = null;
      server.close();
      if (err || !code) {reject(err ?? new Error('No authorization code received.'));}
      else {resolve(code);}
    }

    pendingLogin = { cancel: (reason) => finish(reason) };

    server.once('error', (err: NodeJS.ErrnoException) => {
      finish(
        err.code === 'EADDRINUSE'
          ? new Error(`Port ${AUTH_PORT} is in use - close whatever is using it and try again.`)
          : err,
      );
    });
    server.listen(AUTH_PORT, '127.0.0.1', () => void shell.openExternal(authorizeUrl));
  });

export const login = async (clientId: string): Promise<void> => {
  pendingLogin?.cancel(new Error('Sign-in restarted.'));

  const verifier = base64url(crypto.randomBytes(64));
  const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
  const state = base64url(crypto.randomBytes(16));
  const authorizeUrl =
    'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      client_id: clientId,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: SCOPES,
      state,
    }).toString();

  const code = await waitForCode(state, authorizeUrl);
  const tokens = await requestToken({
    client_id: clientId,
    code,
    code_verifier: verifier,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  });
  if (!tokens.refresh_token) {throw new Error('Spotify did not return a refresh token.');}

  session = {
    accessToken: tokens.access_token,
    clientId,
    expiresAt: Date.now() + tokens.expires_in * 1000,
    refreshToken: tokens.refresh_token,
    scope: tokens.scope ?? SCOPES,
  };
  loaded = true;
  await persist(session);
};

export const cancelLogin = (): void => pendingLogin?.cancel(new Error('Sign-in cancelled.'));

export const logout = async (): Promise<void> => {
  session = null;
  loaded = true;
  await persist(null);
};

/**
 * A valid access token for `clientId`, refreshing when close to expiry. Null when signed out,
 * signed in with a different client ID, or the refresh token was revoked.
 */
export const getAccessToken = async (clientId: string, forceRefresh = false): Promise<null | string> => {
  await load();
  if (!session || session.clientId !== clientId) {return null;}
  if (!hasRequiredScopes(session.scope)) {
    await logout();
    return null;
  }
  if (!forceRefresh && session.accessToken && session.expiresAt - 60_000 > Date.now()) {return session.accessToken;}

  refreshing ??= (async () => {
    const s = session;
    try {
      const tokens = await requestToken({
        client_id: s.clientId,
        grant_type: 'refresh_token',
        refresh_token: s.refreshToken,
      });
      s.accessToken = tokens.access_token;
      s.expiresAt = Date.now() + tokens.expires_in * 1000;
      if (tokens.scope) {s.scope = tokens.scope;}
      if (tokens.refresh_token && tokens.refresh_token !== s.refreshToken) {
        s.refreshToken = tokens.refresh_token;
        await persist(s);
      }
      return s.accessToken;
    } catch (err) {
      if (err instanceof TokenError && err.code === 'invalid_grant') {
        await logout();
        return null;
      }
      throw err;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
};
