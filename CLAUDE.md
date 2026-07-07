Skills are organized into bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used, not promoted
- `personal/` — tied to my own setup, not promoted
- `in-progress/` — drafts not yet ready to ship
- `deprecated/` — no longer used

Every skill in `engineering/` or `productivity/` (the **promoted** buckets) must have a reference in the top-level `README.md` and an entry in `.claude-plugin/plugin.json`. Skills in `misc/`, `personal/`, `in-progress/`, and `deprecated/` must not appear in either.

**Fork note — the plugin marketplace.** This is a fork of `mattpocock/skills` that adds `.claude-plugin/marketplace.json`, a native Claude Code plugin marketplace so each skill can be installed on its own. `plugin.json` above is upstream's install-everything bundle — Matt maintains it, and we take it verbatim on every upstream sync. This fork's job is to keep `marketplace.json` mirroring the skills Matt lists in the **README Reference** — his curated, human-facing set — which is the surface this fork prepends to, so the two stay consistent: everything the README recommends is individually installable, and nothing else appears. That set can be a *subset* of `plugin.json`: Matt's bundle sometimes carries a skill he doesn't surface in the README (e.g. `implement`, a thin general-purpose PRD→implement→review orchestrator), and we follow the README, not the bundle. `node sync/validate-marketplace.mjs` enforces the README↔marketplace bijection and *warns* about any `plugin.json` skill we're excluding, so each exclusion stays a conscious call.

In `marketplace.json`, each promoted skill is its own plugin named `mp-<skill>` with `"strict": false`, whose `"source"` points at the skill's own directory (e.g. `"./skills/engineering/tdd"`) with `"skills": ["./"]`. The `source` must NOT be the repo root (`"./"`): the root holds `plugin.json`, and a `strict: false` entry whose source also contains a component-declaring `plugin.json` is a conflict that fails to load. A skill that exists only as a dependency of others (never installed directly — e.g. `grilling`, `domain-modeling`, `codebase-design`) is named `mp-lib-<skill>` and its `description` opens with "Internal dependency — installed automatically …"; the `mp-lib-` prefix plus that description are how we signal "not for direct install," since Claude Code can't truly hide a plugin from the catalog. The core-workflow skills that share the issue-tracker and `CONTEXT.md` config `setup-matt-pocock-skills` creates (`setup-matt-pocock-skills`, `triage`, `to-issues`, `to-prd`, `ask-matt`, `grill-with-docs`) ship together in the single `mp-workflow` plugin, whose `source` is the `./skills/engineering` bucket with its `skills` array listing those six.

Coupling drives grouping, not the mere presence of a `/name` mention. A skill that genuinely relies on another skill's foundation to function either folds into that skill's plugin (when it belongs to the same tightly-coupled set, like `mp-workflow`) or declares it in `dependencies` so it is auto-installed. A skill that only *points* at another as an optional, graceful-degradation step — and works fine without it — needs neither. (Example: `code-review` mentions `/setup-matt-pocock-skills` but reviews any diff with no setup, so it is a standalone `mp-code-review` with no dependency.)

For the upstream-sync process that regenerates this fork layer, see [`sync/README.md`](./sync/README.md).

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`. The promoted buckets' `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**; non-promoted bucket `README.md`s (`misc/`, `personal/`) use a flat list.

Skills in `engineering/` and `productivity/` also have a human-facing docs page at `docs/<bucket>/<skill-name>.md` (the docs tree mirrors those two bucket folders under `skills/`). The published URL is `https://aihero.dev/skills-<skill-name>` regardless of bucket — the docs path is repo organisation only. When you add, rename, or change the behaviour of a skill in `engineering/` or `productivity/`, create or re-sync its docs page following [.agents/writing-docs.md](./.agents/writing-docs.md). Skills in the non-promoted buckets (`misc/`, `personal/`, `in-progress/`, `deprecated/`) get **no** docs page.

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true`, reachable only by the human) or model-invoked (model- or user-reachable). See [.agents/invocation.md](./.agents/invocation.md).

[`ask-matt`](./skills/engineering/ask-matt/SKILL.md) is the router that maps every user-reachable skill and how they relate. The same trigger that re-syncs a docs page applies to it: whenever you add, rename, remove, or change how a user-reachable skill fits the flows, re-read `ask-matt`'s `SKILL.md` and update it so the map stays accurate — a new skill it never mentions, or a stale one it still routes to, is a router that lies.

To (re)link every skill into the local harness skill directories (`~/.claude/skills`, `~/.agents/skills`), run `scripts/link-skills.sh`. Each entry is a symlink into this repo, so a `git pull` keeps installed skills current; re-run the script after adding, removing, or renaming a skill.
