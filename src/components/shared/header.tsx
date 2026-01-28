"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/framework", label: "Framework" },
  { href: "/events", label: "Events" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          <span className="font-bold inline-block font-headline text-2xl">KSS</span>
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
                 <DropdownMenu>
                  <DropdownMenuTrigger className={cn("flex items-center gap-1 text-sm font-bold uppercase transition-colors outline-none", scrolled ? "text-foreground hover:text-primary" : "text-white hover:text-primary")}>
                    Get Started
                    <ChevronDown className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href="/courses">Courses</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/e-learning">E-Learning</Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                      <span className="font-bold inline-block font-headline text-2xl text-primary">KSS</span>
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
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="get-started" className="border-b-0">
                            <AccordionTrigger className="text-lg font-bold uppercase py-2 hover:no-underline">
                                Get Started
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="flex flex-col gap-4 pl-4 pt-2">
                                    <Link
                                        href="/courses"
                                        onClick={() => setIsOpen(false)}
                                        className="text-lg font-bold uppercase"
                                    >
                                        Courses
                                    </Link>
                                    <Link
                                        href="/e-learning"
                                        onClick={() => setIsOpen(false)}
                                        className="text-lg font-bold uppercase"
                                    >
                                        E-Learning
                                    </Link>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                  </SheetContent>
                </Sheet>
            </div>
        </div>
      </div>
    </header>
  );
}
