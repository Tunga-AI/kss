import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FaviconManager } from '@/components/shared/favicon-manager';

export const metadata: Metadata = {
  title: 'KSS : Kenya School of Sales',
  description: 'A comprehensive front-facing website and secure portal for KSS, a sales training institute.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <FaviconManager />
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
