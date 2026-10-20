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
import type { MenuProps } from 'antd';
import { Avatar, Button, Dropdown, Flex, Popover, Slider, Spin, Tooltip, Typography, theme } from 'antd';
import { formatClock } from '../../lib/format';
import type { NowPlaying, SpotifyStatus } from '../../spotify/SpotifyContext';
import type { SpotifyDevice } from '../../spotify/spotifyApi';
import type { WebPlayerStatus } from '../../spotify/useWebPlayer';

export interface SpotifyPlayerViewProps {
  status: SpotifyStatus;
  userName: string | null;
  onConnect: () => void;
  onCancelConnect: () => void;
  onDisconnect: () => void;

  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  shuffle: boolean;
  progressMs: number;
  durationMs: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onSeekDrag: (ms: number) => void;
  onSeekCommit: (ms: number) => void;

  volume: number | null;
  onVolumeDrag: (pct: number) => void;
  onVolumeCommit: (pct: number) => void;

  /** Audio is coming from the app itself (Web Playback SDK) rather than another device. */
  inApp: boolean;
  playerStatus: WebPlayerStatus;
  device: SpotifyDevice | null;
  devices: SpotifyDevice[];
  onDevicesOpen: () => void;
  onTransfer: (deviceId: string) => void;
}

const ART = 44;

const deviceIcon = (type: string | undefined) =>
  type?.toLowerCase() === 'smartphone' ? <MobileOutlined /> : <LaptopOutlined />;

