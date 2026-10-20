import { Button, Flex, Input, Space } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';

/** Header filter for a text column: "<label> contains …". */
export const TextFilterDropdown = ({
  label,
  setSelectedKeys,
  selectedKeys,
  confirm,
  clearFilters,
}: FilterDropdownProps & { label: string }) => (
  <Flex vertical gap={8} style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
    <Input
      autoFocus
      allowClear
      placeholder={`${label} contains…`}
      value={selectedKeys[0] as string | undefined}
      onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
      onPressEnter={() => confirm()}
      style={{ width: 220 }}
    />
    <Space>
      <Button type="primary" size="small" onClick={() => confirm()}>
        Filter
      </Button>
      <Button
        size="small"
        onClick={() => {
          clearFilters?.();
          confirm();
        }}
      >
        Clear
      </Button>
    </Space>
  </Flex>
);
