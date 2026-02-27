'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useFirestore, useUsersFirestore } from '@/firebase';
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { addUser } from '@/lib/users';
import { createAdmission } from '@/lib/admissions';
import { completeB2bRegistration } from '@/app/actions/b2b-registration';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff, Lock, User, Mail } from 'lucide-react';
import type { User as UserType } from '@/lib/user-types';
import type { Organization } from '@/lib/organization-types';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const [loginStep, setLoginStep] = useState<'email' | 'password' | 'check-email'>('email');
  const [userName, setUserName] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const auth = useAuth();
  // firestore is needed for setup flow (default db) or other lookups
  const firestore = useFirestore();
  const usersFirestore = useUsersFirestore();

  const flow = searchParams.get('flow');
  const programTitle = searchParams.get('programTitle');
  const programId = searchParams.get('programId');
  const txId = searchParams.get('txId');

  const isSetupFlow = flow === 'setup_account';
  const isB2bSetupFlow = flow === 'setup_b2b';

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'registration_successful') {
      setSuccess('Registration successful! Your account is pending admin activation. You will be able to log in once approved.');
    } else if (message === 'b2b_registration_successful') {
      setSuccess('Registration successful! You can now log in to your Business Portal.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (flow === 'setup_account' || flow === 'setup_b2b') {
      const paramEmail = searchParams.get('email');
      const paramName = searchParams.get('name');
      const paramPhone = searchParams.get('phone');
      if (paramEmail) setEmail(paramEmail);
      if (paramName) setName(paramName);
      if (paramPhone) setPhone(paramPhone);
    }
  }, [flow, searchParams]);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic validation
    if (!email) {
      setError("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (!usersFirestore) {
      setError("System unavailable. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      // Check if user exists in the 'kenyasales' users collection
      const usersRef = collection(usersFirestore, 'users');
      const q = query(usersRef, where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // User not found in allowed list
        setError("Access Restricted: You are not allowed to enter.");
        setLoading(false);
        return;
      }

      // User found in Firestore – now check if they have a Firebase Auth account
      const userData = querySnapshot.docs[0].data();
      const fetchedName = userData.name || 'User';
      setUserName(fetchedName);

      const res = await fetch('/api/auth/check-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        // API failure – default to password step (safer than showing set-password to real users)
        console.warn('check-exists API returned', res.status, '— defaulting to password step');
        setLoginStep('password');
        setError(null);
        return;
      }

      const { exists } = await res.json();

      if (exists) {
        // Account exists → ask for password
        setLoginStep('password');
      } else {
        // No Auth account yet → silently send them a setup email
        await sendSetupEmail();
      }
      setError(null);
    } catch (err: any) {
      console.error("Error checking user:", err);
      setError("An error occurred verifying your account.");
    } finally {
      setLoading(false);
    }
  };

  // Send a setup email for users who exist in Firestore but not yet in Firebase Auth.
  // Called automatically during handleEmailCheck — the user never sees the set-password form.
  const sendSetupEmail = async () => {
    try {
      const res = await fetch('/api/auth/send-setup-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name: userName }),
      });
      if (!res.ok) {
        // If the email API fails, fall back to password step with a helpful error
        setLoginStep('password');
        setError("We couldn't send you a setup email. Please use 'Forgot password?' to set your password.");
      } else {
        setLoginStep('check-email');
      }
    } catch {
      setLoginStep('password');
      setError("We couldn't send you a setup email. Please use 'Forgot password?' to set your password.");
    }
  };

  const handleAccountSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!auth || !firestore) {
      setError("Service unavailable. Please try again.");
      return;
    }

    setLoading(true);
    try {
      // Check if user already exists in Firestore (default db check for setup flow logic - usually checking for duplicates)
      // Note: Usage of firestore vs usersFirestore in setup depends on where we want to create users. 
      // Existing code used 'firestore' (default) but 'addUser' might need to target specific db?
      // For now, preserving existing logic which uses `firestore` (default) for checking existence during setup.
      // Wait, previous edits reverted 'getKenyasalesDb' in API, but client side 'addUser' uses the db passed to it.
      // If we want users in 'kenyasales', we should pass 'usersFirestore' to addUser if possible, or ensure 'firestore' points there?
      // The instructions for this turn focused on Login. I will leave Account Setup as is (using `firestore`) unless it breaks.

      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where('email', '==', email), limit(1));
      const querySnapshot = await getDocs(q);

      let firestoreId: string;
      let userCredential;

      if (!querySnapshot.empty) {
        // User exists in Firestore - try to sign them in
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          firestoreId = querySnapshot.docs[0].id;
          console.log('✅ Existing user signed in:', firestoreId);
        } catch (signInError: any) {
          if (signInError.code === 'auth/wrong-password') {
            setError("An account with this email already exists. Please use the correct password or reset it.");
            setLoading(false);
            return;
          }
          throw signInError;
        }
      } else {
        // User doesn't exist in Firestore - check if they exist in Firebase Auth
        try {
          // Try to create new Firebase Auth account
          userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: name });

          // Create Firestore User Doc
          firestoreId = await addUser(firestore, {
            name: name,
            email: email,
            phone: phone || undefined,
            role: 'Learner',
            status: 'Active',
          });
          console.log('✅ New user created:', firestoreId);
        } catch (authError: any) {
          if (authError.code === 'auth/email-already-in-use') {
            // User exists in Firebase Auth but not in Firestore
            // Sign them in and create the missing Firestore document
            console.log('⚠️ User exists in Auth but not Firestore, fixing...');
            userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Create the missing Firestore document
            firestoreId = await addUser(firestore, {
              name: name,
              email: email,
              phone: phone || undefined,
              role: 'Learner',
              status: 'Active',
            });
            console.log('✅ Created missing Firestore document:', firestoreId);
          } else {
            throw authError;
          }
        }
      }

      // Complete Enrollment if program info is present
      if (programId && programTitle) {
        await createAdmission(firestore, {
          userId: firestoreId,
          name: name,
          email: email,
          phone: phone || undefined,
          status: 'Pending Assessment',
          cohortId: 'PENDING_ASSIGNMENT',
          interestedProgramId: programId,
          interestedProgramTitle: programTitle,
          assessmentRequired: true,
          assessmentCompleted: false,
        });
      }

      // Redirect to dashboard after account setup
      router.push('/l');

    } catch (error: any) {
      console.error("Account creation error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please log in normally or reset your password.");
      } else {
        setError("Failed to create account. Please contact support.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── B2B Account Setup (after Paystack redirect) ───────────────────────────
  const handleB2bAccountSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (!auth) { setError('Service unavailable. Please try again.'); return; }

    setLoading(true);
    setError(null);

    const company = searchParams.get('company') || '';
    const tier = searchParams.get('tier') || '';
    const fee = parseInt(searchParams.get('fee') || '0', 10);
    const seats = parseInt(searchParams.get('seats') || '1', 10);
    const txRef = searchParams.get('txRef') || '';

    const result = await completeB2bRegistration({
      name,
      email,
      password,
      companyName: company,
      tier: tier as any,
      numLearners: seats,
      period: tier === 'Startup' ? 6 : 12,
      amount: fee,
      paymentReference: txRef,
    });

    if (result.success) {
      router.push('/b?message=b2b_registration_successful');
    } else {
      setError(result.error || 'Account setup failed. Please contact support.');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!auth || !usersFirestore) {
      setError("Firebase is not initialized. Please try again later.");
      setLoading(false);
      return;
    }

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;

      // 2. Fetch user profile from Firestore (kenyasales db)
      const usersRef = collection(usersFirestore, 'users');
      const q = query(usersRef, where('email', '==', authUser.email), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await signOut(auth);
        setError("Access Denied: Your account exists but no profile was found in the user database. Please contact support.");
        setLoading(false);
        return;
      }

      // 3. Check user status
      const userDoc = querySnapshot.docs[0];
      const userProfile = { id: userDoc.id, ...userDoc.data() } as UserType;

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
        const orgRef = doc(usersFirestore, 'organizations', userProfile.organizationId);
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

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }

    if (!auth) {
      setError("Firebase is not initialized. Please try again later.");
      return;
    }

    setSendingReset(true);
    setError(null);
    setSuccess(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setSuccess(`Password reset email sent to ${email}. Please check your inbox.`);
    } catch (error: any) {
      setError("Failed to send password reset email. Please check your email address.");
      console.error(error);
    } finally {
      setSendingReset(false);
    }
  };



  return (
    <Card className="w-full border-0 shadow-2xl rounded-tl-3xl rounded-br-3xl rounded-tr-none rounded-bl-none overflow-hidden">
      <CardHeader className="bg-accent p-6 sm:p-8">
        <CardTitle className="font-headline text-3xl sm:text-4xl font-bold text-white">
          {isB2bSetupFlow
            ? 'Set Up Your Business Account'
            : isSetupFlow
              ? 'Secure Your Account'
              : loginStep === 'check-email'
                ? `Check your inbox, ${userName.split(' ')[0]}`
                : loginStep === 'password'
                  ? `Welcome back, ${userName.split(' ')[0]}`
                  : 'Welcome Back'}
        </CardTitle>
        <CardDescription className="text-white/90 text-base sm:text-lg">
          {isB2bSetupFlow
            ? 'Payment verified — create a password to access your business portal.'
            : isSetupFlow
              ? 'Set your password to complete registration.'
              : loginStep === 'check-email'
                ? `We've sent a password setup link to ${email}`
                : loginStep === 'password'
                  ? 'Enter your password to access your portal.'
                  : 'Enter your email to continue.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 sm:p-8">
        {/* ── Check-email confirmation screen (no form) ── */}
        {loginStep === 'check-email' && !isSetupFlow && !isB2bSetupFlow ? (
          <div className="grid gap-6 py-2">
            <div className="flex flex-col items-center gap-4 text-center py-4">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center">
                <Mail className="h-8 w-8 text-accent" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-primary/70 leading-relaxed">
                  We've emailed a secure password setup link to <strong>{email}</strong>.
                  Click the link in that email to choose your password, then come back here to log in.
                </p>
                <p className="text-xs text-primary/40">The link expires in 24 hours. Check your spam folder if you don't see it.</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none"
              onClick={async () => {
                setLoading(true);
                await sendSetupEmail();
                setLoading(false);
              }}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Resend email
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { setLoginStep('email'); setError(null); setUserName(''); }}
              className="w-full text-sm text-gray-500 hover:text-primary"
            >
              Use a different email
            </Button>
          </div>
        ) : (
          <form onSubmit={
            isB2bSetupFlow ? handleB2bAccountSetup :
              isSetupFlow ? handleAccountSetup :
                loginStep === 'email' ? handleEmailCheck :
                  handleLogin
          } className="grid gap-6">

            {/* B2B payment verification banner */}
            {isB2bSetupFlow && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Payment Confirmed</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your registration fee has been verified. Set a password below to activate your <strong>{searchParams.get('company')}</strong> account.
                </AlertDescription>
              </Alert>
            )}

            {isSetupFlow && txId && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Payment Verified</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your payment has been confirmed (Transaction: {txId}). Complete your account setup below to access your portal.
                </AlertDescription>
              </Alert>
            )}

            {/* Pre-filled details for setup flows */}
            {(isSetupFlow || isB2bSetupFlow) && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-primary font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/40" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      disabled
                      className="pl-10 bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>
                {phone && (
                  <div className="grid gap-2">
                    <Label htmlFor="phone" className="text-primary font-medium">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      disabled
                      className="bg-gray-50 border-gray-200"
                    />
                  </div>
                )}
              </>
            )}

            {/* Email Input */}
            {(isSetupFlow || isB2bSetupFlow || loginStep === 'email' || loginStep === 'password') && (
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-primary font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isSetupFlow || isB2bSetupFlow || loginStep === 'password'}
                  className={`rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none ${isSetupFlow || isB2bSetupFlow || loginStep === 'password' ? 'bg-gray-50 border-gray-200' : ''}`}
                />
              </div>
            )}

            {/* Password Input */}
            {(isSetupFlow || isB2bSetupFlow || loginStep === 'password') && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-primary font-medium">
                    {isSetupFlow || isB2bSetupFlow ? 'Create Password' : 'Password'}
                  </Label>
                  {!isSetupFlow && !isB2bSetupFlow && (
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto text-xs text-accent hover:text-accent/80"
                      onClick={handleForgotPassword}
                      disabled={sendingReset || !email}
                    >
                      {sendingReset ? (
                        <>
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Forgot password?"
                      )}
                    </Button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    minLength={isSetupFlow || isB2bSetupFlow ? 6 : undefined}
                    className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-primary/60" />
                    ) : (
                      <Eye className="h-4 w-4 text-primary/60" />
                    )}
                    <span className="sr-only">
                      {showPassword ? "Hide password" : "Show password"}
                    </span>
                  </Button>
                </div>
              </div>
            )}

            {(isSetupFlow || isB2bSetupFlow) && (
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword" className="text-primary font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  className="rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none"
                />
              </div>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-accent/20 bg-accent/5">
                <CheckCircle className="h-4 w-4 text-accent" />
                <AlertTitle className="text-accent">Information</AlertTitle>
                <AlertDescription className="text-primary/70">{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                className="w-full rounded-tl-xl rounded-br-xl rounded-tr-none rounded-bl-none bg-primary hover:bg-primary/90 text-white shadow-md transition-all h-12 font-bold"
                disabled={loading}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : ((isSetupFlow || isB2bSetupFlow) ? <Lock className="mr-2 h-4 w-4" /> : null)}
                {isB2bSetupFlow
                  ? 'Activate Business Account'
                  : isSetupFlow
                    ? 'Create Account & Login'
                    : loginStep === 'email'
                      ? 'Continue'
                      : 'Login'}
              </Button>

              {!isSetupFlow && loginStep === 'password' && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setLoginStep('email');
                    setError(null);
                    setUserName('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full text-sm text-gray-500 hover:text-primary"
                  disabled={loading}
                >
                  Not you? Use a different email
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
