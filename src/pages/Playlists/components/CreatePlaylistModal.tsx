import { Form, Input, Modal, Switch, Typography } from 'antd';

export interface CreatePlaylistModalProps {
  year: number;
  name: string;
  description: string;
  isPublic: boolean;
  songCount: number;
  saving: boolean;
  onChange: (patch: Partial<{ name: string; description: string; isPublic: boolean }>) => void;
  onSave: () => void;
  onCancel: () => void;
}

/** Name (and optionally describe) a year's playlist before it's created in Spotify. */
export const CreatePlaylistModal = ({
  year,
  name,
  description,
  isPublic,
  songCount,
  saving,
  onChange,
  onSave,
  onCancel,
}: CreatePlaylistModalProps) => (
  <Modal
    open
    title={`Add ${year} playlist to Spotify`}
    okText="Create playlist"
    confirmLoading={saving}
    onOk={onSave}
    onCancel={onCancel}
    destroyOnHidden
  >
    <Form layout="vertical" onFinish={onSave}>
      <Form.Item label="Name">
        <Input value={name} onChange={(e) => onChange({ name: e.target.value })} autoFocus maxLength={100} />
      </Form.Item>
      <Form.Item label="Description">
        <Input.TextArea
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
          autoSize={{ minRows: 2, maxRows: 4 }}
          maxLength={300}
        />
      </Form.Item>
      <Form.Item label="Public" style={{ marginBottom: 8 }}>
        <Switch checked={isPublic} onChange={(v) => onChange({ isPublic: v })} />
      </Form.Item>
      <Typography.Text type="secondary">
        {songCount} song{songCount === 1 ? '' : 's'} will be added in rank order.
      </Typography.Text>
    </Form>
  </Modal>
);
