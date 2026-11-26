import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#6d28d9',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'NOTTPAY — Digital Wallet',
  description:
    'Fast, simple digital wallet preview for sending money, adding funds, scanning QR codes, and tracking BDT activity.',
  openGraph: {
    title: 'NOTTPAY — Digital Wallet',
    description:
      'Fast, simple digital wallet preview for sending money, adding funds, scanning QR codes, and tracking BDT activity.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOTTPAY — Digital Wallet',
    description:
      'Fast, simple digital wallet preview for sending money, adding funds, scanning QR codes, and tracking BDT activity.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-[#f7f5fb] text-[#201735] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
