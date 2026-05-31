#!/usr/bin/env python3
import json
import re
import sys

TEST_LINE = re.compile(r"^(\s+)(✓|✕|○)\s+(.+?)(?:\s+\(\d+\s*ms\))?\s*$")
DESC_LINE = re.compile(r"^(\s+)(\S[^\n]*?)\s*$")
FILE_LINE = re.compile(r"^(PASS|FAIL)\s+(\S+\.(?:ts|tsx|js|jsx))(?:\s|$)")


def parse(stdout: str, stderr: str) -> dict:
    tests = []
    desc_stack = []
    indent_stack = []
    current_file = None

    text = (stdout or "") + "\n" + (stderr or "")
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line:
            continue

        fm = FILE_LINE.match(line)
        if fm:
            current_file = fm.group(2).split("/")[-1]
            desc_stack = []
            indent_stack = []
            continue

        tm = TEST_LINE.match(line)
        if tm:
            indent = len(tm.group(1))
            sym = tm.group(2)
            name = tm.group(3).strip()
            while indent_stack and indent_stack[-1] >= indent:
                indent_stack.pop()
                desc_stack.pop()
            fq_name = " > ".join(desc_stack + [name]) if desc_stack else name
            if current_file:
                fq_name = f"{current_file}::{fq_name}"
            status = {"✓": "PASSED", "✕": "FAILED", "○": "SKIPPED"}[sym]
            tests.append({"name": fq_name, "status": status})
            continue

        dm = DESC_LINE.match(line)
        if dm:
            indent = len(dm.group(1))
            label = dm.group(2).strip()
            if any(
                label.startswith(s)
                for s in (
                    "at ", "●", "---", "===",
                    "Expected:", "Received:",
                    "Test Suites:", "Tests:", "Snapshots:", "Time:", "Ran all",
                )
            ):
                continue
            while indent_stack and indent_stack[-1] >= indent:
                indent_stack.pop()
                desc_stack.pop()
            desc_stack.append(label)
            indent_stack.append(indent)
            continue

    return {"tests": tests}


if __name__ == "__main__":
    with open(sys.argv[1]) as f:
        stdout = f.read()
    with open(sys.argv[2]) as f:
        stderr = f.read()
    with open(sys.argv[3], "w") as out:
        json.dump(parse(stdout, stderr), out, indent=2)
