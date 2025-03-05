'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { SunIcon, MoonIcon, ComputerIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevenir problemas de hidratação
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className={cn("flex items-center justify-center rounded-md bg-gray-100 p-1 dark:bg-gray-800", className)}>
      <button
        onClick={() => setTheme('light')}
        className={cn(
          "inline-flex items-center justify-center rounded-sm p-2 text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",
          theme === 'light' ? 'bg-white text-black shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'
        )}
        aria-label="Tema Claro"
      >
        <SunIcon className="h-5 w-5" />
      </button>
      
      <button
        onClick={() => setTheme('dark')}
        className={cn(
          "inline-flex items-center justify-center rounded-sm p-2 text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",
          theme === 'dark' ? 'bg-white text-black shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'
        )}
        aria-label="Tema Escuro"
      >
        <MoonIcon className="h-5 w-5" />
      </button>
      
      <button
        onClick={() => setTheme('system')}
        className={cn(
          "inline-flex items-center justify-center rounded-sm p-2 text-sm transition-colors hover:bg-gray-200 dark:hover:bg-gray-700",
          theme === 'system' ? 'bg-white text-black shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 dark:text-gray-400'
        )}
        aria-label="Tema do Sistema"
      >
        <ComputerIcon className="h-5 w-5" />
      </button>
    </div>
  );
} 