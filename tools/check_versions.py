import json
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
VERSION_FILE = ROOT / "VERSION"
FRONTEND_PACKAGE = ROOT / "frontend" / "package.json"
BACKEND_VERSION_MODULE = ROOT / "backend" / "app" / "version.py"


def read_root_version() -> str:
    return VERSION_FILE.read_text(encoding="utf-8").strip()


def read_frontend_version() -> str:
    payload = json.loads(FRONTEND_PACKAGE.read_text(encoding="utf-8"))
    version = payload.get("version")
    if not isinstance(version, str) or not version:
        raise ValueError("frontend/package.json has empty or invalid version")
    return version


def read_backend_app_version() -> str:
    content = BACKEND_VERSION_MODULE.read_text(encoding="utf-8")
    match = re.search(r'APP_VERSION\s*=\s*"([^"]+)"', content)
    if not match:
        raise ValueError("backend/app/version.py does not contain APP_VERSION")
    return match.group(1)


def main() -> int:
    root_version = read_root_version()
    frontend_version = read_frontend_version()
    backend_version = read_backend_app_version()

    print(f"Root VERSION:     {root_version}")
    print(f"Frontend version: {frontend_version}")
    print(f"Backend version:  {backend_version}")

    errors = []
    if frontend_version != root_version:
        errors.append(
            f"frontend/package.json version ({frontend_version}) != VERSION ({root_version})"
        )
    if backend_version != root_version:
        errors.append(
            f'backend/app/version.py APP_VERSION ({backend_version}) != VERSION ({root_version})'
        )

    if errors:
        print("\nVersion check failed:")
        for err in errors:
            print(f"- {err}")
        return 1

    print("\nVersion check passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
