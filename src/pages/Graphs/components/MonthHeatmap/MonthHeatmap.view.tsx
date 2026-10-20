import type { JSX } from 'react';

import { Flex, Segmented, theme, Typography } from 'antd';

import type { StatRow } from '../../../../lib/aggregate';
import type { MonthGrid } from '../../../../lib/graphs';

import { formatDuration, formatNumber } from '../../../../lib/format';
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
  metric: HeatMetric;
  months: MonthGrid[];
  onCloseDetail: () => void;
  onMetricChange: (metric: HeatMetric) => void;
  onSelectDay: (month: number, day: number) => void;
  onSelectMonth: (month: number) => void;
  rangeLabel: string;
  /** Lay days out by weekday (only meaningful for one year). */
  singleYear: boolean;
  /** Quantile breakpoints for the colour steps. */
  thresholds: number[];
}

export const MonthHeatmapView = ({
  detail,
  metric,
  months,
  onCloseDetail,
  onMetricChange,
  onSelectDay,
  onSelectMonth,
  rangeLabel,
  singleYear,
  thresholds,
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
          <HeatLegend
            accent={token.colorPrimary}
            empty={token.colorFillTertiary}
            format={metric === 'time' ? formatDuration : (v) => `${formatNumber(v)} streams`}
            thresholds={thresholds}
          />
        </span>
      </Flex>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
        {months.map((m) => (
          <MonthCard
            accent={token.colorPrimary}
            empty={token.colorFillTertiary}
            grid={m}
            key={m.month}
            metric={metric}
            onSelectDay={onSelectDay}
            onSelectMonth={onSelectMonth}
            thresholds={thresholds}
            weekdayAligned={singleYear}
          />
        ))}
      </div>

      <DayDetailDrawer detail={detail} onClose={onCloseDetail} />
    </Flex>
  );
};
