import type { MenuProps, ThemeConfig } from 'antd';
import type { JSX } from 'react';

import {
  AreaChartOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  CustomerServiceFilled,
  SettingOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { Alert, App as AntApp, ConfigProvider, Flex, Layout, Menu, Typography } from 'antd';

import type { AppConfig, ThemeSettings } from '../types/config';
import type { StoredHistory } from '../types/history';
import type { LoadProgress } from './useApp';

import { LoadingScreen } from '../components/LoadingScreen';
import { SpotifyPlayerContainer } from '../components/SpotifyPlayer/SpotifyPlayer.container';
import { GraphsContainer } from '../pages/Graphs/Graphs.container';
import { ImportHistoryContainer } from '../pages/ImportHistory/ImportHistory.container';
import { PlaylistsContainer } from '../pages/Playlists/Playlists.container';
import { SettingsContainer } from '../pages/Settings/Settings.container';
import { SetupContainer } from '../pages/Setup/Setup.container';
import { StatsContainer } from '../pages/Stats/Stats.container';
import { SpotifyProvider } from '../spotify/SpotifyProvider';

export type Page = 'graphs' | 'import' | 'playlists' | 'settings' | 'setup' | 'stats';

const PAGES: readonly Page[] = ['graphs', 'import', 'playlists', 'settings', 'setup', 'stats'];
const isPage = (key: string): key is Page => PAGES.some((p) => p === key);

export interface AppViewProps {
  clearHistory: () => Promise<void>;
  config: AppConfig;
  history: null | StoredHistory;
  isDark: boolean;
  loadError: null | string;
  loading: boolean;
  /** Startup progress shown while `loading`. */
  loadProgress: LoadProgress;
  navigate: (page: Page) => void;
  page: Page;
  replaceHistory: (history: StoredHistory) => Promise<void>;
  resetTheme: () => void;
  saveClientId: (clientId: string) => void;
  themeConfig: ThemeConfig;
  updateTheme: (patch: Partial<ThemeSettings>) => void;
}

const PageBody = (props: AppViewProps): JSX.Element | null => {
  const { config, history, navigate, page } = props;
  switch (page) {
    case 'setup':
      return (
        <SetupContainer
          clientId={config.clientId}
          onCancel={config.clientId ? () => navigate('settings') : undefined}
          onSave={props.saveClientId}
        />
      );
    case 'import':
      return (
        <ImportHistoryContainer
          history={history}
          onCancel={history ? () => navigate('stats') : undefined}
          onImported={props.replaceHistory}
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
          onChangeClientId={() => navigate('setup')}
          onClearHistory={props.clearHistory}
          onImport={() => navigate('import')}
          resetTheme={props.resetTheme}
          updateTheme={props.updateTheme}
        />
      );
    default:
      return null;
  }
};

export const AppView = (props: AppViewProps): JSX.Element => {
  const { config, history, isDark, loadError, loading, navigate, page, themeConfig } = props;

  const menuItems: MenuProps['items'] = [
    { disabled: !history, icon: <BarChartOutlined />, key: 'stats', label: 'Stats' },
    { disabled: !history, icon: <AreaChartOutlined />, key: 'graphs', label: 'Graphs' },
    { disabled: !history, icon: <UnorderedListOutlined />, key: 'playlists', label: 'Playlists' },
    { icon: <CloudUploadOutlined />, key: 'import', label: 'Import history' },
    { icon: <SettingOutlined />, key: 'settings', label: 'Settings' },
  ];

  // The nav only appears once a client ID exists - first run is a focused setup screen.
  const showNav = !loading && Boolean(config.clientId);

  return (
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <SpotifyProvider clientId={config.clientId}>
        <Layout style={{ minHeight: '100vh' }}>
          {showNav && (
            <Layout.Header
              style={{
                alignItems: 'center',
                borderBottom: `1px solid ${isDark ? '#303030' : '#f0f0f0'}`,
                display: 'flex',
                gap: 24,
                position: 'sticky',
                top: 0,
                zIndex: 20,
              }}
            >
              <Flex align="center" gap={10} style={{ flexShrink: 0 }}>
                <CustomerServiceFilled style={{ color: config.theme.primaryColor, fontSize: 22 }} />
                <Typography.Text strong style={{ fontSize: 16 }}>
                  Spotify Utils
                </Typography.Text>
              </Flex>
              <Menu
                items={menuItems}
                mode="horizontal"
                onClick={({ key }) => {
                  if (isPage(key)) {navigate(key);}
                }}
                selectedKeys={[page === 'setup' ? 'settings' : page]}
                style={{ background: 'transparent', borderBottom: 'none', flex: 1, minWidth: 0 }}
              />
              <SpotifyPlayerContainer />
            </Layout.Header>
          )}
          <Layout.Content style={{ padding: 24 }}>
            {loadError && (
              <Alert description={loadError} showIcon title="Could not load saved data" type="error" />
            )}
            {loading ? (
              <LoadingScreen accent={config.theme.primaryColor} percent={props.loadProgress.percent} text={props.loadProgress.text} />
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
