'use client';

import React, { useState } from 'react';
import { Search, Edit3, Trash2, ExternalLink, Check, X, Box, Loader2, RefreshCw } from 'lucide-react';
import { updateProduct, deleteProduct, FASHION_HIERARCHY } from '../../lib/adminApi';

export default function InventoryTable({ products, onProductUpdated, onProductDeleted, onRefresh }) {
  const [search, setSearch] = useState('');
  const [mainCategoryFilter, setMainCategoryFilter] = useState('All');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Edit fields
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
      if (onProductDeleted) onProductDeleted(id);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to delete item' });
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
              placeholder="Search piece, brand, fit (e.g. Baggy)..."
              className="w-full bg-void-900 border border-white/10 pl-8 pr-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-neon-lime"
            />
          </div>

          <select
            value={mainCategoryFilter}
            onChange={(e) => setMainCategoryFilter(e.target.value)}
            className="bg-void-900 border border-white/10 px-3 py-2 text-white focus:outline-none focus:border-neon-lime cursor-pointer uppercase text-xs"
          >
            {mainCategories.map(c => <option key={c} value={c}>{c === 'All' ? 'All Sections' : c}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-[11px]">
            SHOWING <strong className="text-white">{filtered.length}</strong> OF {products.length} PIECES
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
              <th className="p-3">Piece / Preview</th>
              <th className="p-3">Section & Sub-Category</th>
              <th className="p-3">Brand</th>
              <th className="p-3">Price</th>
              <th className="p-3">Affiliate Link</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((prod) => (
              <tr key={prod.id} className="hover:bg-void-900/60 transition-colors">
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
                    ${prod.price.toFixed(2)}
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

                <td className="p-3 text-right">
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
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-12 text-center text-zinc-500 font-mono">
            No fashion pieces match the current filter.
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
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
                <label className="block text-zinc-300 uppercase font-bold mb-1">Price (USD $)</label>
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
                  <option value="ESSENTIAL">ESSENTIAL</option>
                  <option value="LIMITED">LIMITED</option>
                  <option value="BESTSELLER">BESTSELLER</option>
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

      {/* DELETE CONFIRMATION MODAL */}
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
