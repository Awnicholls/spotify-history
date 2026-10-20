import { SearchOutlined } from '@ant-design/icons';
import type { TableProps } from 'antd';
import { Flex, Input, InputNumber, Table, Typography } from 'antd';
import type { StatCategory, StatRow } from '../../../../lib/aggregate';
import { formatNumber } from '../../../../lib/format';
import type { ColumnFilters, RowPlayer, SortState } from './columns';
import { buildColumns, CATEGORY_LABELS } from './columns';

export interface StatsTableViewProps {
  category: StatCategory;
  stickyOffset: number;
  /** Already filtered and sorted, in on-screen order. */
  rows: StatRow[];
  totalRows: number;
  minPlaySeconds: number;
  search: string;
  onSearchChange: (search: string) => void;
  minPlays: number | null;
  onMinPlaysChange: (minPlays: number | null) => void;
  sort: SortState;
  columnFilters: ColumnFilters;
  onTableChange: TableProps<StatRow>['onChange'];
  /** Null for tables with nothing playable (devices). */
  player: RowPlayer | null;
}

export const StatsTableView = ({
  category,
  stickyOffset,
  rows,
  totalRows,
  minPlaySeconds,
  search,
  onSearchChange,
  minPlays,
  onMinPlaysChange,
  sort,
  columnFilters,
  onTableChange,
  player,
}: StatsTableViewProps) => {
  const labels = CATEGORY_LABELS[category];

  return (
    <Flex vertical gap={12}>
      <Flex wrap gap={12} align="center">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={`Search ${labels.searchHint}`}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ width: 320 }}
        />
        <Flex gap={8} align="center">
          <Typography.Text type="secondary">Min plays</Typography.Text>
          <InputNumber min={0} value={minPlays} onChange={onMinPlaysChange} placeholder="Any" style={{ width: 90 }} />
        </Flex>
        <Typography.Text type="secondary" style={{ marginLeft: 'auto' }}>
          {rows.length === totalRows
            ? `${formatNumber(totalRows)} ${labels.plural}`
            : `${formatNumber(rows.length)} of ${formatNumber(totalRows)} ${labels.plural}`}
        </Typography.Text>
      </Flex>

      <Table<StatRow>
        rowKey="key"
        size="small"
        columns={buildColumns(category, minPlaySeconds, sort, columnFilters, player)}
        dataSource={rows}
        onChange={onTableChange}
        scroll={{ x: 'max-content' }}
        sticky={{ offsetHeader: stickyOffset }}
        showSorterTooltip={false}
        pagination={{
          defaultPageSize: 50,
          pageSizeOptions: [25, 50, 100, 250, 500],
          showSizeChanger: true,
          showTotal: (total, [from, to]) => `${formatNumber(from)}–${formatNumber(to)} of ${formatNumber(total)}`,
        }}
      />
    </Flex>
  );
};
