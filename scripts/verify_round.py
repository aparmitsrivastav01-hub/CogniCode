#!/usr/bin/env python3
"""Prove the cart round fails before its declared fix and passes after it."""

from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ROUND_DIR = ROOT / "rounds" / "ecommerce-cart-bug"
FILES_DIR = ROUND_DIR / "files"
ROUND_JSON = ROUND_DIR / "round.json"
BUG_COMPARISON = re.compile(r"item\.product_id\s*==\s*product_id")


def report(label: str, passed: bool, detail: str) -> bool:
    print(f"[{'PASS' if passed else 'FAIL'}] {label}: {detail}")
    return passed


def run(command: list[str], cwd: Path) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, cwd=cwd, text=True, capture_output=True, check=False)


def test_summary(result: subprocess.CompletedProcess[str]) -> str:
    return (result.stdout + result.stderr).strip()


def main() -> int:
    try:
        metadata = json.loads(ROUND_JSON.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        report("Load round metadata", False, str(error))
        return 1

    checks: list[bool] = []
    bug = metadata["bug"]
    bug_path = FILES_DIR / bug["file"]
    try:
        bug_lines = bug_path.read_text(encoding="utf-8").splitlines()
        bug_line = bug_lines[bug["line"] - 1]
        bug_ok = bool(BUG_COMPARISON.search(bug_line))
        checks.append(report(
            "Bug answer points to faulty comparison",
            bug_ok,
            f"{bug['file']}:{bug['line']} contains {bug_line.strip()!r}",
        ))
    except (OSError, IndexError, TypeError) as error:
        checks.append(report("Bug answer points to faulty comparison", False, str(error)))
        bug_ok = False

    original_tests = run(
        [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "test_cart.py", "-v"],
        FILES_DIR,
    )
    original_summary = test_summary(original_tests)
    original_failures = re.search(r"FAILED \(failures=(\d+)(?:, errors=(\d+))?\)", original_summary)
    original_expected = (
        original_tests.returncode != 0
        and original_failures is not None
        and int(original_failures.group(1)) == 2
        and int(original_failures.group(2) or 0) == 0
    )
    checks.append(report(
        "Original unittest suite exposes the bug",
        original_expected,
        original_summary.splitlines()[-1] if original_summary else f"exit {original_tests.returncode}",
    ))

    fix = metadata["fix"]
    with tempfile.TemporaryDirectory(prefix="cognicode-round-fixed-") as temporary:
        fixed_dir = Path(temporary) / "files"
        shutil.copytree(FILES_DIR, fixed_dir)
        fixed_file = fixed_dir / fix["file"]
        fixed_lines = fixed_file.read_text(encoding="utf-8").splitlines(keepends=True)
        fix_index = fix["line"] - 1
        fix_applied = False
        if 0 <= fix_index < len(fixed_lines) and BUG_COMPARISON.search(fixed_lines[fix_index]):
            old_ending = "\n" if fixed_lines[fix_index].endswith("\n") else ""
            fixed_lines[fix_index] = fix["newText"] + old_ending
            fixed_file.write_text("".join(fixed_lines), encoding="utf-8")
            fix_applied = True
        checks.append(report(
            "Apply declared fix in temporary copy",
            fix_applied,
            f"{fix['file']}:{fix['line']} -> {fix['newText'].strip()}",
        ))

        fixed_tests = run(
            [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "test_cart.py", "-v"],
            fixed_dir,
        )
        fixed_summary = test_summary(fixed_tests)
        fixed_run = re.search(r"Ran (\d+) tests?", fixed_summary)
        all_passed = fixed_tests.returncode == 0 and fixed_run is not None and int(fixed_run.group(1)) == 5
        checks.append(report(
            "Fixed unittest suite passes",
            all_passed,
            fixed_summary.splitlines()[-1] if fixed_summary else f"exit {fixed_tests.returncode}",
        ))

    demo = run([sys.executable, "-m", "app.main"], FILES_DIR)
    demo_output = demo.stdout.strip()
    demo_ok = demo.returncode == 0 and bool(demo_output)
    demo_detail = repr(demo_output) if demo_ok else test_summary(demo) or f"exit {demo.returncode}"
    checks.append(report("Real buggy demo output", demo_ok, demo_detail))

    passed = all(checks)
    print(f"\n{'PASS' if passed else 'FAIL'}: round verification {'passed' if passed else 'failed'}.")
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
