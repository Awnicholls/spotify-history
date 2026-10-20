import { Flex, Statistic, Typography, theme } from 'antd';
import { heatColor } from '../../../../lib/color';
import { formatDuration } from '../../../../lib/format';
import { WEEKDAYS } from '../../../../lib/graphs';
import { HeatLegend } from '../HeatLegend';

export interface TimeOfDayViewProps {
  /** [weekday 0 = Mon][hour] -> ms listened. */
  cells: number[][];
  max: number;
  busiestSlot: string;
  busiestHour: string;
  busiestDay: string;
  byDay: number[];
  byHour: number[];
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

/** Weekday x hour heatmap of when you listen. Display only. */
export const TimeOfDayView = ({ cells, max, busiestSlot, busiestHour, busiestDay, byDay }: TimeOfDayViewProps) => {
  const { token } = theme.useToken();
  const empty = token.colorFillTertiary;

  return (
    <Flex vertical gap={20}>
      <Flex wrap gap={40} align="center">
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
            display: 'grid',
            gridTemplateColumns: '44px repeat(24, minmax(22px, 1fr)) 80px',
            gap: 4,
            minWidth: 720,
            alignItems: 'center',
          }}
        >
          <span />
          {HOURS.map((h) => (
            <Typography.Text key={h} type="secondary" style={{ fontSize: 11, textAlign: 'center' }}>
              {h % 3 === 0 ? String(h).padStart(2, '0') : ''}
            </Typography.Text>
          ))}
          <span />

          {cells.map((row, wd) => [
            <Typography.Text key={`d${wd}`} type="secondary" style={{ fontSize: 12 }}>
              {WEEKDAYS[wd]}
            </Typography.Text>,
            ...row.map((ms, h) => (
              <div
                key={`${wd}-${h}`}
                title={`${WEEKDAYS[wd]} ${String(h).padStart(2, '0')}:00–${String((h + 1) % 24).padStart(2, '0')}:00 · ${formatDuration(ms)}`}
                style={{ height: 28, borderRadius: 4, background: heatColor(token.colorPrimary, ms, max, empty) }}
              />
            )),
            <Typography.Text key={`t${wd}`} type="secondary" style={{ fontSize: 12, textAlign: 'right' }}>
              {formatDuration(byDay[wd])}
            </Typography.Text>,
          ])}
        </div>
      </div>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Times are in this computer&apos;s time zone. Hover a cell for the total.
      </Typography.Text>
    </Flex>
  );
};
