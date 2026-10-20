import type { JSX } from 'react';

import { Empty, Flex, Segmented, Select, Switch, theme, Typography } from 'antd';
import dayjs from 'dayjs';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import type { MonthTop } from '../../../../lib/graphs';

import { OTHERS_COLOR, seriesColor } from './artistColors';
import { MonthTooltip } from './components/MonthTooltip';
import { MonthTopList } from './components/MonthTopList';

export type ArtistMode = 'hours' | 'share';

export interface TopArtistsViewProps {
  includeOthers: boolean;
  /** Months with listening, newest first, each with its own top 10. */
  listMonths: MonthTop[];
  mode: ArtistMode;
  monthsByKey: Record<string, MonthTop>;
  onIncludeOthersChange: (v: boolean) => void;
  onModeChange: (mode: ArtistMode) => void;
  onPlayArtist: (month: string, artist: string) => void;
  onSeriesCountChange: (n: number) => void;
  rows: Record<string, number | string>[];
  /** Artists plotted (biggest over the period first), maybe ending with "Everyone else". */
  series: string[];
  seriesCount: number;
  seriesOptions: number[];
}

const monthLabel = (key: string): string => dayjs(`${key}-01`).format("MMM 'YY");

/** Month-by-month listening for your biggest artists, plus each month's own top 10. */
export const TopArtistsView = (p: TopArtistsViewProps): JSX.Element => {
  const { token } = theme.useToken();

  if (!p.rows.length) {return <Empty description="No music in the selected years." />;}

  return (
    <Flex gap={16} vertical>
      <Flex align="center" gap={16} wrap>
        <Segmented<ArtistMode>
          onChange={p.onModeChange}
          options={[
            { label: 'Share of listening', value: 'share' },
            { label: 'Hours', value: 'hours' },
          ]}
          value={p.mode}
        />
        <Flex align="center" gap={8}>
          <Typography.Text type="secondary">Chart the top</Typography.Text>
          <Select
            onChange={p.onSeriesCountChange}
            options={p.seriesOptions.map((n) => ({ label: `${n} artists`, value: n }))}
            style={{ width: 120 }}
            value={p.seriesCount}
          />
        </Flex>
        <Flex align="center" gap={8}>
          <Switch checked={p.includeOthers} onChange={p.onIncludeOthersChange} size="small" />
          <Typography.Text type="secondary">Include everyone else</Typography.Text>
        </Flex>
        <Typography.Text style={{ fontSize: 12, marginLeft: 'auto' }} type="secondary">
          Hover a month for its own top 10.
        </Typography.Text>
      </Flex>

      <div style={{ height: 440, width: '100%' }}>
        <ResponsiveContainer>
          <AreaChart
            data={p.rows}
            margin={{ bottom: 0, left: 0, right: 16, top: 8 }}
            stackOffset={p.mode === 'share' ? 'expand' : 'none'}
          >
            <CartesianGrid stroke={token.colorBorderSecondary} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              minTickGap={24}
              stroke={token.colorBorder}
              tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
              tickFormatter={monthLabel}
            />
            <YAxis
              stroke={token.colorBorder}
              tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
              tickFormatter={(v: number) => (p.mode === 'share' ? `${Math.round(v * 100)}%` : `${Math.round(v)}h`)}
              width={48}
            />
            <Tooltip
              content={<MonthTooltip formatLabel={monthLabel} monthsByKey={p.monthsByKey} series={p.series} />}
            />
            {/* Keep legend in rank order (Recharts sorts alphabetically by default). */}
            <Legend itemSorter={null} wrapperStyle={{ fontSize: 12 }} />
            {p.series.map((artist) => (
              <Area
                dataKey={artist}
                fill={seriesColor(p.series, artist) ?? OTHERS_COLOR}
                fillOpacity={0.75}
                isAnimationActive={false}
                key={artist}
                stackId="artists"
                stroke={seriesColor(p.series, artist) ?? OTHERS_COLOR}
                type="monotone"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <MonthTopList months={p.listMonths} onPlay={p.onPlayArtist} series={p.series} />
    </Flex>
  );
};
