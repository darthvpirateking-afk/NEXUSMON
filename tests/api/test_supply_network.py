from __future__ import annotations

from fastapi.testclient import TestClient

from nexusmon_server import app as nexusmon_app
from swarmz_runtime.api.server import app as runtime_app


def test_supply_network_route_exists_on_both_surfaces():
    with TestClient(nexusmon_app) as client_a:
        payload_a = client_a.get("/supply/network").json()

    with TestClient(runtime_app) as client_b:
        payload_b = client_b.get("/supply/network").json()

    assert payload_a["providers"]
    assert payload_b["providers"]
    assert payload_a["routing_preview"]["strategic"]
    assert payload_b["routing_preview"]["combat"]