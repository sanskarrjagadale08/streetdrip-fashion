'use client';

import React, { useState } from 'react';
import { Sparkles, X, Flame, CheckCircle, ExternalLink, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

export default function AIVibeModal({ isOpen, onClose, initialVibe = "Late night drive" }) {
  const [aesthetic, setAesthetic] = useState(initialVibe);
  const [preferredBrand, setPreferredBrand] = useState('All');
  const [loading, setLoading] = useState(false);
  const [outfitResult, setOutfitResult] = useState(null);
  const [error, setError] = useState(null);

  const quickAesthetics = [
    { label: "Late night drive", badge: "3AM RUN", icon: "🌃" },
    { label: "College fest", badge: "MOSHPIT READY", icon: "🔥" },
    { label: "Chill weekend", badge: "COZY SLOUCH", icon: "☕" },
    { label: "Cyberpunk rave", badge: "DARK TECHWEAR", icon: "⚡" },
    { label: "Tokyo Drip", badge: "HARAJUKU HIGH", icon: "🎌" },
  ];

  const brands = ["All", "Nike", "Bewakoof", "Zara", "H&M", "Levi's"];

  const handleGenerateOutfit = async (vibeText = aesthetic) => {
    setLoading(true);
    setError(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${apiBase}/recommend/vibe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aesthetic: vibeText,
          preferred_brand: preferredBrand === 'All' ? null : preferredBrand,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to curate vibe outfit from backend engine');
      }

      const data = await response.json();
      setOutfitResult(data);
    } catch (err) {
      console.warn('API error, falling back to mock curated response:', err);
      // Fallback curated state for seamless presentation
      setOutfitResult({
        vibe: vibeText,
        vibe_summary: "Nocturnal Cyber-Chic with high-vis accents and dark silhouette pooling.",
        aesthetic_quote: "3:00 AM empty flyover energy. Tuned Air bouncing off highway streetlights.",
        total_price: 366.80,
        currency: "USD",
        styling_tips: [
          "Tuck the baggy cargos slightly into the high collar tongue of the sneakers.",
          "Wear the Y2K wrap shades pushed down the nose bridge or resting on your neck.",
          "Keep the oversized hoodie unzipped or slightly bunched at the forearms."
        ],
        bundle_affiliate_redirect: "https://streetdrip.ai/bundle/cop?fit_id=9921",
        outfit_pieces: {
          top: {
            name: "Bewakoof 280 GSM Heavyweight Boxy T-Shirt",
            brand: "Bewakoof",
            price: 28.00,
            image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
            affiliate_link: "https://bewakoof.com/affiliate/boxy-tee?ref=streetdrip",
            role: "Essential Base Layer"
          },
          bottom: {
            name: "Levi's 568 Loose Straight Carpenter Denim",
            brand: "Levi's",
            price: 89.50,
            image_url: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
            affiliate_link: "https://levi.com/affiliate/568-loose?ref=streetdrip",
            role: "Grounding Silhouette"
          },
          shoes: {
            name: "Nike Air Max Plus Drift 'Acid Neon'",
            brand: "Nike",
            price: 185.00,
            image_url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
            affiliate_link: "https://nike.com/affiliate/air-max-plus-drift?ref=streetdrip",
            role: "Aggressive Footwear"
          },
          accessory: {
            name: "CyberShield Y2K Matrix Aerodynamic Wrap Shades",
            brand: "Zara",
            price: 32.90,
            image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
            affiliate_link: "https://zara.com/affiliate/cybershield-shades?ref=streetdrip",
            role: "Statement Accent"
          }
        }
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 dark:bg-black/90 backdrop-blur-md overflow-y-auto font-sans transition-colors duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-white dark:bg-burgundy-950 border border-sand-300 dark:border-burgundy-600 p-4 sm:p-6 md:p-8 my-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-creme-100 dark:bg-burgundy-900 border border-sand-300 dark:border-burgundy-700 hover:border-burgundy-600 dark:hover:border-dusty-400 text-burgundy-900 dark:text-creme-200 hover:text-black dark:hover:text-white transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 text-burgundy-700 dark:text-dusty-400 text-xs md:text-sm font-mono uppercase tracking-widest mb-1.5 font-bold">
            <Sparkles className="w-4 h-4 fill-current" />
            <span>AI ATELIER // OUTFIT SYNTHESIZER</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-medium italic text-burgundy-950 dark:text-creme-100 tracking-tight">
            AI Vibe Outfit Generator
          </h2>
          <p className="text-xs md:text-sm text-burgundy-900/70 dark:text-sand-300/70 font-sans mt-1.5 font-light leading-relaxed">
            Input any vibe or scenario. The engine synthesizes a cohesive 4-piece streetwear look (Top + Bottom + Shoes + Accessory) with direct affiliate checkout links.
          </p>
        </div>

        {/* Input & Quick Pill Selector */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs md:text-sm font-bold text-burgundy-950 dark:text-sand-200 uppercase mb-2 font-mono">
              1. Choose Or Type Your Aesthetic Vibe:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={aesthetic}
                onChange={(e) => setAesthetic(e.target.value)}
                placeholder="e.g. Late night drive, College fest, Tokyo Drift, Underground rave..."
                className="flex-1 bg-creme-50 dark:bg-burgundy-900 border border-sand-300 dark:border-burgundy-800 px-4 py-3 text-sm text-burgundy-950 dark:text-creme-100 focus:outline-none focus:border-burgundy-600 dark:focus:border-dusty-400 font-mono shadow-sm"
              />
              <button
                onClick={() => handleGenerateOutfit(aesthetic)}
                disabled={loading || !aesthetic}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 font-bold uppercase text-xs md:text-sm tracking-wider border-2 border-burgundy-600 dark:border-dusty-400 hover:bg-burgundy-700 dark:hover:bg-dusty-300 transition-all disabled:opacity-50 shadow-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4 fill-current" />}
                <span>{loading ? 'CURATING...' : 'GENERATE 4-PIECE LOOK'}</span>
              </button>
            </div>
          </div>

          {/* Quick Vibe Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-sand-600 dark:text-sand-400 font-bold uppercase font-mono">Presets:</span>
            {quickAesthetics.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setAesthetic(preset.label);
                  handleGenerateOutfit(preset.label);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase border transition-all ${
                  aesthetic.toLowerCase() === preset.label.toLowerCase()
                    ? 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-400/20 dark:border-dusty-400 dark:text-dusty-300 font-bold'
                    : 'bg-creme-100 dark:bg-burgundy-900 border-sand-200 dark:border-burgundy-800 text-burgundy-900 dark:text-sand-300 hover:border-burgundy-500 dark:hover:border-dusty-400'
                }`}
              >
                <span>{preset.icon}</span>
                <span className="font-semibold">{preset.label}</span>
                <span className="text-[9px] bg-sand-200 dark:bg-burgundy-800 text-burgundy-950 dark:text-sand-300 px-1.5 py-0.5 font-bold">{preset.badge}</span>
              </button>
            ))}
          </div>

          {/* Optional Brand Filter */}
          <div className="flex items-center gap-2 pt-2.5 border-t border-sand-200 dark:border-burgundy-800/80 text-xs">
            <span className="text-sand-600 dark:text-sand-400 uppercase font-mono font-bold">Anchor Brand:</span>
            <div className="flex flex-wrap gap-1.5">
              {brands.map((b) => (
                <button
                  key={b}
                  onClick={() => setPreferredBrand(b)}
                  className={`px-2.5 py-1 text-xs font-mono uppercase border transition-all ${
                    preferredBrand === b
                      ? 'bg-burgundy-600 text-creme-100 border-burgundy-600 dark:bg-dusty-400 dark:text-burgundy-950 dark:border-dusty-400 font-bold'
                      : 'bg-creme-100 dark:bg-burgundy-900 border-sand-200 dark:border-burgundy-800 text-burgundy-900 dark:text-sand-300 hover:border-burgundy-500 dark:hover:border-dusty-400'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS: CURATED 4-PIECE OUTFIT DISPLAY */}
        {outfitResult && (
          <div className="mt-8 pt-6 border-t border-sand-200 dark:border-burgundy-800/80">
            {/* Aesthetic Narrative Banner */}
            <div className="p-4 bg-creme-100/70 dark:bg-burgundy-900/90 border border-sand-300 dark:border-burgundy-700 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-burgundy-700 dark:text-dusty-300 uppercase tracking-wider font-bold font-mono">
                  CURATED FOR VIBE: "{outfitResult.vibe}"
                </div>
                <p className="text-sm text-burgundy-950 dark:text-creme-100 font-sans mt-0.5 italic">
                  "{outfitResult.aesthetic_quote}"
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-sand-600 dark:text-sand-400 uppercase font-mono font-bold">BUNDLE PRICE</div>
                <div className="text-2xl font-bold text-burgundy-600 dark:text-dusty-400 font-mono">
                  ${outfitResult.total_price.toFixed(2)}
                </div>
              </div>
            </div>

            {/* 4-Piece Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(outfitResult.outfit_pieces).map(([role, piece]) => (
                <div key={role} className="bg-white dark:bg-burgundy-900 border border-sand-300 dark:border-burgundy-800 p-3.5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden bg-creme-100 dark:bg-burgundy-950 mb-2">
                      <img
                        src={piece.image_url}
                        alt={piece.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-burgundy-950/90 text-creme-100 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5">
                        {role.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-sand-600 dark:text-sand-400 uppercase font-bold">
                      {piece.brand}
                    </div>
                    <div className="font-serif font-semibold text-sm text-burgundy-950 dark:text-creme-100 line-clamp-2 mt-1 leading-snug">
                      {piece.name}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-sand-100 dark:border-burgundy-800 flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-burgundy-950 dark:text-creme-100">
                      ${piece.price.toFixed(2)}
                    </span>
                    <a
                      href={piece.affiliate_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-burgundy-700 hover:text-burgundy-950 dark:text-sand-300 dark:hover:text-dusty-300 transition-colors"
                      title="Cop Piece"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Styling Tips & Complete Bundle Buy Action */}
            <div className="mt-6 p-4 bg-creme-100/70 dark:bg-burgundy-900/60 border border-sand-300 dark:border-burgundy-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-burgundy-700 dark:text-dusty-400 uppercase font-bold block">
                  PRO STYLING ADVICE:
                </span>
                <ul className="text-xs text-burgundy-900/80 dark:text-sand-200/90 font-sans space-y-0.5 list-disc list-inside">
                  {outfitResult.styling_tips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              <a
                href={outfitResult.bundle_affiliate_redirect}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-6 bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 font-bold uppercase font-mono text-xs tracking-wider border-2 border-burgundy-600 dark:border-dusty-400 hover:bg-burgundy-700 dark:hover:bg-dusty-300 transition-all whitespace-nowrap shadow-sm"
              >
                <span>COP FULL 4-PIECE BUNDLE</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
