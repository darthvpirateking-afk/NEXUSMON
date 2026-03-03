def test_api_health_alias_available(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("status") == "ok"


def test_api_health_deep_alias_available(client):
    response = client.get("/api/health/deep")
    assert response.status_code == 200
    payload = response.json()
    assert "subsystems" in payload
    assert isinstance(payload["subsystems"], dict)
    for key in ("bridge", "governance", "orchestrator", "avatar"):
        assert key in payload["subsystems"]
