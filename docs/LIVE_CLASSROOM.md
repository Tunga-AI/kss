# Live Classroom Feature

A comprehensive live video classroom system built with Next.js, LiveKit, and Firebase.

## ✨ Features

### For Instructors
- **Start/Stop Live Sessions**: Full control over when classes go live
- **Screen Sharing**: Share your screen with all students
- **Document Sharing**: Upload and share files (PDF, Word, PowerPoint, etc.) up to 50MB
- **Live Quizzes & Polls**: Create interactive quizzes with instant results
- **Class Chat**: Real-time messaging with students (persisted in Firestore)
- **Attendance Tracking**: Automatic join/leave tracking with duration calculation
- **Session Management**: Schedule, edit, and manage classroom sessions

### For Students
- **Device Check**: Pre-join audio/video/connection testing
- **HD Video Streaming**: View instructor and promoted students
- **Interactive Participation**: Respond to polls/quizzes in real-time
- **Access Shared Materials**: Download documents shared during class
- **Class Chat**: Communicate with instructor and peers
- **Session History**: View past sessions and materials

### Technical Features
- **Scalable Architecture**: Supports 200+ students per class
- **Firebase Integration**: Auth, Firestore, and Storage
- **Self-Hosted LiveKit**: Full control over video infrastructure on Google Cloud
- **Real-time Everything**: Chat, quizzes, attendance via Firestore
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Secure**: Firebase Auth + JWT tokens for LiveKit access

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ├─────────────┐
         │             │
┌────────▼────────┐   ┌▼───────────────┐
│    Firebase     │   │  LiveKit Server│
│  (Firestore,    │   │ (Google Cloud) │
│  Storage, Auth) │   │                │
└─────────────────┘   └────────────────┘
```

### Data Flow
1. **Instructor** starts session → Updates Firestore (`isLive: true`)
2. **Students** join → Device check → Get LiveKit token from API
3. **Video/Audio** → Handled by LiveKit (WebRTC)
4. **Chat, Docs, Quizzes** → Firestore (real-time sync)
5. **Attendance** → Logged to Firestore on join/leave

## 📋 Prerequisites

- Node.js 18+
- Firebase project with Firestore, Storage, Auth enabled
- Google Cloud account for LiveKit server
- LiveKit Server (self-hosted on GCP)

## 🚀 Quick Start

### 1. Install Dependencies

Already installed if you have the project running.

### 2. Setup Environment Variables

Create `.env.local` from the template:

```bash
cp .env.livekit.example .env.local
```

Configure with your values:
```env
# LiveKit Server URL (from your GCP deployment)
NEXT_PUBLIC_LIVEKIT_URL=ws://YOUR_LIVEKIT_IP:7880

# LiveKit API Credentials
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret

# Firebase Admin
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 3. Deploy LiveKit Server

See `docs/LIVEKIT_SETUP.md` for detailed instructions.

Quick test with Docker:
```bash
docker run --rm -p 7880:7880 \
  -p 50000-60000:50000-60000/udp \
  -e LIVEKIT_KEYS="test: secret" \
  livekit/livekit-server --dev
```

### 4. Configure Firestore Rules

Add the security rules from `docs/LIVEKIT_SETUP.md` to your Firestore.

### 5. Start the App

```bash
npm run dev
```

## 📱 Usage

### As an Instructor

1. **Schedule a Session**
   - Go to Admin → Classroom
   - Click "Create Session"
   - Fill in title, description, date/time, program

2. **Start Live Session**
   - Navigate to Admin → Classroom → [Your Session]
   - Click "Start Live Session"
   - Complete device check
   - Session goes live!

3. **During Session**
   - Share screen, camera, microphone
   - Upload documents (Files tab)
   - Create quizzes/polls (Polls tab)
   - Chat with students (Chat tab)
   - View participants (People tab)

4. **End Session**
   - Click "Leave Session"
   - Session status updates to "Completed"
   - Attendance and analytics saved

### As a Student

1. **View Upcoming Sessions**
   - Go to Dashboard → Virtual Classroom
   - See all scheduled sessions

2. **Join Session**
   - Click "Join Session" when live
   - Complete device check
   - Click "Join Session"

3. **Participate**
   - Watch instructor video
   - Download shared materials
   - Respond to quizzes/polls
   - Chat with class

## 🗂️ File Structure

```
src/
├── app/
│   ├── api/livekit/token/          # Token generation endpoint
│   ├── admin/classroom/session/[id]/ # Instructor session page
│   └── dashboard/classroom/[id]/     # Student session page
├── components/classroom/
│   ├── device-check.tsx            # Pre-join device testing
│   ├── live-room.tsx               # Main LiveKit room component
│   ├── participants-list.tsx       # Live participants panel
│   ├── chat-panel.tsx              # Real-time chat
│   ├── document-panel.tsx          # File sharing
│   └── quiz-panel.tsx              # Interactive quizzes/polls
└── lib/
    └── classroom-types.ts          # TypeScript types

docs/
└── LIVEKIT_SETUP.md               # Full deployment guide
```

## 🔧 Configuration

### Scaling for Large Classes

For classes with 200+ students, the system automatically:
- **Instructors**: Always publish video/audio
- **Students**: Join as viewers (subscribe-only)
- **Promoted Students**: Can be granted publish permissions

This "stage" model reduces bandwidth and server load significantly.

### VM Sizing

For a single 200-student room:
- **CPU**: 8+ cores
- **RAM**: 32GB+
- **Network**: 10+ Gbps

See `docs/LIVEKIT_SETUP.md` for detailed infrastructure guidance.

## 🐛 Troubleshooting

### "Failed to connect to session"
- Check LiveKit server is running
- Verify `NEXT_PUBLIC_LIVEKIT_URL` is correct
- Ensure firewall allows ports 7880 (TCP) and 50000-60000 (UDP)

### "Token generation failed"
- Verify `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` match server
- Check Firebase Admin credentials are correct

### "Cannot upload documents"
- Verify Firebase Storage rules allow authenticated writes
- Check file size (max 50MB)

### Poor video quality
- Check student internet connection
- Reduce number of publishers (use viewer mode for most students)
- Consider upgrading LiveKit server VM

## 📊 Data Model

### Firestore Collections

- **`classroom`**: Session metadata (title, date, status, liveKitRoomName)
- **`sessionParticipants`**: Who joined, when, duration
- **`sharedDocuments`**: Uploaded files metadata
- **`quizzes`**: Quiz/poll questions and settings
- **`quizResponses`**: Student answers
- **`chatMessages`**: Chat history

All collections sync in real-time using Firestore listeners.

## 🔒 Security

- **Authentication**: Firebase Auth required for all actions
- **Token Verification**: Server validates Firebase ID tokens before issuing LiveKit tokens
- **Short-lived Tokens**: LiveKit tokens expire after session
- **Firestore Rules**: Row-level security on all data
- **Storage Rules**: Authenticated uploads only

## 🎯 Roadmap

- [ ] Session recording with Cloud Storage
- [ ] Breakout rooms for group work
- [ ] Hand raise feature
- [ ] Whiteboard integration
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered automated transcription and summaries

## 📚 Resources

- [LiveKit Documentation](https://docs.livekit.io/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Setup Guide](./docs/LIVEKIT_SETUP.md)

## 🤝 Support

For issues or questions:
1. Check `docs/LIVEKIT_SETUP.md`
2. Review Firestore security rules
3. Check browser console for errors
4. Verify environment variables

---

**Built with ❤️ using Next.js, LiveKit, and Firebase**
