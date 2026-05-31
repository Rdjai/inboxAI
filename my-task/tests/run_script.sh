#!/bin/bash
set -e

if [ -d "/workspace" ]; then
    REPO="/workspace"
elif [ -d "/app/inboxAI" ]; then
    REPO="/app/inboxAI"
else
    echo "ERROR: cannot find repo root" >&2
    exit 1
fi

run_tests() {
    cd "$REPO"
    node my-task/tests/backend_behavior.test.js 2>&1
}

if [ $# -eq 0 ]; then
    echo "Running all tests..."
else
    echo "Running selected tests: $*"
fi
run_tests
