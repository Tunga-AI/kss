import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import * as adminFirestore from 'firebase-admin/firestore';

// Reuse existing admin app
let app: admin.app.App;
let adminInitError: string | null = null;

if (!admin.apps.length) {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'msommii';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (clientEmail && privateKey) {
        try {
            app = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.includes('\\n') ? privateKey.replace(/\\n/g, '\n') : privateKey,
                }),
            });
        } catch (e: any) {
            adminInitError = e.message;
            console.error('[fix-user] Admin init failed:', e.message);
        }
    } else {
        adminInitError = 'Missing Firebase Admin credentials';
    }
} else {
    app = admin.apps[0]!;
}

/**
 * POST /api/auth/fix-user
 * Body: { email: string, name: string, role: string }
 * Creates the missing Firestore user doc in 'kenyasales' database for a user
 * who exists in Firebase Auth but has no Firestore profile.
 */
export async function POST(request: NextRequest) {
    if (adminInitError) {
        return NextResponse.json({ error: adminInitError }, { status: 500 });
    }
    try {
        const { email, name, role = 'Admin' } = await request.json();
        if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });

        // Verify the Auth user exists
        const authUser = await admin.auth().getUserByEmail(email).catch(() => null);
        if (!authUser) {
            return NextResponse.json({ error: `No Firebase Auth account for ${email}` }, { status: 404 });
        }

        // Get Firestore on kenyasales database
        const db = adminFirestore.getFirestore(app, 'kenyasales');

        // Check if doc already exists
        const usersRef = db.collection('users');
        const existing = await usersRef.where('email', '==', email).limit(1).get();
        if (!existing.empty) {
            return NextResponse.json({ message: 'User already exists in Firestore', id: existing.docs[0].id });
        }

        // Generate a sequential ID (simple approach — use timestamp-based)
        const id = `U${Date.now()}`;
        await usersRef.doc(id).set({
            name: name || authUser.displayName || email.split('@')[0],
            email,
            role,
            status: 'Active',
            createdAt: adminFirestore.FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, id, message: `Created Firestore profile for ${email}` });
    } catch (err: any) {
        console.error('[fix-user] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
