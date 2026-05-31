#!/bin/bash
set -e

run_selected_tests() {
    local test_files=("$@")
    echo "Running selected tests: ${test_files[*]}"
    cd /app/inboxAI/server
    node_modules/.bin/jest --verbose --silent --maxWorkers=1 --forceExit "${test_files[@]}" 2>&1 || true
}

run_all_tests() {
    echo "Running all tests..."
    cd /app/inboxAI/server
    node_modules/.bin/jest --verbose --silent --maxWorkers=1 --forceExit 2>&1 || true
}

if [ $# -eq 0 ]; then
    run_all_tests
    exit 0
fi

# Handle comma-separated input
if [[ "$1" == *","* ]]; then
    IFS=',' read -r -a TEST_FILES <<< "$1"
else
    TEST_FILES=("$@")
fi

run_selected_tests "${TEST_FILES[@]}"
