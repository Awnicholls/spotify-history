
/**
 * Serves the built renderer (`dist/`) on a loopback http origin in production.
 *
 * Widevine (and so the Spotify Web Playback SDK) needs a real, secure origin - `file://` pages
 * have an opaque origin that encrypted media won't work in. Loopback http is a secure context,
 * and matches what `npm run dev` uses, so dev and the packaged app behave the same. Spotify
 * Knockout does the equivalent with a WebView2 virtual https host.
 */
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';

const PREFERRED_PORT = 4004;

const MIME: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const listen = (server: http.Server, port: number): Promise<number> =>
  new Promise<number>((resolve, reject) => {
    const onError = (err: Error): void => reject(err);
    server.once('error', onError);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', onError);
      const address = server.address();
      resolve(typeof address === 'object' && address !== null ? address.port : port);
    });
  });

/** Start the server and return the URL to load (`http://127.0.0.1:<port>/`). */
export const startAppServer = async (root: string): Promise<string> => {
  const base = path.resolve(root);

  const server = http.createServer(async (req, res) => {
    try {
      const urlPath = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
      let file = path.resolve(base, `.${urlPath === '/' ? '/index.html' : urlPath}`);
      if (!file.startsWith(base + path.sep) && file !== base) {
        res.writeHead(403).end();
        return;
      }
      let body: Buffer;
      try {
        body = await fs.readFile(file);
      } catch {
        // Unknown paths fall back to the app shell.
        file = path.join(base, 'index.html');
        body = await fs.readFile(file);
      }
      res.writeHead(200, {
        'Cache-Control': 'no-cache',
        'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      });
      res.end(body);
    } catch {
      res.writeHead(500).end();
    }
  });

  let port: number;
  try {
    port = await listen(server, PREFERRED_PORT);
  } catch {
    // Port taken (another copy running?) - any free port works, the origin just changes.
    port = await listen(server, 0);
  }
  return `http://127.0.0.1:${port}/`;
};
