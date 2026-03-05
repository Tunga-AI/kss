"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDoc, useUsersFirestore } from "@/firebase";
import type { BrandingSettings } from "@/lib/settings-types";
import { doc } from "firebase/firestore";
import Image from "next/image";

/* ── Nav structure ── */
const navItems = [
  { href: "/about", label: "About Us" },
  { href: "/framework", label: "Our Framework" },
  { href: "/courses", label: "For Professionals" },
  { href: "/for-business", label: "For Business" },
  { href: "/e-learning", label: "Digital Campus" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

/* ── Main Header ── */
export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const firestore = useUsersFirestore();
  const settingsRef = firestore ? doc(firestore, "settings", "branding") : null;
  const { data: settings } = useDoc<BrandingSettings>(settingsRef as any);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const Logo = ({ force }: { force?: "light" | "dark" }) => {
    const isLight = force === "light" || (!force && !scrolled);
    return settings?.logoUrl ? (
      <div className="relative w-24 h-10">
        <Image
          src={settings.logoUrl}
          alt="KSS Logo"
          fill
          sizes="96px"
          className={cn(
            "object-contain transition-all duration-300",
            isLight && "drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]"
          )}
        />
      </div>
    ) : (
      <span
        className={cn(
          "font-bold font-headline text-2xl",
          isLight ? "text-white" : "text-primary"
        )}
      >
        KSS
      </span>
    );
  };

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Logo — right on mobile, left on desktop */}
        <Link href="/" className="flex items-center space-x-2 shrink-0 order-last lg:order-first">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6">
          {/* Home */}
          <Link
            href="/"
            className={cn(
              "text-sm font-bold uppercase transition-all duration-300 relative group px-2 py-1",
              scrolled
                ? pathname === "/"
                  ? "text-primary"
                  : "text-foreground hover:text-primary"
                : pathname === "/"
                  ? "text-accent"
                  : "text-white hover:text-accent"
            )}
          >
            Home
            <span
              className={cn(
                "absolute bottom-0 left-0 h-0.5 transition-all duration-300",
                pathname === "/" ? "w-full" : "w-0 group-hover:w-full",
                scrolled ? "bg-primary" : "bg-accent"
              )}
            />
          </Link>

          {/* Nav items */}
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-sm font-bold uppercase transition-all duration-300 relative group px-2 py-1 whitespace-nowrap",
                scrolled
                  ? pathname === item.href
                    ? "text-primary"
                    : "text-foreground hover:text-primary"
                  : pathname === item.href
                    ? "text-accent"
                    : "text-white hover:text-accent"
              )}
            >
              {item.label}
              <span
                className={cn(
                  "absolute bottom-0 left-0 h-0.5 transition-all duration-300",
                  pathname === item.href ? "w-full" : "w-0 group-hover:w-full",
                  scrolled ? "bg-primary" : "bg-accent"
                )}
              />
            </Link>
          ))}
        </div>

        {/* Mobile hamburger — left on mobile */}
        <div className="lg:hidden order-first lg:order-none">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "transition-colors",
                  scrolled
                    ? "text-primary hover:bg-primary/10"
                    : "text-white hover:bg-white/10"
                )}
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0 overflow-y-auto">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              {/* Sheet header */}
              <div className="bg-primary p-6 flex items-center justify-between">
                <Logo force="light" />
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 space-y-1">
                {/* Home */}
                <Link
                  href="/"
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm uppercase transition-colors",
                    pathname === "/"
                      ? "bg-primary text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  Home
                </Link>

                {/* Nav items */}
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm uppercase transition-colors",
                      pathname === item.href
                        ? "bg-primary text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
