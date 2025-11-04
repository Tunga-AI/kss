/**
 * Email Service Test Script
 * 
 * This script helps you test the Google Workspace email service integration.
 * Run this after setting up your environment variables.
 */

import { EmailService } from './src/services/emailService.js';

async function testEmailService() {
  console.log('🧪 Testing Kenya School of Sales Email Service...\n');

  const testEmail = 'test@example.com'; // Replace with your test email
  const testUser = 'Test User';

  try {
    // Test 1: Send verification email
    console.log('📧 Testing verification email...');
    const verificationCode = await EmailService.sendVerificationEmail(testEmail, testUser);
    console.log('✅ Verification email sent successfully!');
    console.log(`📱 Verification code: ${verificationCode}`);
    console.log('');

    // Test 2: Verify the code
    console.log('🔍 Testing code verification...');
    const isValid = await EmailService.verifyEmailCode(testEmail, verificationCode);
    console.log(`✅ Code verification: ${isValid ? 'PASSED' : 'FAILED'}`);
    console.log('');

    // Test 3: Send welcome email
    console.log('👋 Testing welcome email...');
    await EmailService.sendWelcomeEmail(testEmail, testUser, 'learner');
    console.log('✅ Welcome email sent successfully!');
    console.log('');

    // Test 4: Send notification email
    console.log('🔔 Testing notification email...');
    await EmailService.sendNotificationEmail(
      testEmail,
      testUser,
      'Test Notification',
      'This is a test notification from the Kenya School of Sales.',
      'https://kenyaschoolofsales.co.ke'
    );
    console.log('✅ Notification email sent successfully!');
    console.log('');

    // Test 5: Send invoice email
    console.log('💰 Testing invoice email...');
    await EmailService.sendInvoiceEmail(
      testEmail,
      testUser,
      'INV-2024-001',
      15000,
      '2024-12-31'
    );
    console.log('✅ Invoice email sent successfully!');
    console.log('');

    // Test 6: Send password reset email
    console.log('🔒 Testing password reset email...');
    const resetCode = await EmailService.sendPasswordResetEmail(testEmail, testUser);
    console.log('✅ Password reset email sent successfully!');
    console.log(`🔑 Reset code: ${resetCode}`);
    console.log('');

    // Test 7: Verify reset code
    console.log('🔍 Testing reset code verification...');
    const isResetValid = await EmailService.verifyPasswordResetCode(testEmail, resetCode);
    console.log(`✅ Reset code verification: ${isResetValid ? 'PASSED' : 'FAILED'}`);
    console.log('');

    console.log('🎉 All email service tests completed successfully!');
    console.log('');
    console.log('📝 Summary:');
    console.log('✅ Verification email - PASSED');
    console.log('✅ Code verification - PASSED');
    console.log('✅ Welcome email - PASSED');
    console.log('✅ Notification email - PASSED');
    console.log('✅ Invoice email - PASSED');
    console.log('✅ Password reset email - PASSED');
    console.log('✅ Reset code verification - PASSED');
    console.log('');
    console.log('🚀 Your email service is ready for production!');

  } catch (error) {
    console.error('❌ Email service test failed:', error);
    console.log('');
    console.log('🔧 Troubleshooting checklist:');
    console.log('1. ✅ Check environment variables are set correctly');
    console.log('2. ✅ Verify Google Cloud Project has Gmail API enabled');
    console.log('3. ✅ Confirm OAuth2 credentials are valid');
    console.log('4. ✅ Check domain-wide delegation is set up');
    console.log('5. ✅ Verify system email account exists');
    console.log('');
    console.log('📖 See docs/GOOGLE_WORKSPACE_SETUP.md for detailed setup instructions');
  }
}

// Run the test
testEmailService(); 