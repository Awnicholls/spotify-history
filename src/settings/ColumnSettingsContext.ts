import { createContext, useContext } from 'react';

import type { StatCategory } from '../lib/aggregate';

/** Which stats-table columns the user has hidden, per table, and how to change that. */
export interface ColumnSettings {
  hidden: Partial<Record<StatCategory, string[]>>;
  setHidden: (category: StatCategory, keys: string[]) => void;
}

const NO_SETTINGS: ColumnSettings = { hidden: {}, setHidden: () => undefined };

export const ColumnSettingsContext = createContext<ColumnSettings>(NO_SETTINGS);

export const useColumnSettings = (): ColumnSettings => useContext(ColumnSettingsContext);
