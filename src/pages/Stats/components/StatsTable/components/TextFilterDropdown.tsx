import type { InputRef } from 'antd';
import type { FilterDropdownProps } from 'antd/es/table/interface';
import type { JSX } from 'react';

import { Button, Flex, Input, Space } from 'antd';
import { useEffect, useRef } from 'react';

/** Header filter for a text column: "<label> contains …". */
export const TextFilterDropdown = ({
  clearFilters,
  confirm,
  label,
  selectedKeys,
  setSelectedKeys,
  visible,
}: FilterDropdownProps & { label: string }): JSX.Element => {
  // Focus the box each time the dropdown opens (instead of `autoFocus`, jsx-a11y/no-autofocus).
  const inputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible]);

  return (
    <Flex gap={8} onKeyDown={(e) => e.stopPropagation()} style={{ padding: 8 }} vertical>
      <Input
        allowClear
        onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
        onPressEnter={() => confirm()}
        placeholder={`${label} contains…`}
        ref={inputRef}
        style={{ width: 220 }}
        value={selectedKeys[0]}
      />
      <Space>
        <Button onClick={() => confirm()} size="small" type="primary">
          Filter
        </Button>
        <Button
          onClick={() => {
            clearFilters?.();
            confirm();
          }}
          size="small"
        >
          Clear
        </Button>
      </Space>
    </Flex>
  );
};
