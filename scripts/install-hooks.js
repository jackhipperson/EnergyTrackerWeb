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

const prePushHook = `#!/bin/sh
# Security check — runs before every git push
node "$(git rev-parse --show-toplevel)/.claude/scripts/security-check.js"
`

const hookPath = path.join(HOOKS_DIR, 'pre-push')
writeFileSync(hookPath, prePushHook)

try {
  chmodSync(hookPath, 0o755)
} catch {
  // Windows — chmod not needed
}

console.log('[hooks] pre-push security hook installed.')
