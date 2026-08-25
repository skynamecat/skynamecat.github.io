#!/usr/bin/env bash
set -Eeuo pipefail

PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-http://127.0.0.1:21114}"

check() {
  local name="$1"
  local url="$2"
  printf '%-20s' "${name}"
  curl --fail --silent --show-error --location \
    --output /dev/null --write-out '%{http_code}\n' "${url}"
}

check "Spring health" "http://127.0.0.1:8080/actuator/health"
check "Static homepage" "${PUBLIC_ORIGIN}/"
check "Management page" "${PUBLIC_ORIGIN}/manage/"

echo "API route (a POST endpoint) is intentionally not invoked by this smoke test."
