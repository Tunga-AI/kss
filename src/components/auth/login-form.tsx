'use client';
    
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import type { User } from '@/lib/user-types';
import type { Organization } from '@/lib/organization-types';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  const firestore = useFirestore();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'registration_successful') {
        setSuccess('Registration successful! Your account is pending admin activation. You will be able to log in once approved.');
    } else if (message === 'b2b_registration_successful') {
        setSuccess('Registration successful! You can now log in to your Business Portal.');
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!auth || !firestore) {
      setError("Firebase is not initialized. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;

      // 2. Fetch user profile from Firestore
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', authUser.email), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await signOut(auth);
        setError("You are not permitted to access this application. Please contact an administrator.");
        setLoading(false);
        return;
      }

      // 3. Check user status
      const userDoc = querySnapshot.docs[0];
      const userProfile = { id: userDoc.id, ...userDoc.data() } as User;

      if (userProfile.status === 'Inactive') {
        await signOut(auth);
        setError("Your account has been deactivated. Please contact an administrator.");
        setLoading(false);
        return;
      }

      // 4. Determine role and redirect
      let redirectPath = '/l'; // Default to learner
      const role = userProfile.role;
      
      if (['Admin', 'Sales', 'Finance', 'Business', 'Operations'].includes(role)) {
        redirectPath = '/a';
      } else if (role === 'Facilitator') {
        redirectPath = '/f';
      } else if (role === 'BusinessAdmin') {
         if (!userProfile.organizationId) {
            await signOut(auth);
            setError("Your account is not configured correctly. Missing organization link.");
            setLoading(false);
            return;
        }
        const orgRef = doc(firestore, 'organizations', userProfile.organizationId);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists() || ((orgDoc.data() as Organization).status !== 'Active' && (orgDoc.data() as Organization).status !== 'Trial')) {
            await signOut(auth);
            setError("Your organization's account is not active. Please wait for activation or contact support.");
            setLoading(false);
            return;
        }
        redirectPath = '/b';
      }
      
      router.push(redirectPath);

    } catch (authError: any) {
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError("Invalid email or password. Please try again.");
          break;
        default:
          setError("An unexpected error occurred. Please try again.");
          console.error(authError);
          break;
      }
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Welcome Back</CardTitle>
        <CardDescription>Enter your credentials to access your portal.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="grid gap-6">
          <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
              />
          </div>
          <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
              />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Login Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
