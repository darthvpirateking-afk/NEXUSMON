# Branch Normalization Plan 2026-03-07

## Current Truth

- Active validated branch: `main`
- Local `main` has been committed and pushed to both remotes.
- `origin/main` and `sovereign/main` now carry the preserved validated state.
- Both remotes still advertise `master` as the default branch.

## Remote Topology Snapshot

- `origin/main` vs `origin/master`: `22` commits unique to `origin/main`, `13` commits unique to `origin/master`
- `sovereign/main` vs `sovereign/master`: `25` commits unique to `sovereign/main`, `0` commits unique to `sovereign/master`
- `origin/master` is not the living Nexusmon line.
- `sovereign/master` is further behind and should not be treated as canonical.

## Recommended Policy

Make `main` the canonical default branch on both remotes.

Reason:
- `main` contains the preserved, tested, current Nexusmon state.
- `master` reflects older administrative and PR-merge history, not the validated working line.
- Normalizing on `main` reduces further drift between GitHub, Gitea, and local operations.

## What To Do Next

### 1. Change default branch on both remotes

GitHub `origin`:
- Repository Settings
- Branches
- Default branch
- change `master` to `main`

Gitea `sovereign`:
- Repository Settings
- Branches
- Default branch
- change `master` to `main`

### 2. Verify the switch locally

Run:

```powershell
git fetch --all --prune
git remote show origin
git remote show sovereign
```

Expected result:
- `HEAD branch: main` on both remotes

### 3. Freeze `master` temporarily

Do not merge `master` into `main`.
Do not rebase `main` onto `master`.

Keep `master` temporarily as a legacy branch until you intentionally decide whether to:
- fast-forward it to `main`
- archive it operationally
- leave it as a frozen historical line

## Post-Switch Checklist

After changing the remote default branches:

1. Confirm both remotes show `HEAD branch: main`
2. Confirm pull requests default to `main`
3. Confirm CI still runs correctly for `main`
4. Confirm no local automation still assumes `master`
5. Re-run these comparisons before touching `master`:

```powershell
git log --oneline --left-right --graph main...origin/master
git log --oneline --left-right --graph main...sovereign/master
```

## Evolution Branch

Current state:
- local `evolution/evolution_controller_install`: ahead `1`, behind `4`

Observed detail:
- local commit `fa63a02` appears to duplicate upstream commit `dbc8629` at the file-stat level for `.github/workflows/ci.yml`

Recommendation:
- leave the branch untouched until `main` is the default everywhere
- inspect it separately with:

```powershell
git checkout evolution/evolution_controller_install
git fetch origin
git log --oneline --left-right --graph HEAD...origin/evolution/evolution_controller_install
git diff fa63a02 dbc8629 -- .github/workflows/ci.yml
```

Most likely outcome:
- rebase onto upstream and drop the duplicate local commit, or reset to upstream if no unique work remains

## Do Not Do Yet

- do not merge `master` into `main`
- do not force-push any branch
- do not switch the evolution branch into active work until the default-branch decision is complete

## Short Form

- `main` is the living branch
- `master` is legacy
- switch remote defaults to `main`
- verify
- handle `master` and `evolution` only after that