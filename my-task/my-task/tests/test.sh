#!/bin/sh

ROOT_DIR="/workspace"
OUTPUT_DIR="$ROOT_DIR/my-task/.tmp"
OUTPUT_FILE="$OUTPUT_DIR/test-output.tap"
REWARD_FILE="/logs/verifier/reward.txt"

mkdir -p "$OUTPUT_DIR"
mkdir -p /logs/verifier

sh "$ROOT_DIR/my-task/tests/run_script.sh" >"$OUTPUT_FILE" 2>&1 || true
cat "$OUTPUT_FILE"

PARSER_OUT=$(python3 "$ROOT_DIR/my-task/tests/parser.py" "$OUTPUT_FILE")
printf '%s\n' "$PARSER_OUT"

PASSED_COUNT=$(printf '%s\n' "$PARSER_OUT" | python3 -c "import json,sys; data=json.load(sys.stdin); print(len(data.get('fail_to_pass', [])) + len(data.get('pass_to_pass', [])))")
EXPECTED_COUNT=$(python3 -c "import json; data=json.load(open('$ROOT_DIR/my-task/tests/config.json')); print(len(data.get('fail_to_pass', [])) + len(data.get('pass_to_pass', [])))")

if [ "$PASSED_COUNT" -eq "$EXPECTED_COUNT" ] && [ "$EXPECTED_COUNT" -gt 0 ]; then
    echo 1 > "$REWARD_FILE"
    exit 0
fi

echo 0 > "$REWARD_FILE"
exit 1
