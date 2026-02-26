# Quick Start - Deploy to Cloud Run

## One-Time Setup

1. **Install Google Cloud SDK** (if not already installed):
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   ```

2. **Login and set project**:
   ```bash
   gcloud auth login
   gcloud config set project gonogasport
   ```

3. **Enable required services**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable containerregistry.googleapis.com
   ```

## Deploy

```bash
gcloud builds submit --config cloudbuild.yaml
```

That's it! The `cloudbuild.yaml` file handles everything:
- Builds the Docker image
- Pushes to Container Registry
- Deploys to Cloud Run

## Test Locally (Before Deploying)

```bash
# Test Docker build
./test-docker.sh

# Run locally
docker run -p 8080:8080 sales-test
```

Then visit: http://localhost:8080

## View Deployed Service

```bash
# Get service URL
gcloud run services describe sales --region us-central1 --format 'value(status.url)'

# View logs
gcloud run services logs read sales --region us-central1 --limit 50
```

## Files Overview

- `cloudbuild.yaml` - Cloud Build configuration (auto-deploys to Cloud Run)
- `Dockerfile` - Optimized Next.js Docker image
- `deploy.sh` - One-command deployment script
- `test-docker.sh` - Test Docker build locally
- `.dockerignore` - Exclude files from Docker build
- `.gcloudignore` - Exclude files from Cloud Build
- `DEPLOYMENT.md` - Complete deployment guide

## Configuration

- **Project**: gonogasport
- **Service**: sales
- **Region**: us-central1
- **Port**: 8080
- **Memory**: 512Mi
- **CPU**: 1
- **Min Instances**: 0 (scales to zero when idle)
- **Max Instances**: 10
- **Timeout**: 300s

## Need Help?

See `DEPLOYMENT.md` for detailed instructions and troubleshooting.
