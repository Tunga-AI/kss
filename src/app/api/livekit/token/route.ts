import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from 'firebase-admin';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
function getFirebaseAdmin() {
    if (!getApps().length) {
        try {
            let privateKey = process.env.FIREBASE_PRIVATE_KEY;
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
            const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

            if (!projectId) return { error: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing' };
            if (!clientEmail) return { error: 'FIREBASE_CLIENT_EMAIL is missing' };
            if (!privateKey) return { error: 'FIREBASE_PRIVATE_KEY is missing' };

            // Robust private key parsing
            // 1. Remove literal quotes if they were included by the env loader
            privateKey = privateKey.trim().replace(/^["']|["']$/g, '');
            // 2. Replace literal \n with actual newlines
            privateKey = privateKey.replace(/\\n/g, '\n');

            initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
        } catch (error: any) {
            return { error: `Firebase Admin Init Error: ${error.message}` };
        }
    }
    return { auth: auth() };
}

export async function POST(request: NextRequest) {
    try {
        const admin = getFirebaseAdmin();
        if (admin.error) {
            return NextResponse.json(
                { error: admin.error },
                { status: 500 }
            );
        }

        const firebaseAuth = admin.auth!;
        const { roomName, participantName, metadata, token: idToken } = await request.json();

        if (!roomName || !participantName || !idToken) {
            return NextResponse.json(
                { error: 'Missing required parameters' },
                { status: 400 }
            );
        }

        // Verify Firebase token
        let decodedToken;
        try {
            decodedToken = await firebaseAuth.verifyIdToken(idToken);
        } catch (error) {
            console.error('Token verification error:', error);
            return NextResponse.json(
                { error: 'Invalid authentication token' },
                { status: 401 }
            );
        }

        // Get LiveKit credentials from environment
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

        if (!apiKey || !apiSecret || !wsUrl) {
            return NextResponse.json(
                { error: 'LiveKit configuration missing' },
                { status: 500 }
            );
        }

        // Create LiveKit access token
        const at = new AccessToken(apiKey, apiSecret, {
            identity: decodedToken.uid,
            name: participantName,
            metadata: JSON.stringify({
                ...metadata,
                email: decodedToken.email,
                userId: decodedToken.uid,
            }),
        });

        // Role-based permissions
        const isInstructor = metadata?.role === 'instructor';

        // Grant permissions
        at.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,            // Everyone can publish video/audio
            canSubscribe: true,          // Everyone can subscribe
            canPublishData: true,        // Everyone can chat
        });

        const token = await at.toJwt();

        return NextResponse.json({
            token,
            wsUrl,
            participantId: decodedToken.uid,
        });
    } catch (error) {
        console.error('Error generating LiveKit token:', error);
        return NextResponse.json(
            { error: 'Failed to generate token' },
            { status: 500 }
        );
    }
}
