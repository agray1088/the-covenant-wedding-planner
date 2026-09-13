# Covenant Planner — Reconnect after restart

Printable checklist for Windows after a laptop restart (Docker + planner + cloud sync + pgAdmin).

**Host sync API port is `18787` (not `8787`).**

---

## 1. Start Docker Desktop

Start Docker Desktop and wait until it shows **Running**.

## 2. Open PowerShell in the repo

```powershell
cd C:\Users\arian\the-covenant-wedding-planner
git checkout cursor/offline-cloud-sync-017e
git pull origin cursor/offline-cloud-sync-017e
```

## 3. Start the stack

```powershell
docker compose down
docker compose up -d
```

## 4. Confirm sync-api is up

```powershell
docker compose ps
```

Host API port is **18787** (not 8787). Confirm the sync/api service is healthy/up.

## 5. Start planner on :8000 (if needed)

```powershell
npx --yes serve -l 8000
```

Open: http://localhost:8000/

## 6. Browser console — enable cloud sync

Open DevTools → Console, paste:

```js
localStorage.setItem('covenant_cloud_api', 'http://localhost:18787');
localStorage.setItem('covenant_cloud_enabled', '1');
location.reload();
```

## 7. Settings → Cloud sync (beta)

In the planner UI, open **Settings → Cloud sync (beta)** and confirm it is connected.

## 8. Demo login

- Email: `demo@covenant.local`
- Password: `covenant-demo`

## 9. pgAdmin (browser)

URL: http://localhost:5050/browser/

- Email: `admin@covenant.dev`
- Password: `covenant`

## 10. Desktop pgAdmin (database connection)

| Field    | Value        |
|----------|--------------|
| Host     | 127.0.0.1    |
| Port     | 15432        |
| Database | covenant     |
| Username | covenant     |
| Password | covenant     |
| SSL mode | Disable      |

---

## Troubleshooting: port 8787 forbidden

If an error mentions `8787` bind / access permissions:

1. Confirm `docker-compose.yml` maps **18787 → 8787**:

   ```powershell
   findstr 18787 docker-compose.yml
   ```

   Expect something like: `"18787:8787"`

2. Pull the latest branch again:

   ```powershell
   git pull origin cursor/offline-cloud-sync-017e
   ```

3. Do **not** use an old Docker Desktop Compose profile still mapping host **8787**.

4. Update localStorage if it still points at 8787:

   ```js
   localStorage.setItem('covenant_cloud_api', 'http://localhost:18787');
   location.reload();
   ```

---

*Covenant Wedding Planner — reconnect sheet. Keep this PDF with your laptop notes.*
