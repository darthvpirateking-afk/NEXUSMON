from __future__ import annotations

from .models import ProviderStatus


_COMPLIANCE_SCORE = {
    "regulated-friendly": 0.92,
    "standard": 0.76,
    "self-hosted": 0.88,
    "unknown": 0.55,
}


def score_provider(provider: ProviderStatus) -> float:
    score = 0.0
    score += 0.35 if provider.configured and provider.enabled else 0.1
    score += 0.2 if not provider.circuit_open else 0.02
    score += max(0.0, 0.2 - min(provider.estimated_cost_per_1k, 0.2))
    score += max(0.0, 0.15 - min(provider.latency_ms / 4000.0, 0.15))
    score += _COMPLIANCE_SCORE.get(provider.compliance, _COMPLIANCE_SCORE["unknown"]) * 0.1
    score += 0.1 if provider.billing_integrity == "tracked" else 0.03
    return round(min(score, 1.0), 3)