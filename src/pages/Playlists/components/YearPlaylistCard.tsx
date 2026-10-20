import type { CSSProperties } from 'react';

import { CaretRightFilled, CheckCircleFilled, CloudUploadOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Tag, Typography } from 'antd';
import { memo } from 'react';

import type { YearPlaylist } from '../Playlists.view';

interface YearPlaylistCardProps {
  currentUri: null | string;
  onAdd: (year: number) => void;
  onPlay: (year: number) => void;
  playlist: YearPlaylist;
  size: number;
}

// Plain elements + CSS ellipsis for the song rows: Typography's measured ellipsis and per-row
// tooltips are far too heavy at 200 rows x every year.
const ellipsis: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const muted: CSSProperties = { color: 'var(--ant-color-text-secondary)', fontSize: 12 };

/** One year's top songs, with play and add-to-Spotify actions. */
export const YearPlaylistCard = memo(({ currentUri, onAdd, onPlay, playlist, size }: YearPlaylistCardProps) => {
  const { created, songs, uris, year } = playlist;
  const short = songs.length < size;

  return (
    <Card
      actions={[
        created ? (
          <Typography.Link href={created.url} key="open" rel="noreferrer" target="_blank">
            <CheckCircleFilled /> Open “{created.name}” in Spotify
          </Typography.Link>
        ) : (
          <Button disabled={!uris.length} icon={<CloudUploadOutlined />} key="add" onClick={() => onAdd(year)} type="link">
            Add to Spotify
          </Button>
        ),
      ]}
      extra={
        <Button disabled={!uris.length} icon={<CaretRightFilled />} onClick={() => onPlay(year)} size="small">
          Play
        </Button>
      }
      size="small"
      style={{ minWidth: 0 }}
      title={
        <Flex align="center" gap={8}>
          <span>{year}</span>
          <Tag style={{ marginInlineEnd: 0 }}>{short ? `${songs.length} songs` : `Top ${size}`}</Tag>
        </Flex>
      }
    >
      <ol style={{ height: 340, listStyle: 'none', margin: 0, overflowY: 'auto', padding: 0 }}>
        {songs.map((s, i) => {
          const playing = currentUri !== null && s.uris.includes(currentUri);
          return (
            <li
              key={s.key}
              style={{ alignItems: 'center', display: 'flex', gap: 10, padding: '3px 4px 3px 0' }}
              title={`${s.name} — ${s.artist}`}
            >
              <span style={{ ...muted, flexShrink: 0, fontSize: 13, textAlign: 'right', width: 28 }}>{i + 1}</span>
              <span style={{ display: 'flex', flex: 1, flexDirection: 'column', minWidth: 0 }}>
                <span
                  style={{
                    ...ellipsis,
                    color: playing ? 'var(--ant-color-primary)' : undefined,
                    fontWeight: playing ? 600 : undefined,
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
