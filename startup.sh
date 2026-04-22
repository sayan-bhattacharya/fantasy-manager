#!/bin/bash
set -e
cd /home/site/wwwroot

# Never let a leftover local env file override Azure App Settings
rm -f .env.local .env.test.local

LOCKSUM=$(md5sum package-lock.json | cut -d' ' -f1)
NPM_MARKER="/home/.install_marker"

# ── node_modules ──────────────────────────────────────────────────────────────
# Install directly in wwwroot. OneDeploy zip deploy does not delete files
# absent from the zip, so node_modules persists across deployments.
# Only reinstall when package-lock.json changes.
if [ -L node_modules ]; then
  rm -f node_modules
fi

if [ ! -d node_modules ] || [ ! -f "$NPM_MARKER" ] || [ "$(cat $NPM_MARKER)" != "$LOCKSUM" ]; then
  echo "[startup] Installing node_modules..."
  npm ci
  echo "$LOCKSUM" > "$NPM_MARKER"
  echo "[startup] node_modules ready."
else
  echo "[startup] node_modules up to date, skipping install."
fi

# ── .next build ───────────────────────────────────────────────────────────────
# CI ships a pre-built .next — skip rebuild when BUILD_ID is present.
# Falls back to a full build only on a fresh instance with no .next.
if [ -f .next/BUILD_ID ]; then
  echo "[startup] .next already built ($(cat .next/BUILD_ID)), skipping build."
else
  echo "[startup] Building Next.js app..."
  SQLITE=/tmp/build.db NODE_ENV=production APP_ENV=production NEXT_TELEMETRY_DISABLED=1 \
    ./node_modules/.bin/next build
  echo "[startup] Build complete."
fi

exec npm run start:no-build
