#!/usr/bin/env bash
# Call Firebase callable getBookByIsbn (Google Books lookup by ISBN).
#
# Usage:
#   1. Export the idToken from your sign-in response, then run:
#      export ID_TOKEN='eyJhbGci...full.token...'
#      ./scripts/call-getBookByIsbn.sh
#
#   2. Or pass the token as the first argument:
#      ./scripts/call-getBookByIsbn.sh 'eyJhbGci...'
#
#   3. Or pipe the sign-in JSON and extract the token:
#      cat auth-response.json | jq -r '.idToken' | xargs -I {} ./scripts/call-getBookByIsbn.sh {}
#
# Get a fresh idToken: sign in at localhost:8081, DevTools → Network → signInWithPassword → Response → copy "idToken".
# Tokens expire in ~1 hour.

set -e
TOKEN="${ID_TOKEN:-$1}"
ISBN="${2:-0393330729}"

if [ -z "$TOKEN" ]; then
  echo "Usage: export ID_TOKEN='<idToken>'; $0" >&2
  echo "   or: $0 '<idToken>' [isbn]" >&2
  exit 1
fi

curl -s -X POST "https://us-central1-library-84eeb.cloudfunctions.net/getBookByIsbn" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"data\":{\"isbn\":\"$ISBN\"}}" | jq .
