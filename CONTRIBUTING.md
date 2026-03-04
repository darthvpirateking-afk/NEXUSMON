# Contributing to NEXUSMON

Thank you for your interest in contributing to NEXUSMON. Please read this guide before submitting issues or pull requests.

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards. Please report unacceptable behaviour to the project maintainer.

---

## Reporting Issues

Before opening an issue, please:

1. Search [existing issues](https://github.com/darthvpirateking-afk/NEXUSMON/issues) to avoid duplicates.
2. Use the provided issue templates (`bug_report`, `feature_request`, or `custom`).
3. Include the Python version, OS, and relevant error output.

---

## Proposing Changes

### Branch Naming

| Type | Pattern |
|------|---------|
| New feature | `feature/<short-description>` |
| Bug fix | `fix/<short-description>` |
| Evolution stage | `evolution/<stage-name>` |
| Documentation | `docs/<short-description>` |

### Commit Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

**Allowed types:** `feat` · `fix` · `build` · `chore` · `docs` · `perf` · `refactor` · `test` · `ci`

**Common scopes:** `bridge` · `missions` · `evolution` · `companion` · `cockpit` · `frontend` · `runtime` · `governance` · `artifacts` · `tests`

**Examples:**
```
feat(swarm): add agent heartbeat timeout
fix(bridge): handle circuit breaker reset on reconnect
docs(readme): update evolution stage table
```

---

## Pull Request Process

1. **Fork** the repository and create your branch from `master`.
2. **Write or update tests** for any changed behaviour. The test suite must remain green.
3. **Run the full suite** before submitting:
   ```bash
   pytest tests/ --tb=short -q
   ```
4. **Fill in the pull request template** completely. Incomplete PRs will not be reviewed.
5. **Request a review** from a maintainer. PRs require at least one approval before merging.
6. **Do not squash or rebase** without maintainer instruction — commit history is part of the audit trail.

---

## Development Setup

```bash
# Clone and install dependencies
git clone https://github.com/darthvpirateking-afk/NEXUSMON.git
cd NEXUSMON
pip install -r requirements-dev.txt

# Start the primary server
python nexusmon_server.py

# Start the runtime kernel server
python -m swarmz_runtime.api.server

# Start the frontend
cd frontend && npm install && npm run dev

# Run tests
pytest tests/ --tb=short -q
```

---

## Coding Standards

- **Python 3.11** — type-annotated, PEP 8 compliant.
- All Python files must begin with the SWARMZ license header:
  ```python
  # SWARMZ Source Available License
  # Commercial use, hosting, and resale prohibited.
  # See LICENSE file for details.
  ```
- **Additive only** — never delete, overwrite, or degrade existing functionality.
- **No secrets in source** — use environment variables (`OPERATOR_KEY`, `JWT_SECRET`, etc.).
- Frontend styling must use `cosmicTokens.ts` exclusively. No hardcoded hex colours.

---

## Questions

Open a [discussion](https://github.com/darthvpirateking-afk/NEXUSMON/discussions) or file an issue with the `question` label.
