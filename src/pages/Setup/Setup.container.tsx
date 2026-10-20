import { SetupView } from './Setup.view';
import { useSetup } from './useSetup';

/**
 * First-run screen (also reachable from Settings → Change client ID): asks for the user's own
 * Spotify client ID and explains how to create one. Ported from Spotify Knockout's connect page.
 */
export const SetupContainer = (props: {
  clientId: string;
  onSave: (clientId: string) => void;
  onCancel?: () => void;
}) => <SetupView {...useSetup(props)} />;
