import './globals.css';

export const metadata = {
  title: 'STREETDRIP // Editorial Menswear, 3D Atelier & AI Stylist',
  description: 'Curated menswear recommendation platform with heavy streetwear aesthetics, 3D WebGL product inspection, and AI vibe-based styling in both Light and Dark modes.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
