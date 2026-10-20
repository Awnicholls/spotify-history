import {
  AreaChartOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  CustomerServiceFilled,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import type { MenuProps, ThemeConfig } from 'antd';
import { Alert, App as AntApp, ConfigProvider, Flex, Layout, Menu, Spin, Typography } from 'antd';
import { SpotifyPlayerContainer } from '../components/SpotifyPlayer/SpotifyPlayer.container';
import { GraphsContainer } from '../pages/Graphs/Graphs.container';
import { ImportHistoryContainer } from '../pages/ImportHistory/ImportHistory.container';
import { PlaylistsContainer } from '../pages/Playlists/Playlists.container';
import { SettingsContainer } from '../pages/Settings/Settings.container';
import { SetupContainer } from '../pages/Setup/Setup.container';
import { StatsContainer } from '../pages/Stats/Stats.container';
import { SpotifyProvider } from '../spotify/SpotifyProvider';
import type { AppConfig, ThemeSettings } from '../types/config';
import type { StoredHistory } from '../types/history';

export type Page = 'setup' | 'import' | 'stats' | 'graphs' | 'playlists' | 'settings';

export interface AppViewProps {
  loading: boolean;
  loadError: string | null;
  isDark: boolean;
  themeConfig: ThemeConfig;
  config: AppConfig;
  history: StoredHistory | null;
  page: Page;
  navigate: (page: Page) => void;
  saveClientId: (clientId: string) => void;
  updateTheme: (patch: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
  replaceHistory: (history: StoredHistory) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const PageBody = (props: AppViewProps) => {
  const { page, config, history, navigate } = props;
  switch (page) {
    case 'setup':
      return (
        <SetupContainer
          clientId={config.clientId}
          onSave={props.saveClientId}
          onCancel={config.clientId ? () => navigate('settings') : undefined}
        />
      );
    case 'import':
      return (
        <ImportHistoryContainer
          history={history}
          onImported={props.replaceHistory}
          onCancel={history ? () => navigate('stats') : undefined}
        />
      );
    case 'stats':
      return history ? <StatsContainer history={history} /> : null;
    case 'graphs':
      return history ? <GraphsContainer history={history} /> : null;
    case 'playlists':
      return history ? <PlaylistsContainer history={history} /> : null;
    case 'settings':
      return (
        <SettingsContainer
          config={config}
          history={history}
          updateTheme={props.updateTheme}
          resetTheme={props.resetTheme}
          onChangeClientId={() => navigate('setup')}
          onImport={() => navigate('import')}
          onClearHistory={props.clearHistory}
        />
      );
  }
};

export const AppView = (props: AppViewProps) => {
  const { loading, loadError, isDark, themeConfig, config, history, page, navigate } = props;

  const menuItems: MenuProps['items'] = [
    { key: 'stats', icon: <BarChartOutlined />, label: 'Stats', disabled: !history },
    { key: 'graphs', icon: <AreaChartOutlined />, label: 'Graphs', disabled: !history },
    { key: 'playlists', icon: <UnorderedListOutlined />, label: 'Playlists', disabled: !history },
    { key: 'import', icon: <CloudUploadOutlined />, label: 'Import history' },
    { key: 'settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  // The nav only appears once a client ID exists - first run is a focused setup screen.
  const showNav = !loading && !!config.clientId;

  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <SpotifyProvider clientId={config.clientId}>
        <Layout style={{ minHeight: '100vh' }}>
          {showNav && (
            <Layout.Header
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                position: 'sticky',
                top: 0,
                zIndex: 20,
                borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
              }}
            >
              <Flex align="center" gap={10} style={{ flexShrink: 0 }}>
                <CustomerServiceFilled style={{ fontSize: 22, color: config.theme.primaryColor }} />
                <Typography.Text strong style={{ fontSize: 16 }}>
                  Spotify Utils
                </Typography.Text>
              </Flex>
              <Menu
                mode="horizontal"
                selectedKeys={[page === 'setup' ? 'settings' : page]}
                items={menuItems}
                onClick={({ key }) => navigate(key as Page)}
                style={{ flex: 1, minWidth: 0, borderBottom: 'none', background: 'transparent' }}
              />
              <SpotifyPlayerContainer />
            </Layout.Header>
          )}
          <Layout.Content style={{ padding: 24 }}>
            {loadError && (
              <Alert type="error" showIcon title="Could not load saved data" description={loadError} />
            )}
            {loading ? (
              <Flex justify="center" align="center" style={{ minHeight: '60vh' }}>
                <Spin size="large" />
              </Flex>
            ) : (
              <PageBody {...props} />
            )}
          </Layout.Content>
        </Layout>
        </SpotifyProvider>
      </AntApp>
    </ConfigProvider>
  );
};
