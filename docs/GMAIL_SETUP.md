# Gmail API Integration Setup Guide

This guide will help you set up Gmail API integration for your Kenya School of Sales using your G Suite account.

## Prerequisites

- A G Suite (Google Workspace) account
- Access to Google Cloud Console
- Firebase project with Functions enabled

## Step 1: Enable Gmail API

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project or create a new one
3. Navigate to **APIs & Services** > **Library**
4. Search for "Gmail API" and click on it
5. Click **Enable**

## Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required information:
     - App name: "Kenya School of Sales"
     - User support email: Your email
     - Developer contact information: Your email
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.compose`
   - Add test users (your email addresses)
4. Create the OAuth 2.0 client:
   - Application type: **Web application**
   - Name: "Kenya School of Sales Gmail Integration"
   - Authorized redirect URIs: 
     - `https://your-project-id.firebaseapp.com/__/auth/handler`
     - `http://localhost:5001/your-project-id/us-central1/__/auth/handler` (for local development)

## Step 3: Generate Refresh Token

1. Create a simple HTML file to generate the refresh token:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Gmail OAuth Setup</title>
</head>
<body>
    <h1>Gmail OAuth Setup</h1>
    <button onclick="authenticate()">Authenticate with Gmail</button>
    <div id="result"></div>

    <script>
        const CLIENT_ID = 'YOUR_CLIENT_ID';
        const REDIRECT_URI = 'http://localhost:5001/your-project-id/us-central1/__/auth/handler';
        const SCOPES = ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.compose'];

        function authenticate() {
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${CLIENT_ID}&` +
                `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
                `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
                `response_type=code&` +
                `access_type=offline&` +
                `prompt=consent`;

            window.location.href = authUrl;
        }

        // Handle the redirect
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            document.getElementById('result').innerHTML = `
                <h3>Authorization Code Received:</h3>
                <p>${code}</p>
                <p>Use this code to get a refresh token using the following curl command:</p>
                <pre>
curl -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&code=${code}&grant_type=authorization_code&redirect_uri=${REDIRECT_URI}"
                </pre>
            `;
        }
    </script>
</body>
</html>
```

2. Replace `YOUR_CLIENT_ID` with your actual client ID
3. Open the HTML file in a browser
4. Click "Authenticate with Gmail"
5. Authorize the application
6. Copy the authorization code from the result
7. Use curl to exchange the code for a refresh token:

```bash
curl -X POST https://oauth2.googleapis.com/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET&code=AUTHORIZATION_CODE&grant_type=authorization_code&redirect_uri=YOUR_REDIRECT_URI"
```

8. Save the refresh token from the response

## Step 4: Configure Firebase Functions

1. Set the Firebase Functions configuration:

```bash
# Set Google OAuth credentials
firebase functions:config:set google.client_id="YOUR_CLIENT_ID"
firebase functions:config:set google.client_secret="YOUR_CLIENT_SECRET"
firebase functions:config:set google.redirect_uri="YOUR_REDIRECT_URI"
firebase functions:config:set google.refresh_token="YOUR_REFRESH_TOKEN"

# Set email configuration
firebase functions:config:set email.from_email="noreply@yourdomain.com"
firebase functions:config:set email.from_name="Kenya School of Sales"
firebase functions:config:set email.reply_to="support@yourdomain.com"
firebase functions:config:set email.verification_secret="your-secret-key"
```

2. Deploy the functions:

```bash
firebase deploy --only functions
```

## Step 5: Test the Integration

1. Test email sending from your application
2. Check the Firebase Functions logs for any errors
3. Verify emails are being sent from your G Suite account

## Step 6: Environment Variables (Optional)

For local development, you can also set environment variables:

```bash
# Create .env file in functions directory
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
GOOGLE_REFRESH_TOKEN=your_refresh_token
EMAIL_FROM_EMAIL=noreply@yourdomain.com
EMAIL_FROM_NAME=Kenya School of Sales
EMAIL_REPLY_TO=support@yourdomain.com
EMAIL_VERIFICATION_SECRET=your_secret_key
```

## Troubleshooting

### Common Issues

1. **"Invalid Credentials" Error**
   - Verify your client ID and client secret are correct
   - Ensure the refresh token is valid and not expired
   - Check that the Gmail API is enabled

2. **"Access Denied" Error**
   - Verify the OAuth consent screen is configured correctly
   - Check that your email is added as a test user
   - Ensure the required scopes are added

3. **"Quota Exceeded" Error**
   - Gmail API has daily quotas
   - Monitor usage in Google Cloud Console
   - Consider implementing rate limiting

4. **"Authentication Failed" Error**
   - Refresh tokens can expire
   - Generate a new refresh token if needed
   - Check Firebase Functions logs for detailed error messages

### Monitoring

1. **Google Cloud Console**
   - Monitor API usage and quotas
   - Check for any authentication errors
   - Review OAuth consent screen status

2. **Firebase Functions Logs**
   ```bash
   firebase functions:log
   ```

3. **Email Logs**
   - Check the `email_logs` collection in Firestore
   - Monitor email delivery status
   - Track failed email attempts

## Security Best Practices

1. **Secure Storage**
   - Never commit credentials to version control
   - Use Firebase Functions config for production
   - Rotate refresh tokens regularly

2. **Rate Limiting**
   - Implement rate limiting for email sending
   - Monitor API quotas
   - Handle quota exceeded errors gracefully

3. **Error Handling**
   - Implement proper error handling
   - Log all email operations
   - Provide fallback mechanisms

4. **Domain Verification**
   - Verify your domain with Google
   - Use SPF and DKIM records
   - Monitor email deliverability

## Email Templates

The system includes several email templates:

- **Email Verification**: For account verification
- **Welcome Email**: For new users
- **Payment Confirmation**: For successful payments
- **Application Status Update**: For application updates
- **Session Reminder**: For upcoming sessions
- **Invoice Email**: For invoice delivery
- **Bulk Notifications**: For mass communications

All templates use Handlebars for dynamic content and include responsive design.

## Advanced Configuration

### Custom Email Templates

You can customize email templates by modifying the `EmailTemplates` class in `functions/src/emailService.ts`.

### Email Scheduling

For scheduled emails, consider using Firebase Functions with Cloud Scheduler:

```typescript
// Example scheduled function
export const sendScheduledEmails = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    // Send scheduled emails
  });
```

### Email Analytics

Track email performance by monitoring:

- Delivery rates
- Open rates (requires tracking pixels)
- Click-through rates
- Bounce rates

## Support

If you encounter issues:

1. Check the Firebase Functions logs
2. Verify your Gmail API configuration
3. Test with a simple email first
4. Review the troubleshooting section above

For additional help, refer to:
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Nodemailer Documentation](https://nodemailer.com/) 