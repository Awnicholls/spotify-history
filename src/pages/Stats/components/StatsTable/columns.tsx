import type { TableColumnType } from 'antd';
import type { JSX, ReactNode } from 'react';

import { FilterFilled, PauseCircleFilled, PlayCircleFilled } from '@ant-design/icons';
import { Button, Tooltip, Typography } from 'antd';

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
  album?: string;
  artist?: string;
  name: string;
  plural: string;
  searchHint: string;
  /** Header for `uniqueItems`, if the category has it. */
  unique?: string;
}

export const CATEGORY_LABELS: Record<StatCategory, CategoryLabels> = {
  albums: { artist: 'Artist', name: 'Album', plural: 'albums', searchHint: 'albums, artists', unique: 'Songs' },
  artists: { name: 'Artist', plural: 'artists', searchHint: 'artists', unique: 'Songs' },
  audiobooks: { name: 'Audiobook', plural: 'audiobooks', searchHint: 'audiobooks', unique: 'Chapters' },
  episodes: { artist: 'Podcast', name: 'Episode', plural: 'episodes', searchHint: 'episodes, podcasts' },
  platforms: { name: 'Device', plural: 'device types', searchHint: 'devices', unique: 'Unique items' },
  shows: { name: 'Podcast', plural: 'podcasts', searchHint: 'podcasts', unique: 'Episodes' },
  songs: { album: 'Album', artist: 'Artist', name: 'Song', plural: 'songs', searchHint: 'songs, artists, albums' },
};

export type TextField = 'album' | 'artist' | 'name';
export const TEXT_FIELDS: TextField[] = ['name', 'artist', 'album'];
type NumberField = 'avgMs' | 'firstTs' | 'lastTs' | 'ms' | 'plays' | 'rank' | 'skipRate' | 'skips' | 'streams' | 'uniqueItems';
export type SortField = NumberField | TextField;
const NUMBER_FIELDS: readonly NumberField[] = [
  'avgMs',
  'firstTs',
  'lastTs',
  'ms',
  'plays',
  'rank',
  'skipRate',
  'skips',
  'streams',
  'uniqueItems',
];

export const isTextField = (value: unknown): value is TextField => TEXT_FIELDS.some((f) => f === value);
export const isSortField = (value: unknown): value is SortField =>
  isTextField(value) || NUMBER_FIELDS.some((f) => f === value);

export interface SortState {
  field: SortField;
  order: 'ascend' | 'descend';
}

export type ColumnFilters = Partial<Record<TextField, string>>;

export interface RowPlayer {
  currentUri: null | string;
  isPlaying: boolean;
  onPlay: (row: StatRow) => void;
  /** Songs/episodes: queue from this row down. Others: the row's top items. */
  singleItems: boolean;
}

interface ColumnState {
  filters: ColumnFilters;
  sort: SortState;
}

const sortOrderFor = (field: SortField, state: ColumnState): 'ascend' | 'descend' | null =>
  state.sort.field === field ? state.sort.order : null;

/** Sortable text column with a "contains" filter. Sorting/filtering are done by the hook. */
const textColumn = (field: TextField, title: string, width: number, state: ColumnState): TableColumnType<StatRow> => ({
  dataIndex: field,
  filterDropdown: (props) => <TextFilterDropdown {...props} label={title} />,
  filteredValue: state.filters[field] ? [state.filters[field]] : null,
  filterIcon: (filtered) => <FilterFilled style={{ color: filtered ? 'var(--ant-color-primary)' : undefined }} />,
  key: field,
  sortDirections: ['ascend', 'descend'],
  sorter: true,
  sortOrder: sortOrderFor(field, state),
  title,
  width,
});

const numberColumn = (
  field: NumberField,
  title: string,
  render: (row: StatRow) => ReactNode,
  state: ColumnState,
  tooltip?: string,
): TableColumnType<StatRow> => ({
  align: 'right',
  dataIndex: field,
  key: field,
  render: (_: unknown, row) => render(row),
  sortDirections: ['descend', 'ascend'],
  sorter: true,
  sortOrder: sortOrderFor(field, state),
  title: tooltip ? <Tooltip title={tooltip}>{title}</Tooltip> : title,
});

const durationCell = (ms: number): JSX.Element | string => {
  const detail = durationDetail(ms);
  return detail ? <Tooltip title={detail}>{formatDuration(ms)}</Tooltip> : formatDuration(ms);
};

const dateCell = (ts: number): JSX.Element => <Tooltip title={formatDateTime(ts)}>{formatDate(ts)}</Tooltip>;

const playColumn = (player: RowPlayer): TableColumnType<StatRow> => ({
  align: 'center',
  fixed: 'left',
  key: 'play',
  render: (_: unknown, row) => {
    if (!row.uris.length) {return null;}
    const current = player.currentUri !== null && row.uris.includes(player.currentUri);
    const playing = current && player.isPlaying;
    return (
      <Tooltip title={playing ? 'Pause' : player.singleItems ? 'Play from here' : 'Play top songs'}>
        <Button
          aria-label={playing ? 'Pause' : 'Play'}
          icon={playing ? <PauseCircleFilled /> : <PlayCircleFilled />}
          onClick={() => player.onPlay(row)}
          shape="circle"
          size="small"
          style={{ color: current ? 'var(--ant-color-primary)' : undefined, fontSize: 18 }}
          type="text"
        />
      </Tooltip>
    );
  },
  width: 44,
});

export const buildColumns = (
  category: StatCategory,
  minPlaySeconds: number,
  sort: SortState,
  filters: ColumnFilters,
  player: null | RowPlayer,
): TableColumnType<StatRow>[] => {
  const labels = CATEGORY_LABELS[category];
  const state: ColumnState = { filters, sort };

  return [
    {
      ...numberColumn('rank', '#', (r) => (r.rank ? String(r.rank) : ''), state,
        'Rank by plays, then time listened, within the current filters'),
      fixed: 'left',
      sortDirections: ['ascend', 'descend'],
      width: 64,
    },
    ...(player ? [playColumn(player)] : []),
    {
      ...textColumn('name', labels.name, category === 'songs' || category === 'episodes' ? 300 : 260, state),
      fixed: 'left',
      render: (_: unknown, row) => {
        const current = player !== null && player.currentUri !== null && row.uri === player.currentUri;
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
