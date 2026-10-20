import type { JSX, ReactNode } from 'react';

import { DeleteOutlined, DesktopOutlined, MoonOutlined, SunOutlined, UndoOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  ColorPicker,
  Descriptions,
  Flex,
  Form,
  Popconfirm,
  Segmented,
  Slider,
  Switch,
  Typography,
} from 'antd';

import type { SpotifyStatus } from '../../spotify/SpotifyContext';
import type { ThemeMode, ThemeSettings } from '../../types/config';

import { formatDate, formatDateTime, formatNumber } from '../../lib/format';
import { ThemePreview } from './components/ThemePreview';

export interface SettingsViewProps {
  clearing: boolean;
  clientId: string;
  colorPresets: string[];
  historyInfo: {
    files: string[];
    firstTs: number;
    importedAt: number;
    lastTs: number;
    streams: number;
  } | null;
  onChangeClientId: () => void;
  onClearHistory: () => void;
  onImport: () => void;
  onResetTheme: () => void;
  onSpotifyConnect: () => void;
  onSpotifyDisconnect: () => void;
  onThemeChange: (patch: Partial<ThemeSettings>) => void;
  redirectUri: string;
  spotifyStatus: SpotifyStatus;
  spotifyUser: null | string;
  theme: ThemeSettings;
}

const MODE_OPTIONS: { icon: ReactNode; label: string; value: ThemeMode; }[] = [
  { icon: <SunOutlined />, label: 'Light', value: 'light' },
  { icon: <MoonOutlined />, label: 'Dark', value: 'dark' },
  { icon: <DesktopOutlined />, label: 'System', value: 'system' },
];

export const SettingsView = ({
  clearing,
  clientId,
  colorPresets,
  historyInfo,
  onChangeClientId,
  onClearHistory,
  onImport,
  onResetTheme,
  onSpotifyConnect,
  onSpotifyDisconnect,
  onThemeChange,
  redirectUri,
  spotifyStatus,
  spotifyUser,
  theme,
}: SettingsViewProps): JSX.Element => (
  <Flex justify="center">
    <Flex gap={16} style={{ maxWidth: 820, width: '100%' }} vertical>
      <Typography.Title level={2} style={{ margin: 0 }}>
        Settings
      </Typography.Title>

      <Card
        extra={
          <Button icon={<UndoOutlined />} onClick={onResetTheme}>
            Reset to defaults
          </Button>
        }
        title="Appearance"
      >
        <Flex gap={32} wrap>
          <Form layout="vertical" style={{ flex: '1 1 320px' }}>
            <Form.Item label="Theme">
              <Segmented<ThemeMode>
                onChange={(mode) => onThemeChange({ mode })}
                options={MODE_OPTIONS}
                value={theme.mode}
              />
            </Form.Item>
            <Form.Item label="Accent colour">
              <ColorPicker
                disabledAlpha
                onChange={(color) => onThemeChange({ primaryColor: color.toHexString() })}
                presets={[{ colors: colorPresets, label: 'Presets' }]}
                showText
                value={theme.primaryColor}
              />
            </Form.Item>
            <Form.Item label="Compact layout" tooltip="Tighter spacing - fits more table rows on screen">
              <Switch checked={theme.compact} onChange={(compact) => onThemeChange({ compact })} />
            </Form.Item>
            <Form.Item label={`Corner radius (${theme.borderRadius}px)`}>
              <Slider
                max={16}
                min={0}
                onChange={(borderRadius) => onThemeChange({ borderRadius })}
                value={theme.borderRadius}
              />
            </Form.Item>
            <Form.Item label={`Font size (${theme.fontSize}px)`} style={{ marginBottom: 0 }}>
              <Slider
                max={18}
                min={12}
                onChange={(fontSize) => onThemeChange({ fontSize })}
                value={theme.fontSize}
              />
            </Form.Item>
          </Form>
          <div style={{ flex: '1 1 280px' }}>
            <ThemePreview />
          </div>
        </Flex>
      </Card>

      <Card extra={<Button onClick={onChangeClientId}>Change client ID</Button>} title="Spotify">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Client ID">
            <Typography.Text code copyable>
              {clientId || 'Not set'}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Redirect URI">
            <Typography.Text code copyable>
              {redirectUri}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Account">
            {spotifyStatus === 'signedIn' ? (
              <Flex align="center" gap={12}>
                <Typography.Text>Connected{spotifyUser ? ` as ${spotifyUser}` : ''}</Typography.Text>
                <Button onClick={onSpotifyDisconnect} size="small">
                  Disconnect
                </Button>
              </Flex>
            ) : spotifyStatus === 'unavailable' ? (
              <Typography.Text type="secondary">Available in the desktop app</Typography.Text>
            ) : (
              <Button
                loading={spotifyStatus === 'connecting' || spotifyStatus === 'checking'}
                onClick={onSpotifyConnect}
                size="small"
                type="primary"
              >
                Connect Spotify
              </Button>
            )}
          </Descriptions.Item>
        </Descriptions>
        <Typography.Paragraph style={{ margin: '8px 0 0' }} type="secondary">
          Playback is remote control: songs play on your Spotify app or device (Premium required).
          Playlists are created in the connected account.
        </Typography.Paragraph>
      </Card>

      <Card
        extra={
          <Flex gap={8}>
            <Button onClick={onImport} type="primary">
              {historyInfo ? 'Import new export' : 'Import history'}
            </Button>
            {historyInfo && (
              <Popconfirm
                description="The imported history is deleted from this app. Your zip file isn't touched."
                okButtonProps={{ danger: true }}
                okText="Remove"
                onConfirm={onClearHistory}
                title="Remove streaming history?"
              >
                <Button danger icon={<DeleteOutlined />} loading={clearing}>
                  Remove
                </Button>
              </Popconfirm>
            )}
          </Flex>
        }
        title="Streaming history"
      >
        {historyInfo ? (
          <Descriptions column={1} size="small">
            <Descriptions.Item label="Streams">{formatNumber(historyInfo.streams)}</Descriptions.Item>
            <Descriptions.Item label="Covers">
              {formatDate(historyInfo.firstTs)} – {formatDate(historyInfo.lastTs)}
            </Descriptions.Item>
            <Descriptions.Item label="Imported">{formatDateTime(historyInfo.importedAt)}</Descriptions.Item>
            <Descriptions.Item label="Files">
              <Typography.Text type="secondary">{historyInfo.files.join(', ')}</Typography.Text>
            </Descriptions.Item>
          </Descriptions>
        ) : (
          <Typography.Text type="secondary">No history imported yet.</Typography.Text>
        )}
      </Card>
    </Flex>
  </Flex>
);
