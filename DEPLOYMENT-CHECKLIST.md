# Deployment Checklist

## Before First Deployment

- [ ] Google Cloud SDK installed
- [ ] Logged in to gcloud (`gcloud auth login`)
- [ ] Project set to `gonogasport`
- [ ] Required APIs enabled:
  - [ ] Cloud Build API
  - [ ] Cloud Run API
  - [ ] Container Registry API

Enable all APIs at once:
```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com \
  --project=gonogasport
```

## Configuration Verified

- [x] `cloudbuild.yaml` - Project: gonogasport, Service: sales
- [x] `Dockerfile` - Optimized for Cloud Run (port 8080)
- [x] `next.config.ts` - Has `output: 'standalone'`
- [x] `.dockerignore` - Excludes unnecessary files
- [x] `.gcloudignore` - Excludes build artifacts
- [x] Deploy scripts created

## Environment Variables (If Needed)

If your app needs Firebase or other environment variables:

1. Create `.env.yaml`:
```yaml
NEXT_PUBLIC_FIREBASE_API_KEY: "your-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "your-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID: "your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "your-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID: "your-app-id"
```

2. Update `cloudbuild.yaml` step 3 to add:
```yaml
- '--env-vars-file'
- '.env.yaml'
```

## Deploy Steps

### Test Locally First
```bash
# Build and test Docker image
./test-docker.sh

# Run locally
docker run -p 8080:8080 sales-test

# Test at http://localhost:8080
```

### Deploy to Cloud Run
```bash
# Simple deploy
./deploy.sh

# Or manually
gcloud builds submit --config cloudbuild.yaml
```

## Post-Deployment

- [ ] Get service URL:
  ```bash
  gcloud run services describe sales --region us-central1 --format 'value(status.url)'
  ```

- [ ] Test the deployed service

- [ ] Check logs:
  ```bash
  gcloud run services logs read sales --region us-central1
  ```

- [ ] Set up custom domain (optional):
  ```bash
  gcloud run domain-mappings create \
    --service sales \
    --domain yourdomain.com \
    --region us-central1
  ```

## Monitoring

- [ ] Set up alerts in Google Cloud Console
- [ ] Monitor costs in Billing
- [ ] Review logs regularly

## Common Issues

### Build Fails
```bash
# View recent builds
gcloud builds list --limit 5

# View specific build
gcloud builds log BUILD_ID
```

### Permission Denied
```bash
# Add required IAM roles
gcloud projects add-iam-policy-binding gonogasport \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/run.admin
```

### Service Not Responding
```bash
# Check service status
gcloud run services describe sales --region us-central1

# Check logs
gcloud run services logs read sales --region us-central1 --limit 100
```

## Service Configuration

Current settings (from `cloudbuild.yaml`):
- Memory: 512Mi
- CPU: 1
- Min Instances: 0 (scales to zero)
- Max Instances: 10
- Timeout: 300s (5 minutes)
- Port: 8080

To update these after deployment:
```bash
gcloud run services update sales \
  --memory 1Gi \
  --cpu 2 \
  --region us-central1
```

## Cost Optimization

- [x] Min instances set to 0 (scales to zero when idle)
- [ ] Review Cloud Run pricing: https://cloud.google.com/run/pricing
- [ ] Set up budget alerts
- [ ] Monitor request counts

Free tier includes:
- 2 million requests/month
- 360,000 GB-seconds memory
- 180,000 vCPU-seconds compute

## Security

- [ ] Review IAM permissions
- [ ] Configure Firestore security rules
- [ ] Set up VPC connector (if needed for private resources)
- [ ] Enable Cloud Armor (if needed for DDoS protection)

## Next Steps

- [ ] Set up CI/CD pipeline (GitHub Actions or Cloud Build triggers)
- [ ] Configure custom domain
- [ ] Set up SSL certificate
- [ ] Configure CDN (if needed)
- [ ] Set up monitoring and alerting
