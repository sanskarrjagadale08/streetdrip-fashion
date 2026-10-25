'use client';

import React from 'react';

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: '40px', background: '#FAF8F5', color: '#1C0507', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ maxWidth: '480px', margin: '40px auto', background: '#fff', border: '1px solid #D8C4AC', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 16px', background: '#4D0E13', color: '#EEE4DA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            SD
          </div>
          <h2 style={{ fontSize: '20px', textTransform: 'uppercase', marginBottom: '8px' }}>STREETDRIP VAULT</h2>
          <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
            A temporary client cache mismatch occurred. Click below to refresh your catalog.
          </p>
          <button
            onClick={() => {
              try {
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('streetdrip_theme');
                }
              } catch (e) {}
              if (reset) {
                reset();
              } else {
                window.location.reload();
              }
            }}
            style={{ width: '100%', padding: '12px 24px', background: '#4D0E13', color: '#EEE4DA', border: 'none', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', fontSize: '12px', letterSpacing: '0.05em' }}
          >
            Reload Catalog
          </button>
        </div>
      </body>
    </html>
  );
}
