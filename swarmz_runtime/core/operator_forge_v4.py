# SWARMZ Operator-Forge v4
# Domain Forging

from typing import Any


class DomainBlueprint:
    def __init__(self, name: str, clusters: list[str], properties: dict[str, Any]):
        self.name = name
        self.clusters = clusters
        self.properties = properties


class OperatorForgeV4:
    def __init__(self):
        self.domains = []

    def forge_domain(self, blueprint: DomainBlueprint):
        """Forge a new domain based on the blueprint."""
        self.domains.append(blueprint)
        return f"Domain {blueprint.name} forged successfully"

    def list_domains(self) -> list[str]:
        """List all forged domains."""
        return [domain.name for domain in self.domains]

    def get_domain_properties(self, domain_name: str) -> dict[str, Any]:
        """Retrieve properties of a specific domain."""
        domain = next((d for d in self.domains if d.name == domain_name), None)
        if not domain:
            raise ValueError(f"Domain {domain_name} not found")
        return domain.properties
