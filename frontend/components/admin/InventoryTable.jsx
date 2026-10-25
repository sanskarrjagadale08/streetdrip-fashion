'use client';

import React, { useState, useEffect } from 'react';
import {
  Search, Edit3, Trash2, ExternalLink, Check, X, Box, Loader2, RefreshCw,
  CheckSquare, Square, Layers, Tag, DollarSign, AlertCircle, ChevronDown, CheckCheck
} from 'lucide-react';
import {
  updateProduct, deleteProduct, bulkDeleteProducts, bulkUpdateProducts, FASHION_HIERARCHY
} from '../../lib/adminApi';

export default function InventoryTable({ products, onProductUpdated, onProductDeleted, onRefresh }) {
  const [search, setSearch] = useState('');
  const [mainCategoryFilter, setMainCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkPriceModal, setBulkPriceModal] = useState(false);
  const [bulkPriceValue, setBulkPriceValue] = useState('');
  const [bulkPriceType, setBulkPriceType] = useState('set'); // 'set' | 'discount_percent' | 'discount_fixed'

  // Single Edit fields
  const [editPrice, setEditPrice] = useState('');
  const [editAffiliateLink, setEditAffiliateLink] = useState('');
  const [editDropStatus, setEditDropStatus] = useState('');
  const [editSubCategory, setEditSubCategory] = useState('');

  const mainCategories = ['All', ...Object.keys(FASHION_HIERARCHY)];

  const filtered = products.filter(p => {
    if (mainCategoryFilter !== 'All' && (p.main_category !== mainCategoryFilter && !p.category?.includes(mainCategoryFilter))) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.sub_category && p.sub_category.toLowerCase().includes(q))
      );
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
          const allVisibleIds = filtered.map(p => p.id);
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

  const areAllFilteredSelected = filtered.length > 0 && filtered.every(p => selectedIds.includes(p.id));
  const isPartiallySelected = filtered.some(p => selectedIds.includes(p.id)) && !areAllFilteredSelected;

  const toggleSelectAll = () => {
    if (filtered.length === 0) return;
    const allFilteredIds = filtered.map(p => p.id);
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
      const rangeIds = filtered.slice(start, end + 1).map(p => p.id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...rangeIds])));
    } else {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
    }
    setLastSelectedIndex(index);
  };

  const handleStartEdit = (prod) => {
    setEditingProduct(prod);
    setEditPrice(prod.price.toString());
    setEditAffiliateLink(prod.affiliate_link);
    setEditDropStatus(prod.drop_status || 'HOT DROP');
    setEditSubCategory(prod.sub_category || '');
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    setActionLoading(true);
    try {
      const updated = await updateProduct(editingProduct.id, {
        price: parseFloat(editPrice),
        affiliate_link: editAffiliateLink,
        drop_status: editDropStatus,
        sub_category: editSubCategory,
        category: `${editingProduct.main_category || 'Lowers'} - ${editSubCategory}`
      });

      setFeedback({ type: 'success', text: `Item #${updated.id} successfully updated.` });
      setEditingProduct(null);
      if (onProductUpdated) onProductUpdated(updated);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update item' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleDeleteConfirm = async (id) => {
    setActionLoading(true);
    try {
      await deleteProduct(id);
      setFeedback({ type: 'success', text: `Item #${id} purged from catalog.` });
      setDeletingId(null);
      setSelectedIds(prev => prev.filter(item => item !== id));
      if (onProductDeleted) onProductDeleted(id);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete item' });
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
      await bulkDeleteProducts(selectedIds);
      setFeedback({ type: 'success', text: `Successfully purged ${selectedIds.length} pieces from inventory.` });
      if (onProductDeleted) {
        selectedIds.forEach(id => onProductDeleted(id));
      }
      setSelectedIds([]);
      setIsBulkDeleting(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to bulk delete pieces' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (!newStatus || selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      await bulkUpdateProducts(selectedIds, { drop_status: newStatus });
      setFeedback({ type: 'success', text: `Marked ${selectedIds.length} items as "${newStatus}".` });
      if (onProductUpdated) {
        products.forEach(p => {
          if (selectedIds.includes(p.id)) {
            onProductUpdated({ ...p, drop_status: newStatus });
          }
        });
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleBulkCategoryChange = async (newCategory) => {
    if (!newCategory || selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      const defaultSub = FASHION_HIERARCHY[newCategory]?.[0] || 'Standard Fit';
      await bulkUpdateProducts(selectedIds, {
        main_category: newCategory,
        sub_category: defaultSub,
        category: `${newCategory} - ${defaultSub}`
      });
      setFeedback({ type: 'success', text: `Moved ${selectedIds.length} items to "${newCategory}".` });
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to update category' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleBulkPriceApply = async () => {
    const val = parseFloat(bulkPriceValue);
    if (isNaN(val) || val < 0 || selectedIds.length === 0) return;
    setActionLoading(true);
    try {
      for (const id of selectedIds) {
        const prod = products.find(p => p.id === id);
        if (!prod) continue;
        let newPrice = prod.price;
        if (bulkPriceType === 'set') {
          newPrice = val;
        } else if (bulkPriceType === 'discount_percent') {
          newPrice = Math.max(0.99, Math.round(prod.price * (1 - val / 100) * 100) / 100);
        } else if (bulkPriceType === 'discount_fixed') {
          newPrice = Math.max(0.99, Math.round((prod.price - val) * 100) / 100);
        }
        await updateProduct(id, { price: newPrice });
        if (onProductUpdated) onProductUpdated({ ...prod, price: newPrice });
      }
      setFeedback({ type: 'success', text: `Updated prices for ${selectedIds.length} items.` });
      setBulkPriceModal(false);
      setBulkPriceValue('');
      if (onRefresh) onRefresh();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to adjust prices' });
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
              placeholder="Search piece, brand, fit..."
              className="w-full bg-void-900 border border-white/10 pl-8 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-neon-lime text-xs"
            />
          </div>

          {/* Section Filter */}
          <select
            value={mainCategoryFilter}
            onChange={(e) => setMainCategoryFilter(e.target.value)}
            className="bg-void-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-neon-lime cursor-pointer uppercase text-xs"
          >
            {mainCategories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Sections' : c}</option>)}
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
            SHOWING <strong className="text-white">{filtered.length}</strong> OF {products.length} PIECES
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Catalog"
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
              <span>{selectedIds.length} SELECTED</span>
            </span>
            <span className="text-zinc-400 text-[11px] hidden sm:inline">
              (Manage selected pieces simultaneously)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Drop Status Selector */}
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkStatusChange(e.target.value);
                  e.target.value = '';
                }
              }}
              disabled={actionLoading}
              className="bg-void-950 border border-white/20 text-zinc-200 hover:border-neon-lime px-2.5 py-1.5 text-xs focus:outline-none cursor-pointer uppercase"
            >
              <option value="" disabled>Set Status...</option>
              <option value="HOT DROP">HOT DROP</option>
              <option value="NEW ARRIVAL">NEW ARRIVAL</option>
              <option value="RESTOCKED">RESTOCKED</option>
              <option value="ESSENTIAL">ESSENTIAL</option>
              <option value="LIMITED">LIMITED</option>
              <option value="BESTSELLER">BESTSELLER</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>

            {/* Bulk Section/Category Selector */}
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
              <option value="" disabled>Move Section...</option>
              {Object.keys(FASHION_HIERARCHY).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Bulk Price Adjust */}
            <button
              onClick={() => setBulkPriceModal(true)}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-void-950 border border-white/20 text-zinc-200 hover:border-neon-lime hover:text-neon-lime text-xs uppercase flex items-center gap-1.5"
            >
              <DollarSign className="w-3.5 h-3.5 text-neon-lime" />
              <span>Adjust Price</span>
            </button>

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
              <th className="p-3">Piece / Preview</th>
              <th className="p-3">Section & Sub-Category</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Price</th>
              <th className="p-3">Affiliate Link</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((prod, index) => {
              const isSelected = selectedIds.includes(prod.id);
              return (
                <tr
                  key={prod.id}
                  onClick={(e) => {
                    // Ignore clicks on links or buttons
                    if (['A', 'BUTTON', 'INPUT', 'SELECT'].includes(e.target.tagName) || e.target.closest('button') || e.target.closest('a')) {
                      return;
                    }
                    handleSelectRow(prod.id, index, e);
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
                      onClick={(e) => handleSelectRow(prod.id, index, e)}
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
                        src={prod.image_url}
                        alt=""
                        className="w-10 h-12 object-cover bg-void-900 border border-white/10 flex-shrink-0"
                      />
                      <div>
                        <div className="font-bold text-white uppercase text-xs line-clamp-1 max-w-[220px]">
                          {prod.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 flex items-center gap-2 mt-0.5">
                          <span>#{prod.id}</span>
                          <span className="bg-white/10 px-1 text-zinc-300 text-[9px] uppercase">{prod.drop_status}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="p-3">
                    <div className="text-white font-bold text-xs uppercase">
                      {prod.main_category || prod.category?.split(' - ')[0] || 'Lowers'}
                    </div>
                    <div className="text-neon-lime text-[10px] uppercase mt-0.5">
                      {prod.sub_category || prod.category?.split(' - ')[1] || 'Standard Fit'}
                    </div>
                  </td>

                  <td className="p-3">
                    <span className="bg-void-800 border border-white/10 px-1.5 py-0.5 text-[10px] text-white uppercase">
                      {prod.brand}
                    </span>
                  </td>

                  <td className="p-3">
                    <span className="font-bold text-white text-sm">
                      ₹{prod.price?.toLocaleString('en-IN')}
                    </span>
                  </td>

                  <td className="p-3">
                    <a
                      href={prod.affiliate_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-neon-lime underline truncate max-w-[140px]"
                    >
                      <span>Test Link</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </td>

                  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleStartEdit(prod)}
                        className="p-1.5 bg-void-900 border border-white/10 text-zinc-300 hover:text-neon-lime hover:border-neon-lime"
                        title="Edit Item"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingId(prod.id)}
                        className="p-1.5 bg-void-900 border border-white/10 text-zinc-300 hover:text-rose-400 hover:border-rose-400"
                        title="Purge Item"
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
            No fashion pieces match the current filter.
          </div>
        )}
      </div>

      {/* SINGLE EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-void-950 border border-neon-lime p-6 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="font-bold text-white uppercase flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-neon-lime" />
                <span>EDIT #{editingProduct.id}</span>
              </span>
              <button onClick={() => setEditingProduct(null)}><X className="w-4 h-4 text-zinc-400" /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">Subcategory / Fit</label>
                <input
                  type="text"
                  value={editSubCategory}
                  onChange={(e) => setEditSubCategory(e.target.value)}
                  placeholder="e.g. Baggy Jeans, Korean Slacks, Boxy Tee..."
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime"
                />
              </div>

              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">Price (INR ₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime"
                />
              </div>

              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">Affiliate Link</label>
                <input
                  type="url"
                  value={editAffiliateLink}
                  onChange={(e) => setEditAffiliateLink(e.target.value)}
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime"
                />
              </div>

              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">Drop Status</label>
                <select
                  value={editDropStatus}
                  onChange={(e) => setEditDropStatus(e.target.value)}
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime uppercase"
                >
                  <option value="HOT DROP">HOT DROP</option>
                  <option value="NEW ARRIVAL">NEW ARRIVAL</option>
                  <option value="RESTOCKED">RESTOCKED</option>
                  <option value="ESSENTIAL">ESSENTIAL</option>
                  <option value="LIMITED">LIMITED</option>
                  <option value="BESTSELLER">BESTSELLER</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  onClick={() => setEditingProduct(null)}
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

      {/* BULK PRICE ADJUSTMENT MODAL */}
      {bulkPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-void-950 border border-neon-lime p-6 shadow-2xl font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="font-bold text-white uppercase flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-neon-lime" />
                <span>BULK PRICE UPDATE ({selectedIds.length} ITEMS)</span>
              </span>
              <button onClick={() => setBulkPriceModal(false)}><X className="w-4 h-4 text-zinc-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">Adjustment Type</label>
                <select
                  value={bulkPriceType}
                  onChange={(e) => setBulkPriceType(e.target.value)}
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime uppercase"
                >
                  <option value="set">Set Fixed Price (₹ INR)</option>
                  <option value="discount_percent">Apply Discount (% Off)</option>
                  <option value="discount_fixed">Reduce By Fixed Amount (₹ Off)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 uppercase font-bold mb-1">
                  {bulkPriceType === 'discount_percent' ? 'Discount Percentage (%)' : 'Amount (₹ INR)'}
                </label>
                <input
                  type="number"
                  step="1"
                  value={bulkPriceValue}
                  onChange={(e) => setBulkPriceValue(e.target.value)}
                  placeholder={bulkPriceType === 'discount_percent' ? 'e.g. 20' : 'e.g. 1999'}
                  className="w-full bg-void-900 border border-white/15 p-2 text-white focus:outline-none focus:border-neon-lime"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setBulkPriceModal(false)}
                  className="flex-1 py-2 bg-void-900 border border-white/10 text-zinc-300 uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkPriceApply}
                  disabled={actionLoading || !bulkPriceValue}
                  className="flex-1 py-2 bg-neon-lime text-black font-black uppercase flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Apply to {selectedIds.length}</span>
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
              <span>CONFIRM BULK PURGE</span>
            </div>
            <p className="text-zinc-300 font-sans mb-6">
              Are you sure you want to permanently purge <strong className="text-rose-400 font-mono font-bold">{selectedIds.length}</strong> selected pieces from the catalog? This action cannot be undone.
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
                <span>Purge {selectedIds.length} Pieces</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SINGLE DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-void-950 border border-rose-500 p-6 shadow-2xl font-mono text-xs">
            <div className="text-rose-400 font-bold uppercase mb-2">CONFIRM ITEM PURGE</div>
            <p className="text-zinc-300 font-sans mb-6">
              Delete item #{deletingId} from the catalog? Customers won't see this item anymore.
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
