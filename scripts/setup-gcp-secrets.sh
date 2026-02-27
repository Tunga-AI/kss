#!/bin/bash
# One-time setup: store secrets in GCP Secret Manager so cloudbuild.yaml
# can mount them safely via --update-secrets (avoids newline-mangling in --set-env-vars).
#
# Run this once from your local machine (you need gcloud cli + appropriate permissions).

PROJECT_ID="gonogasport"
SERVICE_ACCOUNT="your-cloud-run-sa@${PROJECT_ID}.iam.gserviceaccount.com"  # Update this

set -e

echo "=== Creating FIREBASE_PRIVATE_KEY secret ==="
# Create a temp file with the actual private key (will be deleted after)
cat > /tmp/firebase_pk.txt << 'PKEOF'
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCwGXzvuNXDZHQh
aZEH/Uj/opkWlYx5Xm+IitnhgPnsqmHHBi/PL4V2fSOQ3lK1B6zAadwsRA+t4/g3
UlEvVBbJX/xMPnicAvtOGT9hv9t/NfQ8GC18i8G82yBuNXXL7NbbEtP/glPSw+sf
OX0b9bUMiV39ju6QUWvJFSl5ibOVd6lWWxFXB9xmVeWn+keodw6rLQTWa1Rj95pW
UMaC9ev/Y6V9ANcGoToNOamJ5U33eG//5b+GwT8dvvqR/fvyOunGWq7P9yfYW9id
+kyAyRlJQBcv5GUUPx+vrMKNcR/fqYxIX7w+uz+RDqL3ce4+zIt59omsvUB3ivBb
V2oRV68XAgMBAAECggEAAPjluDBwjwdxyVzFrgzHcjs0a4FViQwCQ0zk9A+cEaLv
2ZiepfRbYR1CwizVZGYk8tutbq8iLlxuWpEr8pNycW0uvZWwtnJ2bxFznfdgX7JC
usbgEBUjc4alhgY/NBTcK3x4oCtY3svcc0vZdXs5+IDqUcPlbErkH0mXH4fTmSp8
HBnbnpNYil+UEQdRlueac6eOB2o/DDiaB70hw4Vqm1fwzTRkc8S6zvQDJ5RiEwS6
1Pwi0pSl3Ur9AZr9kLoBt0plN5ZMOJtokKdnVpJDMWJeMqPELz/qOyZcTC07HxuY
eii+frTnTCbIWTS1qkkfoPfT1YMrbx96RbRKLwzYAQKBgQDph7676LJ++Mbnypsz
Yhf9oqGmA1Eljqv5bY1ZvMc6o8iba4zT0uOicGeRk4lvBiOvACdFAg8rbAQ7Cclv
ktbMw4Alir8vL3yOfH5tzXKY6f5zeDzj/tY80DUD2lg0vynr3+lBCaLmMyucXmlo
3JamTM8QOLhBdtSKxelt7JI3FwKBgQDBCyAgxMq6qfdkQoIinujHRSZNgxO5SsED
1l8TKoVj0dgEqLkAYE2EBtZ/jBaLSmE9uOXhqUVlN6utxyz/qSgiOZtToU1VDos1
zgUh0EZHE/tNZV92da2lZEvqqBxc6fwWf+PM12wRZdk9FYN7mYuuoijpWk+O5D0i
H7QbgVFIAQKBgDk84zvtUeqbES141Edo0JaDCPnGsFnzOSV+e3m2MmKmCCJH3xGA
C/khcdEVh0bmC1L2R6m7UnqDFBpgULX/GJTBiiQpeKiZC/9kdhx1kZP3Lj2hB9Od
/2aSZZwXJS1weVbt357oPLwNaK//1/gysN37z3ibXlX1SSzmS0t9A21rAoGAVFTd
5jLSNZWGw7/iRemR22uz/eyjMzEa/OgrhJ3ww9iqO+7RUv6/Hhw2bGXwe001Cde6
ZUijTkJxt2rpl454P+tWlcRDmkLOQeUMjOcFrItoHzmH6KIkB7q3B34FVfnJ7LJV
++ioBzmtG2hIljhPsyyYHskbNFs08bFT5ygpMAECgYEA6IfnweahRvu2GmRGQMK4
xBaK0c9kyy1G+5+3w/j2f43oVTRlfKmIlo6Ck7OybUQs9XCbmmUWMuw+QITYHSRN
ztWA+RpIJxzgR7NWvWJ0PvyRCbSZwjMkDfhehwXMTgXzoovPvbTZN4kTEPnN6iLs
Ijj45fnXFhqmYPpD9tG0MWc=
-----END PRIVATE KEY-----
PKEOF

# Create secret (or add new version if it already exists)
gcloud secrets create FIREBASE_PRIVATE_KEY \
  --project="${PROJECT_ID}" \
  --data-file=/tmp/firebase_pk.txt 2>/dev/null || \
gcloud secrets versions add FIREBASE_PRIVATE_KEY \
  --project="${PROJECT_ID}" \
  --data-file=/tmp/firebase_pk.txt

rm /tmp/firebase_pk.txt

echo "=== Creating EMAIL_PASSWORD secret ==="
echo -n "yvva uynv aqry kdmi" | gcloud secrets create EMAIL_PASSWORD \
  --project="${PROJECT_ID}" \
  --data-file=- 2>/dev/null || \
echo -n "yvva uynv aqry kdmi" | gcloud secrets versions add EMAIL_PASSWORD \
  --project="${PROJECT_ID}" \
  --data-file=-

echo ""
echo "=== Granting Cloud Run SA access to secrets ==="
echo "NOTE: Replace SERVICE_ACCOUNT with your actual Cloud Run service account."
echo "You can find it at: https://console.cloud.google.com/run/detail/us-central1/sales/security"
echo ""
echo "Run these commands manually after finding your SA email:"
echo ""
echo "  gcloud secrets add-iam-policy-binding FIREBASE_PRIVATE_KEY \\"
echo "    --member=\"serviceAccount:\${SERVICE_ACCOUNT}\" \\"
echo "    --role=\"roles/secretmanager.secretAccessor\" \\"
echo "    --project=\"${PROJECT_ID}\""
echo ""
echo "  gcloud secrets add-iam-policy-binding EMAIL_PASSWORD \\"
echo "    --member=\"serviceAccount:\${SERVICE_ACCOUNT}\" \\"
echo "    --role=\"roles/secretmanager.secretAccessor\" \\"
echo "    --project=\"${PROJECT_ID}\""
echo ""
echo "=== Done! Now re-run Cloud Build to deploy with secrets. ==="
