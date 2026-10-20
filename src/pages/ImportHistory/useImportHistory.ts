import { App } from 'antd';
import { useState } from 'react';
import { formatNumber } from '../../lib/format';
import { parseHistoryFiles } from '../../lib/parseHistory';
import type { StoredHistory } from '../../types/history';
import { HISTORY_VERSION } from '../../types/history';
import type { ImportHistoryViewProps } from './ImportHistory.view';

interface UseImportHistoryArgs {
  history: StoredHistory | null;
  onImported: (history: StoredHistory) => Promise<void>;
  onCancel?: () => void;
}

export const useImportHistory = ({
  history,
  onImported,
  onCancel,
}: UseImportHistoryArgs): ImportHistoryViewProps => {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importFiles = async (files: File[]) => {
    setBusy(true);
    setError(null);
    try {
      const result = await parseHistoryFiles(files);
      if (result.plays.length === 0) throw new Error('The history files were empty.');
      await onImported({
        version: HISTORY_VERSION,
        importedAt: Date.now(),
        files: result.files,
        plays: result.plays,
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
  const beforeUpload = (file: File, batch: File[]) => {
    if (file === batch[0]) void importFiles(batch);
    return false;
  };

  return {
    busy,
    error,
    current: history
      ? {
          streams: history.plays.length,
          firstTs: history.plays[0]?.ts ?? 0,
          lastTs: history.plays[history.plays.length - 1]?.ts ?? 0,
          importedAt: history.importedAt,
        }
      : null,
    beforeUpload,
    dismissError: () => setError(null),
    onCancel,
  };
};
