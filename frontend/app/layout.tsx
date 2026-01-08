import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'News Curation Bot',
  description: 'AI・技術系ニュースキュレーション',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
