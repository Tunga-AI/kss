# 📱 M-Pesa STK Push Integration Guide
## Kenya School of Sales - Safaricom Daraja API

This guide explains how to use the newly implemented M-Pesa STK Push payment system alongside the existing bank transfer option.

## 🚀 Features Implemented

### ✅ **STK Push Payment Integration**
- Direct integration with Safaricom Daraja API
- Automatic payment prompts sent to customer's phone
- Real-time payment status tracking
- Seamless integration with existing Finance module

### ✅ **Enhanced Payment Options**
- **M-Pesa STK Push**: Instant mobile payments
- **Bank Transfer**: Traditional bank payments (existing)
- **Pay Later**: Deferred payment option (existing)

### ✅ **Finance Module Integration**
- All M-Pesa transactions automatically tracked
- Transaction status monitoring
- Payment method analytics
- Comprehensive transaction history

## 🔧 Setup Instructions

### 1. **Environment Configuration**

Add these variables to your `.env` file:

```bash
# Safaricom Daraja API Configuration (STK Push)
SAFARICOM_CONSUMER_KEY=your_safaricom_consumer_key
SAFARICOM_CONSUMER_SECRET=your_safaricom_consumer_secret
SAFARICOM_BUSINESS_SHORTCODE=your_business_shortcode
SAFARICOM_PASSKEY=your_safaricom_passkey
SAFARICOM_ENVIRONMENT=sandbox

# For Production
# SAFARICOM_ENVIRONMENT=production
# SAFARICOM_CONSUMER_KEY=your_production_consumer_key
# SAFARICOM_CONSUMER_SECRET=your_production_consumer_secret
# SAFARICOM_BUSINESS_SHORTCODE=your_production_business_shortcode
# SAFARICOM_PASSKEY=your_production_passkey
```

### 2. **Getting Safaricom Credentials**

