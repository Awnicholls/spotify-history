import type { MenuProps } from 'antd';
import type { JSX } from 'react';

import {
  CaretRightFilled,
  CustomerServiceOutlined,
  DisconnectOutlined,
  LaptopOutlined,
  MobileOutlined,
  PauseOutlined,
  RetweetOutlined,
  SoundOutlined,
  SpotifyFilled,
  StepBackwardFilled,
  StepForwardFilled,
} from '@ant-design/icons';
import { Avatar, Button, Dropdown, Flex, Popover, Slider, Spin, theme, Tooltip, Typography } from 'antd';

import type { SpotifyDevice } from '../../spotify/spotifyApi';
import type { NowPlaying, SpotifyStatus } from '../../spotify/SpotifyContext';
import type { WebPlayerStatus } from '../../spotify/useWebPlayer';

import { formatClock } from '../../lib/format';

export interface SpotifyPlayerViewProps {
  device: null | SpotifyDevice;
  devices: SpotifyDevice[];
  durationMs: number;
  /** Audio is coming from the app itself (Web Playback SDK) rather than another device. */
  inApp: boolean;
  isPlaying: boolean;

  nowPlaying: NowPlaying | null;
  onCancelConnect: () => void;
  onConnect: () => void;
  onDevicesOpen: () => void;
  onDisconnect: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeekCommit: (ms: number) => void;
  onSeekDrag: (ms: number) => void;
  onTogglePlay: () => void;
  onToggleShuffle: () => void;

  onTransfer: (deviceId: string) => void;
  onVolumeCommit: (pct: number) => void;
  onVolumeDrag: (pct: number) => void;

  playerStatus: WebPlayerStatus;
  progressMs: number;
  shuffle: boolean;
  status: SpotifyStatus;
  userName: null | string;
  volume: null | number;
}

const ART = 44;

const deviceIcon = (type: string | undefined): JSX.Element =>
  type?.toLowerCase() === 'smartphone' ? <MobileOutlined /> : <LaptopOutlined />;

