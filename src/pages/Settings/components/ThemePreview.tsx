import type { JSX } from 'react';

import { Button, Card, Flex, Input, Progress, Switch, Table, Tag, Typography } from 'antd';

const sampleRows = [
  { key: 1, name: 'Song one', plays: 412, time: '21h 03m' },
  { key: 2, name: 'Song two', plays: 377, time: '18h 41m' },
];

/** A few live controls so theme changes can be judged without leaving Settings. */
export const ThemePreview = (): JSX.Element => (
  <Card size="small" title="Preview" type="inner">
    <Flex gap={12} vertical>
      <Flex align="center" gap={8} wrap>
        <Button type="primary">Primary</Button>
        <Button>Default</Button>
        <Switch defaultChecked />
        <Tag color="processing">Tag</Tag>
      </Flex>
      <Input placeholder="Search songs…" />
      <Progress percent={64} size="small" />
      <Table
        columns={[
          { dataIndex: 'name', title: 'Song' },
          { align: 'right', dataIndex: 'plays', title: 'Plays' },
          { align: 'right', dataIndex: 'time', title: 'Time' },
        ]}
        dataSource={sampleRows}
        pagination={false}
        size="small"
      />
      <Typography.Text type="secondary">Secondary text looks like this.</Typography.Text>
    </Flex>
  </Card>
);
