from __future__ import annotations

import re

import pytest
from fastapi.testclient import TestClient

from swarmz_server import app


@pytest.mark.parametrize(
    ("route", "expected_marker", "expected_title", "expected_path"),
    [
        ("/", 'id="root"', "NEXUSMON Frontend Chat", "/nexusmon"),
        ("/organism", 'id="root"', "NEXUSMON Frontend Chat", "/nexusmon"),
        ("/console", 'id="root"', "NEXUSMON Frontend Chat", "/nexusmon"),
        ("/cockpit/", 'id="app"', "NEXUSMON Hologram Cockpit", "/cockpit/"),
    ],
)
def test_cockpit_routes_resolve_to_canonical_surface(
    route: str,
    expected_marker: str,
    expected_title: str,
    expected_path: str,
) -> None:
    with TestClient(app) as client:
        response = client.get(route, follow_redirects=True)

    assert response.status_code == 200
    assert expected_marker in response.text
    assert expected_title in response.text
    assert response.url.path == expected_path


def test_backend_served_frontend_assets_resolve_from_emitted_paths() -> None:
    with TestClient(app) as client:
        shell = client.get("/nexusmon")

        assert shell.status_code == 200
        asset_paths = re.findall(r'/(assets/[^"\']+)', shell.text)
        assert asset_paths

        for asset_path in asset_paths:
            asset_response = client.get(f"/{asset_path}")
            assert asset_response.status_code == 200, asset_path
