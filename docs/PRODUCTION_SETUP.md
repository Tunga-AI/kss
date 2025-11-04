# 🚀 Production Setup Guide

## Overview
This guide covers the complete production setup for the Kenya School of Sales, including security configurations, environment variables, and deployment procedures.

## 📋 Pre-Production Checklist

### 1. Security Configuration

#### ✅ Firebase Security Rules
The `firestore.rules` file contains comprehensive security rules that:
- **Enforce email verification** before allowing access to sensitive data
- **Implement role-based access control** (admin, staff, learner, applicant)
- **Protect user data** with proper ownership and permission checks
- **Prevent unauthorized access** to collections and documents

#### ✅ Environment Variables
Create a `.env` file with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Google APIs (Optional)
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_API_KEY=your_google_api_key

# Application Configuration
VITE_APP_NAME=Kenya School of Sales
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# Security Configuration
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_CRASHLYTICS=true

# Email Configuration
VITE_SUPPORT_EMAIL=support@kenyaschoolofsales.co.ke
VITE_ADMIN_EMAIL=admin@kenyaschoolofsales.co.ke

# Rate Limiting (requests per minute)
VITE_AUTH_RATE_LIMIT=10
VITE_API_RATE_LIMIT=100

# Feature Flags
VITE_ENABLE_VIDEO_CONFERENCING=true
VITE_ENABLE_RECRUITMENT_MODULE=true
VITE_ENABLE_PAYMENT_INTEGRATION=false

# External Services (Optional)
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_MIXPANEL_TOKEN=your_mixpanel_token_here

# Cloud Storage Settings
VITE_MAX_FILE_SIZE=5242880  # 5MB in bytes
VITE_ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx

# Session Configuration
VITE_SESSION_TIMEOUT=3600000  # 1 hour in milliseconds
VITE_REMEMBER_ME_DURATION=2592000000  # 30 days in milliseconds
```

### 2. Firebase Project Setup

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Storage
   - Analytics (optional)

#### Step 2: Configure Authentication
1. Go to Authentication → Sign-in method
2. Enable **Email/Password** authentication
3. Configure email verification settings:
   - Go to Authentication → Templates
   - Customize email verification template
   - Set up action URL: `https://your-domain.com/auth/verify-email`

#### Step 3: Deploy Security Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Deploy security rules
firebase deploy --only firestore:rules
firebase deploy --only storage
```

#### Step 4: Configure Firestore Database
1. Create database in production mode
2. Deploy the security rules from `firestore.rules`
3. Set up indexes for optimal performance:

```javascript
// Recommended indexes for production
- Collection: users, Fields: email (Ascending), role (Ascending)
- Collection: applicants, Fields: email (Ascending), status (Ascending)
- Collection: staff, Fields: email (Ascending), department (Ascending)
- Collection: learners, Fields: email (Ascending), programId (Ascending)
- Collection: events, Fields: date (Ascending), isPublic (Ascending)
- Collection: sessions, Fields: cohortId (Ascending), date (Ascending)
- Collection: testAttempts, Fields: testId (Ascending), applicantId (Ascending)
```

### 3. Security Hardening

#### ✅ Content Security Policy
Add to your `index.html`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https: blob:;
  connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net;
  media-src 'self' blob:;
">
```

#### ✅ Firebase App Check (Recommended)
1. Enable App Check in Firebase Console
2. Add reCAPTCHA for web apps
3. Configure in your app:

```typescript
// Add to src/config/firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// Initialize App Check
if (import.meta.env.PROD) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
    isTokenAutoRefreshEnabled: true
  });
}
```

### 4. Email Verification Configuration

#### ✅ Custom Email Templates
1. Go to Firebase Console → Authentication → Templates
2. Customize the email verification template
3. Set action URL to: `https://your-domain.com/auth/verify-email`
4. Add your branding and styling

