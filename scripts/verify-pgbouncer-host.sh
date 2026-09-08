#!/usr/bin/env bash
# Verify host-facing DB proxy on :15432 (socat → postgres trust).
# LOCAL DEV ONLY. Run from repo root after: docker compose up -d postgres db-proxy
#
# IMPORTANT: In-container `docker compose exec postgres psql` does NOT prove the
# Windows/host → published port path. This script tests 127.0.0.1:15432 (or
# host.docker.internal:15432) and requires WRONG passwords to still succeed
# (proves trust, not SCRAM).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
PORT=15432

echo "== docker compose ps (db-proxy must own host :${PORT}) =="
docker compose ps
echo

if ! docker compose ps --format '{{.Name}} {{.Ports}}' | grep -q "covenant-db-proxy.*${PORT}"; then
  echo "FAIL: covenant-db-proxy is not publishing host port ${PORT}."
  echo "Recreate: docker compose down -v && docker compose build postgres && docker compose up -d"
  exit 1
fi

if docker compose ps --format '{{.Name}} {{.Ports}}' | grep -qE "covenant-postgres.*(${PORT}|5433)"; then
  echo "FAIL: covenant-postgres is published on the host (old stack)."
  echo "Recreate: docker compose down -v && docker compose up -d"
  exit 1
fi

if docker compose ps --format '{{.Name}} {{.Ports}}' | grep -q 'covenant-pgbouncer'; then
  echo "FAIL: old covenant-pgbouncer container still present."
  echo "Recreate: docker compose down -v && docker compose up -d"
  exit 1
fi

echo "== postgres hba (must be trust) =="
docker compose exec -T postgres cat /etc/postgresql/pg_hba.conf
echo

echo "== host connection tests via published port :${PORT} =="
echo "(password covenant AND a wrong password must BOTH succeed — proves trust)"

run_psql() {
  local pass="$1"
  local label="$2"
  if command -v psql >/dev/null 2>&1; then
    if PGPASSWORD="$pass" psql -h 127.0.0.1 -p "$PORT" -U covenant -d covenant -v ON_ERROR_STOP=1 \
      -c 'SELECT current_user, current_database();' >/tmp/covenant-db-proxy-test.out 2>&1; then
      echo "OK: ${label}"
      cat /tmp/covenant-db-proxy-test.out
      return 0
    fi
    echo "FAIL: ${label}"
    cat /tmp/covenant-db-proxy-test.out
    return 1
  fi

  # No host psql — still exercise the published port via Docker Desktop proxy path.
  if docker run --rm --add-host=host.docker.internal:host-gateway postgres:16-alpine \
    sh -c "PGPASSWORD='$pass' psql -h host.docker.internal -p $PORT -U covenant -d covenant -v ON_ERROR_STOP=1 -c 'SELECT 1 AS published_port_ok;'" \
    >/tmp/covenant-db-proxy-test.out 2>&1; then
    echo "OK: ${label} (via host.docker.internal:${PORT})"
    cat /tmp/covenant-db-proxy-test.out
    return 0
  fi
  echo "FAIL: ${label} (via host.docker.internal:${PORT})"
  cat /tmp/covenant-db-proxy-test.out
  return 1
}

if ! run_psql 'covenant' 'password=covenant'; then
  echo
  echo "Recent db-proxy / postgres logs:"
  docker compose logs db-proxy postgres --tail 30
  echo
  echo "If you are on Windows and this fails while compose looks healthy, check for a"
  echo "native Postgres stealing the port:  netstat -ano | findstr ${PORT}"
  exit 1
fi

if ! run_psql 'definitely-not-the-password' 'password=WRONG (trust must accept)'; then
  echo
  echo "Correct password worked but WRONG password failed → you hit SCRAM/md5 Postgres,"
  echo "not this stack's trust proxy. On Windows, stop native PostgreSQL or anything else"
  echo "bound to :${PORT}. Compose can look fine while localhost goes elsewhere."
  docker compose logs db-proxy postgres --tail 30
  exit 1
fi

if [[ -f server/node_modules/pg/package.json ]]; then
  echo
  echo "== optional true-host Node driver check =="
  node scripts/_verify-host-db.mjs
fi

echo
echo "All checks passed. Desktop pgAdmin: Host 127.0.0.1 Port ${PORT} User/Password/DB covenant SSL Disable."
echo "Do NOT use port 5433 anymore (old pgbouncer / often conflicts with Windows Postgres)."
