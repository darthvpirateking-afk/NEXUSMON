# Engine module for SWARMZ runtime

import yaml
import json
from swarmz.backend.core.governor.governor import Governor
from swarmz.backend.core.patchpack.patchpack import Patchpack
from swarmz.backend.core.session.session import Session
from swarmz.backend.core.mission.parser import Parser
from swarmz.backend.core.mission.planner import Planner
from swarmz.backend.core.mission.executor import MissionExecutor as Executor
from swarmz.backend.core.mission.reporter import MissionReporter as Reporter
from swarmz.backend.core.swarm.registry import UnitRegistry as Registry
from swarmz.backend.core.swarm.behavior import BehaviorEngine
from swarmz.backend.core.swarm.formation import FormationEngine
from swarmz_runtime.avatar.avatar_brain import AvatarBrain
from swarmz_runtime.avatar.avatar_state import AvatarState
from swarmz_runtime.avatar.avatar_presence import AvatarPresence
from swarmz.backend.core.cosmology.mesh_router import MeshRouter


class Engine:
    def __init__(self):
        self.config = None
        self.mesh = None
        self.governor = None
        self.patchpack = None
        self.session = None
        self.mission_engine = None
        self.swarm_engine = None
        self.avatar = None

    def load_config(self):
        with open("config/settings.yaml", "r") as f:
            self.config = yaml.safe_load(f)

    def load_mesh(self):
        with open("mesh/nodes.json", "r") as f:
            nodes = json.load(f)
        with open("mesh/links.json", "r") as f:
            links = json.load(f)
        self.mesh = MeshRouter(nodes, links)

    def initialize_components(self):
        self.governor = Governor()
        self.patchpack = Patchpack()
        self.session = Session(operator_id="default_operator")
        self.mission_engine = {
            "parser": Parser(),
            "planner": Planner(),
            "executor": Executor(),
            "reporter": Reporter(),
        }
        self.swarm_engine = {
            "registry": Registry(),
            "behavior": BehaviorEngine(),
            "formation": FormationEngine(),
        }
        self.avatar = {
            "brain": AvatarBrain(),
            "state": AvatarState(),
            "presence": AvatarPresence(),
        }
