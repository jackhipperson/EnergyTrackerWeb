#!/usr/bin/env node
/**
 * Pre-push security scanner — pattern-based, no API key required.
 * Blocks pushes that contain secrets, credentials, or common vulnerabilities.
 * Exit 0 = safe. Exit 1 = blocked.
 */

const { execSync } = require('child_process')
const { readFileSync, existsSync } = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..', '..')

// ─── Secret patterns ──────────────────────────────────────────────────────────
const SECRET_PATTERNS = [
  { name: 'Generic API key assignment',   re: /(['"]?api[_-]?key['"]?\s*[:=]\s*['"])[a-zA-Z0-9_\-]{16,}/i },
  { name: 'Generic secret assignment',    re: /(['"]?secret['"]?\s*[:=]\s*['"])[a-zA-Z0-9_\-]{16,}/i },
  { name: 'Generic password assignment',  re: /(['"]?password['"]?\s*[:=]\s*['"])[^\s'"]{8,}/i },
  { name: 'Generic token assignment',     re: /(['"]?token['"]?\s*[:=]\s*['"])[a-zA-Z0-9_\-\.]{16,}/i },
  { name: 'Anthropic API key',            re: /sk-ant-[a-zA-Z0-9\-_]{20,}/ },
  { name: 'OpenAI API key',               re: /sk-[a-zA-Z0-9]{32,}/ },
  { name: 'AWS access key',               re: /AKIA[0-9A-Z]{16}/ },
  { name: 'AWS secret key',               re: /aws[_\-]?secret[_\-]?access[_\-]?key\s*=\s*[^\s]+/i },
  { name: 'GitHub token',                 re: /ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9_]{82}/ },
  { name: 'Supabase service role key',    re: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+/ },
  { name: 'Private key block',            re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Connection string with creds', re: /:\/\/[^@\s]+:[^@\s]+@/ },
  { name: 'Hardcoded Supabase URL + key', re: /supabase\.co.{0,200}eyJ/s },
]

// ─── Dangerous code patterns ──────────────────────────────────────────────────
const CODE_PATTERNS = [
  { name: 'dangerouslySetInnerHTML with variable', re: /dangerouslySetInnerHTML=\{\{__html:\s*[^'"]\S/ },
  { name: 'eval() with variable',                  re: /\beval\s*\([^'"]\S/ },
  { name: 'SQL string concatenation',              re: /['"`]\s*SELECT\s.+\+\s*(?:req|params|query|body|input)/i },
  { name: 'console.log with env var',              re: /console\.log\s*\(.*process\.env/i },
  { name: 'process.env logged or exposed',         re: /res\.(send|json)\s*\(.*process\.env/i },
  { name: 'RLS disabled in migration',             re: /DISABLE ROW LEVEL SECURITY/i },
  { name: 'Auth bypass comment',                   re: /\/\/.*(?:skip|bypass|disable|todo).{0,30}auth/i },
]

// ─── Files that should never be committed ─────────────────────────────────────
const FORBIDDEN_FILES = [
  { pattern: /\.env$/, name: '.env file' },
  { pattern: /\.env\.local$/, name: '.env.local file' },
  { pattern: /\.env\.production$/, name: '.env.production file' },
  { pattern: /\.pem$/, name: 'PEM certificate/key file' },
  { pattern: /\.p12$/, name: 'PKCS12 keystore file' },
  { pattern: /id_rsa$/, name: 'RSA private key file' },
]

// ─── Files to skip ────────────────────────────────────────────────────────────
const SKIP_PATTERNS = [
  'node_modules/',
  'package-lock.json',
  '.next/',
  '.git/',
  'security-check.js', // don't scan ourselves
]

const SKIP_EXTENSIONS = ['.png', '.ico', '.svg', '.jpg', '.jpeg', '.woff', '.woff2', '.ttf', '.eot', '.gif', '.webp']

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getChangedFiles() {
  try {
    const cmds = [
      'git diff --name-only origin/main...HEAD',
      'git diff --name-only HEAD~1...HEAD',
      'git ls-files --others --exclude-standard',
    ]
    for (const cmd of cmds) {
      try {
        const result = execSync(cmd, { encoding: 'utf8', cwd: ROOT, stdio: ['pipe', 'pipe', 'pipe'] }).trim()
        if (result) return result.split('\n').filter(Boolean)
      } catch { /* try next */ }
    }
    return []
  } catch {
    return []
  }
}

function shouldSkip(file) {
  if (SKIP_PATTERNS.some(p => file.includes(p))) return true
  if (SKIP_EXTENSIONS.some(e => file.endsWith(e))) return true
  return false
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function scan() {
  const allFiles = getChangedFiles()
  const files = allFiles.filter(f => !shouldSkip(f))

  if (files.length === 0) {
    console.log('[security] Nothing to scan.')
    return []
  }

  console.log(`[security] Scanning ${files.length} file(s)…`)

  const issues = []

  for (const file of files) {
    // Check forbidden filenames
    for (const { pattern, name } of FORBIDDEN_FILES) {
      if (pattern.test(file)) {
        issues.push({ file, line: null, type: 'FORBIDDEN FILE', detail: name })
      }
    }

    const fullPath = path.join(ROOT, file)
    if (!existsSync(fullPath)) continue

    let content
    try {
      content = readFileSync(fullPath, 'utf8')
    } catch { continue }

    if (content.includes('\0')) continue // binary

    const lines = content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineNum = i + 1

      // Skip commented-out lines and example/placeholder values
      const trimmed = line.trim()
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) continue
      if (/your[-_]|example|placeholder|<.*>/i.test(line)) continue
      if (/process\.env\./i.test(line)) continue // env var references are fine

      for (const { name, re } of SECRET_PATTERNS) {
        if (re.test(line)) {
          issues.push({ file, line: lineNum, type: 'SECRET', detail: name })
        }
      }

      for (const { name, re } of CODE_PATTERNS) {
        if (re.test(line)) {
          issues.push({ file, line: lineNum, type: 'VULNERABILITY', detail: name })
        }
      }
    }
  }

  return issues
}

const issues = scan()

if (issues.length === 0) {
  console.log('[security] ✓ No issues found. Safe to push.')
  process.exit(0)
}

console.error('\n[security] ✗ Push blocked — issues found:\n')
for (const { file, line, type, detail } of issues) {
  const loc = line ? `${file}:${line}` : file
  console.error(`  [${type}] ${loc} — ${detail}`)
}
console.error('\nFix the issues above and try again.\n')
process.exit(1)
