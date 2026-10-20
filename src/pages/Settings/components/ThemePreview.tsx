import { Button, Card, Flex, Input, Progress, Switch, Table, Tag, Typography } from 'antd';

const sampleRows = [
  { key: 1, name: 'Song one', plays: 412, time: '21h 03m' },
  { key: 2, name: 'Song two', plays: 377, time: '18h 41m' },
];

/** A few live controls so theme changes can be judged without leaving Settings. */
export const ThemePreview = () => (
  <Card size="small" title="Preview" type="inner">
    <Flex vertical gap={12}>
      <Flex gap={8} wrap align="center">
        <Button type="primary">Primary</Button>
        <Button>Default</Button>
        <Switch defaultChecked />
        <Tag color="processing">Tag</Tag>
      </Flex>
      <Input placeholder="Search songs…" />
      <Progress percent={64} size="small" />
      <Table
        size="small"
        pagination={false}
        dataSource={sampleRows}
        columns={[
          { title: 'Song', dataIndex: 'name' },
          { title: 'Plays', dataIndex: 'plays', align: 'right' },
          { title: 'Time', dataIndex: 'time', align: 'right' },
        ]}
      />
      <Typography.Text type="secondary">Secondary text looks like this.</Typography.Text>
    </Flex>
  </Card>
);
