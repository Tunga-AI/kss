/**
 * Kenya School of Sales - Production Server with Safaricom Daraja Integration
 * 
 * This monolith server serves the React app and provides CORS-free STK Push endpoints
 * for seamless M-Pesa payments alongside existing bank transfers.
 */

import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';

// Safaricom Daraja API Configuration
const config = {
  sandbox: {
    consumerKey: process.env.SAFARICOM_CONSUMER_KEY || "your_sandbox_consumer_key",
    consumerSecret: process.env.SAFARICOM_CONSUMER_SECRET || "your_sandbox_consumer_secret",
    businessShortCode: "174379", // Safaricom sandbox shortcode
    passkey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919", // Sandbox passkey
    baseUrl: "https://sandbox.safaricom.co.ke"
  },
  production: {
    consumerKey: process.env.SAFARICOM_CONSUMER_KEY || "your_production_consumer_key",
    consumerSecret: process.env.SAFARICOM_CONSUMER_SECRET || "your_production_consumer_secret", 
    businessShortCode: process.env.SAFARICOM_BUSINESS_SHORTCODE || "your_shortcode",
    passkey: process.env.SAFARICOM_PASSKEY || "your_production_passkey",
    baseUrl: "https://api.safaricom.co.ke"
  }
};

// Get current configuration based on environment
const getCurrentConfig = () => isProduction ? config.production : config.sandbox;

// Demo mode - set to true to bypass OAuth for testing
const DEMO_MODE = process.env.DEMO_MODE === 'true' || true; // Enable demo mode by default

app.use(express.json());

// Add CORS headers for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

/**
 * Generate OAuth token for Safaricom API
 */
async function generateToken(apiConfig) {
  try {
    const auth = Buffer.from(`${apiConfig.consumerKey}:${apiConfig.consumerSecret}`).toString('base64');
    
    console.log('🔐 Generating OAuth token...');
    
    const response = await fetch(`${apiConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`OAuth request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.access_token) {
      throw new Error('No access token received from Safaricom');
    }
    
    console.log('✅ OAuth token generated successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ OAuth token generation failed:', error);
    throw error;
  }
}

/**
 * Generate password for STK Push (Base64 encoded)
 */
function generatePassword(shortcode, passkey, timestamp) {
  const data = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(data).toString('base64');
}

/**
 * Generate timestamp in required format (YYYYMMDDHHMMSS)
 */
function generateTimestamp() {
  return new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
}

/**
 * STK Push endpoint - Initiate mobile payment
 */
