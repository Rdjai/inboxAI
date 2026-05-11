#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path


def main():
    if len(sys.argv) != 2:
        print("usage: parser.py <tap-output-file>", file=sys.stderr)
        sys.exit(1)

    tap_file = Path(sys.argv[1])
    config_file = Path(__file__).with_name("config.json")

    config = json.loads(config_file.read_text())
    tap_text = tap_file.read_text(errors="replace")

    fail_to_pass_names = config.get("fail_to_pass", [])
    pass_to_pass_names = config.get("pass_to_pass", [])

    passed = set()

    for line in tap_text.splitlines():
        match = re.match(r"^(ok|not ok)\s+\d+\s+-\s+(.+)$", line.strip())
        if not match:
            continue

        status = match.group(1)
        name = re.sub(r"\s+#.*$", "", match.group(2)).strip()
        if status == "ok":
            passed.add(name)

    result = {
        "fail_to_pass": [name for name in fail_to_pass_names if name in passed],
        "pass_to_pass": [name for name in pass_to_pass_names if name in passed]
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
