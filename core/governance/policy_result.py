from __future__ import annotations

from enum import Enum


class PolicyResult(str, Enum):
    PASS = "PASS"
    ESCALATE = "ESCALATE"
    QUARANTINE = "QUARANTINE"
    DENY = "DENY"

    def is_blocking(self) -> bool:
        return self in (PolicyResult.QUARANTINE, PolicyResult.DENY)

    def worst(self, other: PolicyResult) -> PolicyResult:
        order = [
            PolicyResult.PASS,
            PolicyResult.ESCALATE,
            PolicyResult.QUARANTINE,
            PolicyResult.DENY,
        ]
        return self if order.index(self) >= order.index(other) else other
