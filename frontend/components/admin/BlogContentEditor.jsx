'use client';

import React, { useState, useRef } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  Quote, 
  List, 
  ListOrdered, 
  Minus, 
  Code, 
  Sparkles, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  Type, 
  Highlighter, 
  Palette, 
  Layers, 
  Eye, 
  Columns, 
  Edit3,
  HelpCircle
} from 'lucide-react';
import BlogContentRenderer from '../BlogContentRenderer';

export default function BlogContentEditor({ value, onChange, placeholder = "Write your editorial article..." }) {
  const textareaRef = useRef(null);
  const [viewMode, setViewMode] = useState('split'); // 'write' | 'preview' | 'split'
  const [activeColorMenu, setActiveColorMenu] = useState(false);
  const [activeHighlightMenu, setActiveHighlightMenu] = useState(false);
  const [activeFontMenu, setActiveFontMenu] = useState(false);
  const [activeSizeMenu, setActiveSizeMenu] = useState(false);
  const [activeTemplateMenu, setActiveTemplateMenu] = useState(false);

  // Helper to wrap selected text or insert template at cursor
  const insertFormatting = (prefix, suffix = '', defaultPlaceholder = 'styled text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end) || defaultPlaceholder;

    const before = value.substring(0, start);
    const after = value.substring(end);

    const replacement = `${prefix}${selectedText}${suffix}`;
    const newValue = `${before}${replacement}${after}`;

    onChange(newValue);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 10);
  };

  // Preset Fashion Colors
  const colors = [
    { label: 'Neon Lime', code: '#CCFF00', class: 'text-neon-lime' },
    { label: 'Tokyo Cyan', code: '#00F0FF', class: 'text-neon-cyan' },
    { label: 'Sunset Tangerine', code: '#FF5500', class: 'text-neon-orange' },
    { label: 'Hyper Pink', code: '#FF007F', class: 'text-neon-pink' },
    { label: 'Royal Violet', code: '#A855F7', class: 'text-neon-purple' },
    { label: 'Gold Amber', code: '#EAB308', class: 'text-amber-400' },
    { label: 'Pure White', code: '#FFFFFF', class: 'text-white' },
    { label: 'Muted Zinc', code: '#A1A1AA', class: 'text-zinc-400' },
  ];

  // Preset Fashion Highlight Badges
  const highlights = [
    { label: 'Acid Lime Badge', class: 'fashion-highlight-lime', bg: 'bg-[#CCFF00] text-black' },
    { label: 'Cyan Rave Badge', class: 'fashion-highlight-cyan', bg: 'bg-[#00F0FF] text-black' },
    { label: 'Hazard Orange Badge', class: 'fashion-highlight-orange', bg: 'bg-[#FF5500] text-white' },
    { label: 'Magenta Badge', class: 'fashion-highlight-pink', bg: 'bg-[#FF007F] text-white' },
    { label: 'Gold Luxury Badge', class: 'fashion-highlight-gold', bg: 'bg-[#EAB308] text-black' },
  ];

  // Preset Fashion Typography Families
  const fonts = [
    { label: 'Modern Sans (Clean)', class: 'font-modern-sans', preview: 'Aa Sans' },
    { label: 'Luxury Editorial Serif', class: 'font-editorial', preview: 'Aa Serif' },
    { label: 'Techwear Monospace', class: 'font-streetwear-mono', preview: 'Aa Mono' },
    { label: 'Heavy Street Graphic', class: 'font-streetwear-display', preview: 'AA HEAVY' },
  ];

  // Preset Sizes
  const sizes = [
    { label: 'Title (H1 - 32px)', prefix: '# ', suffix: '', sample: 'Title Headline' },
    { label: 'Header (H2 - 24px)', prefix: '## ', suffix: '', sample: 'Section Heading' },
    { label: 'Subhead (H3 - 20px)', prefix: '### ', suffix: '', sample: 'Subsection' },
    { label: 'Lead Paragraph (18px)', prefix: '<span style="font-size: 1.15rem; line-height: 1.7; display: block; margin-bottom: 0.75rem;">', suffix: '</span>', sample: 'Lead Paragraph' },
    { label: 'Standard Body (15px)', prefix: '', suffix: '', sample: 'Normal Text' },
    { label: 'Micro Caption (12px)', prefix: '<span style="font-size: 0.75rem; opacity: 0.75;">', suffix: '</span>', sample: 'Footnote / Caption' },
  ];

  // Editorial Preset Templates
  const templates = [
    {
      label: '⚡ Fit Guide & Proportions Breakdown',
      content: `### Silhouette & Volume Breakdown
When styling heavy-draped silhouettes, the foundational golden ratio is **tight-loose** or **cropped-wide**.

<blockquote class="drip-quote">
"True modern streetwear is dictated by proportions, drape, and structural weight rather than bold logos."
</blockquote>

<div class="fit-advice-box">
  <strong class="text-neon-cyan block mb-1">⚡ THE 3-PIECE PROPORTION RULE:</strong>
  1. <strong>Top:</strong> Cropped or structured boxy fit that ends at your belt line.<br/>
  2. <strong>Bottom:</strong> Floor-grazing baggy trousers or cargo stacked with subtle drag.<br/>
  3. <strong>Footwear:</strong> Bulky chunky sneaker or lugged boot to ground the drape.
</div>

### Fabric & Weight Architecture
• <span class="fashion-highlight-lime">Heavyweight French Terry:</span> 450–500 GSM loopback cotton ensures the shoulder drop doesn't collapse.
• <span class="fashion-highlight-cyan">Selvedge Japanese Denim:</span> 14oz raw or stone-washed for stiff geometric stacking.
`
    },
    {
      label: '🎌 Streetwear Editorial & Runway Trend Essay',
      content: `## The Evolution of Contemporary Street Culture

Over the past decade, streetwear shifted from graphic logos to **architectural silhouettes** and **fabric-first engineering**.

<div class="fit-advice-box">
  <span class="text-neon-lime font-bold block mb-1">💡 CURATOR NOTE:</span>
  The modern Gen Z consumer values garment construction, vintage washes, and customized silhouettes over overt branding.
</div>

### Key Elements to Master:
1. **Drop-Shoulder Physics:** Ensure the seam lands 2-3 inches off your natural shoulder.
2. **Textural Contrasts:** Pair distressed denim with smooth washed leather.
3. **Monochrome Layering:** Utilize subtle shade gradients from washed sage to deep forest obsidian.

---

<blockquote class="drip-quote">
"Understated luxury meets high-utility street performance."
</blockquote>
`
    }
  ];

  // Stats
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;
  const readTimeEst = Math.max(1, Math.ceil(wordCount / 180));

  return (
    <div className="border border-white/15 bg-void-950 rounded-sm overflow-hidden font-mono text-xs shadow-lg">
      {/* Top View Mode Switcher & Stats Bar */}
      <div className="bg-void-900 border-b border-white/10 px-3 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode('write')}
            className={`flex items-center gap-1.5 px-3 py-1.5 uppercase font-bold text-[11px] transition-all ${
              viewMode === 'write' ? 'bg-neon-lime text-black font-black' : 'text-zinc-400 hover:text-white bg-void-950 border border-white/10'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Write Mode</span>
          </button>
          
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 uppercase font-bold text-[11px] transition-all ${
              viewMode === 'split' ? 'bg-neon-lime text-black font-black' : 'text-zinc-400 hover:text-white bg-void-950 border border-white/10'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 uppercase font-bold text-[11px] transition-all ${
              viewMode === 'preview' ? 'bg-neon-lime text-black font-black' : 'text-zinc-400 hover:text-white bg-void-950 border border-white/10'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Reader Preview</span>
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-[10px] text-zinc-400">
          <span><strong>{wordCount}</strong> words</span>
          <span>•</span>
          <span><strong>{charCount}</strong> chars</span>
          <span>•</span>
          <span className="text-neon-lime">~{readTimeEst} min read</span>
        </div>
      </div>

      {/* STYLING TOOLBAR */}
      <div className="bg-void-900/95 border-b border-white/10 p-2 flex flex-wrap items-center gap-1.5 select-none relative z-20">
        
        {/* FONT FAMILY DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setActiveFontMenu(!activeFontMenu);
              setActiveSizeMenu(false);
              setActiveColorMenu(false);
              setActiveHighlightMenu(false);
              setActiveTemplateMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime uppercase text-[11px] font-bold"
            title="Choose Font Family"
          >
            <Type className="w-3.5 h-3.5 text-neon-lime" />
            <span>Font</span>
          </button>

          {activeFontMenu && (
            <div className="absolute top-full left-0 mt-1 w-56 bg-void-950 border border-neon-lime/80 shadow-2xl p-1.5 z-50 space-y-1">
              <div className="text-[10px] text-zinc-400 px-2 py-1 uppercase font-bold border-b border-white/10">
                Editorial Typography
              </div>
              {fonts.map((f) => (
                <button
                  key={f.label}
                  type="button"
                  onClick={() => {
                    insertFormatting(`<span class="${f.class}">`, '</span>', 'Fashion Typography');
                    setActiveFontMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-neon-lime hover:text-black text-white text-[11px] flex items-center justify-between rounded-sm transition-colors"
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] opacity-75 ${f.class}`}>{f.preview}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FONT SIZE / HEADING DROPDOWN */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setActiveSizeMenu(!activeSizeMenu);
              setActiveFontMenu(false);
              setActiveColorMenu(false);
              setActiveHighlightMenu(false);
              setActiveTemplateMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime uppercase text-[11px] font-bold"
            title="Font Size & Hierarchy"
          >
            <Layers className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Size</span>
          </button>

          {activeSizeMenu && (
            <div className="absolute top-full left-0 mt-1 w-52 bg-void-950 border border-neon-cyan/80 shadow-2xl p-1.5 z-50 space-y-1">
              <div className="text-[10px] text-zinc-400 px-2 py-1 uppercase font-bold border-b border-white/10">
                Size &amp; Headings
              </div>
              {sizes.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    insertFormatting(s.prefix, s.suffix, s.sample);
                    setActiveSizeMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-neon-cyan hover:text-black text-white text-[11px] flex items-center justify-between rounded-sm transition-colors"
                >
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-white/15 mx-1" />

        {/* BASIC FORMATTING BUTTONS */}
        <button
          type="button"
          onClick={() => insertFormatting('**', '**', 'bold text')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('*', '*', 'italic text')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('<u>', '</u>', 'underlined statement')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Underline"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('~~', '~~', 'strikethrough text')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-white/15 mx-1" />

        {/* HEADINGS SHORTCUTS */}
        <button
          type="button"
          onClick={() => insertFormatting('# ', '', 'Main Title')}
          className="px-2 py-1 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime font-bold text-[11px] rounded-sm transition-colors"
          title="Heading 1"
        >
          H1
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('## ', '', 'Section Title')}
          className="px-2 py-1 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime font-bold text-[11px] rounded-sm transition-colors"
          title="Heading 2"
        >
          H2
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('### ', '', 'Subsection Title')}
          className="px-2 py-1 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime font-bold text-[11px] rounded-sm transition-colors"
          title="Heading 3"
        >
          H3
        </button>

        <div className="h-4 w-px bg-white/15 mx-1" />

        {/* TEXT COLOR ACCENTS MENU */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setActiveColorMenu(!activeColorMenu);
              setActiveFontMenu(false);
              setActiveSizeMenu(false);
              setActiveHighlightMenu(false);
              setActiveTemplateMenu(false);
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-orange hover:border-neon-orange rounded-sm transition-colors text-[11px] font-bold"
            title="Text Color Accents"
          >
            <Palette className="w-3.5 h-3.5 text-neon-orange" />
            <span>Color</span>
          </button>

          {activeColorMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-void-950 border border-neon-orange/80 shadow-2xl p-1.5 z-50 space-y-1">
              <div className="text-[10px] text-zinc-400 px-2 py-1 uppercase font-bold border-b border-white/10">
                Streetwear Accents
              </div>
              <div className="grid grid-cols-2 gap-1 p-1">
                {colors.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      insertFormatting(`<span style="color: ${c.code}; font-weight: bold;">`, '</span>', `${c.label} text`);
                      setActiveColorMenu(false);
                    }}
                    className="flex items-center gap-1.5 p-1.5 hover:bg-void-800 text-[10px] text-zinc-200 rounded text-left transition-colors"
                  >
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.code }} />
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* HIGHLIGHT BADGES MENU */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setActiveHighlightMenu(!activeHighlightMenu);
              setActiveFontMenu(false);
              setActiveSizeMenu(false);
              setActiveColorMenu(false);
              setActiveTemplateMenu(false);
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-pink hover:border-neon-pink rounded-sm transition-colors text-[11px] font-bold"
            title="Highlight Badges"
          >
            <Highlighter className="w-3.5 h-3.5 text-neon-pink" />
            <span>Badge</span>
          </button>

          {activeHighlightMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-void-950 border border-neon-pink/80 shadow-2xl p-1.5 z-50 space-y-1">
              <div className="text-[10px] text-zinc-400 px-2 py-1 uppercase font-bold border-b border-white/10">
                Highlight Badges
              </div>
              {highlights.map((h) => (
                <button
                  key={h.class}
                  type="button"
                  onClick={() => {
                    insertFormatting(`<mark class="${h.class}">`, '</mark>', 'TRENDING DROP');
                    setActiveHighlightMenu(false);
                  }}
                  className="w-full text-left px-2 py-1.5 hover:bg-void-800 flex items-center justify-between rounded transition-colors"
                >
                  <span className="text-[10px] text-zinc-200">{h.label}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${h.bg}`}>TAG</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-4 w-px bg-white/15 mx-1" />

        {/* EDITORIAL BLOCKS: QUOTE, CALLOUT, LISTS, CODE, HR */}
        <button
          type="button"
          onClick={() => insertFormatting('> ', '', 'Proportions define modern streetwear.')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Editorial Pull-Quote (>)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting(
            '<div class="fit-advice-box">\n  <strong class="text-neon-cyan block mb-1">⚡ FIT ADVICE</strong>\n  ',
            '\n</div>',
            'Pair structured boxy tops with floor-grazing baggy trousers.'
          )}
          className="flex items-center gap-1 px-2 py-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-cyan hover:border-neon-cyan rounded-sm transition-colors text-[11px] font-bold"
          title="Insert Fit Advice Callout Box"
        >
          <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
          <span>Fit Box</span>
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('• ', '', 'Heavyweight 450 GSM French Terry')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Bullet List Item (•)"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('1. ', '', 'Base silhouette layer')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Numbered List Item (1.)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('`', '`', '100% Cotton / 14oz Denim')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Fabric / Spec Badge (`code`)"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => insertFormatting('\n---\n\n', '', '')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Runway Divider Line (---)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* ALIGNMENT */}
        <button
          type="button"
          onClick={() => insertFormatting('<div style="text-align: center;">\n', '\n</div>', 'Centered Editorial Statement')}
          className="p-1.5 bg-void-950 border border-white/15 text-zinc-300 hover:text-neon-lime hover:border-neon-lime rounded-sm transition-colors"
          title="Center Align Block"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        {/* PRESET ESSAY TEMPLATES */}
        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTemplateMenu(!activeTemplateMenu);
              setActiveFontMenu(false);
              setActiveSizeMenu(false);
              setActiveColorMenu(false);
              setActiveHighlightMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-neon-lime/10 border border-neon-lime text-neon-lime hover:bg-neon-lime hover:text-black rounded-sm transition-colors text-[10px] font-black uppercase tracking-wider"
          >
            <Sparkles className="w-3 h-3" />
            <span>Insert Template</span>
          </button>

          {activeTemplateMenu && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-void-950 border border-neon-lime shadow-2xl p-1.5 z-50 space-y-1">
              <div className="text-[10px] text-zinc-400 px-2 py-1 uppercase font-bold border-b border-white/10">
                Curated Fashion Formats
              </div>
              {templates.map((tpl) => (
                <button
                  key={tpl.label}
                  type="button"
                  onClick={() => {
                    onChange(value ? `${value}\n\n${tpl.content}` : tpl.content);
                    setActiveTemplateMenu(false);
                  }}
                  className="w-full text-left p-2 hover:bg-neon-lime hover:text-black text-white text-[11px] rounded transition-colors"
                >
                  <div className="font-bold">{tpl.label}</div>
                  <div className="text-[9px] opacity-70 mt-0.5">Click to append formatted article layout</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* EDITOR CANVAS AREA */}
      <div className="relative">
        {/* WRITE ONLY MODE */}
        {viewMode === 'write' && (
          <div className="p-4 bg-void-950">
            <textarea
              ref={textareaRef}
              rows={14}
              required
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-void-900 border border-white/10 p-4 text-white focus:outline-none focus:border-neon-lime font-sans text-xs leading-relaxed resize-y"
            />
          </div>
        )}

        {/* SPLIT VIEW (DESKTOP) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="p-3 bg-void-950">
              <div className="text-[10px] text-zinc-400 uppercase font-bold mb-2 flex items-center justify-between">
                <span>Markdown &amp; Styled Editor</span>
                <span className="text-[9px] text-neon-lime">Supports HTML + MD</span>
              </div>
              <textarea
                ref={textareaRef}
                rows={16}
                required
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-[380px] bg-void-900 border border-white/10 p-3 text-white focus:outline-none focus:border-neon-lime font-sans text-xs leading-relaxed resize-none"
              />
            </div>

            <div className="p-3 bg-void-900/60 overflow-y-auto max-h-[420px]">
              <div className="text-[10px] text-neon-lime uppercase font-bold mb-2 flex items-center justify-between border-b border-white/10 pb-1">
                <span>Live Reader Preview</span>
                <span className="text-[9px] text-zinc-400">Exact Customer View</span>
              </div>
              {value.trim() ? (
                <BlogContentRenderer content={value} />
              ) : (
                <div className="p-8 text-center text-zinc-500 font-mono text-[11px]">
                  Start typing or use the styling toolbar above to see live formatted rendering here...
                </div>
              )}
            </div>
          </div>
        )}

        {/* FULL READER PREVIEW */}
        {viewMode === 'preview' && (
          <div className="p-6 md:p-8 bg-void-900/80 min-h-[350px]">
            <div className="max-w-2xl mx-auto">
              <div className="text-[10px] text-neon-lime font-bold uppercase tracking-widest mb-4 pb-2 border-b border-white/10 flex items-center justify-between">
                <span>ARTICLE BODY PREVIEW</span>
                <button
                  type="button"
                  onClick={() => setViewMode('write')}
                  className="text-zinc-400 hover:text-white uppercase text-[10px] flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Return to editing</span>
                </button>
              </div>

              {value.trim() ? (
                <BlogContentRenderer content={value} />
              ) : (
                <div className="p-12 text-center text-zinc-500 font-mono text-xs">
                  Your styled article is empty. Switch to "Write Mode" to add content.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Editor Footer Tips */}
      <div className="bg-void-900 border-t border-white/10 px-3 py-1.5 text-[10px] text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-3 h-3 text-neon-lime" />
          <span>Select any text and click a toolbar button to apply fonts, colors, highlights, or quotes.</span>
        </div>
        <div className="font-mono text-[9px] text-zinc-500">
          Markdown / HTML 5 / CSS Styled
        </div>
      </div>
    </div>
  );
}
