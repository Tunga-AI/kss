# 🔐 Environment Variables Setup Guide

This guide covers all environment variables needed for the Kenya School of Sales, including payment gateway configurations.

## 📋 Quick Setup

1. Create a `.env` file in your project root
2. Copy the template below and fill in your actual values
3. Never commit the `.env` file to version control

## 🏗️ Environment Variables Template

```env
# ==============================================
# FIREBASE CONFIGURATION
# ==============================================
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ==============================================
# PAYMENT GATEWAY CONFIGURATION
# ==============================================


# M-Pesa Configuration (Legacy)
VITE_MPESA_TILL_NUMBER=your_mpesa_till_number
VITE_MPESA_PAYBILL_NUMBER=your_mpesa_paybill_number
VITE_MPESA_ENVIRONMENT=production

# Safaricom Daraja API Configuration (STK Push)
SAFARICOM_CONSUMER_KEY=your_safaricom_consumer_key
SAFARICOM_CONSUMER_SECRET=your_safaricom_consumer_secret
SAFARICOM_BUSINESS_SHORTCODE=your_business_shortcode
SAFARICOM_PASSKEY=your_safaricom_passkey
SAFARICOM_ENVIRONMENT=sandbox

# For Production (when ready to go live)
# SAFARICOM_ENVIRONMENT=production
# SAFARICOM_CONSUMER_KEY=your_production_consumer_key
# SAFARICOM_CONSUMER_SECRET=your_production_consumer_secret
# SAFARICOM_BUSINESS_SHORTCODE=your_production_business_shortcode
# SAFARICOM_PASSKEY=your_production_passkey

# ==============================================
# GOOGLE SERVICES CONFIGURATION
# ==============================================
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
VITE_GOOGLE_API_KEY=your_google_api_key

# ==============================================
# APPLICATION CONFIGURATION
# ==============================================
VITE_APP_NAME=Kenya School of Sales
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production

# ==============================================
# EMAIL CONFIGURATION
# ==============================================
VITE_SYSTEM_EMAIL=noreply@kenyaschoolofsales.co.ke
VITE_SYSTEM_NAME=Kenya School of Sales
VITE_SUPPORT_EMAIL=support@kenyaschoolofsales.co.ke
VITE_ADMIN_EMAIL=admin@kenyaschoolofsales.co.ke
VITE_VERIFICATION_SECRET=your_verification_secret_key

# ==============================================
# FEATURE FLAGS
# ==============================================
VITE_ENABLE_VIDEO_CONFERENCING=true
VITE_ENABLE_RECRUITMENT_MODULE=true
VITE_ENABLE_PAYMENT_INTEGRATION=true

# ==============================================
# EXTERNAL SERVICES (OPTIONAL)
# ==============================================
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_MIXPANEL_TOKEN=your_mixpanel_token_here

# ==============================================
# BANKING CONFIGURATION
# ==============================================
VITE_BANK_NAME=Equity Bank Kenya
VITE_BANK_ACCOUNT_NAME=Kenya School of Sales
VITE_BANK_ACCOUNT_NUMBER=your_bank_account_number
VITE_BANK_SWIFT_CODE=EQBLKENA
VITE_BANK_BRANCH_CODE=068
```

## 🛡️ Security Best Practices

### Environment Variables Security
- ✅ Never commit `.env` files to Git
- ✅ Use different credentials for staging/production
- ✅ Rotate credentials regularly
- ✅ Restrict API access by IP when possible

## 📞 Support & Resources

### Kenya School of Sales Support
- Check logs in browser console
- Review Firestore collections for data integrity
- Contact development team for technical issues

---

## ⚠️ Important Notes

1. **Environment Variables**: Ensure all required variables are properly configured
2. **Security**: Keep all credentials secure and never expose them in client-side code
3. **Testing**: Test all integrations thoroughly before deploying to production 