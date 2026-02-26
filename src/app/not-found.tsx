import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Ghost, Search } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden font-body">
            {/* Decorative Orbs */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-primary/20 rounded-full blur-[100px] opacity-20" />
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-accent/20 rounded-full blur-[100px] opacity-20" />

            <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
                {/* Main Content Area */}
                <div className="relative inline-block mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 transform animate-pulse" />
                    <h1 className="text-[12rem] font-black text-primary leading-none tracking-tighter sm:text-[18rem] selection:bg-accent selection:text-white relative z-10 animate-in fade-in zoom-in duration-500">
                        404
                    </h1>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <Ghost className="h-24 w-24 text-accent animate-bounce" />
                    </div>
                </div>

                <div className="space-y-4 animate-in slide-in-from-bottom-5 duration-700 delay-200 fill-mode-both">
                    <h2 className="text-3xl sm:text-5xl font-bold text-primary tracking-tight">
                        Lost in Space?
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed">
                        The page you're looking for has vanished into the void. Don't worry, we can help you find your way back.
                    </p>
                </div>

                {/* Dynamic Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 animate-in slide-in-from-bottom-5 duration-700 delay-300 fill-mode-both">
                    <Button
                        asChild
                        variant="outline"
                        className="h-14 px-8 border-primary/20 hover:bg-primary/5 text-primary font-bold rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none transition-all active:scale-95 text-base"
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <ArrowLeft className="h-5 w-5" />
                            Go Back
                        </Link>
                    </Button>

                    <Button
                        asChild
                        className="h-14 px-8 bg-primary hover:bg-primary/90 text-white font-bold rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none shadow-xl shadow-primary/20 transition-all active:scale-95 text-base"
                    >
                        <Link href="/" className="flex items-center gap-2">
                            <Home className="h-5 w-5" />
                            Return Home
                        </Link>
                    </Button>
                </div>

                {/* Footer Links */}
                <div className="pt-12 flex items-center justify-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-in fade-in duration-1000 delay-500 fill-mode-both">
                    <Link href="/courses" className="hover:text-accent transition-colors">Courses</Link>
                    <Link href="/about" className="hover:text-accent transition-colors">Our Story</Link>
                    <Link href="/contact" className="hover:text-accent transition-colors">Support</Link>
                </div>
            </div>

            {/* Grid Pattern Background */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(var(--primary) 1px, transparent 0)', backgroundSize: '40px 40px' }}
            />
        </div>
    );
}
