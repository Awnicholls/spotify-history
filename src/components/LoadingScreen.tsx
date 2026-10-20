import type { JSX } from 'react';

import { CustomerServiceFilled } from '@ant-design/icons';
import { Flex, Progress, Typography } from 'antd';

/** Startup screen: what's being loaded, with a progress bar. */
export const LoadingScreen = ({ accent, percent, text }: { accent: string; percent: number; text: string; }): JSX.Element => (
  <Flex align="center" gap={16} justify="center" style={{ minHeight: '70vh' }} vertical>
    <CustomerServiceFilled style={{ color: accent, fontSize: 48 }} />
    <Typography.Title level={3} style={{ margin: 0 }}>
      Spotify Utils
    </Typography.Title>
    <Progress percent={percent} showInfo={false} status="active" strokeColor={accent} style={{ width: 320 }} />
    <Typography.Text type="secondary">{text}</Typography.Text>
  </Flex>
);
