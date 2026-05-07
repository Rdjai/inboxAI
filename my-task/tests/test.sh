#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_DIR="$ROOT_DIR/my-task/.tmp"
mkdir -p "$OUTPUT_DIR"
OUTPUT_FILE="$OUTPUT_DIR/test-output.tap"

set +e
bash "$ROOT_DIR/my-task/tests/run_script.sh" >"$OUTPUT_FILE" 2>&1
STATUS=$?
set -e

python3 "$ROOT_DIR/my-task/tests/parser.py" "$OUTPUT_FILE"
cat "$OUTPUT_FILE"

exit "$STATUS"
