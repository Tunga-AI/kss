# Payment to User Creation Flow

## Problem Statement

Previously, when new learners made payments:
- ✅ Firebase Authentication account was created
- ✅ Transaction record was saved to Firestore
- ❌ **User document was NOT created in the users collection**

This caused issues:
- Learners couldn't be found in admin panels
- Finance records existed but no user profile
- Inconsistent data across collections

## Solution Overview

We implemented a comprehensive solution that ensures every paid learner gets a proper user document in the **kenyasales** Firestore database.

## Architecture

### 1. Database Configuration

The application uses **two Firestore databases**:
- `(default)` - Legacy/backup database
- `kenyasales` - **Primary database** (configured in `src/firebase/index.ts:14`)

All new data is written to the `kenyasales` database.

### 2. Components

#### A. Client-Side Payment Flow
**File:** `src/components/payments/ProgramRegistration.tsx`

Flow:
1. User enters name and email
2. Email is checked against existing users (prevents duplicates)
3. Payment is initialized via `/api/paystack/initialize`
4. User completes payment on Paystack
5. Paystack redirects to `/payment/callback`

#### B. Payment Callback Handler
**File:** `src/app/payment/callback/page.tsx`

After successful payment verification:
1. ✅ Verifies payment with Paystack
2. ✅ Creates transaction record
3. ✅ **NEW: Creates user document via API**
4. ✅ Updates admission status (for core courses)
5. ✅ Sends welcome email
6. ✅ Redirects user to appropriate dashboard

#### C. User Creation API
**File:** `src/app/api/users/create/route.ts` ⭐ **NEW**

Server-side endpoint that:
- Uses Firebase Admin SDK
- Connects to **kenyasales** database
- Generates sequential IDs (L-1, L-2, etc.)
- Creates user document in `users` collection
- Creates learner profile in `learners` collection
- Prevents duplicate user creation

**Usage:**
```typescript
POST /api/users/create
{
  "email": "learner@example.com",
  "name": "John Doe",
  "role": "Learner",
  "authUid": "firebase-auth-uid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "userId": "L-123",
    "name": "John Doe",
    "email": "learner@example.com",
    "role": "Learner",
    "active": true
  }
}
```

#### D. Webhook Handler (Backup)
**File:** `src/app/api/paystack/webhook/route.ts` ⭐ **NEW**

Paystack webhook for redundancy:
- Receives `charge.success` events from Paystack
- Verifies webhook signature for security
- Creates user document if callback fails
- Provides backup mechanism for reliability

**Setup:**
Configure webhook URL in Paystack dashboard:
```
https://your-domain.com/api/paystack/webhook
```

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    New Learner Registration                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters name/email in ProgramRegistration component  │
│    - Checks for existing users (prevents duplicates)        │
│    - Shows warning if email already exists                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Payment initialization via /api/paystack/initialize      │
│    - Creates payment session with metadata                  │
│    - Includes: name, email, program, userId (if logged in)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User completes payment on Paystack                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Paystack redirects to /payment/callback                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Payment verification via /api/paystack/verify            │
│    - Confirms payment status with Paystack                  │
│    - Retrieves payment metadata                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Transaction creation in kenyasales DB                    │
│    - Saves to transactions collection                       │
│    - Reference: paystackReference                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. User creation via /api/users/create ⭐ NEW               │
│    - Checks if user exists (by email)                       │
│    - Generates sequential ID (L-123)                        │
│    - Creates document in users collection                   │
│    - Creates document in learners collection                │
│    - Uses kenyasales database                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Welcome email sent via /api/email/send                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Redirect to appropriate dashboard                        │
│    - /l/admissions (core courses)                           │
│    - /l/finance (other programs)                            │
└─────────────────────────────────────────────────────────────┘

                       BACKUP MECHANISM
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ Paystack Webhook: /api/paystack/webhook                     │
│    - Receives charge.success event                          │
│    - Creates user if callback failed                        │
│    - Ensures no paid learner is missed                      │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### users Collection (kenyasales database)
```typescript
{
  id: "L-123",                    // Sequential ID
  name: "John Doe",
  email: "john@example.com",
  role: "Learner",                // Learner | Facilitator | Admin
  authUid: "firebase-auth-uid",   // Firebase Auth UID (if exists)
  active: true,
  createdAt: Timestamp
}
```

### learners Collection (kenyasales database)
```typescript
{
  id: "L-123",                    // Same as user ID
  name: "John Doe",
  email: "john@example.com",
  avatar: null,
  createdAt: Timestamp
}
```

### transactions Collection (kenyasales database)
```typescript
{
  id: "TR-456",
  learnerName: "John Doe",
  learnerEmail: "john@example.com",
  program: "Sales Mastery Program",
  amount: 5000,
  currency: "KES",
  status: "Success",
  paystackReference: "KSS_1234567890",
  ticketCount: 1,                 // For events
  createdAt: Timestamp
}
```

