import type { JSX } from 'react';

import { CloudUploadOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Popconfirm, Select, Spin, Typography } from 'antd';

import type { StatRow } from '../../lib/aggregate';
import type { CreatePlaylistModalProps } from './components/CreatePlaylistModal';

import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { YearPlaylistCard } from './components/YearPlaylistCard';

export interface YearPlaylist {
  /** Set once created in Spotify this session (for the current size). */
  created: { name: string; url: string; } | null;
  songs: StatRow[];
  /** Playable URIs, in rank order. */
  uris: string[];
  year: number;
}

export interface PlaylistsViewProps {
  addAllProgress: { done: number; total: number } | null;
  connected: boolean;
  currentUri: null | string;
  modal: CreatePlaylistModalProps | null;
  onAdd: (year: number) => void;
  onAddAll: () => void;
  onPlay: (year: number) => void;
  onSizeChange: (size: number) => void;
  playlists: YearPlaylist[];
  /** What the cards show - trails `size` by a frame while they re-render. */
  shownSize: number;
  /** What the dropdown shows. */
  size: number;
  sizes: number[];
  updating: boolean;
}

export const PlaylistsView = ({
  addAllProgress,
  connected,
  currentUri,
  modal,
  onAdd,
  onAddAll,
  onPlay,
  onSizeChange,
  playlists,
  shownSize,
  size,
  sizes,
  updating,
}: PlaylistsViewProps): JSX.Element => (
  <Flex gap={16} vertical>
    <Flex align="center" gap={12} wrap>
      <Typography.Title level={2} style={{ margin: '0 16px 0 0' }}>
        Playlists
      </Typography.Title>
      <Typography.Text type="secondary">Top</Typography.Text>
      <Select
        onChange={onSizeChange}
        options={sizes.map((s) => ({ label: `${s} songs`, value: s }))}
        style={{ width: 130 }}
        value={size}
      />
      <Typography.Text type="secondary">of each year</Typography.Text>
      {updating && <Spin size="small" />}
      <Popconfirm
        description="They're added to your Spotify as private playlists with the standard names."
        disabled={!connected || Boolean(addAllProgress)}
        okText="Create all"
        onConfirm={onAddAll}
        title={`Create ${playlists.filter((p) => !p.created).length} playlists?`}
      >
        <Button
          icon={<CloudUploadOutlined />}
          loading={Boolean(addAllProgress)}
          onClick={connected ? undefined : onAddAll}
          style={{ marginLeft: 'auto' }}
          type="primary"
        >
          {addAllProgress ? `Creating ${addAllProgress.done + 1} of ${addAllProgress.total}…` : 'Add all to Spotify'}
        </Button>
      </Popconfirm>
    </Flex>

    {playlists.length === 0 ? (
      <Empty description="No songs in your history yet." />
    ) : (
      // Fixed-width grid columns: card widths never depend on the songs inside them.
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          opacity: updating ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {playlists.map((p) => (
          <YearPlaylistCard
            currentUri={currentUri}
            key={p.year}
            onAdd={onAdd}
            onPlay={onPlay}
            playlist={p}
            size={shownSize}
          />
        ))}
      </div>
    )}

    {modal && <CreatePlaylistModal {...modal} />}
  </Flex>
);
