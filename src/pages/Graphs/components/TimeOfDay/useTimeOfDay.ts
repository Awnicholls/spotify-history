import { useMemo } from 'react';
import type { YearRange } from '../../../../lib/graphs';
import { buildHourBuckets, hourGrid, WEEKDAYS } from '../../../../lib/graphs';
import type { Play } from '../../../../types/history';
import type { TimeOfDayViewProps } from './TimeOfDay.view';

const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

export const useTimeOfDay = ({ plays, range }: { plays: Play[]; range: YearRange }): TimeOfDayViewProps => {
  const buckets = useMemo(() => buildHourBuckets(plays), [plays]);
  const { cells, max } = useMemo(() => hourGrid(buckets, range), [buckets, range]);

  const summary = useMemo(() => {
    let best = { wd: 0, h: 0, ms: -1 };
    const byHour = new Array<number>(24).fill(0);
    const byDay = cells.map((row) => row.reduce((a, b) => a + b, 0));
    cells.forEach((row, wd) =>
      row.forEach((ms, h) => {
        byHour[h] += ms;
        if (ms > best.ms) best = { wd, h, ms };
      }),
    );
    const topHour = byHour.indexOf(Math.max(...byHour));
    const topDay = byDay.indexOf(Math.max(...byDay));
    return {
      busiestSlot: best.ms > 0 ? `${WEEKDAYS[best.wd]} ${hourLabel(best.h)}` : '–',
      busiestHour: max > 0 ? hourLabel(topHour) : '–',
      busiestDay: max > 0 ? WEEKDAYS[topDay] : '–',
      byDay,
      byHour,
    };
  }, [cells, max]);

  return { cells, max, ...summary };
};
