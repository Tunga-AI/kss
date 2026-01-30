'use client';

import Link from "next/link";
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BrandingSettings } from '@/lib/settings-types';
import Image from 'next/image';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

export function Footer() {
  const firestore = useFirestore();
  const settingsRef = firestore ? doc(firestore, 'settings', 'branding') : null;
  const { data: settings } = useDoc<BrandingSettings>(settingsRef);
  
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      <footer className="border-t bg-background">
        <div className="container flex flex-col items-center justify-between gap-6 py-10 md:h-24 md:flex-row">
          <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
            <Link href="/" className="flex items-center space-x-2">
              {settings?.logoUrl ? (
                <div className="relative w-24 h-10">
                    <Image src={settings.logoUrl} alt="KSS Logo" fill className="object-contain" />
                </div>
              ) : (
                <span className="font-bold inline-block font-headline text-2xl text-primary">KSS</span>
              )}
            </Link>
          </div>
          <div className="flex-1" />
          <div className="text-center text-sm text-muted-foreground md:text-right">
              <p className="leading-loose">
                &copy; {new Date().getFullYear()} Kenya School of Sales.
              </p>
              <div className="flex justify-center md:justify-end gap-x-4">
                   <Link href="/privacy" className="transition-colors hover:text-primary">Privacy Policy</Link>
                   <Link href="/terms" className="transition-colors hover:text-primary">Terms of Service</Link>
              </div>
          </div>
        </div>
      </footer>
      {showBackToTop && (
          <Button
              onClick={scrollToTop}
              className="fixed bottom-8 right-8 z-50 h-12 w-12 rounded-full"
              size="icon"
          >
              <ArrowUp className="h-6 w-6" />
              <span className="sr-only">Back to top</span>
          </Button>
      )}
    </>
  );
}
