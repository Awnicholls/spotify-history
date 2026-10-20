import type { JSX } from 'react';

import { AppView } from './App.view';
import { useApp } from './useApp';

/**
 * App root: loads saved config + history, applies the antd theme from settings, and switches
 * between the setup, import, stats and settings pages.
 */
export const AppContainer = (): JSX.Element => <AppView {...useApp()} />;
