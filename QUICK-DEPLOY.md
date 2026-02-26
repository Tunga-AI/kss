# KSS Institute Portal - Quick Deploy

## 🚀 Deploy to Cloud Run

Your project is fully configured for deployment to Google Cloud Run.

### Quick Deploy (One Command)
```bash
./deploy.sh
```

That's it! The script will:
1. Build your Docker image
2. Push to Google Container Registry  
3. Deploy to Cloud Run on the `gonogasport` project as the `sales` service

### What's Included

✅ **cloudbuild.yaml** - Cloud Build configuration  
✅ **Dockerfile** - Multi-stage Docker build  
✅ **nginx.conf** - Server configuration (if needed)  
✅ **.gitignore** - Excludes unnecessary files  
✅ **next.config.ts** - Configured for standalone deployment  
✅ **deploy.sh** - One-command deployment script  

### Manual Deployment
If you prefer to run commands manually:

```bash
# Set project
gcloud config set project gonogasport

# Deploy
gcloud builds submit --config cloudbuild.yaml
```

### View Deployment
After deployment completes:

```bash
# Get service URL
gcloud run services describe sales --region=us-central1 --format='value(status.url)'

# View logs
gcloud run services logs read sales --region=us-central1 --limit=50
```

### Environment Variables
Set your Firebase and other env vars in Cloud Run:

```bash
gcloud run services update sales \
  --region=us-central1 \
  --update-env-vars="NEXT_PUBLIC_FIREBASE_API_KEY=your_key" \
  --project=gonogasport
```

### Firestore Security Rules
Don't forget to deploy your Firestore rules:

```bash
firebase deploy --only firestore:rules
```

## 📊 Dashboard Features

Your deployment includes enhanced dashboards with:
- ✅ **4 stat cards** with inline graphs (area, bar, line charts)
- ✅ **Quick action links** for common tasks
- ✅ **Upcoming events** (intakes, sessions, classes)
- ✅ **New leads tracking**
- ✅ **Revenue and performance charts**

### Portal URLs
Once deployed, access your portals at:
- **Admin**: `/a` or `/admin`
- **Learner**: `/l` or `/dashboard`  
- **Staff**: `/f` or `/staff`
- **Business**: `/b` or `/business-portal`
- **Sales**: `/sales`
- **Operations**: `/operations`
- **Finance**: `/finance`

## 🔧 Troubleshooting

**Build fails?**
- Check: `gcloud builds log <BUILD_ID>`

**Service won't start?**
- Check logs: `gcloud run services logs read sales --region=us-central1`

**Need to rollback?**
```bash
gcloud run revisions list --service=sales --region=us-central1
gcloud run services update-traffic sales --to-revisions=<REVISION_NAME>=100 --region=us-central1
```

For detailed deployment guide, see [DEPLOYMENT.md](./DEPLOYMENT.md)
