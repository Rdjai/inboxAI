#!/bin/bash
set -uo pipefail

LOGS_DIR="${LOGS_DIR:-${HARBOR_LOGS_DIR:-/logs/verifier}}"
mkdir -p "$LOGS_DIR" || exit 1
printf '0\n' > "${LOGS_DIR}/reward.txt" || exit 1
printf '{"overall_score": 0.0}\n' > "${LOGS_DIR}/reward.json" || exit 1

cleanup_and_reward() {
    local exit_code=$?
    mkdir -p "$LOGS_DIR" 2>/dev/null || true
    if [ "${exit_code}" -eq 0 ]; then
        printf '1\n' > "${LOGS_DIR}/reward.txt"
        printf '{"overall_score": 1.0}\n' > "${LOGS_DIR}/reward.json"
    else
        printf '0\n' > "${LOGS_DIR}/reward.txt"
        printf '{"overall_score": 0.0}\n' > "${LOGS_DIR}/reward.json"
    fi
    exit "${exit_code}"
}
trap cleanup_and_reward EXIT

if [ -d "/workspace" ]; then
    ROOT_DIR="/workspace"
elif [ -d "/app/inboxAI" ]; then
    ROOT_DIR="/app/inboxAI"
else
    echo "ERROR: cannot find repo root"
    exit 1
fi

python3 -c "
import json, os, shutil, subprocess, tempfile
patch = json.load(open('/tests/config.json')).get('test_patch', '')
test_file = '$ROOT_DIR/my-task/tests/backend_behavior.test.js'
if patch and shutil.which('git') and not os.path.isfile(test_file):
    with tempfile.NamedTemporaryFile(mode='w', suffix='.patch', delete=False) as pf:
        pf.write(patch)
        pf.flush()
        result = subprocess.run(['git', 'apply', '--verbose', pf.name],
                                capture_output=True, text=True, cwd='$ROOT_DIR')
        if result.returncode != 0:
            print('WARNING: test_patch apply failed:', result.stderr)
" 2>&1 || true

STDOUT_LOG=$(mktemp)
STDERR_LOG=$(mktemp)

set +e
bash /tests/run_script.sh > "$STDOUT_LOG" 2> "$STDERR_LOG"
set -e

python3 /tests/parser.py "$STDOUT_LOG" "$STDERR_LOG" /tmp/output.json
cp /tmp/output.json "${LOGS_DIR}/output.json" 2>/dev/null || true
cp "$STDOUT_LOG" "${LOGS_DIR}/run-script-stdout.txt" 2>/dev/null || true
cp "$STDERR_LOG" "${LOGS_DIR}/run-script-stderr.txt" 2>/dev/null || true
cat "$STDOUT_LOG"
cat "$STDERR_LOG"

python3 << 'PYEOF'
import json
import sys

results = json.load(open('/tmp/output.json'))
cfg = json.load(open('/tests/config.json'))
required = set(cfg.get('fail_to_pass', [])) | set(cfg.get('pass_to_pass', []))
passed = {test['name'] for test in results.get('tests', []) if test.get('status') == 'PASSED'}
missing = sorted(required - passed)
print(f'Required : {len(required)}')
print(f'Passed   : {len(passed & required)}')
if missing:
    print(f'RESULT: FAILED\nMissing: {missing}')
    sys.exit(1)
print('RESULT: PASSED')
PYEOF
