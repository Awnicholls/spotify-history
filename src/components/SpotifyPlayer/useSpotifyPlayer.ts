import { useEffect, useState } from 'react';

import type { SpotifyPlayerViewProps } from './SpotifyPlayer.view';

import { useSpotifyControls, useSpotifyPlayback } from '../../spotify/SpotifyContext';

/** Header player: ticks the progress bar locally between polls and handles seek/volume drags. */
export const useSpotifyPlayer = (): SpotifyPlayerViewProps => {
  const controls = useSpotifyControls();
  const playback = useSpotifyPlayback();
  const [now, setNow] = useState(() => Date.now());
  const [dragMs, setDragMs] = useState<null | number>(null);
  const [dragVolume, setDragVolume] = useState<null | number>(null);

  useEffect(() => {
    if (!playback.isPlaying) {return undefined;}
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [playback.isPlaying]);

  const durationMs = playback.nowPlaying?.durationMs ?? 0;
  const liveProgress = playback.isPlaying
    ? Math.min(durationMs, playback.progressMs + Math.max(0, now - playback.progressAt))
    : playback.progressMs;

  return {
    device: playback.device,
    devices: playback.devices,
    durationMs,
    inApp: playback.inApp,
    isPlaying: playback.isPlaying,

    nowPlaying: playback.nowPlaying,
    onCancelConnect: controls.cancelConnect,
    onConnect: controls.connect,
    onDevicesOpen: () => void playback.refreshDevices(),
    onDisconnect: controls.disconnect,
    onNext: () => void playback.next(),
    onPrevious: () => void playback.previous(),
    onSeekCommit: (ms) => {
      setDragMs(null);
      void playback.seek(ms);
    },
    onSeekDrag: setDragMs,
    onTogglePlay: () => void controls.togglePlay(),
    onToggleShuffle: () => void playback.toggleShuffle(),

    onTransfer: (id) => void playback.transfer(id),
    onVolumeCommit: (pct) => {
      setDragVolume(null);
      void playback.setVolume(pct);
    },
    onVolumeDrag: setDragVolume,

    playerStatus: playback.playerStatus,
    progressMs: dragMs ?? liveProgress,
    shuffle: playback.shuffle,
    status: controls.status,
    userName: controls.user?.display_name ?? controls.user?.id ?? null,
    volume: dragVolume ?? playback.device?.volume_percent ?? null,
  };
};
