import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify Paystack webhook signature
 */
function verifyPaystackSignature(payload: string, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    console.error('PAYSTACK_SECRET_KEY not configured');
    return false;
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex');

  return hash === signature;
}

/**
 * POST /api/paystack/webhook
 * Handle Paystack webhook events for payment notifications
 * This provides backup user creation in case the callback page fails
 */
export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      console.error('Missing Paystack signature');
      return NextResponse.json(
        { success: false, message: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (!verifyPaystackSignature(payload, signature)) {
      console.error('Invalid Paystack signature');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(payload);

    console.log('📨 Paystack webhook received:', event.event);

    // Handle charge.success event
    if (event.event === 'charge.success') {
      const data = event.data;
      const metadata = data.metadata || {};

      console.log('💰 Payment successful via webhook:', data.reference);
      console.log('👤 Learner:', metadata.learnerName, '/', metadata.learnerEmail);

      // Create user document if it doesn't exist
      if (metadata.learnerEmail && metadata.learnerName) {
        try {
          const userCreateResponse = await fetch(
            `${request.nextUrl.origin}/api/users/create`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: metadata.learnerEmail,
                name: metadata.learnerName,
                role: 'Learner',
                authUid: metadata.userId || null,
              }),
            }
          );

          const userResult = await userCreateResponse.json();

          if (userResult.success) {
            console.log('✅ User created via webhook:', userResult.data.userId);
          } else {
            console.error('❌ Failed to create user via webhook:', userResult.message);
          }
        } catch (error) {
          console.error('Error creating user via webhook:', error);
        }
      }
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true, message: 'Webhook processed' });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    // Return 200 to prevent Paystack from retrying
    return NextResponse.json(
      { success: false, message: 'Webhook processing failed' },
      { status: 200 }
    );
  }
}
