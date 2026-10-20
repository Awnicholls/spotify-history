import type { JSX } from 'react';

import type { StatCategory, StatRow } from '../../../../lib/aggregate';

import { StatsTableView } from './StatsTable.view';
import { useStatsTable } from './useStatsTable';

/** One ranked table (songs, artists, ...) with its own search box and min-plays filter. */
export const StatsTableContainer = (props: {
  category: StatCategory;
  minPlaySeconds: number;
  rows: StatRow[];
  /** Sticky header offset; defaults to below the app header. Use 0 inside drawers/modals. */
  stickyOffset?: number;
}): JSX.Element => <StatsTableView {...useStatsTable(props)} />;
