import type { JSX } from 'react';

import type { StatCategory, StatRow } from '../../../../lib/aggregate';

import { StatsTableView } from './StatsTable.view';
import { useStatsTable } from './useStatsTable';

/** One ranked table (songs, artists, ...) with its own search box and min-plays filter. */
export const StatsTableContainer = (props: {
  category: StatCategory;
  minPlaySeconds: number;
  rows: StatRow[];
  /** Inside drawers/modals: give the table its own scroll area this tall (e.g. 'calc(100vh - 320px)'). */
  scrollY?: string;
}): JSX.Element => <StatsTableView {...useStatsTable(props)} />;
