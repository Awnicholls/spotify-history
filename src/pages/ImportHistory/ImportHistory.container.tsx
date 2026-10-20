import type { StoredHistory } from '../../types/history';
import { ImportHistoryView } from './ImportHistory.view';
import { useImportHistory } from './useImportHistory';

/**
 * Drop-zone for Spotify's extended streaming history export. The zip is read and parsed locally,
 * normalised, then saved so the stats survive restarts.
 */
export const ImportHistoryContainer = (props: {
  history: StoredHistory | null;
  onImported: (history: StoredHistory) => Promise<void>;
  onCancel?: () => void;
}) => <ImportHistoryView {...useImportHistory(props)} />;
