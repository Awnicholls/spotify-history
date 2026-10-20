# Spotify Utils

A desktop app for exploring your Spotify listening history. Drop in the extended streaming
history export Spotify gives you and get searchable tables, graphs and year-by-year playlists,
with a built-in player. Your data stays on your computer.

## Features

- **Stats** – your most played songs, artists, albums, podcasts and devices, sortable by plays,
  time listened, skips and more. Filter by year or date range, by device (down to a specific
  phone or console), and by how long a stream must last to count as a play.
- **Graphs**
  - Calendar heatmap of every day of the year. Click a day to see what you played on it.
  - Time-of-day heatmap of when you listen through the week.
  - Your top bands month by month, with each month's top 10.
  - Show all years, a single year or a range of years.
- **Playlists** – your top 10–200 songs for each year, ready to play or save to your Spotify
  account.
- **Player** – play any song, artist or playlist straight from the app, with play/pause, skip,
  seek, volume and device switching.
- **Themes** – light, dark or follow the system, with your own accent colour and layout density.

## Download

Get the latest version for macOS, Windows or Linux from the
[Releases page](https://github.com/Awnicholls/spotify-history/releases).

The builds aren't code-signed yet, so the first launch needs one extra step:

- **macOS** – right-click the app, choose **Open**, then **Open** again.
- **Windows** – on the SmartScreen prompt click **More info**, then **Run anyway**.

## Getting your listening history

1. Go to your Spotify [account privacy page](https://www.spotify.com/account/privacy/).
2. Under **Download your data**, tick **Extended streaming history** and request it.
3. Confirm the email Spotify sends. It can take up to 30 days. You'll then get a link to
   download `my_spotify_data.zip`.
4. Drag that zip into the app.

## Connecting Spotify

Playback and playlist saving use your own free Spotify developer app. The app walks you through
this on first launch:

1. Sign in to the [Spotify developer dashboard](https://developer.spotify.com/dashboard) and
   click **Create app**.
2. Add the redirect URI `http://127.0.0.1:4003/auth`.
3. Tick **Web API** and **Web Playback SDK**, then save.
4. Copy the **Client ID** into Spotify Utils.
5. Under **User Management**, add the email of every Spotify account that will use the app.

Playing music requires Spotify Premium.

## Privacy

Your history, settings and Spotify sign-in are stored only on your computer. The app talks
directly to Spotify and nowhere else.

## Building from source

Requires Node.js 22 or later.

```bash
npm install
npm run dev     # run in development
npm run dist    # build installers into release/
```

In-app playback needs the Electron build to be signed for Spotify's audio protection. This uses
a free castLabs account:

```bash
npm run vmp:setup      # one-time setup
npm run vmp:signup     # create the account (first time only)
npm run vmp:sign-dev   # sign the development build; repeat after reinstalling Electron
```
