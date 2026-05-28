import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stowe Cinema',
  description: 'See what is playing at Stowe Cinema, check live showtimes, and buy tickets online.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
