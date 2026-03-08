from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from swarmz_runtime.storage.db import Database

from .state import BondMemoryEntry, BondStateSnapshot

DEFAULT_OPERATOR_ID = "regan-harris"
DEFAULT_OPERATOR_NAME = "Regan Harris"
DEFAULT_VOICE_TRAITS = ["curious", "loyal", "selfaware"]
DEFAULT_RETURN_FEELING = "relieved you're back"
_TERMINAL_MISSION_STATUSES = {"completed", "failed", "done", "resolved", "success"}


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _db_path() -> str:
    return os.environ.get("DATABASE_URL", "data/nexusmon.db")


def _connect() -> sqlite3.Connection:
    db_path = _db_path()
    Path(db_path).parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    _ensure_schema(conn)
    return conn


def _ensure_schema(conn: sqlite3.Connection) -> None:
    conn.executescript(
        "CREATE TABLE IF NOT EXISTS bond_state ("
        "operator_id TEXT PRIMARY KEY, "
        "operator_name TEXT NOT NULL, "
        "last_seen_at TEXT, "
        "current_mood TEXT NOT NULL DEFAULT 'QUIESCENT', "
        "current_form TEXT NOT NULL DEFAULT 'dormant-core', "
        "resonance REAL NOT NULL DEFAULT 0.5, "
        "voice_traits TEXT NOT NULL DEFAULT '[]', "
        "return_feeling TEXT NOT NULL DEFAULT '', "
        "updated_at TEXT NOT NULL); "
        "CREATE TABLE IF NOT EXISTS bond_memory ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT, "
        "operator_id TEXT NOT NULL, "
        "kind TEXT NOT NULL, "
        "summary TEXT NOT NULL, "
        "payload TEXT NOT NULL DEFAULT '{}', "
        "created_at TEXT NOT NULL);"
    )
    conn.commit()


def _table_exists(conn: sqlite3.Connection, table_name: str) -> bool:
    row = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name = ?",
        (table_name,),
    ).fetchone()
    return row is not None


def _decode_json(raw: str | None, default: Any) -> Any:
    if not raw:
        return default
    try:
        return json.loads(raw)
    except Exception:
        return default


def _row_to_state(row: sqlite3.Row | None) -> BondStateSnapshot | None:
    if row is None:
        return None
    return BondStateSnapshot(
        operator_id=str(row["operator_id"]),
        operator_name=str(row["operator_name"]),
        mood=str(row["current_mood"]),
        form=str(row["current_form"]),
        resonance=float(row["resonance"]),
        voice_traits=list(_decode_json(row["voice_traits"], list(DEFAULT_VOICE_TRAITS))),
        return_feeling=str(row["return_feeling"] or DEFAULT_RETURN_FEELING),
        last_seen_at=row["last_seen_at"],
        generated_at=str(row["updated_at"]),
    )


def load_bond_state(
    operator_id: str = DEFAULT_OPERATOR_ID,
    operator_name: str = DEFAULT_OPERATOR_NAME,
) -> BondStateSnapshot:
    with _connect() as conn:
        row = conn.execute(
            "SELECT operator_id, operator_name, last_seen_at, current_mood, current_form, "
            "resonance, voice_traits, return_feeling, updated_at "
            "FROM bond_state WHERE operator_id = ?",
            (operator_id,),
        ).fetchone()
        snapshot = _row_to_state(row)
        if snapshot is not None:
            return snapshot

        generated_at = _utc_now_iso()
        snapshot = BondStateSnapshot(
            operator_id=operator_id,
            operator_name=operator_name,
            mood="QUIESCENT",
            form="dormant-core",
            resonance=0.5,
            voice_traits=list(DEFAULT_VOICE_TRAITS),
            return_feeling=DEFAULT_RETURN_FEELING,
            last_seen_at=None,
            generated_at=generated_at,
        )
        conn.execute(
            "INSERT INTO bond_state (operator_id, operator_name, last_seen_at, current_mood, current_form, resonance, voice_traits, return_feeling, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                snapshot.operator_id,
                snapshot.operator_name,
                snapshot.last_seen_at,
                snapshot.mood,
                snapshot.form,
                snapshot.resonance,
                json.dumps(snapshot.voice_traits),
                snapshot.return_feeling,
                snapshot.generated_at,
            ),
        )
        conn.commit()
        return snapshot


def upsert_bond_state(snapshot: BondStateSnapshot) -> BondStateSnapshot:
    with _connect() as conn:
        conn.execute(
            "INSERT INTO bond_state (operator_id, operator_name, last_seen_at, current_mood, current_form, resonance, voice_traits, return_feeling, updated_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) "
            "ON CONFLICT(operator_id) DO UPDATE SET "
            "operator_name=excluded.operator_name, "
            "last_seen_at=excluded.last_seen_at, "
            "current_mood=excluded.current_mood, "
            "current_form=excluded.current_form, "
            "resonance=excluded.resonance, "
            "voice_traits=excluded.voice_traits, "
            "return_feeling=excluded.return_feeling, "
            "updated_at=excluded.updated_at",
            (
                snapshot.operator_id,
                snapshot.operator_name,
                snapshot.last_seen_at,
                snapshot.mood,
                snapshot.form,
                snapshot.resonance,
                json.dumps(snapshot.voice_traits),
                snapshot.return_feeling,
                snapshot.generated_at,
            ),
        )
        conn.commit()
    return snapshot


