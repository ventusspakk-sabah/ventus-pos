import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ventus Pro POS',
  description: 'Next Generation Point of Sale',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>{children}</body>
    </html>
  );
}
