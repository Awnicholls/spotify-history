import type { JSX } from 'react';

import { Alert, Card, Flex, Tabs, Typography } from 'antd';

import type { StatCategory, Summary } from '../../lib/aggregate';
import type { FilterBarProps } from './components/FilterBar';
import type { StatsTab } from './useStats';

import { formatDate, formatNumber } from '../../lib/format';
import { FilterBar } from './components/FilterBar';
import { StatsTableContainer } from './components/StatsTable/StatsTable.container';
import { SummaryCards } from './components/SummaryCards';

export interface StatsViewProps {
  activeTab: StatCategory;
  filterBar: FilterBarProps;
  /** Saved before per-device names existed; suggest re-importing. */
  legacyDevices: boolean;
  minPlaySeconds: number;
  onTabChange: (key: string) => void;
  summary: Summary;
  tabs: StatsTab[];
}

export const StatsView = ({
  activeTab,
  filterBar,
  legacyDevices,
  minPlaySeconds,
  onTabChange,
  summary,
  tabs,
}: StatsViewProps): JSX.Element => (
  <Flex gap={16} vertical>
    <Flex align="baseline" gap={8} justify="space-between" wrap>
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
        closable
        description="This history was saved by an earlier version, so devices only show their type (Android, Xbox, ...). Import the zip again to split them into specific phones and consoles."
        showIcon
        title="Re-import your history to see individual devices"
        type="info"
      />
    )}

    <FilterBar {...filterBar} />

    <SummaryCards minPlaySeconds={minPlaySeconds} summary={summary} />

    <Card styles={{ body: { paddingTop: 4 } }}>
      <Tabs
        activeKey={activeTab}
        items={tabs.map((tab) => ({
          children: (
            <StatsTableContainer category={tab.key} minPlaySeconds={minPlaySeconds} rows={tab.rows} />
          ),
          key: tab.key,
          label: `${tab.label} (${formatNumber(tab.rows.length)})`,
        }))}
        onChange={onTabChange}
      />
    </Card>
  </Flex>
);
