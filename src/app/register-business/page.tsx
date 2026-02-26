import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { B2bRegistrationForm } from '@/components/auth/B2bRegistrationForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function RegisterBusinessPage() {
    const loginImage = PlaceHolderImages.find(p => p.id === 'login-page-background');

    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <div className="relative w-full min-h-screen bg-primary">
                {loginImage && (
                    <Image
                        src={loginImage.imageUrl}
                        alt={loginImage.description}
                        data-ai-hint={loginImage.imageHint}
                        fill
                        className="object-cover opacity-20"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary/80" />

                <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
                    <Button asChild variant="secondary" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none">
                        <Link href="/for-business">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Plans
                        </Link>
                    </Button>
                </div>

                <div className="relative z-10 flex items-center justify-center p-4 py-20 min-h-screen">
                    <div className="w-full max-w-lg bg-white rounded-tl-3xl rounded-br-3xl rounded-tr-sm rounded-bl-sm shadow-2xl p-2">
                        <B2bRegistrationForm />
                    </div>
                </div>
            </div>
        </Suspense>
    );
}
