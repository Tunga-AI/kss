# Coding Agent Session: Building the "Kenya Schools of Sales" Platform

**Applicant:** Victor Mutunga
**Platform:** Kenya Schools of Sales (KSS)
**Duration:** January - February 2026
**Agent:** Antigravity (Google DeepMind)

---

## 🚀 Session Objective
Design and build a comprehensive, production-ready Learning Management System (LMS) and Sales Enablement platform from scratch. Key requirements:
- **Tenancy:** Multi-portal architecture (Admin, Facilitator, Student, B2B/Business).
- **Core Tech:** Next.js 15 (App Router, Turbopack), TypeScript, Firebase (Auth/Firestore/Storage), and Google Cloud Run.
- **Features:** Live classes (LiveKit), SCORM/Content Library, Payments (Paystack), and AI-driven features (Genkit).

---

## 📜 Session Transcript Highlights

### Phase 1: Architecture & Foundation
**User (Victor):** "I need a scalable architecture for KSS. We have different user types with distinct needs. Let's set up a Next.js 15 app with role-based routing."
**Agent:** "Initializing Next.js project. I'll structure the `src/app` directory to have distinct route groups: `(public)` for marketing, `/admin` for operations, `/staff` for instructors, and `/dashboard` for learners. I'll configure Firebase Authentication with custom claims to handle role-based middleware protection."

*Action:*
- Scaffolded project with `create-next-app`.
- Configured recursive middleware for RBAC (Role-Based Access Control).
- Set up `firebase/config.ts` and React Context providers for global auth state.

### Phase 2: The Core Modules (Admin Portal)
**User:** "Admins need to manage everything: Leads (CRM), Admissions, Courses, and Finance. Let's start with the CRM."
**Agent:** "Building the CRM module. I'll create a Kanban-style 'Leads Manager' and a table-based 'Applications' view. We'll use Firestore real-time listeners so the sales team sees updates instantly."
*Action:* Created `src/app/admin/crm/leads`. Implemented drag-and-drop pipeline stages.

**User:** "Now for the Course management. We need to create Programs, then break them down into Cohorts and Classes."
**Agent:** "Understood. Implementation plan:
1.  Enable creating 'Programs' (e.g., 'Advanced Sales logic').
2.  create 'Cohorts' (e.g., 'Jan 2026 Intake') linked to Programs.
3.  Assign 'Classes' and 'Timetables' to Cohorts."
*Action:* Built complex relational data modeling in NoSQL firestore and corresponding management UIs.

### Phase 3: The Learning Experience (Student & Staff)
**User:** "Students need a dashboard to see their classes, grades, and access materials. Facilitators need a portal to grade assessments and upload library content."
**Agent:** "I've built the Student Dashboard with a focus on progress tracking. For Facilitators, I've just deployed the **Content Library** feature. It supports video, PDF, and SCORM packages. I solved a critical permission issue regarding `uploadBytes` security rules ensuring facilitators can upload materials but not overwrite system configs."

### Phase 4: Advanced Features (LiveKit & Genkit)
**User:** "We need live classes. Zoom is too disjointed. Integrate LiveKit."
**Agent:** "Integrating LiveKit for in-app video conferencing.
- Created `src/app/staff/classroom/[liveId]` for instructors to broadcast.
- Created student view for consuming streams.
- Added real-time chat and screen sharing."

**User:** "Let's add some AI. I want to use Google's Genkit."
**Agent:** "Setting up `src/ai/dev.ts`. We can use this for auto-grading assessments and generating course summaries."

### Phase 5: Production & DevOps
**User:** "It's time to go live. Deploy this to Google Cloud Run."
**Agent:** "I'll containerize the application.
1.  Created `Dockerfile` (multi-stage build for Next.js standalone output).
2.  Configured `cloudbuild.yaml` to auto-deploy on git push.
3.  Fixed environment variable injection for Firebase keys during build time."

**User:** "I'm getting a 404 on the Staff Library Upload page in production."
**Agent:** "Diagnosed. The file was missing in the build map. I created the page, fixed the routing, resolved a Firebase Storage permission error by standardizing the upload method, and redeployed successfully."

---

## 🛠️ Technical Complexity Demonstrated
- **Real-time State:** synchronization of classroom states between instructors and N students using Firebase & LiveKit.
- **Complex UI:** Custom-built data grids, Kanban boards, and media players WITHOUT relying on heavy 3rd party UI libraries (mostly Shadcn/UI + Tailwind).
- **Security:** Granular Firestore Security Rules and Next.js Middleware to ensure total data isolation between tenants (B2B vs. Public Students).
- **Infrastructure:** Fully automated CI/CD pipeline using Google Cloud Build.

## 🏁 Outcome
A fully operational, high-performance educational platform handling payments, live video, and complex LMS logic, built and deployed in record time through human-AI collaboration.
