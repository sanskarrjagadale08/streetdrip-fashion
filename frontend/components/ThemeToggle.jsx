'use client';

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

export default function ThemeToggle({ className = '', showLabel = false }) {
  // Light theme is the primary default
  const [theme, setTheme] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('streetdrip_theme');
      if (saved === 'dark') {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem('streetdrip_theme', next);
    } catch {}
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-full border border-neutral-300 dark:border-forest-700 flex items-center justify-center opacity-60 ${className}`}>
        <span className="w-4 h-4" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 shadow-sm active:scale-95 ${
        theme === 'dark'
          ? 'bg-void-900 border-emerald-500/40 text-emerald-400 hover:border-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)]'
          : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-900 hover:shadow-md'
      } ${className}`}
      title={`Current: ${theme.toUpperCase()} MODE. Click to switch to ${theme === 'dark' ? 'Light Editorial' : 'Cyber Forest Dark'}`}
      aria-label="Toggle Theme"
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun className="w-3.5 h-3.5 text-emerald-400 transition-transform duration-300 group-hover:rotate-45" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-neutral-800 transition-transform duration-300 group-hover:-rotate-12" />
        )}
      </div>
      {showLabel ? (
        <span className="text-[11px] font-mono uppercase tracking-wider font-semibold">
          {theme === 'dark' ? 'Dark Forest' : 'Light Mode'}
        </span>
      ) : (
        <span className="hidden sm:inline text-[10px] font-mono uppercase font-bold tracking-wider opacity-80 group-hover:opacity-100">
          {theme === 'dark' ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
