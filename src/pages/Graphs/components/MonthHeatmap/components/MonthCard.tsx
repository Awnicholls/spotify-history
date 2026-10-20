import { Typography } from 'antd';
import { memo } from 'react';
import { heatColor } from '../../../../../lib/color';
import { formatDuration, formatNumber } from '../../../../../lib/format';
import type { MonthGrid } from '../../../../../lib/graphs';
import { MONTH_NAMES, WEEKDAYS } from '../../../../../lib/graphs';
import type { HeatMetric } from '../MonthHeatmap.view';

interface MonthCardProps {
  grid: MonthGrid;
  max: number;
  metric: HeatMetric;
  weekdayAligned: boolean;
  accent: string;
  empty: string;
  onSelectDay: (month: number, day: number) => void;
  onSelectMonth: (month: number) => void;
}

const describe = (ms: number, streams: number) =>
  `${formatDuration(ms)} · ${formatNumber(streams)} stream${streams === 1 ? '' : 's'}`;

/** One month: a 7-wide grid of day cells coloured by listening. */
export const MonthCard = memo(
  ({ grid, max, metric, weekdayAligned, accent, empty, onSelectDay, onSelectMonth }: MonthCardProps) => {
    const name = MONTH_NAMES[grid.month];
    const lead = weekdayAligned ? grid.firstWeekday : 0;

    return (
      <div>
        <button
          type="button"
          onClick={() => onSelectMonth(grid.month)}
          title={`All of ${name}: ${describe(grid.ms, grid.streams)}`}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginBottom: 6,
          }}
        >
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {formatDuration(grid.ms)}
          </Typography.Text>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
          {weekdayAligned &&
            WEEKDAYS.map((w) => (
              <Typography.Text key={w} type="secondary" style={{ fontSize: 10, textAlign: 'center' }}>
                {w[0]}
              </Typography.Text>
            ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`pad-${i}`} />
          ))}
          {grid.days.map((d) => {
            const value = metric === 'time' ? d.ms : d.streams;
            return (
              <button
                key={d.day}
                type="button"
                aria-label={`${d.day} ${name}`}
                title={`${d.day} ${name}: ${describe(d.ms, d.streams)}`}
                onClick={() => onSelectDay(grid.month, d.day)}
                style={{
                  aspectRatio: '1',
                  border: 0,
                  borderRadius: 3,
                  padding: 0,
                  cursor: 'pointer',
                  background: heatColor(accent, value, max, empty),
                  fontSize: 9,
                  color: 'transparent',
                }}
              >
                {d.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);
MonthCard.displayName = 'MonthCard';
