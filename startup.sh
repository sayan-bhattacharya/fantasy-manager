#!/bin/bash
set -e
cd /home/site/wwwroot

LOCKSUM=$(md5sum package-lock.json | cut -d' ' -f1)
NPM_MARKER="/home/.install_marker"

# ── node_modules ──────────────────────────────────────────────────────────────
# Install directly in wwwroot (OneDeploy zip deploy doesn't delete unlisted dirs).
# Only reinstall when package-lock.json changes.
if [ -L node_modules ]; then
  # Remove legacy symlink from an old startup strategy
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
# Always rebuild to pick up source changes. Webpack (~2 min) avoids Turbopack's
# Azure Files CIFS symlink bug. Node_modules are a real dir here so it's fast.
echo "[startup] Building Next.js app..."
rm -rf .next
SQLITE=/tmp/build.db NODE_ENV=production APP_ENV=production NEXT_TELEMETRY_DISABLED=1 \
  ./node_modules/.bin/next build
echo "[startup] Build complete."

exec npm run start:no-build