## Environment Variables Required

```bash
# Firebase Admin SDK (for server-side user creation)
FIREBASE_CLIENT_EMAIL=your-firebase-admin@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_FIREBASE_PROJECT_ID=msommii

# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
```

## Security Features

### 1. Firebase Admin SDK
- Server-side only
- Full database access (bypasses security rules)
- Uses service account credentials
- Never exposed to client

### 2. Duplicate Prevention
- Email check before payment (`checkUserExists`)
- Warning message if user exists
- Disabled payment button for existing users
- "Log In Instead" button

### 3. Transaction Integrity
- Sequential ID generation with transactions
- Atomic counter increments
- Fallback to timestamp IDs if transaction fails

### 4. Webhook Security
- HMAC SHA512 signature verification
- Paystack signature header validation
- Rejects unsigned requests

## Firestore Security Rules

The rules file (`firestore.rules`) is applied to **both** databases:
- `(default)` database
- `kenyasales` database

```javascript
match /users/{document=**} {
  allow read: if request.auth != null;
  allow create: if true;  // Needed for guest payments
  allow update, delete: if request.auth != null;
}

match /learners/{document=**} {
  allow read: if request.auth != null;
  allow create: if true;  // Needed for guest payments
  allow update, delete: if request.auth != null;
}

match /transactions/{document=**} {
  allow read: if request.auth != null;
  allow create: if true;  // Needed for guest payments
  allow update, delete: if request.auth != null;
}
```

## Testing Checklist

### Test Case 1: New Learner (Guest)
- [ ] Navigate to a program page as guest
- [ ] Click "Register Now"
- [ ] Enter name and email (new email)
- [ ] Complete payment
- [ ] Verify transaction in `/admin/finance`
- [ ] Verify user in `/admin/users`
- [ ] Verify learner in `/admin/learners`
- [ ] Check Firebase Auth for user
- [ ] Verify welcome email received

### Test Case 2: Existing User
- [ ] Navigate to program page as guest
- [ ] Enter email that already exists
- [ ] See warning message
- [ ] Payment button disabled
- [ ] Click "Log In Instead"
- [ ] Auth dialog opens

### Test Case 3: Logged-in User
- [ ] Log in first
- [ ] Navigate to program page
- [ ] Click "Register Now"
- [ ] Payment uses logged-in user details
- [ ] Complete payment
- [ ] Verify user document updated (not duplicated)

### Test Case 4: Webhook Backup
- [ ] Simulate callback page failure
- [ ] Webhook receives charge.success
- [ ] User document created via webhook
- [ ] Verify in `/admin/users`

## Troubleshooting

### User not appearing in admin panel
1. Check Firestore console → kenyasales database → users collection
2. Check browser console for errors during payment
3. Check server logs for API errors
4. Verify Firebase Admin credentials in .env

### Duplicate user error
1. Check if email already exists in users collection
2. Clear duplicate if needed
3. Ensure checkUserExists is working

### Transaction saved but no user
1. Check API logs for /api/users/create errors
2. Verify Firebase Admin credentials
3. Check Firestore rules allow create
4. Check webhook logs as backup

### Email verification
```bash
# Check transaction was saved
firebase firestore:get transactions/TR-XXX --database=kenyasales

# Check user was created
firebase firestore:get users/L-XXX --database=kenyasales

# Check learner profile
firebase firestore:get learners/L-XXX --database=kenyasales
```

## Deployment

### 1. Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### 2. Configure Paystack Webhook
1. Log in to Paystack Dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://your-domain.com/api/paystack/webhook`
4. Save

### 3. Deploy Application
```bash
npm run build
# Your deployment command here
```

## Monitoring

### Key Logs to Monitor

**Payment Callback:**
```
💾 Saving transaction with data: {...}
✅ Transaction saved with ID: TR-123
👤 Creating user document for: email@example.com
✅ User document created: L-123
✅ Welcome email sent to: email@example.com
```

**User Creation API:**
```
✅ Firebase Admin initialized successfully
✅ User created successfully: L-123 (email@example.com)
```

**Webhook:**
```
📨 Paystack webhook received: charge.success
💰 Payment successful via webhook: KSS_1234567890
✅ User created via webhook: L-123
```

## Summary

This implementation ensures that **every paid learner** gets:
1. ✅ Firebase Authentication account
2. ✅ Transaction record in `transactions` collection
3. ✅ User document in `users` collection
4. ✅ Learner profile in `learners` collection
5. ✅ Welcome email
6. ✅ Access to learner dashboard

All data is stored in the **kenyasales** Firestore database, ensuring consistency and proper organization.
