'use client'; // Needs to be a client component to use hooks

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useUser, useUsersFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

function LoginPageContent() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-page-background');
  const { user, loading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get redirect and payment status from URL
  const redirectUrl = searchParams.get('redirect');
  const paymentSuccess = searchParams.get('payment') === 'success';

  const firestore = useUsersFirestore();
  const settingsRef = firestore ? collection(firestore, 'settings') : null;
  const { data: settings } = useCollection<any>(
    settingsRef ? query(settingsRef, where('__name__', '==', 'branding')) : null
  );
  const branding = settings?.[0];

  useEffect(() => {
    if (!loading && user) {
      // User is logged in, redirect to their portal or specified redirect URL
      let redirectPath = redirectUrl || '/l'; // Default to learner or use redirect param

      // If no redirect URL specified, determine based on role
      if (!redirectUrl) {
        const role = user.role;

        if (['Admin', 'Sales', 'Finance', 'Business', 'Operations'].includes(role)) {
          redirectPath = '/a';
        } else if (role === 'Facilitator') {
          redirectPath = '/f';
        } else if (role === 'BusinessAdmin') {
          redirectPath = '/b';
        } else if (role === 'BusinessLearner') {
          redirectPath = '/l';
        }
      }

      router.push(redirectPath);
    }
  }, [user, loading, router, redirectUrl]);
  
  if (loading || (!loading && user)) {
    // Show a loading state while checking auth and redirecting
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen flex items-end bg-primary">
      {branding?.loginHeroUrl && (
        <Image
          src={branding.loginHeroUrl}
          alt="Login Hero"
          fill
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent" />

      <div className="absolute top-4 left-4 sm:top-8 sm:left-8 z-20">
        <Button asChild variant="secondary" className="rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Website
          </Link>
        </Button>
      </div>

      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 py-20 pb-16">
          <div className="max-w-md">
            {paymentSuccess && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-tl-xl rounded-br-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-green-900 font-bold text-sm">Payment Successful!</h3>
                    <p className="text-green-700 text-xs mt-0.5">Please log in to access your enrollment.</p>
                  </div>
                </div>
              </div>
            )}
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
