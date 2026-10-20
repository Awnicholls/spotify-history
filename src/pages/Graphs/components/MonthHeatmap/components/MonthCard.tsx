import { Typography } from 'antd';
import { memo } from 'react';

import type { MonthGrid } from '../../../../../lib/graphs';
import type { HeatMetric } from '../MonthHeatmap.view';

import { heatColor } from '../../../../../lib/color';
import { formatDuration, formatNumber } from '../../../../../lib/format';
import { MONTH_NAMES, WEEKDAYS } from '../../../../../lib/graphs';

interface MonthCardProps {
  accent: string;
  empty: string;
  grid: MonthGrid;
  max: number;
  metric: HeatMetric;
  onSelectDay: (month: number, day: number) => void;
  onSelectMonth: (month: number) => void;
  weekdayAligned: boolean;
}

const describe = (ms: number, streams: number): string =>
  `${formatDuration(ms)} · ${formatNumber(streams)} stream${streams === 1 ? '' : 's'}`;

/** One month: a 7-wide grid of day cells coloured by listening. */
export const MonthCard = memo(
  ({ accent, empty, grid, max, metric, onSelectDay, onSelectMonth, weekdayAligned }: MonthCardProps) => {
    const name = MONTH_NAMES[grid.month];
    const lead = weekdayAligned ? grid.firstWeekday : 0;

    return (
      <div>
        <button
          onClick={() => onSelectMonth(grid.month)}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
            width: '100%',
          }}
          title={`All of ${name}: ${describe(grid.ms, grid.streams)}`}
          type="button"
        >
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text style={{ fontSize: 12 }} type="secondary">
            {formatDuration(grid.ms)}
          </Typography.Text>
        </button>

        <div style={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {weekdayAligned &&
            WEEKDAYS.map((w) => (
              <Typography.Text key={w} style={{ fontSize: 10, textAlign: 'center' }} type="secondary">
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
                aria-label={`${d.day} ${name}`}
                key={d.day}
                onClick={() => onSelectDay(grid.month, d.day)}
                style={{
                  aspectRatio: '1',
                  background: heatColor(accent, value, max, empty),
                  border: 0,
                  borderRadius: 3,
                  color: 'transparent',
                  cursor: 'pointer',
                  fontSize: 9,
                  padding: 0,
                }}
                title={`${d.day} ${name}: ${describe(d.ms, d.streams)}`}
                type="button"
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
