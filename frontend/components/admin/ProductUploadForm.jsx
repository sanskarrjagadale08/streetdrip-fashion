'use client';

import React, { useState } from 'react';
import { PlusCircle, Upload, CheckCircle, AlertCircle, Box, ExternalLink, Loader2, Layers } from 'lucide-react';
import { createProduct, FASHION_HIERARCHY } from '../../lib/adminApi';

const AVAILABLE_BRANDS = [
  "General",
  "H&M",
  "Zara",
  "Bonkers",
  "Vastrado",
  "Souled Store",
  "Snitch",
  "Bewakoof",
  "Roadster",
  "Wrogn",
  "Peter England",
  "US Polo",
  "Urban Monkey",
  "Highlander",
  "Nike",
  "Adidas",
  "None"
];

const DROP_STATUSES = [
  "HOT DROP",
  "ESSENTIAL",
  "LIMITED",
  "BESTSELLER",
  "RESTOCKED"
];

export default function ProductUploadForm({ onSuccess }) {
  const mainCategories = Object.keys(FASHION_HIERARCHY);

  const [formData, setFormData] = useState({
    name: '',
    main_category: 'Lowers',
    sub_category: FASHION_HIERARCHY['Lowers'][0],
    brand: 'General',
    price: '',
    image_url: '',
    model_3d_url: '',
    model_type: 'hoodie',
    affiliate_link: '',
    vibe_tags: 'Baggy, Minimalist, Everyday',
    drop_status: 'HOT DROP',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleMainCategoryChange = (e) => {
    const newMain = e.target.value;
    const defaultSub = FASHION_HIERARCHY[newMain]?.[0] || '';
    setFormData(prev => ({
      ...prev,
      main_category: newMain,
      sub_category: defaultSub
    }));
  };

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
      if (!formData.name || !formData.price || !formData.affiliate_link) {
        throw new Error('Please fill in Name, Price, and Affiliate Link');
      }

      const priceNum = parseFloat(formData.price);
      if (isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Enter a valid price');
      }

      const tags = formData.vibe_tags.split(',').map(t => t.trim()).filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        main_category: formData.main_category,
        sub_category: formData.sub_category,
        category: `${formData.main_category} - ${formData.sub_category}`,
        brand: formData.brand,
        price: priceNum,
        image_url: formData.image_url.trim() || 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
        model_3d_url: formData.model_3d_url.trim() || null,
        model_type: formData.model_type,
        affiliate_link: formData.affiliate_link.trim(),
        vibe_tags: tags.length ? tags : ['Streetwear'],
        drop_status: formData.drop_status,
        description: formData.description.trim()
      };

      const result = await createProduct(payload);
      setSuccessMsg(`Published! "${result.name}" added under ${result.main_category} > ${result.sub_category}.`);

      // Reset
      setFormData({
        name: '',
        main_category: 'Lowers',
        sub_category: FASHION_HIERARCHY['Lowers'][0],
        brand: 'Levi\'s',
        price: '',
        image_url: '',
        model_3d_url: '',
        model_type: 'hoodie',
        affiliate_link: '',
        vibe_tags: 'Baggy, Minimalist, Everyday',
        drop_status: 'HOT DROP',
        description: '',
      });

      if (onSuccess) onSuccess(result);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload product.');
    } finally {
      setLoading(false);
    }
  };

  const previewPrice = parseFloat(formData.price) || 0;
  const currentSubCategories = FASHION_HIERARCHY[formData.main_category] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-mono text-xs">
      {/* FORM */}
      <div className="lg:col-span-7 bg-void-950 border border-white/10 p-6 md:p-8">
        <div className="flex items-center gap-2 text-neon-lime text-xs font-bold uppercase mb-2">
          <Upload className="w-4 h-4" />
          <span>FASHION INGESTION // NEW PIECE</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">
          ADD PIECE TO CATALOG
        </h2>
        <p className="text-xs text-zinc-400 font-sans mt-1 mb-6">
          Categorize by specific pillars (Lowers, Shirts, T-Shirts, Jackets, Shoes, Glasses) and exact fits.
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
            <label className="block text-zinc-300 uppercase font-bold mb-1">Product Title *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Levi's 568 Loose Straight Carpenter Denim"
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
            />
          </div>

          {/* DYNAMIC CATEGORY & SUBCATEGORY DROPDOWNS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-void-900 border border-white/10">
            <div>
              <label className="block text-neon-lime uppercase font-bold mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>Main Section *</span>
              </label>
              <select
                name="main_category"
                value={formData.main_category}
                onChange={handleMainCategoryChange}
                className="w-full bg-void-950 border border-white/20 p-2 text-white focus:outline-none focus:border-neon-lime uppercase"
              >
                {mainCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-neon-lime uppercase font-bold mb-1">
                Specific Sub-Category *
              </label>
              <select
                name="sub_category"
                value={formData.sub_category}
                onChange={handleChange}
                className="w-full bg-void-950 border border-white/20 p-2 text-white focus:outline-none focus:border-neon-lime uppercase"
              >
                {currentSubCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1">Brand *</label>
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime uppercase"
              >
                {AVAILABLE_BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1">Price (INR ₹) *</label>
              <input
                type="number"
                step="1"
                name="price"
                required
                value={formData.price}
                onChange={handleChange}
                placeholder="2999"
                className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
              />
            </div>

            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1">Drop Tag</label>
              <select
                name="drop_status"
                value={formData.drop_status}
                onChange={handleChange}
                className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime uppercase"
              >
                {DROP_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Affiliate Store URL *</label>
            <input
              type="url"
              name="affiliate_link"
              required
              value={formData.affiliate_link}
              onChange={handleChange}
              placeholder="https://brand.com/product?ref=streetdrip"
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1">Image URL</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
              />
            </div>

            <div>
              <label className="block text-zinc-300 uppercase font-bold mb-1">3D GLTF Asset Path (Optional)</label>
              <input
                type="text"
                name="model_3d_url"
                value={formData.model_3d_url}
                onChange={handleChange}
                placeholder="/models/item.gltf"
                className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Vibe Tags (Comma-Separated)</label>
            <input
              type="text"
              name="vibe_tags"
              value={formData.vibe_tags}
              onChange={handleChange}
              placeholder="Baggy, Minimalist, Everyday"
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime"
            />
          </div>

          <div>
            <label className="block text-zinc-300 uppercase font-bold mb-1">Editorial Description</label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Construction notes, fabric weight, drape breakdown..."
              className="w-full bg-void-900 border border-white/10 p-2.5 text-white focus:outline-none focus:border-neon-lime font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-neon-lime text-black font-black uppercase text-xs border border-neon-lime hover:bg-black hover:text-neon-lime transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4 fill-black" />}
            <span>{loading ? 'PUBLISHING...' : 'SAVE & PUBLISH TO CATALOG'}</span>
          </button>
        </form>
      </div>

      {/* LIVE PREVIEW */}
      <div className="lg:col-span-5 bg-void-950 border border-white/10 p-6 sticky top-24">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <span className="font-bold text-white uppercase text-xs">LIVE FEED PREVIEW</span>
          <span className="text-[10px] text-neon-lime">
            {formData.main_category} &gt; {formData.sub_category}
          </span>
        </div>

        <div className="max-w-xs mx-auto border border-white/15 bg-void-900 p-3 shadow-xl">
          <div className="relative aspect-[4/5] bg-black mb-3 overflow-hidden">
            <img
              src={formData.image_url || "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80"}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2 left-2 bg-neon-lime text-black font-bold text-[9px] uppercase px-1.5 py-0.5">
              {formData.drop_status}
            </span>
          </div>

          <div className="text-[10px] text-zinc-400 uppercase font-mono">
            {formData.brand} • <strong className="text-white">{formData.sub_category}</strong>
          </div>

          <div className="font-bold text-sm text-white uppercase line-clamp-1 mt-0.5">
            {formData.name || "Untitled Piece"}
          </div>

          <div className="text-lg font-black text-neon-lime mt-1 font-mono">
            ₹{previewPrice.toLocaleString('en-IN')}
          </div>

          <div className="mt-3 py-2 bg-white text-black text-center font-bold text-xs uppercase flex items-center justify-center gap-1">
            <span>COP THIS LOOK</span> <ExternalLink className="w-3 h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
