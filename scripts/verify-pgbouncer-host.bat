@echo off
REM Windows helper — same checks as scripts/verify-pgbouncer-host.sh
cd /d "%~dp0\.."

echo == docker compose ps (pgbouncer must own host :5433) ==
docker compose ps
echo.

docker compose ps | findstr /C:"covenant-pgbouncer" | findstr /C:"5433" >nul
if errorlevel 1 (
  echo FAIL: covenant-pgbouncer is not publishing host port 5433.
  echo Recreate: docker compose down -v ^&^& docker compose build postgres ^&^& docker compose up -d
  exit /b 1
)

docker compose ps | findstr /C:"covenant-postgres" | findstr /C:"5433" >nul
if not errorlevel 1 (
  echo FAIL: covenant-postgres is still published on 5433 ^(old stack^).
  echo Recreate: docker compose down -v ^&^& docker compose up -d
  exit /b 1
)

echo == mounted pgbouncer.ini ==
docker compose exec -T pgbouncer cat /etc/pgbouncer/pgbouncer.ini
echo.

echo == quick host test via docker ^(password covenant^) ==
docker compose exec -T postgres psql -U covenant -d covenant -c "SELECT 1 AS postgres_ok;"
echo.
echo If desktop pgAdmin still fails, confirm SSL=Disable and Host=127.0.0.1 Port=5433.
echo Password: covenant  ^(any value also works with auth_type=any^)
exit /b 0
