'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Palette, ChevronDown, Check, Sun, Moon, Sparkles } from 'lucide-react';

export const THEMES = [
  {
    id: 'creme',
    name: 'Atelier Creme',
    subtitle: 'Warm Ivory & Sand',
    mode: 'light',
    bg: '#FAF8F5',
    swatches: ['#EEE4DA', '#D8C4AC', '#4D0E13'],
    badge: 'Light Luxury'
  },
  {
    id: 'burgundy',
    name: 'Burgundy Noir',
    subtitle: 'Deep Velvet Wine',
    mode: 'dark',
    bg: '#160305',
    swatches: ['#4D0E13', '#C8A49F', '#EEE4DA'],
    badge: 'Dark Opulence'
  },
  {
    id: 'rose',
    name: 'Dusty Rose',
    subtitle: 'Boutique Obsidian',
    mode: 'dark',
    bg: '#1C1315',
    swatches: ['#C8A49F', '#380A0E', '#FAF5F4'],
    badge: 'Editorial Modern'
  },
  {
    id: 'playful',
    name: 'Playful Y2K 🍭',
    subtitle: 'Bubblegum & Acid Pop',
    mode: 'light',
    bg: '#FFF0F5',
    swatches: ['#FF4D8D', '#CCFF00', '#2B0938'],
    badge: 'Playful Fun ⚡'
  }
];

export default function ThemeToggle({ className = '', showLabel = false }) {
  const [currentTheme, setCurrentTheme] = useState('creme');
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('streetdrip_theme') || 'creme';
      applyTheme(saved);
    } catch {
      applyTheme('creme');
    }

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyTheme = (themeId) => {
    let target = themeId;
    if (target === 'light') target = 'creme';
    if (target === 'dark') target = 'burgundy';

    const themeObj = THEMES.find(t => t.id === target) || THEMES[0];
    setCurrentTheme(themeObj.id);

    try {
      localStorage.setItem('streetdrip_theme', themeObj.id);
    } catch {}

    const root = document.documentElement;
    root.setAttribute('data-theme', themeObj.id);

    if (themeObj.mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleSelectTheme = (themeId) => {
    applyTheme(themeId);
    setIsOpen(false);
  };

  // Quick cycle when clicking the button directly or opening modal
  const handleQuickToggle = () => {
    const currentIndex = THEMES.findIndex(t => t.id === currentTheme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    applyTheme(THEMES[nextIndex].id);
  };

  if (!mounted) {
    return (
      <div className={`w-9 h-9 rounded-full border border-sand-300 dark:border-burgundy-600 flex items-center justify-center opacity-60 ${className}`}>
        <span className="w-3.5 h-3.5 rounded-full bg-sand-300" />
      </div>
    );
  }

  const activeThemeObj = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  return (
    <div className={`relative inline-block text-left font-mono ${className}`} ref={dropdownRef}>
      <div className="flex items-center">
        {/* Main Theme Pill Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="group relative flex items-center gap-2 px-3 py-1.5 rounded-full border border-sand-300 dark:border-burgundy-500/80 bg-white/90 dark:bg-burgundy-900/90 text-burgundy-900 dark:text-creme-200 hover:border-burgundy-600 dark:hover:border-dusty-400 transition-all duration-300 shadow-sm active:scale-95 text-xs"
          title={`Active Palette: ${activeThemeObj.name}. Click to change theme.`}
          aria-label="Palette and Theme Selector"
        >
          {/* Swatch preview dots */}
          <div className="flex items-center -space-x-1">
            {activeThemeObj.swatches.map((color, idx) => (
              <span
                key={idx}
                className="w-2.5 h-2.5 rounded-full border border-white/60 dark:border-black/50 shadow-xs"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
            {activeThemeObj.name}
          </span>

          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 opacity-60 group-hover:opacity-100 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu for 4 Themes */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-24px)] rounded-sm bg-white dark:bg-burgundy-950 border border-sand-300 dark:border-burgundy-500 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 border-b border-sand-200 dark:border-burgundy-800/80 mb-2 flex items-center justify-between">
            <span className="text-xs text-burgundy-700 dark:text-sand-300 font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-dusty-400" />
              <span>COLLECTION PALETTES</span>
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">4 Themes</span>
          </div>

          <div className="space-y-1.5">
            {THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleSelectTheme(theme.id)}
                  className={`w-full text-left p-2.5 rounded-xs transition-all flex items-center justify-between group ${
                    isSelected
                      ? 'bg-creme-200 dark:bg-burgundy-800/80 border border-sand-300 dark:border-dusty-400/60 shadow-xs'
                      : 'hover:bg-sand-50 dark:hover:bg-burgundy-900/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Multi-swatch capsule */}
                    <div className="flex items-center -space-x-1 flex-shrink-0">
                      {theme.swatches.map((c, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-white dark:border-burgundy-950 shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <div>
                      <div className="text-sm font-bold text-burgundy-950 dark:text-creme-100 uppercase tracking-tight flex items-center gap-1.5">
                        <span>{theme.name}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-burgundy-600 dark:text-dusty-400 stroke-[3]" />
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-sand-400/80 font-sans">
                        {theme.subtitle}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded-xs font-bold tracking-wider ${
                    isSelected 
                      ? 'bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950' 
                      : 'bg-sand-100 text-burgundy-800 dark:bg-burgundy-900 dark:text-sand-300'
                  }`}>
                    {theme.badge}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-t border-sand-200 dark:border-burgundy-800/80 px-2 py-1 text-[10px] text-zinc-500 dark:text-sand-400/60 flex items-center justify-between font-sans">
            <span>Nomiki &amp; Y2K Pop Palettes</span>
            <button
              type="button"
              onClick={handleQuickToggle}
              className="text-burgundy-700 dark:text-dusty-400 hover:underline uppercase font-mono font-bold text-[10px]"
            >
              Next Theme ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