/** Spotify Connect remote in the header: now playing, transport, seek, volume and device. */
export const SpotifyPlayerView = (p: SpotifyPlayerViewProps): JSX.Element | null => {
  const { token } = theme.useToken();

  if (p.status === 'unavailable') {return null;}
  if (p.status === 'checking') {return <Spin size="small" />;}
  if (p.status === 'signedOut' || p.status === 'connecting') {
    return (
      <Flex align="center" gap={8}>
        <Button
          icon={<SpotifyFilled />}
          loading={p.status === 'connecting'}
          onClick={p.onConnect}
          shape="round"
        >
          {p.status === 'connecting' ? 'Waiting for browser…' : 'Connect Spotify'}
        </Button>
        {p.status === 'connecting' && (
          <Button onClick={p.onCancelConnect} size="small" type="link">
            Cancel
          </Button>
        )}
      </Flex>
    );
  }

  const np = p.nowPlaying;
  const deviceItems: MenuProps['items'] = p.devices.length
    ? p.devices.map((d) => ({
        disabled: !d.id || d.is_restricted,
        icon: deviceIcon(d.type),
        key: d.id ?? d.name,
        label: d.name,
        onClick: () => d.id && p.onTransfer(d.id),
        style: d.is_active ? { color: token.colorPrimary, fontWeight: 600 } : undefined,
      }))
    : [{ disabled: true, key: 'none', label: 'No devices - open Spotify somewhere' }];

  const accountItems: MenuProps['items'] = [
    { disabled: true, key: 'name', label: p.userName ?? 'Spotify' },
    { type: 'divider' },
    { icon: <DisconnectOutlined />, key: 'disconnect', label: 'Disconnect Spotify', onClick: p.onDisconnect },
  ];

  const art = np?.imageUrl ? (
    <img alt="" height={ART} src={np.imageUrl} style={{ borderRadius: 4, display: 'block', objectFit: 'cover' }} width={ART} />
  ) : (
    <Avatar icon={<CustomerServiceOutlined />} shape="square" size={ART} />
  );

  return (
    <Flex align="center" gap={14} style={{ lineHeight: 'normal' }}>
      {np ? (
        <Popover
          content={
            <Flex gap={8} style={{ width: 240 }} vertical>
              {np.largeImageUrl && (
                <img alt="" src={np.largeImageUrl} style={{ borderRadius: 6, display: 'block', width: '100%' }} />
              )}
              <Typography.Text strong>{np.title}</Typography.Text>
              <Typography.Text type="secondary">{np.subtitle}</Typography.Text>
              {np.album && <Typography.Text italic type="secondary">{np.album}</Typography.Text>}
              {np.url && (
                <Typography.Link href={np.url} rel="noreferrer" target="_blank">
                  Open in Spotify
                </Typography.Link>
              )}
            </Flex>
          }
          placement="bottomRight"
        >
          {art}
        </Popover>
      ) : (
        art
      )}

      <Flex style={{ minWidth: 0, width: 190 }} vertical>
        <Typography.Text ellipsis={{ tooltip: np?.title }} strong>
          {np?.title ?? 'Nothing playing'}
        </Typography.Text>
        <Typography.Text ellipsis={{ tooltip: true }} style={{ fontSize: 12 }} type="secondary">
          {np ? [np.subtitle, np.album].filter(Boolean).join(' — ') : 'Press play on a song'}
        </Typography.Text>
      </Flex>

      <Flex align="center" style={{ width: 250 }} vertical>
        <Flex align="center" gap={4}>
          <Tooltip title={p.shuffle ? 'Shuffle on' : 'Shuffle off'}>
            <Button
              icon={<RetweetOutlined />}
              onClick={p.onToggleShuffle}
              size="small"
              style={{ color: p.shuffle ? token.colorPrimary : undefined }}
              type="text"
            />
          </Tooltip>
          <Button aria-label="Previous" icon={<StepBackwardFilled />} onClick={p.onPrevious} size="small" type="text" />
          <Button
            aria-label={p.isPlaying ? 'Pause' : 'Play'}
            icon={p.isPlaying ? <PauseOutlined /> : <CaretRightFilled />}
            onClick={p.onTogglePlay}
            shape="circle"
            type="primary"
          />
          <Button aria-label="Next" icon={<StepForwardFilled />} onClick={p.onNext} size="small" type="text" />
          <span style={{ width: 24 }} />
        </Flex>
        <Flex align="center" gap={10} style={{ width: '100%' }}>
          <Typography.Text style={{ fontSize: 11, minWidth: 34, textAlign: 'right' }} type="secondary">
            {formatClock(p.progressMs)}
          </Typography.Text>
          <Slider
            disabled={!np}
            max={Math.max(1, p.durationMs)}
            min={0}
            onChange={p.onSeekDrag}
            onChangeComplete={p.onSeekCommit}
            style={{ flex: 1, margin: '4px 6px' }}
            tooltip={{ formatter: (v) => formatClock(v ?? 0) }}
            value={p.progressMs}
          />
          <Typography.Text style={{ fontSize: 11, minWidth: 34 }} type="secondary">
            {formatClock(p.durationMs)}
          </Typography.Text>
        </Flex>
      </Flex>

      <Popover
        content={
          <div style={{ height: 120, padding: '4px 0' }}>
            <Slider
              disabled={p.volume === null}
              max={100}
              min={0}
              onChange={p.onVolumeDrag}
              onChangeComplete={p.onVolumeCommit}
              value={p.volume ?? 0}
              vertical
            />
          </div>
        }
        placement="bottom"
      >
        <Button aria-label="Volume" icon={<SoundOutlined />} type="text" />
      </Popover>

      <Dropdown
        menu={{ items: deviceItems }}
        onOpenChange={(open) => open && p.onDevicesOpen()}
        trigger={['click']}
      >
        <Tooltip
          title={
            p.inApp
              ? 'Playing in this app'
              : p.playerStatus === 'loading'
                ? 'Starting the in-app player… (the first launch downloads the audio component, which can take a minute)'
                : p.device
                  ? `Playing on ${p.device.name}`
                  : 'Choose a device'
          }
        >
          <Button
            icon={p.playerStatus === 'loading' ? <Spin size="small" /> : deviceIcon(p.device?.type)}
            style={{ color: p.inApp ? token.colorPrimary : undefined }}
            type="text"
          />
        </Tooltip>
      </Dropdown>

      <Dropdown menu={{ items: accountItems }} trigger={['click']}>
        <Button aria-label="Spotify account" icon={<SpotifyFilled style={{ color: '#1DB954' }} />} type="text" />
      </Dropdown>
    </Flex>
  );
};
