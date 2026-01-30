'use client';
    
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { b2bRegister } from '@/app/actions/b2b-registration';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export function B2bRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tier = searchParams.get('tier') || 'Startup';
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await b2bRegister(formData);

    if (result.success) {
      router.push('/login?message=registration_successful');
    } else {
      setError(result.error || 'An unknown error occurred.');
    }

    setLoading(false);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Start Your Team's Journey</CardTitle>
        <CardDescription>Create an account to manage your organization ({tier} Plan). Your account will be activated by an admin shortly.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
          <input type="hidden" name="tier" value={tier} />
          <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="companyName" required disabled={loading} />
          </div>
          <div className="grid gap-2">
              <Label htmlFor="name">Your Full Name</Label>
              <Input id="name" name="name" required disabled={loading} />
          </div>
          <div className="grid gap-2">
              <Label htmlFor="email">Your Email</Label>
              <Input id="email" name="email" type="email" required disabled={loading} />
          </div>
          <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} disabled={loading}/>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
