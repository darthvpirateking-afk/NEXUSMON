"""
conftest for tests/api/ — mocks LLM bridge so mission dispatch
tests don't block waiting for a real API key.
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest


class _MockBridgeResponse:
    content = "mock response"
    model_used = "mock"
    tokens_used = 10
    latency_ms = 1.0
    tier = 1


@pytest.fixture(autouse=True)
def mock_call_v2():
    """Patch call_v2 at binding site so mission dispatch doesn't block."""
    with patch(
        "core.orchestrator.worker_router.call_v2",
        new_callable=AsyncMock,
        return_value=_MockBridgeResponse(),
    ):
        yield
