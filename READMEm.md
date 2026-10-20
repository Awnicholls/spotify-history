# Spotify Utils

An Electron + React + antd desktop app for digging through your Spotify **extended streaming
history**: most played songs, artists, albums, podcasts and devices, ranked by plays, time
listened, skips and more. Everything is read and stored locally.

## Flow

1. **Setup** – enter your own Spotify client ID (same how-to as Spotify Knockout), register
   the redirect URI `http://127.0.0.1:4003/auth` and tick **Web API** + **Web Playback SDK** in
   your dashboard app.
2. **Import history** – drag in (or browse to) the `my_spotify_data.zip` Spotify emails you. The
   extracted `Streaming_History_Audio_*.json` / `Streaming_History_Video_*.json` files work too.
3. **Stats** – global filters (year / last 30 days / last 12 months / custom range, a device tree
   down to individual phones and consoles, what counts as a play, private sessions), headline
   numbers, and a tab per category with a searchable, sortable, filterable table. The Devices tab
   expands each device type into the specific devices.
4. **Graphs** – one year scope (all years, a single year or a range) shared by three tabs:
   a **calendar heatmap** (12 month grids, each day coloured by listening summed over the
   selected years; click a day or month name for the songs played then, playable), a
   **time-of-day** weekday × hour heatmap (local time), and **top bands by month**: a monthly
   stacked area chart of your biggest artists (share or hours), with each month's own top 10 in
   the tooltip and in a playable list underneath.
5. **Playlists** – top 10/25/50/100/200 songs of each year as cards. Play one, add one to Spotify
   (rename it first), or add them all with the standard names.
6. **Player** (header, top right) – click **Connect Spotify** to sign in (PKCE, no secret).
   Same as Spotify Knockout: the app registers itself as a Spotify device with the **Web
   Playback SDK** and plays the audio itself (Premium required). The header shows art, track,
   artist and album with shuffle, previous, play/pause, next, seek, volume and device switching.
   The play button on a table row plays from that row down. If in-app audio can't start (no
   Widevine / no Premium) or you pick another device, it remote-controls that device instead.
7. **Settings** – light/dark/system theme, accent colour, compact layout, corner radius, font size
   (applied live), client ID, Spotify account and the imported history.

## Terms

- **Stream** – any row in the export, however short.
- **Play** – a stream at least N seconds long (default 30s, which is what Spotify counts).
- **Skip** – Spotify's `skipped` flag (or "next" pressed, for old exports where it's empty).
- Songs are grouped by title + artist, so the same song on a single and an album counts once.

## Scripts

```bash
npm install
npm run dev        # Vite dev server + Electron with hot reload
npm run dev:web    # renderer only, in a browser (storage falls back to localStorage)
npm run build      # typecheck, build renderer to dist/ and main/preload to dist-electron/
npm start          # run the built app
npm run dist       # package with electron-builder into release/
npm run lint
npm run typecheck
```

## In-app audio (castLabs Electron)

Spotify's audio is DRM-protected (Widevine). WebView2 has Widevine built in, which is why
Knockout just works; stock Electron does not. This app depends on
[castLabs' Electron build](https://github.com/castlabs/electron-releases) (`electron` in
`package.json` points at `v44.5.1+wvcus`), which adds it. On first launch the Widevine module
downloads in the background - the app waits up to 20s for it.

The packaged app serves its UI from `http://127.0.0.1:4004` (`electron/appServer.cts`) because
Widevine won't run on `file://` pages - the equivalent of Knockout's virtual https host.

### VMP signing (required for Spotify)

Spotify's licence server only unlocks audio for Widevine clients with a **production VMP
signature**. castLabs builds ship with a development one, so unsigned you'll see the SDK
connect, audio segments download, then `POST .../widevine-license/v1/audio/license` fail with
**500** and nothing plays. (When that happens the app falls back to playing on your Spotify app
and says so.) Signing is free with a castLabs EVS account:

```bash
npm run vmp:setup      # once - makes .venv-evs and installs castlabs-evs there (no system pip)
npm run vmp:signup     # once - creates the free EVS account (emails a confirmation code)
npm run vmp:sign-dev   # signs node_modules/electron/dist
npm run dev
```

Re-run `npm run vmp:sign-dev` after every `npm install` that reinstalls Electron
(`npm run vmp:verify-dev` checks it). `npm run vmp:login` logs in again when the token expires
(monthly).

Packaged builds are signed automatically by the `afterPack` hook (`scripts/vmp-sign.cjs`) on
macOS/Windows when EVS is installed and logged in. In GitHub Actions add `EVS_ACCOUNT_NAME` and
`EVS_PASSWD` repository secrets; without them releases still build but in-app audio won't work.
Linux needs no VMP signature.

## Where data lives

Everything persists across restarts, in Electron's user-data folder
(`~/Library/Application Support/spotify-utils` on macOS, `%APPDATA%\spotify-utils` on Windows):

- `config.json` – client ID and theme settings (flushed synchronously on close)
- `history.json` – the imported, normalised history
- `auth.json` – Spotify refresh token, encrypted with the OS keychain via `safeStorage`

## Releases

`.github/workflows/release.yml` runs on every push to `main`: it works out the next version from
the latest `v*` tag, builds a macOS dmg (arm64 + x64), a Windows installer and a Linux AppImage,
then creates the tag and a GitHub Release with generated notes.

- Patch bump by default; put `#minor` or `#major` in the commit message to bump more.
- `[skip release]` in the commit message skips it. Markdown-only changes don't trigger it.
- Run it from the Actions tab to choose the bump manually.
- The first release uses `package.json`'s version (0.1.0).
- Builds are unsigned, so macOS Gatekeeper and Windows SmartScreen will warn on first launch.

## Layout

| Path | Purpose |
| --- | --- |
| `electron/main.cts` | Window, external-link handling, JSON file store over IPC. |
| `electron/spotifyAuth.cts` | PKCE sign-in with a loopback redirect, token refresh and storage. |
| `src/spotify/` | Web API client, Web Playback SDK player, and the shared connection/playback state. |
| `electron/appServer.cts` | Loopback server for the built UI (Widevine needs a real origin). |
| `src/components/SpotifyPlayer/` | The header player. |
| `electron/preload.cts` | Exposes `window.spotifyUtils` (typed in `shared/bridge.d.ts`). |
| `src/App/` | Root: loads config + history, builds the antd theme, page switching. |
| `src/pages/Setup/` | Client ID entry + how to create one. |
| `src/pages/ImportHistory/` | Zip drop zone. |
| `src/pages/Stats/` | Filters, summary cards and the ranked tables. |
| `src/pages/Playlists/` | Top-N-per-year cards and creating them in Spotify. |
| `src/pages/Settings/` | Theme, client ID and history management. |
| `src/lib/parseHistory.ts` | Unzips and normalises the export into `Play`s. |
| `src/lib/aggregate.ts` | Filtering, per-category aggregation and summary numbers. |

Pages follow the container / hook / view split described in `AGENTS.md`.
