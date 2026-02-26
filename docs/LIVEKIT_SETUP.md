# Live Classroom Implementation - LiveKit Setup Guide

## Overview

This implementation uses **self-hosted LiveKit Server** on Google Cloud to support live classroom sessions with up to 200 students per class.

## Architecture

- **LiveKit Server**: Self-hosted on Google Cloud (Compute Engine or GKE)
- **Frontend**: Next.js with LiveKit React components
- **Backend**: Firebase (Firestore for session state, Storage for files, Auth for authentication)
- **Token Generation**: Next.js API route (`/api/livekit/token`)

## Infrastructure Setup

### Option 1: MVP - Single VM Deployment

For getting started or smaller deployments:

1. **Create a Compute Engine VM**
   ```bash
   gcloud compute instances create livekit-server \
     --machine-type=e2-standard-8 \
     --image-family=ubuntu-2204-lts \
     --image-project=ubuntu-os-cloud \
     --boot-disk-size=50GB \
     --tags=livekit-server
   ```

2. **Install LiveKit Server**
   ```bash
   # SSH into the VM
   gcloud compute ssh livekit-server

   # Install LiveKit
   curl -sSL https://get.livekit.io | bash

   # Generate API credentials
   livekit-server generate-keys

   # Start LiveKit
   livekit-server --dev
   ```

3. **Configure Firewall**
   ```bash
   # Allow LiveKit ports
   gcloud compute firewall-rules create allow-livekit \
     --allow=tcp:7880,udp:50000-60000 \
     --target-tags=livekit-server
   ```

4. **Get VM External IP**
   ```bash
   gcloud compute instances describe livekit-server \
     --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
   ```

### Option 2: Production - GKE with Redis

For production with multiple concurrent classes:

1. **Create GKE Cluster**
   ```bash
   gcloud container clusters create livekit-cluster \
     --num-nodes=3 \
     --machine-type=e2-standard-4 \
     --region=us-central1
   ```

2. **Install Redis (required for distributed mode)**
   ```bash
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm install redis bitnami/redis
   ```

3. **Install LiveKit with Helm**
   ```bash
   helm repo add livekit https://helm.livekit.io
   helm install livekit livekit/livekit \
     --set redis.enabled=true \
     --set redis.host=redis-master
   ```

## Application Configuration

### 1. Environment Variables

Copy `.env.livekit.example` to `.env.local` and configure:

```env
# Use your VM IP or domain
NEXT_PUBLIC_LIVEKIT_URL=ws://YOUR_VM_IP:7880
# Or for production with SSL:
# NEXT_PUBLIC_LIVEKIT_URL=wss://livekit.yourdomain.com

# API credentials from `livekit-server generate-keys`
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=secretxxxxxxxxxxxxxxxxxxxxxx

# Firebase Admin (for token verification)
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 2. Firebase Admin SDK Setup

Download your Firebase service account key:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key"
3. Add credentials to `.env.local`

### 3. Firestore Security Rules

Add these rules to allow session data access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Session participants
    match /sessionParticipants/{participantId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.userId;
    }
    
    // Shared documents
    match /sharedDocuments/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Quiz/Poll data
    match /quizzes/{quizId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    match /quizResponses/{responseId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Chat messages
    match /chatMessages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

### 4. Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /classroom/{sessionId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Scaling for 200+ Students

### Publisher Model (Critical for Large Classes)

By default, the system uses a "stage" model:

- **Instructors**: Always publish audio/video
- **Students**: Join as viewers (subscribe-only)
- **Promoted Students**: Can be granted publish permissions

This is already configured in the `LiveRoom` component with appropriate permissions in the token generation.

### VM Sizing Guidelines

For a single room with 200 students:
- **CPU**: 8+ cores (e2-standard-8 or higher)
- **RAM**: 32GB+
- **Network**: 10+ Gbps

One LiveKit room must fit on a single node. For multiple concurrent 200-person classes, add more nodes and use distributed mode with Redis.

## How It Works

1. **Instructor Starts Session**:
   - Goes to `/admin/classroom/session/[id]`
   - Clicks "Start Live Session"
   - Updates Firestore (`status: 'In Progress', isLive: true`)

2. **Students Join**:
   - Go to `/dashboard/classroom/[id]`
   - Complete device check
   - System generates LiveKit token via `/api/livekit/token`
   - Join LiveKit room as viewers

3. **During Session**:
   - **Video/Audio**: LiveKit handles real-time streaming
   - **Chat**: Saved to Firestore for persistence
   - **Documents**: Uploaded to Firebase Storage, metadata in Firestore
   - **Quizzes/Polls**: Real-time via Firestore listeners
   - **Attendance**: Tracked via `sessionParticipants` collection

4. **After Session**:
   - Attendance data available (join/leave times, duration)
   - Chat history preserved
   - Documents remain accessible
   - Quiz results available for review

## Testing Locally

1. **Run LiveKit locally**:
   ```bash
   # Download and run LiveKit locally
   docker run --rm -p 7880:7880 \
     -p 50000-60000:50000-60000/udp \
     -e LIVEKIT_KEYS="test: secret" \
     livekit/livekit-server --dev
   ```

2. **Configure environment**:
   ```env
   NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
   LIVEKIT_API_KEY=test
   LIVEKIT_API_SECRET=secret
   ```

3. **Run your app**:
   ```bash
   npm run dev
   ```

## Monitoring & Troubleshooting

### Check LiveKit Server Status
```bash
curl http://YOUR_VM_IP:7880/
```

### View Active Rooms
Use the LiveKit CLI:
```bash
livekit-cli room list --url ws://YOUR_VM_IP:7880 \
  --api-key YOUR_KEY --api-secret YOUR_SECRET
```

### Common Issues

1. **"Failed to connect"**: Check firewall rules allow ports 7880 and UDP 50000-60000
2. **"Token invalid"**: Verify LIVEKIT_API_KEY and SECRET match server configuration
3. **Poor video quality**: Check network bandwidth and consider reducing number of publishers

## Next Steps

1. Set up SSL/TLS termination with Load Balancer for production
2. Enable recording: https://docs.livekit.io/guides/recording
3. Monitor server metrics with Cloud Monitoring
4. Set up autoscaling for GKE deployment
5. Consider egress optimization for large-scale deployments

## References

- [LiveKit Documentation](https://docs.livekit.io/)
- [LiveKit Self-Hosting Guide](https://docs.livekit.io/deploy/)
- [LiveKit Distributed Mode](https://docs.livekit.io/deploy/distributed/)
- [LiveKit Benchmark](https://docs.livekit.io/deploy/benchmark/)
