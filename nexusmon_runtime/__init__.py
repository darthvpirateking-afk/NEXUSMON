# SWARMZ Source Available License
# Commercial use, hosting, and resale prohibited.
# See LICENSE file for details.
"""Canonical NEXUSMON runtime namespace.

This package maps the NEXUSMON runtime import path onto the legacy
``swarmz_runtime`` tree so new code can adopt NEXUSMON naming without
breaking existing modules, tests, or deployments.
"""

from importlib import import_module as _import_module
from pathlib import Path as _Path

_legacy_runtime = _import_module("swarmz_runtime")
__path__ = [str(_Path(__file__).resolve().parent.parent / "swarmz_runtime")]
__version__ = getattr(_legacy_runtime, "__version__", "1.0.0")
__all__ = list(getattr(_legacy_runtime, "__all__", []))
