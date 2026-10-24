'use client';

import React, { useState } from 'react';
import { Heart, ExternalLink, Box, Share2, Sparkles } from 'lucide-react';

export default function ProductCard({ product, onSelectVibe, onPreview3D }) {
  const [likes, setLikes] = useState(product.likes || 120);
  const [hasLiked, setHasLiked] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleLike = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasLiked) {
      setLikes(likes + 1);
      setHasLiked(true);
    } else {
      setLikes(likes - 1);
      setHasLiked(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard?.writeText(product.affiliate_link || window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Distinct multi-color drop status badges
  const getDropTagBadge = (status) => {
    const s = status?.toUpperCase() || 'ESSENTIAL';
    if (s === 'HOT DROP') {
      return 'bg-neutral-900 text-white dark:bg-emerald-400 dark:text-black dark:border-emerald-300';
    }
    if (s === 'LIMITED') {
      return 'bg-amber-100 text-amber-900 dark:bg-orange-500 dark:text-black dark:border-orange-400';
    }
    if (s === 'BESTSELLER') {
      return 'bg-blue-100 text-blue-900 dark:bg-cyan-400 dark:text-black dark:border-cyan-300';
    }
    if (s === 'GRAIL DROP') {
      return 'bg-purple-100 text-purple-900 dark:bg-purple-500 dark:text-white dark:border-purple-400';
    }
    return 'bg-neutral-100 text-neutral-800 dark:bg-lime-400 dark:text-black dark:border-lime-300';
  };

  // Category specific accent colors in dark mode
  const getCategoryColor = (mainCat) => {
    switch (mainCat?.toLowerCase()) {
      case 'lowers':
        return 'text-emerald-700 dark:text-emerald-400';
      case 'shirts':
        return 'text-sky-700 dark:text-cyan-400';
      case 't-shirts':
        return 'text-lime-700 dark:text-lime-400';
      case 'jackets':
        return 'text-orange-700 dark:text-orange-400';
      case 'shoes':
        return 'text-teal-700 dark:text-emerald-300';
      case 'glasses':
        return 'text-purple-700 dark:text-purple-400';
      default:
        return 'text-neutral-600 dark:text-emerald-400';
    }
  };

  return (
    <article className="group relative bg-white dark:bg-void-900/90 border border-neutral-200/90 dark:border-forest-700/60 rounded-none flex flex-col justify-between transition-all duration-300 hover:shadow-lg dark:hover:border-emerald-400/70 dark:hover:shadow-[0_0_20px_rgba(0,255,136,0.12)] hover:-translate-y-1">
      {/* Top Media Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100 dark:bg-forest-950">
        {/* Product Image */}
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          loading="lazy"
        />

        {/* Top Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
          {/* Drop Status Tag */}
          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border rounded-none shadow-sm ${getDropTagBadge(product.drop_status)}`}>
            {product.drop_status || 'COLLECTION'}
          </span>

          {/* 3D Available Badge */}
          {product.model_3d_url && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPreview3D?.(product);
              }}
              className="pointer-events-auto flex items-center gap-1.5 bg-white/90 dark:bg-forest-900/90 text-neutral-900 dark:text-emerald-300 border border-neutral-300 dark:border-emerald-500/30 hover:bg-neutral-950 hover:text-white dark:hover:bg-emerald-400 dark:hover:text-black px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider backdrop-blur-md transition-all shadow-sm"
              title="Inspect in 3D WebGL Canvas"
            >
              <Box className="w-3 h-3 text-neutral-900 dark:text-emerald-400 group-hover:text-current" />
              <span>3D ROTATE</span>
            </button>
          )}
        </div>

        {/* Social Action Overlay (Heart & Share) */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleLike}
            className={`p-2 backdrop-blur-md transition-all shadow-sm ${
              hasLiked
                ? 'bg-rose-500 text-white scale-105'
                : 'bg-white/90 dark:bg-forest-900/80 text-neutral-700 dark:text-emerald-200 border border-neutral-200 dark:border-forest-700/50 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-300'
            }`}
            title="Like piece"
          >
            <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-white' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 dark:bg-forest-900/80 text-neutral-700 dark:text-emerald-200 border border-neutral-200 dark:border-forest-700/50 hover:text-black dark:hover:text-white backdrop-blur-md transition-all shadow-sm"
            title="Share or copy link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share Copied Notification */}
        {copiedLink && (
          <div className="absolute inset-0 bg-neutral-950/90 dark:bg-forest-950/95 backdrop-blur-sm flex items-center justify-center text-white dark:text-emerald-300 text-xs font-mono font-bold uppercase tracking-widest z-20">
            LINK COPIED TO CLIPBOARD
          </div>
        )}
      </div>

      {/* Card Content & Details */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white dark:bg-void-900">
        <div>
          {/* Brand & Category Breadcrumb */}
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-2">
            <span className="font-bold text-neutral-900 dark:text-emerald-200 bg-neutral-100 dark:bg-forest-800/80 px-2 py-0.5 border border-neutral-200 dark:border-forest-700/50">
              {product.brand}
            </span>
            <span className={`font-semibold ${getCategoryColor(product.main_category)}`}>
              {product.sub_category || product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-sans font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-emerald-300 transition-colors">
            {product.name}
          </h3>

          {/* Description snippet */}
          {product.description && (
            <p className="text-[11px] text-neutral-500 dark:text-emerald-100/60 font-sans line-clamp-2 mt-1 leading-snug">
              {product.description}
            </p>
          )}

          {/* Vibe Tags Pills */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {product.vibe_tags?.slice(0, 3).map((vibe, idx) => {
              const borderHover = [
                'hover:border-emerald-400 hover:text-emerald-400',
                'hover:border-cyan-400 hover:text-cyan-400',
                'hover:border-orange-400 hover:text-orange-400',
                'hover:border-purple-400 hover:text-purple-400'
              ][idx % 4];

              return (
                <button
                  key={vibe}
                  onClick={() => onSelectVibe?.(vibe)}
                  className={`text-[9px] font-mono uppercase bg-neutral-100 dark:bg-forest-900 border border-neutral-200 dark:border-forest-700/60 text-neutral-600 dark:text-emerald-200/70 px-1.5 py-0.5 hover:border-neutral-900 hover:text-neutral-900 dark:${borderHover} transition-colors`}
                >
                  #{vibe}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Price & Actionable Affiliate Redirect */}
        <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-forest-800/80">
          <div className="flex items-baseline justify-between mb-3 font-mono">
            <div>
              <span className="text-lg font-bold text-neutral-950 dark:text-emerald-300">
                ${product.price?.toFixed(2)}
              </span>
              <span className="text-[10px] text-neutral-400 dark:text-emerald-200/40 line-through ml-2">
                ${(product.price * 1.25).toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 dark:text-emerald-200/50 flex items-center gap-1 font-sans">
              <Heart className="w-3 h-3 text-neutral-400 fill-neutral-400 dark:text-emerald-400/60 dark:fill-emerald-400/60" />
              <span>{likes}</span>
            </div>
          </div>

          {/* Actionable Button: "Cop this look" */}
          <a
            href={product.affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-neutral-950 text-white dark:bg-emerald-400 dark:text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-neutral-800 dark:hover:bg-emerald-300 dark:hover:shadow-[0_0_15px_rgba(0,255,136,0.35)] transition-all duration-200 shadow-sm"
          >
            <span>COP THIS LOOK</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
