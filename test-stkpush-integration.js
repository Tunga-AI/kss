/**
 * Test Script for Safaricom Daraja STK Push Integration
 * 
 * This script tests the STK Push integration for Kenya School of Sales
 * Run this after starting the production server to verify the integration works.
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:8080';

// Test data (using Safaricom sandbox test numbers)
const TEST_DATA = {
  phoneNumber: '254708374149', // Safaricom test number
  amount: 1, // Minimum amount for testing
  reference: 'TEST_KSS_' + Date.now(),
  narration: 'Test payment for Kenya School of Sales'
};

async function testServerHealth() {
  console.log('🏥 Testing server health...');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Server is healthy');
      console.log(`   Environment: ${data.environment}`);
      console.log(`   Safaricom API: ${data.safaricom.baseUrl}`);
      console.log(`   Business ShortCode: ${data.safaricom.businessShortCode}`);
      return true;
    } else {
      console.error('❌ Server health check failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Could not connect to server:', error.message);
    console.log('   Make sure the server is running with: npm run start');
    return false;
  }
}

async function testSTKPush() {
  console.log('📱 Testing STK Push...');
  console.log(`   Phone: ${TEST_DATA.phoneNumber}`);
  console.log(`   Amount: KES ${TEST_DATA.amount}`);
  console.log(`   Reference: ${TEST_DATA.reference}`);
  
  try {
    const response = await fetch(`${SERVER_URL}/api/stkpush`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(TEST_DATA)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ STK Push initiated successfully');
      console.log(`   Merchant Request ID: ${data.data.MerchantRequestID}`);
      console.log(`   Checkout Request ID: ${data.data.CheckoutRequestID}`);
      console.log(`   Customer Message: ${data.data.CustomerMessage}`);
      
      // Return checkout request ID for status checking
      return data.data.CheckoutRequestID;
    } else {
      console.error('❌ STK Push failed:', data.message || data.error);
      if (data.data) {
        console.error('   Response Code:', data.data.ResponseCode);
        console.error('   Response Description:', data.data.ResponseDescription);
      }
      return null;
    }
  } catch (error) {
    console.error('❌ STK Push request failed:', error.message);
    return null;
  }
}

async function testSTKPushQuery(checkoutRequestId) {
  console.log('🔍 Testing STK Push status query...');
  console.log(`   Checkout Request ID: ${checkoutRequestId}`);
  
  try {
    const response = await fetch(`${SERVER_URL}/api/stkpush/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ checkoutRequestId })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ STK Push query successful');
      console.log(`   Result Code: ${data.data.ResultCode}`);
      console.log(`   Result Description: ${data.data.ResultDesc}`);
      
      if (data.data.ResultCode === '0') {
        console.log('💰 Payment completed successfully!');
      } else if (data.data.ResultCode === '1032') {
        console.log('❌ Payment was cancelled by user');
      } else if (data.data.ResultCode === '1037') {
        console.log('⏰ Payment timed out');
      } else {
        console.log('❌ Payment failed or is still pending');
      }
      
      return true;
    } else {
      console.error('❌ STK Push query failed:', data.message || data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ STK Push query request failed:', error.message);
    return false;
  }
}

async function runIntegrationTest() {
  console.log('================================================');
  console.log('🧪 Kenya School of Sales - STK Push Integration Test');
  console.log('================================================');
  console.log('');
  
  // Step 1: Test server health
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    console.log('');
    console.log('❌ Test failed: Server is not healthy');
    console.log('   Please check your server configuration and try again.');
    return;
  }
  
  console.log('');
  
  // Step 2: Test STK Push initiation
  const checkoutRequestId = await testSTKPush();
  if (!checkoutRequestId) {
    console.log('');
    console.log('❌ Test failed: Could not initiate STK Push');
    console.log('   Please check your Safaricom credentials and configuration.');
    return;
  }
  
  console.log('');
  console.log('📱 STK Push sent! If using sandbox, no actual SMS will be sent.');
  console.log('   In production, the user would receive an STK Push prompt.');
  console.log('');
  
  // Step 3: Wait a bit and then query status
  console.log('⏳ Waiting 5 seconds before checking status...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  console.log('');
  
  const querySuccess = await testSTKPushQuery(checkoutRequestId);
  
  console.log('');
  console.log('================================================');
  
  if (querySuccess) {
    console.log('✅ Integration test completed successfully!');
    console.log('');
    console.log('🎉 Your Safaricom Daraja integration is working correctly.');
    console.log('   You can now accept M-Pesa payments via STK Push.');
    console.log('');
    console.log('📋 Next steps:');
    console.log('   1. Update your Safaricom credentials in environment variables');
    console.log('   2. Set SAFARICOM_ENVIRONMENT=production when ready to go live');
    console.log('   3. Test with real phone numbers in sandbox mode');
    console.log('   4. Set up proper callback URL handling for production');
  } else {
    console.log('⚠️  Integration test completed with warnings.');
    console.log('   STK Push initiation worked, but status query failed.');
    console.log('   This might be normal in sandbox mode.');
  }
  
  console.log('================================================');
}

// Handle command line execution
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runIntegrationTest().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

export { runIntegrationTest, testServerHealth, testSTKPush, testSTKPushQuery };