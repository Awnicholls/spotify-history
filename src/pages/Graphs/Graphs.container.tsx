import type { JSX } from 'react';

import type { StoredHistory } from '../../types/history';

import { GraphsView } from './Graphs.view';
import { useGraphs } from './useGraphs';

/**
 * Graphs page: a year scope (all years, one year or a range) shared by three sub-tabs - a
 * clickable calendar heatmap, a time-of-day heatmap and top bands month by month.
 */
export const GraphsContainer = ({ history }: { history: StoredHistory }): JSX.Element => (
  <GraphsView {...useGraphs({ history })} />
);
