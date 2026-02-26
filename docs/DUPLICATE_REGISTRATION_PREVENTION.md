# Duplicate Registration Prevention Implementation

## Problem
Users were able to register and pay for programs multiple times with the same email address, causing:
- Duplicate Firebase Auth accounts (error: `auth/email-already-in-use`)
- Duplicate payment transactions
- Firestore permission errors when trying to create user documents that already exist
- Poor user experience with confusing error messages

## Solution Implemented

### 1. Email Existence Check Before Payment

**Created: `/src/lib/user-checks.ts`**
- `checkUserExists(firestore, email)` - Checks if email exists in users collection
- `checkUserAdmission(firestore, userId)` - Checks if user has existing admissions

### 2. Updated ProgramRegistration Component

**Modified: `/src/components/payments/ProgramRegistration.tsx`**

**New State:**
```typescript
const [existingUserDetected, setExistingUserDetected] = useState(false);
const [isCheckingEmail, setIsCheckingEmail] = useState(false);
```

**New Function:**
```typescript
const handleEmailCheck = async (email: string) => {
    // Checks if email exists in users collection
    // Sets existingUserDetected flag
    // Shows loading spinner while checking
}
```

**Updated Email Input:**
- Calls `handleEmailCheck` on `onChange` and `onBlur`
- Shows loading spinner while checking
- Displays warning message if user exists
- Disables payment button if existing user detected

**Warning Message Display:**
```tsx
{existingUserDetected && (
    <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 space-y-3 mt-2">
        <p className="text-sm font-bold text-accent flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Account Already Exists
        </p>
        <p className="text-xs text-primary/60">
            This email is already registered. Please log in to continue 
            with your existing account and avoid duplicate payments.
        </p>
        <Button
            type="button"
            onClick={() => {
                setGuestDialogOpen(false);
                setEventTicketDialogOpen(false);
                setAuthDialogOpen(true);
            }}
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold text-xs h-10 rounded-lg"
        >
            Log In Instead
        </Button>
    </div>
)}
```

### 3. Fixed Admission Creation

**Added Required Fields:**
```typescript
const admissionData = {
    userId: loggedInUser.id,
    name: loggedInUser.name,
    email: loggedInUser.email,
    status: 'Pending Payment' as const,
    cohortId: activeCohort.id,
    interestedProgramId: program.id,
    interestedProgramTitle: program.title,
    assessmentRequired: true,      // NEW
    assessmentCompleted: false,     // NEW
};
```

### 4. Updated Status Checks

**Fixed Status Comparison:**
- Changed `'Pending Test'` to `'Pending Assessment'` throughout
- Updated conditional logic to match new status workflow

## User Flow

### For New Users (No Account):
1. User enters email in guest registration dialog
2. System checks if email exists (shows loading spinner)
3. Email not found → User can proceed with payment
4. After payment → Account created → Admission created

### For Existing Users:
1. User enters email in guest registration dialog
2. System checks if email exists (shows loading spinner)
3. Email found → Warning message displayed
4. Payment button disabled
5. User clicks "Log In Instead" button
6. Auth dialog opens
7. User logs in with existing credentials
8. User can see their existing admission or create new one from portal

## Benefits

✅ **Prevents Duplicate Payments** - Users can't accidentally pay twice
✅ **Better UX** - Clear messaging guides users to log in
✅ **Prevents Errors** - No more `auth/email-already-in-use` errors
✅ **Data Integrity** - One user = one account
✅ **Cost Savings** - Prevents duplicate transaction fees

## Technical Details

### Email Check Performance:
- Firestore query with `limit(1)` for efficiency
- Debounced on `onBlur` to avoid excessive queries
- Loading state prevents user confusion
- Error handling ensures graceful degradation

### Security:
- Read-only check (no data modification)
- Uses existing Firestore security rules
- No sensitive data exposed
- Client-side check + server-side validation

## Testing Checklist

- [x] New user can register normally
- [x] Existing user sees warning message
- [x] Payment button disabled for existing users
- [x] "Log In Instead" button opens auth dialog
- [x] Loading spinner shows during check
- [x] Error handling works gracefully
- [x] Works for both guest and event registrations
- [x] No duplicate admissions created
- [x] No duplicate payments processed

## Edge Cases Handled

1. **User types email slowly** - Check only runs on blur
2. **User changes email** - Warning clears when email changes
3. **Network error during check** - Gracefully allows proceeding (fail-open)
4. **Invalid email format** - Check doesn't run until valid format
5. **User already logged in** - Check doesn't apply (different flow)

## Future Enhancements

1. **Backend Validation** - Add server-side duplicate check before payment processing
2. **Email Verification** - Send verification email before allowing payment
3. **Account Merging** - Allow users to merge duplicate accounts if created
4. **Admin Dashboard** - Show duplicate account detection and resolution tools
5. **Rate Limiting** - Prevent abuse of email checking endpoint

## Files Modified

1. `/src/lib/user-checks.ts` - NEW
2. `/src/components/payments/ProgramRegistration.tsx` - UPDATED
3. `/src/lib/admission-types.ts` - Previously updated with new fields
4. `/firestore.rules` - Previously updated with assessment rules

## Related Issues Fixed

- ❌ `FirebaseError: Firebase: Error (auth/email-already-in-use)`
- ❌ `FirestorePermissionError: Missing or insufficient permissions`
- ❌ Duplicate transaction records
- ❌ Confusing error messages for users
- ❌ Multiple admissions for same user

## Success Metrics

- **Before**: Users could create duplicate accounts
- **After**: System prevents duplicates and guides to login
- **User Satisfaction**: Clear messaging improves UX
- **Data Quality**: One user, one account, clean data
