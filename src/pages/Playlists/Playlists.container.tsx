import type { JSX } from 'react';

import type { StoredHistory } from '../../types/history';

import { PlaylistsView } from './Playlists.view';
import { usePlaylists } from './usePlaylists';

/**
 * Playlists page: "Top N of each year" built from the history, one card per year, that can be
 * played or created in the user's Spotify (individually with a custom name, or all at once).
 */
export const PlaylistsContainer = ({ history }: { history: StoredHistory }): JSX.Element => (
  <PlaylistsView {...usePlaylists({ history })} />
);
