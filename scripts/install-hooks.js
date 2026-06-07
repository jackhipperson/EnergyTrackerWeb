#!/usr/bin/env node
/**
 * Installs git hooks for this project.
 * Run once after cloning: npm run prepare
 */

const { writeFileSync, chmodSync, existsSync, mkdirSync } = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const HOOKS_DIR = path.join(ROOT, '.git', 'hooks')

if (!existsSync(path.join(ROOT, '.git'))) {
  console.log('[hooks] Not a git repo — skipping hook installation.')
  process.exit(0)
}

if (!existsSync(HOOKS_DIR)) {
  mkdirSync(HOOKS_DIR, { recursive: true })
}

const preCommitHook = `#!/bin/sh
# README updater — updates README.md based on staged changes, then stages it
node "$(git rev-parse --show-toplevel)/.claude/scripts/update-readme.js"
`

const prePushHook = `#!/bin/sh
# Security check — runs before every git push
node "$(git rev-parse --show-toplevel)/.claude/scripts/security-check.js"
`

const preCommitPath = path.join(HOOKS_DIR, 'pre-commit')
writeFileSync(preCommitPath, preCommitHook)
try { chmodSync(preCommitPath, 0o755) } catch { /* Windows */ }
console.log('[hooks] pre-commit README hook installed.')

const hookPath = path.join(HOOKS_DIR, 'pre-push')
writeFileSync(hookPath, prePushHook)
try { chmodSync(hookPath, 0o755) } catch { /* Windows */ }
console.log('[hooks] pre-push security hook installed.')
