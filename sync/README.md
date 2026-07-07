# Keeping this fork in sync with upstream

This fork of [`mattpocock/skills`](https://github.com/mattpocock/skills) adds
exactly one thing on top of Matt's repo: a **native Claude Code plugin
marketplace** so each skill can be installed on its own. This directory holds the
tooling and the process for pulling in Matt's changes without losing that layer.

## What the fork actually adds (the "fork layer")

Keep this list short — the smaller the delta, the easier every sync is. Today it is:

| File | What it is |
|---|---|
| `.claude-plugin/marketplace.json` | The per-skill marketplace. **Upstream has no equivalent — this is the whole point of the fork.** |
| `README.md` (top block only) | A fork explainer + plugin-install instructions, **prepended** above Matt's verbatim README. Everything below the `---` divider is Matt's, untouched. |
| `CLAUDE.md` ("Fork note" paragraphs) | The marketplace packaging rules, inserted into Matt's `CLAUDE.md`. |
| `sync/` | This directory: the process, the validator, and the last-synced marker. |

Everything else — including `.claude-plugin/plugin.json` (Matt's install-everything
bundle) — belongs to upstream and is taken **verbatim**. We do not maintain a
separate `plugin.json`.

### The core invariant

`marketplace.json` must **mirror the README Reference** — the skills Matt lists
in his curated, human-facing section (the surface this fork prepends to). Every
skill in that Reference is reachable through exactly one marketplace plugin, and
nothing outside it appears. This is deliberately the **README**, not the fuller
`plugin.json` bundle: Matt sometimes bundles a skill he doesn't surface in the
README (e.g. `implement`), and we follow the curated recommendation so the two
human-facing surfaces stay consistent. `node sync/validate-marketplace.mjs`
enforces the README↔marketplace bijection (plus structural rules) and *warns*
about any `plugin.json` skill we exclude, so each exclusion stays a conscious
call. The packaging rules themselves live in the root `CLAUDE.md` "Fork note" —
read those before editing `marketplace.json`.

## Prerequisites

The `upstream` remote is required — `git fetch upstream` can't work without it —
but a git remote lives in `.git/config` and is **not** committed, so a fresh
clone won't have it. Step 1 below re-adds it if missing, so the process is
self-healing; you never have to remember to set it up.

## The sync process

Run this whenever you want to pull Matt's latest in. It's written so a fresh
Claude Code session can execute it — paste "Follow sync/README.md to sync this
fork with upstream" and let it work, confirming the judgment calls in step 5.

1. **Ensure the upstream remote, then fetch.** Add it if a fresh clone lacks it,
   then fetch:

   ```
   git remote get-url upstream >/dev/null 2>&1 || \
     git remote add upstream https://github.com/mattpocock/skills.git
   git fetch upstream --tags
   ```

   `$BASE` is the last-synced upstream commit: the newest `upstream-sync/*` tag
   (`git describe --tags --match 'upstream-sync/*' --abbrev=0` on that commit, or
   just `git tag -l 'upstream-sync/*'`), which also matches the SHA recorded in
   [`last-synced.md`](./last-synced.md). The new tip is `upstream/main`.

2. **Branch off upstream, wholesale.** `git switch -c sync-upstream-<date>
   upstream/main`. We take **all** of upstream's content as the new base and
   re-apply the fork layer on top — we do **not** rebase or 3-way-merge the
   generated config. (Regenerating a derived file beats hand-merging it.)

3. **Diff the skill inventory — this is the ground truth, not the changelog.**
   The set of skill directories drives the marketplace:

   ```
   git ls-tree -r --name-only $BASE       | grep 'SKILL.md$' | sed 's#/SKILL.md##' | sort > /tmp/base.txt
   git ls-tree -r --name-only upstream/main | grep 'SKILL.md$' | sed 's#/SKILL.md##' | sort > /tmp/new.txt
   comm -13 /tmp/base.txt /tmp/new.txt   # added skills
   comm -23 /tmp/base.txt /tmp/new.txt   # removed skills
   ```

   Only additions/removals/moves in the **promoted buckets** (`engineering/`,
   `productivity/`) can affect the marketplace. Read `CHANGELOG.md` and
   `.changeset/` for the *why* behind notable changes, but trust the directory
   diff for the *what*. Also confirm no already-packaged skill changed its
   cross-skill `/name` invocations (that would change a `dependencies` array).

4. **Decide which skills the marketplace should carry — the README Reference is
   the authority.** A skill belongs in the marketplace iff Matt lists it in the
   upstream README's Reference section (his curated recommendation). Two other
   signals inform, but don't override, that:
   - `plugin.json` (`git show upstream/main:.claude-plugin/plugin.json`) is the
     fuller machine bundle. A skill in `plugin.json` but **not** in the README is
     bundle-only (e.g. `implement`) — **exclude it**; the validator will warn so
     it's a conscious call. A skill in neither (e.g. `resolving-merge-conflicts`)
     is plainly out.
   - A promoted skill in the README that's new since `$BASE` is one to **add**.

5. **Classify each newly-added skill** (confirm the judgment calls with Paul):
   - **Bucket + invocation mode:** read its `SKILL.md` frontmatter.
     `disable-model-invocation: true` → user-invoked; otherwise model-invoked.
   - **Grouping / dependencies — coupling decides, not a bare `/name` mention:**
     - Belongs to the tightly-coupled `setup`-foundation set? Fold it into
       `mp-workflow`.
     - Genuinely *requires* another skill to function? Give it a `dependencies`
       entry so that plugin auto-installs.
     - Only *points* at another skill as an optional/graceful step, and works
       without it? Neither — it's a standalone `mp-<skill>`. (This is why
       `mp-code-review` has no dependency despite mentioning `/setup-matt-pocock-skills`.)
   - **Dependency-only skill** (never installed directly)? Name it
     `mp-lib-<skill>` and open its description with "Internal dependency — …".

