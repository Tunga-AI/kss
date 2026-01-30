"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { BrandingSettings } from "@/lib/settings-types";
import { doc } from "firebase/firestore";
import Image from "next/image";

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

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useUser();
  const firestore = useFirestore();
  const settingsRef = firestore ? doc(firestore, 'settings', 'branding') : null;
  const { data: settings } = useDoc<BrandingSettings>(settingsRef);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getPortalLink = () => {
    if (!user) return "/login";
    switch(user.role) {
        case 'Admin':
        case 'Sales':
        case 'Finance':
        case 'Business':
        case 'Operations':
            return "/a";
        case 'Facilitator':
            return "/f";
        case 'Learner':
        default:
            return "/l";
    }
  }

  return (
    <header className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" : "bg-transparent border-transparent"
    )}>
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className={cn(
            "flex items-center space-x-2 transition-colors",
            scrolled ? "text-primary" : "text-white hover:text-white/90"
        )}>
          {settings?.logoUrl ? (
              <div className="relative w-24 h-10">
                  <Image
                      src={settings.logoUrl}
                      alt="KSS Logo"
                      fill
                      className={cn("object-contain", !scrolled && "brightness-0 invert")}
                  />
              </div>
          ) : (
              <span className="font-bold inline-block font-headline text-2xl">KSS</span>
          )}
        </Link>
        
        <div className="flex items-center gap-4">
            <nav className="hidden gap-6 md:flex justify-end flex-1 items-center">
                {navLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                        "text-sm font-bold uppercase transition-colors",
                        scrolled ? "text-foreground hover:text-primary" : "text-white hover:text-primary"
                    )}
                >
                    {link.label}
                </Link>
                ))}
                 {loading ? <Loader2 className={cn("animate-spin", scrolled ? "" : "text-white")} /> : (
                    <>
                        {user ? (
                            <Button asChild variant="ghost" className={cn("relative h-10 w-10 rounded-full", scrolled ? "hover:bg-accent" : "hover:bg-white/10")}>
                                <Link href={getPortalLink()}>
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                </Link>
                            </Button>
                        ) : (
                            <Link
                                href="/login"
                                className={cn(
                                    "text-sm font-bold uppercase transition-colors",
                                    scrolled ? "text-primary hover:text-primary/80" : "text-white hover:text-primary"
                                )}
                                >
                                Portal Login
                            </Link>
                        )}
                    </>
                 )}
            </nav>
            <div className="md:hidden">
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className={cn(scrolled ? "" : "text-white hover:bg-white/10 hover:text-white")}>
                      <Menu className="h-6 w-6" />
                      <span className="sr-only">Toggle Menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <Link href="/" className="flex items-center space-x-2 mb-8">
                       {settings?.logoUrl ? (
                          <div className="relative w-24 h-10">
                              <Image
                                  src={settings.logoUrl}
                                  alt="KSS Logo"
                                  fill
                                  className="object-contain"
                              />
                          </div>
                      ) : (
                          <span className="font-bold inline-block font-headline text-2xl text-primary">KSS</span>
                      )}
                    </Link>
                    <div className="flex flex-col gap-4">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="text-lg font-bold uppercase"
                        >
                          {link.label}
                        </Link>
                      ))}
                      <div className="border-t pt-4">
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                                {user ? (
                                    <div className="flex flex-col gap-4">
                                         <Link href={getPortalLink()} onClick={() => setIsOpen(false)} className="text-lg font-bold uppercase">Portal</Link>
                                    </div>
                                ) : (
                                    <Link href="/login" onClick={() => setIsOpen(false)} className="text-lg font-bold uppercase">Portal Login</Link>
                                )}
                            </>
                        )}
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
