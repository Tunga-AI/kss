import Image from 'next/image';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/auth/login-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-page-background');
  
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

      <div className="relative z-10 flex items-end justify-end p-4 sm:p-12 min-h-screen">
        <LoginForm />
      </div>
    </div>
  );
}
