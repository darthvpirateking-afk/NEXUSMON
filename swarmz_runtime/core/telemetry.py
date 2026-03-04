# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
import json
import os
import threading
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

TELEMETRY_FILE = DATA_DIR / "telemetry.jsonl"
RUNTIME_METRICS_FILE = DATA_DIR / "runtime_metrics.jsonl"

_verbose = os.getenv("SWARMZ_VERBOSE", "0") not in {"0", "false", "False", None}
_lock = threading.Lock()


def set_verbose(enabled: bool) -> None:
    global _verbose
    _verbose = bool(enabled)


def verbose_log(*args: Any) -> None:
    if _verbose:
        print("[telemetry]", *args)


def _append(path: Path, obj: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(obj, separators=(",", ":"))
    with _lock, path.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def record_event(name: str, payload: dict[str, Any] | None = None) -> None:
    evt = {
        "ts": datetime.now(UTC).isoformat(),
        "type": name,
        "payload": payload or {},
    }
    _append(TELEMETRY_FILE, evt)
    verbose_log("event", name, payload)


def record_duration(name: str, duration_ms: float, context: dict[str, Any] | None = None) -> None:
    evt = {
        "ts": datetime.now(UTC).isoformat(),
        "type": name,
        "duration_ms": round(duration_ms, 3),
        "context": context or {},
    }
    _append(RUNTIME_METRICS_FILE, evt)
    verbose_log("duration", name, f"{duration_ms:.3f}ms", context)


def record_failure(name: str, error: str, context: dict[str, Any] | None = None) -> None:
    evt = {
        "ts": datetime.now(UTC).isoformat(),
        "type": name,
        "error": error,
        "context": context or {},
    }
    _append(TELEMETRY_FILE, evt)
    verbose_log("failure", name, error, context)


def last_event() -> dict[str, Any] | None:
    if not TELEMETRY_FILE.exists():
        return None
    try:
        with TELEMETRY_FILE.open("r", encoding="utf-8") as f:
            # Read last few lines efficiently instead of byte-by-byte
            lines = f.readlines()
            if not lines:
                return None
            # Get the last non-empty line
            for line in reversed(lines):
                line = line.strip()
                if line:
                    return json.loads(line)
            return None
    except Exception:
        return None


def avg_duration(name: str, max_samples: int = 100) -> float | None:
    if not RUNTIME_METRICS_FILE.exists():
        return None
    durations: list[float] = []
    try:
        with RUNTIME_METRICS_FILE.open("r", encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    obj = json.loads(line)
                    if obj.get("type") == name and "duration_ms" in obj:
                        durations.append(float(obj["duration_ms"]))
                except Exception:
                    continue
                if len(durations) >= max_samples:
                    break
        if durations:
            return sum(durations) / len(durations)
    except Exception:
        return None
    return None
