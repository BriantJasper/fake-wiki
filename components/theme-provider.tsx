'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

/* ============================================================================
   Three-mode theme: 'day' | 'night' | 'system'.

   The pre-hydration script in app/layout.tsx already sets data-theme on
   <html> synchronously to avoid FOUC. This provider just exposes the
   read/write API to the rest of the tree.
   ============================================================================ */

export type Theme = 'day' | 'night' | 'system';

const STORAGE_KEY = 'atlas-theme';

type Ctx = { theme: Theme; setTheme: (t: Theme) => void; cycle: () => void };

const ThemeContext = createContext<Ctx | null>(null);

function readStored(): Theme {
  if (typeof window === 'undefined') return 'system';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'day' || v === 'night' || v === 'system' ? v : 'system';
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');

  useEffect(() => {
    setThemeState(readStored());
  }, []);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode etc. */
    }
    apply(next);
  }, []);

  const cycle = useCallback(() => {
    setTheme(theme === 'day' ? 'night' : theme === 'night' ? 'system' : 'day');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycle }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) return { theme: 'system', setTheme: () => {}, cycle: () => {} };
  return ctx;
}

export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var t = localStorage.getItem('${STORAGE_KEY}');
    if (t === 'day' || t === 'night') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;
