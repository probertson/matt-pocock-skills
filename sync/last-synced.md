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

## Post-sync correction (2026-07-07) — `implement` added via referral closure

This sync originally **excluded** `implement` on the reasoning that the
marketplace mirrors the README Reference and Matt omits `implement` from it.
That was wrong: `ask-matt` (which we ship inside `mp-workflow`) presents
`/implement` as the *central* build step, so a `mp-workflow` user who follows
`ask-matt`'s advice hits a skill they don't have — a dangling reference.

Fixed by adding a standalone **`mp-implement`** (user-invoked, general-purpose;
depends on `mp-tdd` + `mp-code-review`, which it orchestrates) and making
`mp-workflow` **depend on** it so the workflow auto-pulls it. This is now the
first entry in the marketplace's *referral closure* (README Reference + any skill
a covered skill hard-routes to); the validator and both `README`/`CLAUDE.md`
"Fork note" docs were updated to describe it. `implement` no longer appears in
the validator's bundle-exclusion warnings.
