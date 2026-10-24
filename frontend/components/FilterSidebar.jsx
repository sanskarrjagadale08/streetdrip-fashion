'use client';

import React from 'react';
import { Filter, SlidersHorizontal, Flame, Tag, Check, RefreshCw } from 'lucide-react';

export default function FilterSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  brands,
  selectedBrand,
  onSelectBrand,
  selectedVibe,
  onSelectVibe,
  priceRange,
  onPriceChange,
  onResetFilters,
  totalResults
}) {
  const streetwearVibes = [
    "All",
    "Late night drive",
    "College fest",
    "Chill weekend",
    "Cyberpunk rave",
    "Tokyo Drip",
    "Skater Grunge"
  ];

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 bg-void-950 brutalist-border p-5 font-mono text-xs select-none">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-neon-lime" />
          <span className="font-bold text-sm tracking-wider uppercase text-white">
            FILTER VAULT
          </span>
        </div>
        <span className="text-[10px] bg-white/10 px-2 py-0.5 text-zinc-300">
          [{totalResults} ITEMS]
        </span>
      </div>

      {/* BRAND DROP CULTURE SELECTOR */}
      <div className="mb-7">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-neon-lime font-bold uppercase tracking-wider text-[11px]">
            <Flame className="w-3.5 h-3.5 fill-neon-lime text-neon-lime" />
            <span>DROP CULTURE // BRANDS</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 mb-2 leading-relaxed">
          Filter strictly by curated heavy streetwear labels:
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {brands.map((b) => {
            const isSelected = selectedBrand.toLowerCase() === b.name.toLowerCase();
            return (
              <button
                key={b.name}
                onClick={() => onSelectBrand(isSelected ? 'All' : b.name)}
                className={`flex items-center justify-between px-2.5 py-2 border transition-all text-left ${
                  isSelected
                    ? 'bg-neon-lime text-black border-neon-lime font-bold shadow-md'
                    : 'bg-void-900 border-white/10 text-zinc-300 hover:border-white/30 hover:text-white'
                }`}
              >
                <div className="truncate">
                  <div className="font-bold uppercase text-[11px] truncate">{b.name}</div>
                  <div className={`text-[9px] uppercase tracking-tighter ${isSelected ? 'text-black/80' : 'text-zinc-400'}`}>
                    {b.badge}
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* DYNAMIC CATEGORIES */}
      <div className="mb-7">
        <div className="flex items-center gap-1.5 text-white font-bold uppercase tracking-wider text-[11px] mb-3">
          <Tag className="w-3.5 h-3.5 text-neon-cyan" />
          <span>STREET STAPLES // CATEGORIES</span>
        </div>
        <div className="flex flex-col gap-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
            return (
              <button
                key={cat.name}
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center justify-between px-3 py-2 border text-left transition-all ${
                  isSelected
                    ? 'bg-white/10 border-l-4 border-l-neon-lime border-white/20 text-white font-bold'
                    : 'border-transparent text-zinc-400 hover:text-white hover:bg-void-900'
                }`}
              >
                <span className="uppercase text-[11px]">{cat.name}</span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  ({cat.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STREETWEAR AESTHETIC VIBE TAGS */}
      <div className="mb-7">
        <div className="flex items-center gap-1.5 text-white font-bold uppercase tracking-wider text-[11px] mb-3">
          <span className="text-neon-orange">#</span>
          <span>AESTHETIC VIBE TAGS</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {streetwearVibes.map((vibe) => {
            const isSelected = selectedVibe.toLowerCase() === vibe.toLowerCase();
            return (
              <button
                key={vibe}
                onClick={() => onSelectVibe(vibe)}
                className={`px-2.5 py-1 text-[10px] uppercase border transition-all ${
                  isSelected
                    ? 'bg-neon-orange text-black border-neon-orange font-bold'
                    : 'bg-void-900 border-white/10 text-zinc-400 hover:text-white hover:border-white/30'
                }`}
              >
                #{vibe}
              </button>
            );
          })}
        </div>
      </div>

      {/* PRICE RANGE SLIDER */}
      <div className="mb-7">
        <div className="flex items-center justify-between text-[11px] uppercase font-bold text-white mb-2">
          <span>MAX PRICE CAP</span>
          <span className="text-neon-lime font-mono">${priceRange}</span>
        </div>
        <input
          type="range"
          min="20"
          max="250"
          step="5"
          value={priceRange}
          onChange={(e) => onPriceChange(Number(e.target.value))}
          className="w-full accent-neon-lime bg-void-800 cursor-pointer h-1.5 rounded-none"
        />
        <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
          <span>$20 (Staples)</span>
          <span>$250 (High-Heat)</span>
        </div>
      </div>

      {/* RESET FILTERS BUTTON */}
      <button
        onClick={onResetFilters}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-void-900 border border-white/10 text-zinc-300 hover:text-neon-lime hover:border-neon-lime text-[11px] uppercase font-bold tracking-wider transition-all"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>RESET ALL FILTERS</span>
      </button>

      {/* Gen Z Drop Disclaimer */}
      <div className="mt-6 pt-4 border-t border-white/10 text-[9px] text-zinc-400 leading-tight">
        ⚡ ALL AFFILIATE REDIRECTS POINT DIRECTLY TO VERIFIED OFFICIAL BRAND VAULTS (NIKE, BEWAKOOF, ZARA, LEVI'S, CASIO).
      </div>
    </aside>
  );
}
