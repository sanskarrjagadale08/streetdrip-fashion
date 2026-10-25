'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Edit3, Trash2, BookOpen, AlertTriangle, Check, X, Loader2, RefreshCw,
  CheckSquare, Square, Layers, CheckCheck, AlertCircle
} from 'lucide-react';
import { updateBlog, deleteBlog, bulkDeleteBlogs, bulkUpdateBlogs } from '../../lib/adminApi';
import BlogContentEditor from './BlogContentEditor';

export default function BlogManagementTable({ blogs, onBlogUpdated, onBlogDeleted, onRefresh }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [editingBlog, setEditingBlog] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Single Edit fields
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [editReadTime, setEditReadTime] = useState('');
  const [editContent, setEditContent] = useState('');

  const categories = ['All', 'Lowers', 'Shirts', 'T-Shirts', 'Jackets', 'Shoes', 'Glasses'];

  const filtered = blogs.filter(b => {
    if (categoryFilter !== 'All' && b.category !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
    }
    return true;
  });

  // Keyboard shortcut listener: Select All (Ctrl/Cmd+A) and Deselect (Escape)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (filtered.length > 0) {
          const allVisibleIds = filtered.map(b => b.id);
          const isAllSelected = allVisibleIds.every(id => selectedIds.includes(id));
          if (isAllSelected) {
            setSelectedIds(prev => prev.filter(id => !allVisibleIds.includes(id)));
          } else {
            setSelectedIds(prev => Array.from(new Set([...prev, ...allVisibleIds])));
          }
        }
      } else if (e.key === 'Escape' && selectedIds.length > 0) {
        setSelectedIds([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filtered, selectedIds]);

  const areAllFilteredSelected = filtered.length > 0 && filtered.every(b => selectedIds.includes(b.id));
  const isPartiallySelected = filtered.some(b => selectedIds.includes(b.id)) && !areAllFilteredSelected;

  const toggleSelectAll = () => {
    if (filtered.length === 0) return;
    const allFilteredIds = filtered.map(b => b.id);
    if (areAllFilteredSelected) {
      setSelectedIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...allFilteredIds])));
    }
  };

  const handleSelectRow = (id, index, e) => {
    if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== index) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = filtered.slice(start, end + 1).map(b => b.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...rangeIds])));
    } else {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    }
    setLastSelectedIndex(index);
  };

  const handleStartEdit = (b) => {
    setEditingBlog(b);
    setEditTitle(b.title || '');
    setEditCategory(b.category || 'Lowers');
    setEditExcerpt(b.excerpt || '');
    setEditReadTime(b.read_time || '4 min');
    setEditContent(b.content || '');
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
        content: editContent,
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
      setSelectedIds(prev => prev.filter(item => item !== id));
      if (onBlogDeleted) onBlogDeleted(id);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete article' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  // Bulk Operations
  const handleBulkDeleteConfirm = async () => {
    if (selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await bulkDeleteBlogs(selectedIds);
      setFeedback({ type: 'success', text: `Successfully removed ${selectedIds.length} articles from journal.` });
      if (onBlogDeleted) {
        selectedIds.forEach(id => onBlogDeleted(id));
      }
      setSelectedIds([]);
      setIsBulkDeleting(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to bulk delete articles' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleBulkCategoryChange = async (newCategory) => {
    if (!newCategory || selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await bulkUpdateBlogs(selectedIds, { category: newCategory });
      setFeedback({ type: 'success', text: `Moved ${selectedIds.length} articles to "${newCategory}".` });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update category' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  return (
    <div className="bg-void-950 border border-white/10 font-mono text-xs relative">
      {/* Controls & Select Key Toolbar */}
      <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles by title..."
              className="w-full bg-void-900 border border-white/10 pl-8 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-neon-lime text-xs"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-void-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-neon-lime cursor-pointer uppercase text-xs"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Explicit Select Key Toggle Button */}
          {filtered.length > 0 && (
            <button
              onClick={toggleSelectAll}
              title="Shortcut: Press Ctrl+A or ⌘+A"
              className={`flex items-center gap-2 px-3 py-2 border transition-all text-xs uppercase font-bold ${
                areAllFilteredSelected
                  ? 'bg-neon-lime text-black border-neon-lime'
                  : selectedIds.length > 0
                  ? 'bg-void-800 text-neon-lime border-neon-lime/40'
                  : 'bg-void-900 text-zinc-300 border-white/10 hover:border-neon-lime/60 hover:text-white'
              }`}
            >
              {areAllFilteredSelected ? (
                <CheckSquare className="w-3.5 h-3.5" />
              ) : isPartiallySelected ? (
                <div className="w-3.5 h-3.5 bg-neon-lime/40 border border-neon-lime flex items-center justify-center">
                  <div className="w-2 h-0.5 bg-black" />
                </div>
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>{areAllFilteredSelected ? 'DESELECT ALL' : 'SELECT KEY (ALL)'}</span>
              <span className="text-[10px] opacity-70 bg-black/30 px-1 py-0.5 rounded">⌘A</span>
            </button>
          )}

          {selectedIds.length > 0 && (
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-2 bg-void-900 border border-white/10 text-zinc-400 hover:text-white text-[11px] uppercase transition-colors"
            >
              Clear Selection
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-[11px]">
            SHOWING <strong className="text-white">{filtered.length}</strong> ESSAYS
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Journal"
              className="p-2 bg-void-900 border border-white/10 text-zinc-300 hover:text-neon-lime transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Floating Bulk Action Bar (When 1 or more items are selected) */}
      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-30 bg-void-900/95 backdrop-blur-md border-b-2 border-neon-lime p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="bg-neon-lime text-black font-black px-2.5 py-1 text-xs uppercase flex items-center gap-1.5 shadow-sm">
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{selectedIds.length} ESSAYS SELECTED</span>
            </span>
            <span className="text-zinc-400 text-[11px] hidden sm:inline">
              (Manage selected articles simultaneously)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Category Selector */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkCategoryChange(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={actionLoading}
              className="bg-void-950 border border-white/20 text-zinc-200 hover:border-neon-lime px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer uppercase"
            >
              <option value="" disabled>Move Category...</option>
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Bulk Delete Button */}
            <button
              onClick={() => setIsBulkDeleting(true)}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Toast */}
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
              {/* Select Key Header Checkbox */}
              <th className="p-3 w-10 text-center">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 hover:text-neon-lime transition-colors flex items-center justify-center mx-auto"
                  title="Toggle select all visible"
                >
                  {areAllFilteredSelected ? (
                    <CheckSquare className="w-4 h-4 text-neon-lime" />
                  ) : isPartiallySelected ? (
                    <div className="w-4 h-4 bg-neon-lime/30 border border-neon-lime flex items-center justify-center">
                      <div className="w-2.5 h-0.5 bg-white" />
                    </div>
                  ) : (
                    <Square className="w-4 h-4 text-zinc-500 hover:text-white" />
                  )}
                </button>
              </th>
              <th className="p-3">Article / Preview</th>
              <th className="p-3">Category</th>
              <th className="p-3">Author & Date</th>
              <th className="p-3">Read Time</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((b, index) => {
              const isSelected = selectedIds.includes(b.id);
              return (
                <tr
                  key={b.id}
                  onClick={(e) => {
                    if (['A', 'BUTTON', 'INPUT', 'SELECT'].includes(e.target.tagName) || e.target.closest('button') || e.target.closest('a')) {
                      return;
                    }
                    handleSelectRow(b.id, index, e);
                  }}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-neon-lime/10 border-l-2 border-l-neon-lime text-white'
                      : 'hover:bg-void-900/60'
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleSelectRow(b.id, index, e)}
                      className="p-1 flex items-center justify-center mx-auto"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-neon-lime" />
                      ) : (
                        <Square className="w-4 h-4 text-zinc-600 hover:text-zinc-300" />
                      )}
                    </button>
                  </td>

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

                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
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
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono">
            No articles found. Write your first essay using "Write New Blog".
          </div>
        )}
      </div>

      {/* SINGLE EDIT MODAL */}
      {editingBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-4xl bg-void-950 border border-neon-lime p-6 shadow-2xl font-mono text-xs my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 sticky top-0 bg-void-950 z-10">
              <div className="font-bold text-white uppercase flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-neon-lime" />
                <span>EDIT &amp; STYLE ARTICLE #{editingBlog.id}</span>
              </div>
              <button onClick={() => setEditingBlog(null)}><X className="w-4 h-4 text-zinc-400 hover:text-white" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">Headline</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime font-bold"
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

              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1.5 flex items-center justify-between">
                  <span>Article Content &amp; Styling Suite</span>
                  <span className="text-[10px] text-neon-lime">Apply Fonts, Colors, Quotes &amp; Badges</span>
                </label>
                <BlogContentEditor
                  value={editContent}
                  onChange={setEditContent}
                  placeholder="Article content..."
                />
              </div>

              <div className="pt-3 flex gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingBlog(null)}
                  className="flex-1 py-2.5 bg-void-900 border border-white/10 text-zinc-300 hover:text-white uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-neon-lime text-black font-black uppercase flex items-center justify-center gap-1.5 hover:bg-black hover:text-neon-lime border border-neon-lime transition-all"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {isBulkDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-void-950 border border-rose-500 p-6 shadow-2xl font-mono text-xs">
            <div className="text-rose-400 font-bold uppercase mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>CONFIRM BULK ESSAY PURGE</span>
            </div>
            <p className="text-zinc-300 font-sans mb-6">
              Are you sure you want to permanently delete <strong className="text-rose-400 font-mono font-bold">{selectedIds.length}</strong> selected articles from the Street Journal? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsBulkDeleting(false)}
                className="flex-1 py-2 bg-void-900 border border-white/10 text-zinc-300 uppercase"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={actionLoading}
                className="flex-1 py-2 bg-rose-600 text-white font-black uppercase hover:bg-rose-700 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Purge {selectedIds.length} Essays</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE DELETE MODAL */}
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
