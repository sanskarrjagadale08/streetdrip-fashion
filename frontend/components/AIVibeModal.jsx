'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, X, Flame, ExternalLink, ArrowRight, Loader2, RefreshCw, Layers } from 'lucide-react';
import { getApiBaseUrl, getLocalProducts } from '../lib/adminApi';

const CURATED_BRANDS = [
  "All",
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
  "Adidas"
];

const QUICK_AESTHETICS = [
  { label: "Late night drive", badge: "3AM RUN", icon: "🌃" },
  { label: "College fest", badge: "MOSHPIT READY", icon: "🔥" },
  { label: "Chill weekend", badge: "COZY SLOUCH", icon: "☕" },
  { label: "Cyberpunk rave", badge: "DARK TECHWEAR", icon: "⚡" },
  { label: "Tokyo Drip", badge: "HARAJUKU HIGH", icon: "🎌" },
];

const OUTFIT_TEMPLATES = {
  "late night drive": {
    vibe_summary: "Nocturnal Cyber-Chic with high-vis accents and dark silhouette pooling.",
    aesthetic_quote: "3:00 AM empty flyover energy. Tuned Air bouncing off highway streetlights.",
    styling_tips: [
      "Let wide-leg bottoms pool naturally over bulky outsoles.",
      "Wear aerodynamic wrap shades resting on the collar or neck.",
      "Keep inner layers tucked boxy beneath oversized outerwear."
    ],
    pieces: {
      top: {
        name: "Heavyweight 280 GSM Drop-Shoulder Boxy Tee",
        brand: "Snitch",
        price: 1499,
        image_url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://snitch.co.in/collections/t-shirts?ref=streetdrip",
        role: "Essential Base Layer"
      },
      bottom: {
        name: "Loose Carpenter Baggy Denim with Knee Darts",
        brand: "Bonkers",
        price: 2799,
        image_url: "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://bonkerscorner.com/collections/bottoms?ref=streetdrip",
        role: "Grounding Silhouette"
      },
      shoes: {
        name: "Chunky Air Drift Cyber Platform Sneakers",
        brand: "Nike",
        price: 9999,
        image_url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://nike.com/in/w/mens-lifestyle-shoes?ref=streetdrip",
        role: "Aggressive Footwear"
      },
      accessory: {
        name: "Blade Y2K Aerodynamic Silver Mirror Wrap Shades",
        brand: "Urban Monkey",
        price: 1499,
        image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://urbanmonkey.com/collections/eyewear?ref=streetdrip",
        role: "Statement Eyewear"
      }
    }
  },
  "college fest": {
    vibe_summary: "High-Energy Festival Loud with cyber-tribal accents and functional pockets.",
    aesthetic_quote: "Subwoofer bass shaking the campus ground. Heavyweight cotton and moshpit resilience.",
    styling_tips: [
      "Cinch ankle toggles of the cargo trousers to highlight sneaker tongue details.",
      "Layer a raw-edge white tank peeking 1-inch beneath the boxy tee.",
      "Keep festival cards and phone secured in the zipped thigh cargo gussets."
    ],
    pieces: {
      top: {
        name: "Oversized Acid Graphic Cyber-Mesh Jersey",
        brand: "Souled Store",
        price: 1799,
        image_url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://thesouledstore.com/collections/oversized-t-shirts?ref=streetdrip",
        role: "Moshpit Top"
      },
      bottom: {
        name: "Multi-Pocket Tactical Techwear Baggy Cargos",
        brand: "Snitch",
        price: 2999,
        image_url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://snitch.co.in/collections/cargo-pants?ref=streetdrip",
        role: "Utility Lower"
      },
      shoes: {
        name: "Retro High-Top Skate Court Sneakers",
        brand: "Adidas",
        price: 6499,
        image_url: "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://adidas.co.in/men-shoes?ref=streetdrip",
        role: "Court Kicks"
      },
      accessory: {
        name: "Heavy Washed Twill Curved Dad Cap with Metal Buckle",
        brand: "Urban Monkey",
        price: 1199,
        image_url: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://urbanmonkey.com/collections/caps?ref=streetdrip",
        role: "Headwear Accent"
      }
    }
  },
  "chill weekend": {
    vibe_summary: "Laidback Architectural Drape with neutral organic tones and fluid silhouettes.",
    aesthetic_quote: "Slow Sunday café acoustics. Soft breathable linen and relaxed proportions.",
    styling_tips: [
      "Leave the camp collar overshirt unbuttoned over a light ribbed tank.",
      "Let pleated trousers break once over minimalist loafers.",
      "Contrast warm sand tones against subtle brushed silver jewelry."
    ],
    pieces: {
      top: {
        name: "Vintage Washed Boxy Camp Collar Linen Overshirt",
        brand: "Vastrado",
        price: 1899,
        image_url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://vastrado.com/collections/shirts?ref=streetdrip",
        role: "Fluid Layer"
      },
      bottom: {
        name: "Wide-Leg Double-Pleated Korean Drape Trousers",
        brand: "Zara",
        price: 3290,
        image_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://zara.com/in/en/man-trousers-l817.html?ref=streetdrip",
        role: "Tailored Lower"
      },
      shoes: {
        name: "Minimalist Low-Profile Off-White Court Derbies",
        brand: "H&M",
        price: 2999,
        image_url: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://www2.hm.com/en_in/men/shoes.html?ref=streetdrip",
        role: "Clean Footwear"
      },
      accessory: {
        name: "Minimalist Titanium Round Wireframe Glasses",
        brand: "General",
        price: 1499,
        image_url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://streetdrip-fashion.vercel.app/#catalog",
        role: "Subtle Frame"
      }
    }
  },
  "cyberpunk rave": {
    vibe_summary: "Dark Industrial Techwear with weather-resistant shells and chromatic eyewear.",
    aesthetic_quote: "Subterranean club frequency. High-tensile nylon meeting industrial hardware.",
    styling_tips: [
      "Lock nylon utility straps across knees for structured silhouette.",
      "Contrast matte water-repellent fabrics against polished chrome accessories.",
      "Black out base layers to emphasize angular outerwear lines."
    ],
    pieces: {
      top: {
        name: "Thermal-Reactive Compression Mock Neck Layer",
        brand: "Bonkers",
        price: 2299,
        image_url: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://bonkerscorner.com?ref=streetdrip",
        role: "Base Shell"
      },
      bottom: {
        name: "Waterproof Asymmetrical Cobra-Buckle Tactical Cargos",
        brand: "Snitch",
        price: 3499,
        image_url: "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://snitch.co.in/collections/cargos?ref=streetdrip",
        role: "Hardware Lower"
      },
      shoes: {
        name: "Monolithic Chunky Foam Runner Tread Boots",
        brand: "Nike",
        price: 10999,
        image_url: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://nike.com/in?ref=streetdrip",
        role: "Monolithic Sole"
      },
      accessory: {
        name: "Liquid Metal Polarized Visor Shield Shades",
        brand: "Zara",
        price: 2290,
        image_url: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://zara.com/in?ref=streetdrip",
        role: "Chrome Visor"
      }
    }
  },
  "tokyo drip": {
    vibe_summary: "Harajuku Avant-Garde Proportion with oversized balloon silhouettes.",
    aesthetic_quote: "Shibuya crossing overcast skies. Exaggerated raw indigo volume and skate attitude.",
    styling_tips: [
      "Balance the extreme balloon volume of bottoms with cropped boxy top.",
      "Allow raw denim hems to pool slightly over chunky lug soles.",
      "Attach vintage key hardware to the exposed front belt loop."
    ],
    pieces: {
      top: {
        name: "Raw Frayed-Edge Boxy Heavy Denim Overshirt",
        brand: "H&M",
        price: 2999,
        image_url: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://www2.hm.com/en_in?ref=streetdrip",
        role: "Structured Top"
      },
      bottom: {
        name: "Ultra-Wide Balloon Skater Jeans (14oz Raw Indigo)",
        brand: "Bonkers",
        price: 2899,
        image_url: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://bonkerscorner.com/collections/denim?ref=streetdrip",
        role: "Balloon Denim"
      },
      shoes: {
        name: "Deconstructed Chunky Lug-Sole Platform Derbies",
        brand: "Zara",
        price: 4990,
        image_url: "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://zara.com/in?ref=streetdrip",
        role: "Lug Footwear"
      },
      accessory: {
        name: "Retro Micro Acetate Minimalist Oval Sunglasses",
        brand: "Urban Monkey",
        price: 1299,
        image_url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
        affiliate_link: "https://urbanmonkey.com?ref=streetdrip",
        role: "Micro Frames"
      }
    }
  }
};

