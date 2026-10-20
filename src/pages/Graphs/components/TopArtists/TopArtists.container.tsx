import type { YearRange } from '../../../../lib/graphs';
import type { Play } from '../../../../types/history';
import { TopArtistsView } from './TopArtists.view';
import { useTopArtists } from './useTopArtists';

/**
 * Top bands: a monthly stacked area of your biggest artists over the selected years, and each
 * month's own top 10 (in the chart tooltip and as a playable list).
 */
export const TopArtistsContainer = (props: { plays: Play[]; range: YearRange }) => (
  <TopArtistsView {...useTopArtists(props)} />
);
