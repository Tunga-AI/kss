import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Reuse existing admin app if already initialised
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'msommii';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    admin.initializeApp({ projectId });
  }
}

/**
 * POST /api/auth/check-exists
 * Body: { email: string }
 * Returns: { exists: boolean }
 *
 * Uses the Firebase Admin SDK to check whether a Firebase Auth account
 * already exists for the given email address.  This cannot be done from
 * the client SDK, so we proxy it through this server route.
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    try {
      await admin.auth().getUserByEmail(email);
      return NextResponse.json({ exists: true });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        return NextResponse.json({ exists: false });
      }
      throw err;
    }
  } catch (error: any) {
    console.error('check-exists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
