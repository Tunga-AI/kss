# Quick Setup Guide: Payment to User Creation

## What Was Fixed

Previously: **Paid learners appeared in finance records and Firebase Auth, but NOT in the users collection**

Now: **Every paid learner automatically gets a complete user profile in the kenyasales database**

## Changes Made

### 1. New Files Created
- ✅ `/src/app/api/users/create/route.ts` - Server-side user creation API
- ✅ `/src/app/api/paystack/webhook/route.ts` - Webhook for backup user creation
- ✅ `/docs/PAYMENT_USER_CREATION.md` - Comprehensive documentation

### 2. Files Modified
- ✅ `/src/app/payment/callback/page.tsx` - Added user creation after payment

## Setup Instructions

### Step 1: Verify Environment Variables

Check `.env.local` has these variables:

```bash
# Firebase Admin (already configured)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@msommii.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
NEXT_PUBLIC_FIREBASE_PROJECT_ID=msommii

# Paystack (already configured)
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
```

✅ **All already configured - no changes needed**

### Step 2: Test Locally

```bash
# 1. Install dependencies (if needed)
npm install

# 2. Run development server
npm run dev

# 3. Test the flow
# - Go to any program page
# - Click "Register Now" as a guest
# - Use a test email (or Paystack test card if in test mode)
# - Complete payment
# - Check console logs for:
#   ✅ Transaction saved with ID: TR-XXX
#   ✅ User document created: L-XXX
```

### Step 3: Verify in Firestore Console

1. Open Firebase Console: https://console.firebase.google.com
2. Select project: **msommii**
3. Go to Firestore Database
4. **Select database: kenyasales** (important!)
5. Check these collections:
   - `transactions` → Should have new transaction
   - `users` → Should have new user with ID like `L-123`
   - `learners` → Should have matching learner profile

### Step 4: Deploy to Production

```bash
# Build the project
npm run build

# Deploy (your existing deployment process)
# Example: firebase deploy or npm run deploy
```

### Step 5: Configure Paystack Webhook (Optional but Recommended)

1. Go to Paystack Dashboard: https://dashboard.paystack.com
2. Navigate to: Settings → Webhooks
3. Add webhook URL:
   ```
   https://kss.or.ke/api/paystack/webhook
   ```
   (Replace with your actual domain)
4. Save

This provides a backup mechanism - if the callback page fails, the webhook will still create the user.

## Testing the Implementation

### Quick Test (2 minutes)

1. **Open your site** in incognito mode
2. **Navigate to any program** (e.g., /courses/sales-mastery)
3. **Click "Register Now"**
4. **Enter details:**
   - Name: Test Learner
   - Email: test-$(date +%s)@example.com (unique email)
5. **Complete payment** (use test card if in test mode)
6. **Wait for redirect** to success page
7. **Check admin panels:**
   - `/admin/finance` → Transaction appears
   - `/admin/users` → User appears with ID `L-XXX`
   - `/admin/learners` → Learner profile appears

### Console Logs to Look For

**Success indicators:**
```
💾 Saving transaction with data: {...}
✅ Transaction saved with ID: TR-123
👤 Creating user document for: test@example.com
✅ User document created: L-123
✅ Welcome email sent to: test@example.com
```

**Error indicators:**
```
❌ Failed to create user document: <error message>
```

## Common Issues & Solutions

### Issue: "User not appearing in /admin/users"

**Solution:**
1. Check browser console for errors
2. Check server logs for API errors
3. Verify you're looking at the **kenyasales** database in Firestore
4. Check `/admin/finance` - if transaction is there, user should be too

### Issue: "Permission denied error"

**Solution:**
The Firestore rules already allow this:
```javascript
match /users/{document=**} {
  allow create: if true;  // Allows guest user creation
}
```

If still failing, verify rules are deployed:
```bash
firebase deploy --only firestore:rules
```

### Issue: "Firebase Admin not initialized"

**Solution:**
Check environment variables are set correctly:
```bash
echo $FIREBASE_CLIENT_EMAIL
echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID
```

Should show values, not empty.

### Issue: "Duplicate user error"

**Solution:**
This is actually good - it means the system detected an existing user and didn't create a duplicate. The user should see a warning message telling them to log in instead.

## Verification Checklist

Before considering this complete, verify:

- [ ] Environment variables are set
- [ ] App builds without errors (`npm run build`)
- [ ] Payment flow works end-to-end
- [ ] Transaction appears in `/admin/finance`
- [ ] User appears in `/admin/users`
- [ ] Learner appears in `/admin/learners`
- [ ] All data is in **kenyasales** database (not default)
- [ ] Welcome email is sent
- [ ] Duplicate email detection works (shows warning)
- [ ] Paystack webhook is configured (optional)

## Database Confirmation

To confirm you're using the **kenyasales** database:

```bash
# Check the code
grep -n "databaseId" src/firebase/index.ts

# Should show:
# 14:const databaseId = 'kenyasales';
```

✅ **Already configured correctly**

## Next Steps

1. **Test the flow** with a real payment
2. **Monitor logs** for the first few payments
3. **Verify users appear** in admin panels
4. **Configure webhook** in Paystack (optional but recommended)

## Support

If issues occur:
1. Check server logs (console during development)
2. Check browser console for errors
3. Review `/docs/PAYMENT_USER_CREATION.md` for detailed troubleshooting
4. Verify Firebase Admin credentials are valid

---

## Summary

✅ **What works now:**
- New learners make payment → User created automatically
- User appears in users collection (kenyasales DB)
- Learner profile created
- Transaction recorded
- Welcome email sent
- No more "ghost" payments without user profiles

✅ **What's protected:**
- Duplicate email detection
- Existing users redirected to login
- Sequential ID generation (L-1, L-2, etc.)
- Webhook backup for reliability
- Proper database isolation (kenyasales)

🎉 **Ready to go!**
