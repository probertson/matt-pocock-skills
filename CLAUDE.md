Skills are organized into bucket folders under `skills/`:

- `engineering/` — daily code work
- `productivity/` — daily non-code workflow tools
- `misc/` — kept around but rarely used
- `personal/` — tied to my own setup, not promoted
- `in-progress/` — drafts not yet ready to ship
- `deprecated/` — no longer used

Every skill in `engineering/` or `productivity/` must have a reference in the top-level `README.md`, an entry in `.claude-plugin/plugin.json` (the install-everything bundle), and a plugin entry in `.claude-plugin/marketplace.json` (the per-skill native install). `misc/` skills are referenced in the top-level `README.md` and their bucket `README.md` but are NOT packaged in `plugin.json` or `marketplace.json` — they are for working on this repo, not general use. Skills in `personal/`, `in-progress/`, and `deprecated/` must not appear in any of them.

In `marketplace.json`, each skill is its own plugin named `mp-<skill>` with `"source": "./"`, `"strict": false`, and a `skills` array pointing at the skill's directory. Skills whose `SKILL.md` invokes another skill via `/name` must declare that skill's plugin in `dependencies` so it is auto-installed. The core-workflow skills that share the issue-tracker and `CONTEXT.md` config `setup-matt-pocock-skills` creates (`setup-matt-pocock-skills`, `triage`, `to-issues`, `to-prd`, `ask-matt`, `grill-with-docs`) ship together in the single `mp-workflow` plugin rather than as separate entries.

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`. Bucket `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**.

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true`, reachable only by the human) or model-invoked (model- or user-reachable). For the full definitions, description conventions, and why a user-invoked skill can invoke model-invoked skills but never another user-invoked one, see [docs/invocation.md](./docs/invocation.md).
