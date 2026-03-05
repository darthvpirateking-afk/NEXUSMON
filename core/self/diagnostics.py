from __future__ import annotations

import asyncio
import subprocess
import sys

from core.shadow.channel import shadow_channel


class SelfDiagnostics:
    async def run_tests(self, mission_id: str, scope: str = "tests/") -> dict:
        loop = asyncio.get_event_loop()

        def _run() -> subprocess.CompletedProcess[str]:
            return subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "pytest",
                    scope,
                    "-q",
                    "--timeout=30",
                    "--tb=short",
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )

        try:
            result = await loop.run_in_executor(None, _run)
            passed = "passed" in result.stdout and result.returncode == 0
            output = result.stdout[-2000:]

            await shadow_channel.log(
                "self_diagnostics_run",
                mission_id,
                {
                    "scope": scope,
                    "passed": passed,
                    "returncode": result.returncode,
                },
            )
            return {
                "passed": passed,
                "returncode": result.returncode,
                "output": output,
                "stderr": result.stderr[-500:],
            }
        except subprocess.TimeoutExpired:
            return {"passed": False, "error": "Test run timed out"}
        except Exception as exc:
            return {"passed": False, "error": str(exc)}

    async def read_error_log(self, limit: int = 50) -> dict:
        entries = await shadow_channel.get_recent(limit)
        failures = [
            entry
            for entry in entries
            if entry.get("event_type")
            in {"failure", "timeout", "quarantine", "artifact_corrupt"}
        ]
        return {
            "total_entries": len(entries),
            "failure_count": len(failures),
            "failures": failures,
        }

    async def health_report(self, mission_id: str) -> dict:
        errors = await self.read_error_log()
        test_run = await self.run_tests(mission_id, "tests/")

        from core.evolution.engine import evolution_engine

        avatar = await evolution_engine.get_xp_summary()
        return {
            "health": {
                "tests_passing": test_run.get("passed", False),
                "failure_count": errors["failure_count"],
                "avatar_rank": avatar["rank"],
                "avatar_xp": avatar["xp"],
            },
            "test_output": test_run.get("output", ""),
            "recent_failures": errors["failures"][:10],
        }


self_diagnostics = SelfDiagnostics()
