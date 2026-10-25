'use client';

import React, { useState } from 'react';
import { BookOpen, Upload, CheckCircle, AlertCircle, Eye, Loader2, Sparkles, X, ArrowUpRight } from 'lucide-react';
import { createBlog, FASHION_HIERARCHY } from '../../lib/adminApi';
import BlogContentEditor from './BlogContentEditor';
import BlogContentRenderer from '../BlogContentRenderer';

const BLOG_CATEGORIES = Object.keys(FASHION_HIERARCHY);

export default function BlogUploadForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Lowers',
    read_time: '4 min',
    author: 'Fashion Editor',
    cover_image: '',
    excerpt: '',
    content: '',
    tags: 'Lowers, BaggyJeans, Proportions',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showFullModalPreview, setShowFullModalPreview] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (!formData.title || !formData.excerpt || !formData.content) {
        throw new Error('Title, excerpt, and content are required.');
      }

      const tagsArray = formData.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        read_time: formData.read_time.trim() || '4 min',
        author: formData.author.trim() || 'Fashion Editor',
        cover_image: formData.cover_image.trim() || 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1200&q=80',
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        tags: tagsArray.length > 0 ? tagsArray : ['StyleGuide']
      };

      const result = await createBlog(payload);
      setSuccessMsg(`Published! "${result.title}" added to ${result.category} section.`);

      setFormData({
        title: '',
        category: 'Lowers',
        read_time: '4 min',
        author: 'Fashion Editor',
        cover_image: '',
        excerpt: '',
        content: '',
        tags: 'Fashion, StyleGuide',
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish blog post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-mono text-xs">
      {/* FORM COLUMN */}
      <div className="lg:col-span-8 bg-void-950 border border-white/10 p-6 md:p-8">
        <div className="flex items-center gap-2 text-neon-lime text-xs font-bold uppercase mb-2">
          <BookOpen className="w-4 h-4" />
          <span>STREET JOURNAL // NEW ESSAY</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">
          WRITE NEW EDITORIAL BREAKDOWN
        </h2>
        <p className="text-xs text-zinc-400 font-sans mt-1 mb-6">
          Publish guides categorized under our 6 pillars: Lowers, Shirts, T-Shirts, Jackets, Shoes, or Glasses with luxury fonts, sizes, and styling.
        </p>

        {successMsg && (
          <div className="mb-4 p-3 bg-neon-lime/10 border border-neon-lime text-neon-lime text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Headline *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Lowers Architecture: Why Baggy, Korean Slacks and Cargos Took Over"
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1">Section *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime uppercase"
              >
                {BLOG_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1">Read Time</label>
              <input
                type="text"
                name="read_time"
                value={formData.read_time}
                onChange={handleChange}
                placeholder="4 min"
                className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
              />
            </div>
            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1">Author</label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                placeholder="Fashion Editor"
                className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Cover Image URL</label>
            <input
              type="url"
              name="cover_image"
              value={formData.cover_image}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
            />
          </div>

          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Short Excerpt *</label>
            <textarea
              name="excerpt"
              rows={2}
              required
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="A brief 2-sentence breakdown to show on cards and search results..."
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime font-sans text-xs"
            />
          </div>

          {/* RICH BLOG CONTENT EDITOR & STYLING SUITE */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-zinc-300 uppercase font-bold">
                Article Body &amp; Styling Suite *
              </label>
              <span className="text-[10px] text-neon-lime font-bold">
                ✨ Bold, Italic, Fonts, Headings, Colors &amp; Callouts
              </span>
            </div>
            <BlogContentEditor
              value={formData.content}
              onChange={(newContent) => setFormData(prev => ({ ...prev, content: newContent }))}
              placeholder="Craft your fashion breakdown here. Highlight text to apply luxury fonts, neon colors, fit advice callouts, or editorial blockquotes..."
            />
          </div>

          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Tags (Comma-Separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Lowers, Denim, Baggy, Korean, Streetwear"
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-neon-lime text-black font-black uppercase text-xs border border-neon-lime hover:bg-black hover:text-neon-lime transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{loading ? 'PUBLISHING ARTICLE...' : 'PUBLISH ESSAY TO STREET JOURNAL'}</span>
          </button>
        </form>
      </div>

      {/* PREVIEW SIDEBAR */}
      <div className="lg:col-span-4 bg-void-950 border border-white/10 p-6 sticky top-24 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-neon-cyan uppercase font-bold">
            <Eye className="w-4 h-4" />
            <span>STOREFRONT PREVIEW</span>
          </div>
          {formData.content && (
            <button
              type="button"
              onClick={() => setShowFullModalPreview(true)}
              className="text-[10px] text-neon-lime hover:underline flex items-center gap-1 uppercase font-bold"
            >
              <span>Full Article</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Card Component Preview */}
        <div className="bg-void-900 border border-white/10 p-4">
          <div className="relative aspect-[16/10] overflow-hidden bg-black mb-3">
            <img
              src={formData.cover_image || "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1200&q=80"}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2 left-2 bg-neon-lime text-black font-bold text-[9px] uppercase px-1.5 py-0.5">
              {formData.category}
            </span>
          </div>

          <div className="text-[10px] text-zinc-400 mb-1">
            {formData.read_time || '4 min'} • By {formData.author || 'Fashion Editor'}
          </div>

          <h4 className="font-bold text-sm text-white uppercase line-clamp-2">
            {formData.title || "Untitled Article"}
          </h4>

          <p className="text-xs text-zinc-400 font-sans mt-2 line-clamp-3">
            {formData.excerpt || "Excerpt preview will display here..."}
          </p>
        </div>

        {/* Styled Content Quick Look */}
        <div className="bg-void-900 border border-white/10 p-4">
          <div className="text-[10px] text-zinc-400 uppercase font-bold mb-2 pb-1 border-b border-white/10 flex items-center justify-between">
            <span>Styled Content Teaser</span>
            <span className="text-[9px] text-neon-lime">{formData.content ? 'Formatted' : 'Empty'}</span>
          </div>
          {formData.content ? (
            <div className="max-h-56 overflow-y-auto pr-1">
              <BlogContentRenderer content={formData.content} />
            </div>
          ) : (
            <div className="py-4 text-center text-zinc-500 font-sans text-xs">
              Styled headings, quotes, badges, and fonts will show live here as you write.
            </div>
          )}
        </div>
      </div>

      {/* FULL SCREEN MODAL PREVIEW */}
      {showFullModalPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-void-950 border border-neon-lime/80 p-6 md:p-10 my-auto shadow-2xl">
            <button
              onClick={() => setShowFullModalPreview(false)}
              className="absolute top-5 right-5 p-2 bg-void-900 border border-white/15 text-zinc-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3 text-[10px] text-zinc-400 font-mono">
              <span className="bg-neon-lime text-black font-bold px-2 py-0.5 uppercase">
                {formData.category}
              </span>
              <span>{formData.read_time || '4 min'}</span>
              <span>•</span>
              <span>By {formData.author || 'Fashion Editor'}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black uppercase text-white mb-4">
              {formData.title || 'Untitled Article'}
            </h1>

            {formData.cover_image && (
              <div className="relative aspect-[16/9] w-full overflow-hidden mb-6 bg-void-900 border border-white/10">
                <img
                  src={formData.cover_image}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-white/10">
              <BlogContentRenderer content={formData.content} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
