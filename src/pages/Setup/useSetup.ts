import { useState } from 'react';

import type { SetupViewProps } from './Setup.view';

import { SPOTIFY_REDIRECT_URI } from '../../types/config';

interface UseSetupArgs {
  clientId: string;
  onCancel?: () => void;
  onSave: (clientId: string) => void;
}

// Spotify client IDs are 32 hex characters.
const CLIENT_ID_PATTERN = /^[0-9a-f]{32}$/i;

export const useSetup = ({ clientId, onCancel, onSave }: UseSetupArgs): SetupViewProps => {
  const [value, setValue] = useState(clientId);
  const [error, setError] = useState<null | string>(null);

  const onChange = (next: string): void => {
    setValue(next);
    if (error) {setError(null);}
  };

  const onSubmit = (): void => {
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
    error,
    isChanging: Boolean(clientId),
    onCancel,
    onChange,
    onSubmit,
    redirectUri: SPOTIFY_REDIRECT_URI,
    value,
  };
};
