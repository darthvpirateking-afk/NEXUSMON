def test_api_missions_alias_dispatch_and_read(client):
    dispatch = client.post(
        "/api/missions",
        json={"type": "analysis", "payload": {"prompt": "alias test"}},
    )
    assert dispatch.status_code == 200
    created = dispatch.json()
    mission_id = created.get("mission_id")
    assert mission_id
    assert "status" in created
    assert "governance" in created

    mission = client.get(f"/api/missions/{mission_id}")
    assert mission.status_code == 200
    mission_payload = mission.json()
    assert mission_payload.get("mission_id") == mission_id

    governance = client.get(f"/api/missions/{mission_id}/governance")
    assert governance.status_code == 200
    governance_payload = governance.json()
    assert governance_payload.get("mission_id") == mission_id

    artifacts = client.get(f"/api/missions/{mission_id}/artifacts")
    assert artifacts.status_code == 200
    artifacts_payload = artifacts.json()
    assert artifacts_payload.get("mission_id") == mission_id
