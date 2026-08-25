#!/usr/bin/env bash
set -Eeuo pipefail

PROJECT_ROOT="${PROJECT_ROOT:-/opt/testproject}"
BACKEND_DIR="${PROJECT_ROOT}/backend"
ENV_FILE="/etc/testproject/backend.env"
HEALTH_URL="http://127.0.0.1:8080/actuator/health"

if [[ ! -d "${BACKEND_DIR}" ]]; then
  echo "Backend directory does not exist: ${BACKEND_DIR}" >&2
  exit 1
fi

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}. Create it from deploy/backend.env.example first." >&2
  exit 1
fi

if [[ "$(stat -c '%a' "${ENV_FILE}")" != "600" ]]; then
  echo "Refusing to continue: ${ENV_FILE} must have mode 600." >&2
  exit 1
fi

for required_key in DB_URL DB_USERNAME DB_PASSWORD MANAGE_USERNAME MANAGE_PASSWORD; do
  if ! grep -Eq "^${required_key}=.+" "${ENV_FILE}"; then
    echo "Missing required value ${required_key} in ${ENV_FILE}." >&2
    exit 1
  fi
done

if grep -Eq '(^|=)(replace-with-|change-me)' "${ENV_FILE}"; then
  echo "Refusing to deploy with placeholder secrets in ${ENV_FILE}." >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || {
  echo "Docker is not installed or is not on PATH." >&2
  exit 1
}
docker compose version >/dev/null

cd "${BACKEND_DIR}"
docker compose build --pull
docker compose up --detach --remove-orphans

for attempt in {1..30}; do
  if curl --fail --silent "${HEALTH_URL}" >/dev/null; then
    echo "Backend is healthy: ${HEALTH_URL}"
    docker compose ps
    exit 0
  fi
  sleep 2
done

echo "Backend did not become healthy. Recent logs:" >&2
docker compose logs --tail=120 backend >&2
exit 1
