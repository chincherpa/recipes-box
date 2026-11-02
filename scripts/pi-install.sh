#!/usr/bin/env bash
# Läuft auf dem Pi. Aufruf: pi-install.sh <src.tgz> <data.tgz|none> <build.tgz|none>
set -euo pipefail

SRC="$1"; DATA="${2:-none}"; BUILD="${3:-none}"
APP_DIR="${APP_DIR:-$HOME/recipes-box}"
APP_DIR="${APP_DIR/#\~/$HOME}"
PORT="${APP_PORT:-3000}"
NAME="recipes-box"

command -v node >/dev/null || { echo "node fehlt auf dem Pi (z.B. via nodesource installieren)"; exit 1; }

# pnpm: vorhandenes nehmen, sonst über corepack
if command -v pnpm >/dev/null && pnpm --version >/dev/null 2>&1; then
  PNPM="pnpm"
else
  command -v corepack >/dev/null || { echo "pnpm/corepack fehlt"; exit 1; }
  sudo corepack enable 2>/dev/null || true
  PNPM="corepack pnpm"
fi

# pm2 bei Bedarf (neu) installieren; auch wenn ein kaputter Shim (z.B. pnpm global) im PATH liegt
if ! pm2 --version >/dev/null 2>&1; then
  echo "==> Installiere pm2"
  # Kaputten pnpm-global-Shim entfernen, sonst verdeckt er die npm-Installation
  if command -v pm2 >/dev/null; then
    $PNPM remove -g pm2 >/dev/null 2>&1 || true
    rm -f "$(command -v pm2)" 2>/dev/null || true
  fi
  sudo npm install -g pm2
  hash -r
  pm2 --version >/dev/null 2>&1 || { echo "pm2 nach Installation nicht lauffähig"; exit 1; }
fi

mkdir -p "$APP_DIR"
echo "==> Entpacke Quellen nach $APP_DIR"
tar -xzf "$SRC" -C "$APP_DIR"

if [ "$DATA" != "none" ] && [ -f "$DATA" ]; then
  if [ -e "$APP_DIR/recipes.db" ]; then
    echo "==> recipes.db existiert bereits auf dem Pi, wird nicht überschrieben"
  else
    echo "==> Entpacke Datenbank"
    tar -xzf "$DATA" -C "$APP_DIR"
  fi
fi

cd "$APP_DIR/website"
# Install nur, wenn sich Abhängigkeiten geändert haben (schont den Pi: RAM/IO/Strom)
HASH_FILE="node_modules/.deps-hash"
DEPS_HASH="$(cat package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc 2>/dev/null | sha256sum | cut -d' ' -f1)"
has_binding() { find node_modules/.pnpm -path '*better-sqlite3*' -name 'better_sqlite3.node' 2>/dev/null | grep -q .; }

if [ -f "$HASH_FILE" ] && [ "$(cat "$HASH_FILE")" = "$DEPS_HASH" ] && [ -d node_modules/.bin ]; then
  echo "==> Abhängigkeiten unverändert, überspringe Install"
  if ! has_binding; then
    echo "==> Natives Binding fehlt, baue better-sqlite3"
    $PNPM rebuild better-sqlite3
  fi
else
  echo "==> Installiere Abhängigkeiten"
  # Niedrige Parallelität, damit der Pi nicht abstürzt
  PNPM_OPTS="--frozen-lockfile --network-concurrency=4 --child-concurrency=1"
  if ! $PNPM install $PNPM_OPTS; then
    # Beschädigter/abgebrochener Store (EIO, Bus error) -> frisch neu versuchen
    echo "==> Install fehlgeschlagen, räume Store + node_modules auf und versuche es erneut"
    rm -rf node_modules "$($PNPM store path)"
    $PNPM install $PNPM_OPTS
  fi
  # better-sqlite3 braucht sein natives Binding
  $PNPM rebuild better-sqlite3
  echo "$DEPS_HASH" > "$HASH_FILE"
fi

if [ "$BUILD" != "none" ] && [ -f "$BUILD" ]; then
  echo "==> Entpacke Build"
  rm -rf .next
  mkdir .next
  tar -xzf "$BUILD" -C .next
else
  echo "==> Baue auf dem Pi"
  $PNPM build
fi

echo "==> Starte in pm2 auf Port $PORT"
pm2 delete "$NAME" >/dev/null 2>&1 || true
pm2 start "$PNPM" --name "$NAME" --cwd "$APP_DIR/website" -- start -p "$PORT"
pm2 save
pm2 startup >/dev/null 2>&1 || true

rm -f "$SRC" "$DATA" "$BUILD"
echo "==> Fertig: http://$(hostname).local:$PORT"
