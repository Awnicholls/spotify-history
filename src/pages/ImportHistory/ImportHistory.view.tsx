import type { JSX } from 'react';

import { InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Spin, Typography, Upload } from 'antd';

import { formatDate, formatDateTime, formatNumber } from '../../lib/format';
import { ExportInstructions } from './components/ExportInstructions';

export interface ImportHistoryViewProps {
  beforeUpload: (file: File, batch: File[]) => boolean;
  busy: boolean;
  /** The history already loaded, if any - importing replaces it. */
  current: { firstTs: number; importedAt: number; lastTs: number; streams: number; } | null;
  dismissError: () => void;
  error: null | string;
  onCancel?: () => void;
}

export const ImportHistoryView = ({
  beforeUpload,
  busy,
  current,
  dismissError,
  error,
  onCancel,
}: ImportHistoryViewProps): JSX.Element => (
  <Flex justify="center">
    <Flex gap={20} style={{ maxWidth: 720, width: '100%' }} vertical>
      <div>
        <Typography.Title level={2} style={{ marginTop: 0 }}>
          Add your streaming history
        </Typography.Title>
        <Typography.Text type="secondary">
          Drop the <Typography.Text code>my_spotify_data.zip</Typography.Text> Spotify sent you, or
          click to choose it. You can also drop the extracted{' '}
          <Typography.Text code>Streaming_History_Audio_*.json</Typography.Text> files. Everything
          stays on this computer.
        </Typography.Text>
      </div>

      {current && (
        <Alert
          action={
            onCancel && (
              <Button onClick={onCancel} size="small">
                Back to stats
              </Button>
            )
          }
          description={`Imported ${formatDateTime(current.importedAt)}. Adding a new export replaces it.`}
          showIcon
          title={`Currently loaded: ${formatNumber(current.streams)} streams, ${formatDate(
            current.firstTs,
          )} – ${formatDate(current.lastTs)}`}
          type="info"
        />
      )}

      <Spin description="Reading your history…" spinning={busy}>
        <Upload.Dragger
          accept=".zip,.json"
          beforeUpload={beforeUpload}
          disabled={busy}
          multiple
          showUploadList={false}
          style={{ padding: '32px 16px' }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Drag your history zip here, or click to browse</p>
          <p className="ant-upload-hint">Extended streaming history (.zip or .json)</p>
        </Upload.Dragger>
      </Spin>

      {error && (
        <Alert closable={{ onClose: dismissError }} description={error} showIcon title="Couldn't import" type="error" />
      )}

      <Card size="small" title="Don't have it yet?">
        <ExportInstructions />
      </Card>
    </Flex>
  </Flex>
);
