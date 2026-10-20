import type { JSX } from 'react';

import { Card, Flex, Tabs, Typography } from 'antd';

import type { YearRange } from '../../lib/graphs';
import type { Play } from '../../types/history';

import { MonthHeatmapContainer } from './components/MonthHeatmap/MonthHeatmap.container';
import { TimeOfDayContainer } from './components/TimeOfDay/TimeOfDay.container';
import { TopArtistsContainer } from './components/TopArtists/TopArtists.container';
import { YearScope } from './components/YearScope';

export type GraphsTab = 'artists' | 'calendar' | 'time';

export interface GraphsViewProps {
  activeTab: GraphsTab;
  /** First and last year in the history. */
  bounds: YearRange;
  isAllYears: boolean;
  onAllYears: () => void;
  onRangeChange: (range: YearRange) => void;
  onTabChange: (key: string) => void;
  plays: Play[];
  /** Selected years (inclusive). */
  range: YearRange;
}

export const GraphsView = ({
  activeTab,
  bounds,
  isAllYears,
  onAllYears,
  onRangeChange,
  onTabChange,
  plays,
  range,
}: GraphsViewProps): JSX.Element => (
  <Flex gap={16} vertical>
    <Flex align="center" gap={16} justify="space-between" wrap>
      <Typography.Title level={2} style={{ margin: 0 }}>
        Graphs
      </Typography.Title>
      <YearScope
        bounds={bounds}
        isAllYears={isAllYears}
        onAllYears={onAllYears}
        onChange={onRangeChange}
        range={range}
      />
    </Flex>

    <Card styles={{ body: { paddingTop: 4 } }}>
      <Tabs
        activeKey={activeTab}
        destroyOnHidden
        items={[
          {
            children: <MonthHeatmapContainer plays={plays} range={range} />,
            key: 'calendar',
            label: 'Calendar heatmap',
          },
          {
            children: <TimeOfDayContainer plays={plays} range={range} />,
            key: 'time',
            label: 'Time of day',
          },
          {
            children: <TopArtistsContainer plays={plays} range={range} />,
            key: 'artists',
            label: 'Top bands by month',
          },
        ]}
        onChange={onTabChange}
      />
    </Card>
  </Flex>
);
