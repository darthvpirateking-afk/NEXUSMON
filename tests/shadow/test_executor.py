"""Tests for swarmz_runtime.shadow.executor — shadow execution, encryption, auth."""
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from swarmz_runtime.shadow.executor import (
    OperatorKeyRequired,
    ShadowMission,
    seal,
    unseal,
    validate_operator_key,
    execute,
)


def _run(coro):
    return asyncio.run(coro)


def _bridge_resp(**kwargs):
    from swarmz_runtime.bridge.llm import BridgeResponse
    defaults = dict(
        content="Shadow output",
        model_used="test/model",
        provider="test",
        tokens_used=80,
        tier=1,
        latency_ms=5.0,
    )
    defaults.update(kwargs)
    return BridgeResponse(**defaults)


VALID_KEY = "swarmz_sovereign_key"


# ---------------------------------------------------------------------------
# Fixture: redirect shadow dir
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _isolated_shadow(tmp_path, monkeypatch):
    import swarmz_runtime.shadow.executor as mod
    monkeypatch.setattr(mod, "_SHADOW_DIR", tmp_path / "shadow")
    monkeypatch.delenv("NEXUSMON_OPERATOR_KEY", raising=False)


# ---------------------------------------------------------------------------
# Encryption — seal / unseal
# ---------------------------------------------------------------------------


class TestSealUnseal:
    def test_seal_returns_non_plaintext(self):
        ciphertext = seal("secret output", VALID_KEY)
        assert "secret output" not in ciphertext

    def test_unseal_recovers_original(self):
        original = "classified data"
        assert unseal(seal(original, VALID_KEY), VALID_KEY) == original

    def test_different_keys_produce_different_ciphertext(self):
        c1 = seal("data", "key-one")
        c2 = seal("data", "key-two")
        assert c1 != c2

    def test_empty_string_round_trips(self):
        assert unseal(seal("", VALID_KEY), VALID_KEY) == ""

    def test_long_string_round_trips(self):
        data = "X" * 10_000
        assert unseal(seal(data, VALID_KEY), VALID_KEY) == data

    def test_ciphertext_is_base64(self):
        import base64
        c = seal("hello", VALID_KEY)
        decoded = base64.b64decode(c.encode())
        assert len(decoded) == len("hello")


# ---------------------------------------------------------------------------
# Operator key validation
# ---------------------------------------------------------------------------


class TestValidateOperatorKey:
    def test_valid_key_passes(self):
        validate_operator_key(VALID_KEY)  # must not raise

    def test_wrong_key_raises(self):
        with pytest.raises(OperatorKeyRequired):
            validate_operator_key("wrong-key")

    def test_empty_key_raises(self):
        with pytest.raises(OperatorKeyRequired):
            validate_operator_key("")

    def test_env_var_overrides_default(self, monkeypatch):
        monkeypatch.setenv("NEXUSMON_OPERATOR_KEY", "custom-env-key")
        validate_operator_key("custom-env-key")  # must not raise

    def test_old_default_fails_after_env_override(self, monkeypatch):
        monkeypatch.setenv("NEXUSMON_OPERATOR_KEY", "custom-env-key")
        with pytest.raises(OperatorKeyRequired):
            validate_operator_key(VALID_KEY)


# ---------------------------------------------------------------------------
# execute — happy path
# ---------------------------------------------------------------------------


class TestExecuteHappyPath:
    def test_returns_shadow_mission(self):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())):
            mission = _run(execute(goal="analyze", operator_key=VALID_KEY))

        assert isinstance(mission, ShadowMission)

    def test_status_complete(self):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())):
            mission = _run(execute(goal="analyze", operator_key=VALID_KEY))

        assert mission.status == "complete"

    def test_output_plaintext_in_result(self):
        resp = _bridge_resp(content="classified intel")
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)):
            mission = _run(execute(goal="analyze", operator_key=VALID_KEY))

        assert mission.output == "classified intel"

    def test_shadow_id_generated(self):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        assert len(mission.shadow_id) == 12

    def test_tokens_recorded(self):
        resp = _bridge_resp(tokens_used=200)
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        assert mission.tokens == 200

    def test_completed_at_set(self):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        assert mission.completed_at is not None


# ---------------------------------------------------------------------------
# execute — auth rejection
# ---------------------------------------------------------------------------


