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

  // Distinct Nomiki Pinterest Palette Badges
  const getDropTagBadge = (status) => {
    const s = status?.toUpperCase() || 'COLLECTION';
    if (s === 'HOT DROP') {
      return 'bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 border-burgundy-700 dark:border-dusty-300 font-bold';
    }
    if (s === 'LIMITED') {
      return 'bg-sand-300 text-burgundy-950 dark:bg-sand-400 dark:text-burgundy-950 border-sand-400 dark:border-sand-300 font-bold';
    }
    if (s === 'BESTSELLER') {
      return 'bg-creme-200 text-burgundy-950 dark:bg-burgundy-700 dark:text-creme-100 border-sand-300 dark:border-burgundy-500 font-bold';
    }
    if (s === 'GRAIL DROP') {
      return 'bg-dusty-400 text-white dark:bg-dusty-500 dark:text-creme-100 border-dusty-500 dark:border-dusty-400 font-bold';
    }
    return 'bg-creme-100 text-burgundy-900 dark:bg-burgundy-800 dark:text-sand-200 border-sand-200 dark:border-burgundy-700 font-bold';
  };

  // Nomiki Category specific subtle accent colors
  const getCategoryColor = (mainCat) => {
    switch (mainCat?.toLowerCase()) {
      case 'lowers':
        return 'text-burgundy-700 dark:text-dusty-300';
      case 'shirts':
        return 'text-sand-700 dark:text-sand-300';
      case 't-shirts':
        return 'text-dusty-700 dark:text-dusty-300';
      case 'jackets':
        return 'text-burgundy-600 dark:text-creme-200';
      case 'shoes':
        return 'text-sand-700 dark:text-sand-200';
      case 'glasses':
        return 'text-dusty-600 dark:text-dusty-200';
      default:
        return 'text-burgundy-800 dark:text-dusty-400';
    }
  };

  return (
    <article className="group relative bg-white dark:bg-burgundy-900/90 border border-sand-300/80 dark:border-burgundy-800 rounded-none flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-burgundy-600 dark:hover:border-dusty-400 dark:hover:shadow-[0_0_20px_rgba(200,164,159,0.18)] hover:-translate-y-1">
      {/* Top Media Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-creme-100 dark:bg-burgundy-950">
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
          <span className={`px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider border rounded-none shadow-sm ${getDropTagBadge(product.drop_status)}`}>
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
              className="pointer-events-auto flex items-center gap-1.5 bg-white/95 dark:bg-burgundy-950/90 text-burgundy-950 dark:text-sand-200 border border-sand-300 dark:border-burgundy-700 hover:bg-burgundy-600 hover:text-creme-100 dark:hover:bg-dusty-400 dark:hover:text-burgundy-950 px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider backdrop-blur-md transition-all shadow-sm"
              title="Inspect in 3D WebGL Canvas"
            >
              <Box className="w-3 h-3 text-burgundy-700 dark:text-dusty-400 group-hover:text-current" />
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
                ? 'bg-burgundy-600 text-creme-100 scale-105'
                : 'bg-white/90 dark:bg-burgundy-950/80 text-burgundy-800 dark:text-sand-200 border border-sand-200 dark:border-burgundy-700/60 hover:text-burgundy-600 dark:hover:text-dusty-400 hover:border-burgundy-300'
            }`}
            title="Like piece"
          >
            <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 bg-white/90 dark:bg-burgundy-950/80 text-burgundy-800 dark:text-sand-200 border border-sand-200 dark:border-burgundy-700/60 hover:text-burgundy-950 dark:hover:text-creme-100 backdrop-blur-md transition-all shadow-sm"
            title="Share or copy link"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Share Copied Notification */}
        {copiedLink && (
          <div className="absolute inset-0 bg-burgundy-950/95 backdrop-blur-sm flex items-center justify-center text-creme-100 text-xs font-mono font-bold uppercase tracking-widest z-20">
            LINK COPIED TO CLIPBOARD
          </div>
        )}
      </div>

      {/* Card Content & Details */}
      <div className="p-4 flex flex-col flex-1 justify-between bg-white dark:bg-burgundy-900/90">
        <div>
          {/* Brand & Category Breadcrumb */}
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider mb-2">
            <span className="font-bold text-burgundy-950 dark:text-creme-100 bg-creme-100 dark:bg-burgundy-950/90 px-2 py-0.5 border border-sand-200 dark:border-burgundy-800">
              {product.brand}
            </span>
            <span className={`font-semibold ${getCategoryColor(product.main_category)}`}>
              {product.sub_category || product.category}
            </span>
          </div>

          {/* Product Name */}
          <h3 className="font-sans font-semibold text-sm text-burgundy-950 dark:text-creme-100 line-clamp-1 group-hover:text-burgundy-700 dark:group-hover:text-dusty-300 transition-colors">
            {product.name}
          </h3>

          {/* Description snippet */}
          {product.description && (
            <p className="text-[11px] text-burgundy-900/70 dark:text-sand-300/70 font-sans line-clamp-2 mt-1 leading-snug">
              {product.description}
            </p>
          )}

          {/* Vibe Tags Pills */}
          <div className="flex flex-wrap gap-1 mt-2.5">
            {product.vibe_tags?.slice(0, 3).map((vibe) => (
              <button
                key={vibe}
                onClick={() => onSelectVibe?.(vibe)}
                className="text-[9px] font-mono uppercase bg-creme-100/80 dark:bg-burgundy-950/80 border border-sand-200 dark:border-burgundy-800 text-burgundy-800 dark:text-sand-300 px-1.5 py-0.5 hover:border-burgundy-600 dark:hover:border-dusty-400 hover:text-burgundy-950 dark:hover:text-creme-100 transition-colors"
              >
                #{vibe}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Price & Actionable Affiliate Redirect */}
        <div className="mt-4 pt-3 border-t border-sand-200/80 dark:border-burgundy-800/80">
          <div className="flex items-baseline justify-between mb-3 font-mono">
            <div>
              <span className="text-lg font-bold text-burgundy-950 dark:text-creme-100">
                ${product.price?.toFixed(2)}
              </span>
              <span className="text-[10px] text-sand-500 dark:text-sand-400/60 line-through ml-2">
                ${(product.price * 1.25).toFixed(2)}
              </span>
            </div>
            <div className="text-[10px] text-sand-600 dark:text-sand-400/60 flex items-center gap-1 font-sans">
              <Heart className="w-3 h-3 text-burgundy-400 fill-current dark:text-dusty-400" />
              <span>{likes}</span>
            </div>
          </div>

          {/* Actionable Button: "Cop this look" */}
          <a
            href={product.affiliate_link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-burgundy-600 text-creme-100 hover:bg-burgundy-700 dark:bg-dusty-400 dark:text-burgundy-950 dark:hover:bg-dusty-300 font-mono font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-sm border border-burgundy-600 dark:border-dusty-400"
          >
            <span>COP THIS LOOK</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}
