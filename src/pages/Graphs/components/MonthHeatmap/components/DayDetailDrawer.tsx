import type { JSX } from 'react';

import { Drawer, Empty, Flex, Statistic } from 'antd';

import type { MonthHeatmapViewProps } from '../MonthHeatmap.view';

import { formatDuration, formatNumber } from '../../../../../lib/format';
import { StatsTableContainer } from '../../../../Stats/components/StatsTable/StatsTable.container';

/** The songs played on the clicked day/month across the selected years - playable from here. */
export const DayDetailDrawer = ({
  detail,
  onClose,
}: {
  detail: MonthHeatmapViewProps['detail'];
  onClose: () => void;
}): JSX.Element => (
  <Drawer destroyOnHidden onClose={onClose} open={Boolean(detail)} size={960} title={detail?.title}>
    {detail &&
      (detail.streams === 0 ? (
        <Empty description="Nothing played on this date in the selected years." />
      ) : (
        <Flex gap={16} vertical>
          <Flex gap={32} wrap>
            <Statistic title="Time listened" value={formatDuration(detail.ms)} />
            <Statistic title="Streams" value={formatNumber(detail.streams)} />
            <Statistic title="Songs" value={formatNumber(detail.songs.length)} />
            <Statistic title="Years with plays" value={detail.yearsWithPlays} />
          </Flex>
          <StatsTableContainer category="songs" minPlaySeconds={30} rows={detail.songs} scrollY="calc(100vh - 380px)" />
        </Flex>
      ))}
  </Drawer>
);
