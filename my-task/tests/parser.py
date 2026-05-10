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

    ftp_names = config.get("fail_to_pass", [])
    ptp_names = config.get("pass_to_pass", [])

    passed = set()
    failed = set()

    for line in tap_text.splitlines():
        line = line.strip()
        m = re.match(r"^(ok|not ok)\s+\d+\s+-\s+(.+)$", line)
        if not m:
            continue
        status = m.group(1)
        name = re.sub(r"\s+#.*$", "", m.group(2)).strip()
        if status == "ok":
            passed.add(name)
        else:
            failed.add(name)

    result = {
        "fail_to_pass": [n for n in ftp_names if n in passed],
        "pass_to_pass": [n for n in ptp_names if n in passed],
    }

    print(json.dumps(result, indent=2))

    all_required = set(ftp_names) | set(ptp_names)
    missing = all_required - passed
    if missing:
        for name in sorted(missing):
            print("MISSING: " + name, file=sys.stderr)
        sys.exit(1)

    sys.exit(0)

if __name__ == "__main__":
    main()
