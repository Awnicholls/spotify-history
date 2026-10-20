import { useMemo, useState } from 'react';
import type { YearRange } from '../../lib/graphs';
import type { StoredHistory } from '../../types/history';
import type { GraphsTab, GraphsViewProps } from './Graphs.view';

export const useGraphs = ({ history }: { history: StoredHistory }): GraphsViewProps => {
  const plays = history.plays;

  const bounds = useMemo<YearRange>(() => {
    // The page only shows once a history is imported, so this is just a type-safe fallback.
    if (!plays.length) return [1970, 1970];
    return [new Date(plays[0].ts).getFullYear(), new Date(plays[plays.length - 1].ts).getFullYear()];
  }, [plays]);

  // Null = all years; follows the data if a new export widens it.
  const [picked, setPicked] = useState<YearRange | null>(null);
  // Memoised so the charts' derived data only recompute when the years actually change.
  const range = useMemo<YearRange>(
    () => (picked ? [Math.max(bounds[0], picked[0]), Math.min(bounds[1], picked[1])] : bounds),
    [picked, bounds],
  );

  const [activeTab, setActiveTab] = useState<GraphsTab>('calendar');

  return {
    plays,
    bounds,
    range,
    isAllYears: !picked || (range[0] === bounds[0] && range[1] === bounds[1]),
    onRangeChange: (r) => setPicked(r[0] === bounds[0] && r[1] === bounds[1] ? null : r),
    onAllYears: () => setPicked(null),
    activeTab,
    onTabChange: (key) => setActiveTab(key as GraphsTab),
  };
};
