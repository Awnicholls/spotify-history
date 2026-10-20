import type { StoredHistory } from '../../types/history';
import { StatsView } from './Stats.view';
import { useStats } from './useStats';

/**
 * The main stats page: global filters (date range, devices, what counts as a play), headline
 * numbers, and a tab per category (songs, artists, albums, podcasts, ...) with a searchable,
 * sortable, filterable table. Graphs will slot in here later.
 */
export const StatsContainer = ({ history }: { history: StoredHistory }) => (
  <StatsView {...useStats({ history })} />
);
