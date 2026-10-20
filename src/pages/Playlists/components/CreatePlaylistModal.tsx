import type { InputRef } from 'antd';
import type { JSX } from 'react';

import { Form, Input, Modal, Switch, Typography } from 'antd';
import { useRef } from 'react';

export interface CreatePlaylistModalProps {
  description: string;
  isPublic: boolean;
  name: string;
  onCancel: () => void;
  onChange: (patch: Partial<{ description: string; isPublic: boolean; name: string; }>) => void;
  onSave: () => void;
  saving: boolean;
  songCount: number;
  year: number;
}

/** Name (and optionally describe) a year's playlist before it's created in Spotify. */
export const CreatePlaylistModal = ({
  description,
  isPublic,
  name,
  onCancel,
  onChange,
  onSave,
  saving,
  songCount,
  year,
}: CreatePlaylistModalProps): JSX.Element => {
  // Focused once the dialog has opened, rather than with `autoFocus` (jsx-a11y/no-autofocus).
  const nameRef = useRef<InputRef>(null);

  return (
    <Modal
      afterOpenChange={(open) => {
        if (open) {
          nameRef.current?.focus();
        }
      }}
      confirmLoading={saving}
      destroyOnHidden
      okText="Create playlist"
      onCancel={onCancel}
      onOk={onSave}
      open
      title={`Add ${year} playlist to Spotify`}
    >
      <Form layout="vertical" onFinish={onSave}>
        <Form.Item label="Name">
          <Input maxLength={100} onChange={(e) => onChange({ name: e.target.value })} ref={nameRef} value={name} />
        </Form.Item>
        <Form.Item label="Description">
          <Input.TextArea
            autoSize={{ maxRows: 4, minRows: 2 }}
            maxLength={300}
            onChange={(e) => onChange({ description: e.target.value })}
            value={description}
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
};