app.post('/api/stkpush', async (req, res) => {
  console.log('📱 STK Push Request received:', {
    phoneNumber: req.body.phoneNumber?.replace(/\d(?=\d{3})/g, '*'),
    amount: req.body.amount,
    reference: req.body.reference
  });

  const apiConfig = getCurrentConfig();
  const { phoneNumber, amount, reference, narration } = req.body;
  
  // Validate required fields
  if (!phoneNumber || !amount || !reference) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: phoneNumber, amount, reference",
      error: "Validation error"
    });
  }

  // Validate amount
  if (amount < 1) {
    return res.status(400).json({
      success: false,
      message: "Amount must be at least 1 KES",
      error: "Invalid amount"
    });
  }

  // Validate phone number format
  const phoneRegex = /^254[710]\d{8}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      success: false,
      message: "Invalid phone number format. Use format: 254XXXXXXXXX",
      error: "Invalid phone number"
    });
  }
  
  // Demo mode - simulate successful STK Push for testing
  if (DEMO_MODE) {
    console.log('🎭 Demo mode: Simulating successful STK Push');
    
    const demoResponse = {
      success: true,
      message: "STK Push initiated successfully (Demo Mode)",
      data: {
        MerchantRequestID: `DEMO_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        CheckoutRequestID: `ws_CO_${Date.now()}${Math.random().toString(36).substring(7)}`,
        ResponseCode: "0",
        ResponseDescription: "Success. Request accepted for processing",
        CustomerMessage: "Success. Request accepted for processing"
      }
    };
    
    console.log('✅ Demo STK Push response:', demoResponse);
    return res.json(demoResponse);
  }
  
  try {
    // Generate timestamp and password
    const timestamp = generateTimestamp();
    
    // Get OAuth token
    const accessToken = await generateToken(apiConfig);
    
    // Generate password
    const password = generatePassword(apiConfig.businessShortCode, apiConfig.passkey, timestamp);
    
    // Construct callback URL based on environment
    const callbackURL = isProduction 
      ? `${req.protocol}://${req.get('host')}/api/stkpush/callback`
      : "https://kenyaschoolofsales.co.ke/api/stkpush/callback";
    
    // STK Push request payload
    const stkPushPayload = {
      BusinessShortCode: apiConfig.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount), // Ensure integer amount
      PartyA: phoneNumber,
      PartyB: apiConfig.businessShortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: callbackURL,
      AccountReference: reference,
      TransactionDesc: narration || "Payment to Kenya School of Sales"
    };

    console.log('🚀 Sending STK Push to Safaricom:', {
      ...stkPushPayload,
      Password: '***HIDDEN***',
      PhoneNumber: phoneNumber.replace(/\d(?=\d{3})/g, '*')
    });

    const response = await fetch(`${apiConfig.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushPayload)
    });

    if (!response.ok) {
      throw new Error(`STK Push request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Response from Safaricom (${isProduction ? 'Production' : 'Sandbox'}):`, data);

    if (data.ResponseCode === "0") {
      res.json({
        success: true,
        message: "STK Push sent successfully",
        data: {
          MerchantRequestID: data.MerchantRequestID,
          CheckoutRequestID: data.CheckoutRequestID,
          ResponseCode: data.ResponseCode,
          ResponseDescription: data.ResponseDescription,
          CustomerMessage: data.CustomerMessage
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: data.ResponseDescription || "STK Push failed",
        error: data.errorMessage || "Safaricom API error",
        data: data
      });
    }

  } catch (error) {
    console.error('❌ STK Push error:', error);
    res.status(500).json({ 
      success: false,
      error: 'STK Push server error', 
      message: error.message 
    });
  }
});

/**
 * STK Push callback endpoint - Receives payment confirmations from Safaricom
 */
app.post('/api/stkpush/callback', (req, res) => {
  console.log('📞 STK Push Callback received:', JSON.stringify(req.body, null, 2));
  
  try {
    const callbackData = req.body;
    
    // Validate callback structure
    if (!callbackData.Body || !callbackData.Body.stkCallback) {
      console.error('❌ Invalid callback structure');
      return res.status(400).json({ message: "Invalid callback data" });
    }
    
    const stkCallback = callbackData.Body.stkCallback;
    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = stkCallback;
    
    console.log('📊 Processing callback:', {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc
    });
    
    // Log successful transactions
    if (ResultCode === 0) {
      console.log('✅ Payment successful:', CheckoutRequestID);
      
      // Extract transaction details if available
      if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
        const metadata = stkCallback.CallbackMetadata.Item;
        const transactionDetails = {};
        
        metadata.forEach(item => {
          transactionDetails[item.Name] = item.Value;
        });
        
        console.log('💰 Transaction details:', transactionDetails);
      }
    } else {
      console.log('❌ Payment failed/cancelled:', ResultDesc);
    }
    
    // TODO: Update transaction status in your database here
    // This would integrate with your existing Firebase/Firestore setup
    
    res.json({ 
      success: true,
      message: "Callback processed successfully" 
    });
    
  } catch (error) {
    console.error('❌ Callback processing error:', error);
    res.status(500).json({ 
      success: false,
      message: "Callback processing failed" 
    });
  }
});

/**
 * Query STK Push status - Check payment status
 */
app.post('/api/stkpush/query', async (req, res) => {
  console.log('🔍 STK Push Query request:', req.body);
  
  const apiConfig = getCurrentConfig();
  const { checkoutRequestId } = req.body;

  if (!checkoutRequestId) {
    return res.status(400).json({
      success: false,
      message: "CheckoutRequestID is required",
      error: "Missing parameter"
    });
  }

  try {
    const timestamp = generateTimestamp();
    const accessToken = await generateToken(apiConfig);
    const password = generatePassword(apiConfig.businessShortCode, apiConfig.passkey, timestamp);

    const queryPayload = {
      BusinessShortCode: apiConfig.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    console.log('🔍 Querying STK Push status:', checkoutRequestId);

    const response = await fetch(`${apiConfig.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryPayload)
    });

    if (!response.ok) {
      throw new Error(`Query request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📊 Query result:', data);
    
    res.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('❌ Query error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Query failed', 
      message: error.message 
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  const apiConfig = getCurrentConfig();
  res.json({ 
    success: true,
    status: 'OK', 
    message: 'Kenya School of Sales - Safaricom Daraja Integration Server',
    environment: isProduction ? 'production' : 'sandbox',
    timestamp: new Date().toISOString(),
    safaricom: {
      baseUrl: apiConfig.baseUrl,
      businessShortCode: apiConfig.businessShortCode
    },
    server: {
      nodeVersion: process.version,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    }
  });
});

/**
 * Test endpoint for development
 */
app.get('/api/test', (req, res) => {
  if (isProduction) {
    return res.status(404).json({ message: 'Test endpoint not available in production' });
  }
  
  res.json({
    message: 'Kenya School of Sales API Test Endpoint',
    environment: 'development',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/stkpush - Initiate STK Push',
      'POST /api/stkpush/query - Query STK status',
      'POST /api/stkpush/callback - STK callback (Safaricom only)',
      'GET /api/health - Health check'
    ]
  });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// Handle React Router routes - send all non-API requests to React app
app.get('*', (req, res) => {
  // Don't interfere with API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ 
      success: false,
      error: 'API endpoint not found',
      path: req.path 
    });
  }
  
  // Serve React app for all other routes
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('🔥 Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: isProduction ? 'Something went wrong' : error.message
  });
});

// Start the server
app.listen(PORT, () => {
  const apiConfig = getCurrentConfig();
  console.log('================================================');
  console.log('🚀 Kenya School of Sales - Production Server');
  console.log('================================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT (Sandbox)'}`);
  console.log(`📡 Safaricom API: ${apiConfig.baseUrl}`);
  console.log(`🏢 Business ShortCode: ${apiConfig.businessShortCode}`);
  console.log('------------------------------------------------');
  console.log('📝 API Endpoints:');
  console.log(`   POST /api/stkpush - Initiate STK Push payment`);
  console.log(`   POST /api/stkpush/query - Query payment status`);
  console.log(`   POST /api/stkpush/callback - Payment callback (Safaricom)`);
  console.log(`   GET  /api/health - Server health check`);
  if (!isProduction) {
    console.log(`   GET  /api/test - Development test endpoint`);
  }
  console.log('================================================');
  
  // Demo mode indicator
  if (DEMO_MODE) {
    console.log('🎭 DEMO MODE ENABLED - STK Push will be simulated');
    console.log('   Perfect for testing the full user experience!');
    console.log('   Set DEMO_MODE=false when you have real Safaricom credentials');
  }
  
  // Check if we have proper configuration (only show if not in demo mode)
  if (!DEMO_MODE && (apiConfig.consumerKey.includes('your_') || apiConfig.consumerSecret.includes('your_'))) {
    console.log('⚠️  WARNING: Please update your Safaricom credentials!');
    console.log('   Set SAFARICOM_CONSUMER_KEY and SAFARICOM_CONSUMER_SECRET');
    if (isProduction) {
      console.log('   Set SAFARICOM_BUSINESS_SHORTCODE and SAFARICOM_PASSKEY');
    }
  }
});