import { InboxOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Spin, Typography, Upload } from 'antd';
import { formatDate, formatDateTime, formatNumber } from '../../lib/format';
import { ExportInstructions } from './components/ExportInstructions';

export interface ImportHistoryViewProps {
  busy: boolean;
  error: string | null;
  /** The history already loaded, if any - importing replaces it. */
  current: { streams: number; firstTs: number; lastTs: number; importedAt: number } | null;
  beforeUpload: (file: File, batch: File[]) => boolean;
  dismissError: () => void;
  onCancel?: () => void;
}

export const ImportHistoryView = ({
  busy,
  error,
  current,
  beforeUpload,
  dismissError,
  onCancel,
}: ImportHistoryViewProps) => (
  <Flex justify="center">
    <Flex vertical gap={20} style={{ width: '100%', maxWidth: 720 }}>
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
          type="info"
          showIcon
          title={`Currently loaded: ${formatNumber(current.streams)} streams, ${formatDate(
            current.firstTs,
          )} – ${formatDate(current.lastTs)}`}
          description={`Imported ${formatDateTime(current.importedAt)}. Adding a new export replaces it.`}
          action={
            onCancel && (
              <Button size="small" onClick={onCancel}>
                Back to stats
              </Button>
            )
          }
        />
      )}

      <Spin spinning={busy} description="Reading your history…">
        <Upload.Dragger
          accept=".zip,.json"
          multiple
          showUploadList={false}
          beforeUpload={beforeUpload}
          disabled={busy}
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
        <Alert type="error" showIcon closable={{ onClose: dismissError }} title="Couldn't import" description={error} />
      )}

      <Card size="small" title="Don't have it yet?">
        <ExportInstructions />
      </Card>
    </Flex>
  </Flex>
);
