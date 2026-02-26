# Learner Enrollment Workflow

## Overview
This document outlines the complete enrollment workflow for learners registering for core courses at KSS Academy.

## Enrollment Steps

### 1. Payment & Registration
- Learner selects a core course and completes payment via Paystack
- Payment is verified and transaction is saved to Firestore
- Learner receives payment confirmation

### 2. Account Setup
- After successful payment, learner is redirected to account setup page
- Learner creates password to secure their account
- System checks if user already exists:
  - **New User**: Creates Firebase Auth account + Firestore user document
  - **Existing User**: Signs them in with provided credentials
- An admission record is created with status: `Pending Review`
- Initial cohort assignment: `PENDING_ASSIGNMENT`

### 3. Assessment (TODO)
- Learner must complete an assessment linked to their registered cohort
- Assessment evaluates current knowledge and skill level
- Results are stored for admissions council review

### 4. Admissions Council Review (TODO)
- Admissions council reviews:
  - Assessment results
  - Learner profile
  - Program fit
- Council provides feedback on placement

### 5. Program Placement (TODO)
- Based on assessment and council feedback, learner is placed in a specific cohort
- **Important**: Final placement may differ from initially requested program
- Admission status updated to: `Accepted` or `Placed`
- Learner is notified of their placement

### 6. Portal Access
- Once placed, learner gains full access to learner portal features:
  - Course materials
  - Class schedule
  - Assignments
  - Progress tracking
  - Communication tools
- Portal displays the **actual enrolled program** (not necessarily the one they applied for)

### 7. Additional Registrations
- Learners can register for additional programs without logging out:
  - Events
  - E-learning courses
  - Other core courses
- Each registration follows appropriate workflow based on program type

## Database Schema

### Admissions Collection
```typescript
{
  id: string;
  userId: string;              // Reference to users collection
  name: string;
  email: string;
  status: 'Pending Review' | 'Accepted' | 'Rejected' | 'Placed';
  cohortId: string;            // Initially 'PENDING_ASSIGNMENT'
  interestedProgramId: string; // Program they paid for
  interestedProgramTitle: string;
  assessmentCompleted?: boolean;
  assessmentScore?: number;
  councilFeedback?: string;
  finalProgramId?: string;     // Actual program they're placed in
  finalCohortId?: string;      // Actual cohort assignment
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Users Collection
```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'Learner' | 'Admin' | 'Facilitator' | etc.;
  status: 'Active' | 'Inactive';
  currentCohortId?: string;    // Current active cohort
  enrolledPrograms?: string[]; // Array of program IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Implementation Status

### ✅ Completed
1. Payment processing and verification
2. Transaction recording
3. Account setup flow with duplicate user handling
4. Admission record creation
5. Firestore security rules updated to allow user creation during setup
6. Email notification system (with graceful error handling)

### 🚧 To Be Implemented
1. **Assessment Module**
   - Create assessment interface
   - Link assessments to cohorts
   - Store assessment results
   - Score calculation and storage

2. **Admissions Council Portal**
   - Review dashboard for pending admissions
   - Assessment result viewing
   - Feedback submission interface
   - Placement decision workflow

3. **Program Placement System**
   - Automated placement recommendations
   - Manual override capability
   - Notification system for placement decisions
   - Cohort assignment logic

4. **Learner Portal Enhancements**
   - Display actual enrolled program
   - Multi-program registration from portal
   - Program switching interface
   - Progress tracking across programs

## Recent Fixes (2026-02-06)

### 1. Firestore Permission Error
**Problem**: Users collection didn't allow creation for unauthenticated users during account setup.

**Solution**: Updated `firestore.rules` to allow `create` operations for everyone while keeping other operations restricted to authenticated users.

```rules
match /users/{document=**} {
  allow read: if request.auth != null;
  allow create: if true;  // Allow account setup
  allow update, delete: if request.auth != null;
}
```

### 2. Email Already in Use Error
**Problem**: When users tried to set up account after payment, they got "email already in use" error if they had previously registered.

**Solution**: Updated `login-form.tsx` to check Firestore first:
- If user exists: Sign them in with provided password
- If user doesn't exist: Create new auth account and Firestore record
- Provides better error messages for wrong passwords

### 3. Email Service Error
**Problem**: Welcome email sending failed due to missing Google credentials.

**Solution**: Email errors are already handled gracefully (non-blocking). The payment flow continues successfully even if email fails. Email service needs Google Application Credentials to be configured in production.

## Next Steps

1. **Immediate**: Configure email service credentials for production
2. **Short-term**: Implement assessment module
3. **Medium-term**: Build admissions council review portal
4. **Long-term**: Complete automated placement system

## Notes

- All program types (Core, E-Learning, Events) can be purchased from the learner portal
- Core courses require the full enrollment workflow
- E-Learning and Events have simplified enrollment (no assessment/placement)
- Learners can have multiple active enrollments simultaneously
