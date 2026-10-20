import { useEffect, useState } from 'react';

const query = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Tracks the OS light/dark preference (Electron forwards it to `prefers-color-scheme`). */
export const useSystemDark = (): boolean => {
  const [dark, setDark] = useState(() => query().matches);

  useEffect(() => {
    const mql = query();
    const onChange = (e: MediaQueryListEvent) => setDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return dark;
};
