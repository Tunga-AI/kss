# Safaricom Daraja API - Vite Monolith Integration

## Overview
Replace Credit Bank API with direct Safaricom Daraja API integration using the monolith server pattern for CORS-free STK Push requests.

## Configuration

### 1. Environment Variables

```bash
# Sandbox
SAFARICOM_CONSUMER_KEY=your_sandbox_consumer_key
SAFARICOM_CONSUMER_SECRET=your_sandbox_consumer_secret
SAFARICOM_BUSINESS_SHORTCODE=174379
SAFARICOM_PASSKEY=your_sandbox_passkey
SAFARICOM_BASE_URL=https://sandbox.safaricom.co.ke

# Production
SAFARICOM_CONSUMER_KEY=your_production_consumer_key
SAFARICOM_CONSUMER_SECRET=your_production_consumer_secret
SAFARICOM_BUSINESS_SHORTCODE=your_business_shortcode
SAFARICOM_PASSKEY=your_production_passkey
SAFARICOM_BASE_URL=https://api.safaricom.co.ke
```

### 2. Updated Production Server (`production-server.js`)

```javascript
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';

const config = {
  sandbox: {
    consumerKey: process.env.SAFARICOM_CONSUMER_KEY || "your_sandbox_consumer_key",
    consumerSecret: process.env.SAFARICOM_CONSUMER_SECRET || "your_sandbox_consumer_secret",
    businessShortCode: "174379",
    passkey: "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919",
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

app.use(express.json());

// Generate OAuth token
async function generateToken(apiConfig) {
  const auth = Buffer.from(`${apiConfig.consumerKey}:${apiConfig.consumerSecret}`).toString('base64');
  
  const response = await fetch(`${apiConfig.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data.access_token;
}

// Generate password for STK Push
function generatePassword(shortcode, passkey, timestamp) {
  const data = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(data).toString('base64');
}

