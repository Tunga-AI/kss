import { NextRequest, NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference');

    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Payment reference is required' },
        { status: 400 }
      );
    }

    // Verify payment with Paystack
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!data.status) {
      console.error('Paystack verification failed:', data);
      return NextResponse.json(
        { success: false, message: data.message || 'Payment verification failed' },
        { status: 400 }
      );
    }

    const payment = data.data;

    return NextResponse.json({
      success: true,
      data: {
        reference: payment.reference,
        amount: payment.amount / 100, // Convert from kobo/cents to KES
        status: payment.status,
        paid_at: payment.paid_at,
        channel: payment.channel,
        currency: payment.currency,
        gateway_response: payment.gateway_response,
        metadata: payment.metadata
      }
    });

  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
