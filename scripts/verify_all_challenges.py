#!/usr/bin/env python3
"""
Direct verification suite for all 7 CogniCode debugging challenges.
Runs both buggy and fixed trees using Python 3 unittest and main.py execution.
"""

import os
import re
import sys
import tempfile
import shutil
import subprocess

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def run_cmd(cmd, cwd):
    env = {**os.environ, "PYTHONPATH": cwd}
    proc = subprocess.run(cmd, cwd=cwd, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return proc.returncode, proc.stdout, proc.stderr

def extract_ts_challenge(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract all const <name> = `...`;
    # Handle escaped backticks or raw content
    var_map = {}
    pattern = re.compile(r"const\s+(\w+)\s*=\s*`([\s\S]*?)`;")
    for match in pattern.finditer(content):
        var_map[match.group(1)] = match.group(2)

    # Extract bug file & line
    bug_match = re.search(r"bug:\s*\{\s*file:\s*['\"]([^'\"]+)['\"],\s*line:\s*(\d+)", content)
    assert bug_match, f"Could not find bug metadata in {filepath}"
    bug_file = bug_match.group(1)
    bug_line = int(bug_match.group(2))

    # Extract fixedFile path and content var
    fixed_match = re.search(r"fixedFile:\s*\{\s*path:\s*['\"]([^'\"]+)['\"],\s*content:\s*(\w+)", content)
    assert fixed_match, f"Could not find fixedFile in {filepath}"
    fixed_path = fixed_match.group(1)
    fixed_var = fixed_match.group(2)
    fixed_content = var_map[fixed_var]

    # Extract files array: { path: 'app/clock.py', language: 'python', content: clockPy }
    files_match = re.search(r"files:\s*\[([\s\S]*?)\]\s*,", content)
    assert files_match, f"Could not find files array in {filepath}"
    file_items = re.findall(r"\{\s*path:\s*['\"]([^'\"]+)['\"],\s*language:\s*['\"]python['\"],\s*content:\s*(\w+)\s*\}", files_match.group(1))

    files = {}
    for path, var_name in file_items:
        files[path] = var_map[var_name]

    # Extract id/slug
    id_match = re.search(r"id:\s*['\"]([^'\"]+)['\"]", content)
    challenge_id = id_match.group(1) if id_match else os.path.basename(filepath)

    return {
        "id": challenge_id,
        "files": files,
        "fixedFile": {"path": fixed_path, "content": fixed_content},
        "bug": {"file": bug_file, "line": bug_line}
    }

def test_challenge_tree(name, files, fixed_file, bug_info):
    temp_dir = tempfile.mkdtemp(prefix=f"cognicode_{name}_")
    try:
        # 1. Write buggy files
        for path, content in files.items():
            full_path = os.path.join(temp_dir, path)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            with open(full_path, "w", encoding="utf-8") as f:
                f.write(content)

        # 2. Check declared bug line exists in target file
        bug_target_path = os.path.join(temp_dir, bug_info["file"])
        assert os.path.exists(bug_target_path), f"Bug target {bug_info['file']} does not exist in {name}!"
        with open(bug_target_path, "r", encoding="utf-8") as f:
            lines = f.readlines()
        assert 1 <= bug_info["line"] <= len(lines), (
            f"Bug line {bug_info['line']} out of bounds in {bug_info['file']} ({len(lines)} lines)"
        )

        # 3. Run buggy main.py
        rc_buggy, out_buggy, err_buggy = run_cmd([sys.executable, "app/main.py"], cwd=temp_dir)
        combined_buggy = (out_buggy + err_buggy).strip()

        # 4. Run buggy unittests (must FAIL)
        rc_test_buggy, out_tb, err_tb = run_cmd([sys.executable, "-m", "unittest", "discover", "-s", "tests"], cwd=temp_dir)
        test_failed = (rc_test_buggy != 0) or ("FAIL" in err_tb) or ("ERROR" in err_tb) or ("FAIL" in out_tb) or ("ERROR" in out_tb)
        assert test_failed, f"[{name}] Buggy test suite should fail, but passed! Output:\n{err_tb}\n{out_tb}"

        # 5. Overwrite with fixed file
        fixed_target_path = os.path.join(temp_dir, fixed_file["path"])
        with open(fixed_target_path, "w", encoding="utf-8") as f:
            f.write(fixed_file["content"])

        # 6. Run fixed main.py
        rc_fixed, out_fixed, err_fixed = run_cmd([sys.executable, "app/main.py"], cwd=temp_dir)
        combined_fixed = (out_fixed + err_fixed).strip()
        assert rc_fixed == 0, f"[{name}] Fixed main.py exited with code {rc_fixed}:\n{err_fixed}\n{out_fixed}"

        # 7. Assert buggy output != fixed output
        assert combined_buggy != combined_fixed, (
            f"[{name}] Buggy output and fixed output are identical!\nBuggy:\n{combined_buggy}\nFixed:\n{combined_fixed}"
        )

        # 8. Run fixed unittests (must PASS with code 0)
        rc_test_fixed, out_tf, err_tf = run_cmd([sys.executable, "-m", "unittest", "discover", "-s", "tests"], cwd=temp_dir)
        assert rc_test_fixed == 0, f"[{name}] Fixed tests failed with error:\n{err_tf}\n{out_tf}"
        assert ("OK" in err_tf) or ("OK" in out_tf), f"[{name}] Expected OK in test output:\n{err_tf}\n{out_tf}"

        print(f"  [PASS] {name} passed: buggy tests fail, fixed tests pass (OK), outputs diverge.")
        return True
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)

def verify_all():
    print("Verifying all 7 challenges...")

    # 1. Existing cart round
    cart_files = {}
    cart_dir = os.path.join(ROOT_DIR, "rounds", "ecommerce-cart-bug", "files")
    for root, _, filenames in os.walk(cart_dir):
        for fname in filenames:
            if fname.endswith(".py"):
                fpath = os.path.join(root, fname)
                rel_path = os.path.relpath(fpath, cart_dir).replace("\\", "/")
                with open(fpath, "r", encoding="utf-8") as f:
                    cart_files[rel_path] = f.read()

    cart_fixed = {
        "path": "app/cart.py",
        "content": cart_files["app/cart.py"].replace("if item.product_id == product_id:", "if item.product_id == normalized_id:")
    }
    test_challenge_tree("ecommerce-cart-bug", cart_files, cart_fixed, {"file": "app/cart.py", "line": 12})

    # 2. The 6 new challenges
    new_slugs = [
        "api-rate-limiter",
        "lru-cache-ttl",
        "bank-transfer-ledger",
        "task-scheduler-deps",
        "order-pipeline-discounts",
        "meeting-room-booking",
    ]

    for slug in new_slugs:
        ts_path = os.path.join(ROOT_DIR, "src", "data", "challenges", f"{slug}.ts")
        challenge_data = extract_ts_challenge(ts_path)
        test_challenge_tree(challenge_data["id"], challenge_data["files"], challenge_data["fixedFile"], challenge_data["bug"])

    print("\nALL 7 CHALLENGES COMPLETED VERIFICATION SUCCESSFULLY.")

if __name__ == "__main__":
    verify_all()
