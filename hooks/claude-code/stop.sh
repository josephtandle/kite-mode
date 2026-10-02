#!/usr/bin/env bash
# Kite Mode stop hook for Claude Code. Thin wrapper: all logic lives in bin/kite.
# Prints nothing and exits 0 when no kite window is open.
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
KITE="$HERE/../../bin/kite"
if ! command -v node >/dev/null 2>&1; then
  echo "kite-mode: node not found on PATH, hook skipped" >&2
  exit 0
fi
exec node "$KITE" hook stop
