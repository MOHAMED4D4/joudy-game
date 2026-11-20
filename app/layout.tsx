import type { Metadata } from 'next';
import { Cairo, El_Messiri } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

const elMessiri = El_Messiri({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'مغامرة التجميع السريعة',
  description:
    'لعبة أركيد عربية تضم 30 مستوى ومتجرًا للملابس والأحذية مرتبطًا باللعب والعملات.',
  openGraph: {
    title: 'مغامرة التجميع السريعة',
    description:
      'لعبة أركيد عربية تضم 30 مستوى ومتجرًا للملابس والأحذية مرتبطًا باللعب والعملات.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'مغامرة التجميع السريعة',
    description:
      'لعبة أركيد عربية تضم 30 مستوى ومتجرًا للملابس والأحذية مرتبطًا باللعب والعملات.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} ${elMessiri.variable}`}>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-[#FFF7FA] text-[#2D1824] selection:bg-rose-200 selection:text-rose-950"
      >
        {children}
      </body>
    </html>
  );
}
