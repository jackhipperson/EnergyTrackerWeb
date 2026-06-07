#!/usr/bin/env node
/**
 * Security agent — runs as a git pre-push hook.
 * Uses the Claude API to scan staged changes for secrets, hardcoded credentials,
 * and common security weaknesses before code reaches GitHub.
 *
 * Exit 0 = safe to push. Exit 1 = blocked (issues found).
 */

const { execSync } = require('child_process')
const { readFileSync, existsSync } = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')

const ROOT = path.resolve(__dirname, '..', '..')

const SKIP_PATTERNS = [
  'node_modules/',
  'package-lock.json',
  '.next/',
  '*.png',
  '*.ico',
  '*.svg',
  '*.jpg',
  '*.woff',
]

function getChangedFiles() {
  try {
    // Files changed vs the remote (what will actually be pushed)
    const result = execSync('git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1...HEAD 2>/dev/null || git ls-files', {
      encoding: 'utf8',
      cwd: ROOT,
    }).trim()
    return result.split('\n').filter(f => {
      if (!f) return false
      return !SKIP_PATTERNS.some(p => {
        if (p.startsWith('*')) return f.endsWith(p.slice(1))
        return f.includes(p)
      })
    })
  } catch {
    return []
  }
}

function readFiles(files) {
  const contents = []
  for (const file of files) {
    const fullPath = path.join(ROOT, file)
    if (!existsSync(fullPath)) continue
    try {
      const content = readFileSync(fullPath, 'utf8')
      // Skip binary-looking files and very large files
      if (content.includes('\0') || content.length > 50_000) continue
      contents.push(`=== ${file} ===\n${content}`)
    } catch {
      // Skip unreadable files
    }
  }
  return contents.join('\n\n')
}

async function runSecurityCheck() {
  const changedFiles = getChangedFiles()
  if (changedFiles.length === 0) {
    console.log('[security] No files to scan.')
    process.exit(0)
  }

  console.log(`[security] Scanning ${changedFiles.length} file(s) with Claude…`)

  const fileContents = readFiles(changedFiles)
  if (!fileContents) {
    console.log('[security] Nothing to scan.')
    process.exit(0)
  }

  const client = new Anthropic()

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    system: `You are a security expert performing a pre-push security review.
Scan the provided code for:
1. Hardcoded secrets, API keys, passwords, tokens, or credentials
2. Sensitive personal data (emails, phone numbers, private keys)
3. Environment variables being logged or exposed
4. Common web vulnerabilities: XSS, SQL injection, CSRF, open redirects
5. Insecure dependencies or imports
6. Supabase RLS being disabled or bypassed
7. Auth checks being skipped

Respond in this exact format:

VERDICT: PASS or FAIL

ISSUES:
- [file:line if known] Description of issue (only if FAIL)

SUMMARY:
One sentence explaining the verdict.

If no issues found, respond with VERDICT: PASS, ISSUES: none, and a brief SUMMARY.`,
    messages: [
      {
        role: 'user',
        content: `Review these files before they are pushed to GitHub:\n\n${fileContents}`,
      },
    ],
  })

  const text = response.content.find(b => b.type === 'text')?.text ?? ''
  console.log('\n' + text + '\n')

  if (text.includes('VERDICT: FAIL')) {
    console.error('[security] Push blocked. Fix the issues above before pushing.')
    process.exit(1)
  }

  console.log('[security] All clear. Proceeding with push.')
  process.exit(0)
}

runSecurityCheck().catch(err => {
  // If the API is unavailable, warn but don't block the push
  console.warn('[security] Warning: security check could not run:', err.message)
  console.warn('[security] Proceeding without security scan.')
  process.exit(0)
})
