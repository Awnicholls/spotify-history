import { CloudUploadOutlined } from '@ant-design/icons';
import { Button, Empty, Flex, Popconfirm, Select, Spin, Typography } from 'antd';
import type { StatRow } from '../../lib/aggregate';
import type { CreatePlaylistModalProps } from './components/CreatePlaylistModal';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { YearPlaylistCard } from './components/YearPlaylistCard';

export interface YearPlaylist {
  year: number;
  songs: StatRow[];
  /** Playable URIs, in rank order. */
  uris: string[];
  /** Set once created in Spotify this session (for the current size). */
  created: { url: string; name: string } | null;
}

export interface PlaylistsViewProps {
  /** What the dropdown shows. */
  size: number;
  /** What the cards show - trails `size` by a frame while they re-render. */
  shownSize: number;
  updating: boolean;
  sizes: number[];
  onSizeChange: (size: number) => void;
  playlists: YearPlaylist[];
  connected: boolean;
  currentUri: string | null;
  onPlay: (year: number) => void;
  onAdd: (year: number) => void;
  onAddAll: () => void;
  addAllProgress: { done: number; total: number } | null;
  modal: CreatePlaylistModalProps | null;
}

export const PlaylistsView = ({
  size,
  shownSize,
  updating,
  sizes,
  onSizeChange,
  playlists,
  connected,
  currentUri,
  onPlay,
  onAdd,
  onAddAll,
  addAllProgress,
  modal,
}: PlaylistsViewProps) => (
  <Flex vertical gap={16}>
    <Flex wrap gap={12} align="center">
      <Typography.Title level={2} style={{ margin: '0 16px 0 0' }}>
        Playlists
      </Typography.Title>
      <Typography.Text type="secondary">Top</Typography.Text>
      <Select
        value={size}
        onChange={onSizeChange}
        options={sizes.map((s) => ({ label: `${s} songs`, value: s }))}
        style={{ width: 130 }}
      />
      <Typography.Text type="secondary">of each year</Typography.Text>
      {updating && <Spin size="small" />}
      <Popconfirm
        title={`Create ${playlists.filter((p) => !p.created).length} playlists?`}
        description="They're added to your Spotify as private playlists with the standard names."
        okText="Create all"
        onConfirm={onAddAll}
        disabled={!connected || !!addAllProgress}
      >
        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          loading={!!addAllProgress}
          onClick={connected ? undefined : onAddAll}
          style={{ marginLeft: 'auto' }}
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 16,
          opacity: updating ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        {playlists.map((p) => (
          <YearPlaylistCard
            key={p.year}
            playlist={p}
            size={shownSize}
            currentUri={currentUri}
            onPlay={onPlay}
            onAdd={onAdd}
          />
        ))}
      </div>
    )}

    {modal && <CreatePlaylistModal {...modal} />}
  </Flex>
);
