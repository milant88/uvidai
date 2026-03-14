import './global.css';
import { Source_Sans_3, JetBrains_Mono } from 'next/font/google';
import { Sidebar } from '../components/Sidebar';

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'UvidAI Admin',
  description: 'Admin dashboard for UvidAI platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sourceSans.variable} ${jetbrainsMono.variable}`}>
        <div className="admin-layout">
          <Sidebar />
          <main className="admin-main">{children}</main>
        </div>
      </body>
    </html>
  );
}
