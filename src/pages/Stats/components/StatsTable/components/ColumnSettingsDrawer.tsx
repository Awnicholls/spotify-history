import type { JSX } from 'react';

import { Button, Checkbox, Drawer, Flex, Typography } from 'antd';

export interface ColumnSettingsProps {
  choices: { key: string; label: string }[];
  /** Keys currently switched off. */
  hidden: readonly string[];
  onClose: () => void;
  onShowAll: () => void;
  onToggle: (key: string, visible: boolean) => void;
  open: boolean;
}

/** Side panel for turning table columns off and back on. Saved per table. */
export const ColumnSettingsDrawer = ({
  choices,
  hidden,
  onClose,
  onShowAll,
  onToggle,
  open,
}: ColumnSettingsProps): JSX.Element => (
  <Drawer
    extra={
      <Button disabled={hidden.length === 0} onClick={onShowAll} size="small">
        Show all
      </Button>
    }
    onClose={onClose}
    open={open}
    size={320}
    title="Columns"
  >
    <Flex gap={12} vertical>
      <Typography.Text type="secondary">
        Rank, play and name always show. Your choice is remembered for this table.
      </Typography.Text>
      {choices.map((c) => (
        <Checkbox checked={!hidden.includes(c.key)} key={c.key} onChange={(e) => onToggle(c.key, e.target.checked)}>
          {c.label}
        </Checkbox>
      ))}
    </Flex>
  </Drawer>
);
