#!/bin/bash
set -e
cd /home/site/wwwroot

LOCKSUM=$(md5sum package-lock.json | cut -d' ' -f1)
NPM_MARKER="/home/.install_marker"

# ── node_modules ──────────────────────────────────────────────────────────────
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
# If a fresh CI build was deployed (.next/BUILD_ID present), skip rebuild.
# Only build locally when .next is absent (e.g. first deploy of a fresh instance).
if [ -f .next/BUILD_ID ]; then
  echo "[startup] .next already built ($(cat .next/BUILD_ID)), skipping build."
else
  echo "[startup] Building Next.js app..."
  SQLITE=/tmp/build.db NODE_ENV=production APP_ENV=production NEXT_TELEMETRY_DISABLED=1 \
    ./node_modules/.bin/next build
  echo "[startup] Build complete."
fi

exec npm run start:no-build
