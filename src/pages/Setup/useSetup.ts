import { useState } from 'react';
import { SPOTIFY_REDIRECT_URI } from '../../types/config';
import type { SetupViewProps } from './Setup.view';

interface UseSetupArgs {
  clientId: string;
  onSave: (clientId: string) => void;
  onCancel?: () => void;
}

// Spotify client IDs are 32 hex characters.
const CLIENT_ID_PATTERN = /^[0-9a-f]{32}$/i;

export const useSetup = ({ clientId, onSave, onCancel }: UseSetupArgs): SetupViewProps => {
  const [value, setValue] = useState(clientId);
  const [error, setError] = useState<string | null>(null);

  const onChange = (next: string) => {
    setValue(next);
    if (error) setError(null);
  };

  const onSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError('Enter the client ID from your Spotify developer dashboard app.');
      return;
    }
    if (!CLIENT_ID_PATTERN.test(trimmed)) {
      setError(
        "That doesn't look like a client ID - it's 32 letters and numbers, shown on your app's Settings page. Don't paste the client secret.",
      );
      return;
    }
    onSave(trimmed);
  };

  return {
    value,
    error,
    redirectUri: SPOTIFY_REDIRECT_URI,
    isChanging: !!clientId,
    onChange,
    onSubmit,
    onCancel,
  };
};
