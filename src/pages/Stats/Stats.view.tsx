import { Alert, Card, Flex, Tabs, Typography } from 'antd';
import type { StatCategory, Summary } from '../../lib/aggregate';
import { formatDate, formatNumber } from '../../lib/format';
import type { FilterBarProps } from './components/FilterBar';
import { FilterBar } from './components/FilterBar';
import { StatsTableContainer } from './components/StatsTable/StatsTable.container';
import { SummaryCards } from './components/SummaryCards';
import type { StatsTab } from './useStats';

export interface StatsViewProps {
  filterBar: FilterBarProps;
  /** Saved before per-device names existed; suggest re-importing. */
  legacyDevices: boolean;
  summary: Summary;
  minPlaySeconds: number;
  tabs: StatsTab[];
  activeTab: StatCategory;
  onTabChange: (key: string) => void;
}

export const StatsView = ({
  filterBar,
  legacyDevices,
  summary,
  minPlaySeconds,
  tabs,
  activeTab,
  onTabChange,
}: StatsViewProps) => (
  <Flex vertical gap={16}>
    <Flex justify="space-between" align="baseline" wrap gap={8}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        Your listening
      </Typography.Title>
      {summary.streams > 0 && (
        <Typography.Text type="secondary">
          {formatDate(summary.firstTs)} – {formatDate(summary.lastTs)} ·{' '}
          {formatNumber(summary.streams)} streams
        </Typography.Text>
      )}
    </Flex>

    {legacyDevices && (
      <Alert
        type="info"
        showIcon
        closable
        title="Re-import your history to see individual devices"
        description="This history was saved by an earlier version, so devices only show their type (Android, Xbox, ...). Import the zip again to split them into specific phones and consoles."
      />
    )}

    <FilterBar {...filterBar} />

    <SummaryCards summary={summary} minPlaySeconds={minPlaySeconds} />

    <Card styles={{ body: { paddingTop: 4 } }}>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        items={tabs.map((tab) => ({
          key: tab.key,
          label: `${tab.label} (${formatNumber(tab.rows.length)})`,
          children: (
            <StatsTableContainer category={tab.key} rows={tab.rows} minPlaySeconds={minPlaySeconds} />
          ),
        }))}
      />
    </Card>
  </Flex>
);
