# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
"""Legacy compatibility shim for tests and tooling importing `swarmz_server`.

Canonical server module is `nexusmon_server.py`. This module preserves the old
import path without changing runtime behavior.
"""

from nexusmon_server import app, main  # re-export canonical server entrypoints

__all__ = ["app", "main"]
