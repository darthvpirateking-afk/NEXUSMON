from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent.parent


def _read(rel: str) -> str:
    return (REPO_ROOT / rel).read_text(encoding="utf-8")


class TestShimSemantics:
    """swarmz_server.py must be a pure compatibility shim."""

    def test_shim_imports_canonical_app(self):
        text = _read("swarmz_server.py")
        assert "from nexusmon_server import" in text, (
            "swarmz_server.py must re-export from nexusmon_server"
        )

    def test_shim_exports_app_and_main(self):
        text = _read("swarmz_server.py")
        assert "app" in text
        assert "main" in text

    def test_shim_has_no_route_definitions(self):
        text = _read("swarmz_server.py")
        assert "@app.get" not in text, (
            "swarmz_server.py must not define routes - it is a shim"
        )
        assert "@app.post" not in text


class TestCanonicalRoutes:
    """Route definitions must live in nexusmon_server.py."""

    def test_organism_route_exists(self):
        text = _read("nexusmon_server.py")
        assert '@app.get("/organism")' in text

    def test_canonical_redirect_helper_used(self):
        text = _read("nexusmon_server.py")
        assert "_canonical_ui_route()" in text
        assert "RedirectResponse" in text

    def test_canonical_redirect_uses_307(self):
        text = _read("nexusmon_server.py")
        assert "status_code=307" in text

    def test_deployment_mobile_status_route_exists(self):
        text = _read("nexusmon_server.py")
        assert "/v1/deployment/mobile-status" in text


class TestLegacyRoutesRemoved:
    """Legacy routes must not exist in canonical server."""

    def test_no_legacy_web_route(self):
        text = _read("nexusmon_server.py")
        assert '"/web"' not in text
        assert '"/web_ui"' not in text

    def test_no_legacy_file_response(self):
        text = _read("nexusmon_server.py")
        assert 'FileResponse("web/' not in text
        assert "FileResponse('web/" not in text


class TestNoRuntimeReferencesToLegacyRoutes:
    """Original prune intent - legacy route strings gone from runtime."""

    def test_swarmz_server_has_no_legacy_route_strings(self):
        text = _read("swarmz_server.py")
        assert '"/web"' not in text
        assert '"/web_ui"' not in text
        assert "FileResponse" not in text
