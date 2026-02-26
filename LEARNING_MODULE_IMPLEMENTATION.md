# Learning Module Implementation

## Overview

The Learning Module is a comprehensive system that allows administrators to create structured learning courses with units, assign facilitators, and track learner progress. This module integrates with existing programs, cohorts, and the content library.

## Architecture

### Data Model

#### 1. **LearningCourse**
Main container for structured learning linked to cohorts and programs.

**Collection:** `learningCourses`

**Fields:**
- `id`: string
- `title`: string
- `description`: string
- `cohortId`: string (links to cohort)
- `cohortName`: string (cached)
- `programId`: string (links to program)
- `programTitle`: string (cached)
- `unitIds`: string[] (ordered list of unit IDs)
- `status`: 'Draft' | 'Active' | 'Completed' | 'Archived'
- `isPublished`: boolean
- `isSelfPaced`: boolean
- `allowSkipUnits`: boolean (if false, must complete units in order)
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

#### 2. **LearningUnit**
Individual units/classes within a course containing content and facilitator assignments.

**Collection:** `learningUnits`

**Fields:**
- `id`: string
- `courseId`: string (parent course)
- `title`: string
- `description`: string
- `orderIndex`: number (for sequencing)
- `facilitatorId`: string (assigned facilitator)
- `facilitatorName`, `facilitatorEmail`: string (cached)
- `contentIds`: string[] (references to content library items)
- `scheduledStartDate`, `scheduledEndDate`: Timestamp (optional)
- `duration`: number (minutes)
- `classroomSessionId`: string (optional, for live sessions)
- `status`: 'Draft' | 'Scheduled' | 'In Progress' | 'Completed'
- `isRequired`: boolean
- `passingScore`: number (percentage)
- `estimatedDuration`: number (minutes)
- `createdAt`, `updatedAt`, `createdBy`, `updatedBy`

#### 3. **LearnerEnrollment**
Tracks a learner's enrollment in a course.

**Collection:** `learnerEnrollments`

**Fields:**
- `id`: string
- `learnerId`: string
- `learnerName`, `learnerEmail`: string
- `courseId`: string
- `cohortId`: string
- `programId`: string
- `status`: 'Active' | 'Completed' | 'Dropped' | 'Suspended'
- `enrolledAt`: Timestamp
- `completedAt`: Timestamp (optional)
- `completedUnitIds`: string[]
- `currentUnitId`: string
- `overallProgress`: number (0-100 percentage)
- `averageScore`: number
- `totalTimeSpent`: number (seconds)
- `lastAccessedAt`: Timestamp
- `createdAt`, `updatedAt`

#### 4. **UnitProgress**
Tracks a learner's progress in a specific unit.

**Collection:** `unitProgress`

**Fields:**
- `id`: string
- `unitId`: string
- `learnerId`: string
- `courseId`: string
- `enrollmentId`: string
- `status`: 'Not Started' | 'In Progress' | 'Completed' | 'Passed' | 'Failed'
- `progress`: number (0-100 percentage)
- `score`: number
- `completedContentIds`: string[]
- `contentProgress`: object (detailed progress per content item)
- `timeSpent`: number (seconds)
- `startedAt`, `completedAt`, `lastAccessedAt`: Timestamp
- `attempts`: number
- `bestScore`: number
- `passed`: boolean
- `createdAt`, `updatedAt`

#### 5. **FacilitatorAssignment**
Tracks facilitator assignments to units (for easy querying).

**Collection:** `facilitatorAssignments`

**Fields:**
- `id`: string
- `facilitatorId`: string
- `facilitatorName`, `facilitatorEmail`: string
- `unitId`: string
- `unitTitle`: string
- `courseId`: string
- `courseTitle`: string
- `cohortId`: string
- `cohortName`: string
- `programId`: string
- `programTitle`: string
- `assignedAt`: Timestamp
- `assignedBy`: string
- `status`: 'Active' | 'Completed' | 'Cancelled'
- `createdAt`, `updatedAt`

## User Roles and Access

### Admin
**Location:** `/admin/learning`

**Capabilities:**
- Create and manage learning courses
- Add/edit/delete units within courses
- Assign facilitators to units
- Select content from library for units
- View all enrollments and progress
- Configure course settings (self-paced, sequential, etc.)

**Key Pages:**
- `/admin/learning` - List all courses
- `/admin/learning/new` - Create new course
- `/admin/learning/[id]` - Manage course and units

### Facilitator
**Location:** `/staff/learning`

**Capabilities:**
- View assigned units
- Access unit materials
- View learner progress for assigned units
- Monitor engagement metrics