function synthesizeClientOutfit(aesthetic = "Late night drive", preferredBrand = 'All', userProducts = []) {
  const normKey = (aesthetic || "late night drive").toLowerCase().trim();
  let matched = null;
  for (const [key, tpl] of Object.entries(OUTFIT_TEMPLATES)) {
    if (key.includes(normKey) || normKey.includes(key)) {
      matched = tpl;
      break;
    }
  }
  if (!matched) {
    matched = OUTFIT_TEMPLATES["late night drive"];
  }

  // Deep clone pieces
  const pieces = {
    top: { ...matched.pieces.top },
    bottom: { ...matched.pieces.bottom },
    shoes: { ...matched.pieces.shoes },
    accessory: { ...matched.pieces.accessory }
  };

  if (preferredBrand && preferredBrand !== 'All') {
    pieces.top.brand = preferredBrand;
    pieces.bottom.brand = preferredBrand;
  }

  // Integrate live user products from local vault if available
  if (Array.isArray(userProducts) && userProducts.length > 0) {
    const valid = userProducts.filter(p => p && !p.is_taken_down && p.drop_status !== 'TAKEN DOWN');
    if (valid.length > 0) {
      const topProd = valid.find(p => ['T-Shirts', 'Shirts'].includes(p.main_category) || /shirt|tee|top/i.test(p.category || ''));
      if (topProd) {
        pieces.top = {
          name: topProd.name || pieces.top.name,
          brand: topProd.brand || pieces.top.brand,
          price: Number(topProd.price) || pieces.top.price,
          image_url: topProd.image_url || pieces.top.image_url,
          affiliate_link: topProd.affiliate_link || pieces.top.affiliate_link,
          role: `${topProd.sub_category || 'Top'} (Your Vault)`
        };
      }
      const bottomProd = valid.find(p => p.main_category === 'Lowers' || /lower|jean|pant|cargo|trouser/i.test(p.category || ''));
      if (bottomProd) {
        pieces.bottom = {
          name: bottomProd.name || pieces.bottom.name,
          brand: bottomProd.brand || pieces.bottom.brand,
          price: Number(bottomProd.price) || pieces.bottom.price,
          image_url: bottomProd.image_url || pieces.bottom.image_url,
          affiliate_link: bottomProd.affiliate_link || pieces.bottom.affiliate_link,
          role: `${bottomProd.sub_category || 'Lower'} (Your Vault)`
        };
      }
      const shoeProd = valid.find(p => p.main_category === 'Shoes' || /shoe|sneaker|clog|boot/i.test(p.category || ''));
      if (shoeProd) {
        pieces.shoes = {
          name: shoeProd.name || pieces.shoes.name,
          brand: shoeProd.brand || pieces.shoes.brand,
          price: Number(shoeProd.price) || pieces.shoes.price,
          image_url: shoeProd.image_url || pieces.shoes.image_url,
          affiliate_link: shoeProd.affiliate_link || pieces.shoes.affiliate_link,
          role: `${shoeProd.sub_category || 'Footwear'} (Your Vault)`
        };
      }
      const accProd = valid.find(p => ['Jackets', 'Glasses'].includes(p.main_category) || /jacket|glass|shade|layer/i.test(p.category || ''));
      if (accProd) {
        pieces.accessory = {
          name: accProd.name || pieces.accessory.name,
          brand: accProd.brand || pieces.accessory.brand,
          price: Number(accProd.price) || pieces.accessory.price,
          image_url: accProd.image_url || pieces.accessory.image_url,
          affiliate_link: accProd.affiliate_link || pieces.accessory.affiliate_link,
          role: `${accProd.sub_category || 'Accent'} (Your Vault)`
        };
      }
    }
  }

  const totalPrice = Object.values(pieces).reduce((sum, p) => sum + (Number(p.price) || 0), 0);
  const primaryAffiliate = Object.values(pieces).find(p => p.affiliate_link && p.affiliate_link !== '#')?.affiliate_link || 'https://streetdrip-fashion.vercel.app/#catalog';

  return {
    vibe: aesthetic || "Late night drive",
    vibe_summary: matched.vibe_summary,
    aesthetic_quote: matched.aesthetic_quote,
    total_price: totalPrice,
    currency: "INR",
    outfit_pieces: pieces,
    styling_tips: matched.styling_tips,
    bundle_affiliate_redirect: primaryAffiliate
  };
}

