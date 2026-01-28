import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function LoginPage() {
  const loginImage = PlaceHolderImages.find(p => p.id === 'login-page-background');
  
  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <h1 className="text-3xl font-bold font-headline">Welcome to KSS</h1>
            <p className="text-balance text-muted-foreground">
              Please select your portal to continue
            </p>
          </div>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Learner Portal</CardTitle>
                <CardDescription>Access your courses, materials, and grades.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/dashboard">Login as Learner</Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Staff & Admin Portal</CardTitle>
                <CardDescription>Manage courses, users, and content.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild variant="secondary" className="w-full">
                  <Link href="/admin">Login as Staff</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        {loginImage && <Image
          src={loginImage.imageUrl}
          alt={loginImage.description}
          data-ai-hint={loginImage.imageHint}
          fill
          className="object-cover"
        />}
      </div>
    </div>
  );
}
