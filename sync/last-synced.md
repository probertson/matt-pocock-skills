# Last upstream sync

This file records the upstream (`mattpocock/skills`) commit this fork was last
synced to. Update it at the end of every sync (see [`README.md`](./README.md)).

- **Upstream commit:** `16a2a5c` — "Merge pull request #461 from mattpocock/fix/wayfinder-self-grilling"
- **Synced on:** 2026-07-07
- **Previous sync:** `6eeb81b`
- **Git tag:** `upstream-sync/2026-07-07` points at `16a2a5c` (the git-native `$BASE` for the next sync)

## What this sync changed in the fork layer

Two new README-listed engineering skills, added to `marketplace.json`:

- `mp-research` (model-invoked).
- `mp-code-review` (model-invoked, no dependency — reviews any diff without setup;
  its `/setup-matt-pocock-skills` mention is an optional, graceful-degradation
  step, not a hard coupling).

No change to the existing plugins' dependency arrays. `plugin.json` (upstream's
bundle) is taken verbatim. `resolving-merge-conflicts` stays unpackaged (upstream
excludes it from the bundle too).

**Deliberately excluded — `implement`:** it's in upstream's `plugin.json` bundle
and even has a docs page, but Matt does **not** list it in his curated README
Reference. It's a general-purpose skill (not repo-specific), but the marketplace
mirrors the README (the curated, recommended set), not the fuller bundle — so we
leave `implement` out, consistent with the fork's prior state. The validator
emits a warning for it each sync so the exclusion stays a conscious call.
