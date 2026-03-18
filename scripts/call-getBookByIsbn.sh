#!/usr/bin/env bash
# Call Firebase callable getBookByIsbn (Google Books lookup by ISBN).
#
# Usage:
#   1. With ID_TOKEN in env, pass ISBN as first argument:
#      export ID_TOKEN='eyJhbGci...full.token...'
#      ./scripts/call-getBookByIsbn.sh 9780393330729
#
#   2. Or pass token then ISBN:
#      ./scripts/call-getBookByIsbn.sh 'eyJhbGci...' 9780393330729
#
#   3. Pipe token and pass ISBN:
#      jq -r '.idToken' auth-response.json | xargs -I {} ./scripts/call-getBookByIsbn.sh {} 9780140328721
#
# Get a fresh idToken: sign in at localhost:8081, DevTools → Network → signInWithPassword → Response → copy "idToken".
# Tokens expire in ~1 hour.

set -e
if [ -n "$ID_TOKEN" ] && [ -n "$1" ] && [ -z "$2" ]; then
  TOKEN="$ID_TOKEN"
  ISBN="$1"
elif [ -n "$1" ] && [ -n "$2" ]; then
  TOKEN="$1"
  ISBN="$2"
else
  TOKEN="${ID_TOKEN:-$1}"
  ISBN="${2:-0393330729}"
fi

if [ -z "$TOKEN" ]; then
  echo "Usage: export ID_TOKEN='<idToken>'; $0 <isbn>" >&2
  echo "   or: $0 '<idToken>' <isbn>" >&2
  exit 1
fi

curl -s -X POST "https://us-central1-library-84eeb.cloudfunctions.net/getBookByIsbn" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"data\":{\"isbn\":\"$ISBN\"}}" | jq .
