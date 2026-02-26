import { NextRequest, NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Get the app URL from environment variable
// Falls back to request origin in development, but should always use env var in production
const getAppUrl = (request: NextRequest): string => {
  // First priority: explicit environment variable (without NEXT_PUBLIC_ prefix for server-side)
  // Try both NEXT_PUBLIC_APP_URL and APP_URL for backwards compatibility
  if (process.env.NEXT_PUBLIC_APP_URL) {
    console.log('✅ Using NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL);
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (process.env.APP_URL) {
    console.log('✅ Using APP_URL:', process.env.APP_URL);
    return process.env.APP_URL;
  }

  // Second priority: Vercel URL (in production)
  if (process.env.VERCEL_URL) {
    console.log('✅ Using VERCEL_URL:', process.env.VERCEL_URL);
    return `https://${process.env.VERCEL_URL}`;
  }

  // Third priority: extract from request headers
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';

  console.log('⚠️ Falling back to request headers - host:', host, 'protocol:', protocol);

  if (host && !host.includes('0.0.0.0') && !host.includes('localhost')) {
    return `${protocol}://${host}`;
  }

  // Last resort fallback for development
  console.log('⚠️ Using development fallback URL');
  return 'http://localhost:3000';
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { email, amount, metadata, reference } = body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      console.error('❌ Invalid email provided:', email);
      return NextResponse.json(
        { success: false, message: 'Valid email address is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Get the proper app URL for callbacks
    const appUrl = getAppUrl(request);
    const callbackUrl = `${appUrl}/payment/callback`;

    console.log('🔗 Payment callback URL:', callbackUrl);

    // Initialize payment with Paystack
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Convert to kobo/cents
        currency: 'KES',
        reference: reference || `KSS_${Date.now()}`,
        callback_url: callbackUrl,
        metadata: {
          ...metadata,
          platform: 'Kenya School of Sales'
        }
      }),
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack initialization failed:', data);
      return NextResponse.json(
        { success: false, message: data.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference
      }
    });

  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
