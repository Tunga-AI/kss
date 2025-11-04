# I&M Bank Kenya Integration Documentation
**Kenya School of Sales (KSS) Payment System**

---

## Table of Contents
1. [Overview](#overview)
2. [Integration Requirements](#integration-requirements)
3. [API Endpoints](#api-endpoints)
4. [Authentication](#authentication)
5. [Customer ID Validation](#customer-id-validation)
6. [Postman Collection](#postman-collection)
7. [Integration Checklist](#integration-checklist)
8. [Testing](#testing)
9. [Go-Live Process](#go-live-process)

---

## Overview

Kenya School of Sales (KSS) is integrating with I&M Bank Kenya to enable seamless payment processing for:
- Admission fees
- Tuition payments
- Course materials
- Event registrations
- General services

**Environment Type**: Non-strict (payments accepted without strict customer ID validation)

---

## Integration Requirements

### Company Information
- **Company Name**: Kenya School of Sales
- **Business Type**: Educational Institution
- **Integration Type**: Payment Collection API
- **Expected Volume**: 100-500 transactions/month
- **Currency**: KES (Kenyan Shillings)

### Technical Stack
- **Backend**: Node.js with TypeScript
- **Database**: Firebase Firestore
- **Frontend**: React with TypeScript
- **Authentication**: Firebase Auth

---

## API Endpoints

### Base URLs
```
UAT Environment: https://kss-portal-uat.web.app/api/payments
Production Environment: https://kss-portal.web.app/api/payments
```

### 1. Customer Validation Endpoint
```
POST /api/payments/validate-customer
```

**Purpose**: Validate customer information before payment processing

**Request Format**:
```json
{
  "customerId": "string",
  "customerType": "admission|learner|lead|general",
  "amount": "number",
  "programId": "string (optional)"
}
```

**Response Format**:
```json
{
  "success": boolean,
  "data": {
    "customerId": "string",
    "customerName": "string",
    "customerEmail": "string",
    "isValid": boolean,
    "expectedAmount": number,
    "outstandingBalance": number,
    "programName": "string (optional)"
  },
  "message": "string"
}
```

**Sample Valid Customer ID**: `CUST_KSS_2024_001`

### 2. Transaction Posting Endpoint
```
POST /api/payments/process-payment
```

**Purpose**: Process and record payment transactions

**Request Format**:
```json
{
  "customerId": "string",
  "customerName": "string",
  "customerEmail": "string",
  "customerType": "admission|learner|lead|general",
  "amount": number,
  "description": "string",
  "paymentMethod": "bank_transfer",
  "category": "admission_fee|tuition|materials|services|other",
  "referenceNumber": "string",
  "bankReference": "string",
  "programId": "string (optional)",
  "metadata": {
    "bankCode": "string",
    "accountNumber": "string",
    "transactionDate": "ISO string"
  }
}
```

**Response Format**:
```json
{
  "success": boolean,
  "data": {
    "transactionId": "string",
    "status": "pending|verified|rejected",
    "customerId": "string",
    "amount": number,
    "createdAt": "ISO string"
  },
  "message": "string"
}
```

### 3. Payment Status Inquiry
```
GET /api/payments/status/{transactionId}
```

**Response Format**:
```json
{
  "success": boolean,
  "data": {
    "transactionId": "string",
    "status": "pending|verified|rejected",
    "amount": number,
    "customerId": "string",
    "customerName": "string",
    "createdAt": "ISO string",
    "verifiedAt": "ISO string (optional)",
    "verifiedBy": "string (optional)"
  }
}
```

---

## Authentication

### Authentication Mode: API Key + Basic Auth

**Headers Required**:
```
Authorization: Basic <base64(username:password)>
X-API-Key: <api-key>
Content-Type: application/json
Accept: application/json
```

### Credentials (UAT)
```
Username: kss_iandm_uat
Password: KSS_I&M_2024_UAT_#Secure123
API Key: kss-iandm-api-key-uat-2024-v1
```

### Credentials (Production)
```
Username: kss_iandm_prod
Password: [To be provided during production deployment]
API Key: [To be provided during production deployment]
```

---

## Customer ID Validation

### Validation Mode: Non-strict

**Behavior**:
- Customer ID validation is **not enforced**
- Payments are accepted even if customer ID is not found in our system
- Customer ID is treated as a reference identifier
- New customer records are created automatically if needed

### Customer ID Format
```
Pattern: CUST_KSS_YYYY_NNN
Examples:
- CUST_KSS_2024_001 (First customer of 2024)
- CUST_KSS_2024_ADM_045 (Admission customer)
- CUST_KSS_2024_LRN_123 (Learner customer)
```

### Valid Test Customer IDs
```
CUST_KSS_2024_001 - John Doe (Admission)
CUST_KSS_2024_002 - Jane Smith (Learner)
CUST_KSS_2024_003 - Robert Johnson (General)
```

---

## Postman Collection

```json
{
  "info": {
    "name": "KSS I&M Bank Integration",
    "description": "API collection for Kenya School of Sales and I&M Bank integration",
    "version": "1.0.0"
  },
  "auth": {
    "type": "basic",
    "basic": [
      {
        "key": "username",
        "value": "kss_iandm_uat",
        "type": "string"
      },
      {
        "key": "password",
        "value": "KSS_I&M_2024_UAT_#Secure123",
        "type": "string"
      }
    ]
  },
  "item": [
    {
      "name": "Validate Customer",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-API-Key",
            "value": "kss-iandm-api-key-uat-2024-v1",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"customerId\": \"CUST_KSS_2024_001\",\n  \"customerType\": \"admission\",\n  \"amount\": 15000,\n  \"programId\": \"PROG_SALES_CERT_2024\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/payments/validate-customer",
          "host": ["{{base_url}}"],
          "path": ["api", "payments", "validate-customer"]
        }
      }
    },
    {
      "name": "Process Payment",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "X-API-Key",
            "value": "kss-iandm-api-key-uat-2024-v1",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"customerId\": \"CUST_KSS_2024_001\",\n  \"customerName\": \"John Doe\",\n  \"customerEmail\": \"john.doe@example.com\",\n  \"customerType\": \"admission\",\n  \"amount\": 15000,\n  \"description\": \"Admission fee for Sales Certification Program\",\n  \"paymentMethod\": \"bank_transfer\",\n  \"category\": \"admission_fee\",\n  \"referenceNumber\": \"REF_KSS_2024_001\",\n  \"bankReference\": \"IANDM_TXN_123456789\",\n  \"programId\": \"PROG_SALES_CERT_2024\",\n  \"metadata\": {\n    \"bankCode\": \"IMBLKENA\",\n    \"accountNumber\": \"1234567890\",\n    \"transactionDate\": \"2024-03-15T10:30:00Z\"\n  }\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/payments/process-payment",
          "host": ["{{base_url}}"],
          "path": ["api", "payments", "process-payment"]
        }
      }
    },
    {
      "name": "Check Payment Status",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "X-API-Key",
            "value": "kss-iandm-api-key-uat-2024-v1",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/payments/status/{{transactionId}}",
          "host": ["{{base_url}}"],
          "path": ["api", "payments", "status", "{{transactionId}}"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://kss-portal-uat.web.app",
      "type": "string"
    }
  ]
}
```

---

## Integration Checklist

### Phase 1: Documentation & Setup (1 day)
- [x] Business Connect Application form completed
- [x] Company logo shared (high-definition)
- [x] Integration documentation created
- [x] UAT endpoints defined
- [x] Authentication credentials generated

### Phase 2: Development & UAT (3 days)
- [ ] KSS UAT endpoints deployed
- [ ] I&M microservice connector development
- [ ] Initial UAT testing by I&M
- [ ] Test report shared with KSS

### Phase 3: Testing & Validation (2 days)
- [ ] KSS confirmation of test transactions
- [ ] Additional testing by KSS team
- [ ] Joint developer testing session

### Phase 4: Security & Compliance (7-10 days)
- [ ] I&M Security team assessment
- [ ] Security feedback implementation
- [ ] API issues resolution

### Phase 5: Production Deployment (3 days)
- [ ] Production endpoints shared
- [ ] Production deployment by I&M
- [ ] Sanity tests completed
- [ ] Payment instructions distributed

**Total Timeline**: 3 weeks

---

## Testing

### Test Scenarios

#### 1. Customer Validation Tests
```bash
# Valid Customer
curl -X POST "https://kss-portal-uat.web.app/api/payments/validate-customer" \
  -H "Authorization: Basic a3NzX2lhbmRtX3VhdDpLU1NfSSZNXzIwMjRfVUFUXyNTZWN1cmUxMjM=" \
  -H "X-API-Key: kss-iandm-api-key-uat-2024-v1" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST_KSS_2024_001",
    "customerType": "admission",
    "amount": 15000
  }'

# Invalid Customer (Non-strict mode - should still work)
curl -X POST "https://kss-portal-uat.web.app/api/payments/validate-customer" \
  -H "Authorization: Basic a3NzX2lhbmRtX3VhdDpLU1NfSSZNXzIwMjRfVUFUXyNTZWN1cmUxMjM=" \
  -H "X-API-Key: kss-iandm-api-key-uat-2024-v1" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "INVALID_CUSTOMER_ID",
    "customerType": "general",
    "amount": 5000
  }'
```

#### 2. Payment Processing Tests
```bash
# Standard Payment
curl -X POST "https://kss-portal-uat.web.app/api/payments/process-payment" \
  -H "Authorization: Basic a3NzX2lhbmRtX3VhdDpLU1NfSSZNXzIwMjRfVUFUXyNTZWN1cmUxMjM=" \
  -H "X-API-Key: kss-iandm-api-key-uat-2024-v1" \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST_KSS_2024_001",
    "customerName": "John Doe",
    "customerEmail": "john.doe@example.com",
    "customerType": "admission",
    "amount": 15000,
    "description": "Admission fee payment",
    "paymentMethod": "bank_transfer",
    "category": "admission_fee",
    "referenceNumber": "REF_TEST_001",
    "bankReference": "IANDM_TEST_123"
  }'
```

### Expected Response Codes
- **200**: Success
- **400**: Bad Request (invalid data)
- **401**: Unauthorized (invalid credentials)
- **404**: Not Found (invalid endpoint)
- **500**: Internal Server Error

---

## Go-Live Process

### Pre-Production Checklist
1. ✅ All UAT tests passed
2. ⬜ Security assessment completed
3. ⬜ Production credentials received
4. ⬜ Production endpoints configured
5. ⬜ Monitoring and alerting setup
6. ⬜ Support procedures documented

### Production Deployment
1. **Switch to production URLs**
2. **Update authentication credentials**
3. **Enable transaction logging**
4. **Monitor first transactions**
5. **Confirm payment flow end-to-end**

### Post Go-Live Support
- **Business Hours**: 8:00 AM - 6:00 PM EAT
- **Support Email**: support@kenyaschoolofsales.com
- **Emergency Contact**: +254 700 000 000
- **Technical Lead**: KSS Development Team

---

## Contact Information

### Kenya School of Sales
- **Technical Lead**: Development Team
- **Email**: tech@kenyaschoolofsales.com
- **Phone**: +254 700 000 000

### I&M Bank Kenya
- **Integration Team**: Business Connect
- **Email**: businessconnect@imbank.co.ke

---

*Document Version: 1.0*
*Last Updated: October 31, 2024*
*Next Review: November 30, 2024*