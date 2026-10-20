import { App } from 'antd';
import { useState } from 'react';

import type { StoredHistory } from '../../types/history';
import type { ImportHistoryViewProps } from './ImportHistory.view';

import { formatNumber } from '../../lib/format';
import { parseHistoryFiles } from '../../lib/parseHistory';
import { HISTORY_VERSION } from '../../types/history';

interface UseImportHistoryArgs {
  history: null | StoredHistory;
  onCancel?: () => void;
  onImported: (history: StoredHistory) => Promise<void>;
}

export const useImportHistory = ({
  history,
  onCancel,
  onImported,
}: UseImportHistoryArgs): ImportHistoryViewProps => {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<null | string>(null);

  const importFiles = async (files: File[]): Promise<void> => {
    setBusy(true);
    setError(null);
    try {
      const result = await parseHistoryFiles(files);
      if (result.plays.length === 0) {throw new Error('The history files were empty.');}
      await onImported({
        files: result.files,
        importedAt: Date.now(),
        plays: result.plays,
        version: HISTORY_VERSION,
      });
      message.success(
        `Imported ${formatNumber(result.plays.length)} streams from ${result.files.length} file${
          result.files.length === 1 ? '' : 's'
        }.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // antd calls beforeUpload once per file with the whole batch; import the batch on the first
  // call and return false so antd never tries to upload anything anywhere.
  const beforeUpload = (file: File, batch: File[]): boolean => {
    if (file === batch[0]) {void importFiles(batch);}
    return false;
  };

  return {
    beforeUpload,
    busy,
    current: history
      ? {
          firstTs: history.plays[0]?.ts ?? 0,
          importedAt: history.importedAt,
          lastTs: history.plays[history.plays.length - 1]?.ts ?? 0,
          streams: history.plays.length,
        }
      : null,
    dismissError: () => setError(null),
    error,
    onCancel,
  };
};
