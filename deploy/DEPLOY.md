# Deploying the marketing site + Eurail workspace to the VPS

Same model as the legacy frontend — GitHub Actions builds and rsyncs over SSH — plus one small
always-on Node service (the **Eurail API sidecar**) for `/eurail/api/*` (the email gate, the
grounded chat, the per-user history). The static site cannot host those; the sidecar runs the
exact same handler code the dev server mounts locally (`apps/marketing/server/eurail-api.mjs`).

```
GitHub (push to dev)
  └─ build → rsync ──► /var/www/oraclous-marketing/      (static site, served by nginx)
            rsync ──► /opt/oraclous-eurail/app/          (sidecar code + corpus, --delete)
            ssh   ──► systemctl restart oraclous-eurail
VPS
  nginx: root /var/www/oraclous-marketing
         location /eurail/api/ → proxy 127.0.0.1:8787 (buffering off)
  systemd: oraclous-eurail → node /opt/oraclous-eurail/app/server/index.mjs
  /opt/oraclous-eurail/.env            ← secrets, by hand, once (outside the rsync)
  /opt/oraclous-eurail/.eurail-sessions/ ← chat history (outside the rsync)
```

## One-time server setup (as root or with sudo)

1. **Node 22** on the VPS: `node -v` → v22.x (NodeSource or nvm).

2. **Directories** (use your deploy user instead of `deploy` if different):

   ```sh
   sudo mkdir -p /var/www/oraclous-marketing /opt/oraclous-eurail/app /opt/oraclous-eurail/.eurail-sessions
   sudo chown -R deploy:deploy /var/www/oraclous-marketing /opt/oraclous-eurail
   ```

3. **Secrets** — create `/opt/oraclous-eurail/.env` (mode 600, owner `deploy`):

   ```ini
   EURAIL_ONBOARDER_API_KEY=<your OpenRouter key>
   EURAIL_AUTH_SECRET=<64 hex chars, e.g. `openssl rand -hex 32`>
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=support@oraclous.com
   SMTP_PASSWORD=<gmail app password>
   SMTP_FROM=support@oraclous.com
   # EURAIL_COOKIE_SECURE=1   (default — leave on behind HTTPS)
   ```

4. **systemd**: copy `deploy/oraclous-eurail.service` to `/etc/systemd/system/`, adjust
   `User=/Group=`, then `sudo systemctl daemon-reload && sudo systemctl enable --now oraclous-eurail`.
   (It will log "listening on http://127.0.0.1:8787" once the first deploy has populated `app/`.)

5. **Passwordless restart** for the deploy user (the workflow's last step):

   ```
   # /etc/sudoers.d/oraclous-eurail   (chmod 440)
   deploy ALL=(root) NOPASSWD: /bin/systemctl restart oraclous-eurail, /bin/systemctl --no-pager --lines=5 status oraclous-eurail
   ```

6. **nginx**: see `deploy/nginx-oraclous-marketing.conf`. If the domain's server block already
   exists (certbot SSL etc.), just point `root` at `/var/www/oraclous-marketing` and add the
   `location /eurail/api/` proxy block. Then `nginx -t && sudo systemctl reload nginx`.

7. **GitHub repo secrets** (Settings → Secrets and variables → Actions — same names as the
   legacy repo): `HOST`, `USERNAME`, `SSH_PRIVATE_KEY`, optional `SSH_PORT`.

## Cut-over from the legacy app (keep it as rollback)

1. Disable the legacy repo's deploy workflow first (it rsyncs into `/var/www/oraclous-frontend/`).
2. Leave `/var/www/oraclous-frontend/` in place — switching back is one `root` line in nginx.
3. After this site is live and healthy for a few days, delete the old directory at leisure.

## Deploying

Push to `dev` (or run the workflow manually). Verify after the first deploy:

```sh
curl -s https://<domain>/eurail/api/auth/me        # → {"error":"unauthorized"} (the service is up)
curl -s http://127.0.0.1:8787/healthz               # on the VPS → ok
journalctl -u oraclous-eurail -n 50                 # service logs
```

Then load `/eurail` in a browser: request a code (it emails from `support@oraclous.com`),
verify, chat. Sessions land in `/opt/oraclous-eurail/.eurail-sessions/<user-hash>/`.

## Notes

- The session cookie ships with `Secure` in prod (`EURAIL_COOKIE_SECURE=1` default); the gate
  therefore only works over HTTPS — keep certbot active.
- `EURAIL_AUTH_SECRET` must be stable or every visitor is logged out on each restart.
- The allow-list currently admits `@eurail.com` plus the admin test address (see
  `ADMIN_TEST_EMAILS` in `apps/marketing/server/eurail-api.mjs`) — remove the test address
  before handing the link to Eurail.
- Codes are not logged in prod (only when no email service is configured, or
  `EURAIL_LOG_CODES=1`).
