import type { Metadata } from 'next';
import { Noto_Sans_JP, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const sans = Noto_Sans_JP({ variable: '--font-sans-jp', subsets: ['latin'] });
const mono = IBM_Plex_Mono({ variable: '--font-system-mono', subsets: ['latin'], weight: ['400', '500', '600'] });

export const metadata: Metadata = {
  title: '怪異監視センター',
  description: '特異事象監視室の夜勤を体験する短編ホラー監視ゲーム',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className="dark">
      <body className={`${sans.variable} ${mono.variable}`}>{children}</body>
    </html>
  );
}