**Key Pages:**
- `/staff/learning` - List assigned units (grouped by course)
- `/staff/learning/[unitId]` - View unit details and learner progress

### Learner
**Location:** `/dashboard/learning`

**Capabilities:**
- View enrolled courses
- Track overall progress
- Access course units (based on course settings)
- View and consume learning materials
- Track time spent and scores

**Key Pages:**
- `/dashboard/learning` - List enrolled courses
- `/dashboard/learning/[enrollmentId]` - View course details and units
- `/dashboard/learning/unit/[unitId]` - Access unit content (to be implemented)

## Features

### 1. Course Management
- Link courses to existing cohorts and programs
- Sequential or flexible unit ordering
- Self-paced or instructor-led modes
- Draft/Active/Completed/Archived status

### 2. Unit Creation
- Assign facilitators from facilitator collection
- Select multiple content items from library
- Set passing scores and estimated durations
- Mark units as required or optional
- Reorder units within a course

### 3. Content Integration
- Full integration with content library
- Support for multiple content types (video, document, SCORM, H5P, etc.)
- Content preview and download capabilities
- Track content consumption per learner

### 4. Progress Tracking
- Overall course progress (percentage)
- Individual unit progress
- Time spent tracking
- Score tracking with averages
- Completion status

### 5. Access Control
- Sequential learning (must complete previous units)
- Flexible learning (can skip units)
- Lock/unlock mechanism based on completion
- Role-based access (Admin, Facilitator, Learner)

## API Functions

### Course Management
```typescript
// Create a new learning course
createLearningCourse(firestore, data)

// Update course details
updateLearningCourse(firestore, id, data)

// Delete course and all units
deleteLearningCourse(firestore, id)

// Get course by ID
getLearningCourse(firestore, id)

// Get courses by cohort
getLearningCoursesByCohort(firestore, cohortId)

// Get courses by program
getLearningCoursesByProgram(firestore, programId)
```

### Unit Management
```typescript
// Create a new unit
createLearningUnit(firestore, data)

// Update unit details
updateLearningUnit(firestore, id, data)

// Delete unit
deleteLearningUnit(firestore, id)

// Get unit by ID
getLearningUnit(firestore, id)

// Get units by course
getLearningUnitsByCourse(firestore, courseId)

// Get units by facilitator
getLearningUnitsByFacilitator(firestore, facilitatorId)

// Reorder units
reorderUnits(firestore, courseId, unitIds)
```

### Enrollment Management
```typescript
// Create enrollment
createLearnerEnrollment(firestore, data)

// Update enrollment
updateLearnerEnrollment(firestore, id, data)

// Get enrollment
getLearnerEnrollment(firestore, id)

// Get enrollments by course
getLearnerEnrollmentsByCourse(firestore, courseId)

// Get enrollments by learner
getLearnerEnrollmentsByLearner(firestore, learnerId)

// Get or create enrollment
getOrCreateEnrollment(firestore, learnerId, courseId, cohortId, programId)
```

### Progress Tracking
```typescript
// Create unit progress
createUnitProgress(firestore, data)

// Update unit progress
updateUnitProgress(firestore, id, data)

// Get progress
getUnitProgress(firestore, id)

// Get progress by learner and unit
getUnitProgressByLearnerAndUnit(firestore, learnerId, unitId)

// Get progress by enrollment
getUnitProgressByEnrollment(firestore, enrollmentId)

// Update overall enrollment progress
updateEnrollmentProgress(firestore, enrollmentId)
```

### Facilitator Assignments
```typescript
// Get facilitator assignments
getFacilitatorAssignments(firestore, facilitatorId)

// Get assignments by unit
getAssignmentsByUnit(firestore, unitId)
```

## Firestore Security Rules

The following security rules have been added:

