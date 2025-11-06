import { ThemeProvider } from '@/components/theme-provider';
import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Pack It Up - Smart Packing Lists',
  description:
    'Generate personalized packing lists based on your destination, activities, and travel preferences. Smart AI-powered suggestions for your next trip.',
  keywords: ['packing list', 'travel planner', 'trip organizer', 'packing checklist', 'travel essentials'],
  authors: [{ name: 'Pack It Up' }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Pack It Up - Smart Packing Lists',
    description: 'Generate personalized packing lists based on your destination, activities, and travel preferences.',
    type: 'website',
    siteName: 'Pack It Up',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pack It Up - Smart Packing Lists',
    description: 'Generate personalized packing lists based on your destination, activities, and travel preferences.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://driven-grouse-64.clerk.accounts.dev" />
          <link rel="dns-prefetch" href="https://driven-grouse-64.clerk.accounts.dev" />
        </head>
        <body className={inter.className}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
              {children}
            </div>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