/** Spotify Connect remote in the header: now playing, transport, seek, volume and device. */
export const SpotifyPlayerView = (p: SpotifyPlayerViewProps) => {
  const { token } = theme.useToken();

  if (p.status === 'unavailable') return null;
  if (p.status === 'checking') return <Spin size="small" />;
  if (p.status === 'signedOut' || p.status === 'connecting') {
    return (
      <Flex align="center" gap={8}>
        <Button
          shape="round"
          icon={<SpotifyFilled />}
          loading={p.status === 'connecting'}
          onClick={p.onConnect}
        >
          {p.status === 'connecting' ? 'Waiting for browser…' : 'Connect Spotify'}
        </Button>
        {p.status === 'connecting' && (
          <Button type="link" size="small" onClick={p.onCancelConnect}>
            Cancel
          </Button>
        )}
      </Flex>
    );
  }

  const np = p.nowPlaying;
  const deviceItems: MenuProps['items'] = p.devices.length
    ? p.devices.map((d) => ({
        key: d.id ?? d.name,
        icon: deviceIcon(d.type),
        label: d.name,
        disabled: !d.id || d.is_restricted,
        style: d.is_active ? { color: token.colorPrimary, fontWeight: 600 } : undefined,
        onClick: () => d.id && p.onTransfer(d.id),
      }))
    : [{ key: 'none', label: 'No devices - open Spotify somewhere', disabled: true }];

  const accountItems: MenuProps['items'] = [
    { key: 'name', label: p.userName ?? 'Spotify', disabled: true },
    { type: 'divider' },
    { key: 'disconnect', icon: <DisconnectOutlined />, label: 'Disconnect Spotify', onClick: p.onDisconnect },
  ];

  const art = np?.imageUrl ? (
    <img src={np.imageUrl} alt="" width={ART} height={ART} style={{ borderRadius: 4, objectFit: 'cover', display: 'block' }} />
  ) : (
    <Avatar shape="square" size={ART} icon={<CustomerServiceOutlined />} />
  );

  return (
    <Flex align="center" gap={14} style={{ lineHeight: 'normal' }}>
      {np ? (
        <Popover
          placement="bottomRight"
          content={
            <Flex vertical gap={8} style={{ width: 240 }}>
              {np.largeImageUrl && (
                <img src={np.largeImageUrl} alt="" style={{ width: '100%', borderRadius: 6, display: 'block' }} />
              )}
              <Typography.Text strong>{np.title}</Typography.Text>
              <Typography.Text type="secondary">{np.subtitle}</Typography.Text>
              {np.album && <Typography.Text type="secondary" italic>{np.album}</Typography.Text>}
              {np.url && (
                <Typography.Link href={np.url} target="_blank" rel="noreferrer">
                  Open in Spotify
                </Typography.Link>
              )}
            </Flex>
          }
        >
          {art}
        </Popover>
      ) : (
        art
      )}

      <Flex vertical style={{ width: 190, minWidth: 0 }}>
        <Typography.Text strong ellipsis={{ tooltip: np?.title }}>
          {np?.title ?? 'Nothing playing'}
        </Typography.Text>
        <Typography.Text type="secondary" ellipsis={{ tooltip: true }} style={{ fontSize: 12 }}>
          {np ? [np.subtitle, np.album].filter(Boolean).join(' — ') : 'Press play on a song'}
        </Typography.Text>
      </Flex>

      <Flex vertical align="center" style={{ width: 250 }}>
        <Flex align="center" gap={4}>
          <Tooltip title={p.shuffle ? 'Shuffle on' : 'Shuffle off'}>
            <Button
              type="text"
              size="small"
              icon={<RetweetOutlined />}
              onClick={p.onToggleShuffle}
              style={{ color: p.shuffle ? token.colorPrimary : undefined }}
            />
          </Tooltip>
          <Button type="text" size="small" icon={<StepBackwardFilled />} onClick={p.onPrevious} aria-label="Previous" />
          <Button
            type="primary"
            shape="circle"
            icon={p.isPlaying ? <PauseOutlined /> : <CaretRightFilled />}
            onClick={p.onTogglePlay}
            aria-label={p.isPlaying ? 'Pause' : 'Play'}
          />
          <Button type="text" size="small" icon={<StepForwardFilled />} onClick={p.onNext} aria-label="Next" />
          <span style={{ width: 24 }} />
        </Flex>
        <Flex align="center" gap={10} style={{ width: '100%' }}>
          <Typography.Text type="secondary" style={{ fontSize: 11, minWidth: 34, textAlign: 'right' }}>
            {formatClock(p.progressMs)}
          </Typography.Text>
          <Slider
            style={{ flex: 1, margin: '4px 6px' }}
            min={0}
            max={Math.max(1, p.durationMs)}
            value={p.progressMs}
            disabled={!np}
            tooltip={{ formatter: (v) => formatClock(v ?? 0) }}
            onChange={p.onSeekDrag}
            onChangeComplete={p.onSeekCommit}
          />
          <Typography.Text type="secondary" style={{ fontSize: 11, minWidth: 34 }}>
            {formatClock(p.durationMs)}
          </Typography.Text>
        </Flex>
      </Flex>

      <Popover
        placement="bottom"
        content={
          <div style={{ height: 120, padding: '4px 0' }}>
            <Slider
              vertical
              min={0}
              max={100}
              value={p.volume ?? 0}
              disabled={p.volume === null}
              onChange={p.onVolumeDrag}
              onChangeComplete={p.onVolumeCommit}
            />
          </div>
        }
      >
        <Button type="text" icon={<SoundOutlined />} aria-label="Volume" />
      </Popover>

      <Dropdown
        menu={{ items: deviceItems }}
        trigger={['click']}
        onOpenChange={(open) => open && p.onDevicesOpen()}
      >
        <Tooltip
          title={
            p.inApp
              ? 'Playing in this app'
              : p.playerStatus === 'loading'
                ? 'Starting the in-app player…'
                : p.device
                  ? `Playing on ${p.device.name}`
                  : 'Choose a device'
          }
        >
          <Button
            type="text"
            icon={p.playerStatus === 'loading' ? <Spin size="small" /> : deviceIcon(p.device?.type)}
            style={{ color: p.inApp ? token.colorPrimary : undefined }}
          />
        </Tooltip>
      </Dropdown>

      <Dropdown menu={{ items: accountItems }} trigger={['click']}>
        <Button type="text" icon={<SpotifyFilled style={{ color: '#1DB954' }} />} aria-label="Spotify account" />
      </Dropdown>
    </Flex>
  );
};
