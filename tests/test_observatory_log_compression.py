from __future__ import annotations

import subprocess
import sys
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_observatory_log_compression_script() -> None:
    log_dir = ROOT / "observatory" / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)

    log_name = f"pytest-{uuid.uuid4().hex}.log"
    log_path = log_dir / log_name
    gz_path = log_dir / f"{log_name}.gz"
    log_path.write_text("test log for compression\n", encoding="utf-8")

    subprocess.run(
        [sys.executable, "scripts/compress_observatory_logs.py"],
        cwd=ROOT,
        check=True,
    )

    assert log_dir.exists()
    assert gz_path.exists()

    log_path.unlink(missing_ok=True)
    gz_path.unlink(missing_ok=True)
