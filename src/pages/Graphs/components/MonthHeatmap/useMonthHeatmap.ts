import { useCallback, useMemo, useState } from 'react';
import { aggregate } from '../../../../lib/aggregate';
import type { YearRange } from '../../../../lib/graphs';
import { buildDayBuckets, MONTH_NAMES, monthGrids, playsOnDate } from '../../../../lib/graphs';
import type { Play } from '../../../../types/history';
import type { HeatMetric, MonthHeatmapViewProps } from './MonthHeatmap.view';

const MIN_PLAY_MS = 30_000;

const rangeLabel = ([from, to]: YearRange) => (from === to ? String(from) : `${from}–${to}`);

export const useMonthHeatmap = ({ plays, range }: { plays: Play[]; range: YearRange }): MonthHeatmapViewProps => {
  const [metric, setMetric] = useState<HeatMetric>('time');
  /** Clicked cell: a day, or a whole month when `day` is null. */
  const [selected, setSelected] = useState<{ month: number; day: number | null } | null>(null);

  // Stable so the memoised month cards don't all re-render when the drawer opens/closes.
  const onSelectDay = useCallback((month: number, day: number) => setSelected({ month, day }), []);
  const onSelectMonth = useCallback((month: number) => setSelected({ month, day: null }), []);

  const buckets = useMemo(() => buildDayBuckets(plays), [plays]);
  const { months, maxMs, maxStreams } = useMemo(() => monthGrids(buckets, range), [buckets, range]);

  const detail = useMemo(() => {
    if (!selected) return null;
    const dayPlays = playsOnDate(plays, selected.month, selected.day, range);
    const when = selected.day === null ? MONTH_NAMES[selected.month] : `${selected.day} ${MONTH_NAMES[selected.month]}`;
    return {
      title: `${when} · ${rangeLabel(range)}`,
      streams: dayPlays.length,
      ms: dayPlays.reduce((sum, p) => sum + p.ms, 0),
      songs: aggregate(dayPlays, 'songs', MIN_PLAY_MS),
      yearsWithPlays: new Set(dayPlays.map((p) => new Date(p.ts).getFullYear())).size,
    };
  }, [selected, plays, range]);

  return {
    months,
    max: metric === 'time' ? maxMs : maxStreams,
    metric,
    onMetricChange: setMetric,
    singleYear: range[0] === range[1],
    rangeLabel: rangeLabel(range),
    onSelectDay,
    onSelectMonth,
    detail,
    onCloseDetail: () => setSelected(null),
  };
};
