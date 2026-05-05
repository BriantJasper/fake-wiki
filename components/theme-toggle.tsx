'use client';

import { useTheme } from './theme-provider';

const Sun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const Moon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const Auto = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 3v18" />
    <path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" />
  </svg>
);

export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  const label = theme === 'day' ? 'Day' : theme === 'night' ? 'Night' : 'Auto';
  return (
    <button
      type="button"
      onClick={cycle}
      className="theme-toggle"
      aria-label={`Theme: ${label}. Click to cycle.`}
      title={`Theme: ${label}`}
    >
      {theme === 'day' ? <Sun /> : theme === 'night' ? <Moon /> : <Auto />}
      <span>{label}</span>
    </button>
  );
}
