import type { JSX } from 'react';

import { Card, Flex, Statistic, Tooltip } from 'antd';

import type { Summary } from '../../../lib/aggregate';

import { formatDuration, formatHours, formatNumber, formatPercent } from '../../../lib/format';

interface Stat {
  hint?: string;
  title: string;
  value: string;
}

/** Headline numbers for the current filters. */
export const SummaryCards = ({
  minPlaySeconds,
  summary: s,
}: {
  minPlaySeconds: number;
  summary: Summary;
}): JSX.Element => {
  const stats: Stat[] = [
    { hint: formatHours(s.ms), title: 'Time listened', value: formatDuration(s.ms) },
    {
      hint: `Streams of ${minPlaySeconds}s or longer`,
      title: 'Plays',
      value: formatNumber(s.plays),
    },
    { hint: 'Every stream, however short', title: 'Streams', value: formatNumber(s.streams) },
    { title: 'Songs', value: formatNumber(s.songs) },
    { title: 'Artists', value: formatNumber(s.artists) },
    { title: 'Albums', value: formatNumber(s.albums) },
    ...(s.episodes
      ? [{ hint: `${formatNumber(s.shows)} shows`, title: 'Podcast episodes', value: formatNumber(s.episodes) }]
      : []),
    {
      hint: `${formatNumber(s.skips)} skips`,
      title: 'Skip rate',
      value: s.streams ? formatPercent(s.skips / s.streams) : '–',
    },
    { title: 'Days listened', value: formatNumber(s.daysListened) },
  ];

  return (
    <Flex gap={12} wrap>
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
