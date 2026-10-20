import type { JSX } from 'react';

import { Flex, Statistic, theme, Typography } from 'antd';
import { Fragment } from 'react';

import { heatColor } from '../../../../lib/color';
import { formatDuration } from '../../../../lib/format';
import { WEEKDAYS } from '../../../../lib/graphs';
import { HeatLegend } from '../HeatLegend';

export interface TimeOfDayViewProps {
  busiestDay: string;
  busiestHour: string;
  busiestSlot: string;
  byDay: number[];
  byHour: number[];
  /** [weekday 0 = Mon][hour] -> ms listened. */
  cells: number[][];
  max: number;
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Weekday x hour heatmap of when you listen. Display only. */
export const TimeOfDayView = ({ busiestDay, busiestHour, busiestSlot, byDay, cells, max }: TimeOfDayViewProps): JSX.Element => {
  const { token } = theme.useToken();
  const empty = token.colorFillTertiary;

  return (
    <Flex gap={20} vertical>
      <Flex align="center" gap={40} wrap>
        <Statistic title="Busiest hour" value={busiestHour} />
        <Statistic title="Busiest day" value={busiestDay} />
        <Statistic title="Peak slot" value={busiestSlot} />
        <span style={{ marginLeft: 'auto' }}>
          <HeatLegend accent={token.colorPrimary} empty={empty} />
        </span>
      </Flex>

      <div style={{ overflowX: 'auto' }}>
        <div
          style={{
            alignItems: 'center',
            display: 'grid',
            gap: 4,
            gridTemplateColumns: '44px repeat(24, minmax(22px, 1fr)) 80px',
            minWidth: 720,
          }}
        >
          <span />
          {HOURS.map((h) => (
            <Typography.Text key={h} style={{ fontSize: 11, textAlign: 'center' }} type="secondary">
              {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
            </Typography.Text>
          ))}
          <span />

          {WEEKDAYS.map((day, wd) => (
            <Fragment key={day}>
              <Typography.Text style={{ fontSize: 12 }} type="secondary">
                {day}
              </Typography.Text>
              {HOURS.map((hour) => {
                const ms = cells[wd][hour];
                return (
                  <div
                    key={hour}
                    style={{ background: heatColor(token.colorPrimary, ms, max, empty), borderRadius: 4, height: 28 }}
                    title={`${day} ${String(hour).padStart(2, '0')}:00–${String((hour + 1) % 24).padStart(2, '0')}:00 · ${formatDuration(ms)}`}
                  />
                );
              })}
              <Typography.Text style={{ fontSize: 12, textAlign: 'right' }} type="secondary">
                {formatDuration(byDay[wd])}
              </Typography.Text>
            </Fragment>
          ))}
        </div>
      </div>

      <Typography.Text style={{ fontSize: 12 }} type="secondary">
        Times are in this computer&apos;s time zone. Hover a cell for the total.
      </Typography.Text>
    </Flex>
  );
};
