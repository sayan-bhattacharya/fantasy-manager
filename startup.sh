#!/bin/bash
set -e
cd /home/site/wwwroot

LOCKSUM=$(md5sum package-lock.json | cut -d' ' -f1)
NPM_MARKER="/home/.install_marker"
BUILD_MARKER="/home/.next_build_marker"

# ── Install node_modules ──────────────────────────────────────────────────────
# CI deployments ship node_modules in the zip; skip install if present.
# Local deployments do not include node_modules; run npm ci and cache.
if [ -d node_modules ] && [ ! -L node_modules ]; then
  echo "[startup] node_modules present (CI deploy), skipping install."
elif [ ! -f "$NPM_MARKER" ] || [ "$(cat $NPM_MARKER)" != "$LOCKSUM" ]; then
  # Remove any stale symlink from old startup strategy
  rm -f node_modules
  echo "[startup] Installing node_modules..."
  npm ci
  echo "$LOCKSUM" > "$NPM_MARKER"
  echo "[startup] node_modules installed."
else
  echo "[startup] node_modules cached and up-to-date, skipping install."
fi

# ── Build .next ───────────────────────────────────────────────────────────────
# CI deployments ship .next in the zip; skip build if present.
# Local deployments: build and cache in /home/.next_cache (persistent).
if [ -d .next ]; then
  echo "[startup] .next present (CI deploy), skipping build."
elif [ -d /home/.next_cache ] && [ -f "$BUILD_MARKER" ] && [ "$(cat $BUILD_MARKER)" = "$LOCKSUM" ]; then
  echo "[startup] Restoring cached .next build."
  cp -r /home/.next_cache .next
else
  echo "[startup] Building Next.js app (first deploy, ~3 min)..."
  NODE_ENV=production APP_ENV=production NEXT_TELEMETRY_DISABLED=1 \
    ./node_modules/.bin/next build --no-turbopack
  cp -r .next /home/.next_cache
  echo "$LOCKSUM" > "$BUILD_MARKER"
  echo "[startup] Build complete and cached."
fi

exec npm run start:no-build
