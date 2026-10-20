import { Drawer, Empty, Flex, Statistic } from 'antd';
import { formatDuration, formatNumber } from '../../../../../lib/format';
import { StatsTableContainer } from '../../../../Stats/components/StatsTable/StatsTable.container';
import type { MonthHeatmapViewProps } from '../MonthHeatmap.view';

/** The songs played on the clicked day/month across the selected years - playable from here. */
export const DayDetailDrawer = ({
  detail,
  onClose,
}: {
  detail: MonthHeatmapViewProps['detail'];
  onClose: () => void;
}) => (
  <Drawer open={!!detail} onClose={onClose} title={detail?.title} size={960} destroyOnHidden>
    {detail &&
      (detail.streams === 0 ? (
        <Empty description="Nothing played on this date in the selected years." />
      ) : (
        <Flex vertical gap={16}>
          <Flex gap={32} wrap>
            <Statistic title="Time listened" value={formatDuration(detail.ms)} />
            <Statistic title="Streams" value={formatNumber(detail.streams)} />
            <Statistic title="Songs" value={formatNumber(detail.songs.length)} />
            <Statistic title="Years with plays" value={detail.yearsWithPlays} />
          </Flex>
          <StatsTableContainer category="songs" rows={detail.songs} minPlaySeconds={30} stickyOffset={0} />
        </Flex>
      ))}
  </Drawer>
);
