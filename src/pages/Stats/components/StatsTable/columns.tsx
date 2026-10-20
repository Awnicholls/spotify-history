import { FilterFilled, PauseCircleFilled, PlayCircleFilled } from '@ant-design/icons';
import type { TableColumnType } from 'antd';
import { Button, Tooltip, Typography } from 'antd';
import type { ReactNode } from 'react';
import type { StatCategory, StatRow } from '../../../../lib/aggregate';
import {
  durationDetail,
  formatDate,
  formatDateTime,
  formatDuration,
  formatNumber,
  formatPercent,
} from '../../../../lib/format';
import { TextFilterDropdown } from './components/TextFilterDropdown';

interface CategoryLabels {
  name: string;
  artist?: string;
  album?: string;
  /** Header for `uniqueItems`, if the category has it. */
  unique?: string;
  plural: string;
  searchHint: string;
}

export const CATEGORY_LABELS: Record<StatCategory, CategoryLabels> = {
  songs: { name: 'Song', artist: 'Artist', album: 'Album', plural: 'songs', searchHint: 'songs, artists, albums' },
  artists: { name: 'Artist', unique: 'Songs', plural: 'artists', searchHint: 'artists' },
  albums: { name: 'Album', artist: 'Artist', unique: 'Songs', plural: 'albums', searchHint: 'albums, artists' },
  shows: { name: 'Podcast', unique: 'Episodes', plural: 'podcasts', searchHint: 'podcasts' },
  episodes: { name: 'Episode', artist: 'Podcast', plural: 'episodes', searchHint: 'episodes, podcasts' },
  audiobooks: { name: 'Audiobook', unique: 'Chapters', plural: 'audiobooks', searchHint: 'audiobooks' },
  platforms: { name: 'Device', unique: 'Unique items', plural: 'device types', searchHint: 'devices' },
};

export type TextField = 'name' | 'artist' | 'album';
export const TEXT_FIELDS: TextField[] = ['name', 'artist', 'album'];
type NumberField = 'rank' | 'plays' | 'streams' | 'ms' | 'avgMs' | 'skips' | 'skipRate' | 'uniqueItems' | 'firstTs' | 'lastTs';
export type SortField = TextField | NumberField;

export interface SortState {
  field: SortField;
  order: 'ascend' | 'descend';
}

export type ColumnFilters = Partial<Record<TextField, string>>;

export interface RowPlayer {
  currentUri: string | null;
  isPlaying: boolean;
  /** Songs/episodes: queue from this row down. Others: the row's top items. */
  singleItems: boolean;
  onPlay: (row: StatRow) => void;
}

interface ColumnState {
  sort: SortState;
  filters: ColumnFilters;
}

const sortOrderFor = (field: SortField, state: ColumnState) =>
  state.sort.field === field ? state.sort.order : null;

/** Sortable text column with a "contains" filter. Sorting/filtering are done by the hook. */
const textColumn = (field: TextField, title: string, width: number, state: ColumnState): TableColumnType<StatRow> => ({
  key: field,
  dataIndex: field,
  title,
  width,
  sorter: true,
  sortOrder: sortOrderFor(field, state),
  sortDirections: ['ascend', 'descend'],
  filteredValue: state.filters[field] ? [state.filters[field]] : null,
  filterDropdown: (props) => <TextFilterDropdown {...props} label={title} />,
  filterIcon: (filtered) => <FilterFilled style={{ color: filtered ? 'var(--ant-color-primary)' : undefined }} />,
});

const numberColumn = (
  field: NumberField,
  title: string,
  render: (row: StatRow) => ReactNode,
  state: ColumnState,
  tooltip?: string,
): TableColumnType<StatRow> => ({
  key: field,
  dataIndex: field,
  title: tooltip ? <Tooltip title={tooltip}>{title}</Tooltip> : title,
  align: 'right',
  sorter: true,
  sortOrder: sortOrderFor(field, state),
  sortDirections: ['descend', 'ascend'],
  render: (_: unknown, row) => render(row),
});

const durationCell = (ms: number) => {
  const detail = durationDetail(ms);
  return detail ? <Tooltip title={detail}>{formatDuration(ms)}</Tooltip> : formatDuration(ms);
};

const dateCell = (ts: number) => <Tooltip title={formatDateTime(ts)}>{formatDate(ts)}</Tooltip>;

const playColumn = (player: RowPlayer): TableColumnType<StatRow> => ({
  key: 'play',
  width: 44,
  fixed: 'left',
  align: 'center',
  render: (_: unknown, row) => {
    if (!row.uris.length) return null;
    const current = !!player.currentUri && row.uris.includes(player.currentUri);
    const playing = current && player.isPlaying;
    return (
      <Tooltip title={playing ? 'Pause' : player.singleItems ? 'Play from here' : 'Play top songs'}>
        <Button
          type="text"
          size="small"
          shape="circle"
          aria-label={playing ? 'Pause' : 'Play'}
          icon={playing ? <PauseCircleFilled /> : <PlayCircleFilled />}
          style={{ color: current ? 'var(--ant-color-primary)' : undefined, fontSize: 18 }}
          onClick={() => player.onPlay(row)}
        />
      </Tooltip>
    );
  },
});

export const buildColumns = (
  category: StatCategory,
  minPlaySeconds: number,
  sort: SortState,
  filters: ColumnFilters,
  player: RowPlayer | null,
): TableColumnType<StatRow>[] => {
  const labels = CATEGORY_LABELS[category];
  const state: ColumnState = { sort, filters };

  return [
    {
      ...numberColumn('rank', '#', (r) => (r.rank ? String(r.rank) : ''), state,
        'Rank by plays, then time listened, within the current filters'),
      width: 64,
      fixed: 'left',
      sortDirections: ['ascend', 'descend'],
    },
    ...(player ? [playColumn(player)] : []),
    {
      ...textColumn('name', labels.name, category === 'songs' || category === 'episodes' ? 300 : 260, state),
      fixed: 'left',
      render: (_: unknown, row) => {
        const current = !!player?.currentUri && row.uri === player.currentUri;
        return (
          <Typography.Text strong style={current ? { color: 'var(--ant-color-primary)' } : undefined}>
            {row.name}
          </Typography.Text>
        );
      },
    },
    ...(labels.artist ? [textColumn('artist', labels.artist, 200, state)] : []),
    ...(labels.album ? [textColumn('album', labels.album, 220, state)] : []),
    numberColumn('plays', 'Plays', (r) => formatNumber(r.plays), state, `Streams of ${minPlaySeconds}s or longer`),
    numberColumn('streams', 'Streams', (r) => formatNumber(r.streams), state, 'Every stream, however short'),
    numberColumn('ms', 'Time listened', (r) => durationCell(r.ms), state),
    numberColumn('avgMs', 'Avg listen', (r) => durationCell(r.avgMs), state, 'Average time per stream'),
    ...(labels.unique
      ? [numberColumn('uniqueItems', labels.unique, (r) => formatNumber(r.uniqueItems), state)]
      : []),
    numberColumn('skips', 'Skips', (r) => formatNumber(r.skips), state),
    numberColumn('skipRate', 'Skip %', (r) => formatPercent(r.skipRate), state, 'Skips as a share of streams'),
    numberColumn('firstTs', 'First played', (r) => dateCell(r.firstTs), state),
    numberColumn('lastTs', 'Last played', (r) => dateCell(r.lastTs), state),
  ];
};
