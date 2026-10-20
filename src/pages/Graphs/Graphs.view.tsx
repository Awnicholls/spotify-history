import { Card, Flex, Tabs, Typography } from 'antd';
import type { YearRange } from '../../lib/graphs';
import type { Play } from '../../types/history';
import { MonthHeatmapContainer } from './components/MonthHeatmap/MonthHeatmap.container';
import { TimeOfDayContainer } from './components/TimeOfDay/TimeOfDay.container';
import { TopArtistsContainer } from './components/TopArtists/TopArtists.container';
import { YearScope } from './components/YearScope';

export type GraphsTab = 'calendar' | 'time' | 'artists';

export interface GraphsViewProps {
  plays: Play[];
  /** First and last year in the history. */
  bounds: YearRange;
  /** Selected years (inclusive). */
  range: YearRange;
  isAllYears: boolean;
  onRangeChange: (range: YearRange) => void;
  onAllYears: () => void;
  activeTab: GraphsTab;
  onTabChange: (key: string) => void;
}

export const GraphsView = ({
  plays,
  bounds,
  range,
  isAllYears,
  onRangeChange,
  onAllYears,
  activeTab,
  onTabChange,
}: GraphsViewProps) => (
  <Flex vertical gap={16}>
    <Flex justify="space-between" align="center" wrap gap={16}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        Graphs
      </Typography.Title>
      <YearScope
        bounds={bounds}
        range={range}
        isAllYears={isAllYears}
        onChange={onRangeChange}
        onAllYears={onAllYears}
      />
    </Flex>

    <Card styles={{ body: { paddingTop: 4 } }}>
      <Tabs
        activeKey={activeTab}
        onChange={onTabChange}
        destroyOnHidden
        items={[
          {
            key: 'calendar',
            label: 'Calendar heatmap',
            children: <MonthHeatmapContainer plays={plays} range={range} />,
          },
          {
            key: 'time',
            label: 'Time of day',
            children: <TimeOfDayContainer plays={plays} range={range} />,
          },
          {
            key: 'artists',
            label: 'Top bands by month',
            children: <TopArtistsContainer plays={plays} range={range} />,
          },
        ]}
      />
    </Card>
  </Flex>
);
