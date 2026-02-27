import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { sendEmail } from '@/lib/email-service';

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
                privateKey: privateKey.includes('\\n')
                    ? privateKey.replace(/\\n/g, '\n')
                    : privateKey,
            }),
        });
    } else {
        admin.initializeApp({ projectId });
    }
}

/**
 * POST /api/auth/send-setup-email
 * Body: { email: string; name?: string }
 *
 * For users who exist in Firestore but not yet in Firebase Auth:
 * 1. Creates their Firebase Auth account (random temp password)
 * 2. Generates a password reset link so they can set their own password
 * 3. Sends them a branded "Set Your Password" email
 *
 * This is safer than an inline set-password form and gives a familiar UX.
 */
export async function POST(request: NextRequest) {
    try {
        const { email, name } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'email is required' }, { status: 400 });
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sales-uurxypxfoa-uc.a.run.app';
        const firstName = name ? name.split(' ')[0] : 'there';

        // Step 1: Create the Firebase Auth user if they don't already exist
        let userRecord: admin.auth.UserRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch (err: any) {
            if (err.code === 'auth/user-not-found') {
                // Create with a random secure temp password — they will reset it via email
                const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2).toUpperCase() + '!1';
                userRecord = await admin.auth().createUser({ email, password: tempPassword, displayName: name });
            } else {
                throw err;
            }
        }

        // Step 2: Generate the Firebase password reset link
        const resetLink = await admin.auth().generatePasswordResetLink(email, {
            url: `${appUrl}/login?message=password_set`,
        });

        // Step 3: Send the branded email
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f6f6f6; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: #1a3a5c; padding: 36px 40px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.75); margin: 8px 0 0; font-size: 14px; }
    .body { padding: 40px; }
    .body p { color: #444; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
    .cta { text-align: center; margin: 32px 0; }
    .cta a { background: #e85d2f; color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; }
    .note { background: #f0f4f8; border-radius: 8px; padding: 16px 20px; margin: 24px 0 0; }
    .note p { color: #666; font-size: 13px; margin: 0; line-height: 1.6; }
    .footer { text-align: center; padding: 20px 40px 32px; color: #aaa; font-size: 12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>KSS Academy</h1>
      <p>Your learning portal</p>
    </div>
    <div class="body">
      <p>Hi <strong>${firstName}</strong>,</p>
      <p>Your KSS Academy account is ready. To get started, just set your password by clicking the button below:</p>
      <div class="cta">
        <a href="${resetLink}">Set My Password</a>
      </div>
      <div class="note">
        <p>⏰ This link expires in <strong>24 hours</strong>. If you didn't request this, you can safely ignore this email — your account won't be activated.</p>
      </div>
      <p style="margin-top: 24px;">Once you've set your password, you can sign in at:</p>
      <p><a href="${appUrl}/login" style="color: #1a3a5c; font-weight: 600;">${appUrl}/login</a></p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} KSS Academy. All rights reserved.</p>
      <p>If the button above doesn't work, copy this link into your browser:<br><span style="word-break: break-all;">${resetLink}</span></p>
    </div>
  </div>
</body>
</html>`;

        await sendEmail({
            to: email,
            subject: 'Set your KSS Academy password',
            html,
            text: `Hi ${firstName},\n\nYour KSS Academy account is ready. Set your password here (link expires in 24 hours):\n\n${resetLink}\n\nOnce done, sign in at: ${appUrl}/login`,
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[send-setup-email] error:', error);
        return NextResponse.json({ error: 'Failed to send setup email', detail: error.message }, { status: 500 });
    }
}
