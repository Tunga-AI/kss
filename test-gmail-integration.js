#!/usr/bin/env node

/**
 * Test Gmail Integration Script
 * 
 * This script tests the Gmail API integration by sending a test email
 * through the Firebase Functions.
 * 
 * Usage:
 * node test-gmail-integration.js
 */

const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase configuration (replace with your config)
const firebaseConfig = {
  apiKey: "AIzaSyB0zPzaidQLDpNyrh7ReaiRyNhp8HOAPfc",
  authDomain: "msommii.firebaseapp.com",
  projectId: "msommii",
  storageBucket: "msommii.firebasestorage.app",
  messagingSenderId: "610946556395",
  appId: "1:610946556395:web:facd538c2cbada7b88b9ae",
  measurementId: "G-S60Y2Q9EXF"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const functions = getFunctions(app, 'us-central1');

// Test email function
const sendTestEmail = httpsCallable(functions, 'sendVerificationEmail');

async function testGmailIntegration() {
  console.log('🧪 Testing Gmail Integration...\n');

  try {
    // Test data
    const testEmail = 'test@example.com'; // Replace with your test email
    const testUserName = 'Test User';

    console.log('📧 Sending test verification email...');
    console.log(`To: ${testEmail}`);
    console.log(`User: ${testUserName}\n`);

    // Send test email
    const result = await sendTestEmail({
      email: testEmail,
      userName: testUserName
    });

    const data = result.data;

    if (data.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📝 Verification code: ${data.verificationCode}`);
      console.log('\n📋 Next steps:');
      console.log('1. Check your email inbox');
      console.log('2. Verify the email was received');
      console.log('3. Check Firebase Functions logs for any errors');
      console.log('4. Verify the email_logs collection in Firestore');
    } else {
      console.error('❌ Failed to send test email:', data.error);
    }

  } catch (error) {
    console.error('❌ Error testing Gmail integration:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if Firebase Functions are deployed');
    console.log('2. Verify Gmail API credentials are configured');
    console.log('3. Check Firebase Functions logs');
    console.log('4. Ensure the Gmail API is enabled in Google Cloud Console');
  }
}

// Run the test
if (require.main === module) {
  testGmailIntegration()
    .then(() => {
      console.log('\n🏁 Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testGmailIntegration }; 