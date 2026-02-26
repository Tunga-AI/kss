import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Transaction test endpoint',
    timestamp: new Date().toISOString(),
    env: {
      hasPaystackPublic: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      hasPaystackSecret: !!process.env.PAYSTACK_SECRET_KEY,
      paystackPublicKeyPrefix: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.substring(0, 8),
    }
  });
}
