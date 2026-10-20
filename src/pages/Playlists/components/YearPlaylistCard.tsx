import { CaretRightFilled, CheckCircleFilled, CloudUploadOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Tag, Typography } from 'antd';
import type { CSSProperties } from 'react';
import { memo } from 'react';
import type { YearPlaylist } from '../Playlists.view';

interface YearPlaylistCardProps {
  playlist: YearPlaylist;
  size: number;
  currentUri: string | null;
  onPlay: (year: number) => void;
  onAdd: (year: number) => void;
}

// Plain elements + CSS ellipsis for the song rows: Typography's measured ellipsis and per-row
// tooltips are far too heavy at 200 rows x every year.
const ellipsis: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const muted: CSSProperties = { color: 'var(--ant-color-text-secondary)', fontSize: 12 };

/** One year's top songs, with play and add-to-Spotify actions. */
export const YearPlaylistCard = memo(({ playlist, size, currentUri, onPlay, onAdd }: YearPlaylistCardProps) => {
  const { year, songs, uris, created } = playlist;
  const short = songs.length < size;

  return (
    <Card
      size="small"
      style={{ minWidth: 0 }}
      title={
        <Flex align="center" gap={8}>
          <span>{year}</span>
          <Tag style={{ marginInlineEnd: 0 }}>{short ? `${songs.length} songs` : `Top ${size}`}</Tag>
        </Flex>
      }
      extra={
        <Button size="small" icon={<CaretRightFilled />} onClick={() => onPlay(year)} disabled={!uris.length}>
          Play
        </Button>
      }
      actions={[
        created ? (
          <Typography.Link key="open" href={created.url} target="_blank" rel="noreferrer">
            <CheckCircleFilled /> Open “{created.name}” in Spotify
          </Typography.Link>
        ) : (
          <Button key="add" type="link" icon={<CloudUploadOutlined />} onClick={() => onAdd(year)} disabled={!uris.length}>
            Add to Spotify
          </Button>
        ),
      ]}
    >
      <ol style={{ margin: 0, padding: 0, listStyle: 'none', height: 340, overflowY: 'auto' }}>
        {songs.map((s, i) => {
          const playing = !!currentUri && s.uris.includes(currentUri);
          return (
            <li
              key={s.key}
              title={`${s.name} — ${s.artist}`}
              style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '3px 4px 3px 0' }}
            >
              <span style={{ ...muted, fontSize: 13, width: 28, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    ...ellipsis,
                    fontWeight: playing ? 600 : undefined,
                    color: playing ? 'var(--ant-color-primary)' : undefined,
                  }}
                >
                  {s.name}
                </span>
                <span style={{ ...ellipsis, ...muted }}>{s.artist}</span>
              </span>
              <span style={{ ...muted, flexShrink: 0 }}>{s.plays.toLocaleString()} plays</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
});
YearPlaylistCard.displayName = 'YearPlaylistCard';
