import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-headline font-bold">KSS Institute</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/courses" className="hover:text-primary">Courses</Link>
            <Link href="/about" className="hover:text-primary">About</Link>
            <Link href="/contact" className="hover:text-primary">Contact</Link>
            <Link href="/privacy" className="hover:text-primary">Privacy Policy</Link>
          </nav>
          <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} KSS Institute. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
