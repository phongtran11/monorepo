#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$ROOT_DIR/logs"

mkdir -p "$LOGS_DIR"

PIDS=()

cleanup() {
  echo ""
  echo "Stopping dev processes..."
  for pid in "${PIDS[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid"
    fi
  done
  echo "Delete old logs files"
  rm -rf "$LOGS_DIR"/*.log
  wait
  echo "All processes stopped."
}

trap cleanup EXIT INT TERM

start_service() {
  local name="$1"
  local filter="$2"
  local log_file="$LOGS_DIR/${name}.log"

  echo "Starting $name → $log_file"
  pnpm --filter "$filter" dev >> "$log_file" 2>&1 &
  local pid=$!
  PIDS+=("$pid")
  echo "  PID: $pid"
}

echo "=== Lam Thinh Dev ==="
echo "Logs directory: $LOGS_DIR"
echo ""

start_service "shared"  "@lam-thinh-ecommerce/shared"
start_service "api"     "@lam-thinh-ecommerce/api"
start_service "admin"   "@lam-thinh-ecommerce/admin"

echo ""
echo "All services started. Press Ctrl+C to stop."
echo ""
echo "Tail logs:"
echo "  tail -f $LOGS_DIR/shared.log"
echo "  tail -f $LOGS_DIR/api.log"
echo "  tail -f $LOGS_DIR/admin.log"
echo "  tail -f $LOGS_DIR/*.log"

wait
