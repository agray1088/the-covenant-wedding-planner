#!/bin/sh
# LOCAL DEV ONLY — Covenant Docker Postgres entrypoint wrapper.
# Writes pg_hba inside the container (avoids flaky Windows bind-mounts of a single
# conf file) and always starts with hba_file + listen_addresses=*.
set -eu

HBA_SRC="/etc/covenant/pg_hba.conf"
HBA_DST="/etc/postgresql/pg_hba.conf"
PGDATA="${PGDATA:-/var/lib/postgresql/data}"

mkdir -p /etc/postgresql

if [ -f "$HBA_SRC" ]; then
  cp "$HBA_SRC" "$HBA_DST"
else
  # Fallback if the mount is missing
  cat > "$HBA_DST" <<'EOF'
# LOCAL DEV ONLY — never use trust in production.
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             0.0.0.0/0               trust
host    all             all             ::/0                    trust
EOF
fi

# Existing volumes may still have scram/md5 rules in PGDATA; keep a copy in sync
# even though we force hba_file below.
if [ -f "$PGDATA/pg_hba.conf" ]; then
  cp "$HBA_DST" "$PGDATA/pg_hba.conf"
fi

exec docker-entrypoint.sh postgres \
  -c "hba_file=${HBA_DST}" \
  -c "listen_addresses=*"
