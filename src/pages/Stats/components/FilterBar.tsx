import { ReloadOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Flex,
  InputNumber,
  Select,
  Switch,
  Tooltip,
  TreeSelect,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import type { DeviceNode } from '../../../lib/aggregate';
import { formatNumber } from '../../../lib/format';
import type { DatePeriod, PeriodOption } from '../useStats';

export interface FilterBarProps {
  period: DatePeriod;
  periodOptions: PeriodOption[];
  customRange: [Dayjs, Dayjs] | null;
  devices: string[];
  deviceTree: DeviceNode[];
  minPlaySeconds: number;
  includeIncognito: boolean;
  onPeriodChange: (period: DatePeriod) => void;
  onCustomRangeChange: (range: [Dayjs, Dayjs] | null) => void;
  onDevicesChange: (devices: string[]) => void;
  onMinPlaySecondsChange: (seconds: number | null) => void;
  onIncludeIncognitoChange: (include: boolean) => void;
  onReset: () => void;
}

const Label = ({ children }: { children: string }) => (
  <Typography.Text type="secondary" style={{ whiteSpace: 'nowrap' }}>
    {children}
  </Typography.Text>
);

const toTreeData = (nodes: DeviceNode[]): object[] =>
  nodes.map((n) => ({
    value: n.value,
    title: (
      <Flex justify="space-between" gap={16}>
        <span>{n.title}</span>
        <Typography.Text type="secondary">{formatNumber(n.streams)}</Typography.Text>
      </Flex>
    ),
    label: n.title,
    children: n.children ? toTreeData(n.children) : undefined,
  }));

/** Filters that apply to every table and the headline numbers. */
export const FilterBar = ({
  period,
  periodOptions,
  customRange,
  devices,
  deviceTree,
  minPlaySeconds,
  includeIncognito,
  onPeriodChange,
  onCustomRangeChange,
  onDevicesChange,
  onMinPlaySecondsChange,
  onIncludeIncognitoChange,
  onReset,
}: FilterBarProps) => (
  <Card size="small">
    <Flex wrap gap={16} align="center">
      <Flex gap={8} align="center">
        <Label>Dates</Label>
        <Select value={period} onChange={onPeriodChange} options={periodOptions} style={{ width: 160 }} />
        {period === 'custom' && (
          <DatePicker.RangePicker
            value={customRange}
            autoFocus={!customRange}
            onChange={(values) =>
              onCustomRangeChange(values?.[0] && values[1] ? [values[0], values[1]] : null)
            }
          />
        )}
      </Flex>

      <Flex gap={8} align="center">
        <Label>Devices</Label>
        <TreeSelect
          treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          treeNodeLabelProp="label"
          allowClear
          placeholder="All devices"
          value={devices}
          onChange={onDevicesChange}
          treeData={toTreeData(deviceTree)}
          maxTagCount="responsive"
          popupMatchSelectWidth={false}
          style={{ minWidth: 220, maxWidth: 360 }}
        />
      </Flex>

      <Tooltip title="A stream only counts as a play once it lasts this long. Spotify uses 30 seconds.">
        <Flex gap={8} align="center">
          <Label>Counts as a play after</Label>
          <InputNumber
            min={0}
            max={600}
            value={minPlaySeconds}
            onChange={onMinPlaySecondsChange}
            suffix="s"
            style={{ width: 90 }}
          />
        </Flex>
      </Tooltip>

      <Flex gap={8} align="center">
        <Switch size="small" checked={includeIncognito} onChange={onIncludeIncognitoChange} />
        <Label>Include private sessions</Label>
      </Flex>

      <Button icon={<ReloadOutlined />} onClick={onReset} style={{ marginLeft: 'auto' }}>
        Reset filters
      </Button>
    </Flex>
  </Card>
);
