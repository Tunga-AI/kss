#!/bin/bash
# deploy-livekit.sh
# This script deploys the LiveKit server to Google Cloud using gcloud commands.

PROJECT_ID="gonogasport"
REGION="us-central1"
ZONE="us-central1-a"
INSTANCE_NAME="livekit-server"
MACHINE_TYPE="e2-standard-4"

echo "🚀 Starting LiveKit deployment on Google Cloud (Project: $PROJECT_ID)..."

# 1. Set the project
gcloud config set project $PROJECT_ID

# 2. Enable necessary APIs
echo "🔧 Enabling Compute Engine API..."
gcloud services enable compute.googleapis.com

# 3. Create Firewall Rules for LiveKit
echo "🔥 Configuring Firewall Rules..."
# Signal and API
gcloud compute firewall-rules create allow-livekit-tcp \
    --allow tcp:7880,tcp:7881,tcp:80,tcp:443 \
    --description="LiveKit Signal and API" \
    --target-tags=livekit-server --quiet || echo "Firewall rule already exists, skipping..."

# RTC Media (UDP)
gcloud compute firewall-rules create allow-livekit-udp \
    --allow udp:50000-60000 \
    --description="LiveKit RTC Media" \
    --target-tags=livekit-server --quiet || echo "Firewall rule already exists, skipping..."

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

# 4. Create the Instance
echo "🖥️ Creating Compute Engine Instance: $INSTANCE_NAME..."
gcloud compute instances create $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=ubuntu-2204-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=50GB \
    --tags=livekit-server \
    --metadata-from-file=startup-script="$SCRIPT_DIR/startup-script.sh" \
    --network-tier=PREMIUM \
    --quiet

echo "✅ Deployment initiated!"
echo "📍 Instance is starting. To get the external IP, run:"
echo "   gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)'"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Wait 2-3 minutes for the startup script to finish installing Docker and LiveKit."
echo "2. Once you have the IP, update NEXT_PUBLIC_LIVEKIT_URL in your .env.local file."
echo "   Example: NEXT_PUBLIC_LIVEKIT_URL=ws://<YOUR_IP>:7880"
echo "3. Update LIVEKIT_API_KEY and LIVEKIT_API_SECRET in .env.local (default in startup-script is YOUR_API_KEY/YOUR_API_SECRET)."
