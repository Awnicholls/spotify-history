import { Flex, Segmented, Typography, theme } from 'antd';
import type { StatRow } from '../../../../lib/aggregate';
import type { MonthGrid } from '../../../../lib/graphs';
import { DayDetailDrawer } from './components/DayDetailDrawer';
import { HeatLegend } from '../HeatLegend';
import { MonthCard } from './components/MonthCard';

export type HeatMetric = 'time' | 'streams';

export interface MonthHeatmapViewProps {
  months: MonthGrid[];
  max: number;
  metric: HeatMetric;
  onMetricChange: (metric: HeatMetric) => void;
  /** Lay days out by weekday (only meaningful for one year). */
  singleYear: boolean;
  rangeLabel: string;
  onSelectDay: (month: number, day: number) => void;
  onSelectMonth: (month: number) => void;
  detail: {
    title: string;
    streams: number;
    ms: number;
    songs: StatRow[];
    yearsWithPlays: number;
  } | null;
  onCloseDetail: () => void;
}

export const MonthHeatmapView = ({
  months,
  max,
  metric,
  onMetricChange,
  singleYear,
  rangeLabel,
  onSelectDay,
  onSelectMonth,
  detail,
  onCloseDetail,
}: MonthHeatmapViewProps) => {
  const { token } = theme.useToken();

  return (
    <Flex vertical gap={16}>
      <Flex wrap gap={12} align="center">
        <Segmented<HeatMetric>
          value={metric}
          onChange={onMetricChange}
          options={[
            { label: 'Time listened', value: 'time' },
            { label: 'Streams', value: 'streams' },
          ]}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 16 }}>
        {months.map((m) => (
          <MonthCard
            key={m.month}
            grid={m}
            max={max}
            metric={metric}
            weekdayAligned={singleYear}
            accent={token.colorPrimary}
            empty={token.colorFillTertiary}
            onSelectDay={onSelectDay}
            onSelectMonth={onSelectMonth}
          />
        ))}
      </div>

      <DayDetailDrawer detail={detail} onClose={onCloseDetail} />
    </Flex>
  );
};
