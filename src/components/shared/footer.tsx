'use client';

import Link from "next/link";
import { useDoc, useUsersFirestore, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BrandingSettings } from '@/lib/settings-types';
import Image from 'next/image';
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowRight, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function Footer() {
  const { user, loading } = useUser();
  const firestore = useUsersFirestore();
  const settingsRef = firestore ? doc(firestore, 'settings', 'branding') : null;
  const { data: settings } = useDoc<BrandingSettings>(settingsRef as any);

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

  const getPortalLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "Admin":
      case "Sales":
      case "Finance":
      case "Business":
      case "Operations":
        return "/a";
      case "Facilitator":
        return "/f";
      case "BusinessAdmin":
        return "/b";
      default:
        return "/l";
    }
  };

  return (
    <>
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2 shrink-0">
              {settings?.logoUrl ? (
                <div className="relative h-8 w-20">
                  <Image src={settings.logoUrl} alt="KSS Logo" fill className="object-contain" />
                </div>
              ) : (
                <span className="font-bold font-headline text-xl text-primary">KSS</span>
              )}
            </Link>

            {/* Center: copyright + links */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center">
              <p className="text-xs text-muted-foreground">
                &copy; 2026 – 2030 Kenya School of Sales. All Rights Reserved.
              </p>
              <span className="hidden sm:inline text-muted-foreground/40">•</span>
              <div className="flex items-center gap-4">
                <Link href="/privacy" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>

            {/* Portal Button */}
            {loading ? (
              <Loader2 className="animate-spin h-4 w-4 text-muted-foreground shrink-0" />
            ) : user ? (
              <Link
                href={getPortalLink()}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-tl-xl rounded-br-xl font-bold text-xs hover:bg-primary/90 transition-colors shrink-0"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.avatar || undefined} />
                  <AvatarFallback className="bg-white text-primary text-[10px] font-bold">
                    {user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                My Portal
                <ArrowRight className="h-3 w-3" />
              </Link>
            ) : (
              <Button
                asChild
                size="sm"
                className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none font-bold text-xs px-4 h-8 bg-primary text-white hover:bg-primary/90 shrink-0"
              >
                <Link href="/login">
                  Portal <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            )}
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
