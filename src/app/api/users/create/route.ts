import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'msommii';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (clientEmail && privateKey) {
      // Initialize with service account credentials
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        databaseURL: `https://${projectId}.firebaseio.com`,
      });
    } else {
      // Initialize with minimal config for local development
      admin.initializeApp({
        projectId,
      });
    }

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

// Get Firestore instance pointing to the 'kenyasales' named database
const getKenyasalesDb = (): admin.firestore.Firestore => {
  const appName = 'kenyasales-app';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'msommii';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  let kssApp: admin.app.App;
  try {
    kssApp = admin.app(appName);
  } catch {
    const credential = (clientEmail && privateKey)
      ? admin.credential.cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') })
      : admin.credential.applicationDefault();
    kssApp = admin.initializeApp({ credential }, appName);
  }

  const db = admin.firestore(kssApp);
  try { db.settings({ databaseId: 'kenyasales', ignoreUndefinedProperties: true }); } catch { /* already set */ }
  return db;
};

/**
 * Generate sequential ID for user
 */
async function generateUserId(db: admin.firestore.Firestore, role: string): Promise<string> {
  let prefix = 'U';
  let counterName = 'users';

  if (role === 'Facilitator') {
    prefix = 'F';
    counterName = 'facilitators';
  } else if (role === 'Learner' || role === 'BusinessLearner') {
    prefix = 'L';
    counterName = 'learners';
  }

  const counterRef = db.collection('counters').doc(counterName);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let newCount = 1;
      if (counterDoc.exists) {
        const currentCount = counterDoc.data()?.count || 0;
        newCount = currentCount + 1;
      }

      transaction.set(counterRef, { count: newCount }, { merge: true });
      return `${prefix}-${newCount}`;
    });

    return result;
  } catch (error) {
    console.error('Error generating ID:', error);
    // Fallback to timestamp-based ID
    return `${prefix}-${Date.now()}`;
  }
}

/**
 * POST /api/users/create
 * Create a new user document in Firestore (kenyasales database)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role = 'Learner', authUid } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, message: 'Email and name are required' },
        { status: 400 }
      );
    }

    const db = getKenyasalesDb();

    // Check if user already exists
    const existingUsersQuery = await db
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (!existingUsersQuery.empty) {
      const existingUser = existingUsersQuery.docs[0];
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        data: {
          userId: existingUser.id,
          ...existingUser.data(),
        },
      });
    }

    // Generate sequential ID
    const userId = await generateUserId(db, role);

    // Create user document
    const userData = {
      name,
      email: email.toLowerCase(),
      role,
      authUid: authUid || null,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection('users').doc(userId).set(userData);

    // Also create learner profile if role is Learner
    if (role === 'Learner' || role === 'BusinessLearner') {
      const learnerData = {
        name,
        email: email.toLowerCase(),
        avatar: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('learners').doc(userId).set(learnerData);
    }

    console.log(`✅ User created successfully: ${userId} (${email})`);

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: {
        userId,
        ...userData,
      },
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
