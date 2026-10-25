'use client';

import React, { useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('STREETDRIP client error caught by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-creme-50 dark:bg-burgundy-950 text-burgundy-950 dark:text-creme-100 flex items-center justify-center p-6 font-mono">
      <div className="max-w-md w-full p-8 bg-white dark:bg-burgundy-900 border border-sand-300 dark:border-burgundy-800 shadow-xl text-center">
        <div className="w-12 h-12 mx-auto mb-4 bg-burgundy-600 text-creme-100 dark:bg-dusty-400 dark:text-burgundy-950 flex items-center justify-center font-bold text-lg">
          SD
        </div>
        <h2 className="text-xl font-bold uppercase mb-2">Archive Ready</h2>
        <p className="text-xs text-sand-600 dark:text-sand-300 mb-6 font-sans">
          A temporary client refresh is required. Click below to load your streetwear catalog.
        </p>
        <button
          onClick={() => {
            if (reset) {
              reset();
            } else {
              window.location.reload();
            }
          }}
          className="w-full py-3 bg-burgundy-600 text-creme-100 hover:bg-burgundy-700 dark:bg-dusty-400 dark:text-burgundy-950 font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reload Catalog</span>
        </button>
      </div>
    </div>
  );
}
