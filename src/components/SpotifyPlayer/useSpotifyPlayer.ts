import { useEffect, useState } from 'react';
import { useSpotifyControls, useSpotifyPlayback } from '../../spotify/SpotifyContext';
import type { SpotifyPlayerViewProps } from './SpotifyPlayer.view';

/** Header player: ticks the progress bar locally between polls and handles seek/volume drags. */
export const useSpotifyPlayer = (): SpotifyPlayerViewProps => {
  const controls = useSpotifyControls();
  const playback = useSpotifyPlayback();
  const [now, setNow] = useState(() => Date.now());
  const [dragMs, setDragMs] = useState<number | null>(null);
  const [dragVolume, setDragVolume] = useState<number | null>(null);

  useEffect(() => {
    if (!playback.isPlaying) return;
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, [playback.isPlaying]);

  const durationMs = playback.nowPlaying?.durationMs ?? 0;
  const liveProgress = playback.isPlaying
    ? Math.min(durationMs, playback.progressMs + Math.max(0, now - playback.progressAt))
    : playback.progressMs;

  return {
    status: controls.status,
    userName: controls.user?.display_name ?? controls.user?.id ?? null,
    onConnect: controls.connect,
    onCancelConnect: controls.cancelConnect,
    onDisconnect: controls.disconnect,

    nowPlaying: playback.nowPlaying,
    isPlaying: playback.isPlaying,
    shuffle: playback.shuffle,
    progressMs: dragMs ?? liveProgress,
    durationMs,
    onTogglePlay: () => void controls.togglePlay(),
    onNext: () => void playback.next(),
    onPrevious: () => void playback.previous(),
    onToggleShuffle: () => void playback.toggleShuffle(),
    onSeekDrag: setDragMs,
    onSeekCommit: (ms) => {
      setDragMs(null);
      void playback.seek(ms);
    },

    volume: dragVolume ?? playback.device?.volume_percent ?? null,
    onVolumeDrag: setDragVolume,
    onVolumeCommit: (pct) => {
      setDragVolume(null);
      void playback.setVolume(pct);
    },

    inApp: playback.inApp,
    playerStatus: playback.playerStatus,
    device: playback.device,
    devices: playback.devices,
    onDevicesOpen: () => void playback.refreshDevices(),
    onTransfer: (id) => void playback.transfer(id),
  };
};