class TestExecuteAuthRejection:
    def test_wrong_key_raises_operator_key_required(self):
        with pytest.raises(OperatorKeyRequired):
            _run(execute(goal="goal", operator_key="bad-key"))

    def test_empty_key_raises(self):
        with pytest.raises(OperatorKeyRequired):
            _run(execute(goal="goal", operator_key=""))

    def test_bridge_not_called_on_invalid_key(self):
        mock_call = AsyncMock(return_value=_bridge_resp())
        with patch("swarmz_runtime.bridge.llm.call_v2", new=mock_call):
            try:
                _run(execute(goal="goal", operator_key="bad"))
            except OperatorKeyRequired:
                pass
        mock_call.assert_not_called()


# ---------------------------------------------------------------------------
# execute — error path
# ---------------------------------------------------------------------------


class TestExecuteErrorPath:
    def test_bridge_error_returns_error_status(self):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(side_effect=RuntimeError("down"))):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        assert mission.status == "error"
        assert "down" in mission.error

    def test_bridge_error_output_is_none(self):
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(side_effect=RuntimeError("x"))):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        assert mission.output is None


# ---------------------------------------------------------------------------
# Persistence — sealed artifact
# ---------------------------------------------------------------------------


class TestPersistence:
    def test_sealed_file_created(self, tmp_path, monkeypatch):
        import swarmz_runtime.shadow.executor as mod
        shadow_dir = tmp_path / "shadow"
        monkeypatch.setattr(mod, "_SHADOW_DIR", shadow_dir)

        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        sealed_file = shadow_dir / f"{mission.shadow_id}.sealed"
        assert sealed_file.exists()

    def test_sealed_file_is_not_plaintext(self, tmp_path, monkeypatch):
        import swarmz_runtime.shadow.executor as mod
        shadow_dir = tmp_path / "shadow"
        monkeypatch.setattr(mod, "_SHADOW_DIR", shadow_dir)

        resp = _bridge_resp(content="top secret content")
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        raw = (shadow_dir / f"{mission.shadow_id}.sealed").read_text()
        assert "top secret content" not in raw

    def test_sealed_output_is_decryptable(self, tmp_path, monkeypatch):
        import swarmz_runtime.shadow.executor as mod
        shadow_dir = tmp_path / "shadow"
        monkeypatch.setattr(mod, "_SHADOW_DIR", shadow_dir)

        resp = _bridge_resp(content="recoverable secret")
        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=resp)):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        record = json.loads((shadow_dir / f"{mission.shadow_id}.sealed").read_text())
        plaintext = unseal(record["sealed_output"], VALID_KEY)
        assert plaintext == "recoverable secret"

    def test_sealed_file_contains_metadata(self, tmp_path, monkeypatch):
        import swarmz_runtime.shadow.executor as mod
        shadow_dir = tmp_path / "shadow"
        monkeypatch.setattr(mod, "_SHADOW_DIR", shadow_dir)

        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(return_value=_bridge_resp())):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        record = json.loads((shadow_dir / f"{mission.shadow_id}.sealed").read_text())
        for key in ("shadow_id", "status", "tokens", "executed_at", "completed_at"):
            assert key in record

    def test_error_output_sealed(self, tmp_path, monkeypatch):
        import swarmz_runtime.shadow.executor as mod
        shadow_dir = tmp_path / "shadow"
        monkeypatch.setattr(mod, "_SHADOW_DIR", shadow_dir)

        with patch("swarmz_runtime.bridge.llm.call_v2", new=AsyncMock(side_effect=RuntimeError("err msg"))):
            mission = _run(execute(goal="g", operator_key=VALID_KEY))

        record = json.loads((shadow_dir / f"{mission.shadow_id}.sealed").read_text())
        assert "sealed_error" in record
        assert "err msg" not in record.get("sealed_error", "")  # error is sealed, not plaintext
        err_plain = unseal(record["sealed_error"], VALID_KEY)
        assert "err msg" in err_plain


# ---------------------------------------------------------------------------
# ShadowMission.to_dict
# ---------------------------------------------------------------------------


class TestShadowMissionToDict:
    def test_sealed_flag_is_true(self):
        m = ShadowMission(
            shadow_id="abc", goal="g", mode="strategic", agent_id="a",
            status="complete", output="out", error=None, tokens=10,
            latency_ms=1.0, executed_at="t", completed_at="t2",
        )
        assert m.to_dict()["sealed"] is True

    def test_all_required_keys_present(self):
        m = ShadowMission(
            shadow_id="abc", goal="g", mode="strategic", agent_id="a",
            status="complete", output="out", error=None, tokens=10,
            latency_ms=1.0, executed_at="t", completed_at="t2",
        )
        d = m.to_dict()
        for key in ("shadow_id", "agent_id", "mode", "status", "tokens",
                    "latency_ms", "executed_at", "completed_at", "sealed"):
            assert key in d
