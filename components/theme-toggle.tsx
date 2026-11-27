'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

const subscribeNever = () => () => {};

export function ThemeToggle() {
  // false on the server and while hydrating, true after: the theme is only known in the browser
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const { setTheme, resolvedTheme } = useTheme();

  if (!mounted) {
    return (
      <button className="relative h-9 w-9 rounded-lg p-0">
        <Sun className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-200" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}
      className="relative h-9 w-9 rounded-lg p-0 transition-all duration-300 hover:scale-110 hover:bg-gray-300 dark:hover:bg-gray-600"
    >
      <Sun className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 scale-100 rotate-0 text-gray-700 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 scale-0 rotate-90 text-gray-200 transition-all dark:scale-100 dark:rotate-0" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
