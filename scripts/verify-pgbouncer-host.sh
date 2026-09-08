#!/usr/bin/env bash
# Verify host-facing pgbouncer on :5433 is configured and accepting connections.
# LOCAL DEV ONLY. Run from repo root after: docker compose up -d postgres pgbouncer
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== docker compose ps (pgbouncer must own host :5433) =="
docker compose ps
echo

if ! docker compose ps --format '{{.Name}} {{.Ports}}' | grep -q 'covenant-pgbouncer.*5433'; then
  echo "FAIL: covenant-pgbouncer is not publishing host port 5433."
  echo "Recreate: docker compose down -v && docker compose build postgres && docker compose up -d"
  exit 1
fi

if docker compose ps --format '{{.Name}} {{.Ports}}' | grep -q 'covenant-postgres.*5433'; then
  echo "FAIL: covenant-postgres is still published on 5433 (old stack)."
  echo "Recreate: docker compose down -v && docker compose up -d"
  exit 1
fi

echo "== mounted pgbouncer.ini (must have auth_type=any + forced user=) =="
docker compose exec -T pgbouncer cat /etc/pgbouncer/pgbouncer.ini
echo

ini="$(docker compose exec -T pgbouncer cat /etc/pgbouncer/pgbouncer.ini)"
echo "$ini" | grep -q 'auth_type = any' || { echo "FAIL: auth_type is not any"; exit 1; }
echo "$ini" | grep -E 'user=covenant' | grep -q 'password=covenant' \
  || { echo "FAIL: missing forced user=covenant password=covenant in [databases]"; exit 1; }
if echo "$ini" | grep -E '^\s*covenant\s*=' | grep -q 'auth_user=' && \
   ! echo "$ini" | grep -E '^\s*covenant\s*=' | grep -q 'user=covenant'; then
  echo "FAIL: database line uses auth_user= without forced user= (broken with auth_type=any)"
  exit 1
fi

echo "== userlist =="
docker compose exec -T pgbouncer cat /etc/pgbouncer/userlist.txt
echo

echo "== host connection tests (password covenant / any / blank all OK with auth_type=any) =="
if command -v psql >/dev/null 2>&1; then
  for pass in covenant anything ''; do
    if PGPASSWORD="$pass" psql -h 127.0.0.1 -p 5433 -U covenant -d covenant -v ON_ERROR_STOP=1 -c 'SELECT current_user, current_database();' >/tmp/covenant-pgb-test.out 2>&1; then
      echo "OK: password=${pass:-<blank>}"
      cat /tmp/covenant-pgb-test.out
    else
      echo "FAIL: password=${pass:-<blank>}"
      cat /tmp/covenant-pgb-test.out
      echo
      echo "Recent pgbouncer logs:"
      docker compose logs pgbouncer --tail 20
      exit 1
    fi
  done
else
  echo "psql not on PATH — testing via docker network instead"
  docker compose exec -T postgres psql -U covenant -d covenant -c 'SELECT 1 AS postgres_ok;'
  # From another container on the compose network, hit pgbouncer:5432
  docker compose run --rm --entrypoint /bin/sh pgbouncer -c \
    'apk add --no-cache postgresql-client >/dev/null && PGPASSWORD=covenant psql -h pgbouncer -p 5432 -U covenant -d covenant -c "SELECT 1 AS pgbouncer_ok;"'
fi

echo
echo "All checks passed. Desktop pgAdmin: Host 127.0.0.1 Port 5433 User/Password/DB covenant SSL Disable."
