import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Reuse existing admin app if already initialised
let adminInitError: string | null = null;

if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'msommii';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          // Secret Manager secrets come through as plain text with real newlines.
          // Env var strings in Cloud Run may have escaped \n — handle both.
          privateKey: privateKey.includes('\\n')
            ? privateKey.replace(/\\n/g, '\n')
            : privateKey,
        }),
      });
    } catch (initErr: any) {
      adminInitError = initErr.message;
      console.error('[check-exists] Firebase Admin init failed:', initErr.message);
    }
  } else {
    console.warn('[check-exists] Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY — Admin SDK not fully initialised.');
    adminInitError = 'Missing Firebase Admin credentials';
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

    if (adminInitError) {
      console.error('[check-exists] Admin SDK not ready:', adminInitError);
      return NextResponse.json({ error: 'Admin SDK not initialised', detail: adminInitError }, { status: 500 });
    }

    try {
      await admin.auth().getUserByEmail(email);
      return NextResponse.json({ exists: true });
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        return NextResponse.json({ exists: false });
      }
      console.error('[check-exists] getUserByEmail error:', err.code, err.message);
      throw err;
    }
  } catch (error: any) {
    console.error('[check-exists] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
