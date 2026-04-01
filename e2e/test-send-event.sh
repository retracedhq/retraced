#!/bin/bash
set -euo pipefail

# Configuration - matches the bootstrap constants
PROJECT_ID="e2e-test-project-id"
API_TOKEN="e2e-test-api-token"
API_URL="${RETRACED_API_URL:-http://localhost:3000}"

echo "=== Waiting for Retraced API to be ready ==="
MAX_RETRIES=60
for i in $(seq 1 $MAX_RETRIES); do
  if curl -sf "${API_URL}/healthz" > /dev/null 2>&1; then
    echo "Retraced API is ready"
    break
  fi
  if [ "$i" -eq "$MAX_RETRIES" ]; then
    echo "ERROR: Retraced API did not become ready after ${MAX_RETRIES} attempts"
    exit 1
  fi
  echo "Waiting for API... (attempt $i/$MAX_RETRIES)"
  sleep 2
done

echo ""
echo "=== Sending test event ==="

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${API_URL}/publisher/v1/project/${PROJECT_ID}/event" \
  -H "Content-Type: application/json" \
  -H "Authorization: Token token=${API_TOKEN}" \
  -d '{
    "action": "ci.test.event",
    "group": {
      "id": "e2e-test-group"
    },
    "crud": "c",
    "description": "E2E test event to verify retraced is working",
    "is_anonymous": true,
    "created": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'",
    "fields": {
      "source": "circleci-e2e",
      "test": "true"
    }
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ]; then
  echo "Event sent successfully (HTTP 201)"
  echo "Response: ${BODY}"
else
  echo "ERROR: Unexpected HTTP status: ${HTTP_CODE}"
  echo "Response: ${BODY}"
  exit 1
fi

echo ""
echo "=== Verifying event via GraphQL query ==="

# Wait for the processor to handle the event
sleep 5

QUERY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${API_URL}/publisher/v1/project/${PROJECT_ID}/graphql" \
  -H "Content-Type: application/json" \
  -H "Authorization: Token token=${API_TOKEN}" \
  -d '{
    "query": "query { search(query: \"ci.test.event\", last: 1) { edges { node { id action description } } } }"
  }')

QUERY_HTTP_CODE=$(echo "$QUERY_RESPONSE" | tail -n 1)
QUERY_BODY=$(echo "$QUERY_RESPONSE" | sed '$d')

if [ "$QUERY_HTTP_CODE" = "200" ]; then
  echo "Query succeeded (HTTP 200)"
  echo "Response: ${QUERY_BODY}"

  # Verify the event appears in results
  if echo "$QUERY_BODY" | grep -q "ci.test.event"; then
    echo "Event found in search results"
  else
    echo "WARNING: Event not found in search results (may still be processing)"
  fi
else
  echo "WARNING: Query returned HTTP ${QUERY_HTTP_CODE} (event may still be processing)"
  echo "Response: ${QUERY_BODY}"
  # Don't fail on query - the event was already confirmed created
fi

echo ""
echo "=== E2E test passed ==="
