import type { JSX } from 'react';

import { CustomerServiceFilled } from '@ant-design/icons';
import { Button, Card, Flex, Form, Input, theme, Typography } from 'antd';

import { SetupSteps } from './components/SetupSteps';

export interface SetupViewProps {
  error: null | string;
  /** True when a client ID is already saved and the user came here to change it. */
  isChanging: boolean;
  onCancel?: () => void;
  onChange: (value: string) => void;
  onSubmit: () => void;
  redirectUri: string;
  value: string;
}

export const SetupView = ({
  error,
  isChanging,
  onCancel,
  onChange,
  onSubmit,
  redirectUri,
  value,
}: SetupViewProps): JSX.Element => {
  const { token } = theme.useToken();

  return (
    <Flex justify="center" style={{ padding: '24px 0' }}>
      <Flex gap={24} style={{ maxWidth: 600, width: '100%' }} vertical>
        <Flex align="center" gap={8} style={{ textAlign: 'center' }} vertical>
          <CustomerServiceFilled style={{ color: token.colorPrimary, fontSize: 44 }} />
          <Typography.Title level={1} style={{ margin: 0 }}>
            Spotify Utils
          </Typography.Title>
          <Typography.Text type="secondary">
            Dig through your Spotify extended streaming history: most played songs, artists and
            albums, time listened, skips and more. Start by adding your own Spotify client ID.
          </Typography.Text>
        </Flex>

        <Card>
          <Form layout="vertical" onFinish={onSubmit} requiredMark={false}>
            <Form.Item
              help={error ?? undefined}
              label="Spotify client ID"
              validateStatus={error ? 'error' : undefined}
            >
              <Input
                autoComplete="off"
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                size="large"
                spellCheck={false}
                value={value}
              />
            </Form.Item>

            <SetupSteps redirectUri={redirectUri} />

            <Flex gap={12} justify="center" style={{ marginTop: 24 }}>
              {onCancel && (
                <Button onClick={onCancel} shape="round" size="large">
                  Cancel
                </Button>
              )}
              <Button htmlType="submit" shape="round" size="large" type="primary">
                {isChanging ? 'Save client ID' : 'Save and continue'}
              </Button>
            </Flex>
          </Form>
        </Card>
      </Flex>
    </Flex>
  );
};
