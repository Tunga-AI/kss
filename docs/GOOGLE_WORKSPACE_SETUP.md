# Google Workspace Email Service Setup

This guide will help you set up Google Workspace integration with the Kenya School of Sales for comprehensive email services including authentication, invoices, and notifications.

## Prerequisites

- Google Workspace account (you mentioned you have one)
- Google Cloud Project with Gmail API enabled
- Admin access to your Google Workspace domain

## Step 1: Google Cloud Project Setup

### 1.1 Create or Select a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note down your project ID

### 1.2 Enable Gmail API
1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Gmail API"
3. Click on "Gmail API" and click **Enable**

### 1.3 Create Service Account (Recommended for Production)
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details:
   - Name: `kenyaschoolofsales-email-service`
   - Description: `Service account for Kenya School of Sales email services`
4. Click **Create and Continue**
5. Grant the service account the **Editor** role
6. Click **Continue** and then **Done**

### 1.4 Create Service Account Key
1. Click on the created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Download the JSON file and keep it secure

## Step 2: Google Workspace Domain Setup

### 2.1 Enable Domain-Wide Delegation
1. Go to [Google Admin Console](https://admin.google.com/)
2. Navigate to **Security** > **Access and data control** > **API controls**
3. Click **Domain-wide delegation**
4. Click **Add new** and enter:
   - Client ID: From your service account JSON file
   - OAuth scopes: `https://www.googleapis.com/auth/gmail.send`
5. Click **Authorize**

### 2.2 Create System Email Account
1. In Google Admin Console, go to **Users**
2. Create a new user account (e.g., `system@kenyaschoolofsales.co.ke`)
3. This account will be used to send all system emails

## Step 3: OAuth2 Setup (Alternative to Service Account)

If you prefer OAuth2 (simpler for development):

### 3.1 Create OAuth2 Credentials
1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (for development)
   - `https://your-domain.com/auth/google/callback` (for production)
5. Download the client configuration

### 3.2 Get Refresh Token
Run this script to get your refresh token:

```javascript
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'YOUR_REDIRECT_URI'
);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: ['https://www.googleapis.com/auth/gmail.send'],
});

console.log('Visit this URL to authorize the app:', authUrl);
// After authorization, you'll get a code
// Use this code to get tokens:
// const { tokens } = await oauth2Client.getToken(authorizationCode);
```

## Step 4: Environment Configuration

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration (existing)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google Workspace Email Service Configuration
VITE_GOOGLE_CLIENT_ID=your_oauth2_client_id
VITE_GOOGLE_CLIENT_SECRET=your_oauth2_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
VITE_GOOGLE_REFRESH_TOKEN=your_refresh_token

# Email Configuration
VITE_SYSTEM_EMAIL=system@kenyaschoolofsales.co.ke
VITE_SYSTEM_NAME=Kenya School of Sales
VITE_VERIFICATION_SECRET=your_secure_random_string

# Optional: Service Account (if using service account instead of OAuth2)
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=kenyaschoolofsales-email-service@your-project.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY=your_private_key_from_json
```

## Step 5: Production Setup

### 5.1 Update Firebase Security Rules
Add these rules to your `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Verification codes collection
    match /verificationCodes/{document} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 5.2 Environment Variables for Production
Set these environment variables in your production environment:

```bash
# For Vercel/Netlify
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_CLIENT_SECRET=your_client_secret
VITE_GOOGLE_REFRESH_TOKEN=your_refresh_token
VITE_SYSTEM_EMAIL=system@kenyaschoolofsales.co.ke
VITE_SYSTEM_NAME=Kenya School of Sales
VITE_VERIFICATION_SECRET=your_secure_random_string
```

### 5.3 Domain Configuration
1. Update your domain's SPF record to include Google:
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. Set up DKIM signing in Google Admin Console:
   - Go to **Apps** > **Google Workspace** > **Gmail**
   - Click **Authenticate email**
   - Follow the DKIM setup instructions

## Step 6: Testing the Email Service

### 6.1 Test Email Sending
Create a test script to verify your setup:

```javascript
import { EmailService } from './src/services/emailService';

async function testEmailService() {
  try {
    // Test verification email
    await EmailService.sendVerificationEmail('test@example.com', 'Test User');
    console.log('✅ Verification email sent successfully');

    // Test notification email
    await EmailService.sendNotificationEmail(
      'test@example.com',
      'Test User',
      'Test Notification',
      'This is a test notification from Kenya School of Sales.',
      'https://kenyaschoolofsales.co.ke'
    );
    console.log('✅ Notification email sent successfully');

  } catch (error) {
    console.error('❌ Email service test failed:', error);
  }
}

testEmailService();
```

### 6.2 Test Email Verification Flow
1. Sign up for a new account
2. Check that you receive a 6-digit verification code
3. Enter the code to verify your account
4. Confirm you receive a welcome email

## Step 7: Email Templates Customization

### 7.1 Brand Colors
Update the brand colors in `src/services/emailService.ts`:

```javascript
private static readonly BRAND_COLORS = {
  primary: '#your_primary_color',
  secondary: '#your_secondary_color',
  accent: '#your_accent_color',
  background: '#your_background_color',
  text: '#your_text_color',
};
```

### 7.2 Email Templates
You can customize the email templates in the `EmailTemplates` class:
- `emailVerification()` - Verification code email
- `passwordReset()` - Password reset email
- `welcomeEmail()` - Welcome email after verification
- `invoiceEmail()` - Invoice notifications
- `notificationEmail()` - General notifications

## Step 8: Monitoring and Analytics

### 8.1 Email Delivery Monitoring
1. Set up Google Cloud Monitoring for Gmail API
2. Monitor email delivery rates and failures
3. Set up alerts for high failure rates

### 8.2 Email Analytics
Track email performance:
- Open rates
- Click-through rates
- Bounce rates
- Spam complaints

## Troubleshooting

### Common Issues:

1. **"The user does not have permission to send emails"**
   - Check domain-wide delegation setup
   - Verify service account has correct permissions

2. **"Invalid credentials"**
   - Verify environment variables are set correctly
   - Check OAuth2 client ID and secret

3. **"Quota exceeded"**
   - Check Gmail API quotas in Google Cloud Console
   - Implement rate limiting if needed

4. **"Email not delivered"**
   - Check spam folders
   - Verify SPF and DKIM records
   - Check email content for spam triggers

### Support Resources:
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Google Workspace Admin Help](https://support.google.com/a)
- [Google Cloud Support](https://cloud.google.com/support)

## Security Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **Rate Limiting**: Implement email sending rate limits
3. **Input Validation**: Validate all email inputs
4. **Monitoring**: Monitor for unusual email patterns
5. **Backup**: Have a backup email service provider

## Next Steps

After completing this setup:
1. Test the email service thoroughly
2. Monitor email delivery rates
3. Set up email templates for different use cases
4. Implement email analytics tracking
5. Consider setting up email automation workflows

Your email service is now ready to handle authentication, invoices, notifications, and all other communication needs for the Kenya School of Sales! 