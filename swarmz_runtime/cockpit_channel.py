"""Cockpit WebSocket broadcast channel.

Maintains a set of connected cockpit WebSocket clients and provides
a broadcast() coroutine used to push real-time state events.

Usage in nexusmon_server.py:
    from swarmz_runtime.cockpit_channel import register, unregister, broadcast

Usage in any async handler:
    await broadcast({"type": "avatar_state", "state": "PROCESSING"})
"""
from __future__ import annotations

from typing import Any

# Module-level client registry (no asyncio.Lock — single-threaded async is safe)
_clients: set = set()


def register(ws: Any) -> None:
    """Register a new cockpit WebSocket client."""
    _clients.add(ws)


def unregister(ws: Any) -> None:
    """Remove a cockpit WebSocket client."""
    _clients.discard(ws)


async def broadcast(msg: dict[str, Any]) -> None:
    """Send a JSON message to all connected cockpit clients.

    Clients that have disconnected are silently removed.
    """
    dead: set = set()
    for ws in list(_clients):
        try:
            await ws.send_json(msg)
        except Exception:
            dead.add(ws)
    _clients.difference_update(dead)


def client_count() -> int:
    """Return number of currently connected cockpit clients."""
    return len(_clients)
