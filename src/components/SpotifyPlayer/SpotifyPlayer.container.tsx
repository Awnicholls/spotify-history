import { SpotifyPlayerView } from './SpotifyPlayer.view';
import { useSpotifyPlayer } from './useSpotifyPlayer';

/**
 * Header player. A Spotify Connect remote: audio plays on the user's Spotify app/device, and
 * this controls it (play/pause, skip, seek, volume, device) and shows what's on.
 */
export const SpotifyPlayerContainer = () => <SpotifyPlayerView {...useSpotifyPlayer()} />;
