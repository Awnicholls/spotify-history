import { useCallback, useMemo, useState } from 'react';

import type { YearRange } from '../../../../lib/graphs';
import type { Play } from '../../../../types/history';
import type { HeatMetric, MonthHeatmapViewProps } from './MonthHeatmap.view';

import { aggregate } from '../../../../lib/aggregate';
import { heatThresholds } from '../../../../lib/color';
import { buildDayBuckets, MONTH_NAMES, monthGrids, playsOnDate } from '../../../../lib/graphs';

const MIN_PLAY_MS = 30_000;

const rangeLabel = ([from, to]: YearRange): string => (from === to ? String(from) : `${from}–${to}`);

export const useMonthHeatmap = ({ plays, range }: { plays: Play[]; range: YearRange }): MonthHeatmapViewProps => {
  const [metric, setMetric] = useState<HeatMetric>('time');
  /** Clicked cell: a day, or a whole month when `day` is null. */
  const [selected, setSelected] = useState<{ day: null | number; month: number; } | null>(null);

  // Stable so the memoised month cards don't all re-render when the drawer opens/closes.
  const onSelectDay = useCallback((month: number, day: number) => setSelected({ day, month }), []);
  const onSelectMonth = useCallback((month: number) => setSelected({ day: null, month }), []);

  const buckets = useMemo(() => buildDayBuckets(plays), [plays]);
  const { months } = useMemo(() => monthGrids(buckets, range), [buckets, range]);
  // Colour steps by quantile of the visible days, so differences stay visible with lots of data.
  const thresholds = useMemo(
    () => heatThresholds(months.flatMap((m) => m.days.map((d) => (metric === 'time' ? d.ms : d.streams)))),
    [months, metric],
  );

  const detail = useMemo(() => {
    if (!selected) {return null;}
    const dayPlays = playsOnDate(plays, selected.month, selected.day, range);
    const when = selected.day === null ? MONTH_NAMES[selected.month] : `${selected.day} ${MONTH_NAMES[selected.month]}`;
    return {
      ms: dayPlays.reduce((sum, p) => sum + p.ms, 0),
      songs: aggregate(dayPlays, 'songs', MIN_PLAY_MS),
      streams: dayPlays.length,
      title: `${when} · ${rangeLabel(range)}`,
      yearsWithPlays: new Set(dayPlays.map((p) => new Date(p.ts).getFullYear())).size,
    };
  }, [selected, plays, range]);

  return {
    detail,
    metric,
    months,
    onCloseDetail: () => setSelected(null),
    onMetricChange: setMetric,
    onSelectDay,
    onSelectMonth,
    rangeLabel: rangeLabel(range),
    singleYear: range[0] === range[1],
    thresholds,
  };
};
