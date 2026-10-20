import { useMemo, useState } from 'react';

import type { YearRange } from '../../lib/graphs';
import type { StoredHistory } from '../../types/history';
import type { GraphsTab, GraphsViewProps } from './Graphs.view';

const GRAPHS_TABS: readonly GraphsTab[] = ['artists', 'calendar', 'time'];
const isGraphsTab = (key: string): key is GraphsTab => GRAPHS_TABS.some((t) => t === key);

export const useGraphs = ({ history }: { history: StoredHistory }): GraphsViewProps => {
  const plays = history.plays;

  const bounds = useMemo<YearRange>(() => {
    // The page only shows once a history is imported, so this is just a type-safe fallback.
    if (!plays.length) {return [1970, 1970];}
    return [new Date(plays[0].ts).getFullYear(), new Date(plays[plays.length - 1].ts).getFullYear()];
  }, [plays]);

  // Null = all years; follows the data if a new export widens it.
  const [picked, setPicked] = useState<null | YearRange>(null);
  // Memoised so the charts' derived data only recompute when the years actually change.
  const range = useMemo<YearRange>(
    () => (picked ? [Math.max(bounds[0], picked[0]), Math.min(bounds[1], picked[1])] : bounds),
    [picked, bounds],
  );

  const [activeTab, setActiveTab] = useState<GraphsTab>('calendar');

  return {
    activeTab,
    bounds,
    isAllYears: !picked || (range[0] === bounds[0] && range[1] === bounds[1]),
    onAllYears: () => setPicked(null),
    onRangeChange: (r) => setPicked(r[0] === bounds[0] && r[1] === bounds[1] ? null : r),
    onTabChange: (key) => {
      if (isGraphsTab(key)) {setActiveTab(key);}
    },
    plays,
    range,
  };
};
