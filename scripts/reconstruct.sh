#!/usr/bin/env bash
set -euo pipefail
TASK_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
CHECKPOINT=$(git -C "$TASK_ROOT" rev-parse HEAD)
RECON_ROOT=$(mktemp -d /tmp/netscape-reconstruction.XXXXXX)
LOG="$TASK_ROOT/artifacts/reports/reconstruction-$CHECKPOINT.txt"
mkdir -p "$TASK_ROOT/artifacts/reports"
{
  echo "Checkpoint: $CHECKPOINT"
  echo "Clean export: $RECON_ROOT"
  git -C "$TASK_ROOT" archive "$CHECKPOINT" | tar -xf - -C "$RECON_ROOT"
  cd "$RECON_ROOT"
  node --version
  npm --version
  npm ci
  npm test
  npm run typecheck
  npm run build
  echo "COLD_RECONSTRUCTION_PASS $CHECKPOINT"
} 2>&1 | tee "$LOG"
echo "$RECON_ROOT" > "$TASK_ROOT/artifacts/reports/reconstruction-path.txt"
