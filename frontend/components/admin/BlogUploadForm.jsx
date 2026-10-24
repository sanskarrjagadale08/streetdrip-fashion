'use client';

import React, { useState } from 'react';
import { BookOpen, Upload, CheckCircle, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { createBlog, FASHION_HIERARCHY } from '../../lib/adminApi';

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
      <div className="lg:col-span-7 bg-void-950 border border-white/10 p-6 md:p-8">
        <div className="flex items-center gap-2 text-neon-lime text-xs font-bold uppercase mb-2">
          <BookOpen className="w-4 h-4" />
          <span>STREET JOURNAL // NEW ESSAY</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">
          WRITE NEW EDITORIAL BREAKDOWN
        </h2>
        <p className="text-xs text-zinc-400 font-sans mt-1 mb-6">
          Publish guides categorized under our 6 pillars: Lowers, Shirts, T-Shirts, Jackets, Shoes, or Glasses.
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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="A brief 2-sentence breakdown..."
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime font-sans"
            />
          </div>

          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Article Body * (Markdown supported)</label>
            <textarea
              name="content"
              rows={8}
              required
              value={formData.content}
              onChange={handleChange}
              placeholder="Full article content. Use '### Subheading' for headings..."
              className="w-full bg-void-900 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-lime font-sans leading-relaxed text-xs"
            />
          </div>

          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Tags (Comma-Separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="Lowers, Denim, Baggy, Korean"
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neon-lime text-black font-black uppercase text-xs border border-neon-lime hover:bg-black hover:text-neon-lime transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>{loading ? 'PUBLISHING...' : 'PUBLISH ESSAY'}</span>
          </button>
        </form>
      </div>

      <div className="lg:col-span-5 bg-void-950 border border-white/10 p-6 sticky top-24">
        <div className="flex items-center gap-2 text-neon-cyan uppercase font-bold mb-4">
          <Eye className="w-4 h-4" />
          <span>PREVIEW CARD</span>
        </div>

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
      </div>
    </div>
  );
}
