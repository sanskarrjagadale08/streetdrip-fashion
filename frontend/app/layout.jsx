import './globals.css';

export const metadata = {
  title: 'STREETDRIP // Editorial Menswear, 3D Atelier & AI Stylist',
  description: 'Curated menswear recommendation platform with heavy streetwear aesthetics, 3D WebGL product inspection, and AI vibe-based styling in both Light and Dark modes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('streetdrip_theme');
                  // Light is the default primary theme. Only activate dark if user specifically chose 'dark'.
                  if (saved === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-neutral-50 text-neutral-900 dark:bg-void-950 dark:text-neutral-100 min-h-screen antialiased transition-colors duration-200 selection:bg-neutral-900 selection:text-white dark:selection:bg-emerald-400 dark:selection:text-black">
        {children}
      </body>
    </html>
  );
}
