import type { YearRange } from '../../../../lib/graphs';
import type { Play } from '../../../../types/history';
import { TimeOfDayView } from './TimeOfDay.view';
import { useTimeOfDay } from './useTimeOfDay';

/** When you listen: weekday x hour heatmap for the selected years. */
export const TimeOfDayContainer = (props: { plays: Play[]; range: YearRange }) => (
  <TimeOfDayView {...useTimeOfDay(props)} />
);
