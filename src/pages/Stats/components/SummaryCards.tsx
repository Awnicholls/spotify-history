import { Card, Flex, Statistic, Tooltip } from 'antd';
import type { Summary } from '../../../lib/aggregate';
import { formatDuration, formatHours, formatNumber, formatPercent } from '../../../lib/format';

interface Stat {
  title: string;
  value: string;
  hint?: string;
}

/** Headline numbers for the current filters. */
export const SummaryCards = ({
  summary: s,
  minPlaySeconds,
}: {
  summary: Summary;
  minPlaySeconds: number;
}) => {
  const stats: Stat[] = [
    { title: 'Time listened', value: formatDuration(s.ms), hint: formatHours(s.ms) },
    {
      title: 'Plays',
      value: formatNumber(s.plays),
      hint: `Streams of ${minPlaySeconds}s or longer`,
    },
    { title: 'Streams', value: formatNumber(s.streams), hint: 'Every stream, however short' },
    { title: 'Songs', value: formatNumber(s.songs) },
    { title: 'Artists', value: formatNumber(s.artists) },
    { title: 'Albums', value: formatNumber(s.albums) },
    ...(s.episodes
      ? [{ title: 'Podcast episodes', value: formatNumber(s.episodes), hint: `${formatNumber(s.shows)} shows` }]
      : []),
    {
      title: 'Skip rate',
      value: s.streams ? formatPercent(s.skips / s.streams) : '–',
      hint: `${formatNumber(s.skips)} skips`,
    },
    { title: 'Days listened', value: formatNumber(s.daysListened) },
  ];

  return (
    <Flex wrap gap={12}>
      {stats.map((stat) => (
        <Card key={stat.title} size="small" style={{ flex: '1 1 150px', textAlign: 'center' }}>
          <Tooltip title={stat.hint}>
            <Statistic title={stat.title} value={stat.value} />
          </Tooltip>
        </Card>
      ))}
    </Flex>
  );
};
