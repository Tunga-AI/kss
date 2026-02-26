# Cloud Build Deployment Guide

## Project Configuration
- **Project ID**: `gonogasport`
- **Service Name**: `sales`
- **Region**: `us-central1`
- **Platform**: Cloud Run

## Prerequisites
1. Google Cloud SDK (gcloud CLI) installed
2. Authenticated with Google Cloud: `gcloud auth login`
3. Docker installed (for local testing)
4. Firebase CLI (for Firestore rules deployment)

## Deployment Files
The following files are configured for deployment:

### 1. `cloudbuild.yaml`
Main Cloud Build configuration file that:
- Builds the Docker image
- Pushes to Google Container Registry (GCR)
- Deploys to Cloud Run

### 2. `Dockerfile`
Multi-stage Docker build that:
- Installs dependencies
- Builds the Next.js app in standalone mode
- Creates optimized production image

### 3. `next.config.ts`
Configured with:
- `output: 'standalone'` for Docker deployment
- URL rewrites for portal shortcuts (/a, /l, /f, /b)
- Remote image patterns for external images

### 4. `.gitignore`
Excludes:
- node_modules, .next, build artifacts
- Environment files (.env*)
- Firebase debug logs
- Cloud-specific files (.gcloudignore)

## Deployment Steps

### Option 1: Using the Deploy Script (Recommended)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Option 2: Manual Deployment
```bash
# 1. Ensure you're authenticated
gcloud auth login

# 2. Set the project
gcloud config set project gonogasport

# 3. Trigger Cloud Build
gcloud builds submit --config cloudbuild.yaml

# 4. (Optional) Deploy Firestore rules
firebase deploy --only firestore:rules
```

### Option 3: Submit from GitHub/GitLab
Set up a Cloud Build trigger that automatically deploys when you push to your repository.

## Environment Variables
Make sure to set required environment variables in Cloud Run:

```bash
gcloud run services update sales \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=your_key,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain" \
  --project=gonogasport
```

Or use the Cloud Console:
1. Go to Cloud Run > sales service
2. Click "Edit & Deploy New Revision"
3. Go to "Variables & Secrets" tab
4. Add your environment variables

## Required Environment Variables
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_LIVEKIT_WS_URL` (if using LiveKit)

## Monitoring Deployment

### Check Build Status
```bash
gcloud builds list --project=gonogasport --limit=5
```

### View Build Logs
```bash
gcloud builds log <BUILD_ID> --project=gonogasport
```

### Check Service Status
```bash
gcloud run services describe sales --region=us-central1 --project=gonogasport
```

### View Service Logs
```bash
gcloud run services logs read sales --region=us-central1 --project=gonogasport
```

## Troubleshooting

### Build Fails
1. Check build logs: `gcloud builds log <BUILD_ID>`
2. Verify Dockerfile syntax
3. Ensure all dependencies are in package.json

### Service Won't Start
1. Check Cloud Run logs
2. Verify environment variables are set
3. Test Docker image locally:
   ```bash
   docker build -t test-image .
   docker run -p 8080:8080 test-image
   ```

### Permission Errors
1. Ensure Cloud Build service account has necessary permissions
2. Grant roles:
   ```bash
   gcloud projects add-iam-policy-binding gonogasport \
     --member=serviceAccount:YOUR_BUILD_SA \
     --role=roles/run.admin
   ```

## Post-Deployment

### Update Firestore Rules
```bash
firebase deploy --only firestore:rules
```

### Configure Custom Domain (Optional)
```bash
gcloud run domain-mappings create \
  --service=sales \
  --domain=yourdomain.com \
  --region=us-central1 \
  --project=gonogasport
```

## Cost Optimization

Current configuration:
- Min instances: 0 (scales to zero when idle)
- Max instances: 10
- Memory: 512Mi
- CPU: 1
- Timeout: 300s

To adjust resources:
```bash
gcloud run services update sales \
  --region=us-central1 \
  --memory=1Gi \
  --cpu=2 \
  --max-instances=20 \
  --project=gonogasport
```

## Quick Reference

### Deploy Command
```bash
gcloud builds submit --config cloudbuild.yaml
```

### Rollback to Previous Revision
```bash
# List revisions
gcloud run revisions list --service=sales --region=us-central1

# Route traffic to previous revision
gcloud run services update-traffic sales \
  --to-revisions=<REVISION_NAME>=100 \
  --region=us-central1
```

### Delete Service (Caution!)
```bash
gcloud run services delete sales --region=us-central1 --project=gonogasport
```

## Dashboard URLs (After Deployment)
Once deployed, your dashboards will be accessible at:
- **Admin Portal**: `https://your-service-url/a`
- **Learner Portal**: `https://your-service-url/l`  
- **Staff Portal**: `https://your-service-url/f`
- **Business Portal**: `https://your-service-url/b`
- **Sales Portal**: `https://your-service-url/sales`
- **Operations Portal**: `https://your-service-url/operations`
- **Finance Portal**: `https://your-service-url/finance`
