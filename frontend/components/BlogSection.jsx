'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Tag, ArrowRight, X, Share2, Search, Sparkles } from 'lucide-react';
import { fetchAllBlogs } from '../lib/adminApi';

const FASHION_BLOG_PILLARS = [
  'All',
  'Lowers',
  'Shirts',
  'T-Shirts',
  'Jackets',
  'Shoes',
  'Glasses'
];

export default function BlogSection() {
  const [blogs, setBlogs] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticle, setActiveArticle] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const data = await fetchAllBlogs();
        if (data && Array.isArray(data) && data.length > 0) {
          setBlogs(data);
        }
      } catch (err) {
        console.warn('Could not load blogs from API:', err);
      }
    }
    loadBlogs();
  }, []);

  const filteredBlogs = blogs.filter(b => {
    if (selectedCategory !== 'All' && b.category?.toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return b.title?.toLowerCase().includes(q) || b.excerpt?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="street-journal" className="py-20 border-t border-neutral-200 dark:border-forest-800/80 bg-neutral-50/50 dark:bg-void-950 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-forest-800/60">
          <div>
            <div className="inline-flex items-center gap-2 text-neutral-900 dark:text-emerald-400 text-xs font-mono uppercase tracking-widest mb-2 font-bold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>THE STREET JOURNAL // EDITORIAL</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase text-neutral-950 dark:text-white tracking-tight">
              STYLE GUIDES &amp; FIT BREAKDOWNS
            </h2>
            <p className="text-xs md:text-sm text-neutral-600 dark:text-emerald-100/60 mt-2 max-w-xl leading-relaxed">
              Curated breakdowns matching our 6 core sections: Lowers &amp; Denims, Boxy Shirts, Drop-Shoulder Tees, Leather &amp; Denim Jackets, Bulky Footwear, and Architectural Eyewear.
            </p>
          </div>

          <div className="relative min-w-[260px] font-mono">
            <Search className="w-4 h-4 text-neutral-400 dark:text-emerald-400/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search essays, fits, fabrics..."
              className="w-full bg-white dark:bg-forest-900/90 border border-neutral-200 dark:border-forest-700/60 pl-9 pr-3 py-2.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-emerald-400/40 focus:outline-none focus:border-neutral-900 dark:focus:border-emerald-400 shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills matching the 6 sections */}
        <div className="flex flex-wrap gap-2 py-6 font-mono text-xs border-b border-neutral-200/60 dark:border-forest-800/50">
          {FASHION_BLOG_PILLARS.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 uppercase transition-all shadow-sm ${
                  isSelected
                    ? 'bg-neutral-950 text-white dark:bg-emerald-400 dark:text-black dark:border-emerald-300 font-bold dark:shadow-[0_0_12px_rgba(0,255,136,0.25)]'
                    : 'bg-white dark:bg-forest-900/80 border border-neutral-200 dark:border-forest-700/60 text-neutral-600 dark:text-emerald-200/70 hover:text-black dark:hover:text-white hover:border-neutral-400 dark:hover:border-emerald-400'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-8">
          {filteredBlogs.map((article) => (
            <article
              key={article.id}
              onClick={() => setActiveArticle(article)}
              className="group cursor-pointer bg-white dark:bg-void-900/90 border border-neutral-200/80 dark:border-forest-700/60 hover:border-neutral-900 dark:hover:border-emerald-400/80 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 dark:hover:shadow-[0_0_20px_rgba(0,255,136,0.12)]"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100 dark:bg-forest-950">
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 bg-neutral-950/85 text-white dark:bg-black/85 dark:text-emerald-300 text-[10px] font-mono uppercase px-2.5 py-1 font-bold backdrop-blur-md shadow-sm border border-transparent dark:border-emerald-500/30">
                    {article.category}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-center gap-3 text-[10px] font-mono text-neutral-500 dark:text-emerald-200/60 mb-2">
                    <span>{article.read_time}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>

                  <h3 className="font-bold text-base text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-emerald-300 transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-neutral-600 dark:text-emerald-100/60 font-sans mt-2.5 line-clamp-3 leading-relaxed">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center justify-between border-t border-neutral-100 dark:border-forest-800/80 mt-4 text-xs font-mono text-neutral-500 dark:text-emerald-200/60 group-hover:text-neutral-900 dark:group-hover:text-emerald-300">
                <span className="text-[10px] uppercase font-bold tracking-wider">Read Full Article</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 group-hover:text-neutral-950 dark:group-hover:text-emerald-400 transition-all" />
              </div>
            </article>
          ))}
        </div>

        {filteredBlogs.length === 0 && (
          <div className="p-16 text-center text-neutral-500 dark:text-zinc-500 font-mono text-xs">
            No essays found for "{selectedCategory}". Add new essays using the Admin Panel.
          </div>
        )}
      </div>

      {/* READING MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 dark:bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-forest-950 border border-neutral-300 dark:border-forest-700/80 p-6 md:p-10 my-auto shadow-2xl">
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 p-2 bg-neutral-100 dark:bg-forest-900 border border-neutral-200 dark:border-forest-700/60 hover:border-neutral-400 dark:hover:border-emerald-400 text-neutral-600 dark:text-emerald-200/70 hover:text-black dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-xs">
              <span className="bg-neutral-950 text-white dark:bg-emerald-400 dark:text-black font-bold px-2 py-0.5 uppercase text-[10px]">
                {activeArticle.category}
              </span>
              <span className="text-neutral-500 dark:text-emerald-200/60">{activeArticle.date}</span>
              <span className="text-neutral-400 dark:text-emerald-400/40">•</span>
              <span className="text-neutral-500 dark:text-emerald-200/60">{activeArticle.read_time}</span>
              <span className="text-neutral-400 dark:text-emerald-400/40">•</span>
              <span className="text-neutral-500 dark:text-emerald-200/60">By {activeArticle.author}</span>
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-neutral-950 dark:text-white uppercase tracking-tight leading-tight mb-6">
              {activeArticle.title}
            </h1>

            <div className="relative aspect-[16/9] w-full overflow-hidden mb-8 bg-neutral-100 dark:bg-forest-900">
              <img
                src={activeArticle.cover_image}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="prose dark:prose-invert max-w-none text-sm text-neutral-800 dark:text-emerald-50/90 leading-relaxed font-sans space-y-4 whitespace-pre-line">
              {activeArticle.content}
            </div>

            {/* Footer with tags and share */}
            <div className="mt-10 pt-6 border-t border-neutral-200 dark:border-forest-800/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex flex-wrap gap-1.5">
                {activeArticle.tags?.map((t) => (
                  <span
                    key={t}
                    className="bg-neutral-100 dark:bg-forest-900 border border-neutral-200 dark:border-forest-700/60 px-2 py-0.5 text-neutral-600 dark:text-emerald-300 text-[10px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 dark:bg-forest-900 border border-neutral-200 dark:border-forest-700/60 hover:border-neutral-950 dark:hover:border-emerald-400 text-neutral-900 dark:text-white transition-all text-[11px]"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copied ? 'Link Copied!' : 'Share Article'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
