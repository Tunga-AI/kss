'use client'; // Needs to be a client component to use hooks

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-page-background');
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // User is logged in, redirect to their portal
      let redirectPath = '/l'; // Default to learner
      const role = user.role;
      
      if (['Admin', 'Sales', 'Finance', 'Business', 'Operations'].includes(role)) {
        redirectPath = '/a';
      } else if (role === 'Facilitator') {
        redirectPath = '/f';
      }
      
      router.push(redirectPath);
    }
  }, [user, loading, router]);
  
  if (loading || (!loading && user)) {
    // Show a loading state while checking auth and redirecting
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen">
      {loginImage && <Image
        src={loginImage.imageUrl}
        alt={loginImage.description}
        data-ai-hint={loginImage.imageHint}
        fill
        className="object-cover"
      />}
      <div className="absolute inset-0 bg-black/30" />

      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Website
          </Link>
        </Button>
      </div>

      <div className="relative z-10 flex items-center justify-center sm:justify-end p-4 sm:p-12 min-h-screen">
        <LoginForm />
      </div>
    </div>
  );
}