export default function AIVibeModal({ isOpen, onClose, initialVibe = "Late night drive" }) {
  const [aesthetic, setAesthetic] = useState(initialVibe);
  const [preferredBrand, setPreferredBrand] = useState('All');
  const [loading, setLoading] = useState(false);
  const [outfitResult, setOutfitResult] = useState(null);

  // Sync initialVibe prop when it changes
  useEffect(() => {
    if (initialVibe) {
      setAesthetic(initialVibe);
    }
  }, [initialVibe]);

  // Auto-generate outfit on modal open if not already generated
  useEffect(() => {
    if (isOpen) {
      const target = initialVibe || aesthetic || "Late night drive";
      handleGenerateOutfit(target, preferredBrand);
    }
  }, [isOpen, initialVibe]);

  const handleGenerateOutfit = async (vibeText = aesthetic, brand = preferredBrand) => {
    setLoading(true);

    const apiBase = getApiBaseUrl();
    const localProducts = typeof window !== 'undefined' ? getLocalProducts() : [];

    try {
      // Abort controller timeout to prevent infinite spinner if backend cold starts
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const response = await fetch(`${apiBase}/recommend/vibe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aesthetic: vibeText,
          preferred_brand: brand === 'All' ? null : brand,
          catalog: localProducts,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error('Backend responded with non-200');
      }

      const data = await response.json();
      if (!data || !data.outfit_pieces || Object.keys(data.outfit_pieces).length === 0) {
        throw new Error('Empty outfit pieces from backend');
      }
      setOutfitResult(data);
    } catch (err) {
      // Graceful instant synthesis fallback using local database
      const fallbackOutfit = synthesizeClientOutfit(vibeText, brand, localProducts);
      setOutfitResult(fallbackOutfit);
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (brand) => {
    setPreferredBrand(brand);
    handleGenerateOutfit(aesthetic, brand);
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
                onClick={() => handleGenerateOutfit(aesthetic, preferredBrand)}
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
            {QUICK_AESTHETICS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setAesthetic(preset.label);
                  handleGenerateOutfit(preset.label, preferredBrand);
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
          <div className="pt-2.5 border-t border-sand-200 dark:border-burgundy-800/80">
            <span className="text-xs text-sand-600 dark:text-sand-400 uppercase font-mono font-bold block mb-1.5">
              Anchor Brand:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {CURATED_BRANDS.map((b) => (
                <button
                  key={b}
                  onClick={() => handleBrandSelect(b)}
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
                <div className="text-xs text-burgundy-900/70 dark:text-sand-300/80 font-mono mt-1">
                  {outfitResult.vibe_summary}
                </div>
              </div>
              <div className="text-right flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-2 md:pt-0 border-sand-200 dark:border-burgundy-800">
                <div className="text-xs text-sand-600 dark:text-sand-400 uppercase font-mono font-bold">TOTAL FIT PRICE</div>
                <div className="text-2xl font-bold text-burgundy-600 dark:text-dusty-400 font-mono">
                  ₹{Number(outfitResult.total_price || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* 4-Piece Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(outfitResult.outfit_pieces || {}).map(([role, piece = {}]) => (
                <div key={role} className="bg-white dark:bg-burgundy-900 border border-sand-300 dark:border-burgundy-800 p-3.5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="relative aspect-square w-full overflow-hidden bg-creme-100 dark:bg-burgundy-950 mb-2">
                      <img
                        src={piece?.image_url || 'https://images.unsplash.com/photo-1542272604-780c96856592'}
                        alt={piece?.name || 'Piece'}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-burgundy-950/90 text-creme-100 text-[9px] font-mono font-bold uppercase px-1.5 py-0.5">
                        {String(role).toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-sand-600 dark:text-sand-400 uppercase font-bold">
                      {piece?.brand || 'General'}
                    </div>
                    <div className="font-serif font-semibold text-sm text-burgundy-950 dark:text-creme-100 line-clamp-2 mt-1 leading-snug">
                      {piece?.name || 'Curated Piece'}
                    </div>
                    {piece?.role && (
                      <div className="text-[10px] text-burgundy-700/80 dark:text-dusty-300/80 font-mono mt-0.5 italic">
                        {piece.role}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-sand-100 dark:border-burgundy-800 flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-burgundy-950 dark:text-creme-100">
                      ₹{Number(piece?.price || 0).toLocaleString('en-IN')}
                    </span>
                    <a
                      href={piece?.affiliate_link || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-burgundy-700 hover:text-burgundy-950 dark:text-dusty-300 dark:hover:text-white transition-colors"
                      title="Cop Piece"
                    >
                      <span>COP</span>
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
                  {(outfitResult.styling_tips || []).map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
                <button
                  onClick={() => handleGenerateOutfit(aesthetic, preferredBrand)}
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 bg-transparent text-burgundy-900 dark:text-creme-100 font-bold uppercase font-mono text-xs tracking-wider border border-sand-400 dark:border-burgundy-700 hover:border-burgundy-600 dark:hover:border-dusty-400 transition-all"
                  title="Regenerate Look"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>REMIX FIT</span>
                </button>

                <a
                  href={outfitResult.bundle_affiliate_redirect || 'https://streetdrip-fashion.vercel.app/#catalog'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 font-bold uppercase font-mono text-xs tracking-wider border-2 border-burgundy-600 dark:border-dusty-400 hover:bg-burgundy-700 dark:hover:bg-dusty-300 transition-all whitespace-nowrap shadow-sm"
                >
                  <span>COP FULL 4-PIECE BUNDLE</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
