#!/bin/bash
set -e

echo "=== P0-08-D11 Prisma Runner ==="
echo "Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

echo "Retrieving Prisma API token..."
PRISMA_TOKEN=$(gcloud secrets versions access latest --secret="SPMNT-ACC-AUDIT_PRISMA-SERVICE-TOKEN" --project="spmnt-sch-acc-audit")

echo "Token retrieved (not displayed)"
echo ""

echo "Calling Prisma API..."
curl -s -H "Authorization: Bearer $PRISMA_TOKEN" \
  "https://api.prisma.io/v1/projects/proj_cmspqhtsz2dti12f55eww2w0o"

echo ""
echo "=== END ==="
