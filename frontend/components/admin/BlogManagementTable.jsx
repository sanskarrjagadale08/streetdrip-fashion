'use client';

import React, { useState } from 'react';
import { Search, Edit3, Trash2, BookOpen, AlertTriangle, Check, X, Loader2, RefreshCw } from 'lucide-react';
import { updateBlog, deleteBlog } from '../../lib/adminApi';

export default function BlogManagementTable({ blogs, onBlogUpdated, onBlogDeleted, onRefresh }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingBlog, setEditingBlog] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editReadTime, setEditReadTime] = useState('');

  const categories = ['All', 'Style Guides', 'Drop Alerts', 'Sneaker Culture', 'Techwear & Aesthetics'];

  const filtered = blogs.filter(b => {
    if (categoryFilter !== 'All' && b.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    }
    return true;
  });

  const handleStartEdit = (b) => {
    setEditingBlog(b);
    setEditTitle(b.title);
    setEditCategory(b.category);
    setEditExcerpt(b.excerpt);
    setEditReadTime(b.read_time);
  };

  const handleSaveEdit = async () => {
    if (!editingBlog) return;
    setActionLoading(true);
    try {
      const updated = await updateBlog(editingBlog.id, {
        title: editTitle,
        category: editCategory,
        excerpt: editExcerpt,
        read_time: editReadTime,
      });

      setFeedback({ type: 'success', text: `Article #${updated.id} successfully updated.` });
      setEditingBlog(null);
      if (onBlogUpdated) onBlogUpdated(updated);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update article' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteConfirm = async (id) => {
    setActionLoading(true);
    try {
      await deleteBlog(id);
      setFeedback({ type: 'success', text: `Article #${id} removed from journal.` });
      setDeletingId(null);
      if (onBlogDeleted) onBlogDeleted(id);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete article' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="bg-void-950 border border-white/10 font-mono text-xs">
      {/* Controls */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles by title..."
              className="w-full bg-void-900 border border-white/10 pl-8 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-neon-lime"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-void-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-neon-lime cursor-pointer uppercase text-xs"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-[11px]">
            SHOWING <strong className="text-white">{filtered.length}</strong> ESSAYS
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 bg-void-900 border border-white/10 text-zinc-300 hover:text-neon-lime transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className={`p-3 text-xs flex items-center justify-between border-b ${
          feedback.type === 'success' ? 'bg-neon-lime/10 border-neon-lime text-neon-lime' : 'bg-rose-500/10 border-rose-500 text-rose-400'
        }`}>
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-void-900 text-[10px] uppercase text-zinc-400 tracking-wider">
              <th className="p-3">Article / Preview</th>
              <th className="p-3">Category</th>
              <th className="p-3">Author & Date</th>
              <th className="p-3">Read Time</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-void-900/60 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.cover_image}
                      alt={b.title}
                      className="w-12 h-10 object-cover bg-void-900 border border-white/10 flex-shrink-0"
                    />
                    <div>
                      <div className="font-bold text-white uppercase text-xs line-clamp-1 max-w-[260px]">
                        {b.title}
                      </div>
                      <div className="text-[10px] text-zinc-400 line-clamp-1 max-w-[260px] font-sans">
                        {b.excerpt}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="p-3">
                  <span className="bg-void-800 border border-white/10 px-2 py-0.5 text-[10px] text-neon-lime uppercase font-bold">
                    {b.category}
                  </span>
                </td>

                <td className="p-3 text-[11px] text-zinc-300">
                  <div>{b.author}</div>
                  <div className="text-[9px] text-zinc-500">{b.date}</div>
                </td>

                <td className="p-3 text-zinc-400 text-xs">
                  {b.read_time}
                </td>

                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleStartEdit(b)}
                      className="p-1.5 bg-void-900 border border-white/10 text-zinc-300 hover:text-neon-lime hover:border-neon-lime"
                      title="Edit Article"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingId(b.id)}
                      className="p-1.5 bg-void-900 border border-white/10 text-zinc-300 hover:text-rose-400 hover:border-rose-400"
                      title="Delete Article"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono">
            No articles found. Write your first essay using "Write New Blog".
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-void-950 border border-neon-lime p-6 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="font-bold text-white uppercase flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-neon-lime" />
                <span>EDIT ARTICLE #{editingBlog.id}</span>
              </div>
              <button onClick={() => setEditingBlog(null)}><X className="w-4 h-4 text-zinc-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 uppercase font-bold mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime uppercase"
                  >
                    {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-300 uppercase font-bold mb-1">Read Time</label>
                  <input
                    type="text"
                    value={editReadTime}
                    onChange={(e) => setEditReadTime(e.target.value)}
                    className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">Excerpt</label>
                <textarea
                  rows={2}
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime font-sans"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  onClick={() => setEditingBlog(null)}
                  className="flex-1 py-2 bg-void-900 border border-white/10 text-zinc-300 uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-neon-lime text-black font-black uppercase flex items-center justify-center gap-1.5"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-void-950 border border-rose-500 p-6 shadow-2xl font-mono text-xs">
            <div className="flex items-center gap-2 text-rose-400 font-bold uppercase mb-2">
              <AlertTriangle className="w-4 h-4" />
              <span>CONFIRM ESSAY DELETION</span>
            </div>
            <p className="text-zinc-300 font-sans mb-6">
              Delete article #{deletingId} from the Street Journal? This action is permanent.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 bg-void-900 border border-white/10 text-zinc-300 uppercase"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirm(deletingId)}
                disabled={actionLoading}
                className="flex-1 py-2 bg-rose-600 text-white font-black uppercase hover:bg-rose-700"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
