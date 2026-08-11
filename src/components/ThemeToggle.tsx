'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-9 h-9 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-50 transition-colors relative"
      aria-label="Toggle theme"
    >
      <Sun className="h-4 w-4 transition-all dark:-rotate-90 dark:opacity-0 absolute" />
      <Moon className="h-4 w-4 rotate-90 opacity-0 transition-all dark:rotate-0 dark:opacity-100 absolute" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
