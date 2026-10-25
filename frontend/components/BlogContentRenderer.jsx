'use client';

import React from 'react';

/**
 * Parses markdown + safe HTML tags into structured fashion editorial markup
 */
export function formatBlogHtml(rawText) {
  if (!rawText) return '';

  const lines = rawText.split('\n');
  const processed = [];
  let inList = false;
  let listType = null; // 'ul' | 'ol'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for lists
    const isBullet = /^\s*[\*\-\•]\s+(.*)$/.test(line);
    const isNumbered = /^\s*\d+\.\s+(.*)$/.test(line);

    if (isBullet) {
      const content = line.replace(/^\s*[\*\-\•]\s+/, '');
      if (!inList || listType !== 'ul') {
        if (inList) processed.push(listType === 'ul' ? '</ul>' : '</ol>');
        processed.push('<ul class="list-disc list-inside space-y-1.5 my-3 pl-2">');
        inList = true;
        listType = 'ul';
      }
      processed.push(`<li class="leading-relaxed text-neutral-800 dark:text-emerald-50/90">${processInline(content)}</li>`);
      continue;
    } else if (isNumbered) {
      const content = line.replace(/^\s*\d+\.\s+/, '');
      if (!inList || listType !== 'ol') {
        if (inList) processed.push(listType === 'ul' ? '</ul>' : '</ol>');
        processed.push('<ol class="list-decimal list-inside space-y-1.5 my-3 pl-2">');
        inList = true;
        listType = 'ol';
      }
      processed.push(`<li class="leading-relaxed text-neutral-800 dark:text-emerald-50/90">${processInline(content)}</li>`);
      continue;
    } else if (inList) {
      processed.push(listType === 'ul' ? '</ul>' : '</ol>');
      inList = false;
      listType = null;
    }

    // Check headings
    if (/^###\s+(.*)$/.test(line)) {
      processed.push(`<h3 class="text-xl md:text-2xl font-bold uppercase tracking-tight text-neutral-950 dark:text-white mt-6 mb-3">${processInline(line.replace(/^###\s+/, ''))}</h3>`);
    } else if (/^##\s+(.*)$/.test(line)) {
      processed.push(`<h2 class="text-2xl md:text-3xl font-black uppercase tracking-tight text-neutral-950 dark:text-white mt-8 mb-4">${processInline(line.replace(/^##\s+/, ''))}</h2>`);
    } else if (/^#\s+(.*)$/.test(line)) {
      processed.push(`<h1 class="text-3xl md:text-4xl font-black uppercase tracking-tight text-neutral-950 dark:text-white mt-8 mb-4">${processInline(line.replace(/^#\s+/, ''))}</h1>`);
    } else if (/^>\s+(.*)$/.test(line)) {
      processed.push(`<blockquote class="border-l-4 border-neon-lime pl-4 py-2.5 italic my-4 bg-neutral-100/80 dark:bg-forest-900/60 text-neutral-700 dark:text-emerald-100/90 rounded-r">${processInline(line.replace(/^>\s+/, ''))}</blockquote>`);
    } else if (/^---$/.test(line.trim())) {
      processed.push(`<hr class="my-6 border-neutral-300 dark:border-forest-700/80" />`);
    } else if (line.trim() === '') {
      processed.push('<div class="h-2.5"></div>');
    } else {
      // If line contains HTML block tags already
      if (/^\s*<(div|blockquote|section|hr|h[1-6]|ul|ol|table|p)/i.test(line)) {
        processed.push(line);
      } else {
        processed.push(`<p class="leading-relaxed mb-3">${processInline(line)}</p>`);
      }
    }
  }

  if (inList) {
    processed.push(listType === 'ul' ? '</ul>' : '</ol>');
  }

  return processed.join('\n');
}

function processInline(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-neutral-950 dark:text-white">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    .replace(/~~(.*?)~~/g, '<del class="line-through opacity-70">$1</del>')
    .replace(/`([^`]+)`/g, '<code class="bg-neutral-200 dark:bg-forest-900/90 border border-neutral-300 dark:border-forest-700 px-1.5 py-0.5 font-mono text-xs text-neutral-900 dark:text-neon-lime rounded">$1</code>');
}

export default function BlogContentRenderer({ content, className = '' }) {
  if (!content) return null;

  const html = formatBlogHtml(content);

  return (
    <div
      className={`blog-rendered-content text-sm text-neutral-800 dark:text-emerald-50/90 leading-relaxed font-sans ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
