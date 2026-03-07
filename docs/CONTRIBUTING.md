# Contributing to NEXUSMON

NEXUSMON is a sovereign, operator-centric system. Contributions are welcome — but the doctrine is non-negotiable.

---

## Prime Directive

Before writing a single line, read and internalize:

```
PRIME DIRECTIVE:
  Governed. Sovereign. Operator-centric. Additive forever. No drift. No overwriting.
```

This is not a style guide. It is the law of the codebase.

---

## What Can Be Contributed

- New capability modules (must be additive — no modification of existing behavior)
- New cockpit panels (must use `cosmicTokens` — no hardcoded colors)
- New test coverage (must hit untested paths — no duplicate assertions)
- Bug fixes (must not change API contracts)
- Documentation improvements

## What Cannot Be Contributed

- Anything that overwrites, degrades, or removes existing capability
- Bypass logic for the seal matrix or governance gates
- LLM call routing changes that skip the bridge tier system
- Frontend styles that don't use `cosmicTokens.ts`
- Tests that mock the bridge instead of using `call_v2` patchpoints

---

## Setup

```bash
# Clone
git clone https://github.com/darthvpirateking-afk/NEXUSMON.git
cd NEXUSMON

# Python environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements-dev.txt

# Frontend
cd cockpit
npm install

# Run tests (must all pass before any PR)
pytest tests/ --tb=short -q
```

---

## Branch Naming

```
feature/short-description
fix/short-description
evolution/stage-name
```

Do not push directly to `main` or `evolution/**` without a passing test run. `master` is legacy and should not receive new work.

---

## Commit Format

```
feat(scope): description
fix(scope): description
chore(scope): description
docs(scope): description
test(scope): description
```

Valid scopes: `bridge` `missions` `evolution` `companion` `cockpit` `frontend` `runtime` `governance` `artifacts` `tests`

---

## Two-Server Rule

If your change touches a shared endpoint, patch **both** servers:

- `nexusmon_server.py` — primary server
- `swarmz_runtime/api/server.py` — runtime kernel server

Failure to mirror endpoints causes test failures and cockpit breakage.

---

## Testing Requirements

- All existing tests must still pass: `1503 passed · 0 failed`
- New features require new tests
- Use `asyncio.run()` not `get_event_loop().run_until_complete()` (Python 3.11)
- Patch `call_v2` only — never patch `asyncio.run`

---

## Pull Request Checklist

- [ ] Tests pass: `pytest tests/ --tb=short -q`
- [ ] Both servers patched (if applicable)
- [ ] No hardcoded colors in frontend (use `cosmicTokens`)
- [ ] New files are full files; existing files are patch-packs only
- [ ] JSONL artifacts are never committed (check `.gitignore`)
- [ ] Commit message follows format above

---

## Code Style

- **Python:** PEP 8, Pydantic v2 models, FastAPI patterns
- **TypeScript:** strict mode, no `any`, inline `CSSProperties` for styles
- **No Tailwind.** No CSS frameworks. Style via `cosmicTokens.ts` only.
- Read existing code before writing patches. Never guess at line numbers.

---

## Contact

Open an issue or discussion on GitHub. The operator reviews all contributions personally.
