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
                  var saved = localStorage.getItem('streetdrip_theme') || 'creme';
                  if (saved === 'dark') saved = 'burgundy';
                  if (saved === 'light') saved = 'creme';

                  document.documentElement.setAttribute('data-theme', saved);
                  if (saved === 'burgundy' || saved === 'rose') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'creme');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-creme-50 text-burgundy-950 dark:bg-burgundy-950 dark:text-creme-100 min-h-screen antialiased transition-colors duration-300 selection:bg-burgundy-600 selection:text-creme-100 dark:selection:bg-dusty-400 dark:selection:text-burgundy-950 font-sans">
        {children}
      </body>
    </html>
  );
}
