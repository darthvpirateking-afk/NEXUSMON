from __future__ import annotations

from core.models.avatar import Rank

XP_TABLE: dict[str, int] = {
    "mission_complete": 100,
    "mission_complete_fast": 150,
    "sovereign_correct": 50,
    "artifact_generated": 75,
    "anomaly_detected": 60,
    "path_optimized": 40,
    "delivery_success": 35,
    "rollback_survived": 25,
    "policy_violation": -200,
    "mission_timeout": -50,
    "artifact_corrupt": -75,
    "sovereign_override": -100,
}

RANK_THRESHOLDS: list[tuple[int, Rank]] = [
    (0, Rank.DORMANT),
    (500, Rank.AWAKENING),
    (2_000, Rank.ACTIVE),
    (8_000, Rank.SOVEREIGN),
    (25_000, Rank.ASCENDANT),
]

RANK_UNLOCKS: dict[Rank, list[str]] = {
    Rank.AWAKENING: ["can_write_artifacts"],
    Rank.ACTIVE: ["can_access_marketplace", "can_trigger_evolution"],
    Rank.SOVEREIGN: [],
    Rank.ASCENDANT: [],
}


def get_rank(xp: int) -> Rank:
    rank = Rank.DORMANT
    for threshold, name in RANK_THRESHOLDS:
        if xp >= threshold:
            rank = name
    return rank


def xp_to_next_rank(xp: int) -> int | None:
    for threshold, _ in RANK_THRESHOLDS:
        if xp < threshold:
            return threshold - xp
    return None


def rank_progress_pct(xp: int) -> float:
    prev_threshold = 0
    for threshold, _ in RANK_THRESHOLDS:
        if xp < threshold:
            span = threshold - prev_threshold
            gained = xp - prev_threshold
            return gained / span if span > 0 else 1.0
        prev_threshold = threshold
    return 1.0
