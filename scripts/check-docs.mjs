#!/usr/bin/env node
/**
 * Read-only structural validator for foundation-md (--mode=template | --mode=project).
 * Zero external dependencies; executes no commands or network requests.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const modeArg = args.find((a) => a.startsWith('--mode='));
const rootArg = args.find((a) => a.startsWith('--root='));
const mode = modeArg ? modeArg.split('=')[1] : 'template';
const root = path.resolve(rootArg ? rootArg.split('=')[1] : process.cwd());

if (mode !== 'template' && mode !== 'project') {
  console.error(`Invalid --mode=${mode}. Use --mode=template or --mode=project.`);
  process.exit(2);
}

const IGNORE_DIRS = new Set(['.git', 'node_modules']);
const TEMPLATE_ONLY = new Set(['README.md', 'CUSTOMIZING.md', 'implementation_plan.md', 'tests/template-cases.md']);
const findings = [];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) out.push(full);
  }
  return out;
}

function slugify(heading) {
  return heading
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

const mdFiles = walk(root);
const anchorsByFile = new Map();

for (const file of mdFiles) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  const slugs = new Set();
  let inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = /^#{1,6}\s+(.+?)\s*$/.exec(line);
    if (m) slugs.add(slugify(m[1]));
  }
  anchorsByFile.set(file, slugs);
}

for (const file of mdFiles) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (mode === 'project' && TEMPLATE_ONLY.has(rel)) continue;
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  let inFence = false;
  let fenceStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNo = i + 1;
    if (/^\s*```/.test(line)) {
      if (!inFence) fenceStart = lineNo;
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    // 1. Relative markdown links & local anchors
    const stripped = line.replace(/`[^`]*`/g, '');
    const linkRe = /!?\[[^\]]*\]\(([^)]+)\)/g;
    for (const m of stripped.matchAll(linkRe)) {
      const raw = m[1].trim().split(/\s+/)[0];
      if (/^(https?:|mailto:|tel:)/i.test(raw)) continue;
      const [targetPath, anchor] = raw.split('#');
      const resolved = targetPath ? path.resolve(path.dirname(file), targetPath) : file;
      if (!fs.existsSync(resolved)) {
        findings.push(`${rel}:${lineNo} [BROKEN_LINK] Target missing: ${raw}`);
        continue;
      }
      if (anchor && resolved.endsWith('.md')) {
        const anchors = anchorsByFile.get(resolved);
        if (anchors && !anchors.has(anchor.toLowerCase())) {
          findings.push(`${rel}:${lineNo} [BROKEN_ANCHOR] Heading #${anchor} not found in ${path.relative(root, resolved).replace(/\\/g, '/')}`);
        }
      }
    }

    // 2. Secret placeholder anti-pattern
    if (/\[DEMO_PASSWORD\]/.test(line)) {
      findings.push(`${rel}:${lineNo} [SECRET_PLACEHOLDER] Remove [DEMO_PASSWORD]; reference seed script or env var instead.`);
    }

    // 3. Mode-specific checks (skip template-only docs in template check)
    if (mode === 'template' && !TEMPLATE_ONLY.has(rel)) {
      const isVocabLine = /Status|legend|Mark|Vocabulary|grounding\.md/i.test(line);
      if (!isVocabLine && /✅\s*\[[A-Z0-9_]+\]|\[[A-Z0-9_]+\]\s*✅(?!\s*\/)/.test(line)) {
        findings.push(`${rel}:${lineNo} [PRESET_CHECKMARK] Do not attach ✅ directly to placeholder capability.`);
      }
    }

    if (mode === 'project') {
      if (/\b(CUSTOMIZING\.md|tests\/template-cases\.md)\b/.test(stripped)) {
        findings.push(`${rel}:${lineNo} [TEMPLATE_LINK] Project copy should not require template-only files.`);
      }
      const noLinks = stripped.replace(/!?\[[^\]]*\]\([^)]+\)/g, '');
      const tokens = noLinks.match(/\[[A-Z][A-Z0-9_]{2,}\]/g);
      if (tokens) {
        findings.push(`${rel}:${lineNo} [UNFILLED_TOKEN] Unresolved placeholder(s): ${tokens.join(', ')}`);
      }
    }
  }

  if (inFence) {
    findings.push(`${rel}:${fenceStart} [UNCLOSED_FENCE] Code fence opened here is never closed.`);
  }
}

if (findings.length > 0) {
  for (const f of findings) console.error(f);
  console.error(`\nFailed (${mode} mode): ${findings.length} finding(s) across ${mdFiles.length} file(s).`);
  process.exit(1);
}

console.log(`OK (${mode} mode): ${mdFiles.length} markdown file(s) checked, 0 findings.`);
