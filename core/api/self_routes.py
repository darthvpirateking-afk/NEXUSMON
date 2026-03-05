from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from core.governance.policy_gate import policy_gate
from core.governance.policy_result import PolicyResult
from core.models.mission import Mission, MissionType
from core.self.diagnostics import self_diagnostics
from core.self.manifest import self_manifest
from core.self.ui_mutation import ui_mutation_engine
from core.self.worker_forge import worker_forge

self_router = APIRouter()


class GeneratePanelRequest(BaseModel):
    panel_name: str
    description: str
    mission_id: str


class StylePatchRequest(BaseModel):
    selector: str
    css_prop: str
    value: str
    mission_id: str


class ForgeWorkerRequest(BaseModel):
    worker_name: str
    worker_role: str
    system_prefix: str
    mission_id: str
    activate: bool = False


class ActivateWorkerRequest(BaseModel):
    worker_name: str
    mission_id: str


async def _policy_pass_or_error(
    mission_type: MissionType,
    payload: dict,
) -> tuple[bool, dict]:
    synthetic = Mission(type=mission_type, payload=payload)
    result = await policy_gate.evaluate(synthetic)
    if result != PolicyResult.PASS:
        return False, {
            "success": False,
            "error": "policy_gate_rejected",
            "policy_result": result.value,
        }
    return True, {"policy_result": result.value}


@self_router.post("/ui/generate-panel")
async def generate_panel(req: GeneratePanelRequest):
    allowed, error = await _policy_pass_or_error(
        MissionType.UI_MUTATION,
        {"panel_name": req.panel_name, "description": req.description},
    )
    if not allowed:
        return error
    return await ui_mutation_engine.generate_panel(
        req.panel_name,
        req.description,
        req.mission_id,
    )


@self_router.post("/ui/style-patch")
async def style_patch(req: StylePatchRequest):
    allowed, error = await _policy_pass_or_error(
        MissionType.UI_MUTATION,
        {
            "selector": req.selector,
            "css_prop": req.css_prop,
            "value": req.value,
        },
    )
    if not allowed:
        return error
    return await ui_mutation_engine.apply_style_patch(
        req.css_prop,
        req.value,
        req.selector,
        req.mission_id,
    )


@self_router.post("/workers/forge")
async def forge_worker(req: ForgeWorkerRequest):
    allowed, error = await _policy_pass_or_error(
        MissionType.WORKER_FORGE,
        {
            "worker_name": req.worker_name,
            "worker_role": req.worker_role,
            "system_prefix": req.system_prefix,
            "activate": req.activate,
        },
    )
    if not allowed:
        return error
    return await worker_forge.forge_worker(
        req.worker_name,
        req.worker_role,
        req.system_prefix,
        req.mission_id,
        req.activate,
    )


@self_router.post("/workers/activate")
async def activate_worker(req: ActivateWorkerRequest):
    allowed, error = await _policy_pass_or_error(
        MissionType.WORKER_FORGE,
        {"worker_name": req.worker_name, "activate": True},
    )
    if not allowed:
        return error
    return await worker_forge.activate_worker(req.worker_name, req.mission_id)


@self_router.get("/workers")
async def list_workers():
    data = self_manifest.get_all()
    return {
        "generated_workers": data["generated_workers"],
        "active_workers": data["active_workers"],
    }


@self_router.get("/panels")
async def list_panels():
    data = self_manifest.get_all()
    return {"generated_panels": data["generated_panels"]}


@self_router.get("/manifest")
async def get_manifest():
    return self_manifest.get_all()


@self_router.post("/diagnostics/run")
async def run_diagnostics(mission_id: str = "manual", scope: str = "tests/"):
    return await self_diagnostics.run_tests(mission_id, scope)


@self_router.get("/diagnostics/errors")
async def get_errors(limit: int = 50):
    return await self_diagnostics.read_error_log(limit)


@self_router.get("/diagnostics/health")
async def health_report(mission_id: str = "manual"):
    return await self_diagnostics.health_report(mission_id)
