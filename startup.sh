#!/bin/bash
set -e
cd /home/site/wwwroot

NPM_HOME=/home/npm
mkdir -p "$NPM_HOME"

LOCKSUM=$(md5sum package-lock.json | cut -d' ' -f1)
NPM_MARKER="$NPM_HOME/.install_marker"

# ── node_modules ──────────────────────────────────────────────────────────────
# Install to /home/npm (persistent across deploys, not touched by OneDeploy).
# Symlink into wwwroot so Next.js and npm scripts find them normally.
if [ -e node_modules ] && [ ! -L node_modules ]; then
  # Remove old real directory (from a previous deployment strategy)
  rm -rf node_modules
fi

if [ ! -d "$NPM_HOME/node_modules" ] || [ ! -f "$NPM_MARKER" ] || [ "$(cat $NPM_MARKER)" != "$LOCKSUM" ]; then
  echo "[startup] Installing node_modules to $NPM_HOME..."
  cp package.json package-lock.json "$NPM_HOME/"
  npm ci --prefix "$NPM_HOME"
  echo "$LOCKSUM" > "$NPM_MARKER"
  echo "[startup] node_modules ready."
else
  echo "[startup] node_modules up to date, skipping install."
fi

ln -sfn "$NPM_HOME/node_modules" node_modules

# ── .next build ───────────────────────────────────────────────────────────────
# CI ships a pre-built .next — skip build when BUILD_ID is present.
# Falls back to a full build on first deploy of a fresh instance.
if [ -f .next/BUILD_ID ]; then
  echo "[startup] .next already built ($(cat .next/BUILD_ID)), skipping build."
else
  echo "[startup] Building Next.js app..."
  SQLITE=/tmp/build.db NODE_ENV=production APP_ENV=production NEXT_TELEMETRY_DISABLED=1 \
    ./node_modules/.bin/next build
  echo "[startup] Build complete."
fi

exec npm run start:no-build
