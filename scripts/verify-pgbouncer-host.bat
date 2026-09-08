@echo off
REM Windows helper — true host/published-port checks (NOT in-container postgres_ok).
REM Previous bat only ran: docker compose exec postgres psql … which never hits :15432.
cd /d "%~dp0\.."
set PORT=15432

echo == docker compose ps (db-proxy must own host :%PORT%) ==
docker compose ps
echo.

docker compose ps | findstr /C:"covenant-db-proxy" | findstr /C:"%PORT%" >nul
if errorlevel 1 (
  echo FAIL: covenant-db-proxy is not publishing host port %PORT%.
  echo Recreate: docker compose down -v ^&^& docker compose build postgres ^&^& docker compose up -d
  exit /b 1
)

docker compose ps | findstr /C:"covenant-postgres" | findstr /C:"%PORT%" >nul
if not errorlevel 1 (
  echo FAIL: covenant-postgres is published on the host ^(old stack^).
  echo Recreate: docker compose down -v ^&^& docker compose up -d
  exit /b 1
)

docker compose ps | findstr /C:"covenant-pgbouncer" >nul
if not errorlevel 1 (
  echo FAIL: old covenant-pgbouncer still running. Recreate stack:
  echo   docker compose down -v ^&^& docker compose up -d
  exit /b 1
)

echo == postgres hba inside container ^(must contain trust^) ==
docker compose exec -T postgres cat /etc/postgresql/pg_hba.conf
echo.

echo == published-port test via host.docker.internal:%PORT% ^(password covenant^) ==
docker run --rm postgres:16-alpine sh -c "PGPASSWORD=covenant psql -h host.docker.internal -p %PORT% -U covenant -d covenant -v ON_ERROR_STOP=1 -c \"SELECT 1 AS published_port_ok;\""
if errorlevel 1 (
  echo FAIL: could not connect through published port %PORT%.
  echo Check: netstat -ano ^| findstr %PORT%
  echo Recent logs:
  docker compose logs db-proxy postgres --tail 30
  exit /b 1
)
echo.

echo == trust check: WRONG password must also succeed ==
docker run --rm postgres:16-alpine sh -c "PGPASSWORD=definitely-not-the-password psql -h host.docker.internal -p %PORT% -U covenant -d covenant -v ON_ERROR_STOP=1 -c \"SELECT 1 AS trust_ok;\""
if errorlevel 1 (
  echo FAIL: wrong password was rejected — you are NOT hitting this stack's trust proxy.
  echo Common Windows cause: native PostgreSQL bound to the same port.
  echo   netstat -ano ^| findstr %PORT%
  echo   services.msc → stop postgresql*
  docker compose logs db-proxy postgres --tail 30
  exit /b 1
)
echo.

if exist server\node_modules\pg\package.json (
  echo == true host Node/pg driver ^(outside Docker^) ==
  node scripts\_verify-host-db.mjs
  if errorlevel 1 exit /b 1
  echo.
)

echo All checks passed.
echo Desktop pgAdmin: Host 127.0.0.1  Port %PORT%  User/DB/Password covenant  SSL Disable
echo Do NOT use port 5433 ^(old pgbouncer / often conflicts with Windows Postgres^).
exit /b 0