#### ✅ Email Domain Configuration
1. Go to Firebase Console → Authentication → Settings
2. Add authorized domains:
   - `your-domain.com`
   - `www.your-domain.com`
   - `localhost` (for development)

### 5. Performance Optimization

#### ✅ Firestore Optimization
```typescript
// Add to src/config/firebase.ts
import { connectFirestoreEmulator, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

// Enable offline persistence
try {
  await enableMultiTabIndexedDbPersistence(db);
} catch (err) {
  console.warn('Firestore persistence failed:', err);
}
```

#### ✅ Bundle Optimization
```typescript
// Add to vite.config.ts
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
```

### 6. Monitoring & Analytics

#### ✅ Error Tracking (Sentry)
```bash
npm install @sentry/react @sentry/tracing
```

```typescript
// Add to src/main.tsx
import * as Sentry from '@sentry/react';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_APP_ENVIRONMENT,
    tracesSampleRate: 0.1,
  });
}
```

#### ✅ Performance Monitoring
```typescript
// Add to src/config/firebase.ts
import { getPerformance } from 'firebase/performance';

if (import.meta.env.PROD) {
  getPerformance(app);
}
```

### 7. Deployment

#### ✅ Google Cloud Build
The existing `cloudbuild.yaml` is configured for deployment. Update:

```yaml
steps:
  # Build and push Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/kenya-school-of-sales', '.']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/kenya-school-of-sales']

  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'kenya-school-of-sales'
      - '--image=gcr.io/$PROJECT_ID/kenya-school-of-sales'
      - '--region=us-central1'
      - '--allow-unauthenticated'
      - '--memory=1Gi'
      - '--cpu=1'
      - '--max-instances=100'
      - '--set-env-vars=NODE_ENV=production'
```

#### ✅ Environment Variables in Cloud Run
Set environment variables in Cloud Run:
```bash
gcloud run services update kenya-school-of-sales \
  --set-env-vars="VITE_FIREBASE_API_KEY=your_api_key,VITE_FIREBASE_PROJECT_ID=your_project_id" \
  --region=us-central1
```

### 8. Testing

#### ✅ Security Testing
```bash
# Test Firebase rules
npm install -g @firebase/rules-unit-testing
firebase emulators:exec --project=demo-project "npm run test:security"
```

#### ✅ Performance Testing
```bash
# Test application performance
npm install -g lighthouse
lighthouse https://your-domain.com --output=json --output-path=./lighthouse-report.json
```

### 9. Maintenance

#### ✅ Regular Updates
- Update Firebase SDK regularly
- Monitor security advisories
- Update dependencies monthly
- Review and update security rules

#### ✅ Backup Strategy
- Firestore automatic backups
- Export user data regularly
- Monitor storage usage
- Set up alerts for errors

### 10. Go-Live Checklist

- [ ] Environment variables configured
- [ ] Firebase security rules deployed
- [ ] Email verification working
- [ ] All authentication flows tested
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] SSL certificate configured
- [ ] Domain configured
- [ ] Email templates customized
- [ ] Rate limiting tested
- [ ] Security headers configured
- [ ] Backup procedures tested

## 🔐 Security Best Practices

1. **Never commit sensitive data** to version control
2. **Use environment variables** for all configuration
3. **Enable email verification** for all users
4. **Implement proper role-based access control**
5. **Use HTTPS** for all communications
6. **Enable Firebase App Check** for production
7. **Monitor authentication logs** regularly
8. **Set up proper error handling** and logging
9. **Use Firebase security rules** to protect data
10. **Regular security audits** and penetration testing

## 📞 Support

For technical support or questions:
- Email: technical@kenyaschoolofsales.co.ke
- Documentation: https://docs.kenyaschoolofsales.co.ke
- Support Portal: https://support.kenyaschoolofsales.co.ke

---

**⚠️ Important**: This setup ensures production-ready security with proper email verification enforcement. Users cannot access the platform until they verify their email address. 