# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
import json
from pathlib import Path
from typing import Any

from galileo.storage import GALILEO_DATA_DIR, ensure_storage


def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    out: list[dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except Exception:
                continue
    return out


def read_hypotheses() -> list[dict[str, Any]]:
    ensure_storage()
    return _read_jsonl(GALILEO_DATA_DIR / "hypotheses.jsonl")


def read_experiments() -> list[dict[str, Any]]:
    ensure_storage()
    return _read_jsonl(GALILEO_DATA_DIR / "experiments.jsonl")


def read_runs() -> list[dict[str, Any]]:
    ensure_storage()
    return _read_jsonl(GALILEO_DATA_DIR / "runs.jsonl")
