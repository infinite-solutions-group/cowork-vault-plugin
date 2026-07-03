// Dependency-free validation of the marketplace + its plugins. Runs in CI as a
// required status check so a broken catalog never reaches the default branch
// (which is what users install from). Mirrors the essentials of
// `claude plugin validate`, without needing the CLI or network in CI.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const fail = (msg) => errors.push(msg)

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (err) {
    fail(`${path}: not valid JSON — ${err.message}`)
    return null
  }
}

// --- marketplace.json ---
const marketPath = join(root, '.claude-plugin', 'marketplace.json')
if (!existsSync(marketPath)) fail('.claude-plugin/marketplace.json is missing')
const market = existsSync(marketPath) ? readJson(marketPath) : null

if (market) {
  if (typeof market.name !== 'string' || !/^[a-z0-9-]+$/.test(market.name)) {
    fail('marketplace.name must be a kebab-case string')
  }
  if (!Array.isArray(market.plugins) || market.plugins.length === 0) {
    fail('marketplace.plugins must be a non-empty array')
  }

  for (const entry of market.plugins ?? []) {
    if (!entry?.name) fail('a plugin entry is missing "name"')
    if (typeof entry?.source !== 'string' || !entry.source.startsWith('./')) {
      fail(`plugin "${entry?.name}": source must be a relative path starting with "./"`)
      continue
    }
    const pluginDir = join(root, entry.source)
    const manifestPath = join(pluginDir, '.claude-plugin', 'plugin.json')
    if (!existsSync(manifestPath)) {
      fail(`plugin "${entry.name}": no .claude-plugin/plugin.json at ${entry.source}`)
      continue
    }
    const manifest = readJson(manifestPath)
    if (manifest && manifest.name !== entry.name) {
      fail(`plugin "${entry.name}": plugin.json name is "${manifest.name}" (must match the marketplace entry)`)
    }
    // At least one SKILL.md somewhere under the plugin.
    if (!hasSkill(pluginDir)) {
      fail(`plugin "${entry.name}": no SKILL.md found under ${entry.source}`)
    }
  }
}

function hasSkill(dir) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    if (statSync(abs).isDirectory()) {
      if (hasSkill(abs)) return true
    } else if (name === 'SKILL.md') {
      return true
    }
  }
  return false
}

if (errors.length) {
  console.error('✖ Validation failed:')
  for (const e of errors) console.error(`  - ${e}`)
  process.exit(1)
}
console.log('✔ Marketplace and plugins valid')
