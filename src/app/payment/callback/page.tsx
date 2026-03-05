'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore } from '@/firebase';
import { addTransaction } from '@/lib/transactions';

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const firestore = useFirestore();

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');
  const [paymentData, setPaymentData] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference');

        if (!reference) {
          setStatus('failed');
          setMessage('Invalid payment reference');
          return;
        }

        console.log('Verifying payment:', reference);

        // Call backend to verify payment
        const response = await fetch(`/api/paystack/verify?reference=${reference}`);
        const result = await response.json();

        console.log('Verification result:', result);

        if (!result.success || result.data.status !== 'success') {
          setStatus('failed');
          setMessage(result.message || 'Payment verification failed');
          return;
        }

        const payment = result.data;
        const metadata = payment.metadata || {};

        console.log('Payment successful:', payment);

        // Save transaction to database and handle post-payment actions
        if (firestore) {
          try {
            // Import required functions
            const { updateAdmission } = await import('@/lib/admissions');
            const { addLearner } = await import('@/lib/learners');

            // Update admission status if applicable
            if (metadata.isCoreCourse && metadata.admissionId) {
              await updateAdmission(firestore, metadata.admissionId, { status: 'Pending Review' });
            }

            // Record transaction
            const transactionData = {
              learnerName: metadata.learnerName || metadata.patient_name || 'Guest',
              learnerEmail: metadata.learnerEmail || metadata.email || 'unknown',
              program: metadata.program || metadata.service_name || 'Unknown Program',
              amount: payment.amount,
              currency: payment.currency || 'KES',
              status: 'Success' as const,
              paystackReference: payment.reference,
              ticketCount: metadata.ticketCount,
            };

            console.log('💾 Saving transaction with data:', transactionData);
            const txId = await addTransaction(firestore, transactionData);
            console.log('✅ Transaction saved with ID:', txId);
            console.log('📧 Transaction saved for email:', transactionData.learnerEmail);

            // Create user document in Firestore for new learners
            // This ensures they appear in the users collection, not just Firebase Auth
            // Skip for B2B accounts, they are created during the setup_b2b flow
            let currentUserId = metadata.userId;
            if (!metadata.tier) {
              try {
                console.log('👤 Creating user document for:', transactionData.learnerEmail);
                const userCreateResponse = await fetch('/api/users/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: transactionData.learnerEmail,
                    name: transactionData.learnerName,
                    role: 'Learner',
                    authUid: metadata.userId || null,
                  }),
                });

                const userResult = await userCreateResponse.json();

                if (userResult.success) {
                  currentUserId = userResult.data.userId;
                  console.log('✅ User document created:', userResult.data.userId);
                } else {
                  console.error('❌ Failed to create user document:', userResult.message);
                }
              } catch (userError) {
                console.error('Error creating user document:', userError);
                // Don't fail the whole process if user creation fails
              }
            }

            // Record Elearning Enrollment if applicable
            if (metadata.isElearning && currentUserId && metadata.programId) {
              try {
                const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
                const enrollRef = doc(firestore, 'elearningEnrollments', `${currentUserId}_${metadata.programId}`);
                await setDoc(enrollRef, {
                  userId: currentUserId,
                  email: metadata.learnerEmail,
                  programId: metadata.programId,
                  programSlug: metadata.programSlug,
                  programName: metadata.program,
                  paystackReference: payment.reference,
                  enrolledAt: serverTimestamp(),
                  status: 'active',
                }, { merge: true });
                console.log('✅ E-learning enrollment recorded for user:', currentUserId);
              } catch (enrollErr) {
                console.error('Error recording e-learning enrollment:', enrollErr);
              }
            }

            // Add learner record for non-core courses with logged-in user
            if (!metadata.isCoreCourse && metadata.userId && !metadata.tier) {
              await addLearner(firestore, {
                name: metadata.learnerName,
                email: metadata.learnerEmail,
                program: metadata.program
              });
            }

            // Send welcome email after successful payment
            try {
              const response = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: metadata.learnerEmail,
                  subject: `Welcome to KSS Academy! Next Steps for ${metadata.program}`,
                  html: `
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <style>
                          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                          .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                          .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 10px 10px; }
                          .step { background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
                          .step-number { display: inline-block; width: 30px; height: 30px; background: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 30px; margin-right: 10px; font-weight: bold; }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <div class="header">
                            <h1 style="margin: 0;">🎉 Welcome to KSS Academy!</h1>
                            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your journey begins here</p>
                          </div>
                          <div class="content">
                            <h2>Hello ${metadata.learnerName},</h2>
                            <p>Congratulations! Your registration for <strong>${metadata.program}</strong> has been successfully confirmed.</p>
                            <p>We're excited to have you join our learning community. Here's what happens next:</p>
                            
                            <div class="step">
                              <span class="step-number">1</span>
                              <strong>Complete Your Assessment</strong>
                              <p style="margin: 10px 0 0 0;">To ensure we place you in the right program level, you'll need to complete a brief assessment. This helps us tailor the learning experience to your current knowledge and skills.</p>
                            </div>
                            
                            <div class="step">
                              <span class="step-number">2</span>
                              <strong>Program Placement</strong>
                              <p style="margin: 10px 0 0 0;">Based on your assessment results, we'll recommend the most suitable program track for you.</p>
                            </div>
                            
                            <div class="step">
                              <span class="step-number">3</span>
                              <strong>Start Learning</strong>
                              <p style="margin: 10px 0 0 0;">Once placed, you'll get access to your personalized learning dashboard and can begin your journey!</p>
                            </div>
                            
                            <p style="margin-top: 30px;">
                              <strong>Need help?</strong> Our support team is here for you. Simply reply to this email or reach out to us at hi@kss.or.ke
                            </p>
                            
                            <p style="margin-top: 30px;">
                              Welcome aboard,<br>
                              <strong>The KSS Academy Team</strong>
                            </p>
                          </div>
                          <div class="footer">
                            <p>© ${new Date().getFullYear()} KSS Academy. All rights reserved.</p>
                            <p style="margin-top: 10px;">
                              <a href="mailto:hi@kss.or.ke" style="color: #667eea; text-decoration: none;">hi@kss.or.ke</a>
                            </p>
                          </div>
                        </div>
                      </body>
                    </html>
                  `,
                  text: `🎉 Welcome to KSS Academy!\n\nHello ${metadata.learnerName},\n\nCongratulations! Your registration for ${metadata.program} has been successfully confirmed.\n\nHere's what happens next:\n\n1. Complete Your Assessment\nTo ensure we place you in the right program level, you'll need to complete a brief assessment.\n\n2. Program Placement\nBased on your assessment results, we'll recommend the most suitable program track for you.\n\n3. Start Learning\nOnce placed, you'll get access to your personalized learning dashboard and can begin your journey!\n\nNeed help? Our support team is here for you at hi@kss.or.ke\n\nWelcome aboard,\nThe KSS Academy Team`
                }),
              });

              if (response.ok) {
                console.log('✅ Welcome email sent to:', metadata.learnerEmail);
              } else {
                console.error('❌ Failed to send welcome email:', await response.text());
              }
            } catch (emailError) {
              console.error('Email error:', emailError);
              // Don't fail the whole process if email fails
            }

            setPaymentData({
              ...payment,
              txId,
              metadata
            });
          } catch (dbError) {
            console.error('Error saving transaction:', dbError);
            // Continue anyway - payment was successful
          }
        }

        setStatus('success');
        setMessage('Payment successful!');

        // Redirect after 3 seconds
        setTimeout(() => {
          let redirectUrl = metadata.redirectUrl || '/l/finance';

          // For B2B flows, append the actual payment reference so the setup page can complete registration
          if (redirectUrl.includes('/business/setup') || redirectUrl.includes('flow=setup_b2b')) {
            redirectUrl += `&txRef=${encodeURIComponent(payment.reference)}`;
            router.push(redirectUrl);
            return;
          }

          // Check if user needs to log in first
          const isProtectedRoute = redirectUrl.startsWith('/l/') || redirectUrl.startsWith('/f/') || redirectUrl.startsWith('/admin/');

          if (isProtectedRoute) {
            router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}&payment=success`);
          } else {
            router.push(redirectUrl);
          }
        }, 3000);

      } catch (error: any) {
        console.error('Payment verification error:', error);
        setStatus('failed');
        setMessage(error.message || 'An error occurred while verifying your payment');
      }
    };

    verifyPayment();
  }, [searchParams, router, firestore]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center space-y-6">
            {status === 'verifying' && (
              <>
                <Loader2 className="h-16 w-16 text-accent animate-spin" />
                <h2 className="text-2xl font-bold text-primary">Verifying Payment</h2>
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Payment Successful!</h2>
                <p className="text-gray-600">{message}</p>
                {paymentData && (
                  <div className="w-full bg-gray-50 p-4 rounded-lg space-y-2 text-left">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono font-bold">{paymentData.txId}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Reference:</span>
                      <span className="font-mono text-xs">{paymentData.reference}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-bold">KES {paymentData.amount.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                <p className="text-sm text-gray-500">Redirecting you now...</p>
              </>
            )}

            {status === 'failed' && (
              <>
                <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-primary">Payment Failed</h2>
                <p className="text-gray-600">{message}</p>
                <Button onClick={() => router.push('/courses')} className="mt-4">
                  Go Back to Courses
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <Loader2 className="h-16 w-16 text-accent animate-spin" />
              <h2 className="text-2xl font-bold text-primary">Loading...</h2>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <PaymentCallbackContent />
    </Suspense>
  );
}
