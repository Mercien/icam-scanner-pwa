# ICAM Scanner PWA — cPanel Deployment Guide

This package is a **cPanel-ready** Next.js standalone build. The compiled
`server.js` is the cPanel Application startup file — it reads `process.env.PORT`
(which Passenger sets) and binds to `0.0.0.0`.

## What's in this package

```
icam-scanner-pwa/
├── server.js             ← cPanel Application startup file (binds to PORT)
├── package.json
├── .next/                ← compiled Next.js app
│   ├── static/          ← JS/CSS chunks (the app code)
│   └── required-server-files.json
├── public/               ← PWA assets
│   ├── manifest.webmanifest
│   ├── sw.js             ← service worker (app-shell cache only)
│   └── icons/            ← PWA icons (svg + 192/512/maskable png)
└── node_modules/         ← runtime deps (sharp stripped — not needed at runtime)
```

## cPanel setup — step by step

### 1. Upload + extract

- cPanel → **File Manager** (or FTP)
- Upload `icam-scanner-pwa.zip` to your home directory
- Right-click → **Extract** → creates `/home/username/icam-scanner-pwa/`

### 2. Create the Node.js app

cPanel → **Software** → **Setup Node.js App** → **Create Application**:

| Field | Value |
|---|---|
| **Node.js version** | 18.x or 20.x (18 minimum) |
| **Application mode** | Production |
| **Application root** | `icam-scanner-pwa` |
| **Application URL** | your subdomain (e.g. `attendance.imaginecinemas.africa`) |
| **Application startup file** | `server.js` |
| **Passenger log file** | (leave default, e.g. `icam.log`) |

### 3. Environment variables

In the same form, under **Environment variables**:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | (leave unset — Passenger assigns it automatically) |

> **About NEXT_PUBLIC_ vars**: the API endpoint
> (`https://imaginecinemas.africa/wp-json/icam/v1`) and mock flag (`false`)
> are **baked into the JS at build time**. You do NOT set them on cPanel —
> they're already in the compiled chunks. To change the API URL you must
> rebuild (see "Repointing" below).

### 4. Start the app

Click **Run NPM Install** (cPanel reads package.json), then **Start App**.
The app now serves at your Application URL.

### 5. Verify

Visit your Application URL over **HTTPS** (required for camera + PWA install):

- You should see the **ICAM Scanner** login screen
- Tap the **`v1.1.0`** badge in the footer → **Version History** sheet opens
- The sheet shows the build date, the API endpoint, and
  "Connected to live WordPress plugin"

If the login screen renders and the version sheet opens, the deploy landed.

## About HTTPS (required for the camera)

The QR camera and PWA install prompt **require HTTPS**. cPanel provides free
AutoSSL — make sure your subdomain has a valid certificate
(cPanel → SSL/TLS Status → Run AutoSSL if needed). The URL bar must show a
padlock before the camera will start.

## Troubleshooting on cPanel

**"Application error" / 502 on load**
- Check the Passenger log file (the path you set in the form)
- Confirm Application root is `icam-scanner-pwa` (folder name only — no
  `/home/username/` prefix)
- Confirm the startup file is `server.js` (NOT `app.js`)
- Confirm Node.js version is 18+ (lower versions fail silently)

**Camera doesn't open**
- You must be on HTTPS (the browser blocks camera on HTTP)
- Check the URL bar shows a padlock (valid cert)

**Login fails with a network error**
- The PWA calls `https://imaginecinemas.africa/wp-json/icam/v1/auth/login`
- Verify WordPress is up and the ICAM plugin is active
- CORS is handled by WordPress core (echoes the origin) — no proxy needed

**`sharp` native-module errors**
- This package has `sharp` stripped from `node_modules/` (only needed at
  build time for icon generation, not at runtime). If your host still
  complains, delete `node_modules/sharp` and `node_modules/@img` entirely.

## Using this package on a non-cPanel host (VPS, Render, Railway)

If you're NOT on cPanel, just run the server directly:

```bash
unzip icam-scanner-pwa.zip
cd icam-scanner-pwa
PORT=3000 node server.js
```

Then put it behind an HTTPS reverse proxy (nginx/Caddy) or use the host's
TLS terminator.

## Repointing at a different WordPress site

The API URL is baked at build time. To repoint, rebuild the source with new
env vars, then re-upload the rebuilt `.next/` and `public/`:

```bash
NEXT_PUBLIC_ICAM_API_BASE_URL=https://other-site.com/wp-json/icam/v1 \
NEXT_PUBLIC_ICAM_USE_MOCK_API=false \
bun run build
```
