#!/usr/bin/env bash
set -Eeuo pipefail

ENV_DIR="/etc/testproject"
ENV_FILE="${ENV_DIR}/backend.env"
CREDENTIALS_FILE="${ENV_DIR}/manage-credentials.txt"
PSQL="/www/server/pgsql/bin/psql"
DB_NAME="testproject"
DB_USERNAME="testproject_app"
MANAGE_USERNAME="admin"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run this script as root." >&2
  exit 1
fi

if [[ -e "${ENV_FILE}" ]]; then
  echo "${ENV_FILE} already exists; leaving credentials unchanged."
  exit 0
fi

[[ -x "${PSQL}" ]] || {
  echo "PostgreSQL client not found: ${PSQL}" >&2
  exit 1
}

umask 077
install -d -m 700 "${ENV_DIR}"

db_password="$(openssl rand -hex 24)"
manage_password="$(openssl rand -hex 18)"

role_exists="$(runuser -u postgres -- "${PSQL}" -d postgres -Atqc \
  "SELECT 1 FROM pg_roles WHERE rolname='${DB_USERNAME}'")"

if [[ "${role_exists}" == "1" ]]; then
  runuser -u postgres -- "${PSQL}" -d postgres -v ON_ERROR_STOP=1 \
    -c "ALTER ROLE ${DB_USERNAME} WITH LOGIN PASSWORD '${db_password}'" >/dev/null
else
  runuser -u postgres -- "${PSQL}" -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE ROLE ${DB_USERNAME} WITH LOGIN PASSWORD '${db_password}'" >/dev/null
fi

runuser -u postgres -- "${PSQL}" -d postgres -v ON_ERROR_STOP=1 \
  -c "GRANT CONNECT ON DATABASE ${DB_NAME} TO ${DB_USERNAME}" >/dev/null
runuser -u postgres -- "${PSQL}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 \
  -c "GRANT USAGE, CREATE ON SCHEMA public TO ${DB_USERNAME}" >/dev/null

cat >"${ENV_FILE}" <<EOF
DB_URL=jdbc:postgresql://127.0.0.1:5432/${DB_NAME}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${db_password}
MANAGE_USERNAME=${MANAGE_USERNAME}
MANAGE_PASSWORD=${manage_password}
EOF
chmod 600 "${ENV_FILE}"

cat >"${CREDENTIALS_FILE}" <<EOF
管理地址：http://47.239.74.87:21114/manage/
用户名：${MANAGE_USERNAME}
初始密码：${manage_password}
EOF
chmod 600 "${CREDENTIALS_FILE}"

echo "Server-only database and management credentials created."
echo "Retrieve the management password locally from ${CREDENTIALS_FILE}, then delete that file."
