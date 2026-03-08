from swarmz_runtime.api.telemetry_summary import get_telemetry_summary


def test_telemetry_summary_shape():
    payload = get_telemetry_summary()

    assert payload["ok"] is True
    assert payload["status"] in {"ok", "degraded"}
    assert isinstance(payload["degraded_feeds"], list)
    for key in ["health", "bridge", "missions", "evolution", "bond"]:
        assert key in payload
        assert isinstance(payload[key], dict)


def test_telemetry_summary_mission_counters_are_consistent():
    payload = get_telemetry_summary()
    missions = payload["missions"]

    assert missions["total"] >= 0
    assert missions["execution_backed"] >= 0
    assert missions["queued"] >= 0
    assert missions["running"] >= 0
    assert missions["read_only"] >= 0
    assert missions["execution_backed"] <= missions["total"]


def test_telemetry_summary_bridge_mode_table_is_truthful():
    payload = get_telemetry_summary()
    assert payload["bridge"]["mode_table"] == {
        "strategic": "cortex",
        "combat": "reflex",
        "guardian": "blocked",
    }