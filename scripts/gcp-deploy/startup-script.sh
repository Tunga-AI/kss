#!/bin/bash
# startup-script.sh
# Purpose: Automate the deployment of a self-hosted LiveKit server on Google Compute Engine for KSS Classroom.
# VM Recommendations: e2-standard-4 (at least) for 200 concurrent students per room.

set -e

# 1. Install Docker & Docker Compose
apt-get update
apt-get install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | apt-key add -
add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
apt-get update
apt-get install -y docker-ce docker-compose

# 2. Create LiveKit configuration directory
mkdir -p /opt/livekit
cd /opt/livekit

# 3. Create LiveKit config file
# IMPORTANT: Replace <API_KEY> and <API_SECRET> in the final deployment or via environment variables
cat <<EOF > livekit.yaml
port: 7880
bind_addresses:
  - ""
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true
keys:
  YOUR_API_KEY: YOUR_API_SECRET
EOF

# 4. Create Docker Compose file for LiveKit + Caddy (for automatic SSL)
# This assumes you have a domain pointed to this VM's IP.
cat <<EOF > docker-compose.yaml
version: '3'
services:
  livekit:
    image: livekit/livekit-server:latest
    command: --config /etc/livekit.yaml
    restart: always
    network_mode: "host"
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
  
  # Caddy facilitates auto-SSL for the LiveKit WebSocket/API
  caddy:
    image: caddy:2-alpine
    restart: always
    network_mode: "host"
    command: caddy reverse-proxy --from \${DOMAIN} --to localhost:7880
EOF

# 5. Start the server
# Note: In a real automated setup, DOMAIN, KEY, and SECRET would be passed as metadata.
# Example: export DOMAIN=\$(curl -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/attributes/domain)
export DOMAIN="classroom.yourdomain.com"
docker-compose up -d

echo "LiveKit server is deploying... Open UDP ports 50000-60000 and TCP 7880,7881, 80, 443 in GCP Firewall."
