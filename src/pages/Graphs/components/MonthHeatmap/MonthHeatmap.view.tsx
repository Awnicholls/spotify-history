import type { JSX } from 'react';

import { Flex, Segmented, theme, Typography } from 'antd';

import type { StatRow } from '../../../../lib/aggregate';
import type { MonthGrid } from '../../../../lib/graphs';

import { HeatLegend } from '../HeatLegend';
import { DayDetailDrawer } from './components/DayDetailDrawer';
import { MonthCard } from './components/MonthCard';

export type HeatMetric = 'streams' | 'time';

export interface MonthHeatmapViewProps {
  detail: {
    ms: number;
    songs: StatRow[];
    streams: number;
    title: string;
    yearsWithPlays: number;
  } | null;
  max: number;
  metric: HeatMetric;
  months: MonthGrid[];
  onCloseDetail: () => void;
  onMetricChange: (metric: HeatMetric) => void;
  onSelectDay: (month: number, day: number) => void;
  onSelectMonth: (month: number) => void;
  rangeLabel: string;
  /** Lay days out by weekday (only meaningful for one year). */
  singleYear: boolean;
}

export const MonthHeatmapView = ({
  detail,
  max,
  metric,
  months,
  onCloseDetail,
  onMetricChange,
  onSelectDay,
  onSelectMonth,
  rangeLabel,
  singleYear,
}: MonthHeatmapViewProps): JSX.Element => {
  const { token } = theme.useToken();

  return (
    <Flex gap={16} vertical>
      <Flex align="center" gap={12} wrap>
        <Segmented<HeatMetric>
          onChange={onMetricChange}
          options={[
            { label: 'Time listened', value: 'time' },
            { label: 'Streams', value: 'streams' },
          ]}
          value={metric}
        />
        <Typography.Text type="secondary">
          {singleYear
            ? `Each day of ${rangeLabel}. Click a day (or a month name) to see what you played.`
            : `Each calendar day summed across ${rangeLabel}. Click a day (or a month name) to see what you played on it.`}
        </Typography.Text>
        <span style={{ marginLeft: 'auto' }}>
          <HeatLegend accent={token.colorPrimary} empty={token.colorFillTertiary} />
        </span>
      </Flex>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
        {months.map((m) => (
          <MonthCard
            accent={token.colorPrimary}
            empty={token.colorFillTertiary}
            grid={m}
            key={m.month}
            max={max}
            metric={metric}
            onSelectDay={onSelectDay}
            onSelectMonth={onSelectMonth}
            weekdayAligned={singleYear}
          />
        ))}
      </div>

      <DayDetailDrawer detail={detail} onClose={onCloseDetail} />
    </Flex>
  );
};
