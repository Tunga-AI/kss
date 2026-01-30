'use client';

import Link from "next/link";
import { useDoc, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { BrandingSettings } from '@/lib/settings-types';
import Image from 'next/image';

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/framework", label: "Framework" },
  { href: "/courses", label: "Courses" },
  { href: "/e-learning", label: "E-Learning" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const firestore = useFirestore();
  const settingsRef = firestore ? doc(firestore, 'settings', 'branding') : null;
  const { data: settings } = useDoc<BrandingSettings>(settingsRef);

  return (
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
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
           {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="font-bold text-primary transition-colors hover:text-primary/80"
            >
              Portal
            </Link>
        </nav>
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
  );
}
