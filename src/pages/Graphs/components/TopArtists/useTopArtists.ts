import { useCallback, useMemo, useState } from 'react';

import type { MonthTop, YearRange } from '../../../../lib/graphs';
import type { Play } from '../../../../types/history';
import type { ArtistMode, TopArtistsViewProps } from './TopArtists.view';

import { artistTrend, inRange } from '../../../../lib/graphs';
import { useSpotifyControls } from '../../../../spotify/SpotifyContext';

export const SERIES_OPTIONS = [5, 10, 15, 20];

export const useTopArtists = ({ plays, range }: { plays: Play[]; range: YearRange }): TopArtistsViewProps => {
  const { playUris } = useSpotifyControls();
  const [mode, setMode] = useState<ArtistMode>('share');
  const [seriesCount, setSeriesCount] = useState(10);
  const [includeOthers, setIncludeOthers] = useState(false);

  const scoped = useMemo(() => plays.filter((p) => inRange(new Date(p.ts).getFullYear(), range)), [plays, range]);
  const trend = useMemo(() => artistTrend(scoped, seriesCount, includeOthers), [scoped, seriesCount, includeOthers]);

  const monthsByKey = useMemo(() => {
    const out: Record<string, MonthTop> = {};
    for (const m of trend.months) {out[m.month] = m;}
    return out;
  }, [trend.months]);

  // Newest first for the list; skip empty months there (the chart still shows the gap).
  const listMonths = useMemo(() => trend.months.filter((m) => m.top.length).reverse(), [trend.months]);

  const onPlayArtist = useCallback(
    (month: string, artist: string) => {
      const entry = monthsByKey[month]?.top.find((t) => t.artist === artist);
      if (entry?.uris.length) {void playUris(entry.uris);}
    },
    [monthsByKey, playUris],
  );

  return {
    includeOthers,
    listMonths,
    mode,
    monthsByKey,
    onIncludeOthersChange: setIncludeOthers,
    onModeChange: setMode,
    onPlayArtist,
    onSeriesCountChange: setSeriesCount,
    rows: trend.rows,
    series: trend.series,
    seriesCount,
    seriesOptions: SERIES_OPTIONS,
  };
};
