import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/auth/login-form';

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
      <div className="relative z-10 flex items-end justify-end p-4 sm:p-12 h-full">
        <LoginForm />
      </div>
    </div>
  );
}
