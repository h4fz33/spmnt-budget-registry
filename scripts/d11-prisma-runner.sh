#!/bin/bash
# P0-08-D11 Prisma API Token Test Runner
# This script retrieves only the Prisma API token from Secret Manager
# and calls the Prisma API to get redacted project information
# It must NOT read database URI or GCS service account JSON

set -e

echo "=== P0-08-D11 Prisma Runner ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

# Retrieve only the Prisma API token (approved secret)
echo "Retrieving Prisma API token from Secret Manager..."
PRISMA_TOKEN=$(gcloud secrets versions access latest --secret="SPMNT-ACC-AUDIT_PRISMA-SERVICE-TOKEN" --project="spmnt-sch-acc-audit")

if [ -z "$PRISMA_TOKEN" ]; then
  echo "ERROR: Failed to retrieve Prisma token"
  exit 1
fi

echo "Token retrieved successfully (not displayed)"

# Call Prisma API with authentication
echo ""
echo "Calling Prisma API..."
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer $PRISMA_TOKEN" \
  "https://api.prisma.io/v1/projects/proj_cmspqhtsz2dti12f55eww2w0o")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo ""
echo "=== REDACTED RESULTS ==="
echo "HTTP Status: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "Project ID: $(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"
  echo "Project Name: $(echo "$BODY" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)"
  echo "Default Region: $(echo "$BODY" | grep -o '"defaultRegion":"[^"]*"' | cut -d'"' -f4)"
  echo ""
  echo "Full response (credentials redacted):"
  echo "$BODY" | jq 'del(.credentials)' 2>/dev/null || echo "$BODY"
else
  echo "API call failed with status $HTTP_CODE"
  echo "Response: $BODY"
fi

echo ""
echo "=== END RESULTS ==="
