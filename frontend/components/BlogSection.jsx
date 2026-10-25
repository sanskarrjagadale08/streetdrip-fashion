'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Clock, Tag, ArrowRight, X, Share2, Search, Sparkles } from 'lucide-react';
import { fetchAllBlogs } from '../lib/adminApi';
import BlogContentRenderer from './BlogContentRenderer';

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
        if (data && Array.isArray(data)) {
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
    <section id="street-journal" className="py-20 border-t border-sand-300/80 dark:border-burgundy-800/80 bg-creme-50/50 dark:bg-burgundy-950/80 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-sand-300/80 dark:border-burgundy-800/60">
          <div>
            <div className="inline-flex items-center gap-2 text-burgundy-700 dark:text-dusty-400 text-xs md:text-sm font-mono uppercase tracking-widest mb-2 font-bold">
              <BookOpen className="w-4 h-4" />
              <span>THE STREET JOURNAL // EDITORIAL</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-medium italic text-burgundy-950 dark:text-creme-100 tracking-tight">
              Style Guides &amp; Fit Breakdowns
            </h2>
            <p className="text-sm md:text-base text-burgundy-900/70 dark:text-sand-300/70 mt-2.5 max-w-xl leading-relaxed font-light">
              Curated breakdowns matching our 6 core sections: Lowers &amp; Denims, Boxy Shirts, Drop-Shoulder Tees, Leather &amp; Denim Jackets, Bulky Footwear, and Architectural Eyewear.
            </p>
          </div>

          <div className="relative min-w-[280px] font-mono">
            <Search className="w-4 h-4 text-sand-500 dark:text-dusty-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search essays, fits, fabrics..."
              className="w-full bg-white dark:bg-burgundy-900/90 border border-sand-300 dark:border-burgundy-800 pl-10 pr-4 py-2.5 text-sm text-burgundy-950 dark:text-creme-100 placeholder-sand-500 dark:placeholder-sand-400/50 focus:outline-none focus:border-burgundy-600 dark:focus:border-dusty-400 shadow-sm"
            />
          </div>
        </div>

        {/* Category Pills matching the 6 sections */}
        <div className="flex flex-wrap gap-2.5 py-6 font-mono text-xs md:text-sm border-b border-sand-200/80 dark:border-burgundy-800/50">
          {FASHION_BLOG_PILLARS.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 uppercase font-bold transition-all shadow-sm ${
                  isSelected
                    ? 'bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 dark:border-dusty-300 font-bold dark:shadow-[0_0_12px_rgba(200,164,159,0.25)]'
                    : 'bg-white dark:bg-burgundy-900/80 border border-sand-300 dark:border-burgundy-800 text-burgundy-900/80 dark:text-sand-300/80 hover:text-burgundy-950 dark:hover:text-creme-100 hover:border-burgundy-500 dark:hover:border-dusty-400'
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
              className="group cursor-pointer bg-white dark:bg-burgundy-900/90 border border-sand-300/80 dark:border-burgundy-800/70 hover:border-burgundy-600 dark:hover:border-dusty-400/80 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 dark:hover:shadow-[0_0_20px_rgba(200,164,159,0.15)]"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-creme-100 dark:bg-burgundy-950">
                  <img
                    src={article.cover_image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 bg-burgundy-950/85 text-creme-100 dark:bg-burgundy-950/90 dark:text-dusty-300 text-xs font-mono uppercase px-3 py-1 font-bold backdrop-blur-md shadow-sm border border-sand-300/20">
                    {article.category}
                  </span>
                </div>

                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-3 text-xs font-mono text-sand-700 dark:text-dusty-300/80 mb-2 font-medium">
                    <span>{article.read_time}</span>
                    <span>•</span>
                    <span>{article.date}</span>
                  </div>

                  <h3 className="font-serif font-bold text-xl md:text-2xl text-burgundy-950 dark:text-creme-100 group-hover:text-burgundy-600 dark:group-hover:text-dusty-300 transition-colors leading-snug line-clamp-2">
                    {article.title}
                  </h3>

                  <p className="text-xs md:text-sm text-burgundy-900/80 dark:text-sand-300/80 font-sans mt-3 line-clamp-3 leading-relaxed font-light">
                    {article.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-5 md:p-6 pt-0 flex items-center justify-between border-t border-sand-200/60 dark:border-burgundy-800/80 mt-4 text-xs md:text-sm font-mono text-sand-600 dark:text-dusty-400 group-hover:text-burgundy-950 dark:group-hover:text-dusty-300">
                <span className="text-xs uppercase font-bold tracking-wider">Read Full Article</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-burgundy-700 dark:group-hover:text-dusty-300 transition-all" />
              </div>
            </article>
          ))}
        </div>

        {filteredBlogs.length === 0 && (
          <div className="p-12 md:p-16 text-center bg-white dark:bg-burgundy-900/40 border border-sand-300 dark:border-burgundy-800 font-mono shadow-sm my-6">
            <h3 className="text-xl font-bold uppercase text-burgundy-950 dark:text-creme-100 mb-2.5">
              JOURNAL ARCHIVE READY
            </h3>
            <p className="text-sm text-burgundy-800/80 dark:text-sand-300 mb-6 max-w-md mx-auto">
              No essays published yet. Write and publish your first editorial drops directly from the Admin Panel.
            </p>
            <a
              href="/admin"
              className="inline-block px-5 py-2.5 bg-burgundy-600 text-creme-100 hover:bg-burgundy-700 dark:bg-dusty-400 dark:text-burgundy-950 font-bold text-sm uppercase shadow-sm"
            >
              Open Admin to Write Essay
            </a>
          </div>
        )}
      </div>

      {/* READING MODAL */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 dark:bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-burgundy-950 border border-sand-300 dark:border-burgundy-600 p-5 sm:p-8 md:p-10 my-auto shadow-2xl">
            <button
              onClick={() => setActiveArticle(null)}
              className="absolute top-5 right-5 p-2 bg-creme-100 dark:bg-burgundy-900 border border-sand-300 dark:border-burgundy-700 hover:border-burgundy-600 dark:hover:border-dusty-400 text-burgundy-900 dark:text-creme-200 hover:text-black dark:hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-wrap items-center gap-2 mb-4 font-mono text-xs">
              <span className="bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 font-bold px-2 py-0.5 uppercase text-[10px]">
                {activeArticle.category}
              </span>
              <span className="text-sand-700 dark:text-dusty-300/80">{activeArticle.date}</span>
              <span className="text-sand-400 dark:text-burgundy-700">•</span>
              <span className="text-sand-700 dark:text-dusty-300/80">{activeArticle.read_time}</span>
              <span className="text-sand-400 dark:text-burgundy-700">•</span>
              <span className="text-sand-700 dark:text-dusty-300/80">By {activeArticle.author}</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-medium text-burgundy-950 dark:text-creme-100 tracking-tight leading-tight mb-6">
              {activeArticle.title}
            </h1>

            <div className="relative aspect-[16/9] w-full overflow-hidden mb-8 bg-creme-100 dark:bg-burgundy-900">
              <img
                src={article.cover_image || activeArticle.cover_image}
                alt={activeArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="prose dark:prose-invert max-w-none">
              <BlogContentRenderer content={activeArticle.content} />
            </div>

            {/* Footer with tags and share */}
            <div className="mt-10 pt-6 border-t border-sand-200 dark:border-burgundy-800/80 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex flex-wrap gap-1.5">
                {activeArticle.tags?.map((t) => (
                  <span
                    key={t}
                    className="bg-creme-100 dark:bg-burgundy-900 border border-sand-200 dark:border-burgundy-700 px-2 py-0.5 text-burgundy-800 dark:text-dusty-300 text-[10px]"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-3 py-1.5 bg-creme-100 dark:bg-burgundy-900 border border-sand-300 dark:border-burgundy-700 hover:border-burgundy-600 dark:hover:border-dusty-400 text-burgundy-950 dark:text-creme-100 transition-all text-[11px]"
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
