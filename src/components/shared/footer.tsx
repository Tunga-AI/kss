import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-8">
        <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    <span className="font-headline font-bold text-lg">KSS Institute</span>
                </div>
                <p className="text-sm text-muted-foreground">Empowering Africa's sales professionals with world-class education and industry-recognized qualifications.</p>
            </div>
            <div>
                <h4 className="font-headline font-semibold mb-2">Quick Links</h4>
                 <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-primary">Home</Link>
                    <Link href="/about" className="hover:text-primary">About</Link>
                    <Link href="/framework" className="hover:text-primary">Framework</Link>
                    <Link href="/courses" className="hover:text-primary">Programs</Link>
                    <Link href="/events" className="hover:text-primary">Events</Link>
                    <Link href="/login" className="hover:text-primary">Portal</Link>
                </nav>
            </div>
            <div>
                <h4 className="font-headline font-semibold mb-2">Contact Info</h4>
                 <div className="space-y-2 text-sm text-muted-foreground">
                    <p>kss@cca.co.ke</p>
                    <p>+254 722 257 323</p>
                    <p>Westlands, Nairobi, Kenya</p>
                </div>
            </div>
        </div>

        <div className="mt-8 border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Kenya School of Sales. All rights reserved.</p>
             <div className="flex gap-4">
                <Link href="/privacy" className="hover:text-primary">Media & Data Consent</Link>
                <Link href="/privacy" className="hover:text-primary">Media & Privacy Notice</Link>
             </div>
            <p>Powered by Commercial Club of Africa and Yusudi</p>
        </div>
      </div>
    </footer>
  );
}
