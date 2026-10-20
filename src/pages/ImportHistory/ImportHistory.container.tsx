import type { JSX } from 'react';

import type { StoredHistory } from '../../types/history';

import { ImportHistoryView } from './ImportHistory.view';
import { useImportHistory } from './useImportHistory';

/**
 * Drop-zone for Spotify's extended streaming history export. The zip is read and parsed locally,
 * normalised, then saved so the stats survive restarts.
 */
export const ImportHistoryContainer = (props: {
  history: null | StoredHistory;
  onCancel?: () => void;
  onImported: (history: StoredHistory) => Promise<void>;
}): JSX.Element => <ImportHistoryView {...useImportHistory(props)} />;