// STK Push endpoint
app.post('/api/stkpush', async (req, res) => {
  console.log('📱 STK Push Request received:', req.body);

  const apiConfig = isProduction ? config.production : config.sandbox;
  const { phoneNumber, amount, reference, narration } = req.body;
  
  try {
    // Generate timestamp
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    
    // Get OAuth token
    const accessToken = await generateToken(apiConfig);
    
    // Generate password
    const password = generatePassword(apiConfig.businessShortCode, apiConfig.passkey, timestamp);
    
    // STK Push request payload
    const stkPushPayload = {
      BusinessShortCode: apiConfig.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: apiConfig.businessShortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: "https://sielwelleague.co.ke/api/stkpush/callback",
      AccountReference: reference || "SIEL Payment",
      TransactionDesc: narration || "Payment for SIEL services"
    };

    console.log('🚀 Sending STK Push to Safaricom:', stkPushPayload);

    const response = await fetch(`${apiConfig.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stkPushPayload)
    });

    const data = await response.json();
    console.log(`✅ Response from Safaricom (${isProduction ? 'Production' : 'Sandbox'}):`, data);

    if (data.ResponseCode === "0") {
      res.json({
        message: "Request processed successfully",
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
        message: data.ResponseDescription || "STK Push failed",
        error: data
      });
    }

  } catch (error) {
    console.error('❌ STK Push error:', error);
    res.status(500).json({ 
      error: 'STK Push server error', 
      message: error.message 
    });
  }
});

// STK Push callback endpoint
app.post('/api/stkpush/callback', (req, res) => {
  console.log('📞 STK Push Callback received:', JSON.stringify(req.body, null, 2));
  
  // Process the callback here
  // Save to database, update order status, etc.
  
  res.json({ message: "Callback received successfully" });
});

// Query STK Push status
app.post('/api/stkpush/query', async (req, res) => {
  const apiConfig = isProduction ? config.production : config.sandbox;
  const { checkoutRequestId } = req.body;

  try {
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const accessToken = await generateToken(apiConfig);
    const password = generatePassword(apiConfig.businessShortCode, apiConfig.passkey, timestamp);

    const queryPayload = {
      BusinessShortCode: apiConfig.businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    const response = await fetch(`${apiConfig.baseUrl}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(queryPayload)
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('❌ Query error:', error);
    res.status(500).json({ error: 'Query failed', message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  const apiConfig = isProduction ? config.production : config.sandbox;
  res.json({ 
    status: 'OK', 
    message: 'Safaricom Daraja Monolith Server',
    environment: isProduction ? 'production' : 'sandbox',
    baseUrl: apiConfig.baseUrl,
    businessShortCode: apiConfig.businessShortCode
  });
});

// Serve static files and handle SPA routing
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  const apiConfig = isProduction ? config.production : config.sandbox;
  console.log('================================================');
  console.log('🚀 Safaricom Daraja Monolith Server');
  console.log('================================================');
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${isProduction ? 'PRODUCTION' : 'SANDBOX'}`);
  console.log(`📡 Safaricom API: ${apiConfig.baseUrl}`);
  console.log(`🏢 Business ShortCode: ${apiConfig.businessShortCode}`);
  console.log('------------------------------------------------');
  console.log('📝 Endpoints:');
  console.log(`   POST /api/stkpush - Initiate STK Push`);
  console.log(`   POST /api/stkpush/query - Query STK status`);
  console.log(`   POST /api/stkpush/callback - STK callback`);
  console.log(`   GET  /api/health - Health check`);
  console.log('================================================');
});
```

### 3. Frontend Service (`services/darajaService.ts`)

```typescript
interface STKPushRequest {
  phoneNumber: string;
  amount: number;
  reference: string;
  narration?: string;
}

interface STKPushResponse {
  message: string;
  data?: {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
  };
}

class DarajaService {
  private formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      return '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('+254')) {
      return cleaned.substring(1);
    } else {
      return '254' + cleaned;
    }
  }

  async initiateSTKPush(request: STKPushRequest): Promise<STKPushResponse> {
    const payload = {
      phoneNumber: this.formatPhoneNumber(request.phoneNumber),
      amount: request.amount,
      reference: request.reference,
      narration: request.narration || 'Payment'
    };

    try {
      const response = await fetch('/api/stkpush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ STK Push error:', error);
      throw error;
    }
  }

  async querySTKPush(checkoutRequestId: string) {
    try {
      const response = await fetch('/api/stkpush/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ checkoutRequestId })
      });

      return await response.json();
    } catch (error) {
      console.error('❌ Query error:', error);
      throw error;
    }
  }
}

export const darajaService = new DarajaService();
```

### 4. Updated Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built app and server
COPY --from=builder /app/dist ./dist
COPY production-server.js ./

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080
CMD ["npm", "run", "start"]
```

### 5. Cloud Build with Daraja Variables

```yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: 
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/siel-daraja'
      - '--build-arg'
      - 'SAFARICOM_CONSUMER_KEY=${_SAFARICOM_CONSUMER_KEY}'
      - '--build-arg'
      - 'SAFARICOM_CONSUMER_SECRET=${_SAFARICOM_CONSUMER_SECRET}'
      - '--build-arg'
      - 'SAFARICOM_BUSINESS_SHORTCODE=${_SAFARICOM_BUSINESS_SHORTCODE}'
      - '--build-arg'
      - 'SAFARICOM_PASSKEY=${_SAFARICOM_PASSKEY}'
      - '.'

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/siel-daraja']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'siel-daraja'
      - '--image'
      - 'gcr.io/$PROJECT_ID/siel-daraja'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'
      - '--set-env-vars'
      - 'SAFARICOM_CONSUMER_KEY=${_SAFARICOM_CONSUMER_KEY}'
      - '--set-env-vars'
      - 'SAFARICOM_CONSUMER_SECRET=${_SAFARICOM_CONSUMER_SECRET}'
      - '--set-env-vars'
      - 'SAFARICOM_BUSINESS_SHORTCODE=${_SAFARICOM_BUSINESS_SHORTCODE}'
      - '--set-env-vars'
      - 'SAFARICOM_PASSKEY=${_SAFARICOM_PASSKEY}'

images:
  - 'gcr.io/$PROJECT_ID/siel-daraja'
```

## Benefits of Direct Daraja Integration

### ✅ **Direct Integration**
- No third-party dependencies
- Full control over requests/responses
- Latest Safaricom features

### ✅ **Better Error Handling**
- Direct Safaricom error messages
- Detailed transaction status
- Real-time callbacks

### ✅ **Cost Effective**
- No Credit Bank fees
- Direct Safaricom rates
- Full transaction visibility

### ✅ **OAuth Automation**
- Automatic token generation
- Token caching (can be added)
- Secure credential handling

## Getting Started

1. **Get Safaricom Credentials**:
   - Register at [Safaricom Developer Portal](https://developer.safaricom.co.ke)
   - Create an app and get Consumer Key/Secret
   - Get Business ShortCode and Passkey

2. **Replace Credit Bank Code**:
   - Update `production-server.js` with Daraja endpoints
   - Replace frontend service calls
   - Update environment variables

3. **Test with Sandbox**:
   - Use sandbox credentials for testing
   - Test phone: `254708374149`
   - Verify STK push and callbacks work

4. **Deploy to Production**:
   - Add production credentials to Cloud Build
   - Deploy with `gcloud builds submit`
   - Test with real transactions

## Testing

```bash
# Test STK Push
curl -X POST http://localhost:8080/api/stkpush \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "254708374149",
    "amount": 1,
    "reference": "TEST123",
    "narration": "Test payment"
  }'

# Test Health Check
curl http://localhost:8080/api/health
```

This gives you **direct Safaricom integration** with the same CORS-free monolith pattern! 🚀