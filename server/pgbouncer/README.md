# Deprecated — host path is now `db-proxy` (socat) on :15432

Pgbouncer `auth_type=any` was previously used to avoid SCRAM across the Windows
Docker Desktop port proxy. Desktop clients still failed with
`password authentication failed` while `scripts/verify-pgbouncer-host.bat`
printed `postgres_ok = 1` — that bat only ran `docker compose exec postgres psql`
and never exercised host → published port.

Current stack: `covenant-db-proxy` (alpine/socat) TCP-forwards :15432 →
`postgres:5432` with baked `pg_hba` trust. No client SCRAM; port 15432 avoids
native Windows Postgres on 5432/5433.

These files are kept only as historical reference and are not mounted.
