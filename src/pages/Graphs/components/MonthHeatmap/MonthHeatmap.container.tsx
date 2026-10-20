import type { YearRange } from '../../../../lib/graphs';
import type { Play } from '../../../../types/history';
import { MonthHeatmapView } from './MonthHeatmap.view';
import { useMonthHeatmap } from './useMonthHeatmap';

/**
 * Calendar heatmap: twelve month grids, each day coloured by listening across the selected
 * years. Clicking a day or a month opens the songs played then.
 */
export const MonthHeatmapContainer = (props: { plays: Play[]; range: YearRange }) => (
  <MonthHeatmapView {...useMonthHeatmap(props)} />
);
