import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stowe Cinema',
  description: 'Luxury movie theater website for Stowe Cinema with live showtimes.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
