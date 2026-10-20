import { CustomerServiceFilled } from '@ant-design/icons';
import { Button, Card, Flex, Form, Input, Typography, theme } from 'antd';
import { SetupSteps } from './components/SetupSteps';

export interface SetupViewProps {
  value: string;
  error: string | null;
  redirectUri: string;
  /** True when a client ID is already saved and the user came here to change it. */
  isChanging: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel?: () => void;
}

export const SetupView = ({
  value,
  error,
  redirectUri,
  isChanging,
  onChange,
  onSubmit,
  onCancel,
}: SetupViewProps) => {
  const { token } = theme.useToken();

  return (
    <Flex justify="center" style={{ padding: '24px 0' }}>
      <Flex vertical gap={24} style={{ width: '100%', maxWidth: 600 }}>
        <Flex vertical align="center" gap={8} style={{ textAlign: 'center' }}>
          <CustomerServiceFilled style={{ fontSize: 44, color: token.colorPrimary }} />
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
              label="Spotify client ID"
              validateStatus={error ? 'error' : undefined}
              help={error ?? undefined}
            >
              <Input
                size="large"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="e.g. 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d"
                autoFocus
                spellCheck={false}
                autoComplete="off"
              />
            </Form.Item>

            <SetupSteps redirectUri={redirectUri} />

            <Flex justify="center" gap={12} style={{ marginTop: 24 }}>
              {onCancel && (
                <Button size="large" shape="round" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button type="primary" size="large" shape="round" htmlType="submit">
                {isChanging ? 'Save client ID' : 'Save and continue'}
              </Button>
            </Flex>
          </Form>
        </Card>
      </Flex>
    </Flex>
  );
};
