import type { JSX, ReactNode } from 'react';

import { SpotifyControlsContext, SpotifyPlaybackContext } from './SpotifyContext';
import { useSpotifyState } from './useSpotifyState';

/** Owns the Spotify connection and playback state for everything below it. */
export const SpotifyProvider = ({ children, clientId }: { children: ReactNode; clientId: string; }): JSX.Element => {
  const { controls, playback } = useSpotifyState(clientId);
  return (
    <SpotifyControlsContext.Provider value={controls}>
      <SpotifyPlaybackContext.Provider value={playback}>{children}</SpotifyPlaybackContext.Provider>
    </SpotifyControlsContext.Provider>
  );
};