6. **Regenerate the fork layer:**
   - `marketplace.json`: add/remove plugins so it mirrors `plugin.json` exactly.
   - `README.md`: take upstream's README, then **prepend** the fork block above
     it (the block from the `#` heading down to the `---` divider). Never edit
     Matt's body; if the plugin instructions need updating, edit only the block.
   - `CLAUDE.md`: take upstream's, then re-insert the "Fork note" paragraphs
     after the promoted-buckets rule.

7. **Validate.** `node sync/validate-marketplace.mjs` must pass. Then eyeball
   `git diff $BASE..HEAD -- .claude-plugin/marketplace.json README.md CLAUDE.md`
   to confirm only intended changes.

8. **Record the sync.** Update [`last-synced.md`](./last-synced.md) with the new
   upstream SHA, the date, and a short note on what changed. Also tag the
   upstream commit you synced to, so the next sync has a git-native `$BASE`:

   ```
   git tag -a upstream-sync/<date> <upstream-sha> -m "Fork synced to upstream mattpocock/skills @ <upstream-sha>"
   ```

   (These dated tags are immutable, so `git tag -l 'upstream-sync/*'` also gives
   you a history of every sync. Push them with `git push origin --tags`.)

9. **Commit and stop.** Squash the fork layer into one clear commit
   (`Sync with upstream mattpocock/skills @ <sha>`). Do **not** push, open a PR,
   or update `main` — Paul handles that. He'll fast-forward `main` to this branch
   (or open a PR) himself.

## Why it's shaped this way

- **Regenerate, don't merge.** `marketplace.json` is a derived artifact; its spec
  is `CLAUDE.md`. Rebuilding it from the current skill set is more reliable than
  3-way-merging generated JSON.
- **Prepend, don't interleave.** Keeping the README delta as one top block means
  Matt's body is byte-for-byte his, so there's never a README merge conflict.
- **`plugin.json` is upstream's.** We stopped maintaining a separate bundle the
  moment Matt shipped his own; the marketplace just mirrors it.
