import type { Metadata } from 'next';
import { Playfair_Display, Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import './global.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-playfair',
  display: 'swap',
});

const sourceSans = Source_Sans_3({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-source-sans',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'UvidAI — Pametni Asistent za Lokacije',
  description:
    'AI asistent koji analizira kvartove Beograda i Novog Sada: kvalitet vazduha, škole, transport, zelenilo i još mnogo toga.',
  keywords: [
    'Beograd',
    'Novi Sad',
    'nekretnine',
    'kvalitet vazduha',
    'AI asistent',
    'kvartovi',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sr-Latn"
      className={`dark ${playfair.variable} ${sourceSans.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
