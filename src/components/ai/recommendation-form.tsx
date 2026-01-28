'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { FormState } from '@/app/actions/recommendations';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { CheckCircle, Info, List, Loader2, Sparkles } from 'lucide-react';
import React from 'react';

const initialState: FormState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Get Recommendations
        </>
      )}
    </Button>
  );
}

export function RecommendationForm({ action }: { action: (prevState: FormState, formData: FormData) => Promise<FormState> }) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = React.useRef<HTMLFormElement>(null);

  React.useEffect(() => {
    if(state.recommendations) {
        formRef.current?.reset();
    }
  }, [state.recommendations]);

  return (
    <form action={formAction} ref={formRef}>
      <Card>
        <CardContent className="pt-6">
          <div className="grid w-full items-center gap-6">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="learnerProfile">Your Profile & Interests</Label>
              <Textarea id="learnerProfile" name="learnerProfile" placeholder="e.g., I am a junior sales representative with 2 years of experience in the SaaS industry. I'm interested in improving my negotiation and client management skills." rows={5} />
              {state.errors?.learnerProfile && <p className="text-sm text-destructive">{state.errors.learnerProfile[0]}</p>}
            </div>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="learningHistory">Your Learning History</Label>
              <Textarea id="learningHistory" name="learningHistory" placeholder="e.g., I have completed a basic sales methodology course and a workshop on public speaking. I found the practical exercises most helpful." rows={5} />
              {state.errors?.learningHistory && <p className="text-sm text-destructive">{state.errors.learningHistory[0]}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start gap-4">
          <SubmitButton />
          {state.message && !state.recommendations && (
             <Alert variant={state.errors ? "destructive" : "default"}>
                <Info className="h-4 w-4" />
                <AlertTitle>{state.errors ? "Error" : "Status"}</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
        </CardFooter>
      </Card>
      {state.recommendations && state.recommendations.length > 0 && (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 font-headline text-xl"><CheckCircle className="h-6 w-6 text-accent" /> Here are your AI-powered recommendations!</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-3">
                    {state.recommendations.map((course, index) => (
                        <li key={index} className="flex items-start gap-3 p-3 rounded-md bg-accent/10">
                            <List className="h-5 w-5 text-primary mt-1 flex-shrink-0"/>
                            <span className="font-medium">{course}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      )}
    </form>
  );
}
