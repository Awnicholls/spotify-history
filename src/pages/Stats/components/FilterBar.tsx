import type { Dayjs } from 'dayjs';
import type { JSX } from 'react';

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

import type { DeviceNode } from '../../../lib/aggregate';
import type { DatePeriod, PeriodOption } from '../useStats';

import { formatNumber } from '../../../lib/format';

export interface FilterBarProps {
  customRange: [Dayjs, Dayjs] | null;
  devices: string[];
  deviceTree: DeviceNode[];
  includeIncognito: boolean;
  minPlaySeconds: number;
  onCustomRangeChange: (range: [Dayjs, Dayjs] | null) => void;
  onDevicesChange: (devices: string[]) => void;
  onIncludeIncognitoChange: (include: boolean) => void;
  onMinPlaySecondsChange: (seconds: null | number) => void;
  onPeriodChange: (period: DatePeriod) => void;
  onReset: () => void;
  period: DatePeriod;
  periodOptions: PeriodOption[];
}

const Label = ({ children }: { children: string }): JSX.Element => (
  <Typography.Text style={{ whiteSpace: 'nowrap' }} type="secondary">
    {children}
  </Typography.Text>
);

const toTreeData = (nodes: DeviceNode[]): object[] =>
  nodes.map((n) => ({
    children: n.children ? toTreeData(n.children) : undefined,
    label: n.title,
    title: (
      <Flex gap={16} justify="space-between">
        <span>{n.title}</span>
        <Typography.Text type="secondary">{formatNumber(n.streams)}</Typography.Text>
      </Flex>
    ),
    value: n.value,
  }));

/** Filters that apply to every table and the headline numbers. */
export const FilterBar = ({
  customRange,
  devices,
  deviceTree,
  includeIncognito,
  minPlaySeconds,
  onCustomRangeChange,
  onDevicesChange,
  onIncludeIncognitoChange,
  onMinPlaySecondsChange,
  onPeriodChange,
  onReset,
  period,
  periodOptions,
}: FilterBarProps): JSX.Element => (
  <Card size="small">
    <Flex align="center" gap={16} wrap>
      <Flex align="center" gap={8}>
        <Label>Dates</Label>
        <Select onChange={onPeriodChange} options={periodOptions} style={{ width: 160 }} value={period} />
        {period === 'custom' && (
          <DatePicker.RangePicker
            onChange={(values) =>
              onCustomRangeChange(values?.[0] && values[1] ? [values[0], values[1]] : null)
            }
            value={customRange}
          />
        )}
      </Flex>

      <Flex align="center" gap={8}>
        <Label>Devices</Label>
        <TreeSelect
          allowClear
          maxTagCount="responsive"
          onChange={onDevicesChange}
          placeholder="All devices"
          popupMatchSelectWidth={false}
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          style={{ maxWidth: 360, minWidth: 220 }}
          treeCheckable
          treeData={toTreeData(deviceTree)}
          treeNodeLabelProp="label"
          value={devices}
        />
      </Flex>

      <Tooltip title="A stream only counts as a play once it lasts this long. Spotify uses 30 seconds.">
        <Flex align="center" gap={8}>
          <Label>Counts as a play after</Label>
          <InputNumber
            max={600}
            min={0}
            onChange={onMinPlaySecondsChange}
            style={{ width: 90 }}
            suffix="s"
            value={minPlaySeconds}
          />
        </Flex>
      </Tooltip>

      <Flex align="center" gap={8}>
        <Switch checked={includeIncognito} onChange={onIncludeIncognitoChange} size="small" />
        <Label>Include private sessions</Label>
      </Flex>

      <Button icon={<ReloadOutlined />} onClick={onReset} style={{ marginLeft: 'auto' }}>
        Reset filters
      </Button>
    </Flex>
  </Card>
);
