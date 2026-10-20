import type { TableProps } from 'antd';
import type { JSX } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Flex, Input, InputNumber, Table, Typography } from 'antd';

import type { StatCategory, StatRow } from '../../../../lib/aggregate';
import type { ColumnFilters, RowPlayer, SortState } from './columns';
import type { ColumnSettingsProps } from './components/ColumnSettingsDrawer';

import { formatNumber } from '../../../../lib/format';
import { buildColumns, CATEGORY_LABELS } from './columns';
import { ColumnSettingsDrawer } from './components/ColumnSettingsDrawer';

export interface StatsTableViewProps {
  category: StatCategory;
  columnFilters: ColumnFilters;
  columnSettings: ColumnSettingsProps;
  minPlays: null | number;
  minPlaySeconds: number;
  onMinPlaysChange: (minPlays: null | number) => void;
  onOpenColumnSettings: () => void;
  onSearchChange: (search: string) => void;
  onTableChange: TableProps<StatRow>['onChange'];
  /** Null for tables with nothing playable (devices). */
  player: null | RowPlayer;
  /** Already filtered and sorted, in on-screen order. */
  rows: StatRow[];
  /** Fixed-height scroll area (drawers) instead of a header sticky under the app bar. */
  scrollY?: string;
  search: string;
  sort: SortState;
  stickyOffset: number;
  totalRows: number;
}

export const StatsTableView = ({
  category,
  columnFilters,
  columnSettings,
  minPlays,
  minPlaySeconds,
  onMinPlaysChange,
  onOpenColumnSettings,
  onSearchChange,
  onTableChange,
  player,
  rows,
  scrollY,
  search,
  sort,
  stickyOffset,
  totalRows,
}: StatsTableViewProps): JSX.Element => {
  const labels = CATEGORY_LABELS[category];

  return (
    <Flex gap={12} vertical>
      <Flex align="center" gap={12} wrap>
        <Input
          allowClear
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={`Search ${labels.searchHint}`}
          prefix={<SearchOutlined />}
          style={{ width: 320 }}
          value={search}
        />
        <Flex align="center" gap={8}>
          <Typography.Text type="secondary">Min plays</Typography.Text>
          <InputNumber min={0} onChange={onMinPlaysChange} placeholder="Any" style={{ width: 90 }} value={minPlays} />
        </Flex>
        <Typography.Text style={{ marginLeft: 'auto' }} type="secondary">
          {rows.length === totalRows
            ? `${formatNumber(totalRows)} ${labels.plural}`
            : `${formatNumber(rows.length)} of ${formatNumber(totalRows)} ${labels.plural}`}
        </Typography.Text>
      </Flex>

      <Table<StatRow>
        columns={buildColumns({
          category,
          filters: columnFilters,
          hidden: columnSettings.hidden,
          minPlaySeconds,
          onOpenColumnSettings,
          player,
          sort,
        })}
        dataSource={rows}
        onChange={onTableChange}
        pagination={{
          defaultPageSize: 50,
          pageSizeOptions: [25, 50, 100, 250, 500],
          showSizeChanger: true,
          showTotal: (total, [from, to]) => `${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)}`,
        }}
        rowKey="key"
        scroll={scrollY ? { x: 'max-content', y: scrollY } : { x: 'max-content' }}
        showSorterTooltip={false}
        size="small"
        sticky={scrollY ? false : { offsetHeader: stickyOffset }}
      />

      <ColumnSettingsDrawer {...columnSettings} />
    </Flex>
  );
};
