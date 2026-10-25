'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ProductCard from '../components/ProductCard';
import Product3DViewer from '../components/Product3DViewer';
import AIVibeModal from '../components/AIVibeModal';
import BlogSection from '../components/BlogSection';
import ThemeToggle from '../components/ThemeToggle';
import { 
  Sparkles, 
  Search, 
  ArrowUpDown, 
  Layers, 
  Lock, 
  Box, 
  SlidersHorizontal,
  ChevronRight,
  Flame,
  ArrowRight,
  CheckCircle,
  Compass,
  Tag
} from 'lucide-react';
import { fetchAllProducts, FASHION_HIERARCHY } from '../lib/adminApi';

const MAIN_PILLARS = [
  "All",
  "Lowers",
  "Shirts",
  "T-Shirts",
  "Jackets",
  "Shoes",
  "Glasses"
];

const CURATED_BRANDS = [
  "All",
  "Nike",
  "Zara",
  "Bewakoof",
  "Levi's",
  "Crocs",
  "Dr. Martens",
  "H&M"
];

export default function StreetwearLandingPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active Navigation
  const [activeMainCategory, setActiveMainCategory] = useState("Lowers");
  const [activeSubCategory, setActiveSubCategory] = useState("All");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular");

  // 3D Canvas Modal & AI Vibe
  const [preview3DItem, setPreview3DItem] = useState(null);
  const [is3DViewerOpen, setIs3DViewerOpen] = useState(false);
  const [isVibeModalOpen, setIsVibeModalOpen] = useState(false);
  const [activeVibePrompt, setActiveVibePrompt] = useState("Late night drive");

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await fetchAllProducts();
        if (data && Array.isArray(data)) {
          setProducts(data);
        }
      } catch (err) {
        console.warn('Backend unavailable, check server:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Distinct Nomiki palette active pill styles for light and dark themes
  const getPillarActiveStyle = (pillar, isActive) => {
    if (!isActive) {
      return 'text-burgundy-900/70 dark:text-sand-200/70 hover:text-burgundy-950 dark:hover:text-creme-100 hover:bg-sand-200/50 dark:hover:bg-burgundy-900/60';
    }
    // Nomiki Palette: Deep Burgundy in Light Mode, Dusty Pink & Sand Accents in Dark Themes
    switch (pillar.toLowerCase()) {
      case 'lowers':
        return 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-400 dark:text-burgundy-950 font-bold dark:border-dusty-300 dark:shadow-[0_0_15px_rgba(200,164,159,0.35)]';
      case 'shirts':
        return 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-sand-300 dark:text-burgundy-950 font-bold dark:border-sand-200 dark:shadow-[0_0_15px_rgba(216,196,172,0.35)]';
      case 't-shirts':
        return 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-creme-200 dark:text-burgundy-950 font-bold dark:border-creme-100 dark:shadow-[0_0_15px_rgba(238,228,218,0.35)]';
      case 'jackets':
        return 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-burgundy-500 dark:text-creme-100 font-bold dark:border-burgundy-400 dark:shadow-[0_0_15px_rgba(107,20,28,0.45)]';
      case 'shoes':
        return 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-300 dark:text-burgundy-950 font-bold dark:border-dusty-200 dark:shadow-[0_0_15px_rgba(200,164,159,0.35)]';
      case 'glasses':
        return 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-sand-200 dark:text-burgundy-950 font-bold dark:border-sand-100 dark:shadow-[0_0_15px_rgba(216,196,172,0.35)]';
      default:
        return 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-400 dark:text-burgundy-950 font-bold dark:border-dusty-300 dark:shadow-[0_0_15px_rgba(200,164,159,0.35)]';
    }
  };

  // When changing main category, reset subcategory to 'All'
  const handleMainCategorySelect = (category) => {
    setActiveMainCategory(category);
    setActiveSubCategory("All");
  };

  // Subcategories for current main category
  const availableSubCategories = useMemo(() => {
    if (activeMainCategory === "All") return [];
    return FASHION_HIERARCHY[activeMainCategory] || [];
  }, [activeMainCategory]);

  // Filtered products based on Main Category + Subcategory + Brand + Search + Sort
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Main category filter
      if (activeMainCategory !== "All") {
        const itemMain = item.main_category || item.category?.split(' - ')[0] || "";
        if (itemMain.toLowerCase() !== activeMainCategory.toLowerCase()) {
          return false;
        }
      }

      // Subcategory filter
      if (activeSubCategory !== "All") {
        const itemSub = item.sub_category || item.category?.split(' - ')[1] || "";
        if (itemSub.toLowerCase() !== activeSubCategory.toLowerCase()) {
          return false;
        }
      }

      // Brand filter
      if (selectedBrand !== "All") {
        if (item.brand?.toLowerCase() !== selectedBrand.toLowerCase()) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesBrand = item.brand?.toLowerCase().includes(q);
        const matchesSub = item.sub_category?.toLowerCase().includes(q);
        const matchesVibe = item.vibe_tags?.some(v => v.toLowerCase().includes(q));
        if (!matchesName && !matchesBrand && !matchesSub && !matchesVibe) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "newest") return b.id - a.id;
      return (b.likes || 0) - (a.likes || 0);
    });
  }, [products, activeMainCategory, activeSubCategory, selectedBrand, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-creme-50 dark:bg-burgundy-950 text-burgundy-950 dark:text-creme-100 font-sans transition-colors duration-200">
      {/* 0. EDITORIAL TOP TICKER */}
      <div className="bg-burgundy-950 text-sand-200 dark:bg-burgundy-950 dark:text-sand-300 py-2 px-4 text-center text-xs font-mono tracking-widest uppercase border-b border-burgundy-900/80 flex items-center justify-between">
        <span className="hidden sm:inline font-medium">PARIS • TOKYO • NEW YORK</span>
        <span className="mx-auto sm:mx-0 font-semibold">CURATED MENSWEAR ARCHIVE // S/S 2026 DROP</span>
        <span className="hidden sm:inline text-sand-400 font-medium">VERIFIED DIRECT AFFILIATE LABELS</span>
      </div>

      {/* 1. TOP MINIMALIST HEADER */}
      <header className="sticky top-0 z-40 bg-creme-50/90 dark:bg-burgundy-950/90 backdrop-blur-md border-b border-sand-300/70 dark:border-burgundy-800/80 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 flex items-center justify-center font-display font-bold text-base tracking-wider shadow-sm">
              SD
            </div>
            <div>
              <span className="text-2xl md:text-3xl font-display font-bold uppercase tracking-wider text-burgundy-950 dark:text-creme-100">
                STREET<span className="text-burgundy-600 dark:text-dusty-400 font-light">DRIP</span>
              </span>
              <span className="block text-[10px] md:text-xs font-mono tracking-[0.25em] text-sand-600 dark:text-dusty-400/90 uppercase -mt-0.5">
                ATELIER &amp; ARCHIVE
              </span>
            </div>
          </a>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-7 font-mono text-sm font-semibold uppercase tracking-wider">
            <a href="#catalog" className="text-burgundy-900 dark:text-sand-200 hover:text-burgundy-600 dark:hover:text-dusty-400 transition-colors">
              Collection
            </a>
            <a href="#street-journal" className="text-burgundy-800/80 dark:text-sand-300/80 hover:text-burgundy-600 dark:hover:text-dusty-400 transition-colors">
              Journal
            </a>
            <button 
              onClick={() => setIs3DViewerOpen(!is3DViewerOpen)}
              className="text-burgundy-800/80 dark:text-sand-300/80 hover:text-burgundy-600 dark:hover:text-dusty-400 transition-colors flex items-center gap-1.5"
            >
              <span>3D Atelier</span>
              {is3DViewerOpen && <span className="w-2 h-2 rounded-full bg-dusty-400 animate-pulse" />}
            </button>
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 3D WebGL Toggle Button */}
            <button
              onClick={() => setIs3DViewerOpen(!is3DViewerOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 border text-xs md:text-sm font-mono font-bold uppercase tracking-wider transition-all shadow-sm ${
                is3DViewerOpen 
                  ? 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-400 dark:text-burgundy-950 dark:border-dusty-400 font-bold'
                  : 'bg-white dark:bg-burgundy-900 border-sand-300 dark:border-burgundy-800 text-burgundy-900 dark:text-sand-200 hover:border-burgundy-600 dark:hover:border-dusty-400'
              }`}
              title="Toggle interactive 3D product showcase"
            >
              <Box className="w-4 h-4 text-burgundy-700 dark:text-dusty-400 group-hover:text-current" />
              <span className="hidden sm:inline">3D View</span>
            </button>

            {/* AI Vibe Stylist Button */}
            <button
              onClick={() => setIsVibeModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 font-mono font-bold uppercase text-xs md:text-sm tracking-wider border border-burgundy-600 dark:border-dusty-300 hover:bg-burgundy-700 dark:hover:bg-dusty-300 dark:hover:shadow-[0_0_15px_rgba(200,164,159,0.3)] transition-all shadow-sm"
              title="Generate a curated 4-piece outfit matching any vibe"
            >
              <Sparkles className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">AI Stylist</span>
            </button>

            {/* THEME SELECTOR DROPDOWN */}
            <ThemeToggle className="ml-1" />

            {/* Admin Vault Link */}
            <a
              href="/admin"
              className="flex items-center gap-1 p-2 rounded-full border border-sand-300 dark:border-burgundy-800 text-burgundy-700 dark:text-sand-300 hover:text-burgundy-950 dark:hover:text-white hover:border-burgundy-600 dark:hover:border-dusty-400 transition-all"
              title="Admin Vault Dashboard"
              aria-label="Admin Dashboard"
            >
              <Lock className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 2. THE 6 PRIMARY SECTION PILLARS NAVIGATION */}
        <div className="border-t border-sand-300/60 dark:border-burgundy-800/60 bg-creme-100/70 dark:bg-burgundy-950/70 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 py-2.5">
            {MAIN_PILLARS.map((pillar) => {
              const isActive = activeMainCategory.toLowerCase() === pillar.toLowerCase();
              return (
                <button
                  key={pillar}
                  onClick={() => handleMainCategorySelect(pillar)}
                  className={`px-5 py-2 text-xs md:text-sm font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-200 shadow-sm ${getPillarActiveStyle(pillar, isActive)}`}
                >
                  {pillar}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 3. DYNAMIC SUBCATEGORY SECONDARY BAR */}
      {availableSubCategories.length > 0 && (
        <div className="bg-creme-100/60 dark:bg-burgundy-950/50 border-b border-sand-200 dark:border-burgundy-800/60 overflow-x-auto py-3">
          <div className="max-w-7xl mx-auto px-4 flex items-center gap-2.5">
            <span className="text-xs font-mono uppercase tracking-widest text-burgundy-700/80 dark:text-dusty-400 font-bold flex items-center gap-1.5 mr-1">
              <Layers className="w-3.5 h-3.5" />
              <span>{activeMainCategory}:</span>
            </span>

            {/* 'All' for current category */}
            <button
              onClick={() => setActiveSubCategory("All")}
              className={`px-4 py-1.5 text-xs md:text-sm font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                activeSubCategory === "All"
                  ? 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-400 dark:text-burgundy-950 dark:border-dusty-300 font-bold dark:shadow-[0_0_12px_rgba(200,164,159,0.25)]'
                  : 'bg-white/80 dark:bg-burgundy-900/80 border-sand-300 dark:border-burgundy-800 text-burgundy-900/80 dark:text-sand-300/80 hover:text-burgundy-950 dark:hover:text-white hover:border-burgundy-500 dark:hover:border-dusty-400'
              }`}
            >
              All {activeMainCategory}
            </button>

            {/* Subcategory Chips */}
            {availableSubCategories.map((sub) => {
              const isSubActive = activeSubCategory.toLowerCase() === sub.toLowerCase();
              return (
                <button
                  key={sub}
                  onClick={() => setActiveSubCategory(sub)}
                  className={`px-4 py-1.5 text-xs md:text-sm font-mono uppercase tracking-wider transition-all whitespace-nowrap border ${
                    isSubActive
                      ? 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-400 dark:text-burgundy-950 dark:border-dusty-300 font-bold dark:shadow-[0_0_12px_rgba(200,164,159,0.25)]'
                      : 'bg-white/80 dark:bg-burgundy-900/80 border-sand-300 dark:border-burgundy-800 text-burgundy-900/80 dark:text-sand-300/80 hover:text-burgundy-950 dark:hover:text-white hover:border-burgundy-500 dark:hover:border-dusty-400'
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. EXPANDABLE 3D PRODUCT SHOWCASE */}
      {is3DViewerOpen && (
        <section className="border-b border-sand-300 dark:border-burgundy-800 bg-creme-100/90 dark:bg-burgundy-950 transition-all">
          <div className="max-w-7xl mx-auto">
            <Product3DViewer initialProduct={preview3DItem} />
          </div>
        </section>
      )}

      {/* 5. EDITORIAL HERO & CATALOG SECTION */}
      <main id="catalog" className="max-w-7xl mx-auto px-4 py-10 md:py-16">
        {/* HAUTE EDITORIAL HERO STATEMENT */}
        <div className="relative mb-12 py-12 md:py-18 px-6 md:px-14 bg-gradient-to-br from-creme-100/90 via-creme-50/60 to-sand-100/40 dark:from-burgundy-950 dark:via-burgundy-900/60 dark:to-burgundy-950 border border-sand-300/80 dark:border-burgundy-800/80 overflow-hidden shadow-sm">
          {/* Subtle Ambient Glow Blobs */}
          <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-sand-200/40 dark:bg-burgundy-800/20 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-dusty-200/30 dark:bg-dusty-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="w-2.5 h-2.5 rounded-full bg-burgundy-600 dark:bg-dusty-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-[0.25em] text-sand-700 dark:text-dusty-300 font-bold">
                S/S 2026 ARCHIVE EDITION // HAUTE CURATION
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-serif font-medium tracking-tight text-burgundy-950 dark:text-creme-100 leading-[1.05] mb-5">
              The Curated <span className="italic font-normal text-burgundy-700 dark:text-dusty-300">Menswear</span> Archive.
            </h1>

            <p className="text-base md:text-lg text-burgundy-900/80 dark:text-sand-200/80 font-sans max-w-2xl leading-relaxed mb-8 font-light">
              Where high-fashion minimalism intersects technical streetwear staples. Real-time 3D inspection, generative AI vibe styling, and direct affiliate drops from premier global ateliers.
            </p>

            <div className="flex flex-wrap items-center gap-3.5">
              <a
                href="#catalog"
                className="px-6 py-3 bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 text-sm font-mono font-bold uppercase tracking-wider shadow-sm hover:bg-burgundy-700 dark:hover:bg-dusty-300 transition-all flex items-center gap-2"
              >
                <span>Explore Pieces</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsVibeModalOpen(true)}
                className="px-6 py-3 bg-white dark:bg-burgundy-900/90 text-burgundy-950 dark:text-creme-100 border border-sand-300 dark:border-burgundy-700 text-sm font-mono font-bold uppercase tracking-wider hover:border-burgundy-600 dark:hover:border-dusty-400 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-dusty-500" />
                <span>AI Stylist</span>
              </button>
              <button
                onClick={() => setIs3DViewerOpen(!is3DViewerOpen)}
                className="px-6 py-3 bg-white dark:bg-burgundy-900/90 text-burgundy-950 dark:text-creme-100 border border-sand-300 dark:border-burgundy-700 text-sm font-mono font-bold uppercase tracking-wider hover:border-burgundy-600 dark:hover:border-dusty-400 transition-all flex items-center gap-2"
              >
                <Box className="w-4 h-4 text-burgundy-600 dark:text-dusty-400" />
                <span>3D Atelier</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section Headline & Filter Info */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-sand-300/80 dark:border-burgundy-800/80">
          <div>
            <div className="flex items-center gap-2 text-sand-700 dark:text-dusty-300/90 text-xs md:text-sm font-mono uppercase tracking-widest mb-1.5 font-semibold">
              <span>ARCHIVE COLLECTION</span>
              <span>//</span>
              <span className="text-burgundy-800 dark:text-creme-200 font-bold">
                {activeMainCategory.toUpperCase()} {activeSubCategory !== "All" && `> ${activeSubCategory.toUpperCase()}`}
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-medium tracking-tight text-burgundy-950 dark:text-creme-100 italic">
              {activeMainCategory === "All" ? "All Curated Silhouettes" : activeMainCategory}
            </h2>
            <p className="text-sm md:text-base text-burgundy-900/70 dark:text-sand-300/70 font-sans mt-2 max-w-xl font-light leading-relaxed">
              Curated silhouettes with direct brand affiliate links. Click '3D Rotate' on high-ticket grails to inspect textures and volume before copping.
            </p>
          </div>

          {/* Search & Sorting Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-sand-500 dark:text-dusty-400/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pieces, brands..."
                className="w-full bg-white dark:bg-burgundy-900/90 border border-sand-300 dark:border-burgundy-800 pl-10 pr-4 py-2.5 text-sm text-burgundy-950 dark:text-creme-100 placeholder-sand-500 dark:placeholder-sand-400/50 focus:outline-none focus:border-burgundy-600 dark:focus:border-dusty-400 font-mono shadow-sm"
              />
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-burgundy-900/90 border border-sand-300 dark:border-burgundy-800 px-3.5 py-2.5 text-sm shadow-sm">
              <ArrowUpDown className="w-4 h-4 text-sand-500 dark:text-dusty-400/60" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-burgundy-950 dark:text-sand-200 font-mono text-sm focus:outline-none cursor-pointer uppercase font-medium"
              >
                <option value="popular" className="bg-white dark:bg-burgundy-950 text-burgundy-950 dark:text-creme-100">Most Hyped</option>
                <option value="newest" className="bg-white dark:bg-burgundy-950 text-burgundy-950 dark:text-creme-100">Newest Additions</option>
                <option value="price_asc" className="bg-white dark:bg-burgundy-950 text-burgundy-950 dark:text-creme-100">Price: Low to High</option>
                <option value="price_desc" className="bg-white dark:bg-burgundy-950 text-burgundy-950 dark:text-creme-100">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Brand Dropdown / Quick Filter Bar */}
        <div className="flex items-center gap-2.5 overflow-x-auto py-4 text-sm font-mono border-b border-sand-200 dark:border-burgundy-800/60 scrollbar-none">
          <span className="text-xs font-bold text-sand-600 dark:text-dusty-400 uppercase whitespace-nowrap">
            Brand Label:
          </span>
          {CURATED_BRANDS.map((b) => {
            const isSelected = selectedBrand.toLowerCase() === b.toLowerCase();
            return (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`px-4 py-1.5 text-xs md:text-sm font-semibold uppercase transition-all whitespace-nowrap border ${
                  isSelected
                    ? 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-400 dark:text-burgundy-950 dark:border-dusty-300 font-bold shadow-sm'
                    : 'bg-white dark:bg-burgundy-900/80 border-sand-300 dark:border-burgundy-800 text-burgundy-900/80 dark:text-sand-300/80 hover:text-burgundy-950 dark:hover:text-white hover:border-burgundy-500 dark:hover:border-dusty-400'
                }`}
              >
                {b}
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="pt-8">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectVibe={(v) => {
                    setActiveVibePrompt(v);
                    setIsVibeModalOpen(true);
                  }}
                  onPreview3D={(prod) => {
                    setPreview3DItem(prod);
                    setIs3DViewerOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 md:p-16 text-center bg-white dark:bg-burgundy-900/40 border border-sand-300 dark:border-burgundy-800 font-mono shadow-sm">
              <h3 className="text-xl md:text-2xl font-bold uppercase text-burgundy-950 dark:text-creme-100 mb-2.5">
                {products.length === 0 ? "CATALOG READY FOR YOUR FIRST DROP" : "NO PIECES MATCHING THIS FILTER"}
              </h3>
              <p className="text-sm text-burgundy-800/80 dark:text-sand-300 mb-6 max-w-md mx-auto">
                {products.length === 0
                  ? "The store is clean with 0 items. Head to the Admin Dashboard to add your brand pieces, high-res photos, and affiliate links."
                  : 'Try selecting "All" or add new items directly from your Admin Dashboard.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {products.length > 0 && (
                  <button
                    onClick={() => {
                      setActiveSubCategory("All");
                      setSelectedBrand("All");
                      setSearchQuery("");
                    }}
                    className="px-5 py-2.5 bg-creme-100 dark:bg-burgundy-950 border border-sand-300 dark:border-burgundy-700 text-burgundy-950 dark:text-creme-100 font-bold text-sm uppercase"
                  >
                    Clear Filters
                  </button>
                )}
                <a
                  href="/admin"
                  className="px-5 py-2.5 bg-burgundy-600 text-creme-100 hover:bg-burgundy-700 dark:bg-dusty-400 dark:text-burgundy-950 font-bold text-sm uppercase shadow-sm"
                >
                  Open Admin Dashboard
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 6. EDITORIAL STREET JOURNAL (BLOG SECTION) */}
      <BlogSection />

      {/* 7. HIGH-FASHION MINIMALIST FOOTER */}
      <footer className="border-t border-sand-300/80 dark:border-burgundy-800/80 bg-white dark:bg-burgundy-950 py-16 font-sans transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Manifesto */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="w-8 h-8 bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 font-display font-bold text-sm flex items-center justify-center shadow-sm">
                SD
              </div>
              <span className="font-display font-bold text-2xl tracking-wider uppercase text-burgundy-950 dark:text-creme-100">
                STREET<span className="text-burgundy-600 dark:text-dusty-400 font-light">DRIP</span>
              </span>
            </div>
            <p className="text-sm text-burgundy-900/80 dark:text-sand-300/80 font-sans max-w-md leading-relaxed font-light">
              Curated menswear platform engineered for the new generation of streetwear purists. Real-time 3D WebGL rendering, generative vibe styling, and direct affiliate access to official global drops.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <ThemeToggle showLabel={true} />
            </div>
          </div>

          {/* Quick Pillars */}
          <div>
            <h4 className="font-mono text-sm uppercase tracking-wider text-burgundy-950 dark:text-creme-100 font-bold mb-3.5">
              Fashion Pillars
            </h4>
            <ul className="space-y-2 text-sm text-burgundy-800/80 dark:text-sand-300/80 font-sans">
              {MAIN_PILLARS.filter(p => p !== "All").map((p) => (
                <li key={p}>
                  <button
                    onClick={() => handleMainCategorySelect(p)}
                    className="hover:text-burgundy-950 dark:hover:text-dusty-300 transition-colors"
                  >
                    {p}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Official Affiliates & Admin */}
          <div>
            <h4 className="font-mono text-sm uppercase tracking-wider text-burgundy-950 dark:text-creme-100 font-bold mb-3.5">
              Direct Affiliates
            </h4>
            <ul className="space-y-2 text-sm text-burgundy-800/80 dark:text-sand-300/80 font-sans">
              <li><a href="https://nike.com" target="_blank" rel="noopener noreferrer" className="hover:text-burgundy-950 dark:hover:text-white">Nike Official Store</a></li>
              <li><a href="https://zara.com" target="_blank" rel="noopener noreferrer" className="hover:text-burgundy-950 dark:hover:text-white">Zara Atelier</a></li>
              <li><a href="https://bewakoof.com" target="_blank" rel="noopener noreferrer" className="hover:text-burgundy-950 dark:hover:text-white">Bewakoof Streetwear</a></li>
              <li><a href="https://levi.com" target="_blank" rel="noopener noreferrer" className="hover:text-burgundy-950 dark:hover:text-white">Levi's Red Tab</a></li>
              <li className="pt-2">
                <a href="/admin" className="text-burgundy-700 dark:text-dusty-400 font-mono text-sm font-bold underline">
                  Admin Vault Portal →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-sand-200/80 dark:border-burgundy-900/60 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-sand-600 dark:text-sand-400 gap-3">
          <div>© 2026 STREETDRIP PLATFORM. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-5">
            <span>TERMS</span>
            <span>PRIVACY</span>
            <span>AFFILIATE DISCLOSURE</span>
          </div>
        </div>
      </footer>

      {/* 8. AI VIBE STYLIST MODAL */}
      <AIVibeModal
        isOpen={isVibeModalOpen}
        onClose={() => setIsVibeModalOpen(false)}
        initialVibe={activeVibePrompt}
      />
    </div>
  );
}