#### Sandbox (Testing)
1. Visit [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create an account and login
3. Create a new app in sandbox environment
4. Get your Consumer Key and Consumer Secret
5. Use sandbox shortcode: `174379`
6. Use sandbox passkey: `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`

#### Production
1. Apply for production access on the developer portal
2. Get approval from Safaricom
3. Receive your production credentials:
   - Production Consumer Key
   - Production Consumer Secret
   - Your actual business shortcode
   - Your production passkey

### 3. **Installation**

Install required dependencies:
```bash
npm install express node-fetch
```

### 4. **Running the Application**

```bash
# Development (Frontend only)
npm run dev

# Production (Frontend + STK Push server)
npm run build
npm run start

# Combined build and serve
npm run serve
```

## 🧪 Testing

### Quick Test
```bash
# Run the integration test
node test-stkpush-integration.js
```

### Manual Testing
1. Start the server: `npm run start`
2. Visit health endpoint: `http://localhost:8080/api/health`
3. Test STK Push with sandbox phone number: `254708374149`

### Test Phone Numbers (Sandbox)
- **Success**: `254708374149`
- **Cancel**: `254708374150` 
- **Timeout**: `254708374151`

## 📱 How It Works

### User Flow
1. **Event Registration**: User selects an event to register for
2. **Payment Option**: User chooses "Pay with M-Pesa (STK Push)"
3. **Phone Number**: User enters their M-Pesa registered phone number
4. **Payment Initiation**: System sends STK Push to user's phone
5. **PIN Entry**: User enters M-Pesa PIN on their phone
6. **Confirmation**: Payment confirmed and registration completed

### Technical Flow
1. **Frontend**: `darajaService.initiateSTKPush()` called
2. **Backend**: Production server processes request
3. **Safaricom**: STK Push sent to customer's phone
4. **Database**: Transaction record created in Firestore
5. **Callback**: Safaricom sends payment result to callback URL
6. **Update**: Transaction status updated in real-time
7. **Finance**: Transaction appears in Finance module

## 💼 Finance Module Integration

### Transaction Tracking
- All M-Pesa payments appear in Finance → Transactions
- Status: `pending`, `completed`, `failed`, `cancelled`, `timeout`
- Method: `mpesa_stk` (distinguishes from manual M-Pesa)
- Automatic verification for successful payments

### Payment Analytics
- Payment method distribution includes M-Pesa STK Push
- Revenue tracking includes M-Pesa transactions
- Transaction count and success rates

### Transaction Details
- **M-Pesa Receipt Number**: For successful payments
- **Checkout Request ID**: Unique transaction identifier
- **Phone Number**: Customer's M-Pesa number
- **Amount**: Exact payment amount
- **Status**: Real-time payment status

## 🔒 Security Features

### API Security
- CORS enabled for cross-origin requests
- Environment-based configuration
- Secure credential handling
- No sensitive data in client-side code

### Payment Security
- Safaricom OAuth token authentication
- Encrypted payment requests
- Secure callback handling
- Transaction verification

## 🌍 Environment Support

### Sandbox Mode (Default)
- Safe testing environment
- No real money transactions
- Safaricom test credentials
- Test phone numbers

### Production Mode
- Real money transactions
- Production credentials required
- Live customer payments
- Safaricom approval needed

## 📊 API Endpoints

### STK Push Endpoints
- `POST /api/stkpush` - Initiate payment
- `POST /api/stkpush/query` - Check payment status
- `POST /api/stkpush/callback` - Receive payment results (Safaricom only)
- `GET /api/health` - Server health check

### Request Example
```json
POST /api/stkpush
{
  "phoneNumber": "254712345678",
  "amount": 500,
  "reference": "EVENT_12345",
  "narration": "Payment for Sales Training Event"
}
```

### Response Example
```json
{
  "success": true,
  "message": "STK Push sent successfully",
  "data": {
    "MerchantRequestID": "29115-34620561-1",
    "CheckoutRequestID": "ws_CO_191220191020363925",
    "ResponseCode": "0",
    "ResponseDescription": "Success. Request accepted for processing",
    "CustomerMessage": "Success. Request accepted for processing"
  }
}
```

## 🛠 Troubleshooting

### Common Issues

#### 1. "User must be authenticated to update settings"
- **Solution**: This was fixed in the SystemSettingsContext
- Ensure user is logged in with appropriate role

#### 2. STK Push not received
- **Sandbox**: No actual SMS sent, check logs
- **Production**: Verify phone number format (254XXXXXXXXX)
- Check business shortcode and passkey

#### 3. Payment status not updating
- Check callback URL configuration
- Verify Firestore permissions
- Check transaction polling logic

#### 4. Server connection errors
- Ensure server is running on port 8080
- Check environment variables
- Verify Safaricom credentials

### Debug Tips
1. Check browser console for errors
2. Monitor server logs for API requests
3. Use sandbox test numbers for predictable results
4. Verify Firestore transaction records

## 📈 Production Deployment

### Prerequisites
1. **Safaricom Approval**: Production access approved
2. **SSL Certificate**: HTTPS required for callbacks
3. **Callback URL**: Configure production callback URL
4. **Credentials**: Update to production credentials

### Environment Variables for Production
```bash
NODE_ENV=production
SAFARICOM_ENVIRONMENT=production
SAFARICOM_CONSUMER_KEY=your_production_key
SAFARICOM_CONSUMER_SECRET=your_production_secret
SAFARICOM_BUSINESS_SHORTCODE=your_production_shortcode
SAFARICOM_PASSKEY=your_production_passkey
```

### Deployment Steps
1. Build the application: `npm run build`
2. Set production environment variables
3. Deploy to your hosting platform
4. Configure callback URL with Safaricom
5. Test with small amounts first

## 📞 Support

### Safaricom Support
- **Developer Portal**: [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
- **Documentation**: [developer.safaricom.co.ke/docs](https://developer.safaricom.co.ke/docs)
- **Support Email**: apisupport@safaricom.co.ke

### Integration Support
- Check transaction logs in Finance module
- Monitor server health endpoint
- Review Firestore transaction records
- Use test integration script for debugging

---

## 🎉 Success!

Your Kenya School of Sales platform now supports:
- ✅ Direct M-Pesa STK Push payments
- ✅ Comprehensive transaction tracking
- ✅ Real-time payment status updates
- ✅ Seamless user experience
- ✅ Finance module integration

Students can now pay for events instantly using their mobile phones! 📱💳