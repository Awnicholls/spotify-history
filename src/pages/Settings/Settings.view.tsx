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
import type { ReactNode } from 'react';
import { formatDate, formatDateTime, formatNumber } from '../../lib/format';
import type { SpotifyStatus } from '../../spotify/SpotifyContext';
import type { ThemeMode, ThemeSettings } from '../../types/config';
import { ThemePreview } from './components/ThemePreview';

export interface SettingsViewProps {
  theme: ThemeSettings;
  colorPresets: string[];
  clientId: string;
  redirectUri: string;
  historyInfo: {
    streams: number;
    firstTs: number;
    lastTs: number;
    importedAt: number;
    files: string[];
  } | null;
  clearing: boolean;
  spotifyStatus: SpotifyStatus;
  spotifyUser: string | null;
  onSpotifyConnect: () => void;
  onSpotifyDisconnect: () => void;
  onThemeChange: (patch: Partial<ThemeSettings>) => void;
  onResetTheme: () => void;
  onChangeClientId: () => void;
  onImport: () => void;
  onClearHistory: () => void;
}

const MODE_OPTIONS: { label: string; value: ThemeMode; icon: ReactNode }[] = [
  { label: 'Light', value: 'light', icon: <SunOutlined /> },
  { label: 'Dark', value: 'dark', icon: <MoonOutlined /> },
  { label: 'System', value: 'system', icon: <DesktopOutlined /> },
];

export const SettingsView = ({
  theme,
  colorPresets,
  clientId,
  redirectUri,
  historyInfo,
  clearing,
  spotifyStatus,
  spotifyUser,
  onSpotifyConnect,
  onSpotifyDisconnect,
  onThemeChange,
  onResetTheme,
  onChangeClientId,
  onImport,
  onClearHistory,
}: SettingsViewProps) => (
  <Flex justify="center">
    <Flex vertical gap={16} style={{ width: '100%', maxWidth: 820 }}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        Settings
      </Typography.Title>

      <Card
        title="Appearance"
        extra={
          <Button icon={<UndoOutlined />} onClick={onResetTheme}>
            Reset to defaults
          </Button>
        }
      >
        <Flex wrap gap={32}>
          <Form layout="vertical" style={{ flex: '1 1 320px' }}>
            <Form.Item label="Theme">
              <Segmented<ThemeMode>
                value={theme.mode}
                onChange={(mode) => onThemeChange({ mode })}
                options={MODE_OPTIONS}
              />
            </Form.Item>
            <Form.Item label="Accent colour">
              <ColorPicker
                value={theme.primaryColor}
                showText
                disabledAlpha
                presets={[{ label: 'Presets', colors: colorPresets }]}
                onChange={(color) => onThemeChange({ primaryColor: color.toHexString() })}
              />
            </Form.Item>
            <Form.Item label="Compact layout" tooltip="Tighter spacing - fits more table rows on screen">
              <Switch checked={theme.compact} onChange={(compact) => onThemeChange({ compact })} />
            </Form.Item>
            <Form.Item label={`Corner radius (${theme.borderRadius}px)`}>
              <Slider
                min={0}
                max={16}
                value={theme.borderRadius}
                onChange={(borderRadius) => onThemeChange({ borderRadius })}
              />
            </Form.Item>
            <Form.Item label={`Font size (${theme.fontSize}px)`} style={{ marginBottom: 0 }}>
              <Slider
                min={12}
                max={18}
                value={theme.fontSize}
                onChange={(fontSize) => onThemeChange({ fontSize })}
              />
            </Form.Item>
          </Form>
          <div style={{ flex: '1 1 280px' }}>
            <ThemePreview />
          </div>
        </Flex>
      </Card>

      <Card title="Spotify" extra={<Button onClick={onChangeClientId}>Change client ID</Button>}>
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
              <Flex gap={12} align="center">
                <Typography.Text>Connected{spotifyUser ? ` as ${spotifyUser}` : ''}</Typography.Text>
                <Button size="small" onClick={onSpotifyDisconnect}>
                  Disconnect
                </Button>
              </Flex>
            ) : spotifyStatus === 'unavailable' ? (
              <Typography.Text type="secondary">Available in the desktop app</Typography.Text>
            ) : (
              <Button
                size="small"
                type="primary"
                loading={spotifyStatus === 'connecting' || spotifyStatus === 'checking'}
                onClick={onSpotifyConnect}
              >
                Connect Spotify
              </Button>
            )}
          </Descriptions.Item>
        </Descriptions>
        <Typography.Paragraph type="secondary" style={{ margin: '8px 0 0' }}>
          Playback is remote control: songs play on your Spotify app or device (Premium required).
          Playlists are created in the connected account.
        </Typography.Paragraph>
      </Card>

      <Card
        title="Streaming history"
        extra={
          <Flex gap={8}>
            <Button type="primary" onClick={onImport}>
              {historyInfo ? 'Import new export' : 'Import history'}
            </Button>
            {historyInfo && (
              <Popconfirm
                title="Remove streaming history?"
                description="The imported history is deleted from this app. Your zip file isn't touched."
                okText="Remove"
                okButtonProps={{ danger: true }}
                onConfirm={onClearHistory}
              >
                <Button danger icon={<DeleteOutlined />} loading={clearing}>
                  Remove
                </Button>
              </Popconfirm>
            )}
          </Flex>
        }
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
