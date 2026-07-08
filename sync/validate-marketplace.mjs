#!/usr/bin/env node
// Validates this fork's .claude-plugin/marketplace.json against the invariants
// documented in CLAUDE.md. Run: `node sync/validate-marketplace.mjs`
// Exits non-zero on any error; warnings do not fail the run.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function readJson(rel) {
  return JSON.parse(readFileSync(join(repoRoot, rel), 'utf8'))
}

/** Strip a leading "./" and any trailing slashes so paths compare cleanly. */
function norm(p) {
  return p.replace(/^\.\//, '').replace(/\/+$/, '')
}

/** Resolve a marketplace plugin's (source, skill) pair to a repo-relative dir. */
function resolveSkill(source, skill) {
  const s = norm(source)
  const k = norm(skill)
  return k === '' ? s : `${s}/${k}`
}

const errors = []
const warnings = []

const plugin = readJson('.claude-plugin/plugin.json')
const marketplace = readJson('.claude-plugin/marketplace.json')

// Source of truth — the promoted skills Matt lists in the README Reference (his
// curated, human-facing set). The marketplace must cover all of THESE. It may
// additionally cover a skill that is NOT in the README when a covered skill
// hard-routes to it (see `referralClosure` below); everything else in the fuller
// plugin.json bundle is deliberately excluded (see the plugin.json check below).
const readmeText = readFileSync(join(repoRoot, 'README.md'), 'utf8')
const readmeSkills = new Set()
const linkRe = /\.\/skills\/(engineering|productivity)\/([a-z0-9-]+)\/SKILL\.md/g
for (const m of readmeText.matchAll(linkRe)) {
  readmeSkills.add(`skills/${m[1]}/${m[2]}`)
}

// Reference — the skills upstream marks public in the install-everything bundle.
const bundleSkills = new Set(plugin.skills.map(norm))

// Referral closure — skills the marketplace carries even though they are NOT in
// the README Reference, because a covered skill hard-routes to them, so a user
// who installs that covered skill needs them present. Each entry maps the
// included skill to the referrer whose SKILL.md points at it; the check below
// fails if that referrer stops referencing it, so a stale exception can't linger.
// Currently just `implement`: ask-matt presents /implement as the central build
// step, so anyone on the mp-workflow path needs it installed.
const referralClosure = new Map([
  ['skills/engineering/implement', 'skills/engineering/ask-matt'],
])

// The skills the marketplace covers, tracking which plugin claims each.
const covered = new Map()

for (const p of marketplace.plugins) {
  if (p.strict !== false) {
    errors.push(`plugin "${p.name}": "strict" must be false (got ${JSON.stringify(p.strict)})`)
  }
  if (norm(p.source) === '') {
    errors.push(`plugin "${p.name}": "source" must point at a skill dir or bucket, never the repo root ("./")`)
  }

  const skillsList = Array.isArray(p.skills) ? p.skills : []
  if (skillsList.length === 0) {
    errors.push(`plugin "${p.name}": "skills" must list at least one entry`)
  }
  for (const sk of skillsList) {
    const path = resolveSkill(p.source, sk)
    if (!existsSync(join(repoRoot, path, 'SKILL.md'))) {
      errors.push(`plugin "${p.name}": ${path}/SKILL.md does not exist`)
    }
    if (covered.has(path)) {
      errors.push(`skill ${path} is claimed by more than one plugin: "${covered.get(path)}" and "${p.name}"`)
    } else {
      covered.set(path, p.name)
    }
  }

  const deps = Array.isArray(p.dependencies) ? p.dependencies : []
  for (const d of deps) {
    const defined = marketplace.plugins.some((q) => q.name === d.name)
    if (!defined) {
      errors.push(`plugin "${p.name}": dependency "${d.name}" is not a plugin defined in marketplace.json`)
    }
  }

  if (p.name.startsWith('mp-lib-')) {
    const desc = p.description
    const opensRight = typeof desc === 'string' && desc.startsWith('Internal dependency')
    if (!opensRight) {
      warnings.push(`plugin "${p.name}": an mp-lib- plugin's description should open with "Internal dependency — …"`)
    }
  }
}

// MUST — every README Reference skill is covered by exactly one plugin.
for (const s of readmeSkills) {
  if (!covered.has(s)) {
    errors.push(`skill ${s} is in the README Reference but no marketplace plugin covers it`)
  }
}

// MUST — every covered skill is either in the README Reference or a justified
// referral-closure exception, and each exception's referrer still points at it.
for (const s of covered.keys()) {
  if (readmeSkills.has(s)) {
    continue
  }
  const referrer = referralClosure.get(s)
  if (referrer === undefined) {
    errors.push(
      `skill ${s} is covered by marketplace plugin "${covered.get(s)}" but is not in the README Reference and has no referral-closure justification`,
    )
    continue
  }
  const skillName = s.slice(s.lastIndexOf('/') + 1)
  const referrerSkillPath = join(repoRoot, referrer, 'SKILL.md')
  const referrerText = existsSync(referrerSkillPath) ? readFileSync(referrerSkillPath, 'utf8') : ''
  if (!referrerText.includes(`/${skillName}`)) {
    errors.push(
      `skill ${s} is included via referral closure from ${referrer}, but ${referrer}/SKILL.md no longer references /${skillName} — remove the exception or drop the plugin`,
    )
  }
}

// INFO — skills upstream bundles in plugin.json that the marketplace does not
// carry. These are Matt's bundle-only skills (documented or not, but not in his
// curated README Reference); we exclude them on purpose. Surfaced each sync so
// each exclusion stays a conscious call rather than silent drift.
for (const s of bundleSkills) {
  if (!covered.has(s)) {
    warnings.push(`skill ${s} is in upstream's plugin.json bundle but excluded from the marketplace (not in the README Reference) — confirm this is still intended`)
  }
}

for (const w of warnings) {
  console.warn(`WARN  ${w}`)
}
if (errors.length > 0) {
  for (const e of errors) {
    console.error(`FAIL  ${e}`)
  }
  console.error(`\nmarketplace validation FAILED: ${errors.length} error(s), ${warnings.length} warning(s)`)
  process.exit(1)
}
console.log(
  `OK  marketplace valid — ${marketplace.plugins.length} plugins cover ${covered.size} skills; ` +
    `covers the README Reference (${readmeSkills.size} skills) plus ${referralClosure.size} referral-closure skill(s)` +
    (warnings.length > 0 ? `; ${warnings.length} warning(s)` : '') +
    '.',
)
