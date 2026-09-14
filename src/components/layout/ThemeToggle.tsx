'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  compact?: boolean;
}

export function ThemeToggle({ className, compact = false }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'group inline-flex items-center gap-3 rounded-full border border-border/70 bg-gradient-to-r from-white to-slate-50 px-2 py-2 text-sm text-foreground shadow-sm transition-all duration-200 hover:border-brand/40 hover:shadow-md dark:from-slate-950 dark:to-slate-900',
        compact ? 'w-full justify-between' : 'min-w-[132px] justify-between',
        className
      )}
      aria-label={mounted ? `Switch to ${isDark ? 'light' : 'dark'} mode` : 'Toggle color theme'}
      suppressHydrationWarning
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
            isDark
              ? 'bg-slate-900 text-amber-300 dark:bg-slate-800'
              : 'bg-amber-100 text-amber-700'
          )}
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </span>
        <span className="font-medium">
          {mounted ? (isDark ? 'Dark mode' : 'Light mode') : 'Theme'}
        </span>
      </span>

      <span
        className={cn(
          'relative flex h-7 w-12 items-center rounded-full border transition-colors duration-200',
          isDark
            ? 'border-slate-700 bg-slate-800'
            : 'border-amber-200 bg-amber-50'
        )}
      >
        <span
          className={cn(
            'absolute h-5 w-5 rounded-full shadow-sm transition-all duration-200',
            isDark
              ? 'translate-x-6 bg-amber-300'
              : 'translate-x-1 bg-white'
          )}
        />
      </span>
    </button>
  );
}