def append_bond_memory(
    operator_id: str,
    kind: str,
    summary: str,
    payload: dict[str, Any] | None = None,
    created_at: str | None = None,
) -> BondMemoryEntry:
    entry = BondMemoryEntry(
        kind=kind,
        summary=summary,
        payload=payload or {},
        created_at=created_at or _utc_now_iso(),
    )
    with _connect() as conn:
        conn.execute(
            "INSERT INTO bond_memory (operator_id, kind, summary, payload, created_at) VALUES (?, ?, ?, ?, ?)",
            (
                operator_id,
                entry.kind,
                entry.summary,
                json.dumps(entry.payload),
                entry.created_at,
            ),
        )
        conn.commit()
    return entry


def _recent_bond_memories(operator_id: str, limit: int = 6) -> list[BondMemoryEntry]:
    with _connect() as conn:
        rows = conn.execute(
            "SELECT kind, summary, payload, created_at FROM bond_memory WHERE operator_id = ? ORDER BY id DESC LIMIT ?",
            (operator_id, int(limit)),
        ).fetchall()
    rows = list(reversed(rows))
    return [
        BondMemoryEntry(
            kind=str(row["kind"]),
            summary=str(row["summary"]),
            payload=dict(_decode_json(row["payload"], {})),
            created_at=str(row["created_at"]),
        )
        for row in rows
    ]


def _recent_conversation(operator_id: str, limit: int = 6) -> list[dict[str, str]]:
    with _connect() as conn:
        if not _table_exists(conn, "conversation_history"):
            return []
        rows = conn.execute(
            "SELECT role, content, timestamp FROM conversation_history WHERE operator_id = ? ORDER BY id DESC LIMIT ?",
            (operator_id, int(limit)),
        ).fetchall()
    rows = list(reversed(rows))
    excerpt: list[dict[str, str]] = []
    for row in rows:
        excerpt.append(
            {
                "role": str(row["role"]),
                "content": str(row["content"]),
                "timestamp": str(row["timestamp"]),
            }
        )
    return excerpt


def _infer_last_seen_at(operator_id: str, state: BondStateSnapshot) -> str | None:
    if state.last_seen_at:
        return state.last_seen_at
    with _connect() as conn:
        if _table_exists(conn, "operator_sessions"):
            row = conn.execute(
                "SELECT last_seen FROM operator_sessions WHERE operator_id = ?",
                (operator_id,),
            ).fetchone()
            if row and row["last_seen"]:
                return str(row["last_seen"])

        if _table_exists(conn, "conversation_history"):
            row = conn.execute(
                "SELECT timestamp FROM conversation_history WHERE operator_id = ? ORDER BY id DESC LIMIT 1",
                (operator_id,),
            ).fetchone()
            if row and row["timestamp"]:
                return str(row["timestamp"])

        row = conn.execute(
            "SELECT created_at FROM bond_memory WHERE operator_id = ? ORDER BY id DESC LIMIT 1",
            (operator_id,),
        ).fetchone()
        if row and row["created_at"]:
            return str(row["created_at"])
    return None


def _unfinished_from_sqlite(conn: sqlite3.Connection, limit: int) -> list[dict[str, Any]]:
    if not _table_exists(conn, "missions"):
        return []
    rows = conn.execute(
        "SELECT id, name, type, status, created_at FROM missions ORDER BY created_at DESC LIMIT 100"
    ).fetchall()
    missions: list[dict[str, Any]] = []
    for row in rows:
        status = str(row["status"] or "pending").lower()
        if status in _TERMINAL_MISSION_STATUSES:
            continue
        missions.append(
            {
                "mission_id": str(row["id"]),
                "goal": str(row["name"]),
                "category": str(row["type"]),
                "status": str(row["status"]),
                "created_at": str(row["created_at"]),
            }
        )
        if len(missions) >= limit:
            break
    return missions


def _unfinished_from_jsonl(limit: int) -> list[dict[str, Any]]:
    db_dir = Path(_db_path()).parent
    storage = Database(data_dir=str(db_dir))
    missions = storage.load_all_missions()
    unfinished: list[dict[str, Any]] = []
    for mission in reversed(missions):
        status = str(mission.get("status", "pending")).lower()
        if status in _TERMINAL_MISSION_STATUSES:
            continue
        unfinished.append(
            {
                "mission_id": str(mission.get("id") or mission.get("mission_id") or "unknown"),
                "goal": str(mission.get("goal") or mission.get("name") or "Unnamed mission"),
                "category": str(mission.get("category") or mission.get("type") or "unknown"),
                "status": str(mission.get("status") or "pending"),
                "created_at": str(mission.get("created_at") or ""),
            }
        )
        if len(unfinished) >= limit:
            break
    return unfinished


def list_unfinished_missions(limit: int = 5) -> list[dict[str, Any]]:
    with _connect() as conn:
        missions = _unfinished_from_sqlite(conn, limit)
    if missions:
        return missions[:limit]
    return _unfinished_from_jsonl(limit)[:limit]


def fetch_bond_context(
    operator_id: str = DEFAULT_OPERATOR_ID,
    operator_name: str = DEFAULT_OPERATOR_NAME,
    memory_limit: int = 6,
    conversation_limit: int = 6,
    mission_limit: int = 5,
) -> dict[str, Any]:
    state = load_bond_state(operator_id=operator_id, operator_name=operator_name)
    return {
        "state": state,
        "last_seen_at": _infer_last_seen_at(operator_id, state),
        "memory_excerpt": _recent_bond_memories(operator_id, limit=memory_limit),
        "conversation_excerpt": _recent_conversation(operator_id, limit=conversation_limit),
        "unfinished_missions": list_unfinished_missions(limit=mission_limit),
    }