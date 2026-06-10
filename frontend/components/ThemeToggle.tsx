'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'light' | 'dark';

/**
 * Reads the theme already applied to <html> by the inline boot script
 * (see app/layout.tsx) so there is no flash, then lets the user toggle it.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.style.colorScheme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage unavailable — toggle still works for the session */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {/* Render nothing until mounted to avoid an icon mismatch on hydration. */}
      {theme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : theme === 'light' ? (
        <Moon className="h-4 w-4" />
      ) : (
        <span className="h-4 w-4" />
      )}
    </button>
  );
}
