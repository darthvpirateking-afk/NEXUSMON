"""NEXUSMON — Entity-aware persistence layer for the NEXUSMON system.

Provides SQLite-backed state management for entity identity,
operator sessions, and system metrics. Designed as the durable
substrate beneath the conversational and mission layers.
"""

from swarmz import NexusmonCore, OperatorSovereignty, SwarmzCore, TaskExecutor

__version__ = "0.1.0"

__all__ = ["NexusmonCore", "SwarmzCore", "OperatorSovereignty", "TaskExecutor"]
