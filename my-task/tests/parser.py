#!/usr/bin/env python3
"""Parse node:test TAP output into Harbor's verifier format."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

_TAP_LINE = re.compile(r"^(ok|not ok)\s+\d+\s+-\s+(.+)$")
_STATUS_MAP = {"ok": "PASSED", "not ok": "FAILED"}


def parse(stdout: str, stderr: str) -> dict:
    tests: list[dict[str, str]] = []
    for raw in (stdout + "\n" + stderr).splitlines():
        match = _TAP_LINE.match(raw.strip())
        if match:
            tests.append({
                "name": match.group(2).strip(),
                "status": _STATUS_MAP[match.group(1)]
            })
    return {"tests": tests}


if __name__ == "__main__":
    if len(sys.argv) != 4:
        raise SystemExit("usage: parser.py <stdout_file> <stderr_file> <output_json>")
    stdout = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")
    stderr = Path(sys.argv[2]).read_text(encoding="utf-8", errors="replace")
    Path(sys.argv[3]).write_text(json.dumps(parse(stdout, stderr), indent=2), encoding="utf-8")
