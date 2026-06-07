#!/usr/bin/env node
/**
 * Stop hook: inspects recent git changes and patches README.md using the Claude API.
 */

const { execSync } = require('child_process')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const path = require('path')
const Anthropic = require('@anthropic-ai/sdk')

const ROOT = path.resolve(__dirname, '..', '..')
const README_PATH = path.join(ROOT, 'README.md')
const CLAUDE_MD_PATH = path.join(ROOT, 'CLAUDE.md')

function getRecentChanges() {
  try {
    const staged = execSync('git diff --cached --name-only', { encoding: 'utf8', cwd: ROOT }).trim()
    const unstaged = execSync('git diff --name-only', { encoding: 'utf8', cwd: ROOT }).trim()
    const untracked = execSync('git ls-files --others --exclude-standard', { encoding: 'utf8', cwd: ROOT }).trim()
    const all = [staged, unstaged, untracked].join('\n').split('\n').filter(Boolean)
    return [...new Set(all)]
  } catch {
    return []
  }
}

function shouldUpdate(changedFiles) {
  return changedFiles.some(f => !f.startsWith('.claude/') && !f.endsWith('.md') && !f.startsWith('node_modules/'))
}

async function updateReadme() {
  const changedFiles = getRecentChanges()
  if (!shouldUpdate(changedFiles)) return

  const readme = existsSync(README_PATH) ? readFileSync(README_PATH, 'utf8') : ''
  const claudeMd = existsSync(CLAUDE_MD_PATH) ? readFileSync(CLAUDE_MD_PATH, 'utf8') : ''

  const client = new Anthropic()

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 4096,
    system: `You are a README updater for a Next.js energy tracking PWA.
Update ONLY the sections of README.md that are affected by the recently changed files.
Return the COMPLETE updated README.md — not just the changed sections. Be concise.`,
    messages: [
      {
        role: 'user',
        content: `Recently changed files:\n${changedFiles.join('\n')}\n\nCurrent README.md:\n\`\`\`markdown\n${readme}\n\`\`\`\n\nProject context (CLAUDE.md excerpt):\n\`\`\`markdown\n${claudeMd.slice(0, 3000)}\n\`\`\`\n\nReturn the updated README.md. If nothing needs changing, return the README unchanged.`,
      },
    ],
  })

  const updated = response.content.find(b => b.type === 'text')?.text
  if (updated && updated !== readme) {
    writeFileSync(README_PATH, updated, 'utf8')
    console.log('[update-readme] README.md updated')
  }
}

updateReadme().catch(err => {
  console.error('[update-readme] Error:', err.message)
})
