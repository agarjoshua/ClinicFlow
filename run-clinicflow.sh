#!/usr/bin/env bash
set -euo pipefail

# run-clinicflow.sh - convenience runner for ZahaniFlow development and build
# Usage:
#   ./run-clinicflow.sh dev    # start frontend (client) and Tauri dev (native window)
#   ./run-clinicflow.sh build  # build frontend and produce native packages via Tauri
#   ./run-clinicflow.sh help   # show this message

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLIENT_DIR="$ROOT_DIR/client"
TAURI_DIR="$ROOT_DIR/zahaniflow/src-tauri"

SNAP_UNSET_VARS=(SNAP SNAP_NAME SNAP_DATA SNAP_COMMON SNAP_REVISION)

function unset_snap_vars() {
  for v in "${SNAP_UNSET_VARS[@]}"; do
    unset "$v" || true
  done
}

function wait_for_url() {
  local url="$1"
  local timeout=${2:-30}
  local start
  start=$(date +%s)
  echo "Waiting for $url to respond (timeout ${timeout}s) ..."
  while true; do
    if curl -sSf --max-time 2 "$url" >/dev/null 2>&1; then
      echo "$url is up"
      return 0
    fi
    now=$(date +%s)
    if (( now - start >= timeout )); then
      echo "Timed out waiting for $url" >&2
      return 1
    fi
    sleep 1
  done
}

function dev() {
  echo "Starting ZahaniFlow frontend (client)"
  pushd "$CLIENT_DIR" >/dev/null
  # start frontend in background
  npm run dev &
  FRONTEND_PID=$!
  popd >/dev/null

  trap 'echo "Stopping frontend..."; kill "$FRONTEND_PID" 2>/dev/null || true; exit' INT TERM

  # wait for Vite dev server
  wait_for_url "http://localhost:5173" 60

  echo "Starting Tauri dev (native) — will unset snap env and preload system libc"
  # launch tauri dev with SNAP-vars unset and LD_PRELOAD set to system libc
  (
    unset_snap_vars
    export LD_PRELOAD=/lib/x86_64-linux-gnu/libc.so.6
    export TAURI_DIR="$TAURI_DIR"
    npx tauri dev
  )

  # when tauri exits, cleanup frontend
  echo "Tauri exited. Stopping frontend (PID $FRONTEND_PID)"
  kill "$FRONTEND_PID" 2>/dev/null || true
}

function build() {
  echo "Building frontend (client)"
  pushd "$CLIENT_DIR" >/dev/null
  npm run build
  popd >/dev/null

  echo "Running Tauri build to produce native packages"
  pushd "$ROOT_DIR/zahaniflow" >/dev/null
  # It's safe to set TAURI_DIR; LD_PRELOAD is not necessary for build
  export TAURI_DIR=./src-tauri
  npx tauri build
  popd >/dev/null
}

function help_msg() {
  sed -n '1,160p' "$0" | sed -n '1,40p'
  echo
  cat <<'EOF'

Examples:
  # Development: open frontend in browser + native window (run this from plain terminal)
  ./run-clinicflow.sh dev

  # Build production native packages
  ./run-clinicflow.sh build
EOF
}

if [[ ${1:-} == "dev" ]]; then
  dev
elif [[ ${1:-} == "build" ]]; then
  build
else
  help_msg
fi
