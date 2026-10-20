import { useMemo } from 'react';

import type { YearRange } from '../../../../lib/graphs';
import type { Play } from '../../../../types/history';
import type { TimeOfDayViewProps } from './TimeOfDay.view';

import { buildHourBuckets, hourGrid, WEEKDAYS } from '../../../../lib/graphs';

const hourLabel = (h: number): string => `${String(h).padStart(2, '0')}:00`;

export const useTimeOfDay = ({ plays, range }: { plays: Play[]; range: YearRange }): TimeOfDayViewProps => {
  const buckets = useMemo(() => buildHourBuckets(plays), [plays]);
  const { cells, max } = useMemo(() => hourGrid(buckets, range), [buckets, range]);

  const summary = useMemo(() => {
    let best = { h: 0, ms: -1, wd: 0 };
    const byHour = Array.from({ length: 24 }, () => 0);
    const byDay = cells.map((row) => row.reduce((a, b) => a + b, 0));
    cells.forEach((row, wd) =>
      row.forEach((ms, h) => {
        byHour[h] += ms;
        if (ms > best.ms) {best = { h, ms, wd };}
      }),
    );
    const topHour = byHour.indexOf(Math.max(...byHour));
    const topDay = byDay.indexOf(Math.max(...byDay));
    return {
      busiestDay: max > 0 ? WEEKDAYS[topDay] : '–',
      busiestHour: max > 0 ? hourLabel(topHour) : '–',
      busiestSlot: best.ms > 0 ? `${WEEKDAYS[best.wd]} ${hourLabel(best.h)}` : '–',
      byDay,
      byHour,
    };
  }, [cells, max]);

  return { cells, max, ...summary };
};
