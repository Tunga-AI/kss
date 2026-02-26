import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { sendEmail } from '@/lib/email-service';

// Initialize Firebase Admin
if (!getApps().length) {
    const serviceAccount = JSON.parse(
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON as string ||
        '{}'
    );

    // Only initialize if we have credentials (local/prod check)
    if (serviceAccount.project_id) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        initializeApp();
    }
}

const db = getFirestore();

export async function POST(req: NextRequest) {
    try {
        const { to, subject, html, text } = await req.json();

        if (!to || !subject) {
            return NextResponse.json({ error: 'Missing required fields: to, subject' }, { status: 400 });
        }

        if (!html && !text) {
            return NextResponse.json({ error: 'Either html or text content is required' }, { status: 400 });
        }

        // Send the email
        const info = await sendEmail({ to, subject, html, text });

        // Log email to Firestore
        await db.collection('email_logs').add({
            to,
            subject,
            status: 'sent',
            sentAt: new Date(),
            messageId: info.messageId,
        });

        return NextResponse.json({ success: true, messageId: info.messageId });

    } catch (error: any) {
        console.error('Email sending error:', error);

        // Log failed email to Firestore
        try {
            await db.collection('email_logs').add({
                to: (await req.json()).to,
                subject: (await req.json()).subject,
                status: 'failed',
                error: error.message,
                sentAt: new Date(),
            });
        } catch (logError) {
            console.error('Failed to log email error:', logError);
        }

        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }
}
