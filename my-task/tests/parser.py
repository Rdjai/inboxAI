#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        raise SystemExit("usage: parser.py <tap-output-file>")

    output_path = Path(sys.argv[1])
    config_path = Path(__file__).with_name("config.json")

    config = json.loads(config_path.read_text(encoding="utf-8"))
    output = output_path.read_text(encoding="utf-8", errors="replace")

    statuses = {}
    for line in output.splitlines():
        match = re.match(r"^(ok|not ok)\s+\d+\s+-\s+(.*)$", line.strip())
        if match:
            statuses[match.group(2)] = match.group(1) == "ok"

    parsed = {
        "fail_to_pass": [
            name for name in config["fail_to_pass"] if statuses.get(name) is True
        ],
        "pass_to_pass": [
            name for name in config["pass_to_pass"] if statuses.get(name) is True
        ]
    }

    print(json.dumps(parsed, indent=2, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