```javascript
// Learning Courses - Admin can manage, everyone can read
match /learningCourses/{document=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}

// Learning Units - Admin can manage, all authenticated can read
match /learningUnits/{document=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}

// Learner Enrollments - Learners can read their own, Admin can manage all
match /learnerEnrollments/{enrollmentId} {
  allow read: if request.auth != null &&
    (resource.data.learnerId == request.auth.uid ||
     request.auth.token.role in ['Admin', 'Facilitator', 'Operations']);
  allow create: if request.auth != null;
  allow update: if request.auth != null &&
    (resource.data.learnerId == request.auth.uid ||
     request.auth.token.role in ['Admin', 'Facilitator', 'Operations']);
  allow delete: if request.auth != null &&
    request.auth.token.role in ['Admin', 'Operations'];
}

// Unit Progress - Learners can manage their own, Admin/Facilitators can read all
match /unitProgress/{progressId} {
  allow read: if request.auth != null &&
    (resource.data.learnerId == request.auth.uid ||
     request.auth.token.role in ['Admin', 'Facilitator', 'Operations']);
  allow create: if request.auth != null &&
    request.resource.data.learnerId == request.auth.uid;
  allow update: if request.auth != null &&
    (resource.data.learnerId == request.auth.uid ||
     request.auth.token.role in ['Admin', 'Facilitator', 'Operations']);
  allow delete: if request.auth != null &&
    request.auth.token.role in ['Admin', 'Operations'];
}

// Facilitator Assignments - All authenticated can read, Admin can write
match /facilitatorAssignments/{document=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

## Implementation Files

### Type Definitions
- `src/lib/learning-types.ts` - All TypeScript types

### API Functions
- `src/lib/learning.ts` - All CRUD functions

### Admin Pages
- `src/app/admin/learning/page.tsx` - Course list
- `src/app/admin/learning/new/page.tsx` - Create course form
- `src/app/admin/learning/[id]/page.tsx` - Course management
- `src/app/admin/learning/[id]/unit-form-dialog.tsx` - Unit form dialog

### Facilitator Pages
- `src/app/staff/learning/page.tsx` - Assigned units list
- `src/app/staff/learning/[id]/page.tsx` - Unit detail view

### Learner Pages
- `src/app/dashboard/learning/page.tsx` - Enrolled courses
- `src/app/dashboard/learning/[id]/page.tsx` - Course detail with units

## Next Steps

### Recommended Enhancements

1. **Unit Content Viewer**
   - Create `/dashboard/learning/unit/[unitId]` page
   - Display content items with embedded viewers
   - Track content consumption in real-time
   - Update progress as learners complete content

2. **Auto-Enrollment**
   - Automatically enroll learners when admitted to a cohort
   - Create enrollments for all active courses in their cohort
   - Send email notifications

3. **Assessments Integration**
   - Link assessments to units
   - Track assessment scores in unit progress
   - Calculate final grades

4. **Certificates**
   - Generate certificates on course completion
   - Link to existing certificate system

5. **Notifications**
   - Notify learners of new course enrollments
   - Remind learners of incomplete units
   - Notify facilitators of learner progress

6. **Analytics Dashboard**
   - Course completion rates
   - Average time per unit
   - Learner engagement metrics
   - Facilitator performance

7. **Live Session Integration**
   - Link units to classroom sessions
   - Auto-mark attendance as unit progress
   - Integrate with LiveKit sessions

8. **Mobile Optimization**
   - Optimize layouts for mobile devices
   - Add offline content access
   - Mobile-friendly content viewers

## Usage Example

### Creating a Course (Admin)

1. Navigate to `/admin/learning`
2. Click "New Course"
3. Fill in course details:
   - Title: "Foundation of Sales - January 2026"
   - Description: "Comprehensive sales training program"
   - Select Cohort: "January 2026 Intake"
   - Select Program: "Foundation of Sales"
   - Set as "Active" and "Self-paced"
4. Click "Create Course"

### Adding Units (Admin)

1. From course detail page, click "Add Unit"
2. Fill in unit details:
   - Title: "Introduction to Sales Fundamentals"
   - Description: "Learn the basics of professional selling"
   - Assign Facilitator: Select from dropdown
   - Add Content: Select materials from library
   - Set passing score: 70%
   - Estimated duration: 60 minutes
3. Click "Create Unit"
4. Repeat for all units

### Facilitator View

1. Navigate to `/staff/learning`
2. View all assigned units grouped by course
3. Click on a unit to see:
   - Unit details
   - Learner progress statistics
   - Course materials
   - Download/view content

### Learner View

1. Navigate to `/dashboard/learning`
2. View enrolled courses with progress
3. Click on a course to see all units
4. Units are locked/unlocked based on course settings
5. Click "Start Unit" or "Continue" to access content
6. Complete units to unlock next ones (if sequential)

## Integration Points

### Existing Systems

1. **Programs** - Courses link to programs
2. **Cohorts** - Courses link to cohorts/intakes
3. **Content Library** - Units use library content
4. **Users** - Facilitators from users collection
5. **Admissions** - Can auto-enroll on admission

### Future Integrations

1. **Assessments** - Link unit assessments
2. **Certificates** - Generate on completion
3. **Classroom** - Link live sessions to units
4. **Notifications** - Send progress updates
5. **Calendar** - Schedule units

## Notes

- The module is designed to be simple and extensible
- Sequential vs. flexible learning modes are supported
- Facilitator assignments automatically create assignment records
- Progress is calculated automatically
- Deleting a course deletes all its units
- Unit order can be changed by reordering
- Content library integration allows reuse of materials
- All timestamps use Firestore Timestamp type
