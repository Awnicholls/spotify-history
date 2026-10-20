import { Empty, Flex, Segmented, Select, Switch, Typography, theme } from 'antd';
import dayjs from 'dayjs';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { MonthTop } from '../../../../lib/graphs';
import { seriesColor } from './artistColors';
import { MonthTopList } from './components/MonthTopList';
import { MonthTooltip } from './components/MonthTooltip';

export type ArtistMode = 'share' | 'hours';

export interface TopArtistsViewProps {
  /** Artists plotted (biggest over the period first), maybe ending with "Everyone else". */
  series: string[];
  rows: Record<string, number | string>[];
  monthsByKey: Record<string, MonthTop>;
  /** Months with listening, newest first, each with its own top 10. */
  listMonths: MonthTop[];
  mode: ArtistMode;
  onModeChange: (mode: ArtistMode) => void;
  seriesCount: number;
  seriesOptions: number[];
  onSeriesCountChange: (n: number) => void;
  includeOthers: boolean;
  onIncludeOthersChange: (v: boolean) => void;
  onPlayArtist: (month: string, artist: string) => void;
}

const monthLabel = (key: string) => dayjs(`${key}-01`).format("MMM 'YY");

/** Month-by-month listening for your biggest artists, plus each month's own top 10. */
export const TopArtistsView = (p: TopArtistsViewProps) => {
  const { token } = theme.useToken();

  if (!p.rows.length) return <Empty description="No music in the selected years." />;

  return (
    <Flex vertical gap={16}>
      <Flex wrap gap={16} align="center">
        <Segmented<ArtistMode>
          value={p.mode}
          onChange={p.onModeChange}
          options={[
            { label: 'Share of listening', value: 'share' },
            { label: 'Hours', value: 'hours' },
          ]}
        />
        <Flex align="center" gap={8}>
          <Typography.Text type="secondary">Chart the top</Typography.Text>
          <Select
            value={p.seriesCount}
            onChange={p.onSeriesCountChange}
            options={p.seriesOptions.map((n) => ({ label: `${n} artists`, value: n }))}
            style={{ width: 120 }}
          />
        </Flex>
        <Flex align="center" gap={8}>
          <Switch size="small" checked={p.includeOthers} onChange={p.onIncludeOthersChange} />
          <Typography.Text type="secondary">Include everyone else</Typography.Text>
        </Flex>
        <Typography.Text type="secondary" style={{ marginLeft: 'auto', fontSize: 12 }}>
          Hover a month for its own top 10.
        </Typography.Text>
      </Flex>

      <div style={{ width: '100%', height: 440 }}>
        <ResponsiveContainer>
          <AreaChart
            data={p.rows}
            stackOffset={p.mode === 'share' ? 'expand' : 'none'}
            margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={token.colorBorderSecondary} />
            <XAxis
              dataKey="month"
              tickFormatter={monthLabel}
              minTickGap={24}
              tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
              stroke={token.colorBorder}
            />
            <YAxis
              tickFormatter={(v: number) => (p.mode === 'share' ? `${Math.round(v * 100)}%` : `${Math.round(v)}h`)}
              tick={{ fill: token.colorTextSecondary, fontSize: 12 }}
              stroke={token.colorBorder}
              width={48}
            />
            <Tooltip
              content={({ active, label }) =>
                active && label ? (
                  <MonthTooltip month={p.monthsByKey[String(label)]} series={p.series} label={monthLabel(String(label))} />
                ) : null
              }
            />
            {/* Keep legend in rank order (Recharts sorts alphabetically by default). */}
            <Legend wrapperStyle={{ fontSize: 12 }} itemSorter={null} />
            {p.series.map((artist) => (
              <Area
                key={artist}
                type="monotone"
                dataKey={artist}
                stackId="artists"
                stroke={seriesColor(p.series, artist)!}
                fill={seriesColor(p.series, artist)!}
                fillOpacity={0.75}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <MonthTopList months={p.listMonths} series={p.series} onPlay={p.onPlayArtist} />
    </Flex>
  );
};
