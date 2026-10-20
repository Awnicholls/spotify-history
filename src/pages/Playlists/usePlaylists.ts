import { App } from 'antd';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import type { StatRow } from '../../lib/aggregate';
import { aggregate } from '../../lib/aggregate';
import { describeSpotifyError } from '../../spotify/spotifyApi';
import { useSpotifyControls } from '../../spotify/SpotifyContext';
import type { Play, StoredHistory } from '../../types/history';
import type { PlaylistsViewProps, YearPlaylist } from './Playlists.view';

export const PLAYLIST_SIZES = [10, 25, 50, 100, 200];
const MAX_SIZE = Math.max(...PLAYLIST_SIZES);

const defaultName = (size: number, year: number) => `Top ${size} songs of ${year}`;
const defaultDescription = (size: number, year: number) =>
  `My ${size} most played songs of ${year}, from my Spotify streaming history`;

interface ModalState {
  year: number;
  name: string;
  description: string;
  isPublic: boolean;
}

/** Spotify counts a stream as a play after 30 seconds. */
const MIN_PLAY_MS = 30_000;

/** Ranks songs per calendar year once; the size dropdown just slices. */
export const usePlaylists = ({ history }: { history: StoredHistory }): PlaylistsViewProps => {
  const plays = history.plays;
  const { message } = App.useApp();
  const spotify = useSpotifyControls();
  const [size, setSize] = useState(25);
  // The dropdown updates immediately; re-rendering up to 200 x years rows follows a frame later.
  const shownSize = useDeferredValue(size);
  const [created, setCreated] = useState<Record<string, { url: string; name: string }>>({});
  const [modal, setModal] = useState<ModalState | null>(null);
  const [saving, setSaving] = useState(false);
  const [addAllProgress, setAddAllProgress] = useState<{ done: number; total: number } | null>(null);

  const byYear = useMemo(() => {
    const groups = new Map<number, Play[]>();
    for (const p of plays) {
      if (p.kind !== 'track') continue;
      const year = new Date(p.ts).getFullYear();
      let list = groups.get(year);
      if (!list) groups.set(year, (list = []));
      list.push(p);
    }
    return [...groups.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, yearPlays]) => ({
        year,
        rows: aggregate(yearPlays, 'songs', MIN_PLAY_MS)
          .filter((r) => r.plays > 0)
          .slice(0, MAX_SIZE),
      }));
  }, [plays]);

  const createdKey = (year: number) => `${year}:${shownSize}`;

  const playlists = useMemo<YearPlaylist[]>(
    () =>
      byYear.map(({ year, rows }) => {
        const songs: StatRow[] = rows.slice(0, shownSize);
        return {
          year,
          songs,
          uris: songs.map((s) => s.uri).filter(Boolean),
          created: created[`${year}:${shownSize}`] ?? null,
        };
      }),
    [byYear, shownSize, created],
  );

  const { status, connect, playUris } = spotify;
  const ensureConnected = useCallback(() => {
    if (status === 'signedIn') return true;
    message.info('Connect Spotify first - opening sign-in.');
    connect();
    return false;
  }, [status, connect, message]);

  const create = async (year: number, name: string, description: string, isPublic: boolean) => {
    const playlist = playlists.find((p) => p.year === year);
    if (!playlist?.uris.length) throw new Error(`No playable songs for ${year}.`);
    const result = await spotify.createPlaylist(name, description, isPublic, playlist.uris);
    setCreated((c) => ({ ...c, [createdKey(year)]: { url: result.external_urls.spotify, name: result.name } }));
    return result;
  };

  // Stable callbacks so the memoised cards don't re-render while typing in the modal.
  const onAdd = useCallback(
    (year: number) => {
      if (!ensureConnected()) return;
      setModal({
        year,
        name: defaultName(shownSize, year),
        description: defaultDescription(shownSize, year),
        isPublic: false,
      });
    },
    [ensureConnected, shownSize],
  );

  const onPlay = useCallback(
    (year: number) => {
      const p = playlists.find((x) => x.year === year);
      if (p) void playUris(p.uris);
    },
    [playlists, playUris],
  );

  const onModalSave = async () => {
    if (!modal) return;
    const name = modal.name.trim() || defaultName(shownSize, modal.year);
    setSaving(true);
    try {
      await create(modal.year, name, modal.description.trim(), modal.isPublic);
      message.success(`Created "${name}" in your Spotify.`);
      setModal(null);
    } catch (err) {
      message.error(describeSpotifyError(err));
    } finally {
      setSaving(false);
    }
  };

  const onAddAll = async () => {
    if (!ensureConnected()) return;
    const todo = playlists.filter((p) => !p.created && p.uris.length);
    if (!todo.length) {
      message.info('All of these playlists are already in your Spotify.');
      return;
    }
    setAddAllProgress({ done: 0, total: todo.length });
    let done = 0;
    try {
      for (const p of todo) {
        await create(p.year, defaultName(shownSize, p.year), defaultDescription(shownSize, p.year), false);
        setAddAllProgress({ done: ++done, total: todo.length });
      }
      message.success(`Created ${done} playlist${done === 1 ? '' : 's'} in your Spotify.`);
    } catch (err) {
      message.error(`Stopped after ${done} of ${todo.length}: ${describeSpotifyError(err)}`);
    } finally {
      setAddAllProgress(null);
    }
  };

  return {
    size,
    shownSize,
    updating: size !== shownSize,
    sizes: PLAYLIST_SIZES,
    onSizeChange: setSize,
    playlists,
    connected: status === 'signedIn',
    currentUri: spotify.currentUri,
    onPlay,
    onAdd,
    onAddAll: () => void onAddAll(),
    addAllProgress,
    modal: modal
      ? {
          ...modal,
          saving,
          songCount: playlists.find((p) => p.year === modal.year)?.uris.length ?? 0,
          onChange: (patch) => setModal((m) => (m ? { ...m, ...patch } : m)),
          onSave: () => void onModalSave(),
          onCancel: () => setModal(null),
        }
      : null,
  };
};
