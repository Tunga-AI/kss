'use client';
    
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { usePaystackPayment } from 'react-paystack';
import { completeB2bRegistration } from '@/app/actions/b2b-registration';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, AlertCircle } from 'lucide-react';

function B2bRegistrationFormComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // Form State
    const [companyName, setCompanyName] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [numLearners, setNumLearners] = useState(1);
    const [period, setPeriod] = useState("6"); // months
    const [totalPrice, setTotalPrice] = useState(0);
    const [agreed, setAgreed] = useState(false);

    // B2B Tier Info from URL
    const tier = searchParams.get('tier') || 'Startup';
    const pricePerUser = parseInt(searchParams.get('price') || '40', 10);
    
    // UI State
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const total = pricePerUser * numLearners * parseInt(period, 10);
        setTotalPrice(total);
    }, [numLearners, period, pricePerUser]);

    const paystackConfig = {
        reference: new Date().getTime().toString(),
        email: email,
        amount: totalPrice * 100, // Amount in kobo
        currency: 'KES',
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
        metadata: {
            custom_fields: [
                { display_name: "Full Name", variable_name: "full_name", value: name },
                { display_name: "Company", variable_name: "company", value: companyName },
                { display_name: "Subscription Tier", variable_name: "subscription_tier", value: tier },
                { display_name: "Number of Learners", variable_name: "num_learners", value: numLearners },
                { display_name: "Subscription Period", variable_name: "subscription_period", value: `${period} months` },
            ]
        }
    };
    const initializePayment = usePaystackPayment(paystackConfig);

    const onPaymentSuccess = async (reference: any) => {
        setLoading(true);
        setError(null);

        const result = await completeB2bRegistration({
            name, email, password, companyName, tier,
            numLearners: Number(numLearners),
            period: Number(period),
            amount: totalPrice,
            paymentReference: reference.reference
        });
        
        if (result.success) {
            router.push('/login?message=b2b_registration_successful');
        } else {
            setError(result.error || 'An unknown error occurred during final setup.');
            setLoading(false);
        }
    };

    const onPaymentClose = () => {
        setLoading(false);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        initializePayment(onPaymentSuccess, onPaymentClose);
    };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Start Your Team's Journey</CardTitle>
        <CardDescription>Create an account to manage your organization ({tier} Plan).</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} required disabled={loading} />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="name">Your Full Name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required disabled={loading} />
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="email">Your Email</Label>
                  <Input id="email" value={email} onChange={e => setEmail(e.target.value)} type="email" required disabled={loading} />
              </div>
          </div>
          <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" value={password} onChange={e => setPassword(e.target.value)} type="password" required minLength={6} disabled={loading}/>
          </div>
          <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                    <Label htmlFor="numLearners">Number of Learners</Label>
                    <Input id="numLearners" type="number" min="1" value={numLearners} onChange={e => setNumLearners(parseInt(e.target.value, 10))} required disabled={loading}/>
              </div>
              <div className="grid gap-2">
                  <Label>Subscription Period</Label>
                    <RadioGroup defaultValue="6" value={period} onValueChange={setPeriod} className="flex items-center space-x-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="6" id="r1" />
                            <Label htmlFor="r1">6 Months</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="12" id="r2" />
                            <Label htmlFor="r2">12 Months</Label>
                        </div>
                    </RadioGroup>
              </div>
          </div>
          
           <div className="flex items-start space-x-2">
              <Checkbox 
                  id="terms" 
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked === true)}
                  disabled={loading}
              />
              <div className="grid gap-1.5 leading-none">
                  <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                      I agree to the <Link href="/terms" className="underline hover:text-primary" target="_blank">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-primary" target="_blank">Privacy Policy</Link>.
                  </label>
              </div>
          </div>

           <Card className="bg-muted">
                <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Cost</span>
                        <span className="text-2xl font-bold">KES {totalPrice.toLocaleString()}</span>
                    </div>
                </CardContent>
           </Card>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading || totalPrice === 0 || !agreed}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function B2bRegistrationForm() {
    return (
        <Suspense fallback={
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Start Your Team's Journey</CardTitle>
                </CardHeader>
                <CardContent>
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground"/>
                </CardContent>
            </Card>
        }>
            <B2bRegistrationFormComponent />
        </Suspense>
    )
}
