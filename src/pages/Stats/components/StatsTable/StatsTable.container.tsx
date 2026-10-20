import type { StatCategory, StatRow } from '../../../../lib/aggregate';
import { StatsTableView } from './StatsTable.view';
import { useStatsTable } from './useStatsTable';

/** One ranked table (songs, artists, ...) with its own search box and min-plays filter. */
export const StatsTableContainer = (props: {
  category: StatCategory;
  rows: StatRow[];
  minPlaySeconds: number;
  /** Sticky header offset; defaults to below the app header. Use 0 inside drawers/modals. */
  stickyOffset?: number;
}) => <StatsTableView {...useStatsTable(props)} />;
