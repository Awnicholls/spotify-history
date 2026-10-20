import type { TableProps } from 'antd';
import { useDeferredValue, useMemo, useState } from 'react';
import type { StatCategory, StatRow } from '../../../../lib/aggregate';
import { HEADER_HEIGHT } from '../../../../lib/layout';
import { useSpotifyControls } from '../../../../spotify/SpotifyContext';
import type { ColumnFilters, SortField, SortState, TextField } from './columns';
import { TEXT_FIELDS } from './columns';
import type { StatsTableViewProps } from './StatsTable.view';

interface UseStatsTableArgs {
  category: StatCategory;
  rows: StatRow[];
  minPlaySeconds: number;
  stickyOffset?: number;
}

const DEFAULT_SORT: SortState = { field: 'plays', order: 'descend' };
/** Spotify accepts long URI lists, but 100 keeps the request small and the queue useful. */
const MAX_QUEUE = 100;

const compare = (field: SortField) =>
  TEXT_FIELDS.includes(field as TextField)
    ? (a: StatRow, b: StatRow) => (a[field] as string).localeCompare(b[field] as string)
    : (a: StatRow, b: StatRow) => (a[field] as number) - (b[field] as number);

/** Sort a level and, recursively, any nested device rows. */
const sortRows = (rows: StatRow[], sort: SortState): StatRow[] => {
  const cmp = compare(sort.field);
  const dir = sort.order === 'ascend' ? 1 : -1;
  return [...rows]
    .sort((a, b) => dir * cmp(a, b) || a.rank - b.rank)
    .map((r) => (r.children ? { ...r, children: sortRows(r.children, sort) } : r));
};

const matchesText = (r: StatRow, q: string) =>
  r.name.toLowerCase().includes(q) || r.artist.toLowerCase().includes(q) || r.album.toLowerCase().includes(q);

/** Keep rows matching `test`, or parents with a matching child (showing only those children). */
const filterTree = (rows: StatRow[], test: (r: StatRow) => boolean): StatRow[] =>
  rows.flatMap((r) => {
    if (test(r)) return [r];
    const children = r.children ? filterTree(r.children, test) : [];
    return children.length ? [{ ...r, children }] : [];
  });

/**
 * Sorting and filtering happen here rather than inside antd's Table, so the hook knows the exact
 * on-screen order - which is what "play from here" queues up.
 */
export const useStatsTable = ({
  category,
  rows,
  minPlaySeconds,
  stickyOffset = HEADER_HEIGHT,
}: UseStatsTableArgs): StatsTableViewProps => {
  const spotify = useSpotifyControls();
  const [search, setSearch] = useState('');
  const [minPlays, setMinPlays] = useState<number | null>(null);
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  // Typing stays snappy on 10k+ rows; the table catches up a frame later.
  const deferredSearch = useDeferredValue(search);

  const visibleRows = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    const colFilters = Object.entries(columnFilters).filter(([, v]) => v) as [TextField, string][];
    const filtered = filterTree(
      rows,
      (r) =>
        (!minPlays || r.plays >= minPlays) &&
        (!q || matchesText(r, q)) &&
        colFilters.every(([field, value]) => r[field].toLowerCase().includes(value.toLowerCase())),
    );
    return sortRows(filtered, sort);
  }, [rows, deferredSearch, minPlays, columnFilters, sort]);

  const onTableChange: TableProps<StatRow>['onChange'] = (_pagination, filters, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setSort(s?.order && s.columnKey ? { field: s.columnKey as SortField, order: s.order } : DEFAULT_SORT);
    const next: ColumnFilters = {};
    for (const field of TEXT_FIELDS) {
      const value = filters[field]?.[0];
      if (typeof value === 'string' && value) next[field] = value;
    }
    setColumnFilters(next);
  };

  const canPlay = category !== 'platforms';
  const singleItems = category === 'songs' || category === 'episodes';

  const onPlay = (row: StatRow) => {
    const isCurrent = !!spotify.currentUri && row.uris.includes(spotify.currentUri);
    if (isCurrent) {
      void spotify.togglePlay();
      return;
    }
    if (singleItems) {
      // Play this row, then carry on down the table in its current order.
      const start = visibleRows.indexOf(row);
      const queue = visibleRows
        .slice(Math.max(0, start))
        .map((r) => r.uri)
        .filter(Boolean)
        .slice(0, MAX_QUEUE);
      void spotify.playUris(queue);
    } else {
      // Artists, albums, shows: their most-played items from your history.
      void spotify.playUris(row.uris);
    }
  };

  return {
    category,
    stickyOffset,
    rows: visibleRows,
    totalRows: rows.length,
    minPlaySeconds,
    search,
    onSearchChange: setSearch,
    minPlays,
    onMinPlaysChange: setMinPlays,
    sort,
    columnFilters,
    onTableChange,
    player: canPlay
      ? { currentUri: spotify.currentUri, isPlaying: spotify.isPlaying, onPlay, singleItems }
      : null,
  };
};
